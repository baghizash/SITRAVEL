<?php

namespace App\Http\Controllers;

use App\Models\Travel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TravelPartnerController extends Controller
{
    public function index(): JsonResponse
    {
        $travels = Travel::orderBy('name')->get();
        return response()->json($travels->map->toApiArray()->values());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'        => 'required|string',
            'code'        => 'required|string|unique:travels,code',
            'description' => 'nullable|string',
            'contact'     => 'nullable|string',
        ]);

        $travel = Travel::create($data);

        return response()->json($travel->toApiArray(), 201);
    }
}
