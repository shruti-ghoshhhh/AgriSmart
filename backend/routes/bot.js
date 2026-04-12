const express = require('express');
const router = express.Router();

// Use dynamic import for fetch or alternatively use https module
// Node 18+ has native fetch. For safety, we wrap this in robust try/catch.

// @route    POST api/bot/chat
// @desc     Chat with AgriSmart Bot — powered by Groq (LLaMA 3, free & fast)
// @access   Public
router.post('/chat', async (req, res) => {
  const { message, role } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ message: "Message cannot be empty." });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ message: "Bot configuration error. Missing Groq API Key." });
  }

  const userRole = role || 'user';
  const systemPrompt = `You are the AgriSmart Bot, a helpful AI assistant for a P2P agriculture marketplace that connects farmers directly to consumers, cutting out middlemen.

User Role: ${userRole}

Your goals:
- Help producers and consumers find fair crop prices based on market trends.
- Give producers practical tips on improving crop yields and organic farming.
- Help users navigate the AgriSmart platform (Dashboard, Marketplace, Auctions, Profile, Map).
- Answer any agriculture-related questions.

Keep responses concise (2-4 sentences max) and friendly.`;

  // Groq free models — llama-3.1-8b-instant is fastest, falls back to llama3-8b-8192
  const MODELS = ['llama-3.1-8b-instant', 'llama3-8b-8192', 'gemma2-9b-it'];

  for (const model of MODELS) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          max_tokens: 256,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        const errMsg = errBody?.error?.message || `HTTP ${response.status}`;
        console.warn(`⚠ Groq [${model}] failed: ${errMsg}`);
        continue;
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content || '';

      if (!text) {
        console.warn(`⚠ Groq [${model}] returned empty response`);
        continue;
      }

      console.log(`✓ Bot [${userRole}] via Groq/${model}: "${message.substring(0, 50)}" → OK`);
      return res.json({ text });

    } catch (err) {
      console.warn(`⚠ Groq [${model}] fetch error: ${err.message?.substring(0, 100)}`);
    }
  }

  res.status(503).json({ message: "The AgriSmart Bot is temporarily unavailable. Please try again in a moment. 🌱" });
});

module.exports = router;
