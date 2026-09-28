"""Pull Cloudflare Web Analytics for hourstally.com and print the read.

The visits half of Rule 10 in docs/GOOGLE-RULES.md; gsc_export.py is the
search half. The numbers still get written into docs/MEASUREMENTS.md by hand.

Auth: an API token with Account > Account Analytics > Read and nothing else,
in .cf-token at the repo root (gitignored). The account ID and site tag are
identifiers, not secrets.

Cloudflare samples this data. Each row says 1/N: a count of 10 at 1/10 is one
recorded page load. At this traffic, read the counts as rough.

Usage:
    python scripts/cf_export.py              # last 28 days
    python scripts/cf_export.py --days 90
"""
import argparse
import json
import os
import urllib.request
from datetime import date, timedelta

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ACCOUNT = "a9ed5fac4709be4b2c32912a58c18167"
SITE_TAG = "b85f479e90e440a7bd108a2ea3fd7314"
GROUPS = {"day": "date", "page": "requestPath", "country": "countryName",
          "referrer": "refererHost", "device": "deviceType", "browser": "userAgentBrowser"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=28)
    args = ap.parse_args()

    with open(os.path.join(ROOT, ".cf-token"), encoding="utf-8") as f:
        token = f.read().strip()
    end = date.today()
    start = end - timedelta(days=args.days)
    filt = (f'{{siteTag:"{SITE_TAG}",datetime_geq:"{start}T00:00:00Z",'
            f'datetime_lt:"{end + timedelta(days=1)}T00:00:00Z"}}')
    parts = "".join(
        f"{k}:rumPageloadEventsAdaptiveGroups(limit:100,filter:{filt},orderBy:[count_DESC])"
        f"{{count sum{{visits}} avg{{sampleInterval}} dimensions{{{v}}}}}"
        for k, v in GROUPS.items())
    query = f'{{viewer{{accounts(filter:{{accountTag:"{ACCOUNT}"}}){{{parts}}}}}}}'

    req = urllib.request.Request(
        "https://api.cloudflare.com/client/v4/graphql",
        json.dumps({"query": query}).encode(),
        {"Authorization": "Bearer " + token, "Content-Type": "application/json"})
    data = json.load(urllib.request.urlopen(req))
    if data.get("errors"):
        raise SystemExit(data["errors"])
    acct = data["data"]["viewer"]["accounts"][0]

    days = acct["day"]
    print(f"hourstally.com  {start} -> {end}  ({args.days} days)\n")
    print(f"Total  page views {sum(r['count'] for r in days)}  "
          f"visits {sum(r['sum']['visits'] for r in days)}  (estimates, sampled)")
    for key, dim in GROUPS.items():
        rows = acct[key]
        if key == "day":
            rows = sorted(rows, key=lambda r: r["dimensions"]["date"])
        print(f"\nBy {key}")
        for r in rows:
            label = r["dimensions"][dim] or "(none)"
            print(f"  {label:36} views {r['count']:5}  visits {r['sum']['visits']:5}"
                  f"  1/{r['avg']['sampleInterval']:.0f}")


if __name__ == "__main__":
    main()
