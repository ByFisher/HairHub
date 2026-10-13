<?php

namespace Tests\Feature;

use App\Models\Shop;
use App\Models\ShopStaff;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminShopStaffDirectoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_and_filter_barbers_and_hairdressers_separately(): void
    {
        $admin = $this->user('admin', 'Directory Admin');
        $shop = $this->shop('Directory Salon');
        $hairdresser = $this->staff($shop, 'Ayşe', 'Kuaför', 'approved');
        $this->staff($shop, 'Ali', 'Berber', 'pending_approval');

        $this->actingAs($admin)
            ->getJson('/api/v1/admin/shop-staff?title=Kuaf%C3%B6r&search=Ay%C5%9Fe')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.id', (string) $hairdresser->id)
            ->assertJsonPath('data.0.title', 'Kuaför')
            ->assertJsonPath('data.0.shopName', 'Directory Salon')
            ->assertJsonPath('data.0.approvalStatus', 'approved')
            ->assertJsonPath('data.0.experienceYears', 8)
            ->assertJsonPath('data.0.biography', 'Deneyimli uzman')
            ->assertJsonPath('data.0.skills.0', 'Kesim');

        $this->getJson('/api/v1/admin/shop-staff?title=Berber')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.title', 'Berber');

        $this->getJson('/api/v1/admin/shop-staff?title=Kalfa')->assertUnprocessable();

        $moderator = $this->user('moderator', 'Directory Moderator');
        $this->actingAs($moderator)
            ->getJson('/api/v1/admin/shop-staff?title=Berber')
            ->assertForbidden();
    }

    private function user(string $role, string $name): User
    {
        return User::query()->create([
            'name' => $name,
            'email' => strtolower(str_replace(' ', '-', $name)).'@example.test',
            'password' => 'long-test-password',
            'role' => $role,
            'status' => 'active',
        ]);
    }

    private function shop(string $name): Shop
    {
        $owner = $this->user('shop_owner', "{$name} Owner");

        return Shop::query()->create([
            'owner_user_id' => $owner->id,
            'slug' => strtolower(str_replace(' ', '-', $name)),
            'name' => $name,
            'status' => 'active',
            'is_approved' => true,
            'city' => 'İstanbul',
            'district' => 'Kadıköy',
            'phone' => '02161234567',
            'gender_type' => 'unisex',
        ]);
    }

    private function staff(Shop $shop, string $firstName, string $title, string $status): ShopStaff
    {
        return ShopStaff::query()->create([
            'shop_id' => $shop->id,
            'first_name' => $firstName,
            'last_name' => 'Usta',
            'title' => $title,
            'experience_years' => 8,
            'biography' => 'Deneyimli uzman',
            'approval_status' => $status,
            'skills' => ['Kesim'],
            'working_hours' => [['day' => 'Pazartesi', 'enabled' => true]],
            'work_logs' => [['date' => '2026-01-01', 'workSummary' => 'Saç kesimi']],
        ]);
    }
}
