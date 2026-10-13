<?php

namespace App\Services;

use App\Models\ShopStaff;
use App\Models\StaffReview;
use Illuminate\Support\Facades\DB;

class StaffHighScoreService
{
    private const RATING_MULTIPLIER = 20;

    private const PHOTO_REVIEW_BONUS = 15;

    private const REVIEW_BONUS = 5;

    public function recalculate(ShopStaff $staff): void
    {
        DB::transaction(function () use ($staff): void {
            $lockedStaff = ShopStaff::query()->whereKey($staff->getKey())->lockForUpdate()->firstOrFail();
            $stats = StaffReview::query()
                ->where('staff_id', $lockedStaff->id)
                ->where('moderation_status', 'approved')
                ->selectRaw('COUNT(*) as review_count, AVG(rating) as average_rating, COUNT(photo_path) as photo_review_count')
                ->first();

            $reviewCount = (int) $stats->review_count;
            $photoReviewCount = (int) $stats->photo_review_count;
            $highScore = ((float) $stats->average_rating * self::RATING_MULTIPLIER)
                + ($photoReviewCount * self::PHOTO_REVIEW_BONUS)
                + ($reviewCount * self::REVIEW_BONUS);

            $lockedStaff->update([
                'high_score' => round($highScore, 2),
                'total_photo_reviews' => $photoReviewCount,
            ]);
        });
    }
}
