# Shared Package

This package contains shared models, constants, and utilities used across all microservices.

## Auto-Build Setup

There are multiple ways to enable automatic building when files are saved:

### Option 1: TypeScript Watch Mode (Recommended ✅)
The simplest and fastest option using TypeScript's built-in watch mode:

```bash
cd shared
npm run dev
```

This will automatically rebuild whenever you save a `.ts` file in the shared folder.

### Option 2: Nodemon
If you prefer nodemon:

```bash
cd shared
npm install  # Install nodemon if not already installed
npm run watch
```

### Option 3: VS Code Auto-Start (Best for Development)
The VS Code task is configured to automatically start when you open the workspace:

1. Open VS Code
2. Go to Terminal → Run Task → "Watch Shared Folder"
3. Or let it auto-start when you open the folder (configured in `.vscode/tasks.json`)

### Option 4: Keep it running in background
Run in a separate terminal and keep it open:

```bash
# Terminal 1 (keep running)
cd shared && npm run dev

# Terminal 2 (your main work terminal)
cd ustaad-parent && npm run dev
```

## Manual Build

If you prefer to build manually:

```bash
npm run build
```

## Package Structure

```
shared/
├── constant/       # Enums and constants
├── models/         # Sequelize models
├── dist/          # Compiled output (auto-generated)
├── db.ts          # Database connection
├── index.ts       # Main entry point
└── notification-service.ts
```

## Usage in Other Services

In other microservices:

```typescript
import { User, Tutor, Parent, Offer } from '@ustaad/shared';
```

## Development Workflow

1. Make changes to any `.ts` file in the `shared` folder
2. The watch mode automatically detects changes and rebuilds
3. The other services using `@ustaad/shared` will pick up the changes
4. Restart your service if needed to see the updates

## Notes

- Always run watch mode during development
- The `dist` folder is gitignored and auto-generated
- Type definitions are automatically generated alongside JS files

