# Web Terminal

A local terminal embedded in a web interface. Browse a web application on one side, operate your machine's shell on the other -- same window, full context on both ends.

## The idea

Web applications show you data, dashboards, logs, catalogs. But acting on what you see usually means switching to a separate terminal window, losing visual context. This project removes that gap: the terminal lives inside the page, connected to your real local shell, so you can look at the UI and run commands side by side.

The connection is straightforward. A lightweight backend spawns a pseudo-terminal (PTY) using `node-pty` and exposes it over a WebSocket. The frontend renders that PTY stream with `xterm.js`. Every keystroke travels through the WebSocket to your shell; every byte of output travels back. The result is a fully interactive terminal session -- not a simulation, not a sandbox, but your actual machine.

### Why this matters

When the terminal shares the screen with a web interface, new interaction patterns become possible:

- **Inspect what you see.** A data catalog shows a record; you query the same database from the terminal without leaving the page.
- **Operate from context.** A dashboard highlights an anomaly; you SSH into the relevant host or tail the logs right there.
- **Script alongside UI.** Write a quick pipeline, run it, and watch the UI reflect the results -- all in one viewport.
- **Local tools, remote data.** The web page fetches and displays remote data; the terminal gives you local tools (grep, awk, jq, python, git) to process or act on it.

This is the starting point. The current demo pairs the terminal with a coffee export data catalog, but the underlying architecture is application-agnostic. Any web UI can host the terminal panel.

## How it works

```
Browser                          Server                        OS
+-----------------------+        +--------------------+        +-------+
| xterm.js              |  WS    | WebSocket handler  |  PTY   | shell |
| (renders terminal)    |<------>| (JSON messages)    |<------>| (bash |
|                       |        |                    |        |  zsh) |
+-----------------------+        +--------------------+        +-------+
| React app             |        | Express + HTTP     |
| (catalog / any UI)    |        | (health check)     |
+-----------------------+        +--------------------+
```

### Connection lifecycle

1. User clicks the terminal toggle button in the browser.
2. The `Terminal` React component mounts and creates an xterm.js instance.
3. The `useTerminal` hook opens a WebSocket to `ws://localhost:3001/terminal`.
4. On the server, `websocket-handler.ts` receives the connection and asks `PTYManager` to spawn the user's shell (`$SHELL` or `/bin/bash`).
5. From this point on, communication is bidirectional:
   - **Keystrokes** (client to server): `{ "type": "input", "data": "ls\n" }`
   - **Shell output** (server to client): `{ "type": "output", "data": "file1.txt\nfile2.txt\n" }`
   - **Resize** (client to server): `{ "type": "resize", "cols": 120, "rows": 40 }`
   - **Exit** (server to client): `{ "type": "exit", "code": 0 }`
6. When the WebSocket closes (user hides the terminal or navigates away), the PTY process is killed.

### Tech stack

| Layer | Technology | Role |
|-------|-----------|------|
| Terminal rendering | xterm.js + FitAddon | Renders the PTY stream in the browser, auto-fits to container |
| Frontend framework | React 18, TypeScript, Vite | Hosts the terminal component and the demo UI |
| Styling | TailwindCSS | Layout and split-view panel |
| State | Zustand | Application state (used by the demo catalog) |
| WebSocket (client) | Native browser WebSocket | Sends keystrokes, receives output |
| WebSocket (server) | ws | Accepts terminal connections at `/terminal` |
| PTY | node-pty | Spawns a real shell process with full TTY support |
| HTTP server | Express | Health check, serves as the WebSocket upgrade target |
| Monorepo | npm workspaces | `packages/frontend` and `packages/backend` |

## Getting started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** (latest)
- **macOS**, **Linux**, or **Windows** (WSL recommended)
- Build tools for native compilation (`xcode-select --install` on macOS, `build-essential` on Linux)

### Install and run

```bash
git clone <repository-url>
cd web-terminal
npm install
npm run dev
```

This starts:
- Frontend at **http://localhost:5173**
- Backend at **http://localhost:3001**
- WebSocket terminal at **ws://localhost:3001/terminal**

### Using the terminal

1. Open http://localhost:5173 in your browser.
2. Click the floating terminal button in the bottom-right corner.
3. The page splits: your web UI on the left (60%), a live terminal on the right (40%).
4. Type commands. This is your real shell -- your PATH, aliases, environment variables, and tools are all available.
5. Click the button again to hide the terminal.

## Project structure

```
web-terminal/
+-- packages/
|   +-- frontend/                  # React application
|   |   +-- src/
|   |       +-- components/
|   |       |   +-- terminal/      # Terminal.tsx, useTerminal.ts, TerminalToggle.tsx
|   |       |   +-- layout/        # Header, Navigation, SplitView
|   |       |   +-- catalog/       # Demo data catalog pages
|   |       +-- data/              # Types and Faker.js generators (demo)
|   |       +-- store/             # Zustand store (demo)
|   |
|   +-- backend/                   # Express + WebSocket server
|       +-- src/
|           +-- index.ts           # HTTP server + WebSocket setup
|           +-- terminal/
|               +-- pty-manager.ts        # Spawns and manages the PTY process
|               +-- websocket-handler.ts  # Bridges WebSocket <-> PTY
|               +-- types.ts              # TerminalMessage, TerminalSize
|
+-- package.json                   # Workspace root, postinstall script
```

The terminal integration lives entirely in three files on the frontend (`Terminal.tsx`, `useTerminal.ts`, `TerminalToggle.tsx`) and three on the backend (`pty-manager.ts`, `websocket-handler.ts`, `types.ts`). Everything else is the demo application.

## The demo: Happy Coffee Data Catalog

The included demo UI is a data catalog for a fictional Brazilian coffee exporter. It generates realistic data client-side using Faker.js (seeded for consistency) and provides pages for samples, lineage, processing runs, logs, and costs. The catalog is there to demonstrate the terminal alongside a real-looking web application -- it is not the focus of this project.

## Build for production

```bash
npm run build
```

Output:
- `packages/frontend/dist/` (static files, serve with any HTTP server)
- `packages/backend/dist/` (Node.js server)

```bash
# Start backend
cd packages/backend && npm start

# Serve frontend
cd packages/frontend && npx serve dist
```

## Troubleshooting

**Terminal won't connect**
1. Verify the backend is running: `curl http://localhost:3001/health`
2. Check the browser console for WebSocket errors.
3. Make sure port 3001 is not blocked or already in use.

**node-pty installation fails**
node-pty compiles a native addon. Install platform build tools first (`xcode-select --install` on macOS, `apt-get install build-essential python3` on Linux). Then clean and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

**posix_spawnp failed (macOS)**
npm sometimes strips execute permissions from prebuilt binaries. The `postinstall` script in `package.json` handles this automatically. If it still fails, run manually:
```bash
chmod +x node_modules/node-pty/prebuilds/darwin-arm64/spawn-helper
chmod +x node_modules/node-pty/prebuilds/darwin-x64/spawn-helper
```

**Wrong shell**
The backend reads `$SHELL` to decide which shell to spawn. Check with `echo $SHELL` and change with `chsh -s /bin/zsh` (or your preferred shell).

## Security

This application gives the browser **direct access to your local shell** with your user privileges. It is built for local development use.

**Do not** expose it to the network or deploy it publicly without adding authentication, authorization, and sandboxing. The terminal can read and write your file system, execute any command, and access all environment variables.

## What's next

This project is a starting point for exploring what becomes possible when a terminal and a web UI share the same screen. Some directions worth investigating:

- **Terminal-driven UI interaction** -- commands that query or manipulate what the web page displays
- **UI-driven terminal commands** -- clicking elements in the web UI that populate or trigger terminal commands
- **Context bridging** -- sharing state between the web application and the terminal session (selected records, filters, environment)
- **Session persistence** -- reconnecting to existing terminal sessions after page reloads
- **Multiple terminals** -- tabbed or tiled terminal panels
- **Authenticated access** -- making this safe for deployment beyond localhost
- **Programmatic terminal control** -- the web app sending commands to the terminal on the user's behalf

## License

MIT
