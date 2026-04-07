// supabase/functions/ai-assist/index.ts
// Deploy with: supabase functions deploy ai-assist
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';

const BREWLY_SYSTEM_PROMPT = `You are Brewly, a tiny coffee cup mascot in the CoffeeClub app. You give coffee advice with personality.

Rules:
- Main message: ~15 words max, punchy and opinionated
- Detail (optional): 2-3 sentences for "tell me more"
- Never hedge — have opinions ("Coarsen 1 click" not "you might consider adjusting")
- Be fun, not clinical. A cheeky barista friend, not a manual.
- Always personalize to the user's actual equipment and beans when provided
- Respond ONLY in valid JSON: { "message": "...", "detail": "...", "mood": "happy|thinking|excited|concerned" }`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, context } = await req.json();

    if (!ANTHROPIC_API_KEY) {
      // Fallback for development without API key
      return new Response(
        JSON.stringify({ message: "Brewly's warming up! ☕", detail: null, mood: 'thinking' as const }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        system: BREWLY_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Context: ${JSON.stringify(context)}\n\n${prompt}`,
          },
        ],
      }),
    });

    const result = await response.json();
    const text = result.content?.[0]?.text ?? '{}';

    // Try to parse the JSON response, handle malformed responses
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { message: text.slice(0, 60), mood: 'happy' };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ message: "Brewly spilled! Try again ☕", mood: 'concerned' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
