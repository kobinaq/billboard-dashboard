import { corsHeaders } from "./cors.ts";

export function optionsResponse() {
  return new Response("ok", {
    headers: corsHeaders
  });
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}
