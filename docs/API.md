# API Documentation

xSwarm-Freeloader HTTP API - All endpoints return JSON.

## Base URL

```
http://localhost:3000/v1
```

---

## Endpoints

### POST /v1/completions

Make a completion request with intelligent routing.

**Request Body:**

```json
{
  "prompt": "Write a hello world program in Python",
  "strategy": "balanced",
  "qualityGates": {
    "minIntelligence": 6,
    "minSpeed": 5,
    "blockLocal": false
  },
  "project": "my-project",
  "max_tokens": 1024
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | ✅ | The prompt text |
| `strategy` | string | ❌ | Routing strategy: `balanced`, `cost-first`, `speed-first`, `quality-first` (default: `balanced`) |
| `qualityGates` | object | ❌ | Quality gate filters |
| `qualityGates.minIntelligence` | number | ❌ | Minimum intelligence (1-10) |
| `qualityGates.minSpeed` | number | ❌ | Minimum speed (1-10) |
| `qualityGates.maxLatency` | number | ❌ | Maximum latency in ms |
| `qualityGates.blockLocal` | boolean | ❌ | Block local models (default: `false`) |
| `qualityGates.blockedProviders` | string[] | ❌ | List of providers to block |
| `project` | string | ❌ | Project name for budget tracking (default: `default`) |
| `max_tokens` | number | ❌ | Maximum tokens to generate (default: `1024`) |

**Response:**

```json
{
  "text": "def hello_world():\n    print('Hello, World!')\n\nif __name__ == '__main__':\n    hello_world()",
  "usage": {
    "prompt_tokens": 8,
    "completion_tokens": 25,
    "total_tokens": 33
  },
  "routing": {
    "provider": "anthropic",
    "model": "claude-haiku-4-5-20251001",
    "rank": 1,
    "total_candidates": 2,
    "attempts": 1,
    "reason": "Balanced strategy (rank 1/2): cost=0.98, speed=1.00, quality=0.70, score=0.936"
  },
  "cost": 0.0000083,
  "latency": 1234,
  "model": "claude-haiku-4-5-20251001",
  "provider": "anthropic"
}
```

**Error Codes:**

- `400` - Invalid request or budget exceeded
- `503` - No providers available

---

### GET /v1/budget

Get budget status for a project.

**Query Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `project` | string | ❌ | Project name (default: `default`) |

**Response:**

```json
{
  "project": "default",
  "daily": {
    "spent": 0.0243,
    "limit": 10.00,
    "remaining": 9.9757,
    "percent": 0.24,
    "soft_limit_exceeded": false,
    "hard_limit_exceeded": false
  },
  "monthly": {
    "spent": 1.52,
    "limit": 200.00,
    "remaining": 198.48,
    "percent": 0.76,
    "soft_limit_exceeded": false,
    "hard_limit_exceeded": false
  }
}
```

---

### GET /v1/models

List all available models.

**Response:**

```json
{
  "total": 2,
  "providers": [
    {
      "name": "anthropic",
      "display_name": "Anthropic",
      "status": "active",
      "models": [
        {
          "name": "claude-haiku-4-5-20251001",
          "intelligence": 7,
          "speed": 10,
          "context_window": 200000,
          "pricing": {
            "input": 0.25,
            "output": 1.25,
            "currency": "USD",
            "per": "1M tokens"
          },
          "free_tier": {
            "tokens": 50000,
            "period": "daily"
          }
        }
      ]
    },
    {
      "name": "local",
      "display_name": "Ollama (Local)",
      "status": "active",
      "models": [
        {
          "name": "llama-3.1-8b",
          "intelligence": 7,
          "speed": 5,
          "context_window": 128000,
          "pricing": {
            "input": 0.0,
            "output": 0.0,
            "currency": "USD",
            "per": "1M tokens"
          },
          "free_tier": {
            "tokens": -1,
            "period": "unlimited"
          }
        }
      ]
    }
  ]
}
```

---

### GET /v1/accounts

List all configured accounts (with masked API keys).

**Response:**

```json
{
  "accounts": [
    {
      "provider": "anthropic",
      "idx": 0,
      "api_key": "sk-ant-api...xyz123",
      "tier": "free",
      "priority": 0,
      "status": "active",
      "created_at": 1738646400,
      "last_used": null
    }
  ]
}
```

---

### POST /v1/accounts

Add a new account.

**Request Body:**

```json
{
  "provider": "anthropic",
  "api_key": "sk-ant-api03-xxxxx",
  "tier": "free",
  "priority": 0
}
```

**Response:**

```json
{
  "message": "Account added successfully",
  "account": {
    "provider": "anthropic",
    "idx": 0,
    "tier": "free",
    "status": "active"
  }
}
```

**Note:** Restart daemon to apply changes.

---

### DELETE /v1/accounts/:provider/:idx

Delete an account.

**Parameters:**

- `provider` - Provider name (e.g., `anthropic`)
- `idx` - Account index (e.g., `0`)

**Response:**

```json
{
  "message": "Account deleted successfully"
}
```

---

### GET /v1/health

Check daemon health status.

**Response:**

```json
{
  "status": "ok",
  "timestamp": 1738646400000,
  "database": {
    "providers": 2,
    "models": 2,
    "accounts": 1
  },
  "litellm": {
    "running": true,
    "healthy": true
  },
  "budget": {
    "daily": {
      "spent": 0.0243,
      "limit": 10.00,
      "remaining": 9.9757
    },
    "monthly": {
      "spent": 1.52,
      "limit": 200.00,
      "remaining": 198.48
    }
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "message": "Daily budget exceeded for project default",
    "statusCode": 400,
    "period": "daily",
    "spent": 10.05,
    "limit": 10.00
  }
}
```

**Common Error Codes:**

- `400` - Bad request (invalid input, budget exceeded)
- `401` - Invalid API key
- `404` - Resource not found
- `429` - Quota exceeded
- `500` - Internal server error
- `503` - Service unavailable (no providers)

---

## Usage Examples

### cURL

```bash
# Make a completion request
curl -X POST http://localhost:3000/v1/completions \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain quantum computing in simple terms",
    "strategy": "balanced",
    "max_tokens": 500
  }'

# Check budget
curl http://localhost:3000/v1/budget?project=my-project

# List models
curl http://localhost:3000/v1/models

# Check health
curl http://localhost:3000/v1/health
```

### JavaScript (fetch)

```javascript
const response = await fetch('http://localhost:3000/v1/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Write a haiku about coding',
    strategy: 'balanced',
    project: 'my-app'
  })
});

const result = await response.json();
console.log(result.text);
```

### Python (requests)

```python
import requests

response = requests.post('http://localhost:3000/v1/completions', json={
    'prompt': 'Generate a random password',
    'strategy': 'cost-first',
    'max_tokens': 100
})

result = response.json()
print(result['text'])
```

---

## Routing Strategies

### balanced (default)

Weights: cost 40%, speed 40%, quality 20%

Best for general use - balances cost savings with performance.

### cost-first

Weights: cost 70%, speed 20%, quality 10%

Prioritizes free tier models, minimizes cost. May be slower.

### speed-first

Weights: cost 10%, speed 70%, quality 20%

Prioritizes fast responses. May cost more.

### quality-first

Weights: cost 10%, speed 20%, quality 70%

Prioritizes most intelligent models. Usually costs more.

---

## Budget Management

Budgets are tracked per project:

- **Hard limits**: Requests blocked when exceeded
- **Soft limits**: Warning logged, requests continue

Configure in `~/.xswarm/config.json`:

```json
{
  "budget": {
    "hard": {
      "daily": 10.00,
      "monthly": 200.00
    },
    "soft": {
      "daily": 5.00,
      "monthly": 100.00
    }
  }
}
```

Reset timing:
- Daily: 00:00 UTC
- Monthly: 1st of month, 00:00 UTC

---

## OpenAI SDK Compatibility

xSwarm-Freeloader is **partially** compatible with OpenAI SDK patterns:

```javascript
// Use completions endpoint
const completion = await fetch('http://localhost:3000/v1/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Hello',  // Note: use 'prompt', not 'messages'
    strategy: 'balanced'
  })
});
```

For full OpenAI compatibility, use LiteLLM directly on port 4000.
