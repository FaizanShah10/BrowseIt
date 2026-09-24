# The Small Web — Design Document

> **Internal working document.** This is the decision log for the build, not a
> deliverable. The graded artifacts are the repository, the seed, and the
> narrated recording. Nothing in here is worth anything unless it shows up in
> one of those three.

**Assessment:** Full Stack Technical Test · Web Engineering
**Budget:** ~8 focused hours across 3 calendar days
**Author:** Arslan

**Reading order:** Requirements → Modules → Domain → Architecture → Decisions →
Hard Problems → Seed → Cut List → Plan → Definition of Done

---

## 01 · The requirements, restated as engineering requirements

The brief is deliberately open about the *how* and strict about the *what*.
Seven capabilities are required. Four of them are explicitly non-negotiable:

> "**Back and forward, restore on return, history, and containing HTML you did
> not write** are not negotiable. Everything the system does has to hold them."

### The gate

| # | Requirement | Tier | What "correct" means | Proven in |
|---|---|---|---|---|
| 1 | Back / forward | **GATE** | Both directions work, and forward is destroyed the moment a new navigation branches off mid-history. | §6.1 |
| 2 | Restore on return | **GATE** | A page you go back to is the page you left — same scroll position, not just the same address. | §6.2 |
| 3 | History | **GATE** | Per-person, persisted, scrollable, and every row is a launch point for a new visit. | §6.5 |
| 4 | Containing untrusted HTML | **GATE** | Point at the line that contains it, and say what it costs authors. | §6.3 |
| 5 | Address bar | Required | Type an address and go; a dead address is a real, renderable state. | §6.1, §6.4 |
| 6 | Links | Required | Clicking a link inside author-written HTML reaches the browser's navigation — including links to addresses that never existed. | §6.3 |
| 7 | Search | Required | Full-text across page bodies, not a title filter. | §6.6 |
| 8 | Publish | Required | Anyone from the name list registers a new address with a page of raw HTML. | §6.4 |

### The rule that decides the grade

> "You are rendering markup you did not write into the same screen as your own
> interface. Anyone can publish, so assume someone will try to escape the page
> they published on. 'Nobody would put that in a site' is not a design — be able
> to point at the line that contains it, and to say what it costs you in what
> authors can still write."

This is a gate, not a feature. `dangerouslySetInnerHTML` anywhere in this
codebase is a failed submission regardless of how polished the rest is.
**§6.3 is the load-bearing section of this document.**

### Explicitly out of scope

Stated by the brief, restated here so it is never accidentally rebuilt:
authentication, accounts, roles, bookmarks, browser tabs, extensions,
downloads, images or assets to host, real network requests, Electron or any
native shell. Identity is a name picked from a list — nothing more, and never a
security boundary.

### Deliverables

- A Git repository with **real commit history** — "not one 'initial commit' dump."
- A **narrated** screen recording, 4–5 minutes: a trail four deep, back and
  forward across it, a search and a return to its results, a publish, and an
  address that leads nowhere. With reasoning over it: the model chosen, how
  back/forward is made to hold, how untrusted HTML is contained, and what was
  knowingly left out. *"A silent capture is half a submission."*
- The commands to run it and to seed it. No write-up — just the commands.

---

## 02 · Requirement → module map

If a requirement can't be pointed at on the recording, it wasn't really built.

| Requirement | Module(s) | Notes |
|---|---|---|
| Browse | `<AddressBar>`, `<PageViewer>` (sandboxed iframe), `POST /api/visits` | 404 is a renderable state, not an error swallowed by a boundary. |
| Links | Trusted script injected into the sandboxed `srcdoc`; `postMessage` bridge to the parent | Author HTML never runs with enough privilege to navigate anything itself. |
| Back / forward | `navigationReducer` (pure, unit-tested) | Session-scoped client state — deliberately separate from the persisted log. §3. |
| Restore on return | Scroll capture on navigate-away; `requestAnimationFrame` restore on navigate-in; stored on the stack entry | Part of the reducer's entry shape, not a bolt-on. |
| History | `<HistoryPanel>`, `Visit` collection, `GET /api/visits?personId=` | Jumping into a row is a *new* navigation — it truncates forward like any other. |
| Search | `<SearchBar>` + results, Mongo text index on `{title, textContent}`, `GET /api/search?q=` | Indexes extracted plain text, never raw HTML. §6.6. |
| Publish | `<PublishForm>`, server-side sanitizer, `POST /api/sites` | Sanitize on write, sandbox on render — two independent layers. §6.3. |
| Identity | `<PersonPicker>`, one `Person` collection for browsing and authoring | The brief says a publisher is picked "the same way" — one list, not two. |
| Visited indicator | `visitedAddresses` set derived from the visit log | The brief's own state diagram draws "In history — been here before." |
| Seed | `scripts/seed.ts` | Deterministic, idempotent. §7. |

---

## 03 · Domain model

The brief hands over four nouns — Site, Address, Link, Visit — and is explicit
that they are vocabulary, not schema:

> "That is the vocabulary, not the schema. Whether a site's HTML lives with the
> site or apart from it, whether an edit replaces a page or adds to it, whether
> history is derived from visits or kept beside them — your call."

### Collections

| Collection | Fields | Reasoning |