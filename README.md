# Happy Coffee Data Catalog

A web application for Happy Coffee, a Brazilian coffee exporter, featuring a comprehensive data catalog with an integrated local terminal.

## Features

- **Data Catalog**: View and explore coffee trading data including:
  - Coffee bean samples with Brazilian origins
  - Export shipments to worldwide destinations
  - Customer orders and contracts
  - Processing lineage from farm to export
  - Processing and roasting runs
  - Quality logs and inspections
  - Cost breakdowns and analysis

- **Integrated Terminal**: Side-by-side terminal access to your local shell
  - Full access to your local environment and tools
  - Resizable split-pane layout
  - Toggle terminal visibility with a floating button

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Xterm.js
- **Backend**: Node.js, Express, TypeScript, node-pty, WebSocket
- **Structure**: Monorepo with npm workspaces

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn

## Installation

```bash
# Install dependencies
npm install
```

## Development

```bash
# Start both frontend and backend in development mode
npm run dev

# Frontend will be available at: http://localhost:5173
# Backend will be available at: http://localhost:3001
```

## Build

```bash
# Build for production
npm run build
```

## Testing

```bash
# Run all tests
npm test
```

## Project Structure

```
web-terminal/
├── packages/
│   ├── frontend/    # React application
│   └── backend/     # Express server with terminal integration
└── package.json     # Workspace configuration
```

## Security Note

This application provides direct access to your local shell with full privileges. It is designed for **local development only** and should not be exposed to the internet without proper authentication and sandboxing.

## License

MIT
