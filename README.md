# hourstally

Free time card and timesheet calculator. Static site, no build step.

    site/            the site itself
      index.html     main time card calculator
      assets/        css + js

Open `site/index.html` in a browser. That is the whole dev loop.

    docs/GOOGLE-RULES.md   read first — why two sister sites were removed from Google, and the rules that follow
    docs/PLAN.md           what gets built, in what order, and what makes each page its own tool
    docs/MEASUREMENTS.md   publish log and 28-day Search Console / GA4 pulls
    PROJECT.md             why this niche — the scorecard and the evidence

Tests: `node test/engine.test.js`

Deploy target: Cloudflare Pages, root `site/`.
