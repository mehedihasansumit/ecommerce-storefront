# UX Attention Plan

Goal: improve storefront UI/UX so customers notice products quickly and want to buy. Mobile first.

Branch: `feat/ux-attention`

## Settled decisions

- **REA** (`morluto/rea`, npm `rea-agents`) is a dev-machine tool only. It is registered as an MCP server in Claude Code (`npx rea-agents setup --client claude_code --yes`). Never add it to `package.json` or Docker. Get it only from official sources (`morluto/rea`, `rea-agents` on npm).
- REA shows *how* a site is built (structure, components, scripts, network). Judging whether a design is attractive is Claude's and the user's job.
- Reference sites (one per store type):
  - **Aarong**: punjabi / ethnic, Bangladeshi customer expectations
  - **Yellow**: shirts / casual fashion, Bangladesh
  - **Allbirds**: shoes, clean conversion-focused product page
- Pages in scope now: **homepage** and **product detail page**. Cart/checkout come in a later round.
- Mobile first, then desktop.
- Take ideas and patterns only. Never copy another site's code, images, logos or copy.
- Every change follows the UI/UX Design Spec in `CLAUDE.md`: extend primitives in `@/shared/components/ui` and don't fork the look. If a spec change is better for the user, update `CLAUDE.md` (use the `writing-for-agents` skill).
- The user approves a prototype before anything goes into real code.
- Don't measure impact now. Note in the reports which changes should be measured later with the `analytics` feature.

## Steps

1. [x] REA setup done and Claude Code restarted; confirm the REA tools load.
2. [x] **Research** (`research` skill + REA): analyze the homepage and product page of each reference site at mobile viewport. Write one report per site:
   - `docs/ux-research/aarong.md`
   - `docs/ux-research/yellow.md`
   - `docs/ux-research/allbirds.md`

   Each report: what we observed → why it grabs attention → how it is built.

   Extra round (user asked for 10 more sites), same method, one report each:
   - Punjabi / ethnic: `fabindia.md`, `manyavar.md`
   - Shirts / BD fashion: `ecstasy.md`, `sailor.md`, `uniqlo.md`, `zara.md`
   - Shoes: `bata-bd.md`, `nike.md`
   - Conversion / BD expectations: `daraz.md`, `gymshark.md`

   Notes: Fabindia and Manyavar served their international (USD) storefronts. Uniqlo blocked the iPhone UA in headless Chrome, so that report uses an Android Chrome UA on `/us/en`.

3. [x] **Own storefront**: run the local dev server (`npm run dev` with DB) and analyze our homepage and `products/[slug]` the same way (e.g. `shoes.localhost:3000`). Write `docs/ux-research/our-storefront.md` with a "they have it, we don't" list.
4. [x] **Priority list**: `docs/ux-research/priorities.md`, with every idea ranked by expected impact vs. effort. The user picks which ones to build.
5. [x] **Prototype** (`prototype` skill): a throwaway version of each picked idea. Wait for the user's approval.
6. [x] **Implement** approved ideas following the `CLAUDE.md` design spec (i18n strings, primitives, tokens, a11y).
7. [x] **Review** (`code-review` skill) against `CLAUDE.md` standards and this plan.
8. [ ] **PR** (`pr` skill).

## Skills used

| Step | Skill |
|---|---|
| Planning | `grilling`, `domain-modeling` |
| Research | `research` + REA |
| Design trials | `prototype` |
| `CLAUDE.md` edits | `writing-for-agents` |
| Review | `code-review` |
| PR | `pr` |

`tdd` only if real logic shows up (e.g. price or discount calculation).
