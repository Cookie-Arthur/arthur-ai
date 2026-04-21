const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

const OLLAMA_BASE = 'http://arthur-node:11434';
const MODEL = 'qwen2.5:1.5b';

// ===== HEALTH =====
app.get('/api/guardian/health', async (req, res) => {
  try {
    const r = await fetch(`${OLLAMA_BASE}/api/tags`);
    if (r.ok) {
      return res.json({ status: 'ok', arthur: 'online' });
    }
  } catch (e) {}
  res.json({ status: 'degraded', arthur: 'offline' });
});

// ===== CHAT =====
app.post('/api/guardian', async (req, res) => {
  try {
    const { message } = req.body;

    const ollamaRes = await fetch(`${OLLAMA_BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt: message,
        stream: false
      })
    });

    const data = await ollamaRes.json();

    res.json({ response: data.response || "No response" });

  } catch (err) {
    console.error(err);
    res.json({ response: "Arthur error" });
  }
});

// ===== STATIC =====
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ===== START =====
app.listen(3000, () => {
  console.log('Running on http://localhost:3000');
});
