# Happy Coffee Data Catalog

A web application for Happy Coffee, a Brazilian coffee exporter, featuring a comprehensive data catalog with an integrated local terminal for seamless workflow.

## Features

### Data Catalog
View and explore realistic coffee trading data including:

- **Coffee Bean Samples**: Brazilian varieties (Arabica, Robusta) from regions like Minas Gerais, São Paulo, and Bahia with farm origins, quality scores, and certifications
- **Shipments**: Export containers from Brazilian ports (Santos, Rio de Janeiro, Vitória) to worldwide destinations with tracking
- **Orders**: Customer orders from international roasters and distributors with pricing and delivery information
- **Lineage**: Complete traceability from farm → processing → warehouse → quality control → export
- **Processing Runs**: Washing, drying, hulling, sorting operations with parameters and quality metrics
- **Logs**: Real-time system logs for quality checks, shipping events, and inspections
- **Costs**: Detailed cost breakdowns by category (production, processing, shipping, export, labor, equipment)

### Integrated Terminal
- **Toggle Button**: Floating button in bottom-right corner to show/hide terminal
- **Split View**: Side-by-side layout with catalog (60%) and terminal (40%)
- **Local Shell**: Full access to your local shell (bash/zsh) with all your tools and environment
- **Real-time**: WebSocket-based connection for instant command execution
- **Resizable**: Terminal automatically fits to container size

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Xterm.js, React Router, Zustand, Faker.js
- **Backend**: Node.js, Express, TypeScript, node-pty, WebSocket
- **Architecture**: Monorepo with npm workspaces

## Prerequisites

- **Node.js**: >= 18.0.0
- **npm**: Latest version
- **Operating System**: macOS, Linux, or Windows (with WSL recommended)

## Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd web-terminal
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

   This will install dependencies for both frontend and backend packages.

## Development

### Start Development Servers

Start both frontend and backend in development mode:

```bash
npm run dev
```

This will:
- Start the **frontend** at http://localhost:5173
- Start the **backend** at http://localhost:3001
- Enable **WebSocket terminal** at ws://localhost:3001/terminal

### Access the Application

1. Open your browser and navigate to http://localhost:5173
2. Browse the coffee catalog using the navigation menu
3. Click the **terminal button** (floating in bottom-right corner) to open the integrated terminal
4. Use the terminal just like your local shell - all your commands, tools, and environment variables are available

### Navigation

- **Data Samples**: Browse coffee bean samples from Brazilian farms
- **Lineage**: View traceability chains from farm to export
- **Runs**: Explore processing operations with metrics
- **Logs**: Monitor system logs and events
- **Costs**: Analyze cost breakdowns and totals

## Project Structure

```
web-terminal/
├── packages/
│   ├── frontend/              # React application
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── catalog/  # Data visualization components
│   │   │   │   ├── terminal/ # Terminal integration
│   │   │   │   └── layout/   # Layout components
│   │   │   ├── data/
│   │   │   │   ├── types.ts  # TypeScript definitions
│   │   │   │   └── generators/ # Fake data generators
│   │   │   ├── store/        # Zustand state management
│   │   │   └── hooks/        # Custom React hooks
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── backend/               # Express server
│       ├── src/
│       │   ├── index.ts      # Server entry point
│       │   ├── terminal/
│       │   │   ├── pty-manager.ts       # node-pty integration
│       │   │   ├── websocket-handler.ts # WebSocket server
│       │   │   └── types.ts
│       │   └── utils/
│       ├── tsconfig.json
│       └── package.json
│
├── package.json              # Root workspace config
├── README.md
└── .gitignore
```

## Build for Production

Build both packages:

```bash
npm run build
```

Output:
- Frontend build: `packages/frontend/dist/`
- Backend build: `packages/backend/dist/`

## Run Production Build

After building:

```bash
# Start backend
cd packages/backend
npm start

# Serve frontend (use any static file server)
cd packages/frontend
npx serve dist
```

## How It Works

### Data Generation
- All catalog data is generated client-side using Faker.js
- Uses a deterministic seed (`happy-coffee-2024`) for consistent data across sessions
- Data includes realistic Brazilian coffee regions, ports, and export destinations

### Terminal Integration
1. **Backend**: Uses node-pty to spawn your local shell process
2. **WebSocket**: Bidirectional communication between frontend and backend
3. **Frontend**: Xterm.js renders the terminal in the browser
4. **Protocol**: Simple JSON messages for input/output/resize/exit events

### WebSocket Protocol

**Client → Server:**
```json
{ "type": "input", "data": "ls\n" }
{ "type": "resize", "cols": 80, "rows": 30 }
```

**Server → Client:**
```json
{ "type": "output", "data": "file1.txt\nfile2.txt\n" }
{ "type": "exit", "code": 0 }
```

## Troubleshooting

### Terminal Won't Connect

1. Check if backend is running on port 3001:
   ```bash
   curl http://localhost:3001/health
   ```

2. Check WebSocket URL in browser console

3. Ensure no firewall is blocking port 3001

### node-pty Installation Issues

node-pty requires native compilation. If installation fails:

1. Install build tools:
   - **macOS**: `xcode-select --install`
   - **Linux**: `apt-get install build-essential python3`
   - **Windows**: Install Visual Studio Build Tools

2. Clear npm cache and reinstall:
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

### Terminal Shows Wrong Shell

The terminal uses `process.env.SHELL` to detect your shell. To change:

1. Check your current shell:
   ```bash
   echo $SHELL
   ```

2. Set it as default if needed:
   ```bash
   chsh -s /bin/zsh  # or /bin/bash
   ```

## Security Note

⚠️ **Important**: This application provides **direct access to your local shell** with full system privileges. It is designed for **local development only** and should **NEVER** be exposed to the internet without proper authentication, authorization, and sandboxing.

The integrated terminal:
- Has full access to your file system
- Can execute any command
- Uses your user permissions
- Forwards all environment variables

**DO NOT**:
- Deploy this to a public server without security measures
- Share your running instance over the network
- Use this in a production environment without proper sandboxing

## Data

The application generates fake but realistic data for:
- 50 coffee bean samples from Brazilian farms
- 20 export shipments to international destinations
- 30 customer orders
- 40 processing runs
- 100 system log entries
- 80 cost entries

All data uses:
- Real Brazilian coffee regions and ports
- Authentic coffee varieties (Bourbon, Catuaí, Mundo Novo, etc.)
- Actual processing methods (Natural, Washed, Honey, Pulped Natural)
- International export destinations

## Future Enhancements

Potential features for future development:
- Persistent data storage (SQLite/PostgreSQL)
- User authentication and authorization
- Terminal session recording/playback
- Multiple terminal tabs
- Advanced lineage visualization with D3.js
- Real-time cost analysis charts
- CSV/JSON data export
- Integration with real coffee trading APIs
- Multi-user collaboration

## License

MIT

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the console logs in browser DevTools
3. Check backend logs in the terminal where you ran `npm run dev`

---

Built with ☕ for Happy Coffee - Exporting the best of Brazilian coffee to the world!
