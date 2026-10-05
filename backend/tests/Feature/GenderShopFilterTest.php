<?php

namespace Tests\Feature;

use App\Models\Shop;
use App\Models\ShopService;
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

        $this->shop('female', 'female-shop');
        $unisexShop = $this->shop('unisex', 'unisex-shop');
        $this->service($unisexShop, 'Kadın Fön', 'female', 700);

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
