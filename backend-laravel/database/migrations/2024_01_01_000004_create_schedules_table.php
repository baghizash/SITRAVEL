<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->string('uid')->unique();
            $table->string('travel_uid');
            $table->string('origin');
            $table->string('destination');
            $table->date('depart_date');
            $table->string('depart_time', 5); // HH:MM
            $table->integer('price');
            $table->integer('total_seats')->default(16);
            $table->string('vehicle')->default('Minibus 16 Seat');
            $table->timestamps();

            $table->index(['origin', 'destination', 'depart_date']);
            $table->index('travel_uid');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};
