<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_loyalties', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('star_count')->default(0);
            $table->unsignedBigInteger('accumulated_amount')->default(0);
            $table->timestamps();
        });

        Schema::create('loyalty_rewards', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_loyalty_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('amount_limit');
            $table->string('status', 16)->default('available')->index();
            $table->foreignId('appointment_id')->nullable()->unique()->constrained()->nullOnDelete();
            $table->timestamp('reserved_at')->nullable();
            $table->timestamp('redeemed_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'status']);
        });

        Schema::create('loyalty_histories', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_loyalty_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('appointment_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('spent_amount');
            $table->unsignedTinyInteger('stars_earned')->default(1);
            $table->timestamps();
            $table->index(['user_id', 'created_at']);
        });

        Schema::table('appointments', function (Blueprint $table): void {
            $table->foreignId('loyalty_reward_id')->nullable()->constrained('loyalty_rewards')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('loyalty_reward_id');
        });

        Schema::dropIfExists('loyalty_histories');
        Schema::dropIfExists('loyalty_rewards');
        Schema::dropIfExists('user_loyalties');
    }
};
