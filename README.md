# hourstally

Free time card and timesheet calculator. Static site, no build step.

    site/            the site itself
      index.html     main time card calculator
      assets/        css + js

Run `python scripts/serve.py` and open http://localhost:8000 — it serves clean URLs the way Cloudflare Pages will. Opening the .html files directly no longer works because links are root-relative.

    docs/GOOGLE-RULES.md   read first — why two sister sites were removed from Google, and the rules that follow
    docs/PLAN.md           what gets built, in what order, and what makes each page its own tool
    docs/SCHEDULE.md       the dated calendar - one page every two weeks, measurements every 28 days
    docs/MEASUREMENTS.md   publish log and 28-day Search Console / GA4 pulls
    PROJECT.md             why this niche — the scorecard and the evidence

Tests: `node test/engine.test.js && node test/decimal.test.js && node test/xlsx.test.js`

Deploy target: Cloudflare Pages, root `site/`.
