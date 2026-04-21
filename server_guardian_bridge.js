// server_guardian_bridge.js
// Simple bridge between frontend demo and Arthur (Ollama on arthur-node)

const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static(__dirname)); // serves index.html

// CONFIG
const OLLAMA_BASE = process.env.OLLAMA_BASE || "http://arthur-node:11434";
const MODEL = process.env.OLLAMA_MODEL || "qwen2.5:1.5b";

// HEALTH CHECK
app.get('/health', async (req, res) => {
    try {
        const r = await fetch(`${OLLAMA_BASE}/api/tags`);
        if (!r.ok) throw new Error();
        res.json({ status: "ok", arthur: "online" });
    } catch {
        res.json({ status: "degraded", arthur: "offline" });
    }
});

// MAIN CHAT ENDPOINT
app.post('/chat', async (req, res) => {

    const { message, mode } = req.body;

    // SYSTEM PROMPTS
    let systemPrompt = "";

    if (mode === "workflow") {
        systemPrompt = `
You are ARTHUR – Safety Guardian AI.

You must:
- Apply UK HSE principles, IOGP Life Saving Rules, and confined space best practice
- Be strict: if controls are missing → NO GO
- Enforce LMRA 3W thinking

Respond ONLY in JSON:

{
  "status": "SAFE | CAUTION | NO-GO",
  "what_can_hurt_you": [],
  "where_is_the_risk": [],
  "controls": [],
  "why": "short explanation",
  "improvement": "what must be done to proceed"
}
`;
    } else {
        systemPrompt = `
You are ARTHUR – Safety Guardian AI.

You give:
- Clear, direct safety advice
- Reference best practice (HSE, IOGP, PSMS principles)
- Challenge unsafe ideas
- Explain WHY something is unsafe

Keep responses:
- Practical
- Short
- Authoritative
`;
    }

    try {

        const ollamaRes = await fetch(`${OLLAMA_BASE}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: MODEL,
                prompt: `${systemPrompt}\n\nUser Input:\n${message}`,
                stream: false
            })
        });

        const data = await ollamaRes.json();

        res.json({
            response: data.response || "No response from Arthur"
        });

    } catch (err) {

        // FAILSAFE DEMO RESPONSE
        if (mode === "workflow") {
            return res.json({
                response: JSON.stringify({
                    status: "NO-GO",
                    what_can_hurt_you: [
                        "Unknown atmosphere",
                        "No confirmed rescue capability"
                    ],
                    where_is_the_risk: [
                        "Inside confined space",
                        "Entry point without monitoring"
                    ],
                    controls: [
                        "Gas test required",
                        "Continuous monitoring required",
                        "Rescue team in place",
                        "Valid permit to work"
                    ],
                    why: "Critical confined space controls not confirmed",
                    improvement: "Do not enter until full permit, gas testing, and rescue are verified"
                })
            });
        }

        res.json({
            response: "Arthur is currently offline. Follow established safety procedures and do not proceed if unsure."
        });
    }
});

// START SERVER
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Safety Guardian running on http://localhost:${PORT}`);
});
