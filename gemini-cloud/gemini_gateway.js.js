/**
 * Gemini REST Gateway for Codex & Manus Cloud Integration
 * Fully hardwired for 24/7 cloud server execution.
 */

const express = require('express');
const https = require('https');
const app = express();
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 3000;

// Hardwired API Key injected directly into the cloud system pipeline
const API_KEY = "AIzaSyB9wvkHusvQz0B9o_q2p83lAZu_otMpwJ0";

function apiCall(url, payload) {
  return new Promise((resolve, reject) => {
    const options = { method: 'POST', headers: { 'Content-Type': 'application/json' } };
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error("Failed to parse upstream response"));
        }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify(payload));
    req.end();
  });
}

// Emulates OpenAI's structure so Codex/Manus work seamlessly out-of-the-box
app.post('/v1/images/generations', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Missing prompt configuration." });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${API_KEY}`;
  try {
    const response = await apiCall(url, { instances: { prompt }, parameters: { sampleCount: 1 } });
    const b64 = response.predictions?.[0]?.bytesBase64Encoded;
    
    if (!b64) return res.status(502).json({ error: "No image data returned from Gemini engine." });

    return res.json({ 
      created: Date.now(), 
      data: [{ b64_json: b64, revised_prompt: prompt }] 
    });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// Health check endpoint for Render monitoring
app.get('/', (req, res) => res.send("Gemini Cloud Bridge is Active & Online."));

app.listen(PORT, () => console.log(`Gateway running on cloud port ${PORT}`));