<?php

namespace App\Http\Controllers;

use App\Models\City;
use Illuminate\Http\JsonResponse;

class CityController extends Controller
{
    public function index(): JsonResponse
    {
        $cities = City::orderBy('name')->get(['name', 'province']);

        return response()->json(
            $cities->map(fn($c) => ['name' => $c->name, 'province' => $c->province])->values()
        );
    }
}
