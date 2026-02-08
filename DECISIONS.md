# Decision Log

## 001 — Tech Stack Selection

**Date:** 2025-02-09
**Decision:** Use FastAPI + PostgreSQL + Next.js + Anthropic Claude API

**Reasoning:**
- FastAPI: async-native, good for I/O-bound LLM calls, minimal boilerplate
- PostgreSQL: JSONB support for flexible insight storage, robust and battle-tested
- Next.js (App Router): React ecosystem, server components for initial load, good DX
- Anthropic Claude: aligns with Yander's stack, strong structured output capabilities

**Alternatives considered:**
- Flask/Django: heavier, less async-native
- MongoDB: flexible schema but overkill, PostgreSQL JSONB covers our needs
- OpenAI: viable but Claude aligns with target company stack

**Tradeoffs:**
- AsyncPG adds complexity vs sync psycopg2, but worth it for non-blocking LLM calls
- Next.js is heavier than plain React/Vite for a demo, but demonstrates full-stack capability

---

## 002 — Database Schema: JSONB for Analysis Results

**Date:** 2025-02-09
**Decision:** Store LLM analysis results as JSONB in a single `analysis_results` table with an `analysis_type` discriminator.

**Reasoning:**
- LLM outputs are semi-structured — rigid column schemas would be fragile
- JSONB allows querying into results without schema migration
- Single table with type discriminator keeps it simple for a demo

**Alternatives considered:**
- Separate tables per insight type (topics, sentiment, response_time): more normalized but adds complexity without benefit at this scale
- Storing raw LLM response text: loses queryability

**Tradeoffs:**
- Less type safety at the DB level — mitigated by Pydantic validation on the application side

---

## 003 — Single Root-Level .env (No backend/.env.example)

**Date:** 2025-02-09
**Decision:** Keep a single `.env.example` at project root. No separate `backend/.env.example`.

**Reasoning:**
- Backend runs from project root context, loads `../.env` or root `.env`
- Duplicating env files creates maintenance burden and drift risk
- README will document the single `.env` setup clearly

**Alternatives considered:**
- Separate `backend/.env.example`: clearer if someone opens only `backend/`, but duplication

**Tradeoffs:**
- Slightly less obvious for backend-only exploration — acceptable for a monorepo demo

---

## 004 — No Hardcoded Credential Defaults in Config

**Date:** 2025-02-09
**Decision:** Use `os.environ[]` (raises `KeyError`) instead of `os.getenv()` with fallback defaults for `DATABASE_URL` and `ANTHROPIC_API_KEY`.

**Reasoning:**
- Hardcoded defaults leak credentials in source code, even if they're local dev creds
- Fail-fast on missing config is better than silently connecting with wrong credentials
- Forces explicit `.env` setup — no ambiguity about which DB you're hitting

**Alternatives considered:**
- `os.getenv()` with defaults: convenient for quick setup but bad security habit
- Pydantic `BaseSettings`: more robust validation but overkill for two env vars at this stage

**Tradeoffs:**
- Slightly more setup friction — user must create `.env` before running. Mitigated by `.env.example`

---

## 005 — API Versioning (v1 prefix)

**Date:** 2025-02-09
**Decision:** Prefix all API routes with `/api/v1/`.

**Reasoning:**
- Allows non-breaking evolution — new versions coexist with old ones
- Standard REST practice, shows intentional API design
- Trivial to implement via router prefix in FastAPI

**Alternatives considered:**
- No versioning (`/api/messages`): simpler but locks you in if the schema changes
- Header-based versioning: more flexible but harder to test and document

**Tradeoffs:**
- Slightly longer URLs — negligible cost

---

## 006 — LLM Response Parsing: Strip Markdown Fences

**Date:** 2025-02-09
**Decision:** Parse LLM responses by stripping markdown code fences before JSON parsing, rather than relying on raw JSON output.

**Reasoning:**
- Claude often wraps JSON in ```json ... ``` blocks despite being told not to
- Regex stripping is simple, defensive, and handles both fenced and raw JSON
- Avoids fragile prompt engineering to suppress markdown formatting

**Alternatives considered:**
- Strict prompt instructions ("return ONLY JSON"): unreliable, model still wraps
- Claude's tool use / structured output mode: more robust but adds API complexity for a demo

**Tradeoffs:**
- Regex is a heuristic — could break on unusual formatting. Acceptable for controlled demo use

