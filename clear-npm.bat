@echo off
echo === COMPLETE CLEAN UP ===

echo 1. Removing node_modules and .next directory...
if exist node_modules rmdir /s /q node_modules
if exist .next rmdir /s /q .next

echo 2. Cleaning npm cache...
npm cache clean --force

echo 3. Removing package-lock.json...
if exist package-lock.json del package-lock.json

echo 4. Creating fresh package.json...
echo { "name": "topcitytickets", "version": "0.1.0", "private": true } > package.json

echo === CLEANUP COMPLETE ===
echo Run rebuild.bat to set up a new working project
pause
