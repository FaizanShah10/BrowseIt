import { VisitService } from "@/lib/services/visitService";
import {
  listVisitsQuerySchema,
  recordVisitBodySchema,
} from "@/lib/validation/visit";
import { zodErrorMessage } from "@/lib/validation/util";

export async function POST(request: Request) {
  const json: unknown = await request.json().catch(() => null);
  const parsed = recordVisitBodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ message: zodErrorMessage(parsed.error) }, { status: 400 });
  }
  const result = await VisitService.record(parsed.data);
  return Response.json(result, { status: 201 });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = listVisitsQuerySchema.safeParse({
    personId: url.searchParams.get("personId") ?? undefined,
    cursor: url.searchParams.get("cursor") ?? undefined,
  });
  if (!parsed.success) {
    return Response.json({ message: zodErrorMessage(parsed.error) }, { status: 400 });
  }
  const page = await VisitService.listForPerson(
    parsed.data.personId,
    parsed.data.cursor ?? null,
  );
  return Response.json(page);
}
