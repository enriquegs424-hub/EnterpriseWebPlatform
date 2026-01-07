@echo off
chcp 65001 >nul
echo ========================================
echo   🎯 SETUP INICIAL - GITHUB
echo ========================================
echo.
echo Este script configurará el repositorio
echo y subirá el proyecto inicial a GitHub.
echo.
echo 📍 Repositorio: https://github.com/enriquegs424-hub/EnterpriseWebPlatform
echo.
pause

REM Verificar si ya es un repositorio
if exist ".git\" (
    echo ⚠️  Ya existe un repositorio Git
    echo.
    set /p overwrite="¿Deseas reinicializar? (S/N): "
    if /i not "%overwrite%"=="S" (
        echo ❌ Operación cancelada
        pause
        exit /b 0
    )
    echo.
    echo 🗑️  Eliminando .git anterior...
    rmdir /s /q .git
)

echo.
echo ========================================
echo   🔧 Configurando Git
echo ========================================
echo.

REM Inicializar repositorio
echo 📦 Inicializando repositorio...
git init

echo.
echo 🌿 Creando rama main...
git branch -M main

echo.
echo 🔗 Conectando con GitHub...
git remote add origin https://github.com/enriquegs424-hub/EnterpriseWebPlatform.git

echo.
echo ========================================
echo   📝 Configuración de usuario
echo ========================================
echo.

REM Configurar usuario (opcional)
set /p configUser="¿Deseas configurar tu usuario de Git? (S/N): "
if /i "%configUser%"=="S" (
    echo.
    set /p userName="Nombre de usuario: "
    set /p userEmail="Email: "
    
    git config user.name "%userName%"
    git config user.email "%userEmail%"
    
    echo ✅ Usuario configurado
)

echo.
echo ========================================
echo   📦 Preparando archivos
echo ========================================
echo.

REM Crear .gitignore si no existe
if not exist ".gitignore" (
    echo 📄 Creando .gitignore...
    echo node_modules/ > .gitignore
    echo .env >> .gitignore
    echo .next/ >> .gitignore
    echo *.log >> .gitignore
)

REM Crear README si no existe
if not exist "README.md" (
    if exist "README_GITHUB.md" (
        echo 📄 Usando README_GITHUB.md como README.md...
        copy README_GITHUB.md README.md >nul
    )
)

echo.
echo 📊 Agregando todos los archivos...
git add .

echo.
echo 💾 Creando commit inicial...
git commit -m "Initial commit: Enterprise Web Platform"

if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: No se pudo crear el commit
    pause
    exit /b 1
)

echo.
echo ========================================
echo   🚀 Subiendo a GitHub
echo ========================================
echo.
echo ⚠️  Esto sobrescribirá el repositorio remoto
echo.

set /p confirmPush="¿Deseas continuar con el push? (S/N): "
if /i not "%confirmPush%"=="S" (
    echo.
    echo ❌ Push cancelado
    echo    El repositorio local está listo
    echo    Ejecuta manualmente: git push -u origin main --force
    pause
    exit /b 0
)

echo.
echo 📤 Subiendo a GitHub (esto puede tardar)...
git push -u origin main --force

if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: No se pudo hacer push
    echo.
    echo Posibles causas:
    echo 1. No tienes permisos en el repositorio
    echo 2. Necesitas autenticarte con GitHub
    echo 3. Problemas de conexión
    echo.
    echo Intenta manualmente:
    echo    git push -u origin main --force
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ SETUP COMPLETADO
echo ========================================
echo.
echo 🎉 Proyecto subido exitosamente a GitHub
echo.
echo 🌐 Repositorio: https://github.com/enriquegs424-hub/EnterpriseWebPlatform
echo.
echo 📝 Próximos pasos:
echo    1. Verifica el repositorio en GitHub
echo    2. Usa push-to-github.bat para futuros cambios
echo    3. Usa pull-from-github.bat para rollback
echo    4. Usa start.bat para iniciar el proyecto
echo.
pause
