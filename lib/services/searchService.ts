import { siteRepository } from "../repositories/siteRepository";
import type { Paginated, Site } from "../../types";

export const SearchService = {
  async search(q: string, cursor: string | null): Promise<Paginated<Site>> {
    return siteRepository.textSearch(q, cursor);
  },
};
