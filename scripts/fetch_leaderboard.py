#!/usr/bin/env python3
"""Fetch the F1 Fantasy private league leaderboard and append a snapshot
to data/history.json if it differs from the most recent stored snapshot."""

import json
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

LEAGUE_ID = "12834205"
FEED_URL = (
    f"https://fantasy.formula1.com/feeds/leaderboard/privateleague/"
    f"list_1_{LEAGUE_ID}_0_1.json"
)
DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "history.json"


def fetch_leaderboard() -> dict:
    buster = str(int(time.time() * 1000))
    url = f"{FEED_URL}?buster={buster}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.load(resp)


def normalize_entries(raw_entries: list[dict]) -> list[dict]:
    entries = []
    for e in raw_entries:
        entries.append(
            {
                "rank": e["cur_rank"],
                "trend": e["trend"],
                "user_guid": e["user_guid"],
                "user_name": e["user_name"],
                "team_name": urllib.parse.unquote(e["team_name"]),
                "points": e["cur_points"],
                "roster": e["user_team"],
            }
        )
    entries.sort(key=lambda e: e["rank"])
    return entries


def load_history() -> list[dict]:
    if DATA_FILE.exists():
        return json.loads(DATA_FILE.read_text())
    return []


def save_history(history: list[dict]) -> None:
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    DATA_FILE.write_text(json.dumps(history, indent=2, ensure_ascii=False) + "\n")


def main() -> None:
    payload = fetch_leaderboard()
    entries = normalize_entries(payload["Value"]["leaderboard"])
    source_time = payload["FeedTime"]["UTCTime"]

    history = load_history()

    if history and history[-1]["entries"] == entries:
        print("No change since last snapshot, skipping.")
        return

    snapshot = {
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "source_time": source_time,
        "entries": entries,
    }
    history.append(snapshot)
    save_history(history)
    print(f"Saved new snapshot with {len(entries)} entries (source_time={source_time}).")


if __name__ == "__main__":
    main()
