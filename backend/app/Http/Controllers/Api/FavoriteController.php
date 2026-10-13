<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shop;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    public function index(Request $request)
    {
        return response()->json($request->user()->favoriteShops()
            ->where('shops.status', 'active')
            ->where('shops.is_approved', true)
            ->orderBy('shops.name')
            ->pluck('shops.id')
            ->map(fn (int $shopId): string => (string) $shopId));
    }

    public function shops(Request $request)
    {
        $shops = $request->user()->favoriteShops()
            ->where('shops.status', 'active')
            ->where('shops.is_approved', true)
            ->with([
                'services' => fn ($query) => $query->where('is_active', true)->orderBy('sort_order'),
                'staff' => fn ($query) => $query->where('approval_status', 'approved')
                    ->withAvg('reviews', 'rating')
                    ->withCount('reviews'),
            ])
            ->orderBy('shops.name')
            ->get();

        return response()->json($shops->map(function (Shop $shop): array {
            $staff = $shop->staff;
            $services = $shop->services;

            return [
                'id' => (string) $shop->id,
                'slug' => $shop->slug,
                'name' => $shop->name,
                'description' => $shop->description,
                'genderType' => $shop->gender_type,
                'status' => $shop->status,
                'isApproved' => $shop->is_approved,
                'coverImageUrl' => $shop->cover_image_url,
                'profileImageUrl' => $shop->profile_image_url,
                'address' => [
                    'district' => [
                        'id' => $shop->district,
                        'name' => $shop->district,
                        'city' => ['id' => $shop->city, 'name' => $shop->city, 'plateCode' => ''],
                    ],
                    'street' => $shop->street,
                    'fullAddress' => trim($shop->street.', '.$shop->district.', '.$shop->city, ', '),
                    'latitude' => $shop->latitude,
                    'longitude' => $shop->longitude,
                ],
                'phone' => $shop->phone ?? '',
                'workingHours' => $shop->working_hours ?? [],
                'averageRating' => (float) $staff->avg('reviews_avg_rating'),
                'reviewCount' => (int) $staff->sum('reviews_count'),
                'minimumServicePrice' => $services->min('price'),
                'services' => $services->map(fn ($service): array => [
                    'id' => (string) $service->id,
                    'shopId' => (string) $service->shop_id,
                    'name' => $service->name,
                    'category' => $service->category,
                    'targetGender' => $service->target_gender,
                    'description' => $service->description,
                    'durationMinutes' => $service->duration_minutes,
                    'price' => $service->price,
                    'isActive' => $service->is_active,
                    'sortOrder' => $service->sort_order,
                ])->values(),
                'commissionRate' => (float) $shop->commission_rate,
                'createdAt' => $shop->created_at->toISOString(),
            ];
        })->values());
    }

    public function store(Request $request, Shop $shop)
    {
        abort_unless($shop->status === 'active' && $shop->is_approved, 404);
        $request->user()->favoriteShops()->syncWithoutDetaching([$shop->id]);

        return response()->json(['shopId' => (string) $shop->id, 'isFavorite' => true]);
    }

    public function destroy(Request $request, Shop $shop)
    {
        $request->user()->favoriteShops()->detach($shop->id);

        return response()->json(['shopId' => (string) $shop->id, 'isFavorite' => false]);
    }
}
