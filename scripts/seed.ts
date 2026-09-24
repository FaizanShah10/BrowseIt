/**
 * Deterministic, idempotent seed for BrowseIt.
 *
 * Usage: npm run seed
 *
 * Upserts people, interlinked sites (sanitize-on-write), and per-person visit
 * trails so History pagination, Search (body-only), and Links have real data.
 *
 * Deterministic timestamps only — every createdAt is a fixed ISO string.
 */
import { connect } from "../lib/db";
import { extractText } from "../lib/extractText";
import { personRepository } from "../lib/repositories/personRepository";
import { siteRepository } from "../lib/repositories/siteRepository";
import { visitRepository } from "../lib/repositories/visitRepository";
import { sanitize } from "../lib/sanitize";
import type { VisitMethod } from "../types";

const PEOPLE = [
  { _id: "person:ayesha", name: "Ayesha" },
  { _id: "person:omar", name: "Omar" },
  { _id: "person:mira", name: "Mira" },
  { _id: "person:noor", name: "Noor" },
  { _id: "person:samir", name: "Samir" },
] as const;

type SeedSite = {
  address: string;
  title: string;
  authorId: string;
  html: string;
};

/**
 * Distinctive body-only search fixture: the word "kerfuffle" appears in
 * notebook.zz's body and nowhere in any title. Issue #10 / Search gate.
 */
const SITES: SeedSite[] = [
  {
    address: "tidepool.zz",
    title: "Tidepool",
    authorId: "person:ayesha",
    html: `
      <h1>Tidepool</h1>
      <p>A quiet cove on the Small Web. The water holds the sky; the sky holds
      whatever you bring to it.</p>
      <p>From here the trail splits:</p>
      <ul>
        <li><a href="garden.zz">The Garden</a> — paths and petals</li>
        <li><a href="lighthouse.zz">The Lighthouse</a> — a beam inland</li>
        <li><a href="ferry.zz">The Ferry</a> — across the bay</li>
        <li><a href="atlas.zz">The Atlas</a> — a map of everywhere</li>
        <li><a href="notebook.zz">The Notebook</a> — a body-only search page</li>
      </ul>
      <p>Or step somewhere that was never claimed:
      <a href="lost.harbor.zz">lost.harbor.zz</a>.</p>
    `,
  },
  {
    address: "garden.zz",
    title: "The Garden",
    authorId: "person:mira",
    html: `
      <h1>The Garden</h1>
      <p>Rows of names carved into soft wood. Each plot is a page someone
      decided deserved an address.</p>
      <p>Walk on:</p>
      <ul>
        <li><a href="tidepool.zz">Back to Tidepool</a></li>
        <li><a href="orchard.zz">The Orchard</a> — fruit and longer days</li>
        <li><a href="cafe.zz">The Cafe</a> — shade and second cups</li>
        <li><a href="lighthouse.zz">The Lighthouse</a></li>
      </ul>
      <p>A note pinned to the gate mentions <a href="nowhere.yet.zz">nowhere.yet.zz</a>
      — nobody has planted there.</p>
    `,
  },
  {
    address: "lighthouse.zz",
    title: "The Lighthouse",
    authorId: "person:omar",
    html: `
      <h1>The Lighthouse</h1>
      <p>One room, one window, one long view of the bay. The keeper left a
      notebook of addresses worth the climb.</p>
      <ul>
        <li><a href="harbor.zz">Harbor</a> — docks and weather talk</li>
        <li><a href="ferry.zz">The Ferry</a> — the crossing below</li>
        <li><a href="tidepool.zz">Tidepool</a> — where most trails begin</li>
        <li><a href="atlas.zz">Atlas</a> — the index of the Small Web</li>
      </ul>
    `,
  },
  {
    address: "harbor.zz",
    title: "Harbor",
    authorId: "person:omar",
    html: `
      <h1>Harbor</h1>
      <p>Boats knock softly against the pier. Someone chalked a short map on
      the warehouse wall:</p>
      <ul>
        <li><a href="lighthouse.zz">Up to the Lighthouse</a></li>
        <li><a href="ferry.zz">Catch the Ferry</a></li>
        <li><a href="cafe.zz">Warm up at the Cafe</a></li>
        <li><a href="atlas.zz">Consult the Atlas</a></li>
        <li><a href="orchard.zz">Inland to the Orchard</a></li>
      </ul>
      <p>Locals still talk about <a href="ghost.pier.zz">ghost.pier.zz</a>,
      which washed away years ago.</p>
    `,
  },
  {
    address: "orchard.zz",
    title: "The Orchard",
    authorId: "person:mira",
    html: `
      <h1>The Orchard</h1>
      <p>Late summer. The air smells like warm fruit and dust. Between the
      trees, wooden signs point home:</p>
      <ul>
        <li><a href="garden.zz">Return to the Garden</a></li>
        <li><a href="workshop.zz">The Workshop</a> — tools and sawdust</li>
        <li><a href="atlas.zz">Find yourself on the Atlas</a></li>
        <li><a href="tidepool.zz">Tidepool at dusk</a></li>
      </ul>
    `,
  },
  {
    address: "atlas.zz",
    title: "The Atlas",
    authorId: "person:ayesha",
    html: `
      <h1>The Atlas</h1>
      <p>Every known address on one page — not because the Small Web is small,
      but because someone bothered to look.</p>
      <h2>Places</h2>
      <ul>
        <li><a href="tidepool.zz">tidepool.zz</a> — Tidepool</li>
        <li><a href="garden.zz">garden.zz</a> — The Garden</li>
        <li><a href="lighthouse.zz">lighthouse.zz</a> — The Lighthouse</li>
        <li><a href="harbor.zz">harbor.zz</a> — Harbor</li>
        <li><a href="orchard.zz">orchard.zz</a> — The Orchard</li>
        <li><a href="notebook.zz">notebook.zz</a> — The Notebook</li>
        <li><a href="ferry.zz">ferry.zz</a> — The Ferry</li>
        <li><a href="cafe.zz">cafe.zz</a> — The Cafe</li>
        <li><a href="workshop.zz">workshop.zz</a> — The Workshop</li>
      </ul>
      <p>Start anywhere. Trails four deep are the point.</p>
    `,
  },
  {
    address: "notebook.zz",
    title: "The Notebook",
    authorId: "person:noor",
    html: `
      <h1>The Notebook</h1>
      <p>Loose pages, coffee rings, and one word that lives only here in the
      body — never in a title — so Search can prove it indexes textContent:
      <strong>kerfuffle</strong>.</p>
      <p>Also doors out: <a href="tidepool.zz">Tidepool</a>,
      <a href="cafe.zz">The Cafe</a>,
      <a href="workshop.zz">The Workshop</a>.</p>
    `,
  },
  {
    address: "ferry.zz",
    title: "The Ferry",
    authorId: "person:omar",
    html: `
      <h1>The Ferry</h1>
      <p>A slow crossing of the bay. Timetables fade in the salt air; the
      destinations do not.</p>
      <ul>
        <li><a href="harbor.zz">Harbor</a> — where the hull kisses timber</li>
        <li><a href="lighthouse.zz">The Lighthouse</a> — a fixed point to steer by</li>
        <li><a href="tidepool.zz">Tidepool</a> — the quiet side of the water</li>
        <li><a href="cafe.zz">The Cafe</a> — something warm after the deck spray</li>
      </ul>
      <p>Old tickets still name <a href="far.wharf.zz">far.wharf.zz</a>,
      a landing that never opened.</p>
    `,
  },
  {
    address: "cafe.zz",
    title: "The Cafe",
    authorId: "person:noor",
    html: `
      <h1>The Cafe</h1>
      <p>Two rooms, one kettle, and a chalkboard of addresses worth the walk.
      The windows fog whenever the ferry docks.</p>
      <ul>
        <li><a href="garden.zz">The Garden</a> — sit outside if the sun holds</li>
        <li><a href="harbor.zz">Harbor</a> — salt on the wind</li>
        <li><a href="workshop.zz">The Workshop</a> — next door, louder</li>
        <li><a href="notebook.zz">The Notebook</a> — borrow a pen</li>
        <li><a href="atlas.zz">The Atlas</a> — if you forgot where you were going</li>
      </ul>
      <p>Someone scratched <a href="mist.lane.zz">mist.lane.zz</a> under the
      menu — no door answers there.</p>
    `,
  },
  {
    address: "workshop.zz",
    title: "The Workshop",
    authorId: "person:samir",
    html: `
      <h1>The Workshop</h1>
      <p>Sawdust, spare hinges, and pages left to dry on a workbench. Samir
      builds what the Small Web still needs: shelves for other people's sites.</p>
      <ul>
        <li><a href="orchard.zz">The Orchard</a> — wood that used to be trees</li>
        <li><a href="cafe.zz">The Cafe</a> — tea between cuts</li>
        <li><a href="notebook.zz">The Notebook</a> — measurements and margins</li>
        <li><a href="atlas.zz">The Atlas</a> — find a spare address</li>
        <li><a href="ferry.zz">The Ferry</a> — deliver something across the bay</li>
      </ul>
      <p>A half-finished label reads <a href="empty.shelf.zz">empty.shelf.zz</a>
      — reserved, never claimed.</p>
    `,
  },
];

type SeedVisitStep = {
  id: string;
  address: string;
  method: VisitMethod;
  fromId: string | null;
  /** Fixed ISO-8601 timestamp (hardcoded, not wall-clock). */
  createdAt: string;
};

/** Ayesha: four-deep link trail for the recording, then filler for History pagination (21+). */
const AYESHA_TRAIL: SeedVisitStep[] = [
  {
    id: "visit:seed:ayesha:1",
    address: "tidepool.zz",
    method: "typed",
    fromId: null,
    createdAt: "2026-01-10T10:00:00.000Z",
  },
  {
    id: "visit:seed:ayesha:2",
    address: "garden.zz",
    method: "link",
    fromId: "visit:seed:ayesha:1",
    createdAt: "2026-01-10T10:02:00.000Z",
  },
  {
    id: "visit:seed:ayesha:3",
    address: "orchard.zz",
    method: "link",
    fromId: "visit:seed:ayesha:2",
    createdAt: "2026-01-10T10:05:00.000Z",
  },
  {
    id: "visit:seed:ayesha:4",
    address: "atlas.zz",
    method: "link",
    fromId: "visit:seed:ayesha:3",
    createdAt: "2026-01-10T10:10:00.000Z",
  },
  {
    id: "visit:seed:ayesha:5",
    address: "notebook.zz",
    method: "search",
    fromId: null,
    createdAt: "2026-01-11T09:00:00.000Z",
  },
  {
    id: "visit:seed:ayesha:6",
    address: "lighthouse.zz",
    method: "typed",
    fromId: null,
    createdAt: "2026-01-11T11:00:00.000Z",
  },
  {
    id: "visit:seed:ayesha:7",
    address: "harbor.zz",
    method: "link",
    fromId: "visit:seed:ayesha:6",
    createdAt: "2026-01-11T11:05:00.000Z",
  },
  {
    id: "visit:seed:ayesha:8",
    address: "atlas.zz",
    method: "history",
    fromId: null,
    createdAt: "2026-01-12T08:00:00.000Z",
  },
  {
    id: "visit:seed:ayesha:9",
    address: "garden.zz",
    method: "typed",
    fromId: null,
    createdAt: "2026-01-12T14:00:00.000Z",
  },
  {
    id: "visit:seed:ayesha:10",
    address: "tidepool.zz",
    method: "link",
    fromId: "visit:seed:ayesha:9",
    createdAt: "2026-01-12T14:10:00.000Z",
  },
  {
    id: "visit:seed:ayesha:11",
    address: "orchard.zz",
    method: "typed",
    fromId: null,
    createdAt: "2026-01-13T07:30:00.000Z",
  },
  {
    id: "visit:seed:ayesha:12",
    address: "notebook.zz",
    method: "typed",
    fromId: null,
    createdAt: "2026-01-13T09:00:00.000Z",
  },
  {
    id: "visit:seed:ayesha:13",
    address: "harbor.zz",
    method: "search",
    fromId: null,
    createdAt: "2026-01-13T12:00:00.000Z",
  },
  {
    id: "visit:seed:ayesha:14",
    address: "lighthouse.zz",
    method: "history",
    fromId: null,
    createdAt: "2026-01-14T08:00:00.000Z",
  },
  {
    id: "visit:seed:ayesha:15",
    address: "atlas.zz",
    method: "typed",
    fromId: null,
    createdAt: "2026-01-14T10:00:00.000Z",
  },
  {
    id: "visit:seed:ayesha:16",
    address: "garden.zz",
    method: "link",
    fromId: "visit:seed:ayesha:15",
    createdAt: "2026-01-14T10:15:00.000Z",
  },
  {
    id: "visit:seed:ayesha:17",
    address: "tidepool.zz",
    method: "typed",
    fromId: null,
    createdAt: "2026-01-15T09:00:00.000Z",
  },
  {
    id: "visit:seed:ayesha:18",
    address: "lost.harbor.zz",
    method: "link",
    fromId: "visit:seed:ayesha:17",
    createdAt: "2026-01-15T09:05:00.000Z",
  },
  {
    id: "visit:seed:ayesha:19",
    address: "orchard.zz",
    method: "history",
    fromId: null,
    createdAt: "2026-01-15T16:00:00.000Z",
  },
  {
    id: "visit:seed:ayesha:20",
    address: "notebook.zz",
    method: "search",
    fromId: null,
    createdAt: "2026-01-16T08:00:00.000Z",
  },
  {
    id: "visit:seed:ayesha:21",
    address: "harbor.zz",
    method: "typed",
    fromId: null,
    createdAt: "2026-01-16T11:00:00.000Z",
  },
  {
    id: "visit:seed:ayesha:22",
    address: "atlas.zz",
    method: "typed",
    fromId: null,
    createdAt: "2026-01-16T15:00:00.000Z",
  },
  {
    id: "visit:seed:ayesha:23",
    address: "ferry.zz",
    method: "link",
    fromId: "visit:seed:ayesha:6",
    createdAt: "2026-01-17T09:00:00.000Z",
  },
  {
    id: "visit:seed:ayesha:24",
    address: "cafe.zz",
    method: "link",
    fromId: "visit:seed:ayesha:23",
    createdAt: "2026-01-17T09:10:00.000Z",
  },
  {
    id: "visit:seed:ayesha:25",
    address: "workshop.zz",
    method: "history",
    fromId: null,
    createdAt: "2026-01-17T14:00:00.000Z",
  },
];

/** Omar: lighthouse → harbor → ferry → atlas trail. */
const OMAR_TRAIL: SeedVisitStep[] = [
  {
    id: "visit:seed:omar:1",
    address: "lighthouse.zz",
    method: "typed",
    fromId: null,
    createdAt: "2026-01-12T10:00:00.000Z",
  },
  {
    id: "visit:seed:omar:2",
    address: "harbor.zz",
    method: "link",
    fromId: "visit:seed:omar:1",
    createdAt: "2026-01-12T10:02:00.000Z",
  },
  {
    id: "visit:seed:omar:3",
    address: "ferry.zz",
    method: "link",
    fromId: "visit:seed:omar:2",
    createdAt: "2026-01-12T10:04:00.000Z",
  },
  {
    id: "visit:seed:omar:4",
    address: "atlas.zz",
    method: "link",
    fromId: "visit:seed:omar:3",
    createdAt: "2026-01-12T10:07:00.000Z",
  },
  {
    id: "visit:seed:omar:5",
    address: "tidepool.zz",
    method: "search",
    fromId: null,
    createdAt: "2026-01-14T18:00:00.000Z",
  },
  {
    id: "visit:seed:omar:6",
    address: "far.wharf.zz",
    method: "link",
    fromId: null,
    createdAt: "2026-01-14T18:10:00.000Z",
  },
];

/** Mira: garden-focused history. */
const MIRA_TRAIL: SeedVisitStep[] = [
  {
    id: "visit:seed:mira:1",
    address: "garden.zz",
    method: "typed",
    fromId: null,
    createdAt: "2026-01-13T11:00:00.000Z",
  },
  {
    id: "visit:seed:mira:2",
    address: "orchard.zz",
    method: "link",
    fromId: "visit:seed:mira:1",
    createdAt: "2026-01-13T11:02:00.000Z",
  },
  {
    id: "visit:seed:mira:3",
    address: "cafe.zz",
    method: "link",
    fromId: "visit:seed:mira:2",
    createdAt: "2026-01-13T11:08:00.000Z",
  },
  {
    id: "visit:seed:mira:4",
    address: "nowhere.yet.zz",
    method: "typed",
    fromId: null,
    createdAt: "2026-01-15T20:00:00.000Z",
  },
];

/** Noor: notebook + cafe author trail. */
const NOOR_TRAIL: SeedVisitStep[] = [
  {
    id: "visit:seed:noor:1",
    address: "notebook.zz",
    method: "typed",
    fromId: null,
    createdAt: "2026-01-11T15:00:00.000Z",
  },
  {
    id: "visit:seed:noor:2",
    address: "cafe.zz",
    method: "link",
    fromId: "visit:seed:noor:1",
    createdAt: "2026-01-11T15:05:00.000Z",
  },
  {
    id: "visit:seed:noor:3",
    address: "tidepool.zz",
    method: "link",
    fromId: "visit:seed:noor:2",
    createdAt: "2026-01-11T15:12:00.000Z",
  },
  {
    id: "visit:seed:noor:4",
    address: "mist.lane.zz",
    method: "typed",
    fromId: null,
    createdAt: "2026-01-11T16:00:00.000Z",
  },
];

/** Samir: workshop author, light browsing. */
const SAMIR_TRAIL: SeedVisitStep[] = [
  {
    id: "visit:seed:samir:1",
    address: "workshop.zz",
    method: "typed",
    fromId: null,
    createdAt: "2026-01-14T13:00:00.000Z",
  },
  {
    id: "visit:seed:samir:2",
    address: "orchard.zz",
    method: "link",
    fromId: "visit:seed:samir:1",
    createdAt: "2026-01-14T13:05:00.000Z",
  },
  {
    id: "visit:seed:samir:3",
    address: "cafe.zz",
    method: "link",
    fromId: "visit:seed:samir:2",
    createdAt: "2026-01-14T13:10:00.000Z",
  },
  {
    id: "visit:seed:samir:4",
    address: "empty.shelf.zz",
    method: "link",
    fromId: "visit:seed:samir:1",
    createdAt: "2026-01-14T13:20:00.000Z",
  },
];

async function seedPeople() {
  for (const person of PEOPLE) {
    await personRepository.upsert(person);
    console.log(`  person  ${person.name}`);
  }
}

async function seedSites() {
  for (const site of SITES) {
    const html = sanitize(site.html);
    const textContent = extractText(html);
    await siteRepository.upsert({
      _id: `site:${site.address}`,
      address: site.address,
      title: site.title,
      html,
      textContent,
      authorId: site.authorId,
    });
    console.log(`  site    ${site.address}`);
  }
}

async function seedVisits(
  personId: string,
  label: string,
  steps: SeedVisitStep[],
) {
  for (const step of steps) {
    const site = await siteRepository.findByAddress(step.address);
    await visitRepository.upsertSeed({
      _id: step.id,
      personId,
      address: step.address,
      siteId: site?._id ?? null,
      method: step.method,
      fromVisitId: step.fromId,
      createdAt: new Date(step.createdAt),
    });
  }
  console.log(`  visits  ${label} (${steps.length})`);
}

async function main() {
  console.log("BrowseIt seed — connecting…");
  await connect();

  console.log("People");
  await seedPeople();

  console.log("Sites");
  await seedSites();

  console.log("Visits");
  await seedVisits("person:ayesha", "Ayesha", AYESHA_TRAIL);
  await seedVisits("person:omar", "Omar", OMAR_TRAIL);
  await seedVisits("person:mira", "Mira", MIRA_TRAIL);
  await seedVisits("person:noor", "Noor", NOOR_TRAIL);
  await seedVisits("person:samir", "Samir", SAMIR_TRAIL);

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
