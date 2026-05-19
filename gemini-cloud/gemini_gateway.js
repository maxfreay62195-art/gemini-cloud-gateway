/**
 * Universal Gemini Cloud Gateway (Strict OpenAI Image Emulation)
 * Emulates the exact OpenAI endpoint structure to bypass strict MCP locks
 */

const express = require('express');
const https = require('https');
const app = express();
app.use(express.json({ limit: '50mb' }));

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

// Emulates OpenAI's structure so Manus or Codex can query it natively
app.post('/v1/images/generations', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Missing prompt configuration." });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${API_KEY}`;
  try {
    const response = await apiCall(url, { instances: { prompt }, parameters: { sampleCount: 1 } });
    const b64 = response.predictions?.[0]?.bytesBase64Encoded;
    
    if (!b64) return res.status(502).json({ error: "No image data returned from Gemini engine." });

    // Returns exact structure OpenAI uses
    return res.json({ 
      created: Date.now(), 
      data: [{ b64_json: b64, revised_prompt: prompt }] 
    });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// Basic check
app.get('/', (req, res) => res.send("OpenAI Emulation Engine Online."));

app.listen(PORT, () => console.log(`Gateway running on cloud port ${PORT}`));
