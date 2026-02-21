@echo off

cd /d %~dp0

echo This script will clear documents folder.
echo Continue ?

pause

if exist "documents\" (rd /s /q "documents" & mkdir "documents")
