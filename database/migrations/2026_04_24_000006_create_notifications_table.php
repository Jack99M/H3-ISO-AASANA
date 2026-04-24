<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('flight_id')->constrained('flights')->cascadeOnDelete();
            $table->string('passenger_email')->index();
            $table->text('message');
            $table->timestamp('sent_at')->nullable()->index();
            $table->timestamps();

            $table->index(['flight_id', 'passenger_email']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};

