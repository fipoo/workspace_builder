# Workspace Builder · monis.rent

A drag-and-drop builder for nomads in Bali. You design a workspace, watch the room change as you build it, and rent the whole setup in about two minutes.

**Live:** https://workspace-builder.iqbaldwir.my.id/

## Write-up

**Approach.** I built the workspace as a small game with clear rules, not a free-form canvas. Every placement decision lives in pure, unit-tested functions in `lib/rules/`: what goes where, swapping a desk or chair, the 3-monitor limit, and whether an item physically fits on the desk. Drag-and-drop, tap-to-add and the quick-add buttons all call the same `usePlace()` hook, so they always agree, and the room preview simply renders what the store holds. Phones get their own flow (a bottom-sheet catalog with tap-to-add first) instead of a squeezed desktop layout.

**Tech choices.** Next.js 15 (App Router) with TypeScript, because both pages prerender as static HTML and deploy to Vercel with no config. dnd-kit handles drag-and-drop with mouse, touch and keyboard, plus screen-reader announcements. Zustand with `persist` keeps the setup in one small store and saves it to `localStorage`. Tailwind CSS v4 does the styling, Framer Motion the swap and pop-in animations, and Vitest tests the rules and pricing.

**With more time.** I'd connect a real inventory API with live stock, and use real product photos for every item (some still use Unsplash). I'd add a shareable setup link, preset kits such as "Dev Nomad" or "Content Creator", and undo/redo. I'd also replace the mock checkout with a real one (payment, or a WhatsApp handoff to a monis.rent agent) and add Playwright visual tests on desktop and mobile.

## What it does

- **Build a room.** Drag a desk, a chair and gear from the catalog into the room, or tap an item to send it straight to its spot. The catalog has 101 items across 10 categories.
- **Rules that feel like a game:**
  - The desk and chair are single slots, so dropping a new one swaps it in with a fly-out and pop-in animation.
  - The desk top holds as many accessories as physically fit, since every item has real dimensions in cm. At most 3 of them can be monitors.
  - The Coffee, Outdoor, Relax and Garage zones hold up to 4 items each.
  - Accessories stay locked until there is a desk. The builder shows "Pick a desk first."
- **Live feedback.**
  - While you drag, valid zones light up and show "Drop here".
  - Dropping on the wrong zone shakes it and shows a red "Not here".
  - The cart total, the item count and a "Setup level" meter update on every change.
- **Removing items.** Click ✕ on an item, or drag it off its spot and release when the "Release to remove" hint appears. Removing the desk also clears the items on it.
- **Saved setup.** Your setup is stored in `localStorage` and restored when you reload.
- **Checkout.** It shows:
  - a mini preview of the room
  - items grouped by category
  - duration: 1 week, 1 month, or 3 months with 15% off
  - a start date
  - a live total
  "Rent Now" opens a mock form (name, email, Bali address), then a success screen with an order ID. No real payment is taken.
- **Responsive.**
  - Desktop has three columns: catalog, room, and quick add.
  - Tablet has two columns.
  - On phones the catalog becomes a bottom sheet with peek, half and full heights, and tap-to-add is the main way to add items. A long-press starts a drag.

## How it works

1. **The rules are pure functions.** `lib/rules/` (`canPlace`, `applyAdd`, `applyRemove`) decides every placement. Drag-and-drop, tap-to-add and the quick-add buttons all go through the same `usePlace()` hook, so they can never disagree. The rules and pricing are unit tested.
2. **Placement uses slots, not free coordinates.** Each drop zone is a `Slot` from the data model. A custom dnd-kit collision strategy picks the zone under the pointer that matches the dragged item's slot. That lets the desk-top zone sit inside the desk zone without conflicts. With the keyboard, you move between the matching zones only.
3. **The UI is optimistic.** The store updates synchronously on drop, and Framer Motion animates the change afterwards. The canvas re-renders in the same frame.
4. **Hydration is safe.** The persisted store uses `skipHydration` and rehydrates after mount, and `DndContext` has a stable `id`, so server and client HTML match.

## Stack

| Area | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) + TypeScript | Static pages on Vercel with zero config |
| Styling | Tailwind CSS v4 (`@theme` tokens) | Design tokens live in `app/globals.css` |
| Drag and drop | `@dnd-kit/core` | Mouse, touch (long-press) and keyboard sensors, plus screen-reader announcements |
| State | Zustand + `persist` | A small store, selectors for totals, and localStorage in one line |
| Motion | Framer Motion | Spring pop-ins, swap fly-outs, zone shake, and a sliding tab pill |
| Icons | `lucide-react`, with emoji fallback | `ItemIcon` falls back to the item's emoji when an icon name is unknown |
| Tests | Vitest | Rules (replace, limits, desk lock) and pricing |

### Keyboard

- **Tab** moves to a catalog tile.
- **Enter** adds the item.
- **Space** picks it up. The arrow keys then move between valid zones, and **Space** or **Enter** drops it. **Esc** cancels.

## Project structure

```
app/page.tsx              builder (DndContext, layout, drag handlers)
app/checkout/page.tsx     summary, then details form, then success
components/               Catalog, Canvas, DropZone, DraggableItem, PlacedItem, ZoneRow,
                          QuickAdd, CartBar, Header, MiniPreview, Toast, usePlace
store/useSetup.ts         persisted setup store + selectors
store/useUI.ts            toasts and zone pulses (not persisted)
data/catalog.ts           101 items across 10 categories
data/dims.ts              real item sizes in cm, used for desk-top fit
lib/rules/                placement rules (tested)
lib/pricing.ts            durations, totals, IDR formatting (tested)
```

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit tests
npm run build      # production build
```
