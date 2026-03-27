"""
Seed the SQLite database with realistic synthetic threat intelligence data.
Runs once on first startup; skips if data already exists.
"""
import asyncio
import random
import hashlib
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import AsyncSessionLocal
from core.security import hash_password
from models.user import User
from models.ioc import IOC
from models.actor import ThreatActor
from models.malware_model import MalwareFamily
from models.alert import Alert
from models.feed_item import FeedItem

# ─── Seed Data Constants ───────────────────────────────────────────────────────

THREAT_ACTORS = [
    {"name": "APT29", "alias": "Cozy Bear", "origin": "Russia", "actor_type": "Nation-State",
     "risk_score": 97, "campaigns": 14, "description": "Russian SVR-linked group targeting government and think tanks.",
     "ttps": ["T1566.001","T1078","T1055","T1036","T1027"], "color": "#ff4040"},
    {"name": "Lazarus Group", "alias": "HIDDEN COBRA", "origin": "North Korea", "actor_type": "Nation-State",
     "risk_score": 95, "campaigns": 22, "description": "DPRK-sponsored group focused on financial crime and espionage.",
     "ttps": ["T1571","T1105","T1027","T1059","T1486"], "color": "#ff8040"},
    {"name": "FIN7", "alias": "Carbanak", "origin": "Eastern Europe", "actor_type": "eCrime",
     "risk_score": 88, "campaigns": 31, "description": "Financially motivated group targeting POS systems and retail.",
     "ttps": ["T1566","T1204","T1055","T1486","T1059"], "color": "#ffaa00"},
    {"name": "Scattered Spider", "alias": "0ktapus", "origin": "Unknown", "actor_type": "eCrime",
     "risk_score": 82, "campaigns": 8, "description": "Social engineering specialists exploiting helpdesk and MFA fatigue.",
     "ttps": ["T1621","T1078","T1199","T1534","T1566"], "color": "#e040fb"},
    {"name": "ALPHV", "alias": "BlackCat", "origin": "Russia", "actor_type": "RaaS",
     "risk_score": 91, "campaigns": 19, "description": "Sophisticated RaaS operator with cross-platform ransomware.",
     "ttps": ["T1486","T1490","T1489","T1562","T1485"], "color": "#ff4081"},
    {"name": "Volt Typhoon", "alias": "Bronze Silhouette", "origin": "China", "actor_type": "Nation-State",
     "risk_score": 93, "campaigns": 6, "description": "Chinese APT targeting US critical infrastructure for pre-positioning.",
     "ttps": ["T1190","T1505.003","T1036.005","T1571","T1078"], "color": "#00e5ff"},
]

MALWARE_FAMILIES = [
    {"name": "Cobalt Strike", "malware_type": "RAT/C2 Framework", "actor": "Multiple",
     "first_seen": "2012", "severity": "critical", "detections": 1847,
     "behaviors": ["Process injection","Lateral movement","C2 beaconing","Credential theft","Persistence via services"],
     "description": "Commercial red-team tool widely abused by threat actors for C2 operations."},
    {"name": "QakBot", "malware_type": "Banking Trojan/Loader", "actor": "QakBot Gang",
     "first_seen": "2007", "severity": "high", "detections": 3201,
     "behaviors": ["Email hijacking","Credential harvesting","Ransomware delivery","Keylogging","Lateral movement"],
     "description": "Long-running banking trojan used as initial access broker for ransomware groups."},
    {"name": "BlackCat/ALPHV", "malware_type": "Ransomware", "actor": "ALPHV",
     "first_seen": "2021", "severity": "critical", "detections": 423,
     "behaviors": ["File encryption","Data exfiltration","VSS deletion","Backup wiping","Extortion portal"],
     "description": "Rust-based cross-platform ransomware with triple-extortion capabilities."},
    {"name": "IcedID", "malware_type": "Banking Trojan", "actor": "TA577",
     "first_seen": "2017", "severity": "high", "detections": 891,
     "behaviors": ["Banking fraud","Payload delivery","C2 tunneling","Persistence","Browser injection"],
     "description": "Modular banking trojan acting as loader for post-exploitation frameworks."},
    {"name": "Emotet", "malware_type": "Botnet Loader", "actor": "TA542",
     "first_seen": "2014", "severity": "critical", "detections": 4532,
     "behaviors": ["Spam delivery","Lateral movement","Modular payloads","Botnet C2","Credential theft"],
     "description": "Most prolific malware loader used to deliver ransomware and other payloads."},
    {"name": "Lazagne", "malware_type": "Credential Stealer", "actor": "Multiple",
     "first_seen": "2015", "severity": "medium", "detections": 2143,
     "behaviors": ["Password extraction","Browser credential theft","Memory scraping","Network credential dump"],
     "description": "Open-source post-exploitation tool for extracting credentials from applications."},
]

IP_PREFIXES = [
    "185.220.", "194.165.", "91.92.", "45.142.", "162.247.",
    "198.98.", "23.234.", "104.244.", "176.10.", "45.33.",
]
DOMAINS = [
    "update-security.net", "cdn-delivery.org", "auth-portal.cc", "download-patch.ru",
    "login-verify.com", "secure-cdn.net", "api-gateway.io", "monitor-check.com",
    "telemetry-hub.net", "analytics-pro.cc", "backup-sys.org", "health-check.io",
    "sync-manager.net", "cloud-update.cc", "patch-deploy.org", "sys-monitor.ru",
]
TAGS_POOL = ["phishing","ransomware","botnet","APT","c2","malware","exploit","stealer","loader","dropper"]
SEVERITIES = ["critical","high","medium","low"]
COUNTRIES = ["RU","CN","KP","IR","UA","US","NL","DE","BR","IN"]

FEED_MESSAGES = [
    ("New C2 infrastructure identified in AS15169 — 14 IPs blacklisted", "critical"),
    ("Cobalt Strike beacon detected via JA3 fingerprint matching", "critical"),
    ("QakBot campaign targeting financial institutions in EMEA", "high"),
    ("CVE-2024-3400 actively exploited by Volt Typhoon actors", "critical"),
    ("Dark web post: 2.4M credentials from banking sector leaked", "high"),
    ("ALPHV/BlackCat updated ransomware binary — new evasion techniques", "critical"),
    ("Phishing kit impersonating Microsoft 365 login detected", "high"),
    ("APT29 spear-phishing targeting defense contractors", "high"),
    ("New BEC campaign leveraging AI-generated executive voices", "high"),
    ("Suspicious DNS tunneling activity from 185.220.x.x range", "medium"),
    ("Lazarus Group targeting crypto exchanges via LinkedIn", "high"),
    ("SocGholish malware delivery via compromised news websites", "medium"),
    ("EvilProxy phishing-as-a-service targeting MFA bypass", "high"),
    ("RedLine stealer variant evading AV via syscall obfuscation", "medium"),
    ("LockBit affiliate recruiting on RAMP forum", "medium"),
    ("Mass credential stuffing attack detected — 120K attempts/hour", "critical"),
    ("Threat actor rotated C2 infrastructure — new domains registered", "high"),
    ("Zero-day exploit for Ivanti VPN under active exploitation", "critical"),
    ("New ransomware group 'Cyclops' emerges with Linux variant", "high"),
    ("Supply chain compromise detected in popular npm package", "critical"),
]

ALERT_TEMPLATES = [
    ("Ransomware Activity Detected", "critical", "Ransomware"),
    ("C2 Beacon Identified", "critical", "C2 Traffic"),
    ("APT Lateral Movement Observed", "high", "Lateral Movement"),
    ("Credential Stuffing Attack", "high", "Authentication"),
    ("Phishing Campaign Active", "high", "Phishing"),
    ("IOC Match in Network Traffic", "medium", "IOC Match"),
    ("Suspicious PowerShell Execution", "medium", "Execution"),
    ("Tor Exit Node Traffic Detected", "medium", "Network"),
    ("Mass Port Scan Detected", "low", "Reconnaissance"),
    ("Threat Actor Infrastructure Update", "low", "Intelligence"),
    ("Anomalous DNS Query Volume", "medium", "DNS"),
    ("Brute Force Attack on VPN", "high", "Authentication"),
]


def rand_ip():
    prefix = random.choice(IP_PREFIXES)
    return f"{prefix}{random.randint(1,253)}.{random.randint(1,253)}"


def rand_domain():
    subdomain = random.choice(["cdn","api","auth","update","sync","dl","static",""])
    domain = random.choice(DOMAINS)
    return f"{subdomain}.{domain}" if subdomain else domain


def rand_hash():
    return hashlib.sha256(f"{random.random()}".encode()).hexdigest()


def rand_url():
    domain = rand_domain()
    path = "".join(random.choices("abcdefghijklmnopqrstuvwxyz0123456789", k=8))
    return f"http://{domain}/payload/{path}"


def days_ago(n: int) -> datetime:
    return datetime.now(timezone.utc) - timedelta(days=n)


async def seed_database():
    async with AsyncSessionLocal() as db:
        # Check if already seeded
        result = await db.execute(select(func.count()).select_from(User))
        if result.scalar() > 0:
            return

        print("🌱 Seeding database with threat intelligence data...")

        # ── Users ─────────────────────────────────────────────────────────────
        users = [
            User(username="admin", email="admin@nexus-cti.local",
                 hashed_password=hash_password("admin123"),
                 role="admin", full_name="System Administrator", is_active=True),
            User(username="alice.chen", email="alice@nexus-cti.local",
                 hashed_password=hash_password("analyst123"),
                 role="analyst", full_name="Alice Chen", is_active=True),
            User(username="bob.malik", email="bob@nexus-cti.local",
                 hashed_password=hash_password("analyst123"),
                 role="analyst", full_name="Bob Malik", is_active=True),
        ]
        db.add_all(users)
        await db.flush()

        # ── Threat Actors ─────────────────────────────────────────────────────
        actor_objs = []
        for a in THREAT_ACTORS:
            obj = ThreatActor(
                name=a["name"], alias=a["alias"], origin=a["origin"],
                actor_type=a["actor_type"], risk_score=a["risk_score"],
                campaigns=a["campaigns"], description=a["description"],
                ttps=a["ttps"], color=a["color"],
                first_observed=days_ago(random.randint(365, 2000)),
                last_observed=days_ago(random.randint(0, 30)),
            )
            db.add(obj)
            actor_objs.append(obj)
        await db.flush()

        # ── Malware Families ─────────────────────────────────────────────────
        for m in MALWARE_FAMILIES:
            obj = MalwareFamily(
                name=m["name"], malware_type=m["malware_type"],
                actor=m["actor"], first_seen=m["first_seen"],
                severity=m["severity"], detections=m["detections"],
                behaviors=m["behaviors"], description=m["description"],
            )
            db.add(obj)
        await db.flush()

        # ── IOCs ─────────────────────────────────────────────────────────────
        ioc_generators = [rand_ip, rand_domain, rand_hash, rand_url]
        ioc_types = ["ip", "domain", "hash", "url"]
        for i in range(150):
            idx = i % 4
            value = ioc_generators[idx]()
            ioc_type = ioc_types[idx]
            sev = random.choices(SEVERITIES, weights=[15, 30, 35, 20])[0]
            tags = random.sample(TAGS_POOL, random.randint(1, 3))
            actor = random.choice(actor_objs)
            created = days_ago(random.randint(0, 90))
            obj = IOC(
                ioc_type=ioc_type, value=value, severity=sev,
                score=random.randint(55, 100),
                tags=tags, actor_name=actor.name,
                country=random.choice(COUNTRIES),
                hits=random.randint(1, 300),
                first_seen=created,
                last_seen=days_ago(random.randint(0, 7)),
                is_active=True,
                source=random.choice(["AlienVault OTX","MISP","FS-ISAC","Internal","Shodan"]),
            )
            db.add(obj)

        # ── Alerts ────────────────────────────────────────────────────────────
        statuses = ["open", "investigating", "resolved"]
        assignees = ["alice.chen", "bob.malik", "unassigned"]
        for i, (title, sev, cat) in enumerate(ALERT_TEMPLATES):
            ts = days_ago(random.randint(0, 7)) + timedelta(hours=random.randint(0, 23))
            obj = Alert(
                title=title, severity=sev, category=cat,
                status=random.choice(statuses),
                assignee=random.choice(assignees),
                description=f"Automated detection triggered by behavioral analytics and threat correlation engine. Confidence: {random.randint(70,99)}%.",
                timestamp=ts,
            )
            db.add(obj)

        # ── Feed Items ────────────────────────────────────────────────────────
        sources = ["AlienVault OTX","MISP","FS-ISAC","CISA","Shodan","DarkWeb Monitor","OSINT","Internal Sensor"]
        for i, (msg, sev) in enumerate(FEED_MESSAGES):
            ts = datetime.now(timezone.utc) - timedelta(minutes=random.randint(1, 7200))
            obj = FeedItem(
                message=msg, severity=sev,
                source=random.choice(sources),
                timestamp=ts,
            )
            db.add(obj)

        await db.commit()
        print("✅ Database seeded successfully.")
