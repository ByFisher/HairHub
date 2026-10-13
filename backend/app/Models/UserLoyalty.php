<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'star_count', 'accumulated_amount'])]
class UserLoyalty extends Model
{
    protected function casts(): array
    {
        return [
            'star_count' => 'integer',
            'accumulated_amount' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function rewards(): HasMany
    {
        return $this->hasMany(LoyaltyReward::class);
    }

    public function histories(): HasMany
    {
        return $this->hasMany(LoyaltyHistory::class);
    }
}
