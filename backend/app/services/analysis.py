from datetime import datetime


def compute_response_times(messages: list[dict]) -> dict:
    """Compute response time patterns from message timestamps.

    Groups messages by channel, then calculates time gaps between
    consecutive messages per author.
    """
    channels: dict[str, list[dict]] = {}
    for msg in messages:
        ch = msg["channel"]
        if ch not in channels:
            channels[ch] = []
        channels[ch].append(msg)

    for ch in channels:
        channels[ch].sort(key=lambda m: m["timestamp"])

    response_times: dict[str, list[float]] = {}

    for channel, msgs in channels.items():
        for i in range(1, len(msgs)):
            author = msgs[i]["author"]
            prev_ts = msgs[i - 1]["timestamp"]
            curr_ts = msgs[i]["timestamp"]

            if isinstance(prev_ts, str):
                prev_ts = datetime.fromisoformat(prev_ts)
            if isinstance(curr_ts, str):
                curr_ts = datetime.fromisoformat(curr_ts)

            gap_minutes = (curr_ts - prev_ts).total_seconds() / 60

            if author not in response_times:
                response_times[author] = []
            response_times[author].append(round(gap_minutes, 1))

    summary = {}
    for author, times in response_times.items():
        summary[author] = {
            "avg_response_minutes": round(sum(times) / len(times), 1),
            "min_response_minutes": min(times),
            "max_response_minutes": max(times),
            "total_responses": len(times),
        }

    return summary
