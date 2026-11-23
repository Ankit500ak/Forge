# FORGE — Solo Leveling "System" Production Plan

Goal: Forge ko ek proper production-ready app banana, jiska POORA UI Solo Leveling ke
System jaisa behave kare — holographic blue System windows, quests, stats, ranks,
level-ups — sirf ek page nahi, pure app ka behaviour.

Verification rule (Ankit): har UI phase GPT + Gemini hard-checker loop se pass hoga,
dono ke scores >9 hone ke baad hi phase close hoga. (Gemini sign-in abhi blocked hai —
Ankit ka phone-verification step pending; tab tak GPT loop chalega, Gemini step uske
sign-in ke baad.)

---

## Phase 0 — Audit & Stabilise (pehle ye)
- fitness-app-frontend ka full audit: routes, dead pages, console errors, broken imports
- `npm run build` clean (zero errors; warnings ki list alag se)
- Env/config saaf: .env.example banana, secrets code se bahar
- Root clutter (file.js, duplicate src/) ko haath nahi lagana is phase me — pehle app stable

## Phase 1 — System Core (CHAL RAHA HAI)
- System theme components: holographic panel, angular borders, glow, System typography
- Player Status Window: Level, XP bar, Hunter Rank (E→S), STR/AGI/VIT/END/PER, stat points allocation
- Daily Quest: "TRAIN TO BECOME THE STRONGEST" — push-ups/sit-ups/squats/run, level-scaled targets
- Rewards + Level Up notification + "Welcome, Player" first-run notification
- localStorage persistence, /system page + dashboard entry
- Build verify

## Phase 2 — Poora App System-ified
- Dashboard = Player Status style (widgets System panels me)
- Workouts = "Quests" (quest accept → complete → XP reward flow)
- Food logging = "Item/Inventory" style entries, calories = HP/energy se mapping
- Goals = "Main Quest" + side quests
- Har success/failure pe System notification style (toasts/modals)
- Navigation, buttons, forms — sab pe System theme tokens (ek design system file)

## Phase 3 — Game Loop Depth
- Weekly quests, streak system ("consecutive login" rewards)
- Penalty zone flavour: missed daily quest → next day warning + recovery quest
- Achievements/titles ("Shadow Monarch" style original titles — copyrighted art nahi, sirf text)
- Rank-up ceremony screen (rank badhne pe full-screen System event)
- Progress history: XP graph, quest completion calendar

## Phase 4 — Production Hardening
- Auth + data: Supabase flow end-to-end test (signup → login → data save → logout)
- Offline/local-first behaviour, error states, empty states, loading skeletons
- Performance: bundle size check, image optimisation, Lighthouse pass (mobile >85 target)
- Capacitor Android build verify (APK build guide repo me pehle se hai)
- Accessibility basics: contrast, tap targets, font scaling

## Phase 5 — Release
- Production env (Render config repo me hai — verify + update)
- README update: features, screenshots, run instructions
- Version tag + release notes
- Final GPT + Gemini full-app review (>9 dono) → tabhi "production ready" ghoshit hoga

---

## Har phase ka closure rule
1. Build clean
2. Screenshots (mobile + desktop) GPT review → >9
3. Gemini review → >9 (sign-in available hone par)
4. Commit (Conventional Commits) → PR → Ankit ke verify ke baad merge
