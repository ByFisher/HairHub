<?php

namespace Tests\Feature;

use App\Models\SmtpSetting;
use App\Models\User;
use App\Services\SmtpSettingsService;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Mail\Events\MessageSending;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Component\Mime\Email;
use Tests\TestCase;

class SmtpSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_smtp_settings_are_empty_until_a_super_admin_saves_them(): void
    {
        config([
            'mail.mailers.smtp.host' => null,
            'mail.mailers.smtp.port' => null,
            'mail.mailers.smtp.password' => null,
            'mail.from.address' => null,
            'mail.from.name' => null,
        ]);
        $superAdmin = User::factory()->create([
            'role' => 'super_admin',
            'status' => 'active',
        ]);

        $this->actingAs($superAdmin)
            ->getJson('/api/v1/admin/settings/smtp')
            ->assertOk()
            ->assertExactJson(['data' => null]);

        $this->actingAs($superAdmin)
            ->postJson('/api/v1/admin/settings/smtp', [
                ...$this->validPayload(),
                'smtp_password' => '',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['smtp_password']);

        $this->assertDatabaseCount('smtp_settings', 0);
    }

    public function test_super_admin_can_load_environment_settings_without_exposing_the_password(): void
    {
        config([
            'mail.mailers.smtp.scheme' => 'smtp',
            'mail.mailers.smtp.host' => 'smtp.env.example.test',
            'mail.mailers.smtp.port' => 587,
            'mail.mailers.smtp.username' => 'env-user',
            'mail.mailers.smtp.password' => 'env-secret',
            'mail.from.address' => 'env@example.test',
            'mail.from.name' => 'Environment Mail',
        ]);
        $superAdmin = User::factory()->create([
            'role' => 'super_admin',
            'status' => 'active',
        ]);

        $this->actingAs($superAdmin)
            ->getJson('/api/v1/admin/settings/smtp')
            ->assertOk()
            ->assertJsonPath('data.source', 'environment')
            ->assertJsonPath('data.sender_name', 'Environment Mail')
            ->assertJsonPath('data.sender_email', 'env@example.test')
            ->assertJsonPath('data.smtp_host', 'smtp.env.example.test')
            ->assertJsonPath('data.smtp_port', 587)
            ->assertJsonPath('data.smtp_username', 'env-user')
            ->assertJsonPath('data.smtp_encryption', 'tls')
            ->assertJsonPath('data.has_password', true)
            ->assertJsonPath('data.smtp_password', null)
            ->assertDontSee('env-secret');

        $this->actingAs($superAdmin)
            ->postJson('/api/v1/admin/settings/smtp', [
                ...$this->validPayload(),
                'smtp_password' => '',
            ])
            ->assertOk();

        $this->assertSame('env-secret', SmtpSetting::query()->findOrFail(1)->decryptedPassword());
    }

    public function test_super_admin_can_save_encrypted_smtp_settings_and_secret_is_never_returned(): void
    {
        $superAdmin = User::factory()->create([
            'role' => 'super_admin',
            'status' => 'active',
        ]);
        $payload = $this->validPayload();

        $this->actingAs($superAdmin)
            ->postJson('/api/v1/admin/settings/smtp', $payload)
            ->assertOk()
            ->assertJsonPath('data.sender_email', $payload['sender_email'])
            ->assertJsonPath('data.has_password', true)
            ->assertJsonPath('data.smtp_password', null)
            ->assertDontSee($payload['smtp_password']);

        $this->assertDatabaseCount('smtp_settings', 1);
        $storedPassword = SmtpSetting::query()->findOrFail(1)->smtp_password;
        $this->assertNotSame($payload['smtp_password'], $storedPassword);
        $this->assertSame($payload['smtp_password'], Crypt::decryptString($storedPassword));

        $this->actingAs($superAdmin)
            ->getJson('/api/v1/admin/settings/smtp')
            ->assertOk()
            ->assertJsonPath('data.smtp_host', 'smtp.example.test')
            ->assertJsonPath('data.has_password', true)
            ->assertJsonPath('data.smtp_password', null)
            ->assertDontSee($payload['smtp_password']);

        $this->actingAs($superAdmin)
            ->postJson('/api/v1/admin/settings/smtp', [...$payload, 'smtp_host' => 'smtp-updated.example.test'])
            ->assertOk();

        $this->assertDatabaseCount('smtp_settings', 1);
        $this->assertDatabaseHas('smtp_settings', [
            'id' => 1,
            'smtp_host' => 'smtp-updated.example.test',
        ]);
    }

    public function test_super_admin_can_save_resend_api_settings_with_an_encrypted_api_key(): void
    {
        $superAdmin = User::factory()->create([
            'role' => 'super_admin',
            'status' => 'active',
        ]);
        $payload = [
            ...$this->validPayload(),
            'smtp_mailer' => 'resend',
            'smtp_host' => null,
            'smtp_port' => null,
            'smtp_username' => null,
            'smtp_encryption' => null,
            'smtp_password' => 're_test_secret',
        ];

        $this->actingAs($superAdmin)
            ->postJson('/api/v1/admin/settings/smtp', $payload)
            ->assertOk()
            ->assertJsonPath('data.smtp_mailer', 'resend')
            ->assertJsonPath('data.smtp_host', null)
            ->assertJsonPath('data.smtp_port', null)
            ->assertJsonPath('data.has_password', true)
            ->assertJsonPath('data.smtp_password', null)
            ->assertDontSee('re_test_secret');

        $setting = SmtpSetting::query()->findOrFail(1);
        $this->assertSame('re_test_secret', $setting->decryptedPassword());
        $this->assertNull($setting->smtp_host);
        $this->assertNull($setting->smtp_port);
    }

    public function test_only_super_admins_can_read_or_change_smtp_settings(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'status' => 'active',
        ]);

        $this->actingAs($admin)
            ->getJson('/api/v1/admin/settings/smtp')
            ->assertForbidden();
        $this->actingAs($admin)
            ->postJson('/api/v1/admin/settings/smtp', $this->validPayload())
            ->assertForbidden();
        $this->actingAs($admin)
            ->postJson('/api/v1/admin/settings/smtp/test', [
                'email' => 'recipient@example.test',
                'subject' => 'SMTP test',
                'message' => 'Hello from the test.',
            ])
            ->assertForbidden();
        $this->assertDatabaseCount('smtp_settings', 0);
    }

    public function test_smtp_test_email_requires_saved_settings_and_valid_input(): void
    {
        $superAdmin = User::factory()->create([
            'role' => 'super_admin',
            'status' => 'active',
        ]);
        $payload = [
            'email' => 'recipient@example.test',
            'subject' => 'SMTP test',
            'message' => 'Hello from the test.',
        ];

        $this->actingAs($superAdmin)
            ->postJson('/api/v1/admin/settings/smtp/test', $payload)
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Önce SMTP ayarlarını kaydedin.');

        $this->actingAs($superAdmin)
            ->postJson('/api/v1/admin/settings/smtp/test', [
                ...$payload,
                'email' => 'invalid',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_saved_settings_are_applied_to_the_runtime_mail_configuration(): void
    {
        SmtpSetting::query()->create([
            ...$this->validPayload(),
            'smtp_password' => Crypt::encryptString('smtp-test-secret'),
        ]);

        app(SmtpSettingsService::class)->configure();

        $this->assertSame('smtp', config('mail.default'));
        $this->assertSame('smtp.example.test', config('mail.mailers.smtp.host'));
        $this->assertSame(587, config('mail.mailers.smtp.port'));
        $this->assertSame('smtp-user', config('mail.mailers.smtp.username'));
        $this->assertSame('smtp-test-secret', config('mail.mailers.smtp.password'));
        $this->assertSame('smtp@example.test', config('mail.from.address'));
        $this->assertSame('HairHub Test', config('mail.from.name'));
    }

    public function test_test_email_reports_a_decryption_failure_and_logs_details(): void
    {
        $superAdmin = User::factory()->create([
            'role' => 'super_admin',
            'status' => 'active',
        ]);
        SmtpSetting::query()->create([
            ...$this->validPayload(),
            'smtp_password' => 'not-a-valid-ciphertext',
        ]);
        Log::shouldReceive('error')
            ->once()
            ->withArgs(fn (string $message, array $context): bool => $message === 'SMTP test email delivery failed.'
                && $context['exception'] instanceof DecryptException);

        $this->actingAs($superAdmin)
            ->postJson('/api/v1/admin/settings/smtp/test', [
                'email' => 'recipient@example.test',
                'subject' => 'SMTP test',
                'message' => 'Hello from the test.',
            ])
            ->assertStatus(502)
            ->assertJsonPath('message', 'Test e-postası gönderilemedi. E-posta sağlayıcısı ayarlarını kontrol edin.');
    }

    public function test_resend_test_email_uses_the_https_api_transport(): void
    {
        Http::fake([
            'https://api.resend.com/emails' => Http::response(['id' => 'email_test_123'], 200),
        ]);
        $superAdmin = User::factory()->create([
            'role' => 'super_admin',
            'status' => 'active',
        ]);
        SmtpSetting::query()->create([
            'sender_name' => 'HairHub Test',
            'sender_email' => 'onboarding@resend.dev',
            'smtp_mailer' => 'resend',
            'smtp_password' => Crypt::encryptString('re_test_secret'),
        ]);

        $this->actingAs($superAdmin)
            ->postJson('/api/v1/admin/settings/smtp/test', [
                'email' => 'recipient@example.test',
                'subject' => 'Resend API test',
                'message' => 'Hello from the test.',
            ])
            ->assertOk()
            ->assertJsonPath('message', 'Test e-postası gönderildi.');

        $request = Http::recorded()->first()[0];
        $this->assertSame('https://api.resend.com/emails', $request->url());
        $this->assertTrue($request->hasHeader('Authorization', 'Bearer re_test_secret'));
        $this->assertSame('"HairHub Test" <onboarding@resend.dev>', $request['from']);
        $this->assertSame(['recipient@example.test'], $request['to']);
        $this->assertSame('Resend API test', $request['subject']);
        $this->assertStringContainsString('Hello from the test.', $request['html']);
    }

    public function test_resend_api_failures_are_reported_as_gateway_errors(): void
    {
        Http::fake([
            'https://api.resend.com/emails' => Http::response(['message' => 'Invalid API key'], 401),
        ]);
        $superAdmin = User::factory()->create([
            'role' => 'super_admin',
            'status' => 'active',
        ]);
        SmtpSetting::query()->create([
            'sender_name' => 'HairHub Test',
            'sender_email' => 'onboarding@resend.dev',
            'smtp_mailer' => 'resend',
            'smtp_password' => Crypt::encryptString('re_test_secret'),
        ]);
        Log::shouldReceive('error')
            ->once()
            ->withArgs(fn (string $message, array $context): bool => $message === 'SMTP test email delivery failed.'
                && $context['exception'] instanceof TransportExceptionInterface);

        $this->actingAs($superAdmin)
            ->postJson('/api/v1/admin/settings/smtp/test', [
                'email' => 'recipient@example.test',
                'subject' => 'Resend API test',
                'message' => 'Hello from the test.',
            ])
            ->assertStatus(502)
            ->assertJsonPath('message', 'Test e-postası gönderilemedi. E-posta sağlayıcısı ayarlarını kontrol edin.');
    }

    public function test_message_sending_refreshes_a_resolved_mailer_from_database_settings(): void
    {
        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp.host' => 'old.example.test',
            'mail.mailers.smtp.port' => 25,
        ]);
        $mailer = Mail::mailer('smtp');
        $oldTransport = $mailer->getSymfonyTransport();

        SmtpSetting::query()->create([
            ...$this->validPayload(),
            'smtp_password' => Crypt::encryptString('smtp-test-secret'),
        ]);

        $message = new Email;
        Event::dispatch(new MessageSending($message, ['mailer' => 'smtp']));

        $this->assertSame($mailer, Mail::mailer('smtp'));
        $this->assertSame('smtp.example.test', config('mail.mailers.smtp.host'));
        $this->assertSame('smtp-user', config('mail.mailers.smtp.username'));
        $this->assertSame('smtp-test-secret', config('mail.mailers.smtp.password'));
        $this->assertSame('smtp@example.test', $message->getFrom()[0]->getAddress());
        $this->assertNotSame($oldTransport, $mailer->getSymfonyTransport());
    }

    /**
     * @return array<string, string|int>
     */
    private function validPayload(): array
    {
        return [
            'sender_name' => 'HairHub Test',
            'sender_email' => 'smtp@example.test',
            'smtp_mailer' => 'smtp',
            'smtp_host' => 'smtp.example.test',
            'smtp_port' => 587,
            'smtp_username' => 'smtp-user',
            'smtp_password' => 'smtp-test-secret',
            'smtp_encryption' => 'tls',
        ];
    }
}
