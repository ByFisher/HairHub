<?php

namespace App\Services;

use App\Exceptions\SmtpSettingsNotConfigured;
use App\Models\SmtpSetting;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Mail;

class SmtpSettingsService
{
    public function current(): ?SmtpSetting
    {
        return SmtpSetting::query()->find(1);
    }

    public function configure(?SmtpSetting $setting = null, bool $purgeMailer = true): SmtpSetting
    {
        $setting ??= $this->current();

        if (
            ! $setting
            || ! $setting->sender_name
            || ! $setting->sender_email
            || ! $setting->smtp_mailer
            || ! $setting->smtp_password
        ) {
            throw new SmtpSettingsNotConfigured;
        }

        $password = $setting->decryptedPassword();

        if ($setting->smtp_mailer === 'smtp') {
            if (! $setting->smtp_host || ! $setting->smtp_port || ! $setting->smtp_username) {
                throw new SmtpSettingsNotConfigured;
            }

            $scheme = match ($setting->smtp_encryption) {
                'tls' => 'smtp',
                'ssl' => 'smtps',
                'none' => 'smtp',
                default => throw new SmtpSettingsNotConfigured,
            };

            Config::set('mail.mailers.smtp', [
                ...config('mail.mailers.smtp', []),
                'transport' => 'smtp',
                'scheme' => $scheme,
                'url' => null,
                'host' => $setting->smtp_host,
                'port' => $setting->smtp_port,
                'username' => $setting->smtp_username,
                'password' => $password,
            ]);
        } elseif ($setting->smtp_mailer === 'resend') {
            Config::set([
                'services.resend.key' => $password,
                'mail.mailers.resend' => [
                    'transport' => 'resend_api',
                    'key' => $password,
                ],
            ]);
        } else {
            throw new SmtpSettingsNotConfigured;
        }

        Config::set([
            'mail.default' => $setting->smtp_mailer,
            'mail.from.address' => $setting->sender_email,
            'mail.from.name' => $setting->sender_name,
        ]);

        if ($purgeMailer) {
            Mail::purge('smtp');
            Mail::purge('resend');
        }

        return $setting;
    }
}
