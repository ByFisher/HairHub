<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('staff', function (Blueprint $table) {
            $table->decimal('high_score', 10, 2)->default(0);
            $table->unsignedInteger('total_photo_reviews')->default(0);
        });

        Schema::table('staff_reviews', function (Blueprint $table) {
            $table->string('photo_path')->nullable();
        });

        DB::table('staff')->select('id')->orderBy('id')->chunkById(100, function ($staffMembers): void {
            foreach ($staffMembers as $staff) {
                $stats = DB::table('staff_reviews')
                    ->where('staff_id', $staff->id)
                    ->where('moderation_status', 'approved')
                    ->selectRaw('COUNT(*) as review_count, AVG(rating) as average_rating, COUNT(photo_path) as photo_review_count')
                    ->first();
                $reviewCount = (int) $stats->review_count;
                $photoReviewCount = (int) $stats->photo_review_count;

                DB::table('staff')->where('id', $staff->id)->update([
                    'high_score' => ((float) $stats->average_rating * 20) + ($photoReviewCount * 15) + ($reviewCount * 5),
                    'total_photo_reviews' => $photoReviewCount,
                ]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('staff_reviews', function (Blueprint $table) {
            $table->dropColumn('photo_path');
        });

        Schema::table('staff', function (Blueprint $table) {
            $table->dropColumn(['high_score', 'total_photo_reviews']);
        });
    }
};
