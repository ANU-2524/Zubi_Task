import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { SYSTEM_PROMPT } from "./prompt.js";
const app = express();
app.use(cors());
app.use(express.json());
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || ""
});
app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
});
app.post("/api/chat", async (req, res) => {
    try {
        const { messages } = req.body;
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("Access-Control-Allow-Origin", "*");
        const tools = [
            {
                type: "function",
                function: {
                    name: "ui_action",
                    description: "Trigger a UI action to keep the child engaged.",
                    parameters: {
                        type: "object",
                        properties: {
                            type: { type: "string", enum: ["highlight", "zoom", "badge", "background", "star"] },
                            payload: { type: "object" }
                        },
                        required: ["type"]
                    }
                }
            }
        ];
        const inputMessages = [
            {
                role: "system",
                content: SYSTEM_PROMPT
            },
            ...messages.map((msg) => ({
                role: msg.role,
                content: msg.content
            }))
        ];
        const stream = await client.responses.stream({
            model: "gpt-4o-mini",
            input: inputMessages,
            tools: tools,
            tool_choice: "auto",
            temperature: 0.8
        });
        const toolCalls = [];
        for await (const event of stream) {
            if (event.type === "response.output_text.delta") {
                res.write(`data: ${JSON.stringify({ type: "text", delta: event.delta })}\n\n`);
            }
            if (event.type === "response.output_item.added" &&
                event.item?.type === "function_call" &&
                event.item.id &&
                event.item.name) {
                toolCalls.push({
                    id: event.item.id,
                    name: event.item.name,
                    arguments: event.item.arguments || "{}"
                });
                res.write(`data: ${JSON.stringify({
                    type: "tool",
                    tool: { name: event.item.name, args: event.item.arguments || "{}" }
                })}\n\n`);
            }
        }
        if (toolCalls.length > 0) {
            const followUp = await client.responses.stream({
                model: "gpt-4o-mini",
                input: [
                    {
                        role: "system",
                        content: SYSTEM_PROMPT
                    },
                    ...messages.map((msg) => ({
                        role: msg.role,
                        content: msg.content
                    })),
                    ...toolCalls.map((t) => ({
                        role: "tool",
                        tool_call_id: t.id,
                        content: "ok"
                    }))
                ],
                temperature: 0.8
            });
            for await (const event of followUp) {
                if (event.type === "response.output_text.delta") {
                    res.write(`data: ${JSON.stringify({ type: "text", delta: event.delta })}\n\n`);
                }
            }
        }
        res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
        res.end();
    }
    catch (error) {
        console.error("Error:", error);
        res.write(`data: ${JSON.stringify({ type: "error", message: "Server error" })}\n\n`);
        res.end();
    }
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`✓ Server running on http://localhost:${PORT}`);
});
