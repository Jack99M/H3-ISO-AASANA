<?php

use App\Http\Controllers\AirlineController;
use App\Http\Controllers\AirportController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\FlightController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ReportController;
use Illuminate\Support\Facades\Route;

/*
| Cada ruta autenticada usa auth:sanctum y role. Los tres roles (admin, operador, publico)
| pueden leer y suscribirse; operador y admin además mutan vuelos, aerolíneas, aeropuertos y notifican.
*/

Route::post('/auth/login', [AuthController::class, 'login']);

// Tablero en pantalla pública: lectura de llegadas/salidas y catálogo de aeropuertos
Route::prefix('public')->group(function () {
    Route::get('/airports', [AirportController::class, 'index']);
    Route::get('/flights/arrivals', [FlightController::class, 'arrivals']);
    Route::get('/flights/departures', [FlightController::class, 'departures']);
});

Route::middleware(['auth:sanctum', 'role:admin,operador,publico'])->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    Route::get('/flights/arrivals', [FlightController::class, 'arrivals']);
    Route::get('/flights/departures', [FlightController::class, 'departures']);
    Route::get('/flights', [FlightController::class, 'index']);
    Route::get('/flights/{flight}', [FlightController::class, 'show']);

    Route::get('/airlines', [AirlineController::class, 'index']);
    Route::get('/airlines/{airline}', [AirlineController::class, 'show']);

    Route::get('/airports', [AirportController::class, 'index']);
    Route::get('/airports/{airport}', [AirportController::class, 'show']);

    Route::get('/reports/punctuality', [ReportController::class, 'punctuality']);
    Route::get('/reports/daily-summary', [ReportController::class, 'dailySummary']);
    Route::get('/reports/delays', [ReportController::class, 'delays']);

    Route::post('/flights/{flight}/subscribe', [NotificationController::class, 'subscribe']);
});

Route::middleware(['auth:sanctum', 'role:admin,operador'])->group(function () {
    Route::post('/flights', [FlightController::class, 'store']);
    Route::patch('/flights/{flight}', [FlightController::class, 'update']);
    Route::put('/flights/{flight}', [FlightController::class, 'update']);
    Route::delete('/flights/{flight}', [FlightController::class, 'destroy']);
    Route::patch('/flights/{flight}/status', [FlightController::class, 'updateStatus']);

    Route::post('/airlines', [AirlineController::class, 'store']);
    Route::patch('/airlines/{airline}', [AirlineController::class, 'update']);
    Route::put('/airlines/{airline}', [AirlineController::class, 'update']);
    Route::delete('/airlines/{airline}', [AirlineController::class, 'destroy']);

    Route::post('/airports', [AirportController::class, 'store']);
    Route::patch('/airports/{airport}', [AirportController::class, 'update']);
    Route::put('/airports/{airport}', [AirportController::class, 'update']);
    Route::delete('/airports/{airport}', [AirportController::class, 'destroy']);

    Route::post('/flights/{flight}/notify', [NotificationController::class, 'send']);
});
