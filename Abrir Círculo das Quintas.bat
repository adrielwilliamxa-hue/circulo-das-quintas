@echo off
title Circulo das Quintas
rem Abre a pasta onde este atalho está (a de trabalho ou uma cópia congelada de versão).
cd /d "%~dp0"
if not exist "dist\index.html" (
  echo Preparando o app pela primeira vez...
  call npm install
  call npm run build
)
node servidor\servidor.mjs --abrir
if errorlevel 1 pause
