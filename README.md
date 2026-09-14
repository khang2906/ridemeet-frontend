# RideMeet

A web app for organizing group meetups for cyclists, motorcyclists, and
runners. Post an event with a sport, date, meeting point, route, and pace —
others RSVP and join the ride.

This is the v2 frontend — a Next.js app that talks to the JSON API in
[ridemeet-backend](https://github.com/khang2906/ridemeet-backend). The
original v1 (server-rendered Jinja2 templates, still in the backend repo)
stays until this one is deployed.

## Status

Functionally complete for v1, including a GPX route feature beyond the
original scope: upload a route, see it drawn on the map, download it again.
Not yet deployed — see the backend repo's `TODO.md`.

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4 + shadcn/ui (built on Base UI, not Radix — copy-pasted
  shadcn snippets from elsewhere need `asChild` → `render={<Element />}`)
- Leaflet + OpenStreetMap for maps, Nominatim for geocoding
- Vitest, 30 tests

## Running locally

```
npm install
copy .env.example .env.local     # then set NEXT_PUBLIC_API_URL
npm run dev
```

Open http://localhost:3000. The backend
([ridemeet-backend](https://github.com/khang2906/ridemeet-backend)) needs to
be running separately — see its own README.

## Tests

```
npm test          # run once
npm run test:watch
```

## Testing on a phone over WiFi

Needs three things set together — see `CLAUDE.md` in the project root for the
full explanation (dev-server origin allowlisting, the LAN IP baked into
`NEXT_PUBLIC_API_URL`, and CORS on the backend).
