<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Shop;
use App\Models\ShopContentSubmission;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PortalOverviewController extends Controller
{
    public function admin(): JsonResponse
    {
        return response()->json([
            'customers' => User::query()->where('role', 'customer')->count(),
            'shops' => [
                'total' => Shop::query()->count(),
                'active' => Shop::query()->where('status', 'active')->where('is_approved', true)->count(),
                'pending' => Shop::query()->where('status', 'pending_approval')->count(),
            ],
            'appointments' => [
                'total' => Appointment::query()->count(),
                'upcoming' => Appointment::query()
                    ->whereIn('status', ['pending', 'confirmed'])
                    ->where('starts_at', '>=', now())
                    ->count(),
            ],
            'pendingContent' => ShopContentSubmission::query()
                ->where('approval_status', 'pending_approval')
                ->count(),
        ]);
    }

    public function shop(Request $request): JsonResponse
    {
        $shop = $request->user()->shops()->where('status', 'active')->firstOrFail();

        return response()->json([
            'shopName' => $shop->name,
            'appointments' => [
                'total' => $shop->appointments()->count(),
                'today' => $shop->appointments()->whereDate('starts_at', today())->count(),
                'upcoming' => $shop->appointments()
                    ->whereIn('status', ['pending', 'confirmed'])
                    ->where('starts_at', '>=', now())
                    ->count(),
            ],
            'customers' => $shop->appointments()->distinct('customer_id')->count('customer_id'),
            'staff' => $shop->staff()->where('approval_status', 'approved')->count(),
            'services' => $shop->services()->where('status', 'active')->count(),
        ]);
    }
}
