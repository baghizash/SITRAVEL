<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Modifikasi ENUM untuk tambah nilai 'driver'
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin_app','travel','manager','pengguna','driver') NOT NULL DEFAULT 'pengguna'");
    }

    public function down(): void
    {
        // Hapus nilai 'driver' — pastikan tidak ada data driver dulu sebelum rollback
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin_app','travel','manager','pengguna') NOT NULL DEFAULT 'pengguna'");
    }
};
