"""
Robust JSON parsing helpers for LLM responses.
LLMs (especially small local models) often:
  - Wrap arrays inside objects: {"items": [...]}
  - Truncate JSON mid-output
  - Add markdown code fences around JSON
"""
import json
import re


def _strip_markdown(raw: str) -> str:
    """Remove ```json ... ``` or ``` ... ``` fences."""
    raw = re.sub(r"```(?:json)?\s*", "", raw)
    raw = re.sub(r"```\s*", "", raw)
    return raw.strip()


def _repair_truncated(s: str) -> str:
    """Try to close unclosed braces/brackets in a truncated JSON string."""
    stack = []
    in_string = False
    escape = False
    for c in s:
        if escape:
            escape = False
            continue
        if c == "\\" and in_string:
            escape = True
            continue
        if c == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if c in "{[":
            stack.append("}" if c == "{" else "]")
        elif c in "}]":
            if stack and stack[-1] == c:
                stack.pop()
    return s + "".join(reversed(stack))


def _try_parse(candidate: str):
    """Try parse as-is, then with repair. Returns parsed value or raises."""
    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        pass
    return json.loads(_repair_truncated(candidate))


def safe_parse_obj(raw: str, fallback: dict | None = None) -> dict:
    """
    Extract and parse a JSON object from an LLM response.
    Handles markdown fences and truncated JSON.
    Returns `fallback` (default {}) on total failure.
    """
    if fallback is None:
        fallback = {}

    raw = _strip_markdown(raw)

    # Try whole response first
    try:
        result = _try_parse(raw)
        if isinstance(result, dict):
            return result
    except Exception:
        pass

    # Find first { and parse from there
    match = re.search(r"\{", raw)
    if not match:
        return fallback

    candidate = raw[match.start():]
    try:
        result = _try_parse(candidate)
        if isinstance(result, dict):
            return result
    except Exception:
        pass

    return fallback


def safe_parse_list(raw: str, key: str = "", fallback: list | None = None) -> list:
    """
    Extract and parse a JSON array from an LLM response.
    Handles:
      - Bare arrays:               [{"a": 1}, ...]
      - Wrapped in object:         {"vulnerabilities": [...], ...}
      - Markdown fences:           ```json\n[...]\n```
      - Truncated JSON
    `key` is the preferred dict key to look for when the LLM wraps the array.
    Returns `fallback` (default []) on total failure.
    """
    if fallback is None:
        fallback = []

    raw = _strip_markdown(raw)

    # Try whole response as JSON
    try:
        result = _try_parse(raw)
        if isinstance(result, list):
            return result
        if isinstance(result, dict):
            # Look for the specified key first, then any list value
            if key and key in result and isinstance(result[key], list):
                return result[key]
            for v in result.values():
                if isinstance(v, list) and v:
                    return v
    except Exception:
        pass

    # Find first [ and parse from there
    match = re.search(r"\[", raw)
    if not match:
        return fallback

    candidate = raw[match.start():]
    try:
        result = _try_parse(candidate)
        if isinstance(result, list):
            return result
    except Exception:
        pass

    return fallback
