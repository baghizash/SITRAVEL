<?php

namespace App\Http\Controllers;

use App\Models\Travel;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        $users = User::orderBy('created_at', 'desc')->get();
        return response()->json($users->map->toApiArray()->values());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'       => 'required|string',
            'email'      => 'required|email|unique:users,email',
            'password'   => 'required|string|min:6',
            'role'       => 'required|in:admin_app,travel,manager,pengguna',
            'phone'      => 'nullable|string',
            'travel_id'  => 'nullable|string',
        ]);

        if (in_array($data['role'], ['travel', 'manager']) && empty($data['travel_id'])) {
            return response()->json(['detail' => 'travel_id wajib untuk peran travel/manager'], 400);
        }

        if (! empty($data['travel_id'])) {
            $travel = Travel::where('uid', $data['travel_id'])->first();
            if (! $travel) {
                return response()->json(['detail' => 'travel_id tidak valid'], 400);
            }
        }

        $user = User::create([
            'name'       => $data['name'],
            'email'      => strtolower($data['email']),
            'password'   => Hash::make($data['password']),
            'role'       => $data['role'],
            'phone'      => $data['phone'] ?? '',
            'travel_uid' => $data['travel_id'] ?? null,
        ]);

        return response()->json($user->toApiArray(), 201);
    }
}
