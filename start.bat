@echo off
chcp 65001 >nul
echo ========================================
echo   🚀 INICIAR MEP PROJECTS
echo ========================================
echo.

REM Verificar si node_modules existe
if not exist "node_modules\" (
    echo ⚠️  No se encontró node_modules
    echo 📦 Instalando dependencias...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo ❌ ERROR: No se pudieron instalar las dependencias
        pause
        exit /b 1
    )
    echo.
    echo ✅ Dependencias instaladas correctamente
    echo.
)

REM Verificar si existe .env
if not exist ".env" (
    echo ⚠️  No se encontró archivo .env
    echo.
    if exist ".env.example" (
        echo 📋 Copiando .env.example a .env...
        copy .env.example .env >nul
        echo.
        echo ⚠️  IMPORTANTE: Edita el archivo .env con tus credenciales
        echo    - DATABASE_URL
        echo    - AUTH_SECRET
        echo.
        echo Presiona cualquier tecla para abrir .env en el editor...
        pause >nul
        notepad .env
        echo.
    ) else (
        echo ❌ ERROR: No existe .env.example
        echo    Crea manualmente el archivo .env
        pause
        exit /b 1
    )
)

REM Verificar si Prisma está generado
echo 🔍 Verificando cliente de Prisma...
if not exist "node_modules\.prisma\client\" (
    echo 📊 Generando cliente de Prisma...
    call npx prisma generate
    if %errorlevel% neq 0 (
        echo.
        echo ❌ ERROR: No se pudo generar el cliente de Prisma
        pause
        exit /b 1
    )
    echo ✅ Cliente de Prisma generado
    echo.
)

echo ========================================
echo   🎯 Iniciando servidor de desarrollo
echo ========================================
echo.
echo 📍 URL: http://localhost:3000
echo 📧 Admin: admin@mep-projects.com
echo 🔑 Pass: admin123
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

call npm run dev

pause
