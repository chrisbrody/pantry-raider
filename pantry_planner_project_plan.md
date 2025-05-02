
# 🛠️ Project: Household Pantry + Meal Planner + Shopping List

## 🔷 1. Project Goal
A local-first web app that:
- Tracks pantry inventory
- Stores your favorite recipes
- Lets you plan weekly meals
- Generates a shopping list of missing ingredients
- Syncs between local and cloud (Supabase)

---

## 🚦 Phase 1: Initial Setup (Do this first — no app logic yet)

### ✅ Dev Environment Setup
- [ ] Set up project folder & basic structure.
- [ ] Use **TypeScript + Node.js** (can be full-stack or backend-only at this stage).
- [ ] Add **GitHub repo** and push initial scaffold.
- [ ] Connect repo to **Vercel** for auto-deploys (even if it’s just "Hello World").
- [ ] Choose a framework (optional): Next.js recommended if doing full stack.

### ✅ Supabase Setup (local + production)
- [ ] Install and configure **local Supabase** (for development):
  - Install Supabase CLI
  - Create a local project
  - Use `.env` for local DB credentials
- [ ] Create a **production Supabase project** at [supabase.com](https://supabase.com)
- [ ] Add Supabase keys to your Vercel environment variables

---

## 🔧 Phase 2: MVP Core Features

### 🎯 Define Minimum Viable Product (MVP)

#### ✅ Recipe Manager
- [ ] **Create recipes** manually
  - Each recipe includes:
    - `name`
    - `ingredients`: array of `{ quantity, unit, item }`
    - (Optional) `instructions`
- [ ] **Store recipes** in:
  - ✅ MVP: JSON files or local Supabase table
  - Later: Cloud Supabase sync

> 💡 **Data Pitfall Warning**: Normalize units (`"cup"` vs `"cups"`), item names (`"tomato"` vs `"tomatoes"`), and allow for weird cases (e.g., "1 clove garlic").

#### ✅ Pantry Tracker
- [ ] Track current inventory: `{ item, quantity, unit }`
- [ ] Simple interface to:
  - Add/remove items
  - Edit quantities

> 🧠 **Don't forget**:
> - What happens when a recipe uses part of an item? Will you deduct from pantry?
> - Are expired items a concern (later feature)?

#### ✅ Weekly Meal Planner
- [ ] Assign recipes to:
  - Breakfast, Lunch, Dinner for each day of the week
- [ ] Store plan in JSON or Supabase

> ⚠️ Be careful with:
> - Repeating recipes on multiple days
> - Meal slots left blank
> - Plan edits mid-week — should not affect pantry history unless confirmed

#### ✅ Shopping List Generator
- [ ] Read the weekly plan
- [ ] Retrieve ingredients for all recipes
- [ ] Deduct from pantry to calculate missing items
- [ ] Group similar items and combine quantities

> 🧠 **Challenge**: Ingredient merging.
> - "1 cup chopped onion" + "1 onion" — are those the same?
> - Handle unit conversion if possible (or defer).

---

## 🎨 Phase 3: Interface (Local or Web)

- [ ] Start with **CLI or minimal HTML UI**
- [ ] Display:
  - Recipes list
  - Pantry contents
  - Weekly plan view
  - Shopping list output

> 💡 For future-proofing, structure the UI into components even if it's minimal.

---

## 🚀 Phase 4: Deployment and Sync

- [ ] GitHub repo auto-deploys to **Vercel**
- [ ] Switch storage from local JSON to **Supabase tables**
- [ ] Use `.env` and Vercel secrets to switch between local and production Supabase

> 🧠 Add a flag or environment check to separate dev/prod logic cleanly.

---

## 🧪 Phase 5: Testing

- [ ] Test with:
  - Empty pantry
  - Multiple units of same item
  - Duplicate recipe names
  - Invalid inputs
- [ ] Add basic logging for errors

---

## 🔭 Phase 6: Post-MVP Enhancements (Don't do these until MVP is stable)

- 🧠 Recipe Import via Web Scraping
- 📏 Unit conversion (oz ⇄ g ⇄ cups)
- 🚫 Dietary filtering (e.g., gluten-free)
- 📊 Nutrition data
- 🗣️ Voice assistant support
- 🧠 AI suggestions based on pantry contents
- 📦 Online grocery integration
- 📸 Image-to-inventory (computer vision)

---

## 📁 Suggested Folder Structure

```
pantry-planner/
├── public/              # Static files
├── src/
│   ├── components/      # UI (if web)
│   ├── data/            # JSON or local DB
│   ├── db/              # Supabase functions
│   ├── lib/             # Core logic: parsing, list gen, etc.
│   └── pages/           # Web routes (if using Next.js)
├── .env.local
├── supabase/            # Supabase config/schema
├── README.md
└── package.json
```

---

## 🧠 Final Considerations

- Stay MVP-focused. Don’t build “just in case” features.
- Plan for mess: units, typos, missing data, vague quantities.
- Keep pantry and shopping logic separate from UI logic.
- Consider backup/export of pantry & recipe data even in early versions.
