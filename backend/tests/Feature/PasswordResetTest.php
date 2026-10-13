<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\PasswordResetNotification;
use Illuminate\Contracts\Notifications\Dispatcher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Symfony\Component\Mailer\Exception\TransportException;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_forgot_password_uses_a_generic_response_and_sends_a_reset_notification_for_known_users(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'known@example.test']);

        $knownResponse = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => $user->email,
        ])->assertOk();
        $unknownResponse = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'unknown@example.test',
        ])->assertOk();

        $this->assertSame($knownResponse->json('message'), $unknownResponse->json('message'));
        $this->assertSame(
            'Eğer e-posta adresiniz sistemimizde kayıtlıysa şifre sıfırlama bağlantısı gönderildi.',
            $knownResponse->json('message'),
        );
        Notification::assertSentTo($user, PasswordResetNotification::class);
        Notification::assertCount(1);
        $this->assertSame(30, config('auth.passwords.users.expire'));
    }

    public function test_forgot_password_does_not_expose_smtp_authentication_errors(): void
    {
        $user = User::factory()->create(['email' => 'smtp-failure@example.test']);
        $dispatcher = \Mockery::mock(Dispatcher::class);
        $dispatcher->shouldReceive('send')
            ->once()
            ->andThrow(new TransportException('SMTP credentials rejected'));
        $this->app->instance(Dispatcher::class, $dispatcher);
        Log::shouldReceive('error')
            ->once()
            ->withArgs(fn (string $message, array $context): bool => $message === 'Password reset email delivery failed.'
                && $context['exception'] instanceof TransportException);

        $this->postJson('/api/v1/auth/forgot-password', ['email' => $user->email])
            ->assertOk()
            ->assertJsonPath('message', 'Eğer e-posta adresiniz sistemimizde kayıtlıysa şifre sıfırlama bağlantısı gönderildi.')
            ->assertDontSee('SMTP credentials rejected');
    }

    public function test_reset_password_updates_the_hash_and_makes_the_token_single_use(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'reset@example.test']);

        $this->postJson('/api/v1/auth/forgot-password', ['email' => $user->email])->assertOk();
        $token = null;
        $sentNotification = null;
        Notification::assertSentTo($user, PasswordResetNotification::class, function (PasswordResetNotification $notification) use (&$token, &$sentNotification): bool {
            $token = $notification->token;
            $sentNotification = $notification;

            return true;
        });

        $mail = $sentNotification->toMail($user);
        $this->assertSame('emails.password-reset', $mail->view['html']);
        $this->assertSame('emails.password-reset-text', $mail->view['text']);
        $this->assertStringContainsString(
            'http://localhost:3000/reset-password?token='.rawurlencode($token).'&email=reset%40example.test',
            $mail->viewData['resetUrl'],
        );
        $this->assertStringContainsString('Şifrenizi yenileyin', view($mail->view['html'], $mail->viewData)->render());

        $storedToken = DB::table('password_reset_tokens')
            ->where('email', $user->email)
            ->value('token');
        $this->assertNotSame($token, $storedToken);
        $this->assertTrue(Hash::check($token, $storedToken));

        $payload = [
            'email' => $user->email,
            'token' => $token,
            'password' => 'new-secure-password-456',
            'password_confirmation' => 'new-secure-password-456',
        ];
        $this->postJson('/api/v1/auth/reset-password', $payload)
            ->assertOk()
            ->assertJsonPath('message', 'Şifreniz başarıyla güncellendi.');

        $this->assertTrue(Hash::check('new-secure-password-456', $user->fresh()->password));
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => $user->email]);

        $this->postJson('/api/v1/auth/reset-password', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['token']);
    }

    public function test_expired_and_unknown_reset_tokens_are_rejected(): void
    {
        $user = User::factory()->create(['email' => 'expired@example.test']);
        $token = Password::createToken($user);

        $this->travel(31)->minutes();

        $this->postJson('/api/v1/auth/reset-password', [
            'email' => $user->email,
            'token' => $token,
            'password' => 'new-secure-password-456',
            'password_confirmation' => 'new-secure-password-456',
        ])->assertUnprocessable()->assertJsonValidationErrors(['token']);
    }
}
