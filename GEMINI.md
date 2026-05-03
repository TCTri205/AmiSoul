# 🌌 AmiSoul (ACE v2.1) - AI Assistant Intelligence Guide

Welcome **Antigravity/Gemini**. This is the "Source of Truth" designed specifically for you to capture the soul, technical structure, and roadmap of the **AmiSoul** project.

---

## 🎭 1. Project Identity

**AmiSoul** is not just a chatbot; it is an **"Empathetic AI Companion"**.
- **Goal:** To create an AI capable of deep empathy, long-term associative memory (CMA), and real-world contextual awareness (CAL).
- **Design Philosophy:** "Safe Harbor" — minimalist, quiet, and intimate.
- **Core Engine:** **ACE (AmiSoul Cognitive Engine) v2.1**.

---

## ⚙️ 2. Core Architecture: ACE Pipeline (Stage 0-5)

Every interaction in AmiSoul passes through a 6-stage processing flow:

1.  **Stage 0: Message Buffer & Aggregator (Real-time)**
    *   Aggregates consecutive short messages (Debounce 2.5s - 4s) into a **Message Block**.
    *   Supports **Preemption**: Cancels current text generation if a new message arrives.
2.  **Stage 1: Perception & Smart Router (SLM)**
    *   Analyzes Intent, Sentiment, Complexity (1-10), and Urgency.
    *   Detects **Identity Anomaly** (habit deviation) and **Prompt Injection**.
    *   Routing: Fast Path (simple) vs. Full Cognitive Path (complex).
3.  **Stage 2: Contextual Retrieval (Memory Fetching)**
    *   **CMA (Associative Memory):** Searches for memories via vector similarity + emotion (pgvector).
    *   **CAL (Contextual Awareness):** Checks for pending events, special dates, and habits (Redis).
4.  **Stage 3: Unified Simulation Sandbox (LLM)**
    *   Simulates responses based on **Theory of Mind (ToM)** and **Grice's Maxims**.
    *   Generates a single empathetic response (Single-pass) within a 3000-token budget.
5.  **Stage 4: Vibe & Safety Monitor**
    *   Updates the **Session Vibe** (current mood).
    *   **CAL Fast-track Sync:** Immediately records upcoming events (e.g., "Go to school at 3pm") into RAM Cache.
6.  **Stage 5: Offline Consolidation (Background Workers)**
    *   "Digests" data after 30 minutes of inactivity.
    *   Memory Compression, User Personality Profile (DPE) updates, and **Bonding** score calculation.

---

## 🧠 3. Cognitive Models

| Component | Function | Storage |
| :--- | :--- | :--- |
| **CMA** | Episodic and Semantic memories. | PostgreSQL (pgvector) |
| **DPE** | User personality and tendency modeling. | PostgreSQL |
| **CAL** | Time awareness, upcoming events, and pending states. | Redis (L1) / DB (L2) |
| **Bonding** | Long-term connection score (0-100) — "Climate". | Database |
| **Vibe** | Immediate emotional state of the session — "Weather". | Redis (RAM) |

---

## 🛠️ 4. Technical Stack

- **Backend:** NestJS (Node.js) + TypeScript.
- **AI Models:** 
  - **Groq (Llama-3/Mixtral):** High-speed processing (Priority 1 for Perception/Simulation).
  - **Gemini 2.5 Flash:** Primary processing & fallback (Reasoning, Simulation, Perception).
  - **Text Embeddings:** Gemini Embedding API.
- **Database:** 
  - **PostgreSQL:** Persistent data storage.
  - **pgvector:** Vector search for memory.
  - **Prisma:** Primary ORM (with AES-256 encryption middleware).
- **Cache/Queue:** 
  - **Redis:** Buffer, Vibe, and CAL L1 storage.
  - **BullMQ:** Offline task processing (Stage 5).
- **Frontend:** Next.js + Socket.io ("Safe Harbor" design).

---

## 📅 5. Roadmap & Status

The project is divided into 9 Sprints. Current status:
- **Status:** **Sprint-03 (Affective Memory & Security)** — `🔵 In Progress`.
- **Completed Tickets:**
  - [T1.1 - T1.7: Sprint-01 Foundation](docs/project_managements/ticket/Sprint-01/README.md) — `✅ Completed`.
  - [T2.1 - T2.8: Sprint-02 Perception & Routing](docs/project_managements/ticket/Sprint-02/README.md) — `✅ Completed`.
  - [T3.1 - T3.4: Sprint-03 Affective Memory](docs/project_managements/ticket/Sprint-03/README.md) — `🔵 In Progress (4/8)`.
- **Next Goal:** [T3.8: Prisma Encryption Middleware](docs/project_managements/ticket/Sprint-03/T3.8_Prisma_Encryption_Middleware.md).

---

## 📜 6. AI Operating Guidelines

When acting as an architect or coder for AmiSoul, you must adhere to:
1.  **Empathy is Priority:** All conversation logic must aim to optimize emotional resonance (Vibe/Bonding).
2.  **Low Latency (< 3s):** Always optimize AI calls (Single-pass prompts, SLM).
3.  **Persona Consistency:** AmiSoul is always positive, calm, and never mirrors extreme negative behaviors from the user.
4.  **Absolute Safety (Crisis Protocol):** If `Urgency_Score` is high, trigger the Safety Template with support hotline information.

---

## 📁 7. Documentation Directory Structure

- `/docs/architecture`: Detailed designs of ACE, Technical Arch, SRS.
- `/docs/project_managements`: Epics, Sprint Tickets, Dashboard.
- `/docs/method`: Foundational research (CMA, DPE, MECP).
- `/docs/research`: Psychological and human memory mechanism research.

---

## 🤖 8. Internal Rules & Skills

To support fast and accurate development, we use Antigravity's internal configuration:

### 📜 Rules
- **[AGENTS.md](./AGENTS.md):** General rules for all AI assistants (Root).
- **[Tech Standards](./.agents/rules/tech_standards.md):** Coding standards for NestJS, Prisma, and ACE Pipeline.

### 🛠️ Skills
- **`sync_ticket_status`:** Automatically syncs progress between tickets and the Dashboard.
- **`ace_stage_generator`:** Quickly generates boilerplates for new Stages.
- **`nodejs-backend-patterns`:** Advanced NestJS development guidance.
- **`logic-lens`:** Logic analysis and planning skill.
- **`testing-qa`:** Quality assurance and test execution.

> [!NOTE]
> This file (`GEMINI.md`) should be updated after every Sprint to reflect current progress and major architectural changes.
