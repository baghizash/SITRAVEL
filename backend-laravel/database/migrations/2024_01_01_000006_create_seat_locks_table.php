<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('seat_locks', function (Blueprint $table) {
            $table->id();
            $table->string('schedule_uid');
            $table->integer('seat_number');
            $table->string('session_id');
            $table->timestamp('expires_at');
            $table->timestamp('locked_at')->useCurrent();

            $table->index(['schedule_uid', 'seat_number']);
            $table->index('expires_at');
            $table->index('session_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seat_locks');
    }
};
