import { z } from "zod";

export const visitMethodSchema = z.enum(["typed", "link", "search", "history"]);

export const recordVisitBodySchema = z.object({
  personId: z.string().min(1, "personId is required"),
  address: z.string().min(1, "address is required"),
  method: visitMethodSchema,
  fromVisitId: z.string().nullable().optional(),
});

export const listVisitsQuerySchema = z.object({
  personId: z.string().min(1, "personId is required"),
  cursor: z.string().optional(),
});
