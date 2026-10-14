<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('ADMIN_BOOTSTRAP_EMAIL');
        $password = env('ADMIN_BOOTSTRAP_PASSWORD');

        if ($email && $password) {
            User::query()->updateOrCreate(
                ['email' => $email],
                [
                    'name' => 'HairHub Süper Admin',
                    'password' => Hash::make($password),
                    'role' => 'super_admin',
                    'status' => 'active',
                ],
            );

            return;
        }

        User::query()->updateOrCreate(
            ['email' => 'admin@hementiras.com'],
            [
                'name' => 'HemenTıraş Süper Admin',
                'password' => Hash::make('Password123!'),
                'role' => 'super_admin',
                'status' => 'active',
            ],
        );
    }
}
