#!/usr/bin/env powershell

# Real-Time AI Conversation - Quick Start Guide
# ================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Real-Time AI Conversation Project" -ForegroundColor Yellow
Write-Host "Quick Start Guide" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node version
Write-Host "Checking Node.js installation..." -ForegroundColor Green
node --version
npm --version
Write-Host ""

# Set API Key
Write-Host "Configure OpenAI API Key:" -ForegroundColor Yellow
Write-Host "1. Update server/.env file" -ForegroundColor Gray
Write-Host "2. Set OPENAI_API_KEY environment variable" -ForegroundColor Gray
Write-Host ""

# Backend
Write-Host "Starting Backend Server..." -ForegroundColor Green
Write-Host "Port: 4000" -ForegroundColor Cyan
Write-Host "Command: cd server && npm run dev" -ForegroundColor Gray
Write-Host ""

# Frontend
Write-Host "Starting Frontend Server..." -ForegroundColor Green
Write-Host "Port: 3000" -ForegroundColor Cyan
Write-Host "Command: cd child-ai-chat && npm start" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "IMPORTANT: Replace 'sk-test-key' with your real OpenAI API key!" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Once both servers start, visit: http://localhost:3000" -ForegroundColor Green
