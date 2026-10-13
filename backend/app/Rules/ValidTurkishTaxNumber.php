<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ValidTurkishTaxNumber implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || preg_match('/^\d{10,11}$/D', $value) !== 1) {
            $fail('10 haneli VKN veya 11 haneli TCKN girin.');

            return;
        }

        if (strlen($value) === 10 && ! $this->isValidVkn($value)) {
            $fail('Geçerli bir Vergi Kimlik Numarası giriniz.');
        }
    }

    private function isValidVkn(string $value): bool
    {
        if (preg_match('/^(\d)\1{9}$/D', $value) === 1) {
            return false;
        }

        $sum = 0;
        for ($index = 0; $index < 9; $index++) {
            $digit = ((int) $value[$index] + 9 - $index) % 10;
            $digit = ($digit * (2 ** (9 - $index))) % 9;
            $sum += $digit === 0 ? 9 : $digit;
        }

        return (10 - ($sum % 10)) % 10 === (int) $value[9];
    }
}
