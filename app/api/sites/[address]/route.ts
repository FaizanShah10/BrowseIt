import { SiteService } from "@/lib/services/siteService";
import { getSiteByAddressParamsSchema } from "@/lib/validation/site";
import { zodErrorMessage } from "@/lib/validation/util";

export async function GET(
  _request: Request,
  context: { params: Promise<{ address: string }> },
) {
  const raw = await context.params;
  const parsed = getSiteByAddressParamsSchema.safeParse({
    address: decodeURIComponent(raw.address),
  });
  if (!parsed.success) {
    return Response.json({ message: zodErrorMessage(parsed.error) }, { status: 400 });
  }
  const site = await SiteService.getByAddress(parsed.data.address);
  if (!site) {
    return Response.json({ message: "Site not found" }, { status: 404 });
  }
  return Response.json(site);
}
