<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PasswordResetNotification extends Notification
{
    use Queueable;

    public function __construct(
        #[\SensitiveParameter]
        public readonly string $token,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $resetUrl = rtrim((string) config('services.frontend_url'), '/').'/reset-password?'.http_build_query([
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ], '', '&', PHP_QUERY_RFC3986);
        $viewData = [
            'name' => $notifiable->name,
            'resetUrl' => $resetUrl,
            'expiresIn' => 30,
        ];

        return (new MailMessage)
            ->subject('HairHub şifre sıfırlama bağlantısı')
            ->view('emails.password-reset', $viewData)
            ->text('emails.password-reset-text', $viewData);
    }
}
