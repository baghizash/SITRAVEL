<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::statement("ALTER TABLE bookings MODIFY COLUMN status ENUM('confirmed','cancelled','completed','no_show') NOT NULL DEFAULT 'confirmed'");
    }

    public function down(): void
    {
        // Hapus data status baru sebelum rollback
        DB::statement("UPDATE bookings SET status = 'confirmed' WHERE status IN ('completed','no_show')");
        DB::statement("ALTER TABLE bookings MODIFY COLUMN status ENUM('confirmed','cancelled') NOT NULL DEFAULT 'confirmed'");
    }
};
