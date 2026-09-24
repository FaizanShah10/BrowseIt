import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const siteSchema = new Schema(
  {
    _id: { type: String, required: true },
    address: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    html: { type: String, required: true },
    textContent: { type: String, required: true },
    authorId: { type: String, required: true },
    createdAt: { type: Date, required: true, default: () => new Date() },
    updatedAt: { type: Date, required: true, default: () => new Date() },
  },
  {
    collection: "sites",
    versionKey: false,
  },
);

// Text index for search — title weighted higher than body text.
siteSchema.index(
  { title: "text", textContent: "text" },
  { weights: { title: 10, textContent: 5 }, name: "site_text_search" },
);

export type SiteDocument = InferSchemaType<typeof siteSchema> & {
  _id: string;
};

export const SiteModel: Model<SiteDocument> =
  (models.Site as Model<SiteDocument> | undefined) ??
  model<SiteDocument>("Site", siteSchema);
