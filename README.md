# Bloomstead

Bloomstead is a mobile-first cozy idle farming MVP built as a browser prototype with Phaser, TypeScript, and Vite.

Current status: MVP playtest candidate.

Live playtest: https://robfernandez066.github.io/bloomstead/

## Commands

Install dependencies:

```bash
npm install
```

Run the local dev server:

```bash
npm.cmd run dev
```

Build the production bundle:

```bash
npm.cmd run build
```

Preview the production build with Vite:

```bash
npx vite preview --host 127.0.0.1 --port 4173
```

For phone testing on the same network, run the dev server with a LAN host:

```bash
npm.cmd run dev -- --host 0.0.0.0
```

## Playtest Checklist

Before sharing the MVP with a small playtest group, run through [docs/MVP_PLAYTEST_CHECKLIST.md](docs/MVP_PLAYTEST_CHECKLIST.md).

## Notes

Generated WebAudio SFX are used for MVP feedback and can be muted in-game with the SFX toggle.

The current Vite large chunk warning is accepted for MVP playtesting.
