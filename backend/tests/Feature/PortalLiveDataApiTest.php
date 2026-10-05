<?php

namespace Tests\Feature;

use App\Models\Shop;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PortalLiveDataApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_dashboard_returns_live_aggregate_counts_to_authorized_roles(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);
        User::factory()->create(['role' => 'customer', 'status' => 'active']);
        $owner = User::factory()->create(['role' => 'shop_owner', 'status' => 'active']);
        $owner->shops()->create([
            'name' => 'Active Shop',
            'slug' => 'active-shop-overview',
            'description' => '',
            'status' => 'active',
            'is_approved' => true,
            'city' => 'İstanbul',
            'district' => 'Kadıköy',
            'street' => 'Test Caddesi 1',
            'phone' => '05550000000',
        ]);

        $this->actingAs($admin)->getJson('/api/v1/admin/overview')
            ->assertOk()
            ->assertJsonPath('customers', 1)
            ->assertJsonPath('shops.total', 1)
            ->assertJsonPath('shops.active', 1)
            ->assertJsonPath('shops.pending', 0)
            ->assertJsonPath('appointments.total', 0);
    }

    public function test_shop_dashboard_counts_only_records_belonging_to_the_signed_in_owner(): void
    {
        $owner = User::factory()->create(['role' => 'shop_owner', 'status' => 'active']);
        $shop = $owner->shops()->create([
            'name' => 'Owner Shop',
            'slug' => 'owner-shop-overview',
            'description' => '',
            'status' => 'active',
            'is_approved' => true,
            'city' => 'İstanbul',
            'district' => 'Kadıköy',
            'street' => 'Test Caddesi 2',
            'phone' => '05550000001',
        ]);

        $this->actingAs($owner)->getJson('/api/v1/shop/overview')
            ->assertOk()
            ->assertJsonPath('shopName', $shop->name)
            ->assertJsonPath('appointments.total', 0)
            ->assertJsonPath('customers', 0)
            ->assertJsonPath('staff', 0)
            ->assertJsonPath('services', 0);
    }

    public function test_only_super_admin_can_read_audit_records(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);
        $superAdmin = User::factory()->create(['role' => 'super_admin', 'status' => 'active']);
        DB::table('audit_logs')->insert([
            'actor_user_id' => $superAdmin->id,
            'action' => 'test.updated',
            'subject_type' => Shop::class,
            'subject_id' => '42',
            'metadata' => json_encode(['source' => 'test']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($admin)->getJson('/api/v1/admin/audit-logs')->assertForbidden();
        $this->actingAs($superAdmin)->getJson('/api/v1/admin/audit-logs')
            ->assertOk()
            ->assertJsonPath('data.0.action', 'test.updated')
            ->assertJsonPath('data.0.metadata.source', 'test');
    }
}