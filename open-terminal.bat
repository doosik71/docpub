cd /d %~dp0
title Multi-CMD Launcher
start "Gemini" cmd /k "gemini"
start "Dev" cmd /k "npm run dev"
start "Server" cmd  /k "npm run server"
