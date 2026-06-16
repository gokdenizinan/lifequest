# LifeQuest AI Website Prototype

This is a self-contained interactive website for gamifying a life-coaching process.

## What it does

- Phase 1 life assessment with 1–3 questions at a time
- Life phase analysis: Limbo, Vision, Flow, or Resistance
- Game design dashboard with:
  - Main Quest
  - Negative Vision
  - Side Quests
  - Character Stats
  - Rules and Rewards
- Quest log with XP, level, due dates, completion, and streaks
- Phase 2 coaching check-ins with adaptive quest guidance
- Automatic save after each interaction
- Export/import save file as JSON

## Save behavior

Data is saved in the browser using `localStorage` under this key:

```txt
lifequest_ai_save_v1
```

This means the save persists in the same browser/device. For cross-device sync, connect the `state` object in `app.js` to a backend such as Supabase, Firebase, or your own API.

## How to run

Open `index.html` in any modern browser.

For local development with a simple server:

```bash
python3 -m http.server 8080
```

Then open:

```txt
http://localhost:8080
```

## Files

- `index.html` — structure
- `styles.css` — styling
- `app.js` — state, interactions, local save system
