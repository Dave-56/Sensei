# Sensei (Evolved)

## Overview
**Timeline:** 2 weeks  
**Core Product:** A simple SDK that wraps around your AI calls + a dashboard
**Target:** Growth-stage AI companies with PMs who need to understand what's breaking (and vibe-coder founders at early stage)

## Four Features

### 1. Conversation Health Score
**Question:** Did the user get what they needed?

**How it works:**
- Analyzes each conversation: completion signals, user sentiment trajectory, resolution indicators
- Outputs single 0-100 score per conversation
- Shows trend over time (e.g., "72% healthy, ↓8% from last week")

**PM Value:** Quick pulse check on "is my AI working?"

**Implementation:**
- LLM judge evaluates: Did conversation complete? Was user satisfied? Did they get their answer?
- Weight: 40% completion, 30% sentiment, 30% resolution
- Week 1: Basic version (completion + keyword sentiment)
- Week 2: Refine with trajectory analysis

---

### 2. Automatic Problem Detection
**Purpose:** Flags conversations that failed and why

**Detection Signals:**
- **Loops:** AI repeats same response, user repeats same request 3+ times
- **Nonsense:** LLM judge flags incoherent/irrelevant responses
- **User frustration:** "this isn't working", shorter messages over time, abandonment
- **Low health score:** Catches issues the heuristics miss

**PM Value:** "Show me what broke today"

**Dashboard view:**
```
🔴 23 problem conversations detected (last 7 days)

[Filter: All Problems ▼] [Date Range: Last 7 Days ▼]

┌─────────────────────────────────────────┐
│ Problems Timeline                        │
│     ●                                    │
│  ●  ● ●         ●                       │
│ ●●●●●●●●●●   ●●●●                      │
└─────────────────────────────────────────┘

[View all problem traces →]
```

---

### 3. Problem Clustering (NEW - the axial coding automation)
**Question:** What are my most common failure modes?

**How it works:**
1. Takes all flagged problem conversations
2. LLM generates error description for each ("AI didn't transfer when user asked")
3. Clusters similar errors together via embeddings
4. Names each cluster ("Human handoff issues")
5. Ranks by frequency

**Output (like Hamel's screenshot):**
```
┌─────────────────────────────────────────┐
│  Top Problems (Last 7 Days)             │
├─────────────────────────────────────────┤
│  Conversational flow issues        17   │ [View traces →]
│  Human handoff failures            13   │ [View traces →]
│  Tour scheduling errors             8   │ [View traces →]
│  Formatting/output issues           2   │ [View traces →]
└─────────────────────────────────────────┘
```

**PM Value:** "What should I fix first?" - automatically prioritized by impact

**Critical UX:** Each cluster links to example traces so PM can verify the categorization

**Implementation:**
- Week 1: Manual grouping / simple keyword matching to validate concept
- Week 2: Embedding-based clustering with LLM-generated names

---

### 4. Usage Pattern Clustering
**Question:** What are people actually trying to do, and which use cases work well?

**How it works:**
- Clusters conversations by user intent (embeds first user message)
- Shows health score breakdown per cluster
- Auto-determines 5-10 clusters, PMs can rename them

**Dashboard view:**
```
┌─────────────────────────────────────────┐
│  Usage by Intent                         │
├─────────────────────────────────────────┤
│  Cluster 1 (rename me)       45%  ⚠️ 58% healthy
│  Cluster 2 (rename me)       28%  ✅ 89% healthy
│  Cluster 3 (rename me)       18%  ✅ 92% healthy
│  Cluster 4 (rename me)        9%  🔴 34% healthy
└─────────────────────────────────────────┘

[Click cluster to see example conversations]
```

**PM Value:** "Which use cases are broken?" Enables segmented analysis

**Implementation:**
- Week 1: Skip this feature, focus on problems
- Week 2: Basic clustering with representative examples

---

## The Core PM Workflow (What This Enables)

**Monday morning standup:**
```
1. PM opens dashboard
2. Sees: "Health 68% (↓12% from last week)" 
3. Problem clusters show: "Handoff issues: 13 instances (was 4 last week)"
4. Clicks through → reviews 5 example traces
5. Spots pattern: AI doesn't transfer when users say "speak to someone"
6. Brings to eng: "We have a handoff regression, here are examples"

Time: 5 minutes
Required: No eval writing, no trace querying, just click and review
```

---

## Dashboard Layout (Week 2 Goal)

```
┌──────────────────────────────────────────────────────┐
│  Sensei Dashboard                                     │
├──────────────────────────────────────────────────────┤
│                                                       │
│  📊 Overall Health: 72%  (↓8% from last week)        │
│      1,247 conversations analyzed                     │
│                                                       │
├──────────────────────────────────────────────────────┤
│                                                       │
│  🔴 Top Problems (Last 7 Days)                        │
│  ┌────────────────────────────────────────┐          │
│  │ Handoff failures              13  [→]  │          │
│  │ Scheduling errors              8  [→]  │          │
│  │ Formatting issues              2  [→]  │          │
│  └────────────────────────────────────────┘          │
│                                                       │
├──────────────────────────────────────────────────────┤
│                                                       │
│  📈 Usage Patterns                                    │
│  ┌────────────────────────────────────────┐          │
│  │ Tour bookings        45%  ⚠️ 58%  [→]  │          │
│  │ General inquiries    28%  ✅ 89%  [→]  │          │
│  │ Cancellations        18%  ✅ 92%  [→]  │          │
│  └────────────────────────────────────────┘          │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

## What Changed From Original

### Added:
- **Problem Clustering** - The key differentiation. Automates Hamel's axial coding step
- **Emphasis on trace review** - Dashboard links to actual conversations for verification
- **Clear prioritization** - Ranked by frequency/impact
- **Customer segmentation** - Growth-stage primary, vibe-coder founders secondary

### Clarified:
- **Health Score** is per-conversation, aggregates to overall metric
- **Failure Detection** feeds into Problem Clustering (detect → cluster → prioritize)
- **Usage Patterns** is about segmentation, not just clustering
- **Not claiming to replace evals** - positioned as discovery tool

### Deferred to v2:
- Eval running
- Custom clustering parameters
- Advanced filtering/querying
- Integrations with Langfuse/Arize

---

## Positioning Statement

**For PMs at AI companies who need to understand what's breaking,**

**Sensei automatically detects and clusters your top problems**

**so you can fix what matters most instead of manually reviewing thousands of traces.**

**Unlike Langfuse or Arize,** we give you insights, not just infrastructure.

---

## Week 1 vs Week 2 Priorities

**Week 1 (Prove It Works):**
- ✅ SDK that captures conversations
- ✅ Basic health score (completion + sentiment)
- ✅ Simple failure detection (loops + LLM judge)
- ✅ Dashboard showing: overall health %, list of problem traces
- ✅ Click through to view full conversation

**Week 2 (Add Intelligence):**
- ✅ Problem clustering (embed errors → cluster → name)
- ✅ Usage pattern clustering
- ✅ Trend over time (health score graphs)
- ✅ Polish UX for trace review