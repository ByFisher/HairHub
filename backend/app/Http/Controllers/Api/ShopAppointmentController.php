<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Shop;
use App\Services\AppointmentCancellationService;
use App\Services\AppointmentPresenter;
use App\Services\FinancialLedger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ShopAppointmentController extends Controller
{
    public function index(Request $request, AppointmentPresenter $presenter)
    {
        $shop = $this->shop($request);
        $status = $request->string('status')->value();
        abort_if($status !== '' && ! in_array($status, ['pending', 'confirmed', 'completed', 'cancelled', 'cancelled_by_shop', 'no_show'], true), 422, 'Geçersiz randevu durumu.');

        $appointments = $shop->appointments()
            ->with(['shop', 'staff', 'service', 'review', 'payment'])
            ->when(
                $status !== '',
                fn ($query) => $query->where('status', $status),
                fn ($query) => $query->where(function ($active): void {
                    $active->where(function ($upcoming): void {
                        $upcoming->whereIn('status', ['pending', 'confirmed'])
                            ->where('starts_at', '>=', now());
                    })->orWhere(function ($recent): void {
                        $recent->whereIn('status', ['completed', 'cancelled', 'cancelled_by_shop', 'no_show'])
                            ->where('starts_at', '>=', now()->subDays(7));
                    });
                }),
            )
            ->orderByDesc('starts_at')
            ->limit(100)
            ->get();

        return response()->json($appointments->map(fn (Appointment $appointment) => $presenter->present($appointment)));
    }

    public function cancel(
        Request $request,
        Appointment $appointment,
        AppointmentCancellationService $cancellation,
        AppointmentPresenter $presenter,
    ) {
        abort_unless($appointment->shop_id === $this->shop($request)->id, 404);
        $data = $request->validate(['reason' => ['nullable', 'string', 'max:500']]);
        $result = $cancellation->cancel($appointment, $request->user(), $data['reason'] ?? null);
        $response = $presenter->present($result['appointment']);

        if ($result['refundFailed']) {
            return response()->json([
                'message' => 'Randevu iptal edildi ancak iade sağlayıcısı isteği tamamlayamadı. İade aynı kayıt üzerinden tekrar denenebilir.',
                'appointment' => $response,
            ], 502);
        }

        return response()->json($response);
    }

    public function complete(
        Request $request,
        Appointment $appointment,
        FinancialLedger $ledger,
        AppointmentPresenter $presenter,
    ) {
        abort_unless($appointment->shop_id === $this->shop($request)->id, 404);

        $completed = DB::transaction(function () use ($appointment, $ledger): Appointment {
            $locked = Appointment::query()->whereKey($appointment->id)->lockForUpdate()->firstOrFail();
            if ($locked->status === 'completed') {
                return $locked->load(['shop', 'staff', 'service', 'review', 'payment']);
            }

            abort_unless(in_array($locked->status, ['pending', 'confirmed'], true), 409, 'Yalnızca aktif randevular tamamlanabilir.');
            abort_if($locked->ends_at->isFuture(), 409, 'Randevu bitiş saati gelmeden tamamlanamaz.');

            $payment = $locked->payment()->lockForUpdate()->first();
            if ($locked->total_price > 0) {
                abort_unless($payment, 409, 'Randevunun ödemesi bulunamadı.');
                if ($payment->provider === 'offline') {
                    abort_unless(
                        in_array($payment->payment_method, ['cash', 'at_shop_card'], true)
                            && in_array($payment->status, ['pending', 'paid'], true),
                        409,
                        'Bu randevunun çevrimiçi ödemesi tamamlanmadan randevu kapatılamaz.',
                    );
                    if ($payment->status !== 'paid') {
                        $payment->update(['status' => 'paid', 'paid_at' => now(), 'failure_code' => null]);
                        $ledger->recordPayment($payment->refresh());
                    }
                } else {
                    abort_unless($payment->status === 'paid', 409, 'Bu randevunun çevrimiçi ödemesi tamamlanmadan randevu kapatılamaz.');
                }
            } elseif ($payment && $payment->status !== 'paid') {
                $payment->update(['status' => 'paid', 'paid_at' => now(), 'failure_code' => null]);
            }

            $locked->update(['status' => 'completed']);

            return $locked->refresh()->load(['shop', 'staff', 'service', 'review', 'payment']);
        });

        return response()->json($presenter->present($completed));
    }

    private function shop(Request $request): Shop
    {
        return $request->user()->shops()->firstOrFail();
    }
}
