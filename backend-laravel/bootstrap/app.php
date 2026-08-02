<?php

use App\Http\Middleware\JwtFromCookie;
use App\Http\Middleware\RequireRoles;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__ . '/../routes/api.php',
        apiPrefix: 'api',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Jangan pernah redirect ke route 'login' — selalu lempar AuthenticationException
        // agar exception handler bisa mengembalikan JSON 401
        $middleware->redirectGuestsTo(fn() => null);

        // Tambahkan JwtFromCookie ke semua request API
        $middleware->prependToGroup('api', JwtFromCookie::class);

        // Alias middleware
        $middleware->alias([
            'role' => RequireRoles::class,
        ]);

        // Izinkan cookie dikirim cross-site (untuk frontend dev)
        $middleware->encryptCookies(except: ['access_token']);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Semua error di /api/* pakai JSON
        $exceptions->shouldRenderJsonWhen(
            fn(Request $request) => $request->is('api/*') || $request->expectsJson()
        );

        // Unauthenticated → 401 JSON (bukan redirect ke route login)
        $exceptions->render(function (
            \Illuminate\Auth\AuthenticationException $e,
            Request $request
        ) {
            if ($request->is('api/*')) {
                return response()->json(['detail' => 'Belum login'], 401);
            }
        });

        // Format error validasi seragam dengan FastAPI
        $exceptions->render(function (
            \Illuminate\Validation\ValidationException $e,
            Request $request
        ) {
            if ($request->is('api/*')) {
                $firstMsg = collect($e->errors())->flatten()->first();
                return response()->json(['detail' => $firstMsg], 422);
            }
        });

        $exceptions->render(function (
            \Tymon\JWTAuth\Exceptions\TokenExpiredException $e,
            Request $request
        ) {
            if ($request->is('api/*')) {
                return response()->json(['detail' => 'Sesi berakhir'], 401);
            }
        });

        $exceptions->render(function (
            \Tymon\JWTAuth\Exceptions\JWTException $e,
            Request $request
        ) {
            if ($request->is('api/*')) {
                return response()->json(['detail' => 'Token tidak valid'], 401);
            }
        });
    })->create();
