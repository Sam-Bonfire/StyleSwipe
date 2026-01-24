# StyleSwipe Monorepo

## 🏗️ Architecture Overview

StyleSwipe is a modern monorepo built with **Bun** and **Turborepo**, designed for high-performance mobile and web experiences.

```mermaid
graph TD
    User-->|Mobile/Web| ConsumerApp[Consumer App @app/consumer-app]
    ConsumerApp-->|Uses| UIKit[@app/ui-kit]
    ConsumerApp-->|Uses| Core[@app/core]
    ConsumerApp-->|API| Convex[Convex Backend]
    
    Scraper[Scraper Service]-->|Updates| Convex
    Scraper-->|Run via| Playwright
```

## 📦 Services

| Service | Path | Tech Stack | Purpose |
|---------|------|------------|---------|
| **Consumer App** | `apps/consumer-app` | React Native (Expo), Bun | Main user interface for iOS, Android, and Web. |
| **Scraper Service** | `apps/scraper-service` | Playwright, Bun | Data ingestion service for fetching external content. |

## 🛠️ Shared Packages

| Package | Path | Purpose |
|---------|------|---------|
| **@app/core** | `packages/core` | Core business logic using Effect and Fast-Check. |
| **@app/ui-kit** | `packages/ui-kit` | Shared React UI components and design system. |
| **Infrastructure** | `packages/infrastructure` | Convex backend definitions and auth logic. |

## 🚀 Getting Started

### Prerequisites
*   **Bun** (v1.2.23+ required)

### Installation
```bash
bun install
```

### Development
Start the development server (runs all apps):
```bash
bun run dev
```

### Key Commands

| Command | Description |
|---------|-------------|
| `bun run build` | Build all applications and packages. |
| `bun run lint` | Run ESLint across the monorepo. |
| `bun run test` | Execute test suites. |
| `bun run dev:consumer` | Start only the Consumer App. |
