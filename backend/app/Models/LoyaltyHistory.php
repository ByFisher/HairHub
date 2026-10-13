<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_loyalty_id', 'user_id', 'appointment_id', 'spent_amount', 'stars_earned'])]
class LoyaltyHistory extends Model
{
    protected function casts(): array
    {
        return [
            'spent_amount' => 'integer',
            'stars_earned' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function loyalty(): BelongsTo
    {
        return $this->belongsTo(UserLoyalty::class, 'user_loyalty_id');
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }
}
