"""
GitHub PR Auto-Generation Tool
Creates a pull request with all patches from a battle session.
"""
import base64
import logging
from datetime import datetime

from github import Github, GithubException

from core.config import get_settings
from core.events import broadcast
from models.vulnerability import BattleSession

logger = logging.getLogger(__name__)


async def create_battle_pr(session: BattleSession) -> str | None:
    """
    Create a GitHub PR with all patches from the battle session.
    Returns the PR URL or None if GitHub is not configured.
    """
    settings = get_settings()

    if not settings.github_token or not settings.github_repo_owner or not settings.github_repo_name:
        session.log.append("[GitHub] Skipping PR — GitHub not configured")
        return None

    if not session.patches:
        session.log.append("[GitHub] No patches to commit")
        return None

    await broadcast("agent_status", {"agent": "GitHub", "status": "running", "phase": "pr_generation"})
    session.log.append("[GitHub] Creating pull request with battle patches...")

    try:
        g = Github(settings.github_token)
        repo = g.get_repo(f"{settings.github_repo_owner}/{settings.github_repo_name}")

        # Create branch from default branch
        default_branch = repo.default_branch
        ref = repo.get_git_ref(f"heads/{default_branch}")
        branch_name = f"zdf/battle-patches-{session.id[:8]}"
        repo.create_git_ref(f"refs/heads/{branch_name}", ref.object.sha)
        session.log.append(f"[GitHub] Created branch: {branch_name}")

        # Group patches by file
        patches_by_file: dict[str, list] = {}
        for patch in session.patches:
            if patch.file_path and patch.patched_code:
                patches_by_file.setdefault(patch.file_path, []).append(patch)

        committed_files = 0
        for file_path, file_patches in patches_by_file.items():
            try:
                # Get current file content from the new branch
                contents = repo.get_contents(file_path, ref=branch_name)
                if isinstance(contents, list):
                    continue  # skip directories

                current_content = contents.decoded_content.decode("utf-8")

                # Apply all patches for this file sequentially
                patched_content = current_content
                for patch in file_patches:
                    if patch.original_code and patch.original_code in patched_content:
                        patched_content = patched_content.replace(
                            patch.original_code, patch.patched_code, 1
                        )

                if patched_content != current_content:
                    # Find associated vulnerabilities for commit message
                    vuln_titles = []
                    for patch in file_patches:
                        for v in session.vulnerabilities:
                            if v.id == patch.vulnerability_id:
                                vuln_titles.append(f"{v.severity.value}: {v.title}")

                    commit_msg = f"fix: patch {file_path}\n\n" + "\n".join(
                        f"- {t}" for t in vuln_titles
                    )

                    repo.update_file(
                        file_path,
                        commit_msg,
                        patched_content,
                        contents.sha,
                        branch=branch_name,
                    )
                    committed_files += 1
                    session.log.append(f"[GitHub] Committed fix for {file_path}")

            except GithubException as e:
                session.log.append(f"[GitHub] Could not patch {file_path}: {e.data.get('message', str(e))}")

        if committed_files == 0:
            session.log.append("[GitHub] No file changes to commit")
            return None

        # Build PR body
        vuln_count = len(session.vulnerabilities)
        patched_count = sum(1 for v in session.vulnerabilities if v.patched)
        verified_count = sum(1 for v in session.vulnerabilities if v.verified)
        critical_count = sum(1 for v in session.vulnerabilities if v.severity.value == "critical")

        pr_body = f"""## Zero Day Fortress — Automated Security Patches

### Battle Summary
| Metric | Value |
|--------|-------|
| Vulnerabilities Found | {vuln_count} |
| Critical | {critical_count} |
| Patches Applied | {patched_count} |
| Verified Fixes | {verified_count} |
| Attack Chains | {len(session.chains)} |
| Compliance Score | {session.compliance_score}/100 ({"+" if session.compliance_delta >= 0 else ""}{session.compliance_delta} pts) |

### Patches Included
"""
        for patch in session.patches:
            vuln = next((v for v in session.vulnerabilities if v.id == patch.vulnerability_id), None)
            if vuln:
                status = "Verified" if vuln.verified else ("Patched" if vuln.patched else "Conceptual")
                pr_body += f"- **[{vuln.severity.value.upper()}]** {vuln.title} — `{patch.file_path}` ({status})\n"

        if session.chains:
            pr_body += "\n### Attack Chains Mitigated\n"
            for chain in session.chains:
                pr_body += f"- **{chain.title}** ({chain.combined_severity.value}) — {chain.outcome}\n"

        report = session.compliance_report
        if report and report.get("recommendations"):
            pr_body += "\n### Recommendations\n"
            for rec in report["recommendations"][:5]:
                pr_body += f"- {rec}\n"

        pr_body += f"\n---\n*Generated by Zero Day Fortress AI at {datetime.utcnow().isoformat()}Z*"

        # Create PR
        pr = repo.create_pull(
            title=f"[ZDF] Security patches — {patched_count} fixes ({critical_count} critical)",
            body=pr_body,
            base=default_branch,
            head=branch_name,
        )

        pr_url = pr.html_url
        session.log.append(f"[GitHub] PR created: {pr_url}")

        # Update patch models with PR URL
        for patch in session.patches:
            patch.pr_url = pr_url

        await broadcast("pr_created", {
            "session_id": session.id,
            "pr_url": pr_url,
            "files_changed": committed_files,
        })

        return pr_url

    except GithubException as e:
        error_msg = e.data.get("message", str(e)) if hasattr(e, "data") else str(e)
        session.log.append(f"[GitHub] PR creation failed: {error_msg}")
        await broadcast("pr_failed", {"session_id": session.id, "error": error_msg})
        return None
    except Exception as e:
        session.log.append(f"[GitHub] Unexpected error: {e}")
        return None
