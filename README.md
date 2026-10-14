# Jabali Admin Dashboard

React 19 + Vite + Tailwind v4 + shadcn/ui, with Redux Toolkit and RTK Query talking to the `jabali-be` API.

## Run

    npm install
    cp .env.example .env     # API base URL, defaults to http://localhost:5000/api/v1
    npm run dev              # http://localhost:5174

The backend (../jabali-be, port 5000) must be running. Sign in with a staff account from the backend seed.

## Structure

- `src/api/`: RTK Query. `baseApi.ts` holds the base query (bearer token, one-shot refresh on 401) and tag types. Each domain file (auth, catalogue, promotions, orders, content, operations) injects its endpoints and exports the generated hooks: `useXQuery`, `useXMutation` and, for on-demand calls, `useLazyXQuery`.
- Lazy queries are used where data is fetched on a user action: order CSV export, stock history, promotion redemptions, content block version history and preview, and the media picker in the product editor.
- `src/store/`: Redux store and the auth slice (tokens persisted to localStorage).
- `src/components/ui/`: shadcn components. `src/components/layout/AppLayout.tsx` is the sidebar, header, theme toggle and account menu.
- `src/pages/`: one file per screen. Navigation items and actions are hidden when the signed-in role lacks the permission (the API still enforces it).

## Not built yet

Category and colour management screens, password change, partial refunds, drag-to-reorder for images and testimonials. The API supports most of these.
