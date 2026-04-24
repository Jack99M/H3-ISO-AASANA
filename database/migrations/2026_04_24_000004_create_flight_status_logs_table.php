<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('flight_status_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('flight_id')->constrained('flights')->cascadeOnDelete();
            $table->enum('previous_status', ['programado', 'abordando', 'despego', 'cancelado', 'retrasado'])->nullable();
            $table->enum('new_status', ['programado', 'abordando', 'despego', 'cancelado', 'retrasado']);
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('reason')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['flight_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('flight_status_logs');
    }
};

