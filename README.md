# LLM Lab — Backend

The backend API powering the LLM Lab experimentation platform. It orchestrates parameterized LLM calls, computes response quality metrics, runs background sweeps with progress tracking, and persists experiment data for comparison and analysis.

## Tech Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** NestJS v11
- **Database:** MongoDB (via Mongoose)
- **LLM Provider:** Google Gemini (multi-model support)
- **Validation:** class-validator / class-transformer
- **Rate Limiting:** @nestjs/throttler (10 requests / 60s)

## Architecture

```
src/
├── config/                    # Environment configuration
├── experiment/
│   ├── constants/             # Presets, benchmarks, scoring weights
│   ├── dto/                   # Request validation
│   ├── schemas/               # Mongoose schemas
│   ├── experiment.service.ts  # Orchestration + background jobs
│   ├── sweep-suggest.service.ts
│   └── experiment.controller.ts
├── favorites/                 # Server-synced favorites (anonymous client ID)
├── llm/                       # Gemini integration + LLM-as-judge
├── metrics/                   # Weighted heuristic scoring engine
└── helpers/                   # Parameter combinations, retry/backoff
```

| Module | Responsibility |
|--------|----------------|
| **ExperimentModule** | CRUD, async sweeps, duplicate/narrow/regression/benchmark |
| **LlmModule** | Gemini calls with system prompts, multi-model, token/cost metadata |
| **MetricsService** | Eight heuristic metrics with configurable weights |
| **SweepSuggestService** | Parameter impact analysis + heatmap data |
| **FavoritesModule** | Persist starred experiments per anonymous client |

## Features

### Core sweep engine
- Cartesian product sweeps across **temperature**, **topP**, **topK**, and **maxToken**
- Optional **system prompt** on every variant
- **Multi-model sweeps** — run the same grid on multiple Gemini models
- **Custom scoring weights** — tune how each metric contributes to the composite score

### Background jobs & reliability
- Experiments return immediately with `status: queued` and process **asynchronously**
- Live **progress** tracking (`completed / total / failed`)
- **Retry with exponential backoff** on Gemini 429 / quota errors
- **Resume** incomplete sweeps from the last completed variant

### Analysis & iteration
- **Parameter heatmap data** — temperature × topP average scores
- **Auto-suggest next sweep** — narrows the grid around the best variant
- **Duplicate experiment** — re-run the same config
- **Narrow sweep** — focused grid from the winning parameters
- **Regression check** — re-run and compare best score vs baseline

### LLM-as-judge
- Optional **judge pass** per variant during sweep (`enableJudge: true`)
- On-demand **POST /experiment/:id/judge** for existing experiments
- Stores `judgeScore` + `judgeRationale` alongside heuristic scores

### Prompt presets & benchmarks
- **GET /experiment/presets** — curated templates (explain, JSON, marketing, code review)
- **POST /experiment/benchmark** — golden suite of 5 standard prompts with default grids

### Sharing & organization
- **Public share links** via `shareToken` (read-only)
- **Tags** on experiments for filtering
- **Human ratings** (`up` / `down`) per response

### Cost & latency
- Per-variant **latencyMs**, **inputTokens**, **outputTokens**
- **estimatedCostUsd** based on model pricing table

### Favorites (server-synced)
- Anonymous **`X-Client-Id`** header syncs stars to MongoDB
- Endpoints: `GET /favorites`, `POST /favorites/sync`, `PATCH /favorites/:id/toggle`

### Export
- Full experiment JSON via **GET /experiment/:id/export/json**

## How It Works

1. Client submits a prompt, optional system prompt, parameter arrays, models, and scoring weights.
2. API creates an experiment in `queued` state and starts background processing.
3. For each parameter × model combination, Gemini is called with retry/backoff.
4. Each response is scored with weighted heuristics; optional judge pass runs.
5. On completion, **suggested next sweep** is computed from parameter impact analysis.
6. Progress and results are persisted in MongoDB for polling and export.

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/` | Health check |
| `GET` | `/experiment/presets` | List prompt sweep templates |
| `POST` | `/experiment/benchmark` | Run golden benchmark suite |
| `POST` | `/experiment` | Create experiment (async background sweep) |
| `GET` | `/experiment` | List all experiments |
| `GET` | `/experiment/share/:token` | Public read-only shared experiment |
| `GET` | `/experiment/:id` | Get experiment by ID |
| `GET` | `/experiment/:id/status` | Poll job status + progress |
| `GET` | `/experiment/:id/heatmap` | Temperature × topP heatmap data |
| `GET` | `/experiment/:id/suggest-sweep` | Suggested narrowed parameter grid |
| `GET` | `/experiment/:id/export/json` | Export full experiment JSON |
| `POST` | `/experiment/:id/resume` | Resume incomplete sweep |
| `POST` | `/experiment/:id/duplicate` | Clone and re-queue sweep |
| `POST` | `/experiment/:id/narrow-sweep` | Queue focused sweep around winner |
| `POST` | `/experiment/:id/judge` | Run LLM judge on all responses |
| `POST` | `/experiment/:id/regression` | Re-run and compare vs baseline |
| `PATCH` | `/experiment/:id/share` | Enable/disable public share link |
| `PATCH` | `/experiment/:id/tags` | Update experiment tags |
| `PATCH` | `/experiment/:id/responses/:index/rate` | Human thumbs up/down |
| `DELETE` | `/experiment/:id` | Delete experiment |
| `GET` | `/favorites` | List favorited experiment IDs |
| `POST` | `/favorites/sync` | Sync favorites from client |
| `PATCH` | `/favorites/:experimentId/toggle` | Toggle favorite |

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (local or hosted)
- Google Gemini API key

### Environment Variables

Create a `.env` file in the project root:

```env
PORT=4000
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash-001
GEMINI_MODELS=gemini-2.0-flash-001,gemini-2.5-flash,gemini-2.5-flash-lite
MONGO_URI=your_mongodb_connection_string
```

### Installation

```bash
npm install
```

### Running the Server

```bash
# Development (watch mode)
npm run start:dev

# Production
npm run start:prod
```

The server starts on `http://localhost:4000` by default.

### Running Tests

```bash
npm run test
npm run test:e2e
npm run test:cov
```

## Deployment

The backend is deployed on [Render](https://llm-lab-backend.onrender.com).

## License

MIT
