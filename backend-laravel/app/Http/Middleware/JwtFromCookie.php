<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;

/**
 * Ambil JWT dari cookie access_token atau header Authorization Bearer,
 * lalu inject ke header agar guard jwt bisa membacanya.
 */
class JwtFromCookie
{
    public function handle(Request $request, Closure $next): mixed
    {
        // Sudah ada header Authorization? biarkan
        if (! $request->bearerToken()) {
            $token = $request->cookie('access_token');
            if ($token) {
                $request->headers->set('Authorization', 'Bearer ' . $token);
            }
        }

        return $next($request);
    }
}
