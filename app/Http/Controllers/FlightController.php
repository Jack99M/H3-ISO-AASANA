<?php

namespace App\Http\Controllers;

use App\Models\Flight;
use App\Models\FlightStatusLog;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FlightController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Flight::query()
            ->with(['airline', 'originAirport', 'destinationAirport']);

        if ($request->filled('airline_id')) {
            $query->where('airline_id', $request->integer('airline_id'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }
        if ($request->filled('date')) {
            $d = $request->date('date')->format('Y-m-d');
            $query->whereDate('scheduled_departure', $d);
        }

        $perPage = min(max((int) $request->input('per_page', 15), 1), 100);
        $flights = $query->orderBy('scheduled_departure')->paginate($perPage);

        return response()->json([
            'data' => $flights,
        ], 200);
    }

    public function show(Flight $flight): JsonResponse
    {
        $flight->load(['airline', 'originAirport', 'destinationAirport', 'statusLogs']);

        return response()->json([
            'data' => $flight,
        ], 200);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'flight_code' => ['required', 'string', 'max:16'],
            'airline_id' => ['required', 'integer', 'exists:airlines,id'],
            'origin_airport_id' => ['required', 'integer', 'exists:airports,id'],
            'destination_airport_id' => ['required', 'integer', 'exists:airports,id', 'different:origin_airport_id'],
            'scheduled_departure' => ['required', 'date'],
            'scheduled_arrival' => ['required', 'date', 'after:scheduled_departure'],
            'actual_departure' => ['nullable', 'date'],
            'actual_arrival' => ['nullable', 'date'],
            'status' => ['required', 'in:programado,abordando,despego,cancelado,retrasado'],
            'gate' => ['nullable', 'string', 'max:16'],
        ]);

        $flight = DB::transaction(function () use ($validated, $request) {
            $f = Flight::create($validated);
            FlightStatusLog::create([
                'flight_id' => $f->id,
                'previous_status' => null,
                'new_status' => $f->status,
                'changed_by' => $request->user()->id,
                'reason' => 'Creación de vuelo',
                'created_at' => now(),
            ]);

            return $f;
        });

        $flight->load(['airline', 'originAirport', 'destinationAirport']);

        return response()->json([
            'message' => 'Vuelo creado.',
            'data' => $flight,
        ], 201);
    }

    public function update(Request $request, Flight $flight): JsonResponse
    {
        $validated = $request->validate([
            'flight_code' => ['sometimes', 'string', 'max:16'],
            'airline_id' => ['sometimes', 'integer', 'exists:airlines,id'],
            'origin_airport_id' => ['sometimes', 'integer', 'exists:airports,id'],
            'destination_airport_id' => ['sometimes', 'integer', 'exists:airports,id'],
            'scheduled_departure' => ['sometimes', 'date'],
            'scheduled_arrival' => ['sometimes', 'date'],
            'actual_departure' => ['nullable', 'date'],
            'actual_arrival' => ['nullable', 'date'],
            'status' => ['sometimes', 'in:programado,abordando,despego,cancelado,retrasado'],
            'gate' => ['nullable', 'string', 'max:16'],
        ]);

        $dep = isset($validated['scheduled_departure'])
            ? Carbon::parse($validated['scheduled_departure'])
            : $flight->scheduled_departure;
        $arr = isset($validated['scheduled_arrival'])
            ? Carbon::parse($validated['scheduled_arrival'])
            : $flight->scheduled_arrival;
        if ($dep && $arr && $arr->lessThanOrEqualTo($dep)) {
            return response()->json([
                'message' => 'La llegada programada debe ser posterior a la salida programada.',
            ], 422);
        }

        $flight->update($validated);
        $flight->load(['airline', 'originAirport', 'destinationAirport']);

        return response()->json([
            'message' => 'Vuelo actualizado.',
            'data' => $flight,
        ], 200);
    }

    public function destroy(Flight $flight): JsonResponse
    {
        $flight->delete();

        return response()->json(null, 204);
    }

    public function updateStatus(Request $request, Flight $flight): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:programado,abordando,despego,cancelado,retrasado'],
            'reason' => ['nullable', 'string', 'max:500'],
            'actual_departure' => ['nullable', 'date'],
            'actual_arrival' => ['nullable', 'date'],
            'gate' => ['nullable', 'string', 'max:16'],
        ]);

        $previous = $flight->status;

        DB::transaction(function () use ($flight, $validated, $previous, $request) {
            $updates = array_filter(
                array_intersect_key(
                    $validated,
                    array_flip(['status', 'actual_departure', 'actual_arrival', 'gate'])
                ),
                fn ($v) => $v !== null
            );
            if ($updates !== []) {
                $flight->update($updates);
            }

            FlightStatusLog::create([
                'flight_id' => $flight->id,
                'previous_status' => $previous,
                'new_status' => $flight->status,
                'changed_by' => $request->user()->id,
                'reason' => $validated['reason'] ?? null,
                'created_at' => now(),
            ]);
        });

        $flight->refresh()->load(['airline', 'originAirport', 'destinationAirport']);

        return response()->json([
            'message' => 'Estado de vuelo actualizado.',
            'data' => $flight,
        ], 200);
    }

    public function arrivals(Request $request): JsonResponse
    {
        $request->validate([
            'airport_id' => ['required', 'integer', 'exists:airports,id'],
            'date' => ['nullable', 'date'],
        ]);

        $airportId = (int) $request->airport_id;
        $q = Flight::query()
            ->where('destination_airport_id', $airportId)
            ->with(['airline', 'originAirport', 'destinationAirport'])
            ->orderBy('scheduled_arrival');

        if ($request->filled('date')) {
            $d = $request->date('date')->format('Y-m-d');
            $q->whereDate('scheduled_arrival', $d);
        }

        $perPage = min(max((int) $request->input('per_page', 20), 1), 100);

        return response()->json([
            'data' => $q->paginate($perPage),
        ], 200);
    }

    public function departures(Request $request): JsonResponse
    {
        $request->validate([
            'airport_id' => ['required', 'integer', 'exists:airports,id'],
            'date' => ['nullable', 'date'],
        ]);

        $airportId = (int) $request->airport_id;
        $q = Flight::query()
            ->where('origin_airport_id', $airportId)
            ->with(['airline', 'originAirport', 'destinationAirport'])
            ->orderBy('scheduled_departure');

        if ($request->filled('date')) {
            $d = $request->date('date')->format('Y-m-d');
            $q->whereDate('scheduled_departure', $d);
        }

        $perPage = min(max((int) $request->input('per_page', 20), 1), 100);

        return response()->json([
            'data' => $q->paginate($perPage),
        ], 200);
    }
}
