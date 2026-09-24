import { z } from "zod";

/**
 * Payloads the sandboxed frame may post to the parent.
 * Authenticate by `e.source === iframe.contentWindow` — never by `e.origin`
 * (opaque origin is always the string `"null"`).
 */
export const frameMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("navigate"),
    /** Raw href attribute — parent runs it through normalizeAddress(). */
    address: z.string().min(1),
  }),
  z.object({
    type: z.literal("resize"),
    height: z.number().finite().nonnegative(),
  }),
]);

export type FrameMessage = z.infer<typeof frameMessageSchema>;
