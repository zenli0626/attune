import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on the server.' });
  }

  const { place, localTime, weather, bpm, hrZone: hrz, notes, taste } = req.body || {};

  const prompt = `You are an empathetic mood reader and music curator. Synthesize the signals below into an inferred mood, then prescribe music to gently shift the person toward a more positive state — without being jarring or dismissive of where they are.

SIGNALS
• Location: ${place || 'unknown'}
• Local time: ${localTime || 'unknown'}
• Weather: ${weather || 'unavailable'}
• Heart rate: ${bpm} bpm — ${hrz}
• Self-report: ${notes || '(none)'}
• Music taste: ${taste || '(unspecified)'}

CRITICAL CONSTRAINTS for track selection:
- ONLY mainstream, globally famous artists (e.g. Taylor Swift, Frank Ocean, The Beatles, Stevie Wonder, Fleetwood Mac, The Weeknd, Beyoncé, Kendrick Lamar, Coldplay, Adele, Drake, Billie Eilish tier).
- NO classical, jazz instrumentals, ambient, or obscure indie.
- If the user gave taste preferences, lean heavily into those exact artists/genres.
- Real, well-known songs only. No deep cuts.

Return exactly 5 tracks.`;

  const schema = {
    type: 'object',
    properties: {
      mood: {
        type: 'object',
        properties: {
          primary: { type: 'string', description: 'one word' },
          secondary: { type: 'string', description: 'one word' },
          intensity: { type: 'number', description: '0.0 to 1.0' },
          valence: { type: 'string', enum: ['negative', 'neutral', 'positive'] },
          color: { type: 'string', description: 'hex color like #C26A3D that captures the feeling' },
        },
        required: ['primary', 'secondary', 'intensity', 'valence', 'color'],
        additionalProperties: false,
      },
      reading: { type: 'string', description: '2-3 sentences in warm second person' },
      strategy: {
        type: 'object',
        properties: {
          name: { type: 'string', enum: ['lift', 'sustain', 'channel', 'soothe', 'ground'] },
          rationale: { type: 'string' },
        },
        required: ['name', 'rationale'],
        additionalProperties: false,
      },
      tracks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            artist: { type: 'string' },
            why: { type: 'string' },
          },
          required: ['title', 'artist', 'why'],
          additionalProperties: false,
        },
      },
    },
    required: ['mood', 'reading', 'strategy', 'tracks'],
    additionalProperties: false,
  };

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      thinking: { type: 'adaptive' },
      output_config: {
        format: { type: 'json_schema', schema },
      },
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content.find((b) => b.type === 'text')?.text;
    if (!text) {
      return res.status(502).json({ error: 'Empty response from Claude.' });
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return res.status(502).json({ error: 'Claude returned malformed JSON.' });
    }

    return res.status(200).json(parsed);
  } catch (e) {
    console.error('analyze error', e);
    if (e instanceof Anthropic.APIError) {
      return res.status(e.status || 500).json({ error: `Claude API error: ${e.message}` });
    }
    return res.status(500).json({ error: e.message || 'Unknown server error' });
  }
}
