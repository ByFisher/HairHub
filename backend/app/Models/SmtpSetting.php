<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

#[Fillable([
    'sender_name',
    'sender_email',
    'smtp_mailer',
    'smtp_host',
    'smtp_port',
    'smtp_username',
    'smtp_password',
    'smtp_encryption',
])]
#[Hidden(['smtp_password'])]
class SmtpSetting extends Model
{
    public function decryptedPassword(): string
    {
        return Crypt::decryptString($this->smtp_password);
    }
}
