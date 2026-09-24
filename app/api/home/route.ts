import { HomeService } from "@/lib/services/homeService";
import { z } from "zod";
import { zodErrorMessage } from "@/lib/validation/util";

const homeQuerySchema = z.object({
  personId: z.string().min(1, "personId is required"),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = homeQuerySchema.safeParse({
    personId: url.searchParams.get("personId") ?? undefined,
  });
  if (!parsed.success) {
    return Response.json({ message: zodErrorMessage(parsed.error) }, { status: 400 });
  }
  const summary = await HomeService.summary(parsed.data.personId);
  return Response.json(summary);
}
