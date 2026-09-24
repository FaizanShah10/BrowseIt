import { SearchService } from "@/lib/services/searchService";
import { searchQuerySchema } from "@/lib/validation/site";
import { zodErrorMessage } from "@/lib/validation/util";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = searchQuerySchema.safeParse({
    q: url.searchParams.get("q") ?? undefined,
    cursor: url.searchParams.get("cursor") ?? undefined,
  });
  if (!parsed.success) {
    return Response.json({ message: zodErrorMessage(parsed.error) }, { status: 400 });
  }
  const page = await SearchService.search(
    parsed.data.q,
    parsed.data.cursor ?? null,
  );
  return Response.json(page);
}
