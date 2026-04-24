<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('flights', function (Blueprint $table) {
            $table->id();
            $table->string('flight_code', 16)->index();
            $table->foreignId('airline_id')->constrained('airlines')->cascadeOnDelete();
            $table->foreignId('origin_airport_id')->constrained('airports')->cascadeOnDelete();
            $table->foreignId('destination_airport_id')->constrained('airports')->cascadeOnDelete();
            $table->timestamp('scheduled_departure');
            $table->timestamp('scheduled_arrival');
            $table->timestamp('actual_departure')->nullable();
            $table->timestamp('actual_arrival')->nullable();
            $table->enum('status', ['programado', 'abordando', 'despego', 'cancelado', 'retrasado'])->default('programado')->index();
            $table->string('gate', 16)->nullable();
            $table->timestamps();

            $table->index(['origin_airport_id', 'scheduled_departure']);
            $table->index(['destination_airport_id', 'scheduled_arrival']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('flights');
    }
};

