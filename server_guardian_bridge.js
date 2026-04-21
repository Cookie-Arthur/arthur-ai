const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

const OLLAMA_BASE = process.env.OLLAMA_BASE || 'http://arthur-node:11434';
const MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:1.5b';

async function checkArthur() {
  try {
    const r = await fetch(`${OLLAMA_BASE}/api/tags`);
    return r.ok;
  } catch (err) {
    console.error('HEALTH CHECK ERROR:', err);
    return false;
  }
}

async function askArthur(message, mode = 'ask') {
  let systemPrompt = '';

  if (mode === 'workflow') {
    systemPrompt = `
You are ARTHUR – Safety Guardian AI.

You must:
- Apply UK HSE principles, IOGP Life Saving Rules, HSG65 thinking, and confined space best practice
- Be strict: if controls are missing -> NO GO
- Enforce LMRA 3W thinking
- Give practical controls and clear reasons

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
- clear, direct safety advice
- practical explanations
- challenge unsafe ideas
- safe alternatives where possible
- plain English, like a strong toolbox talk

If something is unsafe, say so clearly and explain why.
`;
  }

  const ollamaRes = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt: `${systemPrompt}\n\nUser Input:\n${message}`,
      stream: false
    })
  });

  if (!ollamaRes.ok) {
    throw new Error(`Ollama returned ${ollamaRes.status}`);
  }

  const data = await ollamaRes.json();
  return data.response || 'No response from Arthur';
}

async function healthHandler(req, res) {
  const ok = await checkArthur();
  if (ok) {
    return res.json({ status: 'ok', arthur: 'online' });
  }
  return res.json({ status: 'degraded', arthur: 'offline' });
}

app.get('/health', healthHandler);
app.get('/api/guardian/health', healthHandler);

async function chatHandler(req, res) {
  try {
    const { message, mode } = req.body;
    const response = await askArthur(message, mode);
    return res.json({ response });
  } catch (err) {
    console.error('CHAT ERROR:', err);

    if (req.body?.mode === 'workflow') {
      return res.json({
        response: JSON.stringify({
          status: 'NO-GO',
          what_can_hurt_you: [
            'Unknown atmosphere',
            'No confirmed rescue capability'
          ],
          where_is_the_risk: [
            'Inside confined space',
            'At the entry point',
            'During loss of monitoring'
          ],
          controls: [
            'Valid permit to work',
            'Gas testing before entry',
            'Continuous atmospheric monitoring',
            'Standby man in place',
            'Rescue plan and equipment confirmed'
          ],
          why: 'Critical confined space controls are not confirmed.',
          improvement: 'Do not enter until permit, testing, monitoring, standby and rescue are fully verified.'
        })
      });
    }

    return res.json({
      response: 'Arthur is online but the answer could not be processed. Stop and verify the control measures before continuing.'
    });
  }
}

app.post('/chat', chatHandler);
app.post('/api/guardian', chatHandler);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Safety Guardian running on http://localhost:${PORT}`);
});
