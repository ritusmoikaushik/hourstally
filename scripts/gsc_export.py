"""Pull Search Console numbers for hourstally.com and print the 28-day read.

Rule 10 in docs/GOOGLE-RULES.md: measure every 28 days, in a tracked file.
This is the pull; the numbers still get written into docs/MEASUREMENTS.md
by hand, the same day, with the Google updates in the window.

Auth: the service account gstextract already uses for the same job,
gstextract-gsc-export@gstextract.iam.gserviceaccount.com, added as a
Restricted user on the hourstally.com property on 2026-09-21. Its key lives
in the gstextract repo (gitignored there) and is read from there, so nothing
secret is copied into this repo. Set GSC_KEY_PATH to point elsewhere.

The property is a Domain property, so the site URL is sc-domain:hourstally.com.

Usage:
    python scripts/gsc_export.py                 # last 28 days, by page and by query
    python scripts/gsc_export.py --days 90
    python scripts/gsc_export.py --dims date     # one row a day, for a trend

Output: docs/gsc/<end date>_<dims>.csv — small, committed, so every pull is
on the record. Prints totals, per-page rows and the top queries.
"""
import argparse
import csv
import os
from datetime import date, timedelta

from google.oauth2 import service_account
from googleapiclient.discovery import build

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY_PATH = os.environ.get(
    "GSC_KEY_PATH",
    os.path.join(os.path.dirname(ROOT), "gstextract", "gstextract-gsc-key.json"))
SITE_URL = os.environ.get("GSC_SITE_URL", "sc-domain:hourstally.com")
OUT_DIR = os.path.join(ROOT, "docs", "gsc")
SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]


def pull(svc, start, end, dims):
    rows, start_row, limit = [], 0, 25000
    while True:
        resp = svc.searchanalytics().query(siteUrl=SITE_URL, body={
            "startDate": str(start), "endDate": str(end),
            "dimensions": dims, "rowLimit": limit, "startRow": start_row,
            "dataState": "all",
        }).execute()
        batch = resp.get("rows", [])
        rows.extend(batch)
        if len(batch) < limit:
            return rows
        start_row += limit


def write(end, dims, rows):
    os.makedirs(OUT_DIR, exist_ok=True)
    name = f"{end}_{'-'.join(dims)}.csv"
    with open(os.path.join(OUT_DIR, name), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(dims + ["clicks", "impressions", "ctr", "position"])
        for r in rows:
            w.writerow(list(r.get("keys", [])) + [
                r.get("clicks", 0), r.get("impressions", 0),
                round(r.get("ctr", 0) * 100, 2), round(r.get("position", 0), 1),
            ])
    return name


def show(title, rows, limit=None):
    print(f"\n{title}")
    if not rows:
        print("  (no rows)")
        return
    width = max(len(r["keys"][0]) for r in rows[:limit])
    print(f"  {'':<{width}}  clicks  impr   ctr    pos")
    for r in rows[:limit]:
        print(f"  {r['keys'][0]:<{width}}  {r.get('clicks', 0):>6}  {r.get('impressions', 0):>4}  "
              f"{r.get('ctr', 0) * 100:>4.1f}%  {r.get('position', 0):>5.1f}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=28)
    ap.add_argument("--dims", default=None, help="one dimension list; default pulls page and query")
    args = ap.parse_args()

    if not os.path.exists(KEY_PATH):
        raise SystemExit(f"Service-account key not found: {KEY_PATH}")

    # Search Console lags two to three days; end the window two days back.
    end = date.today() - timedelta(days=2)
    start = end - timedelta(days=args.days - 1)

    creds = service_account.Credentials.from_service_account_file(KEY_PATH, scopes=SCOPES)
    svc = build("searchconsole", "v1", credentials=creds, cache_discovery=False)

    print(f"{SITE_URL}  {start} -> {end}  ({args.days} days)")

    if args.dims:
        dims = [d.strip() for d in args.dims.split(",") if d.strip()]
        rows = pull(svc, start, end, dims)
        show(", ".join(dims), rows, 40)
        print(f"\nWrote docs/gsc/{write(end, dims, rows)}")
        return

    pages = pull(svc, start, end, ["page"])
    queries = pull(svc, start, end, ["query"])
    clicks = sum(r.get("clicks", 0) for r in pages)
    impr = sum(r.get("impressions", 0) for r in pages)
    pos = (sum(r.get("position", 0) * r.get("impressions", 0) for r in pages) / impr) if impr else 0
    print(f"\nTotal  clicks {clicks}  impressions {impr}  avg position {pos:.1f}  queries {len(queries)}")
    show("By page", pages)
    show("Top queries", queries, 25)
    print(f"\nWrote docs/gsc/{write(end, ['page'], pages)}")
    print(f"Wrote docs/gsc/{write(end, ['query'], queries)}")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        msg = str(e)
        print("\nFailed:", msg)
        if "403" in msg or "permission" in msg.lower():
            print("403 = the service account is not a user on the hourstally.com "
                  "property yet, or GSC_SITE_URL does not match the property type.")
        raise SystemExit(1)
