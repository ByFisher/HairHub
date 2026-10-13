<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sliders', function (Blueprint $table): void {
            $table->enum('target_gender', ['male', 'female', 'unisex'])->default('unisex')->index();
        });
    }

    public function down(): void
    {
        Schema::table('sliders', function (Blueprint $table): void {
            $table->dropIndex(['target_gender']);
            $table->dropColumn('target_gender');
        });
    }
};
