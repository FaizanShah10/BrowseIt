import { normalizeAddress } from "../normalizeAddress";
import { siteRepository } from "../repositories/siteRepository";
import { visitRepository } from "../repositories/visitRepository";
import type { Paginated, Site, Visit, VisitMethod } from "../../types";

export type RecordVisitInput = {
  personId: string;
  address: string;
  method: VisitMethod;
  fromVisitId?: string | null;
};

export const VisitService = {
  async record(
    input: RecordVisitInput,
  ): Promise<{ visit: Visit; site: Site | null }> {
    const address = normalizeAddress(input.address);
    const site = await siteRepository.findByAddress(address);
    const visit = await visitRepository.create({
      personId: input.personId,
      address,
      siteId: site?._id ?? null,
      method: input.method,
      fromVisitId: input.fromVisitId ?? null,
    });
    return { visit, site: site ?? null };
  },

  async listForPerson(
    personId: string,
    cursor: string | null,
  ): Promise<Paginated<Visit>> {
    return visitRepository.listForPerson(personId, cursor);
  },
};
