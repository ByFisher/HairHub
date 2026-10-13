<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\LoyaltyHistory;
use App\Models\LoyaltyReward;
use App\Models\UserLoyalty;
use Illuminate\Support\Facades\DB;

class LoyaltyService
{
    public function handleAppointmentStatusChange(Appointment $appointment): void
    {
        if ($appointment->status === 'completed') {
            $this->awardForCompletedAppointment($appointment);
        } elseif (in_array($appointment->status, ['cancelled', 'cancelled_by_shop'], true)) {
            $this->releaseReservedReward($appointment);
        }
    }

    private function awardForCompletedAppointment(Appointment $appointment): void
    {
        DB::transaction(function () use ($appointment): void {
            $lockedAppointment = Appointment::query()->whereKey($appointment->id)->lockForUpdate()->firstOrFail();
            if ($lockedAppointment->status !== 'completed') {
                return;
            }

            DB::table('user_loyalties')->insertOrIgnore([
                'user_id' => $lockedAppointment->customer_id,
                'star_count' => 0,
                'accumulated_amount' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $loyalty = UserLoyalty::query()
                ->where('user_id', $lockedAppointment->customer_id)
                ->lockForUpdate()
                ->firstOrFail();

            if (LoyaltyHistory::query()->where('appointment_id', $lockedAppointment->id)->exists()) {
                return;
            }

            $loyalty->histories()->create([
                'user_id' => $lockedAppointment->customer_id,
                'appointment_id' => $lockedAppointment->id,
                'spent_amount' => $lockedAppointment->total_price,
                'stars_earned' => 1,
            ]);

            $starCount = $loyalty->star_count + 1;
            $accumulatedAmount = $loyalty->accumulated_amount + $lockedAppointment->total_price;

            if ($starCount === 10) {
                $loyalty->rewards()->create([
                    'user_id' => $lockedAppointment->customer_id,
                    'amount_limit' => intdiv($accumulatedAmount, 10),
                    'status' => 'available',
                ]);
                $loyalty->update([
                    'star_count' => 0,
                    'accumulated_amount' => 0,
                ]);
            } else {
                $loyalty->update([
                    'star_count' => $starCount,
                    'accumulated_amount' => $accumulatedAmount,
                ]);
            }

            LoyaltyReward::query()
                ->where('appointment_id', $lockedAppointment->id)
                ->where('status', 'reserved')
                ->update([
                    'status' => 'redeemed',
                    'redeemed_at' => now(),
                    'updated_at' => now(),
                ]);
        }, attempts: 3);
    }

    private function releaseReservedReward(Appointment $appointment): void
    {
        DB::transaction(function () use ($appointment): void {
            LoyaltyReward::query()
                ->where('appointment_id', $appointment->id)
                ->where('status', 'reserved')
                ->lockForUpdate()
                ->first()
                ?->update([
                    'status' => 'available',
                    'appointment_id' => null,
                    'reserved_at' => null,
                ]);
        }, attempts: 3);
    }
}
