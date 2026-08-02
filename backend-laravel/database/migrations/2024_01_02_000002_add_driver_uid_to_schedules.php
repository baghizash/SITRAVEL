<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            // Supir yang ditugaskan loket untuk jadwal ini (nullable — bisa belum diassign)
            $table->string('driver_uid')->nullable()->after('travel_uid');
            $table->index('driver_uid');
        });
    }

    public function down(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            $table->dropIndex(['driver_uid']);
            $table->dropColumn('driver_uid');
        });
    }
};
