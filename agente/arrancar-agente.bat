@echo off
rem Arranca el agente lector de facturas en modo vigilar (doble clic).
rem Revisa la cola del CRM y facturas\entrada cada 10 s hasta cerrar la ventana.
title Agente de facturas - Tinta ^& Co
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
    echo No esta instalado el entorno de Python.
    echo Sigue los pasos de "Instalacion" en agente\README.md y vuelve a probar.
    pause
    exit /b 1
)
if not exist ".env" (
    echo Falta el archivo .env: copia .env.example a .env y rellena las claves.
    pause
    exit /b 1
)

echo Agente en marcha. Cierra esta ventana o pulsa Ctrl+C para pararlo.
echo.
".venv\Scripts\python.exe" agente.py --vigilar

echo.
echo El agente se ha parado.
pause
