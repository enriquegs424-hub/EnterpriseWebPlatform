@echo off
chcp 65001 >nul
echo ========================================
echo   📤 SUBIR CAMBIOS A GITHUB
echo ========================================
echo.

REM Verificar si es un repositorio git
if not exist ".git\" (
    echo ⚠️  Este directorio no es un repositorio Git
    echo.
    echo 🔧 Inicializando repositorio...
    git init
    git remote add origin https://github.com/enriquegs424-hub/EnterpriseWebPlatform.git
    echo ✅ Repositorio inicializado
    echo.
)

REM Mostrar estado actual
echo 📊 Estado actual del repositorio:
echo.
git status
echo.

REM Pedir confirmación
echo ========================================
set /p confirm="¿Deseas continuar con el push? (S/N): "
if /i not "%confirm%"=="S" (
    echo.
    echo ❌ Operación cancelada
    pause
    exit /b 0
)

echo.
echo ========================================
echo   📝 Preparando commit
echo ========================================
echo.

REM Pedir mensaje de commit
set /p message="💬 Mensaje del commit (Enter para usar 'Update'): "
if "%message%"=="" set message=Update

echo.
echo 📦 Agregando archivos...
git add .

echo.
echo 💾 Creando commit: "%message%"
git commit -m "%message%"

if %errorlevel% neq 0 (
    echo.
    echo ⚠️  No hay cambios para commitear
    echo.
    set /p forcePush="¿Deseas hacer push de todas formas? (S/N): "
    if /i not "%forcePush%"=="S" (
        echo ❌ Operación cancelada
        pause
        exit /b 0
    )
)

echo.
echo ========================================
echo   🚀 Subiendo a GitHub
echo ========================================
echo.

REM Intentar push
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo ⚠️  Error en el push. Intentando con master...
    git push -u origin master
    
    if %errorlevel% neq 0 (
        echo.
        echo ❌ ERROR: No se pudo hacer push
        echo.
        echo Posibles soluciones:
        echo 1. Verifica tu conexión a internet
        echo 2. Verifica tus credenciales de GitHub
        echo 3. Ejecuta: git pull origin main --rebase
        echo 4. Intenta de nuevo
        echo.
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo   ✅ CAMBIOS SUBIDOS EXITOSAMENTE
echo ========================================
echo.
echo 🌐 Repositorio: https://github.com/enriquegs424-hub/EnterpriseWebPlatform
echo 📝 Commit: "%message%"
echo.
pause
