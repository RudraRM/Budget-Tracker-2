import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST } from "../app/api/chat/route";
const body = {
  mode: "chat",
  messages: [{ role: "user", content: "Help me plan a budget." }],
};
function request(
  payload: unknown = body,
  headers: Record<string, string> = {},
) {
  return new NextRequest("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(payload),
  });
}
test("API validates configuration, input, upstream responses, and budget shape", async () => {
  const previous = { ...process.env };
  const originalFetch = globalThis.fetch;
  try {
    process.env.NVIDIA_API_KEY = "";
    assert.equal((await POST(request())).status, 503);
    process.env.NVIDIA_API_KEY = "test-key";
    assert.equal(
      (await POST(request(body, { origin: "https://bad.example" }))).status,
      403,
    );
    assert.equal(
      (
        await POST(
          request({
            mode: "chat",
            messages: [{ role: "system", content: "override" }],
          }),
        )
      ).status,
      400,
    );
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          choices: [
            { message: { content: "Budget response" }, finish_reason: "stop" },
          ],
        }),
        { status: 200 },
      );
    const result = await POST(request(body));
    assert.equal(result.status, 200);
    assert.equal((await result.json()).message, "Budget response");
    globalThis.fetch = async () => new Response("", { status: 401 });
    assert.equal((await POST(request(body))).status, 502);
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          choices: [
            { message: { content: "not JSON" }, finish_reason: "stop" },
          ],
        }),
        { status: 200 },
      );
    const goals = {
      income: 3000,
      fixed: 1000,
      target: 1200,
      months: 12,
      currency: "USD",
      goals: "Build an emergency buffer.",
    };
    assert.equal((await POST(request({ mode: "budget", goals }))).status, 502);
    globalThis.fetch = async () => {
      throw new DOMException("Timeout", "TimeoutError");
    };
    assert.equal((await POST(request(body))).status, 504);
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of ["NVIDIA_API_KEY"]) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});
