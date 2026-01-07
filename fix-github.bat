@echo off
chcp 65001 >nul
echo ========================================
echo   🔧 CONFIGURAR REPOSITORIO GITHUB
echo ========================================
echo.
echo Este script te ayudará a configurar
echo correctamente el repositorio de GitHub.
echo.
pause

echo.
echo ========================================
echo   📋 Paso 1: Verificar Repositorio
echo ========================================
echo.
echo Por favor, verifica que el repositorio existe en GitHub:
echo.
echo 🌐 https://github.com/enriquegs424-hub/EnterpriseWebPlatform
echo.
echo Si NO existe:
echo   1. Ve a https://github.com/new
echo   2. Nombre: EnterpriseWebPlatform
echo   3. Privado o Público (tu elección)
echo   4. NO agregues README, .gitignore ni licencia
echo   5. Crea el repositorio
echo.
set /p repoExists="¿El repositorio existe en GitHub? (S/N): "
if /i not "%repoExists%"=="S" (
    echo.
    echo ❌ Por favor, crea el repositorio primero
    echo    y vuelve a ejecutar este script.
    pause
    exit /b 0
)

echo.
echo ========================================
echo   🗑️  Paso 2: Limpiar Configuración
echo ========================================
echo.

REM Eliminar remote si existe
git remote remove origin 2>nul
echo ✅ Remote anterior eliminado (si existía)

echo.
echo ========================================
echo   🔗 Paso 3: Configurar Remote
echo ========================================
echo.

echo 🔗 Agregando remote de GitHub...
git remote add origin https://github.com/enriquegs424-hub/EnterpriseWebPlatform.git

if %errorlevel% neq 0 (
    echo ❌ ERROR: No se pudo agregar el remote
    pause
    exit /b 1
)

echo ✅ Remote configurado correctamente

echo.
echo ========================================
echo   🌿 Paso 4: Configurar Rama
echo ========================================
echo.

echo 🌿 Configurando rama main...
git branch -M main

echo.
echo ========================================
echo   📦 Paso 5: Preparar Commit
echo ========================================
echo.

REM Verificar si hay cambios
git status

echo.
set /p needCommit="¿Hay archivos para commitear? (S/N): "
if /i "%needCommit%"=="S" (
    echo.
    echo 📦 Agregando archivos...
    git add .
    
    echo.
    echo 💾 Creando commit...
    git commit -m "Initial commit: MEP Projects Platform"
    
    if %errorlevel% neq 0 (
        echo ⚠️  No se pudo crear el commit
    )
)

echo.
echo ========================================
echo   🚀 Paso 6: Subir a GitHub
echo ========================================
echo.
echo ⚠️  Esto subirá todo el código a GitHub
echo.

set /p confirmPush="¿Deseas continuar con el push? (S/N): "
if /i not "%confirmPush%"=="S" (
    echo.
    echo ❌ Push cancelado
    echo.
    echo El repositorio local está configurado.
    echo Ejecuta manualmente cuando estés listo:
    echo    git push -u origin main
    pause
    exit /b 0
)

echo.
echo 📤 Subiendo a GitHub...
echo.

git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo ⚠️  Error en el push. Intentando con --force...
    echo.
    
    set /p forceConfirm="¿Deseas forzar el push? (S/N): "
    if /i "%forceConfirm%"=="S" (
        git push -u origin main --force
        
        if %errorlevel% neq 0 (
            echo.
            echo ❌ ERROR: No se pudo hacer push
            echo.
            echo Posibles causas:
            echo 1. No tienes permisos en el repositorio
            echo 2. Necesitas autenticarte
            echo 3. El repositorio no existe
            echo.
            echo Soluciones:
            echo 1. Verifica que el repo existe en GitHub
            echo 2. Configura tus credenciales:
            echo    git config --global user.name "Tu Nombre"
            echo    git config --global user.email "tu@email.com"
            echo 3. Usa un token de acceso personal
            echo.
            pause
            exit /b 1
        )
    ) else (
        echo ❌ Push cancelado
        pause
        exit /b 0
    )
)

echo.
echo ========================================
echo   ✅ CONFIGURACIÓN COMPLETADA
echo ========================================
echo.
echo 🎉 Repositorio configurado y código subido
echo.
echo 🌐 Repositorio: https://github.com/enriquegs424-hub/EnterpriseWebPlatform
echo.
echo 📝 Próximos pasos:
echo    1. Verifica el código en GitHub
echo    2. Usa push-to-github.bat para futuros cambios
echo    3. Usa pull-from-github.bat para rollback
echo.
pause
