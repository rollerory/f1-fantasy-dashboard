#!/usr/bin/env python3
"""Fetch per-Grand-Prix leaderboards (points scored at that specific race
weekend, not the season cumulative total) and store them in data/gp_history.json,
keyed by gameperiod id. Re-fetches every id each run since scores can be
corrected after penalties/investigations are resolved."""

from __future__ import annotations

import json
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

LEAGUE_ID = "12834205"
MAX_GAMEPERIODS_TO_PROBE = 30
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_FILE = BASE_DIR / "data" / "gp_history.json"


def feed_url(gp_id: int) -> str:
    buster = str(int(time.time() * 1000))
    return (
        f"https://fantasy.formula1.com/feeds/leaderboard/privateleague/"
        f"list_2_{LEAGUE_ID}_{gp_id}_1.json?buster={buster}"
    )


def fetch_gameperiod(gp_id: int) -> dict | None:
    req = urllib.request.Request(feed_url(gp_id), headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            payload = json.load(resp)
    except (urllib.error.HTTPError, urllib.error.URLError, json.JSONDecodeError):
        return None

    entries = payload.get("Value", {}).get("leaderboard")
    if not entries:
        return None

    # Some members run a second fantasy team in the same league (team_no=2).
    # Only team_no=1 counts toward the overall season standings, so keep the
    # per-GP data consistent with that (otherwise a person's rounds get
    # double-counted and their rank/points here won't reconcile with the
    # season leaderboard).
    normalized = []
    for e in entries:
        if e.get("team_no") != 1:
            continue
        normalized.append(
            {
                "user_guid": e["user_guid"],
                "user_name": e["user_name"],
                "team_name": urllib.parse.unquote(e["team_name"]),
                "points": e["cur_points"],
                "roster": e["user_team"],
                "trend": 0,  # not meaningful per-GP; kept only for a uniform Entry shape
            }
        )
    normalized.sort(key=lambda e: -e["points"])
    for i, e in enumerate(normalized, start=1):
        e["rank"] = i

    return {
        "gp_id": gp_id,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "source_time": payload["FeedTime"]["UTCTime"],
        "entries": normalized,
    }


def load_history() -> dict[str, dict]:
    if DATA_FILE.exists():
        raw = json.loads(DATA_FILE.read_text())
        return {str(item["gp_id"]): item for item in raw}
    return {}


def save_history(by_id: dict[str, dict]) -> None:
    ordered = [by_id[k] for k in sorted(by_id, key=int)]
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    DATA_FILE.write_text(json.dumps(ordered, indent=2, ensure_ascii=False) + "\n")


def main() -> None:
    by_id = load_history()
    updated = 0

    for gp_id in range(1, MAX_GAMEPERIODS_TO_PROBE + 1):
        snapshot = fetch_gameperiod(gp_id)
        if snapshot is None:
            continue
        key = str(gp_id)
        if by_id.get(key) and by_id[key]["entries"] == snapshot["entries"]:
            continue
        by_id[key] = snapshot
        updated += 1

    if updated:
        save_history(by_id)
        print(f"Updated {updated} gameperiod snapshot(s); {len(by_id)} total stored.")
    else:
        print("No changes.")


if __name__ == "__main__":
    main()
