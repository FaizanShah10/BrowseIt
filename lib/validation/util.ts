import { z } from "zod";

/** Format a Zod failure as a plain 400 message string. */
export function zodErrorMessage(error: z.ZodError): string {
  return error.issues.map((i) => i.message).join("; ");
}
