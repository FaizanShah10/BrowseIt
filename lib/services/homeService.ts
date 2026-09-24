import { siteRepository } from "../repositories/siteRepository";
import { visitRepository } from "../repositories/visitRepository";
import type { Visit } from "../../types";

export type HomeRecentItem = {
  address: string;
  title: string | null;
  siteId: string | null;
};

export type HomeSummary = {
  siteCount: number;
  visitCount: number;
  historyEntries: number;
  longestTrail: number;
  recent: HomeRecentItem[];
};

/** Longest fromVisitId chain for a person (seeded trails + live link trails). */
function longestFromVisitChain(visits: Visit[]): number {
  if (visits.length === 0) return 0;

  const byId = new Map(visits.map((v) => [v._id, v]));
  let max = 1;

  for (const start of visits) {
    let len = 1;
    let cur: Visit | undefined = start;
    const seen = new Set<string>();

    while (cur?.fromVisitId) {
      if (seen.has(cur._id)) break;
      seen.add(cur._id);
      const prev = byId.get(cur.fromVisitId);
      if (!prev) break;
      cur = prev;
      len += 1;
      if (len > visits.length) break;
    }

    if (len > max) max = len;
  }

  return max;
}

function recentUnique(visits: Visit[], limit: number): Visit[] {
  const seen = new Set<string>();
  const out: Visit[] = [];
  for (const v of visits) {
    if (seen.has(v.address)) continue;
    seen.add(v.address);
    out.push(v);
    if (out.length >= limit) break;
  }
  return out;
}

export const HomeService = {
  async summary(personId: string): Promise<HomeSummary> {
    const [
      siteCount,
      visitCount,
      historyEntries,
      allVisits,
      recentWindow,
    ] = await Promise.all([
      siteRepository.count(),
      visitRepository.countForPerson(personId),
      visitRepository.distinctAddressCount(personId),
      visitRepository.listAllForPerson(personId),
      visitRepository.listRecentForPerson(personId, 40),
    ]);

    const uniqueRecent = recentUnique(recentWindow, 4);
    const sites = await siteRepository.findByAddresses(
      uniqueRecent.map((v) => v.address),
    );
    const titleByAddress = new Map(sites.map((s) => [s.address, s.title]));

    return {
      siteCount,
      visitCount,
      historyEntries,
      longestTrail: longestFromVisitChain(allVisits),
      recent: uniqueRecent.map((v) => ({
        address: v.address,
        title: titleByAddress.get(v.address) ?? null,
        siteId: v.siteId,
      })),
    };
  },
};
