import { connect } from "../db";
import { PersonModel } from "../models/Person";
import type { Person } from "../../types";

function toPerson(doc: {
  _id: string;
  name: string;
  createdAt: Date;
}): Person {
  return {
    _id: doc._id,
    name: doc.name,
    createdAt: doc.createdAt,
  };
}

export const personRepository = {
  async list(): Promise<Person[]> {
    await connect();
    const docs = await PersonModel.find().sort({ name: 1 }).lean();
    return docs.map((d) => toPerson(d as typeof d & { _id: string }));
  },

  async findById(id: string): Promise<Person | null> {
    await connect();
    const doc = await PersonModel.findById(id).lean();
    if (!doc) return null;
    return toPerson(doc as typeof doc & { _id: string });
  },

  async upsert(person: { _id: string; name: string }): Promise<Person> {
    await connect();
    const doc = await PersonModel.findByIdAndUpdate(
      person._id,
      {
        $setOnInsert: {
          _id: person._id,
          name: person.name,
          createdAt: new Date(),
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    ).lean();
    return toPerson(doc as NonNullable<typeof doc> & { _id: string });
  },
};
