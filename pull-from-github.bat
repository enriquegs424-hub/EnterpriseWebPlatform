@echo off
chcp 65001 >nul
echo ========================================
echo   📥 DESCARGAR CAMBIOS DE GITHUB
echo   (ROLLBACK)
echo ========================================
echo.

REM Verificar si es un repositorio git
if not exist ".git\" (
    echo ❌ ERROR: Este directorio no es un repositorio Git
    echo.
    echo Ejecuta primero: push-to-github.bat
    pause
    exit /b 1
)

echo ⚠️  ADVERTENCIA: Esta operación sobrescribirá
echo    todos tus cambios locales con la versión
echo    del repositorio de GitHub.
echo.
echo 💾 Se recomienda hacer backup antes de continuar.
echo.

REM Pedir confirmación
set /p confirm="¿Estás SEGURO de continuar? (S/N): "
if /i not "%confirm%"=="S" (
    echo.
    echo ❌ Operación cancelada
    pause
    exit /b 0
)

echo.
echo ========================================
echo   📊 Estado actual
echo ========================================
echo.

REM Mostrar cambios locales que se perderán
git status

echo.
set /p confirm2="¿Confirmas que deseas DESCARTAR estos cambios? (S/N): "
if /i not "%confirm2%"=="S" (
    echo.
    echo ❌ Operación cancelada
    pause
    exit /b 0
)

echo.
echo ========================================
echo   🔄 Descargando desde GitHub
echo ========================================
echo.

REM Guardar cambios locales en stash (por si acaso)
echo 💾 Guardando cambios locales en stash (backup temporal)...
git stash push -m "Backup antes de pull - %date% %time%"

echo.
echo 📥 Descargando cambios del repositorio...
git fetch origin

echo.
echo 🔄 Reseteando a la versión del repositorio...
git reset --hard origin/main

if %errorlevel% neq 0 (
    echo.
    echo ⚠️  Error con 'main'. Intentando con 'master'...
    git reset --hard origin/master
    
    if %errorlevel% neq 0 (
        echo.
        echo ❌ ERROR: No se pudo hacer reset
        echo.
        echo Restaurando desde stash...
        git stash pop
        echo.
        pause
        exit /b 1
    )
)

echo.
echo 🧹 Limpiando archivos no rastreados...
git clean -fd

echo.
echo ========================================
echo   ✅ ROLLBACK COMPLETADO
echo ========================================
echo.
echo 📂 Tu código local ahora coincide con GitHub
echo 💾 Backup temporal guardado en stash
echo.
echo Para recuperar tus cambios anteriores:
echo    git stash list
echo    git stash pop
echo.
echo 🔧 Recuerda ejecutar:
echo    npm install
echo    npx prisma generate
echo.

set /p runInstall="¿Deseas ejecutar npm install ahora? (S/N): "
if /i "%runInstall%"=="S" (
    echo.
    echo 📦 Instalando dependencias...
    call npm install
    
    echo.
    echo 📊 Generando cliente de Prisma...
    call npx prisma generate
    
    echo.
    echo ✅ Instalación completada
)

echo.
pause
