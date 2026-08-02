<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('uid')->unique();
            $table->string('booking_code')->unique();
            $table->string('user_uid');
            $table->string('schedule_uid');
            $table->string('travel_uid');
            $table->string('origin');
            $table->string('destination');
            $table->date('depart_date');
            $table->string('depart_time', 5);
            $table->integer('price');
            $table->integer('seat_number');
            $table->string('passenger_name');
            $table->string('passenger_phone');
            $table->text('notes')->nullable();
            $table->enum('status', ['confirmed', 'cancelled'])->default('confirmed');
            $table->json('reschedule_history')->nullable();
            $table->timestamp('rescheduled_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index('user_uid');
            $table->index('schedule_uid');
            $table->index('travel_uid');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
