import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { SYSTEM_PROMPT } from "./prompt.js";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

const tools: OpenAI.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "ui_action",
      description:
        "Perform a visual action on the child's screen to keep them engaged. Call this during conversation to make the interaction fun and interactive.",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["highlight", "stars", "confetti", "background"],
            description:
              "highlight = glow the image, stars = show star animation for praise, confetti = celebration confetti, background = change background mood",
          },
          payload: {
            type: "object",
            description: "Optional payload, e.g. {color:'warm'} for background",
          },
        },
        required: ["type"],
      },
    },
  },
];

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "messages array is required" });
      return;
    }

    if (!process.env.OPENAI_API_KEY) {
      res.status(500).json({ error: "OpenAI API key not configured" });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const chatMessages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((m: any) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    // First call — may include tool calls + text
    const stream = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: chatMessages,
      tools,
      tool_choice: "auto",
      temperature: 0.8,
      max_tokens: 250,
      stream: true,
    });

    let fullText = "";
    const toolCalls: Record<
      number,
      { id: string; name: string; args: string }
    > = {};

    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      if (!choice) continue;

      // Stream text deltas
      if (choice.delta?.content) {
        fullText += choice.delta.content;
        res.write(
          `data: ${JSON.stringify({ type: "text", delta: choice.delta.content })}\n\n`
        );
      }

      // Accumulate tool call deltas
      if (choice.delta?.tool_calls) {
        for (const tc of choice.delta.tool_calls) {
          if (!toolCalls[tc.index]) {
            toolCalls[tc.index] = {
              id: tc.id || "",
              name: tc.function?.name || "",
              args: "",
            };
          }
          if (tc.id) toolCalls[tc.index].id = tc.id;
          if (tc.function?.name) toolCalls[tc.index].name = tc.function.name;
          if (tc.function?.arguments)
            toolCalls[tc.index].args += tc.function.arguments;
        }
      }
    }

    // If there were tool calls, send them to client and do follow-up
    const tcList = Object.values(toolCalls).filter((t) => t.id && t.name);
    if (tcList.length > 0) {
      // Send each tool action to the frontend
      for (const tc of tcList) {
        let parsedArgs: any = {};
        try {
          parsedArgs = JSON.parse(tc.args || "{}");
        } catch {
          /* ignore parse errors */
        }
        res.write(
          `data: ${JSON.stringify({ type: "tool", action: parsedArgs.type || tc.name, payload: parsedArgs.payload || {} })}\n\n`
        );
      }

      // Build tool result messages for follow-up
      const assistantMsg: OpenAI.ChatCompletionMessageParam = {
        role: "assistant",
        content: fullText || null,
        tool_calls: tcList.map((tc) => ({
          id: tc.id,
          type: "function" as const,
          function: { name: tc.name, arguments: tc.args },
        })),
      };

      const toolResults: OpenAI.ChatCompletionMessageParam[] = tcList.map(
        (tc) => ({
          role: "tool" as const,
          tool_call_id: tc.id,
          content: "Action performed successfully on the UI.",
        })
      );

      // Follow-up call to get the text response after tool calls
      const followUp = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [...chatMessages, assistantMsg, ...toolResults],
        temperature: 0.8,
        max_tokens: 200,
        stream: true,
      });

      for await (const chunk of followUp) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          res.write(
            `data: ${JSON.stringify({ type: "text", delta })}\n\n`
          );
        }
      }
    }

    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error("Chat error:", error?.message || error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate response" });
    } else {
      res.write(
        `data: ${JSON.stringify({ type: "error", message: "Generation failed" })}\n\n`
      );
      res.end();
    }
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
