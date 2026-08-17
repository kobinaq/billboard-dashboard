import { qs } from "./dom";

type LeadState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string }
  | { kind: "done" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readField(form: HTMLFormElement, name: string): string {
  const field = form.elements.namedItem(name);
  if (!(field instanceof HTMLInputElement)) {
    return "";
  }
  return field.value.trim();
}

function parseFaceCount(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }
  const count = Number(value);
  if (!Number.isInteger(count) || count < 1 || count > 10000) {
    return null;
  }
  return count;
}

function looksLikeEmail(value: string): boolean {
  return /^[^@]+@[^@]+\.[^@]+$/.test(value);
}

async function submitLead(payload: Record<string, unknown>): Promise<void> {
  const url =
    import.meta.env.REACT_APP_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL || "";
  const key =
    import.meta.env.REACT_APP_SUPABASE_ANON_KEY ||
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY ||
    "";

  if (!url || !key) {
    throw new Error("This page needs the project URL and anon key in the environment.");
  }

  let origin: string;
  try {
    origin = new URL(url).origin;
  } catch {
    throw new Error("The Supabase URL in the environment is not a valid URL.");
  }

  const endpoint = new URL("/functions/v1/walkthrough-lead", `${origin}/`).toString();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      isRecord(body) && typeof body.message === "string"
        ? body.message
        : "Could not send that. Try again.";
    throw new Error(message);
  }
}

function paint(root: HTMLElement, state: LeadState): void {
  const form = qs(root, "[data-walkthrough-form]");
  const status = qs(root, "[data-walkthrough-status]");
  const done = qs(root, "[data-walkthrough-done]");
  if (!form || !status || !done) {
    return;
  }

  const submit = form.querySelector("button[type='submit']");
  const busy = state.kind === "submitting";
  if (submit instanceof HTMLButtonElement) {
    submit.disabled = busy;
    submit.textContent = busy ? "Sending." : "Book a walkthrough";
  }

  switch (state.kind) {
    case "idle":
      form.hidden = false;
      done.hidden = true;
      status.hidden = true;
      status.textContent = "";
      return;
    case "submitting":
      form.hidden = false;
      done.hidden = true;
      status.hidden = true;
      return;
    case "error":
      form.hidden = false;
      done.hidden = true;
      status.hidden = false;
      status.textContent = state.message;
      return;
    case "done":
      form.hidden = true;
      done.hidden = false;
      status.hidden = true;
      return;
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

export function initWalkthroughForm(): void {
  const root = qs(document, "[data-walkthrough-lead]");
  if (!root) {
    return;
  }

  const form = qs(root, "[data-walkthrough-form]");
  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  paint(root, { kind: "idle" });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const fullName = readField(form, "fullName");
    const company = readField(form, "company");
    const email = readField(form, "email");
    const phone = readField(form, "phone");
    const website = readField(form, "website");
    const faceCount = parseFaceCount(readField(form, "faceCount"));

    if (!fullName || !company) {
      paint(root, { kind: "error", message: "Name and company are required." });
      return;
    }
    if (!email && !phone) {
      paint(root, { kind: "error", message: "Leave an email or a phone number." });
      return;
    }
    if (email && !looksLikeEmail(email)) {
      paint(root, { kind: "error", message: "That email does not look usable." });
      return;
    }
    if (faceCount === null) {
      paint(root, { kind: "error", message: "How many faces do you run?" });
      return;
    }

    paint(root, { kind: "submitting" });
    void submitLead({
      fullName,
      company,
      email,
      phone,
      faceCount,
      website
    })
      .then(() => {
        paint(root, { kind: "done" });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not send that. Try again.";
        paint(root, { kind: "error", message });
      });
  });
}
