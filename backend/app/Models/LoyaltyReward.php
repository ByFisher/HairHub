<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_loyalty_id', 'user_id', 'amount_limit', 'status', 'appointment_id', 'reserved_at', 'redeemed_at',
])]
class LoyaltyReward extends Model
{
    protected function casts(): array
    {
        return [
            'amount_limit' => 'integer',
            'reserved_at' => 'datetime',
            'redeemed_at' => 'datetime',
        ];
    }

    public function loyalty(): BelongsTo
    {
        return $this->belongsTo(UserLoyalty::class, 'user_loyalty_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }
}
