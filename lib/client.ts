export async function requestAI(payload: unknown, password: string) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(password ? { "x-workspace-password": password } : {}),
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(60000),
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      "The server returned an unreadable response. Please retry.",
    );
  }
  if (!response.ok)
    throw new Error(
      data.error?.message || "The request could not be completed.",
    );
  return data;
}
