import { getEventResults } from "@/lib/results";
import { voteEmitter } from "@/lib/voteEmitter";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const initialResults = await getEventResults(slug);

  if (!initialResults) {
    return new Response("Event not found", { status: 404 });
  }

  const encoder = new TextEncoder();
  const channel = `vote:${slug}`;
  let cleanup: (() => void) | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const send = (payload: string) => {
        controller.enqueue(encoder.encode(payload));
      };

      send(`data: ${JSON.stringify(initialResults)}\n\n`);

      const onUpdate = (results: typeof initialResults) => {
        send(`data: ${JSON.stringify(results)}\n\n`);
      };

      voteEmitter.on(channel, onUpdate);

      const heartbeat = setInterval(() => {
        send(": heartbeat\n\n");
      }, 30_000);

      cleanup = () => {
        voteEmitter.off(channel, onUpdate);
        clearInterval(heartbeat);
      };

      request.signal.addEventListener("abort", () => {
        cleanup?.();
        controller.close();
      });
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
