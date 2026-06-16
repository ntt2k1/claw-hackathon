# UI: Web-Friendly Layout — Phone-Frame Wrapper Design Spec

## Problem

App has no max-width constraint — all screens expand to full viewport width on desktop. Specific breakages:
- QuizScreen images (aspect ratio 4/5 / 4/6) become huge
- HomeScreen `text-7xl` hero text oversized
- `fixed` bottom nav and headers span full desktop width
- Blur orbs overflow awkwardly

## Solution

Wrap the entire app in a centered `max-w-[430px] mx-auto` phone-frame container. Convert `fixed` headers → `sticky`, and adjust `fixed` bottom elements to be constrained to the container.

---

## Files

| Action | File | What changes |
|--------|------|---|
| Modify | `frontend/src/App.jsx` | Add outer bg + inner max-w phone frame |
| Modify | `frontend/src/components/BottomNav.jsx` | `fixed bottom-0 left-0 w-full` → `sticky` inside frame |
| Modify | `frontend/src/components/EntryScreen.jsx` | Header `fixed top-0 w-full left-0` → `sticky top-0 w-full` |
| Modify | `frontend/src/components/QuizScreen.jsx` | Header `fixed top-0 w-full` → `sticky top-0 w-full` |

---

## App.jsx Changes

Outer div: dark background fills viewport, frames the phone.  
Inner div: the "phone" — max 430px, centered, all content inside.

```jsx
<div className="min-h-screen bg-zinc-950 flex justify-center">
  <div className="w-full max-w-[430px] min-h-screen bg-background relative flex flex-col overflow-x-hidden">
    {/* all screens render here */}
  </div>
</div>
```

## BottomNav.jsx Changes

Change from `fixed bottom-0 left-0 w-full` to position inside the flow of the phone frame. Since the frame is a flex column, BottomNav can be `sticky bottom-0` or simply rendered at the bottom of the flex column.

```jsx
// Before
<nav className="fixed bottom-0 left-0 w-full bg-surface/90 ...">

// After
<nav className="sticky bottom-0 w-full bg-surface/90 ...">
```

## EntryScreen.jsx Header Changes

```jsx
// Before
<header className="fixed top-0 w-full z-50 ... left-0">

// After
<header className="sticky top-0 w-full z-50 ...">
```

Also remove `left-0` (not needed for sticky).

## QuizScreen.jsx Header Changes

```jsx
// Before
<header className="fixed top-0 w-full z-50 ...">

// After
<header className="sticky top-0 w-full z-50 ...">
```

The `pt-28` on `<main>` (offset for fixed header) becomes `pt-0` since header is now in flow.

## Blur Orbs

HomeScreen uses `fixed` blur orbs (`fixed top-[-100px] right-[-80px]`). Change to `absolute` so they stay inside the phone frame:

```jsx
// Before: fixed top-[-100px] right-[-80px] w-[400px] h-[400px]
// After:  absolute top-[-100px] right-[-80px] w-[400px] h-[400px]
```

The phone frame div already has `overflow-x-hidden` so orbs won't cause horizontal scroll.

## What Does NOT Change

- All component logic, props, state
- Tailwind design tokens (colors, fonts)
- Screen routing in App.jsx
- Image sizes in QuizScreen (they auto-fit within 430px container)
- Backend
