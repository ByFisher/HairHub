<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('support_page_contents', function (Blueprint $table) {
            $table->id();
            $table->string('title', 160);
            $table->text('introduction');
            $table->text('message');
            $table->string('support_email')->nullable();
            $table->string('support_phone', 40)->nullable();
            $table->string('working_hours', 200)->nullable();
            $table->json('faqs');
            $table->timestamps();
        });

        DB::table('support_page_contents')->insert([
            'id' => 1,
            'title' => 'Size nasıl yardımcı olabiliriz?',
            'introduction' => 'HairHub kullanımıyla ilgili yanıtları ve destek iletişim bilgilerini burada bulabilirsiniz.',
            'message' => 'Destek iletişim bilgilerini ve sık sorulan soruları aşağıda bulabilirsiniz.',
            'support_email' => null,
            'support_phone' => null,
            'working_hours' => null,
            'faqs' => json_encode([
                [
                    'question' => 'Nasıl randevu alabilirim?',
                    'answer' => 'Salonları keşfedin, istediğiniz salonu ve hizmeti seçin; ardından uygun gün ve saati belirleyerek randevu talebinizi oluşturun.',
                ],
                [
                    'question' => 'Randevularımı nereden görebilirim?',
                    'answer' => 'Hesabınıza giriş yaptıktan sonra randevularım sayfasından randevularınızı görüntüleyebilirsiniz.',
                ],
                [
                    'question' => 'İşletmemi HairHub’a nasıl ekleyebilirim?',
                    'answer' => 'İşletme hesabı oluştur bağlantısından başvurunuzu gönderin. Başvurunuz yönetim ekibi tarafından incelenir.',
                ],
            ], JSON_THROW_ON_ERROR),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('support_page_contents');
    }
};
