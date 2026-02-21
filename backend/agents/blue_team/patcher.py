"""
Shield — Patcher Agent
Generates minimal secure patches for discovered vulnerabilities.
"""
import difflib
import json
import os
import re
from pathlib import Path

from core.config import get_settings
from core.events import broadcast
from core.llm import ask_llm
from models.vulnerability import BattleSession, Patch, Vulnerability

SYSTEM = """You are Shield, an elite blue-team patch engineer.
Given a vulnerability and the affected source code, generate the MINIMAL secure fix.

Rules:
1. Change ONLY what's necessary to fix the vulnerability
2. Preserve existing functionality
3. Use language-appropriate secure patterns:
   - SQL: parameterized queries / ORM safe methods
   - XSS: output encoding, CSP headers, sanitization
   - SSRF: allowlist validation, disable redirects
   - IDOR: ownership checks, authorization middleware
   - Path Traversal: path normalization, allowlist
   - Command Injection: parameterized subprocess, avoid shell=True
   - Auth Bypass: proper token validation, session checks
4. Add a one-line comment explaining why the change is secure

Respond ONLY with a JSON object:
{
  "file_path": "",
  "original_code": "exact snippet to replace",
  "patched_code": "the fixed version",
  "explanation": "1-2 sentence explanation",
  "diff": "unified diff format"
}"""


async def run(session: BattleSession, vuln: Vulnerability) -> Patch | None:
    """Generate a patch for a single vulnerability."""
    await broadcast("agent_status", {
        "agent": "Shield", "status": "patching",
        "vulnerability": vuln.title, "session_id": session.id,
    })
    session.log.append(f"[Shield] Patching: {vuln.title}")

    settings = get_settings()
    repo_path = session.target_repo_path or settings.target_repo_path
    file_content = ""

    if vuln.file_path:
        full_path = os.path.join(repo_path, vuln.file_path)
        try:
            file_content = Path(full_path).read_text(errors="ignore")[:5000]
        except OSError:
            pass

    prompt = f"""Vulnerability to fix:
Type: {vuln.type.value}
Severity: {vuln.severity.value}
Title: {vuln.title}
Description: {vuln.description}
Endpoint: {vuln.endpoint}
Payload that works: {vuln.payload}
File: {vuln.file_path}
Line: {vuln.line_number}

File content:
{file_content if file_content else "(file not found — generate conceptual patch)"}

Generate the minimal secure patch. Return ONLY valid JSON."""

    raw = await ask_llm(SYSTEM, prompt, max_tokens=2048, agent_name="Shield")

    json_match = re.search(r"\{[\s\S]+\}", raw)
    if not json_match:
        session.log.append(f"[Shield] Could not generate patch for {vuln.title}")
        return None

    try:
        patch_data = json.loads(json_match.group())
    except json.JSONDecodeError:
        session.log.append(f"[Shield] Could not parse patch JSON for {vuln.title}")
        return None

    patch = Patch(
        vulnerability_id=vuln.id,
        file_path=patch_data.get("file_path") or vuln.file_path or "",
        original_code=patch_data.get("original_code") or "",
        patched_code=patch_data.get("patched_code") or "",
        diff=patch_data.get("diff") or "",
        explanation=patch_data.get("explanation") or "",
        generated_by="Shield",
    )

    # Apply patch to file if content exists
    if patch.original_code and patch.patched_code and vuln.file_path:
        full_path = os.path.join(repo_path, vuln.file_path)
        try:
            original = Path(full_path).read_text(errors="ignore")
            if patch.original_code in original:
                patched = original.replace(patch.original_code, patch.patched_code, 1)
                Path(full_path).write_text(patched)
                # Generate proper diff
                diff_lines = list(difflib.unified_diff(
                    original.splitlines(keepends=True),
                    patched.splitlines(keepends=True),
                    fromfile=f"a/{vuln.file_path}",
                    tofile=f"b/{vuln.file_path}",
                    n=3,
                ))
                patch.diff = "".join(diff_lines)
                vuln.patched = True
                session.log.append(f"[Shield] Applied patch to {vuln.file_path}")
            else:
                session.log.append("[Shield] Conceptual patch generated (code not found in file)")
        except OSError as e:
            session.log.append(f"[Shield] File write error: {e}")

    session.patches.append(patch)
    await broadcast("patch_generated", {
        "session_id": session.id,
        "patch": patch.model_dump(mode="json"),
        "vulnerability_id": vuln.id,
    })

    return patch
