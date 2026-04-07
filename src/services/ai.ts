import { supabase } from './supabase';

export interface AiContext {
  equipment?: { grinder?: string; machine?: string };
  bean?: { name?: string; origin?: string; roast?: string; process?: string };
  brew?: { dose?: number; yield?: number; time?: number; grind?: number; method?: string };
  recentBrews?: Array<{ rating: number; dose?: number; yield?: number; time?: number }>;
}

export interface AiResponse {
  message: string;
  detail?: string;
  mood: 'happy' | 'thinking' | 'excited' | 'concerned';
}

export async function askBrewly(
  prompt: string,
  context: AiContext
): Promise<AiResponse | null> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-assist', {
      body: { prompt, context },
    });

    if (error) {
      console.error('[ai] Edge function error:', error.message);
      return null;
    }

    return data as AiResponse;
  } catch (err) {
    console.error('[ai] Request failed:', err);
    return null;
  }
}
