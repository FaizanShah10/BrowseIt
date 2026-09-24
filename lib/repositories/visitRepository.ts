import { randomUUID } from "node:crypto";
import { connect } from "../db";
import { VisitModel } from "../models/Visit";
import type { Visit, VisitMethod } from "../../types";

function toVisit(doc: {
  _id: string;
  personId: string;
  address: string;
  siteId: string | null;
  method: VisitMethod;
  fromVisitId: string | null;
  createdAt: Date;
}): Visit {
  return {
    _id: doc._id,
    personId: doc.personId,
    address: doc.address,
    siteId: doc.siteId ?? null,
    method: doc.method,
    fromVisitId: doc.fromVisitId ?? null,
    createdAt: doc.createdAt,
  };
}

export type CreateVisitInput = {
  personId: string;
  address: string;
  siteId: string | null;
  method: VisitMethod;
  fromVisitId: string | null;
};

const PAGE_SIZE = 20;

export const visitRepository = {
  async create(input: CreateVisitInput): Promise<Visit> {
    await connect();
    const doc = await VisitModel.create({
      _id: `visit:${randomUUID()}`,
      personId: input.personId,
      address: input.address,
      siteId: input.siteId,
      method: input.method,
      fromVisitId: input.fromVisitId,
      createdAt: new Date(),
    });
    return toVisit(doc.toObject() as Parameters<typeof toVisit>[0]);
  },

  async listForPerson(
    personId: string,
    cursor: string | null,
  ): Promise<{ items: Visit[]; nextCursor: string | null }> {
    await connect();
    const filter: Record<string, unknown> = { personId };

    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!Number.isNaN(cursorDate.getTime())) {
        filter.createdAt = { $lt: cursorDate };
      }
    }

    const docs = await VisitModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(PAGE_SIZE + 1)
      .lean();

    const hasMore = docs.length > PAGE_SIZE;
    const page = hasMore ? docs.slice(0, PAGE_SIZE) : docs;
    const items = page.map((d) =>
      toVisit(d as typeof d & { _id: string; method: VisitMethod }),
    );
    const nextCursor =
      hasMore && items.length > 0
        ? items[items.length - 1].createdAt.toISOString()
        : null;

    return { items, nextCursor };
  },
};
