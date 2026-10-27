<?php

namespace App\Mail;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Symfony\Component\Mailer\Envelope;
use Symfony\Component\Mailer\Exception\TransportException;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;
use Symfony\Component\Mime\Message;
use Symfony\Component\Mime\MessageConverter;

class ResendApiTransport extends AbstractTransport
{
    public function __construct(private readonly string $apiKey)
    {
        parent::__construct();
    }

    protected function doSend(SentMessage $message): void
    {
        $email = MessageConverter::toEmail($message->getOriginalMessage());
        $envelope = $message->getEnvelope();
        $payload = array_filter([
            'from' => $envelope->getSender()->toString(),
            'to' => $this->formatAddresses($this->resendRecipients($email, $envelope)),
            'cc' => $this->formatAddresses($email->getCc()),
            'bcc' => $this->formatAddresses($email->getBcc()),
            'reply_to' => $this->formatAddresses($email->getReplyTo()),
            'headers' => $this->headers($email),
            'subject' => $email->getSubject(),
            'html' => $email->getHtmlBody(),
            'text' => $email->getTextBody(),
            'attachments' => $this->attachments($email),
        ], static fn (mixed $value): bool => $value !== null && $value !== '' && $value !== []);

        try {
            $response = Http::withToken($this->apiKey)
                ->acceptJson()
                ->post('https://api.resend.com/emails', $payload);
        } catch (ConnectionException $exception) {
            throw new TransportException('Request to Resend API failed to connect.', 0, $exception);
        }

        if (! $response->successful()) {
            throw new TransportException(sprintf(
                'Request to Resend API failed with HTTP status %d: %s',
                $response->status(),
                $response->body(),
            ));
        }

        $messageId = $response->json('id');

        if (! is_string($messageId) || $messageId === '') {
            throw new TransportException('Resend API response did not contain an email ID.');
        }

        $message->setMessageId($messageId);

        if ($message->getOriginalMessage() instanceof Message) {
            $message->getOriginalMessage()->getHeaders()->addHeader('X-Resend-Email-ID', $messageId);
        }
    }

    /**
     * @param  array<int, Address>  $addresses
     * @return array<int, string>
     */
    private function formatAddresses(array $addresses): array
    {
        return array_map(static fn (Address $address): string => $address->toString(), $addresses);
    }

    /**
     * @return array<int, Address>
     */
    private function resendRecipients(Email $email, Envelope $envelope): array
    {
        $copyRecipients = [...$email->getCc(), ...$email->getBcc()];

        return array_values(array_filter(
            $envelope->getRecipients(),
            static fn (Address $address): bool => ! in_array($address, $copyRecipients, true),
        ));
    }

    /**
     * @return array<string, string>
     */
    private function headers(Email $email): array
    {
        $excluded = ['from', 'to', 'cc', 'bcc', 'reply-to', 'sender', 'subject', 'content-type'];
        $headers = [];

        foreach ($email->getHeaders()->all() as $name => $header) {
            if (! in_array(strtolower($name), $excluded, true)) {
                $headers[$header->getName()] = $header->getBodyAsString();
            }
        }

        return $headers;
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function attachments(Email $email): array
    {
        $attachments = [];

        foreach ($email->getAttachments() as $attachment) {
            $headers = $attachment->getPreparedHeaders();
            $contentType = $headers->get('Content-Type')->getBody();
            $disposition = $headers->getHeaderBody('Content-Disposition');
            $filename = $headers->getHeaderParameter('Content-Disposition', 'filename') ?? 'attachment';

            $item = [
                'content_type' => $contentType,
                'content' => $contentType === 'text/calendar'
                    ? $attachment->getBody()
                    : str_replace("\r\n", '', $attachment->bodyToString()),
                'filename' => $filename,
            ];

            if ($disposition === 'inline') {
                $item['content_id'] = $attachment->hasContentId()
                    ? $attachment->getContentId()
                    : $filename;
            }

            $attachments[] = $item;
        }

        return $attachments;
    }

    public function __toString(): string
    {
        return 'resend_api';
    }
}
