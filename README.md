# xSwarm-Freeloader

**Professional Freeloader for AI Services** - Intelligent AI router that maximizes free tier usage across 100+ LLM providers.

## Status

✅ **ALL PHASES COMPLETE** - Production Ready MVP

### Completed Components

- **Database Layer** (SQLite with better-sqlite3)
  - Schema with migrations (providers, models, accounts, usage, budgets)
  - 5 repository classes with full CRUD
  - AES-256-GCM encryption for API keys
  - 13 passing tests

- **Configuration System**
  - Zod validation schemas
  - Config loader with merge, get/set by path
  - Support for strategy presets
  - 10 passing tests

- **LiteLLM Integration**
  - Postinstall script (Python 3.8+ check)
  - Config generator (YAML from DB accounts)
  - HTTP client (undici wrapper)
  - Subprocess manager with health monitoring
  - Auto-restart on crash (max 3 attempts)

- **Routing Logic**
  - Quality gates (intelligence, speed, blockLocal filters)
  - Scoring algorithm (normalized cost/speed/quality)
  - Balanced strategy with configurable weights
  - Fallback logic (cascade through ranked models)
  - Main router orchestrator
  - 13 passing tests

- **Budget Management**
  - Budget tracker (daily/monthly by project)
  - Budget enforcer (hard/soft limit checking)
  - Usage logging to database
  - 7 passing tests

- **HTTP API** (src/server/)
  - 5 Fastify routes (completions, budget, models, accounts, health)
  - Zod request validation
  - Global error handling
  - Graceful shutdown

- **CLI Tool** (src/bin/xswarm.js, src/cli/)
  - 8 commands (init, start, stop, status, account add/list, config get/set/show)
  - Daemon controller with PID management
  - Background daemon mode
  - Commander.js framework

- **Documentation** (docs/)
  - Complete API.md with all endpoints
  - Request/response examples (cURL, JavaScript, Python)
  - Error codes and routing strategy docs

**Total: 43 tests passing ✅**

### Implementation Complete

All planned features implemented:
- ✅ Database layer with migrations
- ✅ Configuration system with validation
- ✅ LiteLLM integration and management
- ✅ Intelligent routing with quality gates
- ✅ Budget tracking and enforcement
- ✅ HTTP API with 5 endpoints
- ✅ CLI with 8 commands
- ✅ Comprehensive documentation

## Quick Start (When Complete)

```bash
# Install
npm install -g xswarm-freeloader

# Initialize
xswarm init

# Add API key
xswarm account add anthropic sk-ant-xxxxx

# Start daemon
xswarm start --daemon

# Check status
xswarm status

# Make request
curl -X POST http://localhost:3000/v1/completions \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello!", "strategy": "balanced"}'
```

## Architecture

```
┌─────────────┐
│   CLI Tool  │
└──────┬──────┘
       │
┌──────▼──────────────────────────────────────┐
│           HTTP API (Fastify)                 │
│  ┌────────────────────────────────────────┐ │
│  │  Router Orchestrator                   │ │
│  │  ├─ Quality Gates                      │ │
│  │  ├─ Scoring (Cost/Speed/Quality)       │ │
│  │  ├─ Strategy Selection                 │ │
│  │  └─ Fallback Logic                     │ │
│  └────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────┐ │
│  │  Budget Management                     │ │
│  │  ├─ Tracker (Daily/Monthly)            │ │
│  │  └─ Enforcer (Hard/Soft Limits)        │ │
│  └────────────────────────────────────────┘ │
└──────┬──────────────────────────────────────┘
       │
┌──────▼──────────┐    ┌─────────────────────┐
│  LiteLLM Proxy  │───▶│   LLM Providers     │
│  (Port 4000)    │    │  • Anthropic        │
└─────────────────┘    │  • OpenAI           │
                       │  • Google           │
┌─────────────────┐    │  • Local (Ollama)   │
│  SQLite DB      │    │  • 100+ more        │
│  • Providers    │    └─────────────────────┘
│  • Models       │
│  • Accounts     │
│  • Usage        │
│  • Budgets      │
└─────────────────┘
```

## Configuration

Default config at `~/.xswarm/config.json`:

```json
{
  "version": "1.0",
  "routing": {
    "strategy": "balanced",
    "weights": {
      "cost": 0.4,
      "speed": 0.4,
      "quality": 0.2
    },
    "qualityGates": {
      "minIntelligence": 6,
      "maxLatency": 10000,
      "blockLocal": false
    }
  },
  "budget": {
    "hard": {
      "daily": 10.00,
      "monthly": 200.00
    },
    "soft": {
      "daily": 5.00,
      "monthly": 100.00
    }
  },
  "server": {
    "port": 3000,
    "host": "127.0.0.1",
    "litellmPort": 4000
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Start in development mode
npm run dev
```

## License

MIT
