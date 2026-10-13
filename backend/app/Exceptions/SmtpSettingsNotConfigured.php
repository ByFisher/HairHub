<?php

namespace App\Exceptions;

use RuntimeException;

class SmtpSettingsNotConfigured extends RuntimeException
{
    public function __construct()
    {
        parent::__construct('SMTP settings must be configured by a super administrator before sending email.');
    }
}
