# @app/consumer-app

## Overview
The **Consumer App** is the primary frontend for StyleSwipe, built with **Expo (React Native)**. It targets iOS, Android, and Web from a single codebase.

## 🔧 Configuration

### Environment Variables
*   Check `.env.local` in the project root for API keys (e.g., Convex URL).
*   **Note**: Never commit real secrets.

### Dependencies
*   **Expo**: ~52.0.0
*   **React Native**: 0.76.0
*   **React Native Web**: Support for browser rendering.

## 🚀 Development

### Start the App
```bash
# Start all platforms (interactive menu)
bun run start

# Web only
bun run web

# iOS (requires simulator)
bun run ios

# Android (requires emulator)
bun run android
```

## 🏗️ Architecture
This app consumes:
*   `@app/core`: For functional logic.
*   `@app/ui-kit`: For visual components.
*   `convex`: Direct backend integration.
