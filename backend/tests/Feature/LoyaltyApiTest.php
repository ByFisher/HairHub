<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\LoyaltyReward;
use App\Models\Shop;
use App\Models\ShopService;
use App\Models\ShopStaff;
use App\Models\User;
use App\Models\UserLoyalty;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class LoyaltyApiTest extends TestCase
{
    use RefreshDatabase;

    private int $userSequence = 0;

    public function test_ten_completed_appointments_create_a_reward_from_the_cycle_average_only_once(): void
    {
        [$customer, $shop, $staff, $service] = $this->customerShopAndService();
        $baseStart = now()->subDays(10);
        $lastAppointment = null;

        for ($index = 0; $index < 10; $index++) {
            $start = $baseStart->copy()->addHours($index);
            $appointment = Appointment::query()->create([
                'customer_id' => $customer->id,
                'shop_id' => $shop->id,
                'staff_id' => $staff->id,
                'service_id' => $service->id,
                'starts_at' => $start,
                'ends_at' => $start->copy()->addMinutes(30),
                'status' => 'pending',
                'base_price' => $index === 9 ? 200 : 100,
                'total_price' => $index === 9 ? 200 : 100,
            ]);
            $appointment->update(['status' => 'completed']);
            $lastAppointment = $appointment;
        }

        $this->assertSame(0, $customer->loyalty()->firstOrFail()->star_count);
        $this->assertSame(0, $customer->loyalty()->firstOrFail()->accumulated_amount);
        $this->assertDatabaseHas('loyalty_rewards', [
            'user_id' => $customer->id,
            'amount_limit' => 110,
            'status' => 'available',
        ]);
        $this->assertDatabaseCount('loyalty_histories', 10);

        $lastAppointment->update(['note' => 'Sonradan eklenen not']);
        $this->assertDatabaseCount('loyalty_histories', 10);
        $this->assertDatabaseCount('loyalty_rewards', 1);
    }

    public function test_customer_can_apply_only_their_reward_up_to_its_limit_and_cancellation_releases_it(): void
    {
        [$customer, $shop, $staff, $service] = $this->customerShopAndService();
        $loyalty = UserLoyalty::query()->create([
            'user_id' => $customer->id,
            'star_count' => 0,
            'accumulated_amount' => 0,
        ]);
        $reward = LoyaltyReward::query()->create([
            'user_loyalty_id' => $loyalty->id,
            'user_id' => $customer->id,
            'amount_limit' => 110,
            'status' => 'available',
        ]);
        $startsAt = $this->nextAppointmentTime();

        $this->actingAs($customer)->getJson('/api/v1/user/loyalty')
            ->assertOk()
            ->assertJsonPath('starCount', 0)
            ->assertJsonPath('availableRewards.0.amountLimit', 110);

        $otherCustomer = $this->user('customer');
        $this->actingAs($otherCustomer)->postJson('/api/v1/appointments', [
            'shopId' => $shop->id,
            'staffId' => $staff->id,
            'serviceIds' => [$service->id],
            'startsAt' => $startsAt->toISOString(),
            'loyaltyRewardId' => $reward->id,
            'paymentMethod' => 'cash',
        ])->assertNotFound();

        $response = $this->actingAs($customer)->postJson('/api/v1/appointments', [
            'shopId' => $shop->id,
            'staffId' => $staff->id,
            'serviceIds' => [$service->id],
            'startsAt' => $startsAt->toISOString(),
            'loyaltyRewardId' => $reward->id,
            'paymentMethod' => 'cash',
        ])->assertCreated()
            ->assertJsonPath('basePrice', 200)
            ->assertJsonPath('discountAmount', 110)
            ->assertJsonPath('totalPrice', 90)
            ->assertJsonPath('payment.amount', 90);

        $appointmentId = (int) $response->json('id');
        $this->assertDatabaseHas('loyalty_rewards', [
            'id' => $reward->id,
            'status' => 'reserved',
            'appointment_id' => $appointmentId,
        ]);

        $this->actingAs($customer)->postJson("/api/v1/appointments/{$appointmentId}/cancel")
            ->assertOk()
            ->assertJsonPath('status', 'cancelled');
        $this->assertDatabaseHas('loyalty_rewards', [
            'id' => $reward->id,
            'status' => 'available',
            'appointment_id' => null,
        ]);

        $service->update(['price' => 100]);
        $freeAppointment = $this->actingAs($customer)->postJson('/api/v1/appointments', [
            'shopId' => $shop->id,
            'staffId' => $staff->id,
            'serviceIds' => [$service->id],
            'startsAt' => $startsAt->copy()->addHours(2)->toISOString(),
            'loyaltyRewardId' => $reward->id,
            'paymentMethod' => 'card',
        ])->assertCreated()
            ->assertJsonPath('discountAmount', 100)
            ->assertJsonPath('totalPrice', 0)
            ->assertJsonPath('payment.status', 'paid')
            ->assertJsonPath('payment.amount', 0);

        $this->actingAs($customer)->postJson('/api/v1/appointments/'.$freeAppointment->json('id').'/cancel')
            ->assertOk()
            ->assertJsonPath('payment.status', 'refunded');
        $this->assertDatabaseHas('loyalty_rewards', [
            'id' => $reward->id,
            'status' => 'available',
            'appointment_id' => null,
        ]);
    }

    public function test_shop_completion_collects_offline_payment_and_awards_the_customer_once(): void
    {
        [$customer, $shop, $staff, $service] = $this->customerShopAndService();
        $loyalty = UserLoyalty::query()->create([
            'user_id' => $customer->id,
            'star_count' => 3,
            'accumulated_amount' => 300,
        ]);
        $reward = LoyaltyReward::query()->create([
            'user_loyalty_id' => $loyalty->id,
            'user_id' => $customer->id,
            'amount_limit' => 100,
            'status' => 'available',
        ]);
        $start = now()->subHours(2);
        $appointment = Appointment::query()->create([
            'customer_id' => $customer->id,
            'shop_id' => $shop->id,
            'staff_id' => $staff->id,
            'service_id' => $service->id,
            'starts_at' => $start,
            'ends_at' => $start->copy()->addMinutes(30),
            'status' => 'confirmed',
            'base_price' => 200,
            'discount_amount' => 100,
            'total_price' => 100,
        ]);
        $reward->update([
            'status' => 'reserved',
            'appointment_id' => $appointment->id,
            'reserved_at' => now()->subHours(1),
        ]);
        $appointment->update(['loyalty_reward_id' => $reward->id]);
        $appointment->payment()->create([
            'provider' => 'offline',
            'payment_method' => 'cash',
            'amount' => 100,
            'currency' => 'TRY',
            'status' => 'pending',
            'payment_status' => 'pending',
            'user_id' => $customer->id,
            'shop_id' => $shop->id,
        ]);

        $this->actingAs($shop->owner)->postJson("/api/v1/shop/appointments/{$appointment->id}/complete")
            ->assertOk()
            ->assertJsonPath('status', 'completed')
            ->assertJsonPath('payment.status', 'paid');

        $this->actingAs($shop->owner)->postJson("/api/v1/shop/appointments/{$appointment->id}/complete")
            ->assertOk()
            ->assertJsonPath('status', 'completed');

        $this->assertSame(4, $customer->loyalty()->firstOrFail()->star_count);
        $this->assertSame(400, $customer->loyalty()->firstOrFail()->accumulated_amount);
        $this->assertDatabaseHas('loyalty_rewards', [
            'id' => $reward->id,
            'status' => 'redeemed',
            'appointment_id' => $appointment->id,
        ]);
        $this->assertDatabaseCount('loyalty_histories', 1);
        $this->assertDatabaseCount('financial_logs', 1);
    }

    private function customerShopAndService(): array
    {
        $customer = $this->user('customer');
        $owner = $this->user('shop_owner');
        $shop = Shop::query()->create([
            'owner_user_id' => $owner->id,
            'slug' => 'loyalty-shop-'.$this->userSequence,
            'name' => 'Sadakat Berberi',
            'status' => 'active',
            'is_approved' => true,
            'city' => 'İstanbul',
            'district' => 'Kadıköy',
        ]);
        $start = $this->nextAppointmentTime();
        $dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
        $staff = ShopStaff::query()->create([
            'shop_id' => $shop->id,
            'first_name' => 'Ali',
            'last_name' => 'Usta',
            'title' => 'Berber',
            'approval_status' => 'approved',
            'working_hours' => [[
                'day' => $dayNames[$start->dayOfWeek],
                'enabled' => true,
                'start' => '09:00',
                'end' => '17:00',
            ]],
        ]);
        $service = ShopService::query()->create([
            'shop_id' => $shop->id,
            'name' => 'Saç kesimi',
            'duration_minutes' => 30,
            'price' => 200,
            'is_active' => true,
        ]);

        return [$customer, $shop, $staff, $service];
    }

    private function nextAppointmentTime(): Carbon
    {
        return now()->addDays(2)->startOfDay()->setTime(10, 0);
    }

    private function user(string $role): User
    {
        $this->userSequence++;

        return User::query()->create([
            'name' => ucfirst($role).' '.$this->userSequence,
            'email' => $role.'-'.$this->userSequence.'@example.test',
            'password' => Hash::make('password'),
            'role' => $role,
            'status' => 'active',
        ]);
    }
}
