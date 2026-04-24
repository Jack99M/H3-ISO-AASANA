<?php

namespace App\Http\Controllers;

use App\Models\Airline;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AirlineController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Airline::query()->orderBy('name');
        if ($request->filled('search')) {
            $s = $request->string('search');
            $like = '%'.$s.'%';
            $q->where(function ($query) use ($like) {
                $query->whereRaw('LOWER(name) LIKE LOWER(?)', [$like])
                    ->orWhereRaw('LOWER(code) LIKE LOWER(?)', [$like]);
            });
        }
        $perPage = min(max((int) $request->input('per_page', 20), 1), 100);

        return response()->json([
            'data' => $q->paginate($perPage),
        ], 200);
    }

    public function show(Airline $airline): JsonResponse
    {
        return response()->json([
            'data' => $airline,
        ], 200);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:8', 'unique:airlines,code'],
            'country' => ['required', 'string', 'max:255'],
        ]);

        $airline = Airline::create($validated);

        return response()->json([
            'message' => 'Aerolínea creada.',
            'data' => $airline,
        ], 201);
    }

    public function update(Request $request, Airline $airline): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'code' => ['sometimes', 'string', 'max:8', 'unique:airlines,code,'.$airline->id],
            'country' => ['sometimes', 'string', 'max:255'],
        ]);

        $airline->update($validated);

        return response()->json([
            'message' => 'Aerolínea actualizada.',
            'data' => $airline,
        ], 200);
    }

    public function destroy(Airline $airline): JsonResponse
    {
        $airline->delete();

        return response()->json(null, 204);
    }
}
