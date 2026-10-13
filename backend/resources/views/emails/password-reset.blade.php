<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>HairHub şifre sıfırlama</title>
</head>
<body style="margin:0;background:#f4f4f5;padding:32px 16px;font-family:Arial,sans-serif;color:#18181b">
    <table role="presentation" style="width:100%;max-width:560px;margin:0 auto;border:1px solid #e4e4e7;border-radius:12px;background:#fff">
        <tr>
            <td style="padding:32px">
                <h1 style="margin:0 0 20px;font-size:22px">Şifrenizi yenileyin</h1>
                <p style="font-size:15px;line-height:1.6">Merhaba {{ $name }},</p>
                <p style="font-size:15px;line-height:1.6">HairHub hesabınız için şifre sıfırlama isteği aldık. Yeni bir şifre belirlemek için aşağıdaki bağlantıyı kullanın. Bağlantı {{ $expiresIn }} dakika geçerlidir.</p>
                <p style="margin:28px 0">
                    <a href="{{ $resetUrl }}" style="display:inline-block;border-radius:6px;background:#18181b;padding:13px 20px;color:#fff;text-decoration:none">Şifremi yenile</a>
                </p>
                <p style="font-size:13px;line-height:1.6;color:#52525b">Buton çalışmazsa bu adresi tarayıcınıza kopyalayın:</p>
                <p style="font-size:12px;line-height:1.6;word-break:break-all"><a href="{{ $resetUrl }}" style="color:#27272a">{{ $resetUrl }}</a></p>
                <p style="font-size:13px;line-height:1.6;color:#52525b">Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz; şifreniz değiştirilmeyecektir.</p>
            </td>
        </tr>
    </table>
</body>
</html>
