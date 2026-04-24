<?php

namespace App\Http\Controllers;

use App\Models\Flight;
use App\Models\Notification;
use App\Models\PassengerSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Suscribirse a un vuelo (crear o actualizar suscriptor).
     */
    public function subscribe(Request $request, Flight $flight): JsonResponse
    {
        $validated = $request->validate([
            'passenger_email' => ['required', 'email', 'max:255'],
            'passenger_name' => ['required', 'string', 'max:255'],
        ]);

        $sub = PassengerSubscription::updateOrCreate(
            [
                'flight_id' => $flight->id,
                'passenger_email' => $validated['passenger_email'],
            ],
            [
                'passenger_name' => $validated['passenger_name'],
            ]
        );

        $code = $sub->wasRecentlyCreated ? 201 : 200;

        return response()->json([
            'message' => $sub->wasRecentlyCreated
                ? 'Suscripción registrada.'
                : 'Suscripción actualizada.',
            'data' => $sub->load('flight'),
        ], $code);
    }

    /**
     * Simular envío de notificación (registro sin correo real).
     */
    public function send(Request $request, Flight $flight): JsonResponse
    {
        $validated = $request->validate([
            'passenger_email' => ['required', 'email', 'max:255'],
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $n = Notification::create([
            'flight_id' => $flight->id,
            'passenger_email' => $validated['passenger_email'],
            'message' => $validated['message'],
            'sent_at' => now(),
        ]);

        $n->load('flight');

        return response()->json([
            'message' => 'Notificación registrada (simulada).',
            'data' => $n,
        ], 201);
    }
}
