import { BadRequestError, ConflictError } from "@/lib/errors";
import { SiteService } from "@/lib/services/siteService";
import { publishSiteBodySchema } from "@/lib/validation/site";
import { zodErrorMessage } from "@/lib/validation/util";

export async function POST(request: Request) {
  const json: unknown = await request.json().catch(() => null);
  const parsed = publishSiteBodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ message: zodErrorMessage(parsed.error) }, { status: 400 });
  }
  try {
    const site = await SiteService.publish(parsed.data);
    return Response.json(site, { status: 201 });
  } catch (err) {
    if (err instanceof BadRequestError) {
      return Response.json({ message: err.message }, { status: 400 });
    }
    if (err instanceof ConflictError) {
      return Response.json({ message: err.message }, { status: 409 });
    }
    throw err;
  }
}
