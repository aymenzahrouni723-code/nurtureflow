@echo off
title NurtureFlow - De la conjugalite a la parentalite
color 0A

echo.
echo  ========================================
echo     NurtureFlow - Application
echo     De la conjugalite a la parentalite
echo  ========================================
echo.

cd /d "%~dp0"

echo  [*] Verification de Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  [ERREUR] Node.js n'est pas installe !
    echo  Telechargez-le sur : https://nodejs.org
    pause
    exit /b
)

echo  [OK] Node.js detecte
echo.

if not exist "node_modules" (
    echo  [*] Installation des dependances...
    npm install
    echo.
)

echo  [*] Demarrage du serveur...
echo  [*] L'application va s'ouvrir dans votre navigateur...
echo.
echo  ----------------------------------------
echo    URL : http://localhost:3000
echo    Pour arreter : fermez cette fenetre
echo  ----------------------------------------
echo.

timeout /t 2 >nul
start http://localhost:3000

node server.js
