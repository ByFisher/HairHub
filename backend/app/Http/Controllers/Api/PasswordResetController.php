<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\SmtpSettingsNotConfigured;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;

class PasswordResetController extends Controller
{
    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255'],
        ]);

        try {
            Password::sendResetLink($data);
        } catch (TransportExceptionInterface|SmtpSettingsNotConfigured $exception) {
            Log::error('Password reset email delivery failed.', [
                'exception' => $exception,
            ]);
        }

        return response()->json([
            'message' => 'Eğer e-posta adresiniz sistemimizde kayıtlıysa şifre sıfırlama bağlantısı gönderildi.',
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:12', 'confirmed'],
        ]);

        $status = Password::reset($data, function (User $user, string $password): void {
            $user->forceFill([
                'password' => Hash::make($password),
                'remember_token' => Str::random(60),
            ])->save();

            event(new PasswordReset($user));
        });

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'token' => ['Bağlantı geçersiz veya süresi dolmuş. Yeni bir şifre sıfırlama bağlantısı isteyin.'],
            ]);
        }

        return response()->json([
            'message' => 'Şifreniz başarıyla güncellendi.',
        ]);
    }
}
