"""
GitHub Repository Cloner
Clones public GitHub repos for battle scanning.
"""
import shutil
import tempfile
from pathlib import Path
from urllib.parse import urlparse

import git

from core.events import broadcast

CLONE_DIR = Path(tempfile.gettempdir()) / "zdf-repos"
CLONE_DIR.mkdir(exist_ok=True)


async def clone_github_repo(github_url: str) -> str:
    """
    Clone a public GitHub repo and return the local path.
    Uses shallow clone for speed. Caches by owner/repo.
    """
    parsed = urlparse(github_url)
    path_parts = parsed.path.strip("/").rstrip(".git").split("/")
    if len(path_parts) < 2:
        raise ValueError(f"Invalid GitHub URL: {github_url}")

    owner, repo = path_parts[0], path_parts[1]
    repo_dir = CLONE_DIR / f"{owner}--{repo}"

    # If already cloned, pull latest
    if repo_dir.exists():
        try:
            g = git.Repo(repo_dir)
            g.remotes.origin.pull()
            await broadcast("repo_cloned", {
                "github_url": github_url,
                "path": str(repo_dir),
                "cached": True,
            })
            return str(repo_dir)
        except Exception:
            shutil.rmtree(repo_dir, ignore_errors=True)

    # Clone fresh (shallow for speed)
    clone_url = f"https://github.com/{owner}/{repo}.git"
    await broadcast("repo_cloning", {
        "github_url": github_url,
        "status": "cloning",
    })

    git.Repo.clone_from(clone_url, repo_dir, depth=1)

    await broadcast("repo_cloned", {
        "github_url": github_url,
        "path": str(repo_dir),
        "cached": False,
    })

    return str(repo_dir)


def cleanup_repo(path: str) -> None:
    """Remove cloned repo."""
    shutil.rmtree(path, ignore_errors=True)
