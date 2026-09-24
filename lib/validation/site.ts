import { z } from "zod";

export const publishSiteBodySchema = z.object({
  address: z.string().min(1, "address is required"),
  title: z.string().min(1, "title is required"),
  html: z.string().min(1, "html is required"),
  authorId: z.string().min(1, "authorId is required"),
});

export const getSiteByAddressParamsSchema = z.object({
  address: z.string().min(1, "address is required"),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1, "q is required"),
  cursor: z.string().optional(),
});
