<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\SmtpSettingsNotConfigured;
use App\Http\Controllers\Controller;
use App\Models\SmtpSetting;
use App\Services\SmtpSettingsService;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;

class SmtpSettingController extends Controller
{
    public function show(): JsonResponse
    {
        $setting = app(SmtpSettingsService::class)->current();

        return response()->json([
            'data' => $setting ? $this->present($setting, 'database') : $this->presentEnvironmentSettings(),
        ]);
    }

    public function update(Request $request, SmtpSettingsService $smtp): JsonResponse
    {
        $existingSetting = $smtp->current();
        $canReusePassword = filled($existingSetting?->smtp_password)
            || filled(config('mail.mailers.smtp.password'));

        $data = $request->validate([
            'sender_name' => ['required', 'string', 'max:120'],
            'sender_email' => ['required', 'string', 'email', 'max:255'],
            'smtp_mailer' => ['required', Rule::in(['smtp'])],
            'smtp_host' => ['required', 'string', 'max:255'],
            'smtp_port' => ['required', 'integer', 'between:1,65535'],
            'smtp_username' => ['required', 'string', 'max:255'],
            'smtp_password' => [$canReusePassword ? 'nullable' : 'required', 'string', 'max:4096'],
            'smtp_encryption' => ['required', Rule::in(['tls', 'ssl', 'none'])],
        ]);

        $setting = DB::transaction(function () use ($data, $existingSetting): SmtpSetting {
            $password = filled($data['smtp_password'] ?? null)
                ? Crypt::encryptString($data['smtp_password'])
                : ($existingSetting?->smtp_password
                    ?? Crypt::encryptString((string) config('mail.mailers.smtp.password')));

            return SmtpSetting::query()->updateOrCreate(
                ['id' => 1],
                [
                    ...$data,
                    'smtp_password' => $password,
                ],
            );
        });

        $smtp->configure($setting);

        return response()->json(['data' => $this->present($setting, 'database')]);
    }

    public function test(Request $request, SmtpSettingsService $smtp): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255'],
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:10000'],
        ]);
        $setting = $smtp->current();

        if (! $setting) {
            return response()->json([
                'message' => 'Önce SMTP ayarlarını kaydedin.',
            ], 422);
        }

        try {
            $smtp->configure($setting);
            Mail::mailer('smtp')->html(
                nl2br(e($data['message'])),
                function ($mail) use ($data): void {
                    $mail->to($data['email'])->subject($data['subject']);
                },
            );
        } catch (DecryptException|SmtpSettingsNotConfigured|TransportExceptionInterface $exception) {
            Log::error('SMTP test email delivery failed.', [
                'exception' => $exception,
            ]);

            return response()->json([
                'message' => 'Test e-postası gönderilemedi. SMTP bağlantı bilgilerini kontrol edin.',
            ], 502);
        }

        return response()->json(['message' => 'Test e-postası gönderildi.']);
    }

    /**
     * @return array<string, mixed>
     */
    private function present(SmtpSetting $setting, string $source): array
    {
        return [
            'sender_name' => $setting->sender_name,
            'sender_email' => $setting->sender_email,
            'smtp_mailer' => $setting->smtp_mailer,
            'smtp_host' => $setting->smtp_host,
            'smtp_port' => $setting->smtp_port,
            'smtp_username' => $setting->smtp_username,
            'smtp_password' => null,
            'has_password' => filled($setting->smtp_password),
            'smtp_encryption' => $setting->smtp_encryption,
            'source' => $source,
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function presentEnvironmentSettings(): ?array
    {
        $mailer = config('mail.mailers.smtp', []);
        $port = $mailer['port'] ?? null;
        $scheme = $mailer['scheme'] ?? null;
        $encryption = match ($scheme) {
            'smtps', 'ssl' => 'ssl',
            'smtp', 'tls' => 'tls',
            default => (int) $port === 465 ? 'ssl' : ((int) $port === 587 ? 'tls' : 'none'),
        };
        $senderEmail = config('mail.from.address');
        $senderName = config('mail.from.name');

        if (! filled($mailer['host'] ?? null) || ! filled($port) || ! filled($senderEmail) || ! filled($senderName)) {
            return null;
        }

        return [
            'sender_name' => $senderName,
            'sender_email' => $senderEmail,
            'smtp_mailer' => 'smtp',
            'smtp_host' => $mailer['host'],
            'smtp_port' => (int) $port,
            'smtp_username' => $mailer['username'] ?? '',
            'smtp_password' => null,
            'has_password' => filled($mailer['password'] ?? null),
            'smtp_encryption' => $encryption,
            'source' => 'environment',
        ];
    }
}
