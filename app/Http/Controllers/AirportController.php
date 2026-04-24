<?php

namespace App\Http\Controllers;

use App\Models\Airport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AirportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Airport::query()->orderBy('name');
        if ($request->filled('search')) {
            $s = $request->string('search');
            $like = '%'.$s.'%';
            $q->where(function ($query) use ($like) {
                $query->whereRaw('LOWER(name) LIKE LOWER(?)', [$like])
                    ->orWhereRaw('LOWER(code) LIKE LOWER(?)', [$like])
                    ->orWhereRaw('LOWER(city) LIKE LOWER(?)', [$like]);
            });
        }
        if ($request->filled('department')) {
            $q->where('department', $request->string('department'));
        }
        $perPage = min(max((int) $request->input('per_page', 20), 1), 100);

        return response()->json([
            'data' => $q->paginate($perPage),
        ], 200);
    }

    public function show(Airport $airport): JsonResponse
    {
        return response()->json([
            'data' => $airport,
        ], 200);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:8', 'unique:airports,code'],
            'name' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:255'],
            'department' => ['required', 'string', 'max:255'],
        ]);

        $airport = Airport::create($validated);

        return response()->json([
            'message' => 'Aeropuerto creado.',
            'data' => $airport,
        ], 201);
    }

    public function update(Request $request, Airport $airport): JsonResponse
    {
        $validated = $request->validate([
            'code' => [
                'sometimes',
                'string',
                'max:8',
                Rule::unique('airports', 'code')->ignore($airport->id),
            ],
            'name' => ['sometimes', 'string', 'max:255'],
            'city' => ['sometimes', 'string', 'max:255'],
            'department' => ['sometimes', 'string', 'max:255'],
        ]);

        $airport->update($validated);

        return response()->json([
            'message' => 'Aeropuerto actualizado.',
            'data' => $airport,
        ], 200);
    }

    public function destroy(Airport $airport): JsonResponse
    {
        $airport->delete();

        return response()->json(null, 204);
    }
}
