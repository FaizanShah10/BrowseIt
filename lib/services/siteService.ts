import { extractText } from "../extractText";
import { BadRequestError, ConflictError } from "../errors";
import { normalizeAddress } from "../normalizeAddress";
import { siteRepository } from "../repositories/siteRepository";
import { sanitize } from "../sanitize";
import type { Site } from "../../types";

export type PublishInput = {
  address: string;
  title: string;
  html: string;
  authorId: string;
};

export const SiteService = {
  async publish(input: PublishInput): Promise<Site> {
    const address = normalizeAddress(input.address);
    // Zod also rejects empty-after-normalize; keep the guard at the write path.
    if (!address) {
      throw new BadRequestError("address is invalid");
    }
    const existing = await siteRepository.findByAddress(address);
    if (existing) {
      throw new ConflictError(`A site already exists at address "${address}".`);
    }

    const html = sanitize(input.html);
    const textContent = extractText(html);

    try {
      return await siteRepository.create({
        _id: `site:${address}`,
        address,
        title: input.title.trim(),
        html,
        textContent,
        authorId: input.authorId,
      });
    } catch (err) {
      // Unique-index race: treat duplicate key as the same conflict.
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code: unknown }).code === 11000
      ) {
        throw new ConflictError(
          `A site already exists at address "${address}".`,
        );
      }
      throw err;
    }
  },

  async getByAddress(address: string): Promise<Site | null> {
    const normalized = normalizeAddress(address);
    return siteRepository.findByAddress(normalized);
  },
};
