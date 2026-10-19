<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'title',
    'introduction',
    'message',
    'support_email',
    'support_phone',
    'working_hours',
    'faqs',
])]
class SupportPageContent extends Model
{
    protected function casts(): array
    {
        return [
            'faqs' => 'array',
        ];
    }
}
