# Communication Insight Extractor

A full-stack application that processes Slack-like messages through an LLM to extract actionable insights — key topics, sentiment per author, and response time patterns. Built as an async technical challenge for Yander.

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Python 3.10+
- Node.js 18+
- Anthropic API key

### 1. Clone & configure

```bash
git clone https://github.com/ravikovind/communication-insight-extractor.git
cd communication-insight-extractor
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### 2. Start PostgreSQL

```bash
docker-compose up -d
```

### 3. Start the backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs on `http://localhost:8000`. API docs at `/docs`.

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`.

### 5. Use the app

1. Click **Load Sample Data** — uploads 25 Slack-like messages to the database
2. Click **Run Analysis** — sends messages to Claude API, extracts insights
3. View the dashboard — topics, sentiment per author, and response time patterns

---

## Approach

### Architecture

```
Frontend (Next.js)  →  Backend (FastAPI)  →  PostgreSQL
                           ↓
                     Claude API (Anthropic)
```

- **Backend**: FastAPI with async SQLAlchemy + asyncpg. Async throughout — the LLM calls are I/O-bound, so non-blocking execution matters.
- **Database**: PostgreSQL with two tables — `messages` (structured) and `analysis_results` (JSONB). JSONB was chosen because LLM outputs are semi-structured; rigid schemas would require migrations every time we tweak the prompt.
- **LLM**: Anthropic Claude (claude-sonnet-4-5-20250929). Two API calls — one for topic extraction, one for sentiment analysis. Response time patterns are computed from timestamps without LLM involvement (no point spending tokens on arithmetic).
- **Frontend**: Next.js 16 with App Router, shadcn/ui components, dark theme. Single-page dashboard with load → analyze → view flow.

### Key Decisions

Full decision log in [`DECISIONS.md`](DECISIONS.md). Highlights:

1. **JSONB for analysis results** — LLM outputs change shape as you iterate on prompts. A rigid schema would fight you. JSONB with Pydantic validation on the app side gives flexibility without losing queryability.

2. **API versioning (`/api/v1/`)** — Trivial to add upfront, painful to retrofit. Shows intentional API design.

3. **No hardcoded credential defaults** — `os.environ[]` instead of `os.getenv()` with fallbacks. Fail-fast on missing config is better than silently connecting to the wrong database.

4. **Message deduplication at the DB level** — Unique constraint on `(channel, author, timestamp)` with `ON CONFLICT DO NOTHING`. Data integrity belongs in the database, not in application-level checks.

5. **Markdown fence stripping for LLM responses** — Claude wraps JSON in code fences despite being told not to. A simple regex strip is more reliable than prompt engineering for output format.

---

## Trade-offs

| Decision | What I chose | What I gave up | Why |
|----------|-------------|----------------|-----|
| Single analysis table (JSONB) | Schema flexibility | Type safety at DB level | LLM outputs are unstable; Pydantic handles validation |
| Two separate LLM calls | Simpler prompts, clearer output | Fewer API calls (could batch) | Reliability > cost for 25 messages |
| No authentication | Faster development | Multi-user support | Demo app, single-user is explicit requirement |
| No streaming | Simpler implementation | Better UX during analysis | Analysis takes ~5s, not worth the complexity |
| Dark-only theme | Faster shipping | Light mode users | Demo preference, not a product constraint |
| Sample data in `/public/` | Simple loading | Dynamic file upload | Sufficient for demo; upload endpoint exists for programmatic use |

---

## AI Tooling

### What I used

**Claude Code** (Anthropic's CLI tool) — used throughout as a collaborative coding partner.

### How I used it

- **Planning**: Claude Code helped structure the implementation plan, break it into phases, and surface decisions that needed explicit reasoning (stored in `DECISIONS.md`).
- **Scaffolding**: Generated boilerplate — FastAPI app structure, SQLAlchemy models, Pydantic schemas, Next.js page layout. This is where AI saves the most time.
- **LLM prompt design**: Drafted the extraction prompts for topics and sentiment analysis. I reviewed and iterated on the output format.
- **Bug fixing**: When the LLM response parsing broke (markdown fences in JSON output), Claude Code identified the root cause from the traceback and proposed the regex stripping fix.
- **Code review**: Caught a security issue — hardcoded database credentials as fallback defaults in `config.py`. Flagged and fixed immediately.

### Where I made manual decisions

- **Architecture choices**: Tech stack, schema design, API versioning — these require context about the problem and the reviewer's expectations. AI proposed options; I chose.
- **What NOT to build**: No auth, no streaming, no light mode, no file upload UI. Knowing what to cut is a human judgment call under time constraints.
- **Data modeling**: The unique constraint on messages and the JSONB approach for analysis results were deliberate choices based on how the data flows, not boilerplate.
- **Theme and UI preferences**: Dark palette, font choices, component selection — these reflect personal design sensibility.

### Honest assessment

AI accelerated this project significantly — probably 2-3x faster than writing everything manually. The biggest wins were in boilerplate generation and debugging. The biggest risk is accepting generated code without understanding it. Every file in this repo was reviewed and understood before committing.

---

## What I'd Improve With More Time

1. **Streaming analysis results** — Use SSE to stream LLM responses as they arrive instead of waiting for both calls to complete. Better UX for larger datasets.

2. **Structured output mode** — Use Claude's tool use / function calling instead of free-text JSON parsing. More reliable than regex stripping, eliminates parse failures.

3. **Message threading** — The current response time analysis treats all channel messages as a flat sequence. Real Slack has threads — threading would make response time patterns more meaningful.

4. **Incremental analysis** — Currently re-analyzes all messages every time. With more data, you'd want to analyze only new messages and merge results.

5. **Testing** — No tests in this submission. I'd add: API endpoint tests (pytest + httpx), LLM service tests with mocked responses, and frontend component tests (React Testing Library).

6. **File upload** — The API accepts any JSON array via POST, but the frontend only loads the bundled sample data. A drag-and-drop upload would make it more interactive.

7. **Caching** — Analysis results are stored but the app always re-runs analysis on button click. Could check if messages haven't changed and return cached results.

---

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, lifespan
│   │   ├── config.py            # Environment variable loading
│   │   ├── database.py          # Async SQLAlchemy engine + session
│   │   ├── models.py            # Message + AnalysisResult models
│   │   ├── schemas.py           # Pydantic request/response schemas
│   │   ├── routers/
│   │   │   ├── messages.py      # POST/GET /api/v1/messages/
│   │   │   └── insights.py      # POST /api/v1/insights/analyze, GET /api/v1/insights/
│   │   └── services/
│   │       ├── llm.py           # Claude API integration
│   │       └── analysis.py      # Response time computation
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx       # Root layout, fonts, theme
│   │   │   ├── page.tsx         # Dashboard page
│   │   │   └── globals.css      # Dark theme, CSS variables
│   │   ├── components/ui/       # shadcn/ui components
│   │   └── lib/
│   │       └── api.ts           # Backend API client
│   └── public/
│       └── sample_messages.json
├── data/
│   └── sample_messages.json     # Source sample data
├── docker-compose.yml           # PostgreSQL 16
├── DECISIONS.md                 # Technical decision log
├── .env.example                 # Environment variable template
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check message |
| `GET` | `/health` | Health status |
| `POST` | `/api/v1/messages/` | Upload messages (JSON array). Deduplicates on conflict. |
| `GET` | `/api/v1/messages/` | Get all stored messages |
| `POST` | `/api/v1/insights/analyze` | Run LLM analysis on stored messages |
| `GET` | `/api/v1/insights/` | Get all analysis results |

---

## Sample Data

No sample data was attached in the challenge email, so I created a representative dataset: 25 messages across 3 channels (`#engineering`, `#product`, `#general`) from 5 authors, covering a single workday. The messages include technical discussions, product planning, incident response, and general announcements — realistic enough to produce meaningful insights.
