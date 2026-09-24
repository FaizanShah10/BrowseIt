import { PersonService } from "@/lib/services/personService";

export async function GET() {
  const people = await PersonService.list();
  return Response.json(people);
}
