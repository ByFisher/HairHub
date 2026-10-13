<?php

namespace Tests\Feature;

use App\Models\Shop;
use App\Models\ShopService;
use App\Models\Slider;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GenderShopFilterTest extends TestCase
{
    use RefreshDatabase;

    public function test_shop_and_service_lists_include_matching_and_unisex_records_for_gender_filter(): void
    {
        $maleShop = $this->shop('male', 'male-shop');
        $this->service($maleShop, 'Erkek Kesimi', 'male', 300);
        $this->service($maleShop, 'Ortak Bakım', 'unisex', 500);
        $this->service($maleShop, 'Kadın Boya', 'female', 900);

        $femaleShop = $this->shop('female', 'female-shop');
        $this->service($femaleShop, 'Male only at female salon', 'male', 800);
        $unisexShop = $this->shop('unisex', 'unisex-shop');
        $this->service($unisexShop, 'Kadın Fön', 'female', 700);

        $this->getJson('/api/v1/shops')
            ->assertOk()
            ->assertJsonPath('meta.total', 3)
            ->assertJsonCount(3, 'data');

        $this->getJson('/api/v1/shops?gender=male')
            ->assertOk()
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('data.0.genderType', 'male')
            ->assertJsonPath('data.0.minimumServicePrice', 300)
            ->assertJsonPath('data.0.services.0.targetGender', 'male')
            ->assertJsonPath('data.0.services.1.targetGender', 'unisex')
            ->assertJsonPath('data.1.genderType', 'unisex')
            ->assertJsonMissing(['name' => 'female-shop']);

        $this->getJson('/api/v1/shops?gender=female')
            ->assertOk()
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('data.0.genderType', 'female')
            ->assertJsonPath('data.1.genderType', 'unisex')
            ->assertJsonPath('data.1.services.0.targetGender', 'female');

        $this->getJson('/api/v1/shops?gender=other')->assertUnprocessable();
    }

    public function test_gender_filter_is_supported_by_service_endpoints_and_is_optional(): void
    {
        $shop = $this->shop('unisex', 'service-filter-shop');
        $this->service($shop, 'Erkek Kesimi', 'male', 300);
        $this->service($shop, 'Kadın Fön', 'female', 700);
        $this->service($shop, 'Ortak Bakım', 'unisex', 500);

        $this->getJson("/api/v1/shops/{$shop->id}/services?gender=female")
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonPath('0.targetGender', 'female')
            ->assertJsonPath('1.targetGender', 'unisex');

        $this->getJson('/api/v1/shops/meta/services?gender=male')
            ->assertOk()
            ->assertExactJson(['Erkek Kesimi', 'Ortak Bakım']);
        $this->getJson('/api/v1/shops/meta/services')
            ->assertOk()
            ->assertExactJson(['Erkek Kesimi', 'Kadın Fön', 'Ortak Bakım']);

        $this->getJson('/api/v1/shops?gender=invalid')->assertUnprocessable();
        $this->getJson("/api/v1/shops/{$shop->id}/services?gender=invalid")->assertUnprocessable();
        $this->getJson('/api/v1/shops/meta/services?gender=invalid')->assertUnprocessable();

        $defaultGenderShop = $this->shop('unisex', 'default-gender-shop');
        $this->assertDatabaseHas('shops', ['id' => $defaultGenderShop->id, 'gender_type' => 'unisex']);

        $defaultGenderService = ShopService::query()->create([
            'shop_id' => $shop->id,
            'name' => 'Varsayılan hizmet',
            'duration_minutes' => 30,
            'price' => 100,
        ]);
        $this->assertDatabaseHas('shop_services', ['id' => $defaultGenderService->id, 'target_gender' => 'unisex']);
    }

    public function test_business_owners_can_update_shop_and_service_target_genders(): void
    {
        $shop = $this->shop('unisex', 'owner-gender-shop');
        $owner = $shop->owner;

        $this->actingAs($owner)->getJson('/api/v1/shop/profile')
            ->assertOk()
            ->assertJsonPath('genderType', 'unisex');
        $this->actingAs($owner)->putJson('/api/v1/shop/profile', ['genderType' => 'female'])
            ->assertOk()
            ->assertJsonPath('genderType', 'female');
        $this->assertDatabaseHas('shops', ['id' => $shop->id, 'gender_type' => 'female']);
        $this->actingAs($owner)->putJson('/api/v1/shop/profile', ['genderType' => 'invalid'])->assertUnprocessable();

        $this->actingAs($owner)->postJson('/api/v1/shop/services', [
            'name' => 'Kuaför hizmeti',
            'durationMinutes' => 45,
            'price' => 600,
            'targetGender' => 'female',
        ])->assertCreated()->assertJsonPath('targetGender', 'female');
    }

    public function test_admins_can_manage_shop_and_service_gender_classification_with_audit_logs(): void
    {
        $shop = $this->shop('male', 'admin-gender-shop');
        $service = $this->service($shop, 'Saç kesimi', 'male', 400);
        $admin = User::query()->create([
            'name' => 'Shop Admin',
            'email' => 'shop-admin@example.test',
            'password' => 'long-test-password',
            'role' => 'admin',
            'status' => 'active',
        ]);

        $this->actingAs($admin)->getJson('/api/v1/admin/shops')
            ->assertOk()
            ->assertJsonPath('data.0.genderType', 'male');

        $this->actingAs($admin)->getJson("/api/v1/admin/shops/{$shop->id}/services")
            ->assertOk()
            ->assertJsonPath('0.targetGender', 'male');

        $this->actingAs($admin)->patchJson("/api/v1/admin/shops/{$shop->id}/gender", ['genderType' => 'unisex'])
            ->assertOk()
            ->assertJsonPath('genderType', 'unisex');
        $this->assertDatabaseHas('shops', ['id' => $shop->id, 'gender_type' => 'unisex']);

        $this->actingAs($admin)->patchJson("/api/v1/admin/shops/{$shop->id}/services/{$service->id}/gender", [
            'targetGender' => 'female',
        ])->assertOk()->assertJsonPath('targetGender', 'female');
        $this->assertDatabaseHas('shop_services', ['id' => $service->id, 'target_gender' => 'female']);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'shop.gender_type_changed',
            'subject_id' => (string) $shop->id,
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'shop_service.target_gender_changed',
            'subject_id' => (string) $service->id,
        ]);

        $this->actingAs($admin)->patchJson("/api/v1/admin/shops/{$shop->id}/gender", ['genderType' => 'invalid'])
            ->assertUnprocessable();
        $this->actingAs($admin)->patchJson("/api/v1/admin/shops/{$shop->id}/services/{$service->id}/gender", [
            'targetGender' => 'invalid',
        ])->assertUnprocessable();

        $otherShop = $this->shop('female', 'other-admin-gender-shop');
        $otherService = $this->service($otherShop, 'Başka salon hizmeti', 'female', 500);
        $this->actingAs($admin)->patchJson("/api/v1/admin/shops/{$shop->id}/services/{$otherService->id}/gender", [
            'targetGender' => 'unisex',
        ])->assertNotFound();

        $moderator = User::query()->create([
            'name' => 'Shop Moderator',
            'email' => 'shop-moderator@example.test',
            'password' => 'long-test-password',
            'role' => 'moderator',
            'status' => 'active',
        ]);
        $this->actingAs($moderator)
            ->patchJson("/api/v1/admin/shops/{$shop->id}/gender", ['genderType' => 'female'])
            ->assertForbidden();
    }

    public function test_public_banners_are_filtered_by_target_gender_including_unisex(): void
    {
        $maleSlide = $this->slider('male', 'Erkek bannerı');
        $femaleSlide = $this->slider('female', 'Kadın bannerı');
        $unisexSlide = $this->slider('unisex', 'Ortak banner');

        $this->getJson('/api/v1/sliders?gender=male')
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonPath('0.id', (string) $maleSlide->id)
            ->assertJsonPath('1.id', (string) $unisexSlide->id);
        $this->getJson('/api/v1/sliders?gender=female')
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonPath('0.id', (string) $femaleSlide->id)
            ->assertJsonPath('1.id', (string) $unisexSlide->id);
        $this->getJson('/api/v1/sliders')
            ->assertOk()
            ->assertJsonCount(3);
        $this->getJson('/api/v1/sliders?gender=invalid')->assertUnprocessable();
    }

    public function test_shop_registration_accepts_a_gender_type_and_defaults_to_unisex(): void
    {
        $this->postJson('/api/v1/auth/register-shop', [
            'fullName' => 'HairHub Owner',
            'email' => 'hairhub-owner@example.test',
            'password' => 'shop-owner-password-123',
            'shopName' => 'HairHub Salon',
            'phone' => '05329876543',
            'city' => 'İstanbul',
            'district' => 'Beşiktaş',
            'address' => 'Barbaros Bulvarı No 10',
            'taxNumber' => '1234567899',
            'genderType' => 'female',
        ])->assertCreated();

        $this->assertDatabaseHas('shops', [
            'name' => 'HairHub Salon',
            'gender_type' => 'female',
        ]);
    }

    private function slider(string $gender, string $title): Slider
    {
        return Slider::query()->create([
            'title' => $title,
            'image_path' => "sliders/{$title}.png",
            'target_gender' => $gender,
            'is_active' => true,
        ]);
    }

    private function shop(string $gender, string $slug): Shop
    {
        $owner = User::query()->create([
            'name' => $slug,
            'email' => "{$slug}@example.test",
            'password' => 'long-test-password',
            'role' => 'shop_owner',
            'status' => 'active',
        ]);

        return Shop::query()->create([
            'owner_user_id' => $owner->id,
            'slug' => $slug,
            'name' => $slug,
            'status' => 'active',
            'is_approved' => true,
            'city' => 'İstanbul',
            'district' => 'Kadıköy',
            'gender_type' => $gender,
        ]);
    }

    private function service(Shop $shop, string $name, string $targetGender, int $price): ShopService
    {
        return ShopService::query()->create([
            'shop_id' => $shop->id,
            'name' => $name,
            'duration_minutes' => 30,
            'price' => $price,
            'target_gender' => $targetGender,
        ]);
    }
}
