@echo off
cd /d "%~dp0"
node apply_patch.js
git add .
git commit -m "fix: ensure Ask MO mobile conversations persist and history restores last chat"
git push
