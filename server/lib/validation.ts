import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce
    .number()
    .int()
    .positive()
    .max(200)
    .default(20),
});

export function parseQuery<T extends z.ZodTypeAny>(schema: T, input: unknown) {
  const result = schema.safeParse(input);
  if (!result.success) {
    const message = result.error.errors.map((e) => e.message).join(", ");
    const err: any = new Error(message || "Invalid request");
    err.status = 400;
    throw err;
  }
  return result.data as z.infer<T>;
}

