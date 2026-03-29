# Creative Tracker — Setup Guide

A Motion/Superads-style creative performance tracker for Meta Ads, built with Next.js + Supabase + n8n.

## Architecture

```
Meta Ads API → n8n Cloud (daily) → Webhook → Next.js (Vercel) ↔ Supabase
```

Your Meta credentials never touch the web app — n8n handles all API calls.

---

## Step 1 — Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and paste the contents of `supabase-schema.sql` → Run
3. Go to **Settings → API** and copy:
   - Project URL
   - `anon` public key

---

## Step 2 — Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
WEBHOOK_SECRET=make-up-a-random-string-here   # e.g. ct_wh_abc123xyz
```

---

## Step 3 — Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

Add your env vars in **Vercel → Project → Settings → Environment Variables**.

Your app URL will be something like `https://creative-tracker-xyz.vercel.app`

---

## Step 4 — n8n Workflow

1. In n8n Cloud, go to **Workflows → Import** and upload `n8n-workflow.json`
2. Open the workflow and replace these placeholders:

| Placeholder | Replace with |
|---|---|
| `YOUR_AD_ACCOUNT_ID` | Your Meta ad account ID (from Ads Manager URL: `act_XXXXXXX`) |
| `YOUR_META_ACCESS_TOKEN` | Long-lived Meta access token (see below) |
| `YOUR_VERCEL_APP.vercel.app` | Your actual Vercel URL |
| `YOUR_WEBHOOK_SECRET` | The same value as `WEBHOOK_SECRET` in your `.env.local` |

3. Activate the workflow — it runs daily at midnight

### Getting a Meta Access Token

1. Go to [developers.facebook.com/tools/explorer](https://developers.facebook.com/tools/explorer)
2. Select your app → Generate token
3. Add permissions: `ads_read`, `read_insights`
4. Convert to a long-lived token (valid 60 days) using the Token Debugger

---

## Step 5 — Use the App

### Workflow
1. **Plan** → Click "New Brief" → fill in concept ID, angle, format, hook, markets
2. **Launch** → Once the ad is live in Meta, click "Link Meta Ad" on the brief card → paste the Ad ID
3. **Track** → n8n syncs data nightly → performance appears on cards automatically

### Reading the cards
- **ROAS target is 2.5x** — cards above target show in green (winner badge)
- Click **Breakdown** on any card to see ABO vs CBO performance and per-market split
- ⚠️ flag = that market's ROAS is 30%+ above/below the blended average
- Filter by market, date range (3/7/14/30d), or angle at the top

---

## Local Development

```bash
npm install
cp .env.local.example .env.local   # fill in values
npm run dev                         # opens on localhost:3000
```

---

## File Structure

```
src/
  app/
    api/
      webhook/route.ts    ← n8n posts here
      briefs/route.ts     ← CRUD for creative briefs
      creatives/route.ts  ← link brief to Meta ad
      dashboard/route.ts  ← aggregated data for frontend
    dashboard/page.tsx    ← main UI
  components/dashboard/
    CreativeCard.tsx      ← the main card (blended + expand)
    FilterBar.tsx         ← date/market/angle/groupBy filters
    StatsBar.tsx          ← summary numbers at top
    AddBriefModal.tsx     ← new creative brief form
    LinkAdModal.tsx       ← connect brief to live ad
  lib/
    supabase.ts           ← client + types
    aggregate.ts          ← blending + outlier logic
```
