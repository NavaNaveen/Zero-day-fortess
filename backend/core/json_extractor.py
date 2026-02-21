"""
Robust JSON extraction from LLM responses.
Handles markdown code fences, extra text, trailing commas, etc.
Critical for Ollama models which are less JSON-reliable than Claude.
"""
import json
import re


def extract_json(raw: str, expect_array: bool = False) -> dict | list | None:
    """Extract JSON from LLM response text with multiple fallback strategies."""
    if not raw:
        return None

    # Strip markdown code fences
    cleaned = re.sub(r"```(?:json)?\s*", "", raw)
    cleaned = cleaned.strip()

    # Strategy 1: Direct parse
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Strategy 2: Extract JSON object or array via regex
    pattern = r"\[[\s\S]*\]" if expect_array else r"\{[\s\S]+\}"
    match = re.search(pattern, cleaned)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            # Strategy 3: Fix trailing commas and retry
            fixed = _fix_trailing_commas(match.group())
            try:
                return json.loads(fixed)
            except json.JSONDecodeError:
                pass

    # Strategy 4: Try the other type (maybe we expected wrong)
    alt_pattern = r"\{[\s\S]+\}" if expect_array else r"\[[\s\S]*\]"
    match = re.search(alt_pattern, cleaned)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    return None


def _fix_trailing_commas(text: str) -> str:
    """Remove trailing commas before } or ]."""
    text = re.sub(r",\s*}", "}", text)
    text = re.sub(r",\s*\]", "]", text)
    return text
