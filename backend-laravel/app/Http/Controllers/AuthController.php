<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    private function cookieResponse(string $token, array $data): JsonResponse
    {
        $cookie = cookie(
            'access_token', $token,
            60 * 24 * 7,   // 7 hari (menit)
            '/',
            null,          // domain
            true,          // secure
            true,          // httpOnly
            false,
            'None'         // sameSite
        );

        return response()->json($data)->withCookie($cookie);
    }

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => 'required|string|min:2',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'phone'    => 'nullable|string',
        ]);

        $user = User::create([
            'uid'      => (string) Str::uuid(),
            'name'     => $data['name'],
            'email'    => strtolower($data['email']),
            'password' => Hash::make($data['password']),
            'role'     => 'pengguna',
            'phone'    => $data['phone'] ?? '',
        ]);

        $token = JWTAuth::fromUser($user);

        return $this->cookieResponse($token, [
            'user'  => $user->toApiArray(),
            'token' => $token,
        ]);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        // Rate limiting: max 5 percobaan per menit per IP
        $key = 'login:' . $request->ip();
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            return response()->json([
                'detail' => "Terlalu banyak percobaan login. Coba lagi dalam {$seconds} detik.",
            ], 429);
        }

        $user = User::where('email', strtolower($data['email']))->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            RateLimiter::hit($key, 60); // Tambah counter, reset setelah 60 detik
            return response()->json(['detail' => 'Email atau password salah'], 401);
        }

        RateLimiter::clear($key); // Reset counter setelah berhasil login
        $token = JWTAuth::fromUser($user);

        return $this->cookieResponse($token, [
            'user'  => $user->toApiArray(),
            'token' => $token,
        ]);
    }

    public function logout(): JsonResponse
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());
        } catch (\Exception) {
        }

        $cookie = cookie()->forget('access_token');

        return response()->json(['ok' => true])->withCookie($cookie);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $request->user()->toApiArray()]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'name'  => 'sometimes|string|min:2',
            'phone' => 'sometimes|nullable|string',
        ]);

        $user->update(array_filter($data, fn($v) => $v !== null));
        $user->refresh();

        return response()->json(['user' => $user->toApiArray()]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'current_password' => 'required|string',
            'new_password'     => 'required|string|min:6',
        ]);

        if (! Hash::check($data['current_password'], $user->password)) {
            return response()->json(['detail' => 'Password saat ini salah'], 400);
        }

        $user->update(['password' => Hash::make($data['new_password'])]);

        return response()->json(['ok' => true, 'message' => 'Password berhasil diubah']);
    }
}
