import { z } from "npm:zod@3.25.67";
import { createServiceClient } from "../_shared/auth.ts";
import { jsonResponse, optionsResponse } from "../_shared/http.ts";

const leadSchema = z
  .object({
    fullName: z.string().trim().min(1).max(80),
    company: z.string().trim().min(1).max(120),
    email: z.string().trim().max(120).optional().default(""),
    phone: z.string().trim().max(40).optional().default(""),
    faceCount: z.number().int().min(1).max(10000),
    website: z.string().optional().default("")
  })
  .superRefine((values, context) => {
    if (!values.email && !values.phone) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["email"],
        message: "Leave an email or a phone number."
      });
    }
    if (values.email && !/^[^@]+@[^@]+\.[^@]+$/.test(values.email)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["email"],
        message: "That email does not look usable."
      });
    }
    if (values.phone && (values.phone.length < 7 || values.phone.length > 40)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phone"],
        message: "That phone does not look usable."
      });
    }
  });

function blankToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function sendLeadEmail(args: {
  fullName: string;
  company: string;
  email: string | null;
  phone: string | null;
  faceCount: number;
}): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const to = Deno.env.get("LEAD_TO_EMAIL") || "kobinastudios@gmail.com";
  const from = Deno.env.get("RESEND_FROM") || "Boardbook <onboarding@resend.dev>";
  if (!apiKey) {
    return;
  }

  const lines = [
    `${args.fullName} at ${args.company} asked for a walkthrough.`,
    `Faces: ${args.faceCount}`,
    args.email ? `Email: ${args.email}` : null,
    args.phone ? `Phone: ${args.phone}` : null
  ].filter((line): line is string => line !== null);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Walkthrough · ${args.company}`,
      text: lines.join("\n")
    })
  });

  if (!response.ok) {
    console.error("walkthrough-lead email failed", response.status);
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return optionsResponse();
  }

  if (request.method !== "POST") {
    return jsonResponse({ message: "POST only." }, 405);
  }

  try {
    const parsed = leadSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonResponse({ message: "Check the form and try again." }, 400);
    }

    if (parsed.data.website) {
      return jsonResponse({ ok: true });
    }

    const email = blankToNull(parsed.data.email);
    const phone = blankToNull(parsed.data.phone);
    const serviceClient = createServiceClient();
    const { error } = await serviceClient.from("walkthrough_leads").insert({
      full_name: parsed.data.fullName,
      company: parsed.data.company,
      email,
      phone,
      face_count: parsed.data.faceCount
    });

    if (error) {
      throw error;
    }

    await sendLeadEmail({
      fullName: parsed.data.fullName,
      company: parsed.data.company,
      email,
      phone,
      faceCount: parsed.data.faceCount
    });

    return jsonResponse({ ok: true });
  } catch (error) {
    console.error("walkthrough-lead failed", error);
    return jsonResponse({ message: "Could not send that. Try again." }, 500);
  }
});
