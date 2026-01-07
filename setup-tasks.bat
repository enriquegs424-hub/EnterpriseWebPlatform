@echo off
echo ========================================
echo   MEP Projects - Actualizacion de BD
echo ========================================
echo.
echo Este script aplicara los nuevos modelos
echo de Tareas y Notificaciones a la BD.
echo.
echo IMPORTANTE: Cierra VS Code antes de continuar
echo.
pause

echo.
echo [1/3] Aplicando schema de Prisma...
call npx prisma db push
if %errorlevel% neq 0 (
    echo.
    echo ERROR: No se pudo aplicar el schema
    echo Verifica que PostgreSQL este corriendo
    echo y que el DATABASE_URL en .env sea correcto
    pause
    exit /b 1
)

echo.
echo [2/3] Generando cliente de Prisma...
call npx prisma generate
if %errorlevel% neq 0 (
    echo.
    echo ERROR: No se pudo generar el cliente
    echo Intenta cerrar VS Code completamente
    pause
    exit /b 1
)

echo.
echo [3/3] Verificando instalacion...
echo.
echo ========================================
echo   EXITO! Base de datos actualizada
echo ========================================
echo.
echo Nuevas tablas creadas:
echo   - Task (Tareas)
echo   - TaskComment (Comentarios)
echo   - Notification (Notificaciones)
echo.
echo Ahora puedes:
echo   1. Abrir VS Code
echo   2. Ejecutar: npm run dev
echo   3. Acceder a /tasks para gestionar tareas
echo.
pause
