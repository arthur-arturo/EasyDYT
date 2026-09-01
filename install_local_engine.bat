@echo off
title EasyDYT - Instalador del Motor Local
echo =======================================================
echo          EasyDYT - Configuracion del Motor Local
echo =======================================================
echo.
echo Registrando el Conector Nativo en Google Chrome / Edge...
powershell -ExecutionPolicy Bypass -File "%~dp0native_host\register_host.ps1"
echo.
echo =======================================================
echo ¡Listo! El motor local de EasyDYT ha sido configurado.
echo Ya puedes descargar videos de YouTube sin limites.
echo =======================================================
pause
