import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const VISIT_METHODS = ["typed", "link", "search", "history"] as const;

const visitSchema = new Schema(
  {
    _id: { type: String, required: true },
    personId: { type: String, required: true, index: true },
    address: { type: String, required: true },
    siteId: { type: String, default: null },
    method: { type: String, required: true, enum: VISIT_METHODS },
    fromVisitId: { type: String, default: null },
    createdAt: { type: Date, required: true, default: () => new Date(), index: true },
  },
  {
    collection: "visits",
    versionKey: false,
  },
);

visitSchema.index({ personId: 1, createdAt: -1 });

export type VisitDocument = InferSchemaType<typeof visitSchema> & {
  _id: string;
};

export const VisitModel: Model<VisitDocument> =
  (models.Visit as Model<VisitDocument> | undefined) ??
  model<VisitDocument>("Visit", visitSchema);
