const express = require('express');
const path = require('path');
const OpenAI = require('openai');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
const MODEL = process.env.OPENAI_MODEL || 'gpt-5.4-mini';
const ACCESS_PASSWORD = process.env.APP_PASSWORD || '';

if (!process.env.OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY environment variable.');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function requirePassword(req, res, next) {
  if (!ACCESS_PASSWORD) return next();

  const supplied =
    req.headers['x-app-password'] ||
    req.body?.password ||
    req.query?.password ||
    '';

  if (supplied !== ACCESS_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

function workflowPrompt(message) {
  return `
You are ARTHUR – Safety Guardian AI.

Role:
- Act like a high-risk work safety controller for demo purposes.
- Be practical, direct, and calm.
- If critical controls are missing, say NO-GO clearly.
- Explain why work cannot continue and what must be done before it can continue.

Knowledge lens:
- UK HSE principles
- HSG65 plan, do, check, act thinking
- IOGP Life-Saving Rules
- Process safety / PSMS style control thinking
- LMRA / 3W mindset:
  1) What can hurt you?
  2) Where is the risk?
  3) What controls keep you safe?

Rules:
- Never bluff.
- If the information is incomplete, say what is missing.
- Challenge unsafe assumptions.
- Prefer plain English over legalistic wording.
- Do not mention that you are an AI unless asked.

Return ONLY valid JSON with this exact shape:
{
  "status": "SAFE | CAUTION | NO-GO",
  "what_can_hurt_you": ["..."],
  "where_is_the_risk": ["..."],
  "controls": ["..."],
  "why": "short explanation",
  "improvement": ["specific actions to proceed safely"]
}

User task:
${message}
`.trim();
}

function askPrompt(message) {
  return `
You are ARTHUR – Safety Guardian AI.

Style:
- Clear
- Practical
- Authoritative
- Plain English
- Able to stop unsafe work

Behaviour:
- Give usable advice, not waffle.
- If something is unsafe, say so directly.
- Explain why.
- Suggest a safe way forward where possible.
- If asked to explain to the workforce, keep it simple.

User message:
${message}
`.trim();
}

async function runOpenAIText(input, mode = 'ask') {
  const prompt = mode === 'workflow' ? workflowPrompt(input) : askPrompt(input);

  const response = await openai.responses.create({
    model: MODEL,
    input: prompt
  });

  return response.output_text || '';
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'online' });
});

app.get('/api/guardian/health', requirePassword, async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.json({ status: 'degraded', arthur: 'offline', reason: 'missing_api_key' });
    }

    return res.json({ status: 'ok', arthur: 'online', provider: 'openai', model: MODEL });
  } catch (err) {
    console.error('HEALTH ERROR:', err);
    return res.json({ status: 'degraded', arthur: 'offline' });
  }
});

app.post('/chat', requirePassword, async (req, res) => {
  try {
    const { message, mode } = req.body || {};
    const response = await runOpenAIText(message || '', mode || 'ask');
    return res.json({ response });
  } catch (err) {
    console.error('CHAT ERROR:', err);

    if (req.body?.mode === 'workflow') {
      return res.json({
        response: JSON.stringify({
          status: 'NO-GO',
          what_can_hurt_you: ['Assessment unavailable'],
          where_is_the_risk: ['Risk review could not be completed'],
          controls: ['Do not proceed', 'Verify the system', 'Confirm controls manually'],
          why: 'Arthur could not complete a reliable assessment.',
          improvement: ['Restore the service', 'Reassess before work starts']
        })
      });
    }

    return res.status(500).json({
      response: 'Arthur could not complete the response. Stop and verify the job controls before continuing.'
    });
  }
});

app.post('/api/guardian', requirePassword, async (req, res) => {
  try {
    const { message, mode } = req.body || {};
    const response = await runOpenAIText(message || '', mode || 'ask');
    return res.json({ response });
  } catch (err) {
    console.error('API GUARDIAN ERROR:', err);

    if (req.body?.mode === 'workflow') {
      return res.json({
        response: JSON.stringify({
          status: 'NO-GO',
          what_can_hurt_you: ['Assessment unavailable'],
          where_is_the_risk: ['Risk review could not be completed'],
          controls: ['Do not proceed', 'Verify the system', 'Confirm controls manually'],
          why: 'Arthur could not complete a reliable assessment.',
          improvement: ['Restore the service', 'Reassess before work starts']
        })
      });
    }

    return res.status(500).json({
      response: 'Arthur could not complete the response. Stop and verify the job controls before continuing.'
    });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Safety Guardian running on port ${PORT}`);
});
