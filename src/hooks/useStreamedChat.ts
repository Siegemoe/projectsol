/**
 * useStreamedChat
 * Extracts the SSE streaming loop used by SolChat so UI stays lean and testable.
 * It does not own any UI state; instead it calls the provided callbacks.
 */
export function useStreamedChat(apiPath: string = "/api/sol-chat") {
  async function startStream(opts: {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    model: string;
    temperature: number;
    system?: string;
    onOpen?: () => void;
    onToken?: (token: string) => void;
  }): Promise<void> {
    const { messages, model, temperature, system, onOpen, onToken } = opts;

    const res = await fetch(apiPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, model, temperature, system }),
    });

    if (!res.ok || !res.body) {
      const errText = await res.text().catch(() => "");
      throw new Error(errText || "Proxy request failed");
    }

    onOpen?.();

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let doneStreaming = false;

    while (!doneStreaming) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      for (const event of events) {
        const lines = event.split("\n");
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine.startsWith("data:")) continue;
          const data = trimmedLine.slice(5).trim();
          if (!data) continue;
          if (data === "[DONE]") {
            doneStreaming = true;
            break;
          }
          try {
            const json = JSON.parse(data);
            const delta =
              json?.choices?.[0]?.delta?.content ??
              json?.choices?.[0]?.message?.content ??
              "";
            if (typeof delta === "string" && delta.length > 0) {
              onToken?.(delta);
            }
          } catch {
            // Non-JSON keepalive/ping, ignore
          }
        }
        if (doneStreaming) break;
      }
    }
  }

  return { startStream };
}
