import { z } from "npm:zod@3.25.67";

export const userUpsertSchema = z
  .object({
    mode: z.enum(["create", "update"]),
    userId: z.string().uuid().optional(),
    email: z.string().email(),
    fullName: z.string().min(2),
    phone: z.string().optional().or(z.literal("")),
    role: z.enum(["admin", "sales", "inspector", "client"]),
    companyName: z.string().optional().or(z.literal("")),
    clientId: z.string().uuid().optional(),
    contactName: z.string().optional().or(z.literal("")),
    contactPhone: z.string().optional().or(z.literal("")),
    industry: z.string().optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
    notes: z.string().optional().or(z.literal(""))
  })
  .superRefine((values, context) => {
    if (values.mode === "update" && !values.userId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["userId"],
        message: "userId is required for update mode."
      });
    }

    if (values.role === "client" && !values.clientId && !values.companyName) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["companyName"],
        message: "Client users need a clientId or companyName."
      });
    }
  });

export const deactivateUserSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().optional().or(z.literal(""))
});
