<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# BrowseIt — The Small Web

A technical assessment: a database of one-page sites, and the browser you read
them in. Address bar, links, back/forward, restore-on-return, history, search,
publish.

## Read this first

**`docs/DESIGN.md` is the decision log and it outranks your instincts.** Read it
before writing code. It records what was decided, what was rejected, and what
each call costs. If your plan contradicts it, you are wrong by default — say so
and propose a change to the document. Do not silently deviate, and do not
"improve" a decision in passing.

## The four gates

The assessment says these are non-negotiable. Everything else is secondary:

1. **Back and forward** — both directions, and forward is destroyed the moment a
   new navigation branches mid-history.
2. **Restore on return** — a page gone back to is the page that was left, same
   scroll position.
3. **History** — per-person, persisted, scrollable, and every row is a launch
   point for a new visit.
4. **Containing HTML we did not write** — assume an author is trying to escape
   their page.

A change that risks any of these is not worth making, however nice it looks.

## Hard rules — never do these

| Never | Why |
|---|---|
| `dangerouslySetInnerHTML`, anywhere | Untrusted author HTML renders **only** inside `<iframe sandbox="allow-scripts" srcdoc>` with **no** `allow-same-origin`. This single rule decides the grade. |
| Add `allow-same-origin`, `allow-forms`, `allow-popups`, or `allow-top-navigation` to that iframe | Each one dismantles the containment guarantee. `allow-scripts` alone is deliberate and justified in `docs/DESIGN.md` §6.3. |
| `postMessage(msg, someOrigin)` from inside the frame | The frame has an **opaque origin**; `location.origin` is the string `"null"`, so a real targetOrigin means the message is silently dropped. Use `'*'`. |
| Check `e.origin` on incoming frame messages | It is `"null"` for every sandboxed frame. Authenticate by `e.source === iframeRef.current?.contentWindow`, then parse the payload with Zod. |
| Read `a.href` in the link interceptor | Resolves against `about:srcdoc` and returns garbage. Use `a.getAttribute('href')`. |
| Store raw, unsanitized HTML | Sanitize once at write time and store only the result. There is no raw field for a careless query to render. |
| `history.pushState` / `router.push` per navigation | The real URL never changes. Mirroring it puts the host browser's history stack in competition with ours. See §05 D1. |
| Log `back` / `forward` as visits | Traversal is in-memory and hits no network. `Visit.method` is `'typed' \| 'link' \| 'search' \| 'history'` only. |
| Compare or store a raw address string | Every address passes through `normalizeAddress()` first — address bar, link interceptor, publish, repository. One authority, four call sites. |
| Import Mongoose outside `lib/repositories/` | Nothing above the repository layer knows what database is in use. |
| Add auth, accounts, roles, bookmarks, tabs, or an edit/delete flow | Explicitly out of scope in the brief. The assessment rewards restraint. |

## Layering

```
app/api/**/route.ts   Controller  Parse → validate with Zod → call ONE service
                                  method → shape the response. No business
                                  logic. Over ~15 lines means logic leaked.
lib/services/*.ts     Service     The rules. SiteService, VisitService,
                                  PersonService, SearchService.
lib/repositories/*.ts Repository  The only files importing Mongoose.
```

Responses are plain resources with real HTTP status codes. No
`{ success, data, error }` envelope — a missing address is a real `404`, not a
flag inside a `200`.

## Rendering and state — decided, don't re-litigate

SEO is not a goal. No address ever gets its own real URL (D1), so there is
nothing for a search engine to index — do not add sitemaps, per-address meta
tags, or anything that implies a crawlable URL exists. Nothing here is
real-time either — no sockets, no live sync between viewers. The actual goal
is fast, correct request/response on every navigation.

| Section | Render as | Why |
|---|---|---|
| `app/layout.tsx` | Server Component | Shell, fonts, inline pre-paint theme script. |
| `app/page.tsx` first paint | Server Component | Calls `PersonService`/`SiteService` directly — never `fetch()` its own API from the server. |
| Address bar, nav controls, person picker, page viewer, history, search, publish | Client Components | Forced by D9 — everything after first paint is client-driven so Back/Forward never round-trip. |
| Published page HTML | Outside the render tree | Raw string into the iframe's `srcdoc`. React never touches it — see the containment rule above. |

| State | Lives in | Not in |
|---|---|---|
| Navigation stack | One `useReducer` | Zustand/Redux |
| Visited-address cache | `useRef<Map>` | `useState` (would re-render on every cache write for no reason) |
| Current person | Context + `sessionStorage` | A "session" of any real kind |
| Theme / background mode | `localStorage`, try/catch-wrapped | Context (only a couple of consumers, doesn't need it) |

Debounce search input (~250–300ms). Use `next/image` for bundled background
photos and `next/font` for the shell's typeface. The iframe height-reporting
bridge doubles as layout-shift prevention — no separate mechanism needed.

## Conventions
