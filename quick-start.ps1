#!/usr/bin/env pwsh

# ArtBastard Quick Start Script
# Skips full setup, just clears cache and starts quickly

Write-Host "🎭 ArtBastard Quick Start" -ForegroundColor Magenta
Write-Host "Skipping full setup - just clearing cache and starting..." -ForegroundColor Yellow

# Clear npm cache
Write-Host "🧹 Clearing npm cache..." -ForegroundColor Cyan
npm cache clean --force

# Clear node_modules if they exist (optional - comment out if you want to keep them)
# Write-Host "🗑️  Removing node_modules..." -ForegroundColor Cyan
# if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }
# if (Test-Path "react-app/node_modules") { Remove-Item -Recurse -Force "react-app/node_modules" }

# Quick install (uses existing package-lock.json if available)
Write-Host "📦 Quick npm install..." -ForegroundColor Cyan
npm install --prefer-offline --no-audit

# Quick install for react-app
Write-Host "📦 Quick react-app install..." -ForegroundColor Cyan
Set-Location react-app
npm install --prefer-offline --no-audit
Set-Location ..

# Build and start
Write-Host "🔨 Building and starting..." -ForegroundColor Green
npm run build
npm start