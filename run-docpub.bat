cd /d %~dp0
start "npm run dev" cmd /k "npm run dev -- --hostname 0.0.0.0 --port 7788"
