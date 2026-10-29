# hourstally

Free time card and timesheet calculator. Static site, no build step.

    site/            the site itself
      index.html     main time card calculator; one .html per tool beside it
      blog/          index.html (noindex list) and one .html per article; pictures in blog/img/
      assets/        css + js

Every page has the same two-row header: the wordmark with How it counts and Blog, then a navy
`.toolbar` with the six tools (an icon each). It is copied into each .html file; change all of
them together.

Run `python scripts/serve.py` and open http://localhost:8000 — it serves clean URLs the way Cloudflare does. Opening the .html files directly no longer works because links are root-relative.

    docs/GOOGLE-RULES.md   read first — why two sister sites were removed from Google, and the rules that follow
    docs/PLAN.md           what gets built, in what order, and what makes each page its own tool
    docs/SCHEDULE.md       the dated calendar - one page every two weeks, measurements every 28 days
    docs/MEASUREMENTS.md   publish log and 28-day Search Console / GA4 pulls
    PROJECT.md             why this niche — the scorecard and the evidence

Tests: `for t in test/*.test.js; do node "$t"; done` (nine files; each prints ok or FAIL per check)

Deploy: a Cloudflare Worker serving the static files in `site/`, built by Workers Builds (`npx wrangler deploy`) on every push to `main`. Its settings are in `wrangler.jsonc`, including the 404 page. `npx wrangler dev` runs it locally exactly as Cloudflare does.
