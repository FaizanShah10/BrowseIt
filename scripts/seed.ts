/**
 * Deterministic, idempotent seed for BrowseIt.
 *
 * Usage: npm run seed
 *
 * Upserts people, interlinked sites (sanitize-on-write), and per-person visit
 * trails so History and the idle-home cards have real data to show.
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
] as const;

type SeedSite = {
  address: string;
  title: string;
  authorId: string;
  html: string;
};

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
        <li><a href="atlas.zz">The Atlas</a> — a map of everywhere</li>
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
      </ul>
      <p>Start anywhere. Trails four deep are the point.</p>
    `,
  },
];

type SeedVisitStep = {
  id: string;
  address: string;
  method: VisitMethod;
  fromId: string | null;
  minutesAgo: number;
};

/** Ayesha: a four-deep link trail for the recording. */
const AYESHA_TRAIL: SeedVisitStep[] = [
  {
    id: "visit:seed:ayesha:1",
    address: "tidepool.zz",
    method: "typed",
    fromId: null,
    minutesAgo: 120,
  },
  {
    id: "visit:seed:ayesha:2",
    address: "garden.zz",
    method: "link",
    fromId: "visit:seed:ayesha:1",
    minutesAgo: 118,
  },
  {
    id: "visit:seed:ayesha:3",
    address: "orchard.zz",
    method: "link",
    fromId: "visit:seed:ayesha:2",
    minutesAgo: 115,
  },
  {
    id: "visit:seed:ayesha:4",
    address: "atlas.zz",
    method: "link",
    fromId: "visit:seed:ayesha:3",
    minutesAgo: 110,
  },
];

/** Omar: a different trail (lighthouse → harbor → atlas). */
const OMAR_TRAIL: SeedVisitStep[] = [
  {
    id: "visit:seed:omar:1",
    address: "lighthouse.zz",
    method: "typed",
    fromId: null,
    minutesAgo: 90,
  },
  {
    id: "visit:seed:omar:2",
    address: "harbor.zz",
    method: "link",
    fromId: "visit:seed:omar:1",
    minutesAgo: 88,
  },
  {
    id: "visit:seed:omar:3",
    address: "atlas.zz",
    method: "link",
    fromId: "visit:seed:omar:2",
    minutesAgo: 85,
  },
  {
    id: "visit:seed:omar:4",
    address: "tidepool.zz",
    method: "search",
    fromId: null,
    minutesAgo: 40,
  },
];

/** Mira: shorter, garden-focused history. */
const MIRA_TRAIL: SeedVisitStep[] = [
  {
    id: "visit:seed:mira:1",
    address: "garden.zz",
    method: "typed",
    fromId: null,
    minutesAgo: 60,
  },
  {
    id: "visit:seed:mira:2",
    address: "orchard.zz",
    method: "link",
    fromId: "visit:seed:mira:1",
    minutesAgo: 58,
  },
  {
    id: "visit:seed:mira:3",
    address: "lost.harbor.zz",
    method: "typed",
    fromId: null,
    minutesAgo: 20,
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
  const now = Date.now();
  for (const step of steps) {
    const site = await siteRepository.findByAddress(step.address);
    await visitRepository.upsertSeed({
      _id: step.id,
      personId,
      address: step.address,
      siteId: site?._id ?? null,
      method: step.method,
      fromVisitId: step.fromId,
      createdAt: new Date(now - step.minutesAgo * 60_000),
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

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
