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
        $mailer = $request->input('smtp_mailer');
        $isSmtp = $mailer === 'smtp';
        $configuredPassword = $isSmtp
            ? config('mail.mailers.smtp.password')
            : config('services.resend.key');
        $canReusePassword = filled($existingSetting?->smtp_password)
            || filled($configuredPassword);

        $data = $request->validate([
            'sender_name' => ['required', 'string', 'max:120'],
            'sender_email' => ['required', 'string', 'email', 'max:255'],
            'smtp_mailer' => ['required', Rule::in(['smtp', 'resend'])],
            'smtp_host' => [$isSmtp ? 'required' : 'nullable', 'string', 'max:255'],
            'smtp_port' => [$isSmtp ? 'required' : 'nullable', 'integer', 'between:1,65535'],
            'smtp_username' => [$isSmtp ? 'required' : 'nullable', 'string', 'max:255'],
            'smtp_password' => [$canReusePassword ? 'nullable' : 'required', 'string', 'max:4096'],
            'smtp_encryption' => [$isSmtp ? 'required' : 'nullable', Rule::in(['tls', 'ssl', 'none'])],
        ]);

        $setting = DB::transaction(function () use ($data, $existingSetting, $isSmtp, $configuredPassword): SmtpSetting {
            $password = filled($data['smtp_password'] ?? null)
                ? Crypt::encryptString($data['smtp_password'])
                : ($existingSetting?->smtp_password
                    ?? Crypt::encryptString((string) $configuredPassword));
            $attributes = $data;

            if (! $isSmtp) {
                $attributes['smtp_host'] = null;
                $attributes['smtp_port'] = null;
                $attributes['smtp_username'] = null;
                $attributes['smtp_encryption'] = null;
            }

            return SmtpSetting::query()->updateOrCreate(
                ['id' => 1],
                [
                    ...$attributes,
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
            Mail::mailer($setting->smtp_mailer)->html(
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
                'message' => 'Test e-postası gönderilemedi. E-posta sağlayıcısı ayarlarını kontrol edin.',
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
        if (config('mail.default') === 'resend' && filled(config('services.resend.key'))) {
            $senderEmail = config('mail.from.address');
            $senderName = config('mail.from.name');

            if (filled($senderEmail) && filled($senderName)) {
                return [
                    'sender_name' => $senderName,
                    'sender_email' => $senderEmail,
                    'smtp_mailer' => 'resend',
                    'smtp_host' => null,
                    'smtp_port' => null,
                    'smtp_username' => null,
                    'smtp_password' => null,
                    'has_password' => true,
                    'smtp_encryption' => null,
                    'source' => 'environment',
                ];
            }
        }

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
