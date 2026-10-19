<?php

namespace Tests\Feature;

use App\Models\SupportPageContent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SupportPageApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_support_page_is_public_and_returns_saved_content(): void
    {
        $this->getJson('/api/v1/support-page')
            ->assertOk()
            ->assertJsonPath('data.title', 'Size nasıl yardımcı olabiliriz?')
            ->assertJsonPath('data.faqs.0.question', 'Nasıl randevu alabilirim?');
    }

    public function test_super_admin_can_update_support_page_content(): void
    {
        $admin = $this->user('super_admin');
        $payload = $this->validPayload();

        $this->actingAs($admin)
            ->putJson('/api/v1/admin/support-page', $payload)
            ->assertOk()
            ->assertJsonPath('data.title', $payload['title'])
            ->assertJsonPath('data.support_email', $payload['support_email'])
            ->assertJsonPath('data.faqs.0.answer', $payload['faqs'][0]['answer']);

        $this->assertDatabaseHas('support_page_contents', [
            'id' => 1,
            'title' => $payload['title'],
        ]);

        $this->getJson('/api/v1/support-page')
            ->assertOk()
            ->assertJsonPath('data.title', $payload['title']);
    }

    public function test_only_super_admin_can_manage_support_page(): void
    {
        $this->getJson('/api/v1/admin/support-page')->assertUnauthorized();

        $admin = $this->user('admin');
        $this->actingAs($admin)
            ->getJson('/api/v1/admin/support-page')
            ->assertForbidden();
        $this->putJson('/api/v1/admin/support-page', $this->validPayload())
            ->assertForbidden();
    }

    public function test_support_page_update_rejects_invalid_content(): void
    {
        $this->actingAs($this->user('super_admin'))
            ->putJson('/api/v1/admin/support-page', [
                ...$this->validPayload(),
                'support_email' => 'not-an-email',
                'faqs' => [['question' => '', 'answer' => '']],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['support_email', 'faqs.0.question', 'faqs.0.answer']);

        $this->assertSame('Size nasıl yardımcı olabiliriz?', SupportPageContent::query()->findOrFail(1)->title);
    }

    /**
     * @return array<string, mixed>
     */
    private function validPayload(): array
    {
        return [
            'title' => 'Bize ulaşın',
            'introduction' => 'Destek ekibimiz size yardımcı olur.',
            'message' => 'Mesajınızı iletişim kanallarımızdan gönderin.',
            'support_email' => 'support@example.test',
            'support_phone' => '+90 212 000 00 00',
            'working_hours' => 'Hafta içi 09.00–18.00',
            'faqs' => [
                ['question' => 'Nasıl ulaşırım?', 'answer' => 'E-posta gönderebilirsiniz.'],
            ],
        ];
    }

    private function user(string $role): User
    {
        return User::query()->create([
            'name' => ucfirst($role),
            'email' => $role.'-'.uniqid().'@example.test',
            'password' => Hash::make('long-test-password'),
            'role' => $role,
            'status' => 'active',
        ]);
    }
}
