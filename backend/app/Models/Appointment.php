<?php

namespace App\Models;

use App\Services\LoyaltyService;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'customer_id', 'shop_id', 'staff_id', 'service_id', 'starts_at', 'ends_at', 'status', 'total_price', 'note',
    'cancellation_reason', 'cancelled_by_user_id', 'cancelled_at', 'base_price', 'discount_amount', 'coupon_id',
    'loyalty_reward_id',
])]
class Appointment extends Model
{
    protected static function booted(): void
    {
        static::saved(function (Appointment $appointment): void {
            if (! $appointment->wasRecentlyCreated && ! $appointment->wasChanged('status')) {
                return;
            }

            if (in_array($appointment->status, ['completed', 'cancelled', 'cancelled_by_shop'], true)) {
                app(LoyaltyService::class)->handleAppointmentStatusChange($appointment);
            }
        });
    }

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'total_price' => 'integer',
            'base_price' => 'integer',
            'discount_amount' => 'integer',
            'loyalty_reward_id' => 'integer',
        ];
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function cancelledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by_user_id');
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(ShopStaff::class, 'staff_id');
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(ShopService::class, 'service_id');
    }

    public function review(): HasOne
    {
        return $this->hasOne(StaffReview::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(AppointmentPayment::class);
    }

    public function services(): BelongsToMany
    {
        return $this->belongsToMany(ShopService::class, 'appointment_services', 'appointment_id', 'service_id')
            ->withPivot(['service_name', 'duration_minutes', 'price', 'sort_order'])
            ->withTimestamps()
            ->orderByPivot('sort_order');
    }

    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }

    public function loyaltyReward(): BelongsTo
    {
        return $this->belongsTo(LoyaltyReward::class);
    }
}
