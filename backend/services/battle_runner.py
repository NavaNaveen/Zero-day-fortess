"""
CLI battle runner — for CI/CD and make battle commands.
"""
import argparse
import asyncio
import json
from datetime import datetime
from pathlib import Path

from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from models.vulnerability import BattleSession
from services.orchestrator import run_battle

console = Console()


def print_banner():
    console.print(Panel.fit(
        "[bold red]ZERO[/bold red] [bold white]DAY[/bold white] [bold blue]FORTRESS[/bold blue]\n"
        "[dim]Autonomous Red Team vs Blue Team AI Cyber Defense[/dim]",
        border_style="blue",
    ))


async def main(demo: bool = False):
    print_banner()
    console.print(f"\n[yellow]⚔️  Battle initiated at {datetime.utcnow().isoformat()}[/yellow]\n")

    session = BattleSession()

    try:
        session = await run_battle(session)
    except Exception as e:
        console.print(f"[red]❌ Battle error: {e}[/red]")
        raise

    # Print summary table
    table = Table(title="Battle Results", border_style="blue")
    table.add_column("Metric", style="cyan")
    table.add_column("Value", style="bold")

    table.add_row("Session ID", session.id)
    table.add_row("State", session.state.value)
    table.add_row("Vulnerabilities", str(len(session.vulnerabilities)))
    table.add_row("Attack Chains", str(len(session.chains)))
    table.add_row("Patches", str(len(session.patches)))
    table.add_row("Verified Fixes", str(sum(1 for v in session.vulnerabilities if v.verified)))
    table.add_row("Compliance Score", f"{session.compliance_score}/100")
    table.add_row("Compliance Delta", f"+{session.compliance_delta}" if session.compliance_delta > 0 else str(session.compliance_delta))

    console.print(table)

    # Save JSON report
    report_dir = Path("reports")
    report_dir.mkdir(exist_ok=True)
    report_path = report_dir / f"battle-{session.id[:8]}.json"
    report_path.write_text(json.dumps(session.model_dump(mode="json"), indent=2, default=str))
    console.print(f"\n[green]✅ Report saved: {report_path}[/green]")

    # Exit with error code if critical unpatched vulns remain
    unpatched_critical = sum(
        1 for v in session.vulnerabilities
        if v.severity.value == "critical" and not v.verified
    )
    if unpatched_critical > 0:
        console.print(f"\n[red]⚠️  {unpatched_critical} critical vulnerabilities remain unverified[/red]")
        exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Zero Day Fortress Battle Runner")
    parser.add_argument("--demo", action="store_true", help="Run demo battle")
    args = parser.parse_args()
    asyncio.run(main(demo=args.demo))
