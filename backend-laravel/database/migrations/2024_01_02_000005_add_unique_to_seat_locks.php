<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('seat_locks', function (Blueprint $table) {
            // Satu kursi di satu jadwal hanya boleh dikunci oleh satu session aktif.
            // Ini mencegah race condition di level DB.
            $table->unique(['schedule_uid', 'seat_number'], 'seat_locks_schedule_seat_unique');
        });
    }

    public function down(): void
    {
        Schema::table('seat_locks', function (Blueprint $table) {
            $table->dropUnique('seat_locks_schedule_seat_unique');
        });
    }
};
