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

  const system = `You are an empathetic mood reader and music curator. Always respond with a single valid JSON object — no markdown, no code fences, no explanation outside the JSON.

JSON shape:
{
  "mood": { "primary": "one word", "secondary": "one word", "intensity": 0.0–1.0, "valence": "negative"|"neutral"|"positive", "color": "#hexcode" },
  "reading": "2-3 warm second-person sentences",
  "strategy": { "name": "lift"|"sustain"|"channel"|"soothe"|"ground", "rationale": "one sentence" },
  "tracks": [ { "title": "...", "artist": "...", "why": "one sentence" } ]
}`;

  const prompt = `Synthesize the signals below into an inferred mood, then prescribe exactly 6 tracks of music to gently shift the person toward a more positive state.

SIGNALS
• Location: ${place || 'unknown'}
• Local time: ${localTime || 'unknown'}
• Weather: ${weather || 'unavailable'}
• Heart rate: ${bpm} bpm — ${hrz}
• Self-report: ${notes || '(none)'}
• Music taste: ${taste || '(unspecified)'}

TRACK SELECTION RULES (in priority order):
1. If music taste is given, stay strictly within those genres/artists — this overrides everything else. "classical piano" → Chopin, Debussy, Ravel, Bach; "jazz" → Miles Davis, Coltrane, Bill Evans; etc.
2. If no taste given, use only mainstream globally famous artists (Taylor Swift, Frank Ocean, The Beatles, Stevie Wonder, The Weeknd, Beyoncé, Coldplay, Adele tier).
3. Real, well-known songs only.

Return exactly 6 tracks. Respond with JSON only.`;

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = response.content.find((b) => b.type === 'text')?.text || '';
    // Strip markdown code fences if present
    const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    if (!text) {
      return res.status(502).json({ error: 'Empty response from Claude.' });
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error('JSON parse failed. Raw response:', raw);
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
