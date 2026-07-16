# LinkedIn post — Rental Tracker (weekend vibe-coded launch)

**Live app:** https://ikman-iota.vercel.app  
**Images to attach (in this order):**
1. `public/marketing/web.png` — desktop landing  
2. `public/marketing/mobile.jpeg` — mobile landing  

---

## Main post (recommended)

Copy-paste ready:

---

Built something over a weekend for a problem I was living with.

If you’ve ever looked for a place on ikman.lk, you know the game:  
refresh… refresh… miss the good annex by 20 minutes… someone else already called.

I got tired of that, so I vibe-coded a small product for myself:

**Rental Tracker** — multi-user alerts for ikman.lk rentals.

What it does:
• You set areas, budget, bedrooms & property type  
• It checks ikman every **10 minutes**  
• Matching listings hit your **Telegram** (and a private dashboard)  
• Free to start — no card required  

Stack for the curious: Next.js, Clerk, Supabase, Playwright scraper, Telegram bot. Shipped on Vercel; scrape job on a schedule so I’m not babysitting tabs at midnight.

I built it to solve **my** house-hunt stress. Then I cleaned it up enough that friends (and strangers) can use it too.

If you’re hunting rentals / boarding in Sri Lanka and you’re done with the refresh loop — try it and tell me what breaks:

https://ikman-iota.vercel.app

Happy to hear feedback, edge cases, and “this area never works” reports. That’s how weekend projects get better.

#buildinpublic #weekendproject #vibecoding #NextJS #SriLanka #startups #product

---

## Shorter version (if you prefer punchy)

---

Weekend project, shipped.

Problem: refreshing ikman.lk until 1am and still losing places to people who messaged first.

Solution: **Rental Tracker**  
→ your criteria  
→ scrape every 10 min  
→ Telegram when something matches  

Built for me. Opened it up for anyone else house-hunting in SL.

https://ikman-iota.vercel.app  

Desktop + mobile screenshots below.

#buildinpublic #vibecoding #NextJS

---

## Comment to pin under the post (optional)

---

How it works in 30 seconds:
1. Sign up free  
2. Pick areas + budget + type  
3. Connect Telegram  
4. Get matches while others are still refreshing  

Not affiliated with ikman.lk — just a personal tool that watches public listings for you.

---

## Posting tips

1. **Media:** Upload both screenshots as a multi-image post (web first, then mobile). LinkedIn often shows the first image largest — desktop hero works well there.  
2. **Tone:** Keep the “I built this for myself” line — it reads more authentic than pure product marketing.  
3. **Timing:** Weekday morning SL time or Sunday evening often works for tech + local audience.  
4. **Engage:** Reply to every comment in the first hour; ask one question back (“What area are you hunting in?”).  
5. **Don’t oversell:** “Free / no card / weekend project” is your trust signal.  
6. **Optional second post later:** a short thread/comment with stack details if engineers ask.

## Stack blurb (only if someone asks)

Next.js + Clerk auth · Supabase · Playwright (ikman scrape) · Telegram bot · Vercel · multi-user criteria & per-user “new/viewed” state.

---

## Checklist before you hit Post

- [ ] Both images attached  
- [ ] Link opens: https://ikman-iota.vercel.app  
- [ ] Sign-up + Telegram still work in prod  
- [ ] You’re OK with traffic (scraper / rate limits)  
- [ ] No private keys or internal URLs in the post  
