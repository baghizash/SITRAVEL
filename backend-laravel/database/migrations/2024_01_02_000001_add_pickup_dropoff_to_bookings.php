<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // Lokasi jemput: wajib diisi penumpang saat booking
            $table->string('pickup_location')->nullable()->after('notes');
            // Lokasi turun: opsional, default sama dengan kota tujuan
            $table->string('dropoff_location')->nullable()->after('pickup_location');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['pickup_location', 'dropoff_location']);
        });
    }
};
