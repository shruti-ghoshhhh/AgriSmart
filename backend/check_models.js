require('dotenv').config();

async function test() {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say hi in one word.' }
      ],
      max_tokens: 10
    })
  });

  const data = await response.json();
  if (response.ok) {
    console.log('✅ Groq works:', data.choices[0].message.content);
  } else {
    console.log('❌ Groq error:', JSON.stringify(data).substring(0, 300));
  }
}

test();
