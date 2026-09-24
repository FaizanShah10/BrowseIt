import { connect } from "../db";
import { SiteModel } from "../models/Site";
import type { Site } from "../../types";

function toSite(doc: {
  _id: string;
  address: string;
  title: string;
  html: string;
  textContent: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}): Site {
  return {
    _id: doc._id,
    address: doc.address,
    title: doc.title,
    html: doc.html,
    textContent: doc.textContent,
    authorId: doc.authorId,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export type CreateSiteInput = {
  _id: string;
  address: string;
  title: string;
  html: string;
  textContent: string;
  authorId: string;
};

const PAGE_SIZE = 20;

export const siteRepository = {
  async findByAddress(address: string): Promise<Site | null> {
    await connect();
    const doc = await SiteModel.findOne({ address }).lean();
    if (!doc) return null;
    return toSite(doc as typeof doc & { _id: string });
  },

  async create(input: CreateSiteInput): Promise<Site> {
    await connect();
    const now = new Date();
    const doc = await SiteModel.create({
      ...input,
      createdAt: now,
      updatedAt: now,
    });
    return toSite(doc.toObject());
  },

  async textSearch(
    q: string,
    cursor: string | null,
  ): Promise<{ items: Site[]; nextCursor: string | null }> {
    await connect();
    const filter: Record<string, unknown> = { $text: { $search: q } };

    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!Number.isNaN(cursorDate.getTime())) {
        filter.createdAt = { $lt: cursorDate };
      }
    }

    const docs = await SiteModel.find(filter, {
      score: { $meta: "textScore" },
    })
      .sort({ score: { $meta: "textScore" }, createdAt: -1 })
      .limit(PAGE_SIZE + 1)
      .lean();

    const hasMore = docs.length > PAGE_SIZE;
    const page = hasMore ? docs.slice(0, PAGE_SIZE) : docs;
    const items = page.map((d) => toSite(d as typeof d & { _id: string }));
    const nextCursor =
      hasMore && items.length > 0
        ? items[items.length - 1].createdAt.toISOString()
        : null;

    return { items, nextCursor };
  },
};
