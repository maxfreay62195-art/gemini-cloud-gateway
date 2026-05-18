/**
 * Universal Gemini Cloud Gateway (REST + HTTP MCP)
 * Injected API Key & Dual Handling for Codex & Manus AI
 */

const express = require('express');
const https = require('https');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;
const API_KEY = "AIzaSyB9wvkHusvQz0B9o_q2p83lAZu_otMpwJ0";

function apiCall(url, payload) {
  return new Promise((resolve, reject) => {
    const options = { method: 'POST', headers: { 'Content-Type': 'application/json' } };
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (e) { reject(new Error("Upstream parse error")); }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify(payload));
    req.end();
  });
}

// 🤖 1. MANUS MCP COMPLIANCE LAYER 

// Tool Discovery Link
app.get('/tools', (req, res) => {
  res.json({
    tools: [
      {
        name: 'gemini_generate_image',
        description: 'Generates high-fidelity visual imagery using Google Imagen 4.0',
        inputSchema: {
          type: 'object',
          properties: { prompt: { type: 'string', description: 'Detailed visual prompt' } },
          required: ['prompt']
        }
      }
    ]
  });
});

// Tool Execution Link (JSON-RPC structure)
app.post('/tools/call', async (req, res) => {
  const { name, arguments: args } = req.body;
  if (name !== 'gemini_generate_image') {
    return res.status(404).json({ error: 'Unknown tool requested' });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${API_KEY}`;
  try {
    const response = await apiCall(url, { instances: { prompt: args.prompt }, parameters: { sampleCount: 1 } });
    const b64 = response.predictions?.[0]?.bytesBase64Encoded;
    if (!b64) return res.json({ content: [{ type: 'text', text: 'Error: No image returned' }], isError: true });

    // Returns structural binary-text to Manus UI context
    res.json({
      content: [
        { type: 'text', text: `Successfully generated image for prompt: ${args.prompt}` },
        { type: 'image', data: b64, mimeType: 'image/png' }
      ]
    });
  } catch (err) {
    res.json({ content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true });
  }
});

// 💻 2. CODEX COMPLIANCE LAYER (Legacy OpenAI Emulation)
app.post('/v1/images/generations', async (req, res) => {
  const { prompt } = req.body;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${API_KEY}`;
  try {
    const response = await apiCall(url, { instances: { prompt }, parameters: { sampleCount: 1 } });
    const b64 = response.predictions?.[0]?.bytesBase64Encoded;
    if (!b64) return res.status(502).json({ error: "No data returned." });
    res.json({ created: Date.now(), data: [{ b64_json: b64 }] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/', (req, res) => res.send("Universal MCP Server Online."));
app.listen(PORT, () => console.log(`Active server map deployed on port ${PORT}`));
