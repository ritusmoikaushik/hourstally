"""Pull Google Analytics 4 numbers for hourstally.com and print the read.

GA4 went live 2026-10-31 (tag in site/assets/ga.js). gsc_export.py is the search half;
this is what happens after the click: real visitors, where from, and which buttons.
The numbers still get written into docs/MEASUREMENTS.md by hand.

Auth: the service account gsc_export.py uses,
gstextract-gsc-export@gstextract.iam.gserviceaccount.com, added as a Viewer on the
GA4 property on 2026-10-31. Its key is read from the gstextract repo, so nothing
secret is copied here. Set GSC_KEY_PATH to point elsewhere.

Property: 561710549 ("hourstally.com"), stream G-53J8ESQ8KZ.

Usage:
    python scripts/ga4_export.py                 # last 28 days, today included (partial)
    python scripts/ga4_export.py --days 90
    python scripts/ga4_export.py --dims pagePath --event download_xlsx

Our own events: download_xlsx, print_card, print_chart, copy_result, clear_card.
Output: docs/ga4/<end date>_<report>.csv — small, committed, like docs/gsc/.
"""
import argparse
import csv
import os
from datetime import date, timedelta

from google.oauth2 import service_account
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    DateRange, Dimension, Filter, FilterExpression, Metric, RunReportRequest,
)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY_PATH = os.environ.get(
    "GSC_KEY_PATH",
    os.path.join(os.path.dirname(ROOT), "gstextract", "gstextract-gsc-key.json"))
PROPERTY = os.environ.get("GA4_PROPERTY_ID", "561710549")
OUT_DIR = os.path.join(ROOT, "docs", "ga4")
SCOPES = ["https://www.googleapis.com/auth/analytics.readonly"]

# (label, dimensions, metrics, row limit)
DEFAULT_REPORTS = [
    ("totals", [], ["sessions", "totalUsers", "screenPageViews", "engagedSessions",
                    "averageSessionDuration"], 1),
    ("channel", ["sessionDefaultChannelGroup"], ["sessions", "engagedSessions"], 15),
    ("source", ["sessionSource"], ["sessions", "engagedSessions"], 25),
    ("landing", ["landingPage"], ["sessions", "engagedSessions", "averageSessionDuration"], 25),
    ("event", ["eventName"], ["eventCount", "totalUsers"], 50),
    ("country", ["country"], ["sessions"], 15),
    ("device", ["deviceCategory"], ["sessions"], 5),
]


def run(client, start, end, dims, mets, limit, event=None):
    fil = None
    if event:
        fil = FilterExpression(filter=Filter(
            field_name="eventName", string_filter=Filter.StringFilter(value=event)))
    resp = client.run_report(RunReportRequest(
        property=f"properties/{PROPERTY}",
        date_ranges=[DateRange(start_date=str(start), end_date=str(end))],
        dimensions=[Dimension(name=d) for d in dims],
        metrics=[Metric(name=m) for m in mets],
        dimension_filter=fil, limit=limit,
    ))
    return [[d.value for d in r.dimension_values] + [m.value for m in r.metric_values]
            for r in resp.rows]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=28)
    ap.add_argument("--dims", default="")
    ap.add_argument("--mets", default="sessions,totalUsers")
    ap.add_argument("--event", default=None, help="scope metrics to one eventName")
    ap.add_argument("--limit", type=int, default=50)
    args = ap.parse_args()

    creds = service_account.Credentials.from_service_account_file(KEY_PATH, scopes=SCOPES)
    client = BetaAnalyticsDataClient(credentials=creds)
    end = date.today()
    start = end - timedelta(days=args.days - 1)
    print(f"GA4 property {PROPERTY}  {start} -> {end}  ({args.days} days, today partial)")

    if args.dims or args.event:
        dims = [d.strip() for d in args.dims.split(",") if d.strip()]
        mets = [m.strip() for m in args.mets.split(",") if m.strip()]
        label = "-".join(filter(None, [args.event] + dims)) or "totals"
        reports = [(label, dims, mets, args.limit)]
    else:
        reports = DEFAULT_REPORTS

    os.makedirs(OUT_DIR, exist_ok=True)
    for label, dims, mets, limit in reports:
        rows = run(client, start, end, dims, mets, limit, args.event)
        print(f"\n{label}")
        print("  " + " | ".join(dims + mets))
        for r in rows or [["(no rows)"]]:
            print("  " + " | ".join(r))
        with open(os.path.join(OUT_DIR, f"{end}_{label}.csv"), "w", newline="",
                  encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(dims + mets)
            w.writerows(rows)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("\nFailed:", e)
        if "403" in str(e) or "PERMISSION_DENIED" in str(e):
            print("403 = the service account is not a Viewer on property "
                  f"{PROPERTY} yet (Admin -> Property access management).")
        raise SystemExit(1)
