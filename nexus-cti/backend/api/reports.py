"""Reports API — generate and retrieve threat intelligence reports."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from core.database import get_db
from core.security import get_current_user
from models.user import User
from models.report import Report
from models.ioc import IOC
from models.alert import Alert
from models.actor import ThreatActor

router = APIRouter()


class ReportRequest(BaseModel):
    report_type: str = "executive"  # executive|campaign|ioc|actor
    title: str = ""


@router.post("/generate")
async def generate_report(
    payload: ReportRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Collect data
    critical_iocs = (await db.execute(
        select(IOC).where(IOC.severity == "critical").order_by(IOC.score.desc()).limit(10)
    )).scalars().all()

    open_alerts = (await db.execute(
        select(Alert).where(Alert.status != "resolved").order_by(Alert.timestamp.desc()).limit(5)
    )).scalars().all()

    top_actors = (await db.execute(
        select(ThreatActor).order_by(ThreatActor.risk_score.desc()).limit(3)
    )).scalars().all()

    ioc_total = (await db.execute(select(func.count()).select_from(IOC))).scalar()

    content = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "generated_by": current_user.full_name or current_user.username,
        "report_type": payload.report_type,
        "executive_summary": {
            "ioc_total": ioc_total,
            "critical_iocs": len(critical_iocs),
            "open_alerts": len(open_alerts),
            "threat_score": 7.8,
            "risk_level": "HIGH",
            "active_campaigns": 12,
        },
        "critical_iocs": [
            {"type": i.ioc_type, "value": i.value[:60], "actor": i.actor_name,
             "score": i.score, "first_seen": i.first_seen.isoformat()}
            for i in critical_iocs
        ],
        "top_actors": [
            {"name": a.name, "origin": a.origin, "risk_score": a.risk_score,
             "campaigns": a.campaigns}
            for a in top_actors
        ],
        "key_findings": [
            {"severity": "critical", "text": "Ransomware infrastructure belonging to ALPHV/BlackCat identified"},
            {"severity": "high", "text": "APT29 spear-phishing campaign targeting defense sector"},
            {"severity": "high", "text": "QakBot resurgence with new loader variant detected"},
            {"severity": "medium", "text": "Dark web post advertising 0-day VPN exploit"},
            {"severity": "medium", "text": "Lazarus Group cryptocurrency theft attempt detected"},
        ],
        "recommendations": [
            "Block all critical-severity IP IOCs at network perimeter immediately",
            "Enable MFA for all privileged accounts — targeted by credential-stuffing",
            "Patch CVE-2024-3400 in PAN-OS — exploited by Volt Typhoon",
            "Enable PowerShell Script Block Logging and AMSI",
            "Conduct ransomware tabletop exercise based on ALPHV/BlackCat TTPs",
            "Subscribe to FS-ISAC for sector-specific threat sharing",
        ],
    }

    title = payload.title or f"{payload.report_type.title()} CTI Report — {datetime.now(timezone.utc).strftime('%Y-%m-%d')}"
    report = Report(
        title=title,
        report_type=payload.report_type,
        generated_by=current_user.username,
        content=content,
    )
    db.add(report)
    await db.flush()
    return {"id": report.id, "title": report.title, "content": content}


@router.get("/")
async def list_reports(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    rows = (await db.execute(
        select(Report).order_by(Report.created_at.desc()).limit(20)
    )).scalars().all()
    return [
        {"id": r.id, "title": r.title, "report_type": r.report_type,
         "generated_by": r.generated_by, "created_at": r.created_at}
        for r in rows
    ]


@router.get("/{report_id}")
async def get_report(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Report).where(Report.id == report_id))
    r = result.scalar_one_or_none()
    if not r:
        from fastapi import HTTPException
        raise HTTPException(404, "Report not found")
    return {"id": r.id, "title": r.title, "report_type": r.report_type,
            "generated_by": r.generated_by, "created_at": r.created_at, "content": r.content}
