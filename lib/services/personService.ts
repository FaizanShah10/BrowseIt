import { personRepository } from "../repositories/personRepository";
import type { Person } from "../../types";

export const PersonService = {
  async list(): Promise<Person[]> {
    return personRepository.list();
  },
};
