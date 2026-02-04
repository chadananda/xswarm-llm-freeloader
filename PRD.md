# xSwarm-Freeloader - Product Requirements Document

**"Professional Freeloader for AI Services"**

**Version:** 1.1
**Date:** February 3, 2025
**Status:** Draft for Review
**Authors:** Chad Jones, Claude

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Competitive Landscape](#competitive-landscape)
3. [Vision & Principles](#vision--principles)
3. [User Personas & Stories](#user-personas--stories)
4. [Routing Strategies](#routing-strategies)
5. [Budget Management](#budget-management)
6. [Quality Gates & Fallback Logic](#quality-gates--fallback-logic)
7. [Self-Updating Discovery System](#self-updating-discovery-system)
8. [API Design](#api-design)
9. [Configuration Schema](#configuration-schema)
10. [Database Schema](#database-schema)
11. [Implementation Roadmap](#implementation-roadmap)
12. [Success Metrics](#success-metrics)
13. [Open Questions](#open-questions)
14. [Appendix: Example Use Cases](#appendix-example-use-cases)

---

## Executive Summary

**xSwarm-Freeloader** is a self-updating local daemon that intelligently routes AI requests across 100+ providers to maximize free tier usage while respecting quality requirements. Named after its mission to professionally "freeload" on every available free tier, it provides configurable cost/quality/speed preferences, automatic provider discovery, and smart budget management.

**Tagline:** *"They said there's no free lunch. We found 100+ of them."*

### Key Differentiators

- **Configurable, not opinionated** - Users define their cost/speed/quality tradeoffs
- **Budget-aware** - Hard and soft limits prevent runaway costs
- **Quality-first fallbacks** - Never silently degrade to unusable slow/dumb models
- **Self-updating** - Auto-discover providers, models, pricing without manual updates
- **Transparent** - Always show why a routing decision was made

---

## Competitive Landscape

### LiteLLM Analysis

[LiteLLM](https://github.com/BerriAI/litellm) is the most prominent project in this space with 31k+ stars. Here's how our approach differs:

**What LiteLLM Does Well:**
- ✅ Unified interface to 100+ LLM providers
- ✅ Proxy server with OpenAI-compatible format
- ✅ Basic cost tracking and rate limiting
- ✅ Load balancing across deployments
- ✅ Enterprise features (SSO, team management)

**Critical Gaps We Fill:**

| Feature | LiteLLM | Our Service |
|---------|---------|-------------|
| **Routing Intelligence** | Simple round-robin/weighted | Strategy-based (cost-first, speed-first, quality-first, balanced) |
| **Free Tier Optimization** | ❌ Not focused on this | ✅ Core feature - maximize free usage |
| **Budget Management** | Basic spend limits | Hard/soft limits, per-project allocations, predictive alerts |
| **Quality Gates** | ❌ None | ✅ Never silently degrade (block slow local models if configured) |
| **Self-Discovery** | Manual provider config | Auto-discover new providers/models/pricing |
| **Load Monitoring** | ❌ Basic metrics | ✅ Track service load to prevent slowdowns |
| **Local-First** | Enterprise SaaS focus | Individual developer daemon service |
| **Fallback Logic** | Simple retry | Intelligent fallback with quality preservation |

**Positioning:**

- **LiteLLM**: "Enterprise AI Gateway - Normalize API calls across providers"
- **xSwarm-Freeloader**: "Professional Freeloader - Maximize free tiers across 100+ providers"

**Complementary Use Case:**
- xSwarm-Freeloader **embeds** LiteLLM as a child process for provider normalization
- We focus on intelligent routing, LiteLLM handles the 100+ provider APIs
- Single installation, unified experience

**Target Audience:**
- LiteLLM: Enterprise teams, companies needing SSO/compliance
- xSwarm-Freeloader: Individual developers, small teams, cost-conscious builders

---

## Technical Architecture

### Embedded LiteLLM Design

xSwarm-Freeloader runs as a single daemon that internally manages a LiteLLM proxy subprocess:

```
┌─────────────────────────────────────────────────┐
│ xSwarm-Freeloader (Node.js) - Port 3000        │
├─────────────────────────────────────────────────┤
│ • Routing Intelligence (our code)               │
│ • Budget Management (our code)                  │
│ • Provider Discovery (our code)                 │
│ • Load Monitoring (our code)                    │
│ • Strategy Selection (our code)                 │
│                                                 │
│ HTTP Client ─────────────────┐                 │
└─────────────────────────────┼─────────────────┘
                               │ localhost:4000
                               ↓
┌─────────────────────────────────────────────────┐
│ LiteLLM Proxy (Python) - Port 4000             │
├─────────────────────────────────────────────────┤
│ Spawned & managed as child process              │
│ • 100+ provider integrations                    │
│ • API normalization                             │
│ • Token counting                                │
│ • Error handling                                │
└─────────────────────────────────────────────────┘
```

**User Experience:**
```bash
# Install (bundles Node.js + Python)
npm install -g xswarm-freeloader

# Start (manages both processes)
xswarm start --daemon
# ✓ LiteLLM proxy started (internal)
# ✓ xSwarm-Freeloader running on http://localhost:3000

# Everything managed as one service
xswarm status
xswarm stop
```

**Performance:**
- Localhost HTTP overhead: ~5ms
- Total routing overhead: ~60ms
- Access to 100+ providers with free tiers

**Installation Script:**
```javascript
// Runs during npm install
execSync('pip install litellm --break-system-packages');
// Verify
execSync('litellm --version');
console.log('✓ LiteLLM installed successfully');
```

---

## Vision & Principles

### Vision

Enable developers to use AI services without vendor lock-in, cost anxiety, or performance degradation through intelligent, policy-driven routing.

### Core Principles

1. **Configurable, not opinionated** - Users define their cost/speed/quality tradeoffs
2. **Budget-aware** - Hard and soft limits prevent runaway costs
3. **Quality-first fallbacks** - Never silently degrade to unusable slow/dumb models
4. **Self-updating** - Auto-discover providers, models, pricing without manual updates
5. **Transparent** - Always show why a routing decision was made
6. **Local-first** - SQLite storage, no cloud dependencies, optional sync
7. **Developer-friendly** - Simple HTTP API, drop-in replacement for OpenAI SDK

---

## User Personas & Stories

### Persona 1: Cost-Conscious Indie Developer

**Profile: Chad Jones building openClawd**
- Wants to maximize free tiers but willing to pay for quality when needed
- Budget: $20/month, willing to spend on complex tasks
- Preference: Fast > Cheap > Smart (for most tasks)

**User Stories:**
- "I want to use free Claude Haiku for simple tasks, but auto-upgrade to Sonnet for complex reasoning without manual switching"
- "I want to set a $20/month budget and get alerts at 80% usage"
- "I don't want to fall back to slow local models unless I explicitly allow it"
- "I want to see which model was chosen and why for each request"

### Persona 2: Enterprise Developer

**Profile: Building internal tools with compliance requirements**
- Budget: $500/month, requires data residency
- Preference: Quality > Speed > Cost
- Needs audit trails and compliance controls

**User Stories:**
- "I want all PII-containing requests to use local models only, regardless of cost"
- "I need to prevent any requests from going to certain providers for compliance"
- "I want to see per-team cost breakdowns"
- "I need audit logs of all routing decisions for security review"

### Persona 3: AI Researcher

**Profile: Running experiments and benchmarks**
- Needs to test same prompt across multiple models
- Budget: Unlimited (grant-funded)
- Preference: Quality > Everything

**User Stories:**
- "I want to send each request to 3 different models and compare outputs"
- "I want to benchmark new models automatically as they're discovered"
- "I need to export all responses in structured format for analysis"

---

## Routing Strategies

### Overview

Users can configure a **default strategy** globally, but **every request can override** with specific requirements. This is critical because different tasks have different needs:

- **Code generation**: Speed matters (use Groq)
- **Deep analysis**: Quality matters (use Claude Opus)
- **Batch processing**: Cost matters (max free tiers)
- **Production API**: Reliability matters (paid tiers only)

### Per-Request Strategy Override

```javascript
// Default global strategy
xswarm.config.strategy = 'balanced';

// Override per request
const response = await xswarm.complete({
  prompt: "Write optimized Python code",
  strategy: "speed-first",  // Override: need fast response
  qualityGates: {
    minIntelligence: 7,
    maxLatency: 2000,
    blockLocal: true  // Don't use slow local models
  }
});

// Another request with different needs
const analysis = await xswarm.complete({
  prompt: "Analyze this contract for legal issues",
  strategy: "quality-first",  // Override: need best model
  budget: {perRequest: 1.00},  // Willing to pay for quality
  qualityGates: {
    minIntelligence: 9  // Only top-tier models
  }
});

// Maximize free usage
const batch = await xswarm.complete({
  prompt: "Summarize this email",
  strategy: "cost-first",  // Override: want free
  qualityGates: {
    minIntelligence: 6,  // Lower bar for simple task
    preferLocal: true   // Local is fine for this
  }
});
```

### Strategy Types

#### 4.1 Balanced (Default)

**Configuration:**
```json
{
  "strategy": "balanced",
  "weights": {
    "cost": 0.4,
    "speed": 0.4,
    "quality": 0.2
  },
  "budget": {
    "daily": 5.00,
    "monthly": 100.00,
    "alertAt": 0.8
  },
  "qualityGates": {
    "minIntelligence": 6,
    "maxLatency": 10000,
    "blockLocal": false
  }
}
```

**Scoring Algorithm:**
```
score = (1 - normalizedCost) * costWeight +
        normalizedSpeed * speedWeight +
        normalizedQuality * qualityWeight
```

**Use Case:** General-purpose usage where no single dimension dominates

#### 4.2 Cost-First

**Configuration:**
```json
{
  "strategy": "cost-first",
  "budget": {
    "daily": 1.00,
    "monthly": 20.00
  },
  "qualityGates": {
    "minIntelligence": 7,
    "maxLatency": 5000,
    "blockLocal": false
  },
  "fallback": "quality"
}
```

**Routing Logic:**
1. Try all free tier models meeting quality gates
2. If none available, check budget headroom
3. If budget allows, use cheapest paid model meeting gates
4. If budget exhausted and `fallback: 'quality'`, use local high-quality model
5. If budget exhausted and `fallback: 'fail'`, return error

**Use Case:** Maximizing free tier usage while maintaining quality floor

**Example - Email Processing:**
```javascript
// Processing 1000 emails, want free but acceptable quality
const response = await xswarm.complete({
  prompt: "Categorize: " + email.subject,
  strategy: "cost-first",
  qualityGates: {
    minIntelligence: 6,  // Lower bar for simple task
    preferLocal: true,   // Local models acceptable
    maxLatency: 5000     // Can wait a bit to save money
  }
});
// Routes to: Local Llama 3.1-8B - 3s response, $0 cost
// Falls back to: Groq free tier if local unavailable
```

#### 4.3 Speed-First

**Configuration:**
```json
{
  "strategy": "speed-first",
  "budget": {
    "daily": 10.00
  },
  "qualityGates": {
    "minIntelligence": 7,
    "maxLatency": 2000,
    "blockLocal": true
  },
  "costTolerance": 2.0
}
```

**Routing Logic:**
1. Filter models meeting quality gates and latency requirement
2. Sort by speed (measured p95 latency from benchmarks)
3. Among top 3 fastest, pick cheapest within `costTolerance` multiplier
4. Never consider local models if `blockLocal: true`

**Use Case:** Interactive applications where response time is critical

**Example - Code Completion:**
```javascript
// User typing in IDE, needs instant suggestions
const response = await xswarm.complete({
  prompt: "Complete this function: def fibonacci(",
  strategy: "speed-first",
  qualityGates: {
    maxLatency: 1000,  // Must respond in <1s
    blockLocal: true   // Local models too slow
  }
});
// Routes to: Groq (Llama 3.1) - 500ms response, free tier
```

#### 4.4 Quality-First

**Configuration:**
```json
{
  "strategy": "quality-first",
  "budget": {
    "monthly": 500.00
  },
  "qualityGates": {
    "minIntelligence": 9,
    "maxLatency": 30000
  },
  "fallback": "error"
}
```

**Routing Logic:**
1. Sort models by intelligence score
2. Pick highest quality model within budget
3. If budget exhausted, return error (don't fall back)

**Use Case:** Critical tasks where accuracy matters more than cost/speed

#### 4.5 Multi-Cast (Research Mode)

**Configuration:**
```json
{
  "strategy": "multi-cast",
  "targets": 3,
  "selection": "diverse",
  "budget": {
    "monthly": 1000.00
  },
  "aggregation": "first"
}
```

**Routing Logic:**
1. Select N models from different providers
2. Send request to all simultaneously
3. Return based on aggregation strategy:
   - `first`: Return first successful response
   - `all`: Return all responses for comparison
   - `consensus`: Return most common answer
   - `best`: Use cheapest model to score quality, return best

**Use Case:** Benchmarking, quality assurance, critical decisions

---

### Strategy Selection Guide

| Task | Recommended Strategy | Typical Provider | Why |
|------|---------------------|------------------|-----|
| **IDE autocomplete** | `speed-first` | Groq (Llama 3.1) | Sub-second response critical |
| **Code review** | `quality-first` | Claude Opus | Need deep analysis |
| **Email categorization** | `cost-first` + `preferLocal` | Local Llama | Simple task, volume high |
| **Customer support** | `balanced` | Claude Haiku (free) | Good quality, decent speed |
| **Legal analysis** | `quality-first` | GPT-4o / Claude Opus | Accuracy critical |
| **Batch summarization** | `cost-first` | Gemini Flash (1M free) | Max free quota |
| **Interactive chat** | `speed-first` | Groq / Gemini Flash | Low latency needed |
| **Research paper** | `quality-first` | Claude Opus | Complex reasoning |
| **Testing/development** | `cost-first` + `preferLocal` | Local Ollama | Unlimited free |

### Free Tier Providers by Use Case

**Speed Champions (Free):**
- **Groq**: Llama 3.1-70B - 500ms typical, 14k tokens/min free
- **Gemini Flash**: 200ms typical, 1M tokens/day free
- **Deepseek**: 300ms typical, 10M tokens/day free

**Quality Champions (Free Tier Available):**
- **Claude Haiku**: Intelligence 7/10, 50k tokens/day free
- **Gemini Pro**: Intelligence 8/10, 50k tokens/day free

**Unlimited Free (Local):**
- **Llama 3.1-8B**: Fast, decent quality, 100% free
- **Llama 3.1-70B**: High quality, slower, 100% free
- **Mistral 7B**: Fast, good for code, 100% free

---

## Budget Management

### Budget Types

```json
{
  "budgets": {
    "hard": {
      "daily": 10.00,
      "monthly": 200.00,
      "perRequest": 0.50
    },
    "soft": {
      "daily": 5.00,
      "monthly": 100.00
    },
    "allocations": {
      "project-A": {"daily": 3.00},
      "project-B": {"daily": 2.00},
      "default": {"daily": 5.00}
    }
  },
  "actions": {
    "onSoftLimit": "warn",
    "onHardLimit": "block",
    "onProjectLimit": "downgrade"
  }
}
```

### Budget Actions

| Action | Description |
|--------|-------------|
| `warn` | Log alert, continue with selected model |
| `downgrade` | Switch to cheaper strategy temporarily |
| `block` | Return error, prevent request |
| `local-only` | Only allow local models |

### Budget Tracking

Track usage at multiple granularities:
- **Global**: Total across all projects
- **Project**: Per-project allocations
- **Period**: Daily, monthly, per-request
- **Provider**: Track free tier exhaustion separately

### Budget Reset Logic

- Daily budgets reset at 00:00 UTC (configurable to user timezone)
- Monthly budgets reset on 1st of month
- Free tier quotas reset per provider's schedule (tracked separately)

---

## Quality Gates & Fallback Logic

### Quality Gate Configuration

```json
{
  "qualityGates": {
    "intelligence": {"min": 7, "max": 10},
    "speed": {"min": 5, "max": 10},
    "latency": {"max": 5000},
    "successRate": {"min": 0.95},
    "contextWindow": {"min": 8000},
    "capabilities": ["streaming"],
    "blocked": ["provider-x"],
    "localOnly": false
  },
  "fallbackStrategy": {
    "onQuotaExceeded": "next-cheapest",
    "onLatencyTimeout": "faster-model",
    "onQualityFailure": "upgrade",
    "maxRetries": 3,
    "retryDelayMs": 1000
  }
}
```

### Smart Fallback Decision Tree

```
Request Arrives
    ↓
Apply Quality Gates (filter models)
    ↓
Check Budget Headroom
    ↓
┌─ Budget OK ─────────────┐
│ Score & Rank Models     │
│ Pick Highest Score      │
└─────────────────────────┘
    ↓
Execute Request
    ↓
┌─ Model Unavailable/Failed? ─┐
│ Check Fallback Strategy     │
├─────────────────────────────┤
│ onQuotaExceeded:            │
│   → next-cheapest: Try next │
│   → local: Use local model  │
│   → error: Return 429       │
│                             │
│ onLatencyTimeout:           │
│   → Try faster model        │
│                             │
│ onQualityFailure:           │
│   → Upgrade to smarter      │
└─────────────────────────────┘
    ↓
Return Response + Metadata
```

### Example Fallback Scenarios

#### Scenario 1: Quota Exhausted, Budget Available
1. Claude Haiku free tier exhausted
2. Budget has $2 remaining
3. Fallback strategy: `next-cheapest`
4. **Action:** Upgrade to GPT-4o-mini ($0.15/1M tokens)

#### Scenario 2: Budget Exhausted, Local Allowed
1. Daily budget $5 spent
2. Local models allowed (`blockLocal: false`)
3. Fallback strategy: `local`
4. **Action:** Route to Llama3-70b locally (warn user of speed impact)

#### Scenario 3: Quality Requirement Unmet
1. Request needs intelligence ≥9
2. All free tier models <9
3. Budget available
4. **Action:** Use Claude Sonnet (paid), log cost justification

#### Scenario 4: Hard Block on Provider
1. Request contains PII
2. Config: `blocked: ['openai', 'google']`
3. Only local models match
4. **Action:** Route to local, regardless of speed

---

## Self-Updating Discovery System

### Discovery Sources & Frequency

| Source | Frequency | Purpose | Reliability |
|--------|-----------|---------|-------------|
| Community Registry | Daily | Models, pricing, capabilities | High |
| Provider APIs | On account add | Verify models exist | High |
| GitHub Awesome Lists | Weekly | Discover new providers | Medium |
| Web Scraping | Weekly | Pricing updates | Medium |
| Crowd Telemetry | Continuous | Performance benchmarks | Low |

### 7.1 Community Registry

**Primary source of truth**, hosted at `https://registry.ai-router.dev/v1/providers.json`

**Structure:**
```json
{
  "version": "2025.02.03",
  "providers": {
    "anthropic": {
      "apiKeyFormat": "sk-ant-api03-[a-zA-Z0-9]{95}",
      "endpoints": {
        "models": "https://api.anthropic.com/v1/models",
        "chat": "https://api.anthropic.com/v1/messages"
      },
      "freeTier": {
        "tokens": 50000,
        "period": "daily",
        "verifiedDate": "2025-01-15",
        "source": "https://www.anthropic.com/pricing"
      },
      "models": {
        "claude-haiku-4-5-20251001": {
          "intelligence": 7,
          "speed": 10,
          "context": 200000,
          "pricing": {"input": 0.25, "output": 1.25}
        }
      }
    }
  }
}
```

### 7.2 Provider API Introspection

When user adds API key, service:
1. Calls provider's `/models` endpoint
2. Validates models exist
3. Extracts context windows, capabilities
4. Merges with registry data

### 7.3 GitHub Awesome Lists Mining

Weekly scan of curated lists:
- `awesome-generative-ai`
- `awesome-llm-apps`
- `awesome-ai-tools`

Extract provider URLs, flag for manual review.

### 7.4 Web Scraping (Optional)

LLM-assisted extraction of pricing from provider documentation:
1. Fetch pricing page HTML
2. Use local Llama to extract structured data
3. Validate against known patterns
4. Flag discrepancies for manual review

### 7.5 Crowd-Sourced Telemetry

Users opt-in to share:
- Model performance metrics (latency, success rate)
- Anonymous usage patterns
- Model quality scores

Aggregated to improve routing decisions.

### Discovery Pipeline

```json
{
  "discovery": {
    "enabled": true,
    "autoApplyUpdates": false,
    "sources": {
      "registry": {
        "enabled": true,
        "url": "https://registry.ai-router.dev/v1/providers.json"
      },
      "github": {
        "enabled": true,
        "repos": ["awesome-generative-ai", "awesome-llm-apps"]
      },
      "scraping": {"enabled": false},
      "telemetry": {"enabled": true, "shareAnonymous": true}
    },
    "schedule": {
      "registry": "0 2 * * *",
      "github": "0 3 * * 0",
      "scraping": "0 4 * * 1",
      "benchmarks": "*/30 * * * *"
    },
    "notifications": {
      "newProviders": true,
      "pricingChanges": true,
      "modelDeprecations": true
    }
  }
}
```

### Auto-Benchmarking

```json
{
  "benchmarking": {
    "enabled": true,
    "schedule": "weekly",
    "testPrompts": [
      {
        "type": "reasoning",
        "prompt": "Explain quantum entanglement",
        "expectedLength": 200
      },
      {
        "type": "coding",
        "prompt": "Write a binary search in Python",
        "expectedLength": 100
      },
      {
        "type": "creative",
        "prompt": "Write a haiku about coffee",
        "expectedLength": 50
      }
    ],
    "metrics": ["latency", "quality", "consistency"],
    "budget": {"monthly": 10.00}
  }
}
```

---

## API Design

### HTTP Endpoints

#### POST /v1/completions

**Request (Speed-First Override):**
```json
{
  "prompt": "Write optimized code for binary search",
  "strategy": "speed-first",
  "qualityGates": {
    "maxLatency": 1000,
    "blockLocal": true
  },
  "project": "ide-autocomplete",
  "metadata": {"taskType": "code-generation"}
}
```

**Request (Cost-First Override):**
```json
{
  "prompt": "Summarize this email thread",
  "strategy": "cost-first",
  "qualityGates": {
    "minIntelligence": 6,
    "preferLocal": true,
    "maxLatency": 5000
  },
  "project": "email-processor"
}
```

**Request (Quality-First Override):**
```json
{
  "prompt": "Review this legal contract",
  "strategy": "quality-first",
  "budget": {"perRequest": 2.00},
  "qualityGates": {
    "minIntelligence": 9,
    "blockLocal": true
  },
  "project": "legal-review"
}
```

**Response:**
```json
{
  "text": "def binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1",
  "routing": {
    "provider": "groq",
    "model": "llama-3.1-8b-instant",
    "reason": "Fastest free model meeting quality gates (500ms avg)",
    "alternatives": [
      {
        "provider": "gemini",
        "model": "gemini-1.5-flash",
        "score": 0.92,
        "reason": "Fast and free, but slightly slower than Groq"
      },
      {
        "provider": "anthropic",
        "model": "claude-haiku-4-5",
        "score": 0.75,
        "reason": "Good quality but slower"
      },
      {
        "provider": "local",
        "model": "llama-3.1-8b",
        "score": 0.40,
        "reason": "Blocked: too slow (3s avg) for speed-first strategy"
      }
    ]
  },
  "usage": {
    "tokensIn": 12,
    "tokensOut": 95,
    "costUsd": 0.00,
    "latencyMs": 520,
    "quotaUsed": {
      "groq": "107 tokens of 14,400/min"
    }
  },
  "budget": {
    "dailySpent": 0.00,
    "dailyRemaining": 5.00,
    "projectSpent": 0.00
  }
}
```

#### GET /v1/budget

**Request:** `GET /v1/budget?project=project-A`

**Response:**
```json
{
  "daily": {
    "limit": 5.00,
    "spent": 2.34,
    "remaining": 2.66,
    "requests": 47
  },
  "monthly": {
    "limit": 100.00,
    "spent": 45.12,
    "remaining": 54.88,
    "requests": 892
  },
  "projects": {
    "project-A": {
      "daily": {"limit": 3.00, "spent": 0.87}
    },
    "default": {
      "daily": {"limit": 2.00, "spent": 1.47}
    }
  },
  "alerts": [
    {
      "type": "soft-limit",
      "message": "project-A at 80% daily budget"
    }
  ]
}
```

#### GET /v1/models

**Request:** `GET /v1/models?available=true&minIntelligence=8`

**Response:**
```json
{
  "models": [
    {
      "provider": "anthropic",
      "name": "claude-sonnet-4-5",
      "intelligence": 9,
      "speed": 7,
      "costPer1M": {"input": 3.00, "output": 15.00},
      "quotaRemaining": 15000,
      "quotaResets": "2025-02-04T00:00:00Z",
      "available": true,
      "estimatedLatency": 1200
    }
  ]
}
```

#### POST /v1/config

**Request:**
```json
{
  "strategy": "balanced",
  "weights": {"cost": 0.3, "speed": 0.5, "quality": 0.2},
  "budget": {"daily": 10.00},
  "qualityGates": {
    "minIntelligence": 7,
    "blockLocal": true
  }
}
```

**Response:**
```json
{
  "updated": true,
  "config": {...},
  "appliesAt": "2025-02-03T15:30:00Z"
}
```

#### GET /v1/analytics

**Request:** `GET /v1/analytics?period=last-7-days`

**Response:**
```json
{
  "period": "last-7-days",
  "totalCost": 23.45,
  "totalRequests": 1203,
  "avgCostPerRequest": 0.0195,
  "byProvider": {
    "anthropic": {
      "requests": 890,
      "cost": 0.00,
      "tier": "free"
    },
    "openai": {
      "requests": 213,
      "cost": 18.34,
      "tier": "paid"
    },
    "local": {
      "requests": 100,
      "cost": 0.00,
      "avgLatency": 4500
    }
  },
  "byModel": {
    "claude-haiku-4-5": {
      "requests": 890,
      "avgLatency": 980
    },
    "gpt-4o-mini": {
      "requests": 213,
      "avgLatency": 1200
    },
    "llama3-70b": {
      "requests": 100,
      "avgLatency": 4500
    }
  },
  "costProjection": {
    "monthlyAtCurrentRate": 93.50,
    "willExceedBudget": false
  }
}
```

#### POST /v1/accounts

**Request:**
```json
{
  "provider": "anthropic",
  "apiKey": "sk-ant-xxx",
  "tier": "free",
  "priority": 1
}
```

**Response:**
```json
{
  "added": true,
  "provider": "anthropic",
  "idx": 0,
  "verified": true,
  "modelsAvailable": ["claude-haiku-4-5", "claude-sonnet-4-5"]
}
```

#### GET /v1/health

**Response:**
```json
{
  "status": "healthy",
  "providers": {
    "anthropic": "ok",
    "openai": "quota_exceeded",
    "local": "ok"
  },
  "uptime": 86400,
  "requestsToday": 127
}
```

---

## Configuration Schema

### Complete Configuration Example

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
      "minIntelligence": 7,
      "maxLatency": 5000,
      "minSuccessRate": 0.95,
      "blockLocal": false,
      "blockedProviders": [],
      "requiredCapabilities": []
    },
    "fallback": {
      "onQuotaExceeded": "next-cheapest",
      "onLatencyTimeout": "faster-model",
      "onQualityFailure": "upgrade",
      "maxRetries": 3
    }
  },
  "budget": {
    "hard": {
      "daily": 10.00,
      "monthly": 200.00,
      "perRequest": 0.50
    },
    "soft": {
      "daily": 5.00,
      "monthly": 100.00
    },
    "allocations": {
      "project-A": {"daily": 3.00},
      "default": {"daily": 7.00}
    },
    "actions": {
      "onSoftLimit": "warn",
      "onHardLimit": "block",
      "onProjectLimit": "downgrade"
    }
  },
  "accounts": {
    "anthropic": [
      {
        "apiKey": "sk-ant-xxx",
        "tier": "free",
        "priority": 1
      },
      {
        "apiKey": "sk-ant-yyy",
        "tier": "pro",
        "priority": 2
      }
    ],
    "openai": [
      {
        "apiKey": "sk-xxx",
        "tier": "pay-as-go",
        "priority": 1
      }
    ],
    "local": [
      {
        "provider": "ollama",
        "endpoint": "http://localhost:11434"
      }
    ]
  },
  "discovery": {
    "enabled": true,
    "autoApplyUpdates": false,
    "sources": {
      "registry": {"enabled": true},
      "github": {"enabled": true},
      "scraping": {"enabled": false},
      "telemetry": {
        "enabled": true,
        "shareAnonymous": true
      }
    }
  },
  "benchmarking": {
    "enabled": true,
    "schedule": "weekly",
    "budget": {"monthly": 10.00}
  },
  "notifications": {
    "budgetAlerts": true,
    "newProviders": true,
    "pricingChanges": true,
    "quotaWarnings": true
  }
}
```

---

## Database Schema

```sql
-- Core tables
CREATE TABLE providers (
  name TEXT PRIMARY KEY,
  display_name TEXT,
  endpoint TEXT,
  api_key_format TEXT,
  discovered_at INTEGER,
  last_verified INTEGER,
  status TEXT  -- 'active' | 'deprecated' | 'testing'
);

CREATE TABLE models (
  provider TEXT,
  name TEXT,
  intelligence INTEGER,  -- 1-10 rating
  speed INTEGER,         -- 1-10 rating
  context_window INTEGER,
  capabilities TEXT,     -- JSON array
  pricing_input REAL,    -- per 1M tokens
  pricing_output REAL,
  free_tier_tokens INTEGER,
  free_tier_period TEXT, -- 'daily' | 'monthly' | 'unlimited'
  last_updated INTEGER,
  PRIMARY KEY (provider, name),
  FOREIGN KEY (provider) REFERENCES providers(name)
);

CREATE TABLE accounts (
  provider TEXT,
  idx INTEGER,
  api_key TEXT,  -- Encrypted
  tier TEXT,     -- 'free' | 'pro' | 'team' | 'enterprise'
  priority INTEGER,
  status TEXT,   -- 'active' | 'quota_exceeded' | 'error'
  last_used INTEGER,
  PRIMARY KEY (provider, idx),
  FOREIGN KEY (provider) REFERENCES providers(name)
);

CREATE TABLE usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER,
  provider TEXT,
  model TEXT,
  project TEXT,
  tokens_in INTEGER,
  tokens_out INTEGER,
  cost_usd REAL,
  latency_ms INTEGER,
  success BOOLEAN,
  error TEXT,
  routing_reason TEXT
);

CREATE TABLE benchmarks (
  provider TEXT,
  model TEXT,
  metric TEXT,  -- 'latency' | 'quality' | 'success_rate'
  value REAL,
  sample_size INTEGER,
  measured_at INTEGER,
  PRIMARY KEY (provider, model, metric)
);

CREATE TABLE budget_tracking (
  period TEXT,   -- '2025-02-03' or '2025-02'
  project TEXT,
  spent_usd REAL,
  requests INTEGER,
  PRIMARY KEY (period, project)
);

CREATE TABLE config_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER,
  config TEXT,  -- JSON snapshot
  reason TEXT
);

CREATE TABLE discovery_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER,
  source TEXT,  -- 'registry' | 'github' | 'scraping' | 'api'
  event_type TEXT,  -- 'new_provider' | 'new_model' | 'pricing_change'
  details TEXT  -- JSON
);

-- Indexes for performance
CREATE INDEX idx_usage_time ON usage(timestamp);
CREATE INDEX idx_usage_project ON usage(project);
CREATE INDEX idx_usage_provider_model ON usage(provider, model);
CREATE INDEX idx_budget_period ON budget_tracking(period);
CREATE INDEX idx_benchmarks_measured ON benchmarks(measured_at);
```

---

## Daemon Architecture & Deployment

### Branding

```
xSwarm-Freeloader 🎟️
─────────────────────────────────
Professional Freeloader for AI Services

"They said there's no free lunch.
 We found 100+ of them."
─────────────────────────────────
Maximize free tiers. Never pay retail.
```

### Service Name

**xSwarm-Freeloader** (`xswarm-freeloader` package name)

**CLI Command:** `xswarm`

### Daemon Service Architecture

```
┌─────────────────────────────────────────────┐
│ xSwarm-Freeloader Daemon Process            │
├─────────────────────────────────────────────┤
│ HTTP Server (Port 3000)                     │
│  ├─ API Endpoints                           │
│  └─ Web UI (Port 3000/ui)                   │
│                                             │
│ Background Workers                          │
│  ├─ Discovery Pipeline (scheduled)         │
│  ├─ Budget Tracker (real-time)             │
│  ├─ Load Monitor (every 30s)               │
│  └─ Benchmark Runner (weekly)              │
│                                             │
│ SQLite Database (~/.xswarm/freeloader.db)  │
│  ├─ Configuration                           │
│  ├─ Usage logs                              │
│  ├─ Benchmarks                              │
│  └─ Provider metadata                       │
│                                             │
│ LiteLLM Manager                             │
│  └─ Child process (localhost:4000)         │
└─────────────────────────────────────────────┘
```

### Installation & Startup

```bash
# Install
npm install -g xswarm-freeloader
# or
brew install xswarm-freeloader

# Initialize (creates ~/.xswarm/)
xswarm init

# Add API keys
xswarm account add anthropic sk-ant-xxx --tier free
xswarm account add openai sk-xxx --tier paid
xswarm account add google sk-yyy --tier free
xswarm account add groq sk-zzz --tier free
xswarm account add local ollama --endpoint http://localhost:11434

# Configure strategy
xswarm config set --strategy balanced --daily-budget 5.00

# Start daemon
xswarm start --daemon
# ✓ LiteLLM proxy started (internal port 4000)
# ✓ xSwarm-Freeloader running at http://localhost:3000
# ✓ Web UI at http://localhost:3000/ui

# Check status
xswarm status
# ✓ xSwarm-Freeloader daemon running (PID: 12345)
# ✓ Daily budget: $2.34 / $5.00 (47%)
# ✓ 127 requests today
# ✓ 6 providers active (4 free tiers available)
# ✓ Groq free tier: 12.5k tokens remaining
# ✓ Gemini free tier: 850k tokens remaining

# View logs
xswarm logs --tail 50

# Stop daemon
xswarm stop
```

### Load Monitoring & Prevention

**Problem**: Switching to slow local models can create request backlog

**Solution**: Real-time load monitoring with smart routing

```javascript
{
  "loadMonitoring": {
    "enabled": true,
    "metrics": {
      "queueDepth": {
        "warning": 10,      // 10+ queued requests
        "critical": 50      // 50+ queued requests
      },
      "avgLatency": {
        "warning": 2000,    // p95 latency > 2s
        "critical": 5000    // p95 latency > 5s
      },
      "errorRate": {
        "warning": 0.05,    // 5% error rate
        "critical": 0.15    // 15% error rate
      }
    },
    "actions": {
      "onWarning": "prefer-faster-models",   // Boost speed weight
      "onCritical": "block-slow-models",     // Disable local models
      "cooldownMinutes": 5                   // Resume normal after 5min
    }
  }
}
```

**Load-Based Routing Adjustment:**

```javascript
// Normal operation
const score = calculateScore(model, {cost: 0.4, speed: 0.4, quality: 0.2});

// Under load (queue depth > 10)
const score = calculateScore(model, {cost: 0.2, speed: 0.7, quality: 0.1});

// Critical load (queue depth > 50)
if (model.speed < 7 || model.local) {
  // Skip slow/local models entirely
  continue;
}
```

### Web UI Features

**Dashboard View:**
```
┌─ xSwarm-Freeloader 🎟️ ─────────────────────┐
│ Status: ● Running  •  127 requests today    │
├─────────────────────────────────────────────┤
│ Budget Today                                 │
│ ████████░░░░░░░░  $2.34 / $5.00 (47%)      │
│                                             │
│ Free Tier Status                            │
│ ● Groq       █████░░░░░ 12.5k / 14k tokens │
│ ● Gemini     ██████████ 850k / 1M tokens   │
│ ● Anthropic  ██░░░░░░░░ 5k / 50k tokens    │
│ ● Deepseek   ██████████ 9.8M / 10M tokens  │
│ ● Local      Unlimited                      │
│                                             │
│ Current Load                                │
│ Queue: 0  •  Avg Latency: 650ms  •  ✓ Fast │
│                                             │
│ Recent Requests                             │
│ 15:23  groq/llama-3.1-8b   $0.00   580ms   │
│ 15:22  gemini-flash        $0.00   420ms   │
│ 15:21  claude-haiku        $0.00   910ms   │
│ 15:20  local/llama-3.1     $0.00   3.2s    │
└─────────────────────────────────────────────┘

[Strategy: Speed-First ▼]  [Budget Settings]  [Logs]
```

**Free Tier Explorer:**
```
┌─ Available Free Tiers ──────────────────────┐
│                                             │
│ 🎟️ Groq                                     │
│    14,400 tokens/min • Resets: never        │
│    Models: Llama 3.1, Mixtral              │
│    Best for: Speed (500ms avg)             │
│                                             │
│ 🎟️ Gemini Flash                             │
│    1M tokens/day • Resets: daily            │
│    Models: Gemini 1.5 Flash                │
│    Best for: High volume, speed            │
│                                             │
│ 🎟️ Deepseek                                 │
│    10M tokens/day • Resets: daily           │
│    Models: Deepseek Chat                   │
│    Best for: Massive free usage            │
│                                             │
│ 🎟️ Anthropic                                │
│    50k tokens/day • Resets: daily           │
│    Models: Claude Haiku                    │
│    Best for: Quality + free                │
│                                             │
│ [+ Discover More Free Tiers]               │
└─────────────────────────────────────────────┘
```

**Routing Decision Viewer:**
```
┌─ Last Request Analysis ─────────────────────┐
│ Prompt: "Write Python bubble sort"          │
│ Strategy: speed-first                        │
│                                             │
│ Scored Candidates:                          │
│ 1. Groq Llama-3.1-8b    Score: 0.95 ⭐      │
│    Speed: 10/10 • Cost: $0 • Quota: ✓       │
│    → SELECTED (500ms response)              │
│                                             │
│ 2. Gemini Flash         Score: 0.92         │
│    Speed: 10/10 • Cost: $0 • Quota: ✓       │
│    → Not selected (slightly slower)         │
│                                             │
│ 3. Claude Haiku         Score: 0.75         │
│    Speed: 9/10 • Cost: $0 • Quota: ✓        │
│    → Not selected (good but slower)         │
│                                             │
│ 4. Local Llama-3.1      Score: 0.40 ❌      │
│    Speed: 5/10 • Cost: $0 • Quota: ✓        │
│    → Blocked (too slow for speed-first)     │
└─────────────────────────────────────────────┘
```

**Strategy Configuration:**
- Visual sliders for cost/speed/quality weights
- Quality gate toggles
- Budget input fields
- Live preview of which models would be selected

**Analytics:**
- Cost over time chart
- Request distribution by provider
- Latency histogram
- Budget burn rate projection

---

## Implementation Roadmap

### Phase 1: MVP (Week 1-2)
**Goal**: Working router with basic strategies

**Features:**
- ✅ SQLite schema + migrations
- ✅ Single provider (Anthropic) integration
- ✅ Basic routing: balanced strategy only
- ✅ Hard budget limits (daily/monthly)
- ✅ HTTP API: `/completions`, `/budget`, `/models`
- ✅ CLI for config management
- ✅ Local model fallback (Ollama)

**Success Criteria**: Can route 100 requests/day across free Claude + paid OpenAI + local Llama

**Deliverables:**
- Working HTTP server
- CLI tool: `ai-router init`, `ai-router account add`, `ai-router start`
- Basic configuration file
- SQLite database with core tables

### Phase 2: Multi-Strategy (Week 3-4)
**Goal**: Flexible routing policies

**Features:**
- ✅ All 5 routing strategies implemented
- ✅ Quality gates enforcement
- ✅ Soft budget limits + actions
- ✅ Project-based budget allocations
- ✅ Fallback decision tree
- ✅ Analytics endpoint
- ✅ Config validation

**Success Criteria**: Users can switch strategies and see measurable cost/speed differences

**Deliverables:**
- Strategy implementation for all 5 types
- Budget enforcement with soft/hard limits
- Analytics dashboard data API
- Comprehensive test suite

### Phase 3: Discovery (Week 5-6)
**Goal**: Self-updating system

**Features:**
- ✅ Community registry client
- ✅ Provider API introspection
- ✅ GitHub awesome list mining
- ✅ Auto-benchmarking system
- ✅ Notification system
- ✅ Manual approval workflow for new providers

**Success Criteria**: Discover Groq launch within 24 hours without code changes

**Deliverables:**
- Discovery pipeline with scheduled jobs
- Registry sync system
- Notification system (email/webhook)
- Provider approval UI

### Phase 4: Polish (Week 7-8)
**Goal**: Production-ready

**Features:**
- ✅ Web dashboard UI
- ✅ Streaming support
- ✅ Request queuing + rate limiting
- ✅ Comprehensive logging
- ✅ Docker deployment
- ✅ API client libraries (JS, Python)
- ✅ Documentation site

**Success Criteria**: Used by openClawd in production

**Deliverables:**
- React dashboard UI
- Docker Compose setup
- Client SDK packages
- Full documentation site

### Phase 5: Advanced (Month 3+)
**Future Features:**
- Embeddings + image generation routing
- Model performance learning from usage patterns
- Multi-region provider support
- Team collaboration features
- Cloud sync for multi-device
- Prompt caching integration
- Advanced analytics (cost attribution, usage patterns)

---

## Success Metrics

### Business Metrics
- **Cost Savings**: 60%+ reduction vs always using paid tier
- **Adoption**: 1000+ active instances within 6 months
- **Retention**: 80%+ monthly active users
- **NPS**: Net Promoter Score >40

### Technical Metrics
- **Routing Accuracy**: 95%+ requests use optimal model per user's strategy
- **Availability**: 99.9% uptime
- **Latency Overhead**: <100ms routing decision time
- **Discovery**: New providers detected within 48 hours
- **Budget Accuracy**: <1% variance from configured limits

### User Satisfaction
- **Budget Adherence**: 99%+ of users stay within configured budgets
- **Quality**: <5% requests require manual model override
- **Transparency**: 90%+ users understand routing decisions (measured via survey)
- **Performance**: No user-reported quality degradation from fallbacks

---

## Non-Goals (For Now)

- ❌ Prompt optimization/caching (use provider features)
- ❌ Fine-tuning management
- ❌ Team billing/invoicing
- ❌ Browser extension
- ❌ Hosted SaaS version (local-only for now)
- ❌ Multi-modal routing (images, audio, video)
- ❌ Real-time collaboration features
- ❌ Mobile apps

---

## Open Questions

### Technical Questions
1. **Budget Reset Timing**: Should budgets reset at midnight UTC or user's timezone?
   - *Proposal*: Default to UTC, allow user override in config
2. **Failed Request Costs**: Do failed requests count against budget?
   - *Proposal*: No, only successful requests count toward budget
3. **Streaming + Fallback**: How to handle mid-stream provider failures?
   - *Proposal*: Buffer first chunk, retry with different model if failure
4. **Model Deprecation**: Auto-migrate to replacement models or require manual update?
   - *Proposal*: Notify + grace period, then auto-migrate with notification

### Product Questions
5. **Privacy**: What telemetry is acceptable for crowd-sourced benchmarks?
   - *Proposal*: Opt-in only, anonymize all data, no prompts/responses shared
6. **Multi-Tenancy**: Support multiple users on same instance with separate budgets?
   - *Proposal*: Phase 5 feature, not MVP
7. **Pricing Discovery**: How to handle provider pricing changes without manual updates?
   - *Proposal*: Weekly scraping + manual review, alert on significant changes
8. **Local Model Quality**: How to rate intelligence/speed for local models?
   - *Proposal*: Run benchmark suite on first use, cache results

### Business Questions
9. **Community Registry**: Who maintains it? How to ensure accuracy?
   - *Proposal*: Open source, community PRs + maintainer review
10. **Monetization**: Is this purely open source or eventual SaaS offering?
    - *Proposal*: Open source core, optional hosted version for enterprises

---

## Appendix: Example Use Cases

### Use Case 1: Chad Jones's Daily Workflow

```javascript
// Morning: Batch processing emails (cheap + fast)
config.strategy = 'cost-first';
config.qualityGates.minIntelligence = 6;
// Process 100 emails via Claude Haiku free tier

// Afternoon: Deep research (quality matters)
config.strategy = 'quality-first';
config.budget.perRequest = 1.00;
// Use Claude Opus for important analysis

// Evening: Code generation (speed critical)
config.strategy = 'speed-first';
config.qualityGates.blockLocal = true;
// Use GPT-4o for fast iteration
```

### Use Case 2: Enterprise Compliance

```json
{
  "strategy": "quality-first",
  "qualityGates": {
    "blockedProviders": ["openai", "google"],
    "localOnly": true
  },
  "budget": {"perRequest": 0},
  "fallback": {"onQuotaExceeded": "error"}
}
```

**Behavior:**
- All requests forced to local models
- No data sent to cloud providers
- Error if local models unavailable
- Perfect for PII/HIPAA compliance

### Use Case 3: AI Researcher Benchmarking

```json
{
  "strategy": "multi-cast",
  "targets": 5,
  "selection": "diverse",
  "budget": {"daily": 50.00},
  "logging": {
    "savePrompts": true,
    "saveResponses": true
  }
}
```

**Behavior:**
- Same prompt sent to 5 different models
- Responses saved for comparison
- Cost distributed across budget
- Perfect for quality analysis

### Use Case 4: Startup MVP Development

```json
{
  "strategy": "cost-first",
  "budget": {"monthly": 50.00, "alertAt": 0.8},
  "qualityGates": {
    "minIntelligence": 7,
    "blockLocal": false
  },
  "fallback": "local"
}
```

**Behavior:**
- Maximize free tiers across all providers
- Fall back to local models when budget tight
- Alerts at 80% budget to prevent surprises
- Scale-friendly as usage grows

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-02-03 | Chad McCullough, Claude | Initial draft |

---

## Feedback & Collaboration

This is a living document. Please submit feedback via:
- GitHub Issues
- Email: [contact email]
- Community Forum: [forum link]

**Next Review Date**: 2025-02-10