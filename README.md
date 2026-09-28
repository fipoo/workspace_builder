# Workspace Builder · monis.rent

A drag-and-drop builder for nomads in Bali. You design a workspace, watch the room change as you build it, and rent the whole setup in about two minutes.

**Live:** _add the Vercel URL here after deploying_

## What it does

- **Build a room.** Drag a desk, a chair and gear from the catalog into the room, or tap an item to send it straight to its spot. The catalog has 7 categories with 10 items each.
- **Rules that feel like a game:**
  - The desk and chair are single slots, so dropping a new one swaps it in with a fly-out and pop-in animation.
  - The desk top holds up to 8 accessories, and at most 3 of them can be monitors.
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

## Approach

1. **The rules are pure functions.** `lib/rules.ts` (`canPlace`, `applyAdd`, `applyRemove`) decides every placement. Drag-and-drop, tap-to-add and the quick-add buttons all go through the same `usePlace()` hook, so they can never disagree. The rules and pricing are unit tested.
2. **Placement uses slots, not free coordinates.** Each drop zone is a `Slot` from the data model. A custom dnd-kit collision strategy picks the zone under the pointer that matches the dragged item's slot. That lets the desk-top zone sit inside the desk zone without conflicts. With the keyboard, you move between the matching zones only.
3. **The UI is optimistic.** The store updates synchronously on drop, and Framer Motion animates the change afterwards. The canvas re-renders in the same frame.
4. **Hydration is safe.** The persisted store uses `skipHydration` and rehydrates after mount, and `DndContext` has a stable `id`, so server and client HTML match.

## Tech choices

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
data/catalog.ts           70 items across 7 categories
lib/rules.ts              placement rules (tested)
lib/pricing.ts            durations, totals, IDR formatting (tested)
```

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit tests
npm run build      # production build
```

## Would improve

- Real monis.rent product images and an inventory API with live stock.
- Free 2D/3D placement: drag items anywhere on the desk and rotate them, maybe with a three.js room.
- A shareable setup link, with the setup encoded in the URL.
- Preset templates such as a "Dev Nomad Kit", "Content Creator" or "Minimalist" setup.
- WhatsApp checkout, sending the order summary to a monis.rent agent.
- Undo/redo, plus an "are you sure?" step when swapping out a desk that has accessories on it.
- Visual regression tests with Playwright on desktop and mobile.
