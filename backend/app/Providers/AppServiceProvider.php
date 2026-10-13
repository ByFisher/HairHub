<?php

namespace App\Providers;

use App\Contracts\PaymentGateway;
use App\Exceptions\SmtpSettingsNotConfigured;
use App\Services\Payments\DemoPaymentGateway;
use App\Services\Payments\IyzicoPaymentGateway;
use App\Services\SmtpSettingsService;
use Illuminate\Mail\Events\MessageSending;
use Illuminate\Mail\MailManager;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use InvalidArgumentException;
use Symfony\Component\Mime\Address;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(PaymentGateway::class, function (): PaymentGateway {
            return match (config('payments.driver')) {
                'demo' => $this->app->make(DemoPaymentGateway::class),
                'iyzico' => $this->app->make(IyzicoPaymentGateway::class),
                default => throw new InvalidArgumentException('Configured payment gateway is not supported.'),
            };
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (Schema::hasTable('smtp_settings')) {
            try {
                app(SmtpSettingsService::class)->configure();
            } catch (SmtpSettingsNotConfigured) {
                // Email delivery remains blocked by the listener until a super admin configures SMTP.
            }
        }

        Event::listen(MessageSending::class, function (MessageSending $event): void {
            $setting = app(SmtpSettingsService::class)->configure(purgeMailer: false);
            $mailerName = $event->data['mailer'] ?? $setting->smtp_mailer;
            $mailer = Mail::mailer($mailerName);
            $mailManager = app(MailManager::class);

            $mailer->setSymfonyTransport(
                $mailManager->createSymfonyTransport(config("mail.mailers.{$mailerName}")),
            );
            $event->message->from(new Address($setting->sender_email, $setting->sender_name));
        });
    }
}
