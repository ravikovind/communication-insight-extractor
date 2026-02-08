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

