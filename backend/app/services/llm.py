import json
import re

import anthropic

from ..config import ANTHROPIC_API_KEY

client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)


def _parse_json_response(text: str) -> dict:
    """Extract JSON from LLM response, stripping markdown code fences if present."""
    cleaned = re.sub(r"^```(?:json)?\s*\n?", "", text.strip())
    cleaned = re.sub(r"\n?```\s*$", "", cleaned)
    return json.loads(cleaned)

TOPICS_PROMPT = """Analyze the following Slack messages and extract the key discussion topics.

For each topic, provide:
- name: short topic label
- description: one-sentence summary
- message_count: how many messages relate to this topic
- channels: which channels discussed it

Return ONLY valid JSON in this exact format:
{
  "topics": [
    {
      "name": "string",
      "description": "string",
      "message_count": number,
      "channels": ["string"]
    }
  ]
}

Messages:
"""

SENTIMENT_PROMPT = """Analyze the following Slack messages and determine the sentiment for each author.

For each author, provide:
- author: the author's name
- overall_sentiment: one of "positive", "neutral", "negative"
- confidence: a float between 0 and 1
- summary: one-sentence explanation of their tone

Return ONLY valid JSON in this exact format:
{
  "sentiments": [
    {
      "author": "string",
      "overall_sentiment": "positive" | "neutral" | "negative",
      "confidence": number,
      "summary": "string"
    }
  ]
}

Messages:
"""


def _format_messages(messages: list[dict]) -> str:
    lines = []
    for msg in messages:
        lines.append(f"[{msg['channel']}] {msg['author']} ({msg['timestamp']}): {msg['content']}")
    return "\n".join(lines)


async def extract_topics(messages: list[dict]) -> dict:
    formatted = _format_messages(messages)
    response = await client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=1024,
        messages=[{"role": "user", "content": TOPICS_PROMPT + formatted}],
    )
    return _parse_json_response(response.content[0].text)


async def extract_sentiment(messages: list[dict]) -> dict:
    formatted = _format_messages(messages)
    response = await client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=1024,
        messages=[{"role": "user", "content": SENTIMENT_PROMPT + formatted}],
    )
    return _parse_json_response(response.content[0].text)
