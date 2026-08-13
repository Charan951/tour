@echo off
echo ========================================================
echo   Fixing Corrupted Gradle Caches & Workspace Metadata
echo ========================================================

echo 1. Stopping running Gradle daemons...
call gradlew.bat --stop

echo 2. Removing corrupted Gradle 8.14 transforms cache...
if exist "%USERPROFILE%\.gradle\caches\8.14\transforms" (
    rmdir /s /q "%USERPROFILE%\.gradle\caches\8.14\transforms"
)

echo 3. Removing local project cache folders...
if exist ".gradle" rmdir /s /q ".gradle"
if exist "build" rmdir /s /q "build"
if exist "app\build" rmdir /s /q "app\build"

echo 4. Running Gradle clean...
call gradlew.bat clean

echo ========================================================
echo   Gradle Caches Successfully Cleared and Rebuilt!
echo ========================================================
pause
