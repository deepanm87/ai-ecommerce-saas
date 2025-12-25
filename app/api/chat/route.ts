import { createAgentUIStreamResponse, type UIMessage } from "ai"
import { auth } from "@clerk/nextjs/server"
import { createShoppingAgent } from "@/lib/ai/shopping-agent"

function normalizeMessage(raw: any): UIMessage | null {
  if (!raw || typeof raw !== "object") return null

  // If caller sent an older/alternate shape using `content`, convert to `parts`
  if (!raw.parts && Array.isArray(raw.content)) {
    const parts = raw.content
      .filter((c: any) => c && typeof c === "object")
      .map((c: any) => ({ type: c.type ?? "text", ...(c.type === "text" ? { text: c.text ?? "" } : {}) }))

    return {
      id: String(raw.id ?? Math.random().toString(36).slice(2)),
      role: raw.role ?? "user",
      parts,
    } as UIMessage
  }

  // If already has parts, ensure it's shaped minimally
  if (Array.isArray(raw.parts)) {
    return {
      id: String(raw.id ?? Math.random().toString(36).slice(2)),
      role: raw.role ?? "user",
      parts: raw.parts,
    } as UIMessage
  }

  return null
}

export async function POST(request: Request) {
  let body: any
  try {
    body = await request.json()
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    })
  }

  const rawMessages = body?.messages
  if (!Array.isArray(rawMessages)) {
    return new Response(JSON.stringify({ error: "`messages` must be an array" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    })
  }

  const messages: UIMessage[] = rawMessages
    .map(normalizeMessage)
    .filter((m): m is UIMessage => m !== null)

  if (messages.length === 0) {
    return new Response(JSON.stringify({ error: "No valid messages provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    })
  }

  const { userId } = await auth()

  const agent = createShoppingAgent({ userId })

  try {
    return await createAgentUIStreamResponse({
      agent,
      uiMessages: messages
    })
  } catch (err: any) {
    console.error("AI agent stream error:", err)

    const message = err?.message ?? String(err)

    // If OpenAI was selected but the model is unsupported, retry using the gateway
    if (process.env.OPENAI_API_KEY && /Unsupported model version/i.test(message)) {
      try {
        const gatewayAgent = createShoppingAgent({ userId, forceGateway: true })
        return await createAgentUIStreamResponse({ agent: gatewayAgent, uiMessages: messages })
      } catch (err2: any) {
        console.error("Gateway retry failed:", err2)
        const msg2 = err2?.message ?? String(err2)
        return new Response(JSON.stringify({ error: msg2 }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        })
      }
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
}