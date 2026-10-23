import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/auth/server";

// Resolved per request: auth is created lazily, so the build needs no secrets.
export function GET(request: Request) {
  return toNextJsHandler(getAuth()).GET(request);
}

export function POST(request: Request) {
  return toNextJsHandler(getAuth()).POST(request);
}
