<?php

namespace App\Http\Controllers;

use App\Models\Airline;
use App\Models\Flight;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Puntualidad: porcentaje de vuelos sin retraso ni cancelación (respecto al total atendido).
     */
    public function punctuality(Request $request): JsonResponse
    {
        $request->validate([
            'airline_id' => ['required', 'integer', 'exists:airlines,id'],
            'date' => ['nullable', 'date'],
        ]);

        $airline = Airline::findOrFail($request->integer('airline_id'));

        $q = Flight::query()->where('airline_id', $airline->id);
        if ($request->filled('date')) {
            $d = $request->date('date')->format('Y-m-d');
            $q->whereDate('scheduled_departure', $d);
        }

        $total = (clone $q)->count();
        if ($total === 0) {
            return response()->json([
                'data' => [
                    'airline' => $airline,
                    'date' => $request->input('date'),
                    'total_flights' => 0,
                    'retrasados' => 0,
                    'cancelados' => 0,
                    'a_tiempo' => 0,
                    'punctuality_percent' => null,
                ],
            ], 200);
        }

        $retrasados = (clone $q)->where('status', 'retrasado')->count();
        $cancelados = (clone $q)->where('status', 'cancelado')->count();
        $aTiempo = $total - $retrasados - $cancelados;
        if ($aTiempo < 0) {
            $aTiempo = 0;
        }
        $percent = round(100 * $aTiempo / $total, 2);

        return response()->json([
            'data' => [
                'airline' => $airline,
                'date' => $request->input('date'),
                'total_flights' => $total,
                'retrasados' => $retrasados,
                'cancelados' => $cancelados,
                'a_tiempo' => $aTiempo,
                'punctuality_percent' => $percent,
            ],
        ], 200);
    }

    /**
     * Resumen diario: conteo de vuelos por estado (según fecha de salida programada).
     */
    public function dailySummary(Request $request): JsonResponse
    {
        $request->validate([
            'date' => ['required', 'date'],
        ]);

        $d = $request->date('date')->format('Y-m-d');

        $rows = Flight::query()
            ->whereDate('scheduled_departure', $d)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        $statuses = ['programado', 'abordando', 'despego', 'cancelado', 'retrasado'];
        $byStatus = [];
        foreach ($statuses as $s) {
            $row = $rows->get($s);
            $byStatus[$s] = $row ? (int) $row->count : 0;
        }
        $total = array_sum($byStatus);

        return response()->json([
            'data' => [
                'date' => $d,
                'total_flights' => $total,
                'by_status' => $byStatus,
            ],
        ], 200);
    }

    /**
     * Vuelos con retraso declarado o salida real posterior a la programada.
     */
    public function delays(Request $request): JsonResponse
    {
        $request->validate([
            'airline_id' => ['nullable', 'integer', 'exists:airlines,id'],
            'date' => ['nullable', 'date'],
        ]);

        $q = Flight::query()
            ->with(['airline', 'originAirport', 'destinationAirport'])
            ->where(function ($query) {
                $query->where('status', 'retrasado')
                    ->orWhereColumn('actual_departure', '>', 'scheduled_departure');
            });

        if ($request->filled('airline_id')) {
            $q->where('airline_id', $request->integer('airline_id'));
        }
        if ($request->filled('date')) {
            $d = $request->date('date')->format('Y-m-d');
            $q->whereDate('scheduled_departure', $d);
        }

        $q->orderBy('scheduled_departure');
        $perPage = min(max((int) $request->input('per_page', 20), 1), 100);

        return response()->json([
            'data' => $q->paginate($perPage),
        ], 200);
    }
}
