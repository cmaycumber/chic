/**
 * OpenAI's domain verification for the Chic app in ChatGPT: the platform
 * fetches this path and expects exactly the token it issued, as plain text.
 * Set `OPENAI_APPS_CHALLENGE` while verifying; without it the path 404s.
 */
export function GET() {
  const token = process.env.OPENAI_APPS_CHALLENGE?.trim();
  if (!token) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(token, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
