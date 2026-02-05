# Scraper Service

## Overview

The **Scraper Service** is a standalone worker designed to ingest data from external sources using **Playwright**. It runs in a Bun environment.

## ⚙️ Configuration

| Type        | Key          | Purpose                      |
| ----------- | ------------ | ---------------------------- |
| **Runtime** | `bun`        | Execution environment.       |
| **Browser** | `playwright` | Headless browser automation. |

## 🚀 Usage

### Install Dependencies

```bash
bun install
```

### Run Scraper

(Check `package.json` scripts - currently default entry is `src/index.ts`)

```bash
bun run src/index.ts
```

## 🧪 Testing

Includes TypeScript support (`bun-types`).
