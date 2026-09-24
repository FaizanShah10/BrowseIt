import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const personSchema = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    createdAt: { type: Date, required: true, default: () => new Date() },
  },
  {
    collection: "people",
    versionKey: false,
  },
);

export type PersonDocument = InferSchemaType<typeof personSchema> & {
  _id: string;
};

export const PersonModel: Model<PersonDocument> =
  (models.Person as Model<PersonDocument> | undefined) ??
  model<PersonDocument>("Person", personSchema);
