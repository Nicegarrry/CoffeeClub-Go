# Build 1: Backend & Auth Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the Supabase backend with equipment catalog, background sync, onboarding flow, and AI/Brewly foundation.

**Architecture:** Extend existing Supabase schema with equipment_catalog table + seed data. Add sync service that pushes unsynced local brews to Supabase. Build 3-step onboarding (name/avatar, brew method, equipment from catalog). Add AI service as thin client calling a Supabase Edge Function with Brewly's personality. Brewly mascot is a reanimated coffee cup component used inline.

**Tech Stack:** Expo 54 + React Native 0.81 + Supabase JS v2 + AsyncStorage + Reanimated 4 + TypeScript

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `supabase/schema.sql` | Modify | Add equipment_catalog table |
| `supabase/seed-equipment.sql` | Create | ~150 equipment catalog items |
| `src/types/database.ts` | Modify | Add DbEquipmentCatalog type |
| `src/services/db.ts` | Modify | Add markSynced(), getUnsyncedBrews(), clearSyncedBrews() |
| `src/services/sync.ts` | Create | Background sync engine |
| `src/services/ai.ts` | Create | Thin wrapper calling Supabase Edge Function |
| `supabase/functions/ai-assist/index.ts` | Create | Edge Function calling Claude API |
| `src/components/ui/Brewly.tsx` | Create | Animated mascot component |
| `src/hooks/useEquipmentCatalog.ts` | Create | Fetch/search catalog items |
| `src/hooks/useOnboarding.ts` | Create | Onboarding state management |
| `app/onboarding.tsx` | Create | 3-step onboarding flow |
| `app/_layout.tsx` | Modify | Add onboarding gate after auth |
| `src/hooks/useAuth.tsx` | Modify | Add preferred_method to user profile |
| `src/types/database.ts` | Modify | Add preferred_method to DbUser |

---

## Task 1: Equipment Catalog Schema + Seed Data

**Files:**
- Modify: `supabase/schema.sql` (append after line 161)
- Create: `supabase/seed-equipment.sql`
- Modify: `src/types/database.ts` (add type after line 80)

- [ ] **Step 1: Add equipment_catalog table to schema.sql**

Append to `supabase/schema.sql` after the indexes block (line 161):

```sql
-- Equipment Catalog (pre-built list of common gear)
create table public.equipment_catalog (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('grinder', 'espresso_machine', 'pour_over', 'immersion', 'kettle', 'scale', 'accessory')),
  brand text not null,
  model text not null,
  detail text default '',
  grind_range text,
  popularity_rank integer not null default 100,
  created_at timestamptz not null default now()
);

alter table public.equipment_catalog enable row level security;

create policy "Equipment catalog is viewable by everyone" on public.equipment_catalog
  for select using (true);

create index idx_catalog_type on public.equipment_catalog (type, popularity_rank);
create index idx_catalog_brand on public.equipment_catalog (brand);
```

Also add `preferred_method` column to users table. Append:

```sql
-- Add preferred brew method to users
alter table public.users add column if not exists preferred_method text default '';
```

- [ ] **Step 2: Add DbEquipmentCatalog type to database.ts**

Add after DbLike interface (line 80):

```typescript
export interface DbEquipmentCatalog {
  id: string;
  type: 'grinder' | 'espresso_machine' | 'pour_over' | 'immersion' | 'kettle' | 'scale' | 'accessory';
  brand: string;
  model: string;
  detail: string;
  grind_range: string | null;
  popularity_rank: number;
  created_at: string;
}
```

Also add `preferred_method` to DbUser interface (after `location` field):

```typescript
preferred_method: string;
```

- [ ] **Step 3: Create seed-equipment.sql with ~150 catalog items**

Create `supabase/seed-equipment.sql` with INSERT statements for common equipment across all categories: grinders (~30), espresso machines (~25), pour-overs (~15), immersion (~10), kettles (~10), scales (~10), accessories (~10). Include `popularity_rank` based on community popularity (lower = more popular).

- [ ] **Step 4: Apply migration via Supabase MCP**

Run the schema changes via the Supabase MCP `apply_migration` tool. Then execute the seed SQL via `execute_sql`.

- [ ] **Step 5: Commit**

```bash
git add supabase/schema.sql supabase/seed-equipment.sql src/types/database.ts
git commit -m "feat: add equipment_catalog table with 150+ seed items"
```

---

## Task 2: Offline Sync Service

**Files:**
- Modify: `src/services/db.ts` (add functions after line 44)
- Create: `src/services/sync.ts`

- [ ] **Step 1: Add sync helpers to db.ts**

Add after line 44 in `src/services/db.ts`:

```typescript
export async function getUnsyncedBrews(): Promise<StoredBrew[]> {
  const brews = await getLocalBrews();
  return brews.filter(b => !b.synced);
}

export async function markSynced(brewId: string): Promise<void> {
  const brews = await getLocalBrews();
  const updated = brews.map(b => b.id === brewId ? { ...b, synced: true } : b);
  await AsyncStorage.setItem(BREWS_KEY, JSON.stringify(updated));
}

export async function clearSyncedBrews(): Promise<void> {
  const brews = await getLocalBrews();
  const unsynced = brews.filter(b => !b.synced);
  await AsyncStorage.setItem(BREWS_KEY, JSON.stringify(unsynced));
}
```

- [ ] **Step 2: Create sync.ts**

Create `src/services/sync.ts`:

```typescript
import { supabase } from './supabase';
import { getUnsyncedBrews, markSynced } from './db';
import { uploadBrewPhoto } from './storage';

let isSyncing = false;

export async function syncBrews(): Promise<{ synced: number; failed: number }> {
  if (isSyncing) return { synced: 0, failed: 0 };
  isSyncing = true;

  let synced = 0;
  let failed = 0;

  try {
    const unsynced = await getUnsyncedBrews();

    for (const brew of unsynced) {
      try {
        let photoUrl: string | null = null;
        if (brew.photo) {
          photoUrl = await uploadBrewPhoto(brew.photo, brew.id);
        }

        const { error } = await supabase.from('brews').upsert({
          id: brew.id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          name: brew.name,
          rating: brew.rating,
          photo_url: photoUrl,
          brew_type: brew.method || 'other',
          dose_in_grams: brew.doseIn,
          yield_out_grams: brew.yieldOut,
          brew_time_seconds: brew.brewTime ? parseInt(brew.brewTime) : null,
          grind_setting: brew.grindSetting?.toString() ?? null,
          tasting_notes: brew.tastingNotes,
          bean_id: brew.beanId,
          is_public: true,
          created_at: brew.createdAt,
        });

        if (error) {
          console.error('[sync] Failed to sync brew:', error.message);
          failed++;
        } else {
          await markSynced(brew.id);
          synced++;
        }
      } catch (err) {
        console.error('[sync] Error syncing brew:', err);
        failed++;
      }
    }
  } finally {
    isSyncing = false;
  }

  return { synced, failed };
}

export async function pullBrews(): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return;

  const { data } = await supabase
    .from('brews')
    .select('*')
    .eq('user_id', user.user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (data) {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    await AsyncStorage.setItem('@coffeeclub:brews:remote', JSON.stringify(data));
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/services/db.ts src/services/sync.ts
git commit -m "feat: add offline sync service with push/pull"
```

---

## Task 3: AI Service + Supabase Edge Function

**Files:**
- Create: `src/services/ai.ts`
- Create: `supabase/functions/ai-assist/index.ts`

- [ ] **Step 1: Create ai.ts client wrapper**

Create `src/services/ai.ts`:

```typescript
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
```

- [ ] **Step 2: Create edge function scaffold**

Create `supabase/functions/ai-assist/index.ts`. This is the Supabase Edge Function that will call the Anthropic API. For now, scaffold with a structured response:

```typescript
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
- Always personalize to the user's actual equipment and beans
- Respond in JSON: { "message": "...", "detail": "...", "mood": "happy|thinking|excited|concerned" }`;

serve(async (req) => {
  try {
    const { prompt, context } = await req.json();

    if (!ANTHROPIC_API_KEY) {
      // Fallback for development without API key
      return new Response(
        JSON.stringify({ message: "Brewly's warming up! ☕", detail: null, mood: 'thinking' }),
        { headers: { 'Content-Type': 'application/json' } }
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
    const parsed = JSON.parse(text);

    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ message: "Brewly spilled! Try again ☕", mood: 'concerned' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

- [ ] **Step 3: Commit**

```bash
git add src/services/ai.ts supabase/functions/ai-assist/index.ts
git commit -m "feat: add AI service + Brewly edge function scaffold"
```

---

## Task 4: Brewly Mascot Component

**Files:**
- Create: `src/components/ui/Brewly.tsx`

- [ ] **Step 1: Create Brewly.tsx animated mascot component**

Create `src/components/ui/Brewly.tsx`. The component renders an animated coffee cup emoji with a speech bubble. Uses Reanimated for idle bobble + entrance spring animation. Supports moods (happy, thinking, excited, concerned). Always paired with haptic feedback on appearance.

Key features:
- Animated entrance (spring slide-in from left)
- Subtle idle bobble (looping translateY)
- Speech bubble with message text
- Tap to expand detail (if provided)
- Dismissible
- Uses theme colors from `useTheme()`
- Calls `hapticLight()` on appearance

Props: `message: string`, `detail?: string`, `mood?: 'happy' | 'thinking' | 'excited' | 'concerned'`, `onDismiss?: () => void`, `visible?: boolean`

Size: ~150 lines. Uses Reanimated `useSharedValue`, `withSpring`, `withRepeat`, `withSequence`, `useAnimatedStyle`.

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/Brewly.tsx
git commit -m "feat: add Brewly mascot component with animations"
```

---

## Task 5: Equipment Catalog Hook

**Files:**
- Create: `src/hooks/useEquipmentCatalog.ts`

- [ ] **Step 1: Create useEquipmentCatalog hook**

Create `src/hooks/useEquipmentCatalog.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import type { DbEquipmentCatalog } from '../types/database';

export function useEquipmentCatalog(type?: DbEquipmentCatalog['type']) {
  const [items, setItems] = useState<DbEquipmentCatalog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, [type]);

  async function fetchItems() {
    setLoading(true);
    let query = supabase
      .from('equipment_catalog')
      .select('*')
      .order('popularity_rank', { ascending: true });

    if (type) {
      query = query.eq('type', type);
    }

    const { data } = await query;
    setItems(data ?? []);
    setLoading(false);
  }

  const search = useCallback(async (term: string) => {
    let query = supabase
      .from('equipment_catalog')
      .select('*')
      .or(`brand.ilike.%${term}%,model.ilike.%${term}%`)
      .order('popularity_rank', { ascending: true })
      .limit(20);

    if (type) {
      query = query.eq('type', type);
    }

    const { data } = await query;
    return data ?? [];
  }, [type]);

  return { items, loading, search, refetch: fetchItems };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useEquipmentCatalog.ts
git commit -m "feat: add useEquipmentCatalog hook with search"
```

---

## Task 6: Onboarding Flow

**Files:**
- Create: `src/hooks/useOnboarding.ts`
- Create: `app/onboarding.tsx`
- Modify: `app/_layout.tsx` (add onboarding gate)
- Modify: `src/hooks/useAuth.tsx` (add preferred_method to updateProfile)

- [ ] **Step 1: Create useOnboarding hook**

Create `src/hooks/useOnboarding.ts` — manages 3-step state: profile (name, avatar), method preference, equipment selection. Tracks completion via AsyncStorage flag + checks if user has set preferred_method.

- [ ] **Step 2: Create app/onboarding.tsx**

3-step onboarding:
1. **Welcome** — name, avatar upload (reuse pickImage from device.ts)
2. **Brew method** — grid of method cards (espresso, pour over, immersion, etc.)
3. **Equipment** — pick grinder + machine/brewer from catalog (useEquipmentCatalog), creates entries in user's machines/grinders tables

Uses: LinearGradient for accent buttons, Reanimated for step transitions, theme tokens. ~300 lines.

- [ ] **Step 3: Update _layout.tsx with onboarding gate**

Modify `app/_layout.tsx` InnerLayout to check if onboarding is complete before showing main app:

```typescript
// After session check, before Slot:
if (session && !onboardingComplete) return <OnboardingScreen />;
```

- [ ] **Step 4: Add preferred_method to auth updateProfile**

In `src/hooks/useAuth.tsx`, add `preferred_method` to the updateProfile `Partial<Pick<...>>` type.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useOnboarding.ts app/onboarding.tsx app/_layout.tsx src/hooks/useAuth.tsx
git commit -m "feat: add 3-step onboarding with equipment catalog selection"
```

---

## Verification Checklist

- [ ] Sign up → land on onboarding (not home)
- [ ] Complete onboarding → equipment saved to machines/grinders tables
- [ ] Log a brew offline → kill app → reopen with network → brew synced to Supabase
- [ ] equipment_catalog table has ~150 items queryable by type
- [ ] Brewly component renders with animation and haptic on mount
- [ ] ai.ts → edge function responds with structured JSON (or fallback in dev)
