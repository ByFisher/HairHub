<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework.

In addition, [Laracasts](https://laracasts.com) contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

You can also watch bite-sized lessons with real-world projects on [Laravel Learn](https://laravel.com/learn), where you will be guided through building a Laravel application from scratch while learning PHP fundamentals.

## Agentic Development

Laravel's predictable structure and conventions make it ideal for AI coding agents like Claude Code, Cursor, and GitHub Copilot. Install [Laravel Boost](https://laravel.com/docs/ai) to supercharge your AI workflow:

```bash
composer require laravel/boost --dev

php artisan boost:install
```

Boost provides your agent 15+ tools and skills that help agents build Laravel applications while following best practices.

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).

## Konum API'si

Müşteri kayıt ve dükkan arama ekranları Türkiye'deki tüm illeri `GET /api/v1/locations/cities` üzerinden alır. Seçilen ile ait ilçeler `GET /api/v1/locations/districts?city=İstanbul` endpoint'iyle yüklenir. Bu endpoint'ler kayıt ekranında kullanılabilmeleri için herkese açıktır.

Müşteri kayıt istekleri `city` ve `district` adlarını birlikte gönderir; API seçilen ilçe adının seçilen ile ait olduğunu doğrular ve bu değerleri kullanıcı profilinde saklar. Konum listesi [`merkdev/turkiye-iller-ilceler-php-array`](https://github.com/merkdev/Turkiye-iller-ilceler-PHP-Array) paketinden gelir (MIT lisansı).

## Ziyaretçi erişimi ve müşteri yetkileri

Dükkan arama, dükkan/personel/hizmet detayları, yorumların listelenmesi ve müsait saatlerin okunması herkese açıktır. Randevu oluşturma, listeleme, iptal/değerlendirme ve favorileri listeleme/ekleme/çıkarma `auth:sanctum` oturumu ve `role:customer` middleware'i arkasındadır. Favoriler `shop_favorites` tablosunda müşteri ve dükkan başına tekil kayıt olarak saklanır.

## Render dağıtımı

Render'daki Next.js servisi tek başına Laravel API uçlarını sağlamaz. Bu repodaki `render.yaml`, Laravel API servisini ve PostgreSQL veritabanını Render Blueprint olarak tanımlar:

1. Render Dashboard'da **New + → Blueprint** seçip bu GitHub deposunu bağlayın. `render.yaml` içindeki ücretsiz `hairhub-api` servisi ve `hairhub-db` PostgreSQL veritabanını oluşturun.
2. Blueprint kurulumu istediğinde `APP_KEY` için backend dizininde `php artisan key:generate --show` komutuyla üretilen değeri girin. Anahtarı Git'e eklemeyin. Servis `/up` sağlık kontrolü kullanır; container açılırken migration'lar otomatik çalışır.
3. Blueprint tamamlandıktan sonra `hairhub-api` servisinin Render URL'sini alın ve mevcut Next.js frontend servisinin Environment bölümünde `LARAVEL_API_URL` değerini bu API URL'sine ayarlayın. Bu değişken production build sırasında zorunludur. Ardından frontend'i yeniden deploy edin.

Blueprint, Laravel Web Service için aşağıdaki ortamı ayarlar:

   ```env
   APP_ENV=production
   APP_DEBUG=false
   APP_KEY=<Render Blueprint oluştururken girin>
   APP_URL=https://hairhub-api.onrender.com
   DB_CONNECTION=pgsql
   DB_URL=<Render PostgreSQL connection string>
   FRONTEND_URL=https://hairhub-hv62.onrender.com
   FRONTEND_URLS=https://hairhub-hv62.onrender.com
   SANCTUM_STATEFUL_DOMAINS=hairhub-hv62.onrender.com
   SESSION_DRIVER=database
   SESSION_SECURE_COOKIE=true
   LOG_CHANNEL=stderr
   ```

   `SESSION_DOMAIN` ayarlamayın; oturum çerezleri frontend domaininden aynı-origin Next.js proxy üzerinden taşınır. `APP_KEY` ve veritabanı bağlantısını gizli tutun; Git'e eklemeyin.
4. `NEXT_PUBLIC_API_URL` gerekmez: tarayıcı istekleri aynı origin'deki Next.js proxy'sine gönderilir; Next.js `/api/*` ve `/sanctum/*` isteklerini `LARAVEL_API_URL` ile Laravel servisine iletir. Bu, Render'ın farklı alt alan adlarında Sanctum çerezlerinin tarayıcı tarafından engellenmesini önler.
5. Canlı API sağlık kontrolü `https://<laravel-api-render-adresi>/up` adresinde `200` dönmelidir.

Blueprint ücretsiz plan kullanır; Render'ın ücretsiz veritabanı ve servis planları süre, uyku ve kalıcılık sınırlarına sahiptir. Canlı veriye geçmeden önce bu sınırları kontrol edip uygun ücretli planı seçin. Yüklenen görsel ve belgeler container dosya sisteminde tutulur; deploy/restart sonrasında korunmaları gerekiyorsa kalıcı disk veya S3 uyumlu depolama yapılandırın.
