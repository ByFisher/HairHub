<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserLoyalty;
use Illuminate\Http\Request;

class LoyaltyController extends Controller
{
    public function summary(Request $request)
    {
        $loyalty = UserLoyalty::query()->where('user_id', $request->user()->id)->first();
        $rewards = $loyalty
            ? $loyalty->rewards()->where('status', 'available')->orderBy('id')->get()
            : collect();

        return response()->json([
            'starCount' => $loyalty?->star_count ?? 0,
            'accumulatedAmount' => $loyalty?->accumulated_amount ?? 0,
            'availableRewards' => $rewards->map(fn ($reward) => [
                'id' => (string) $reward->id,
                'amountLimit' => $reward->amount_limit,
            ])->values(),
        ]);
    }
}
