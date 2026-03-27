"""AI Threat Analysis — Smart Mock Mode (no API key required)."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.security import get_current_user
from models.user import User

router = APIRouter()


class Message(BaseModel):
    role: str
    content: str


class AnalysisRequest(BaseModel):
    messages: List[Message]


MOCK_RESPONSES = {
    "threat landscape": """## Current Threat Landscape Assessment

**Risk Level: HIGH** — Environment score 7.8/10

### Top Threat Actors (by risk score)

| Actor | Origin | Type | Risk |
|---|---|---|---|
| **APT29 / Cozy Bear** | Russia | Nation-State | 97/100 |
| **Volt Typhoon** | China | Nation-State | 93/100 |
| **Lazarus Group** | North Korea | Nation-State | 95/100 |
| **ALPHV/BlackCat** | Russia | RaaS | 91/100 |

### Key Observations

- **Ransomware activity** is elevated — ALPHV/BlackCat has updated its binary with new evasion techniques.
- **State-sponsored intrusions** from APT29 and Volt Typhoon are targeting critical infrastructure.
- **Initial access brokers** are actively selling network access on dark web forums.

### Immediate Recommendations

1. Block all critical-severity IP IOCs at the network perimeter
2. Enable MFA on all privileged accounts — credential stuffing is spiking
3. Patch CVE-2024-3400 immediately — actively exploited by Volt Typhoon
4. Review outbound DNS for tunneling — associated with C2 beaconing patterns""",

    "mitre": """## MITRE ATT&CK Coverage Analysis

### Most Observed Techniques (Current Campaigns)

**TA0005 — Defense Evasion** (91% observed) is the highest-coverage tactic:
- `T1036` Masquerading — malware disguising as legitimate processes
- `T1027` Obfuscated Files — PowerShell and script obfuscation
- `T1562` Impair Defenses — disabling AV/EDR before payload execution

**TA0001 — Initial Access** (87% observed):
- `T1566` Phishing — primary delivery vector across all tracked actors
- `T1190` Exploit Public-Facing App — VPN and firewall exploits
- `T1078` Valid Accounts — credential reuse from leaked databases

**TA0007 — Discovery** (83% observed):
- `T1082` System Information Discovery — standard post-exploitation enumeration
- `T1046` Network Service Scan — internal scanning after initial access

### Defensive Priority

Focus detection on **T1059** (command-line execution) and **T1003** (credential dumping) — highest signal-to-noise for detecting active intrusions early in the kill chain.""",

    "ransomware": """## Defensive Recommendations — Ransomware Protection

### Immediate Actions (0–24 hours)

1. **Block known C2 infrastructure** — Apply all critical IOCs to firewall deny-lists
2. **Disable RDP** on internet-facing systems or restrict to VPN-only
3. **Snapshot critical systems** — Verify backup integrity now

### Short-Term Hardening (1–7 days)

- Enable **VSS protection** — ransomware deletes shadow copies via `vssadmin`
- Deploy **application allowlisting** on servers
- Enable **PowerShell Script Block Logging** + AMSI
- Segment backups on isolated network — air-gap or immutable storage

### Detection Rules

```
alert process where process.name == "vssadmin.exe" and
  process.args contains "delete shadows"
```

```
alert network where destination.port in [4444, 8443, 1337] and
  not destination.ip in trusted_ranges
```

### Incident Response

1. Isolate affected hosts — cut network, preserve memory
2. Preserve forensic artifacts before reimaging
3. Identify patient zero via EDR telemetry
4. Check for data exfiltration before encryption (double-extortion)""",

    "ioc": """## IOC Behavioral Pattern Analysis

### Dataset Overview

- **150 IOCs** tracked across IP, domain, hash, and URL types
- **Critical severity**: ~15% of total — immediate action required
- **Top attributed actors**: APT29, FIN7, ALPHV/BlackCat

### Suspicious Patterns Detected

**Pattern 1 — C2 Beaconing Infrastructure**
IPs in `185.220.x.x` and `194.165.x.x` ranges show high hit counts with consistent beacon intervals. Associated with Cobalt Strike teamservers.

**Pattern 2 — Domain Generation Algorithm (DGA)**
Several domains follow pseudo-random naming (`cdn-delivery.org`, `sync-manager.net`) — consistent with DGA-based C2.

**Pattern 3 — Hash Clustering**
Multiple file hashes share PE header characteristics — likely same malware family compiled with different keys to evade hash-based blocking.

### Pivot Recommendations

- Pivot from `185.220.x.x` IPs → search associated domains → check passive DNS
- Cross-reference SHA256 hashes against MalwareBazaar for family classification
- Enrich domain IOCs with WHOIS — look for bulk registrations (same registrar, same day)""",

    "apt": """## APT Behavioral Indicators in IOC Dataset

### Indicators Suggesting Nation-State Activity

**Low-and-slow reconnaissance** — IOCs showing repeated low-frequency hits over 30+ days suggest patient actors avoiding detection thresholds.

**Infrastructure reuse** — Multiple IOCs share the same ASN — nation-state actors reuse hosting providers they trust.

**TTP correlation to known APTs**

| Observed Behavior | Likely Actor | MITRE TTP |
|---|---|---|
| Spear-phishing with weaponized Office docs | APT29 | T1566.001 |
| LDAP enumeration post-compromise | Volt Typhoon | T1087.002 |
| Living-off-the-land binaries (LOLBins) | APT29, Volt Typhoon | T1218 |
| Custom C2 over HTTPS port 443 | Lazarus Group | T1071.001 |

### Hunt Queries

```
process.name in ["certutil.exe","mshta.exe","regsvr32.exe"] AND
process.parent.name NOT in ["msiexec.exe","svchost.exe"]
```

```
event.action == "ldap_search" AND
source.user NOT in privileged_accounts
```""",

    "stix": """## STIX/TAXII Threat Intelligence Sharing Standards

### What is STIX?

**STIX** (Structured Threat Information eXpression) is the standardized language for CTI. Version 2.1 is the current standard.

### Core STIX 2.1 Objects

- **Indicator** — Pattern identifying malicious activity (IOC + context)
- **Threat Actor** — Adversary profile (APT29, FIN7, etc.)
- **Malware** — Malware family characteristics and behaviors
- **Attack Pattern** — MITRE ATT&CK techniques in STIX form
- **Relationship** — Links between objects (actor *uses* malware)
- **Bundle** — Container packaging multiple STIX objects for sharing

### Example STIX 2.1 Indicator

```json
{
  "type": "indicator",
  "spec_version": "2.1",
  "id": "indicator--nexus-001",
  "name": "Malicious IP — APT29 C2",
  "pattern": "[ipv4-addr:value = '185.220.101.45']",
  "pattern_type": "stix",
  "valid_from": "2025-08-01T00:00:00Z",
  "labels": ["malicious-activity"],
  "confidence": 90
}
```

### What is TAXII?

**TAXII** (Trusted Automated eXchange of Intelligence Information) is the transport protocol for sharing STIX bundles over HTTPS. Defines Collections and Channels for push/pull sharing between platforms.""",

    "blackcat": """## Incident Response Playbook — ALPHV/BlackCat Ransomware

### Identification Indicators

- File extension changed to random 7-char string (e.g. `.bvhkmplo`)
- Ransom note: `RECOVER-[ext]-FILES.txt` in every directory
- VSS copies deleted via `vssadmin delete shadows /all /quiet`
- Processes terminated: SQL Server, Exchange, backup agents

### Immediate Containment (first 15 minutes)

1. **Isolate** — Disable NIC on affected hosts. Do NOT power off (memory forensics)
2. **Identify scope** — Check which shares are encrypted. Query EDR for `vssadmin` invocations
3. **Preserve** — Memory dump before any remediation
4. **Notify** — Engage IR team, legal, CISO. BlackCat uses double-extortion — assume data was exfiltrated

### Investigation Timeline

- **T+0**: Ransomware executes, encryption begins
- **T-24h to T-7d**: Data exfiltration via Rclone to cloud storage
- **T-7d to T-30d**: Lateral movement, persistence, credential harvesting

### Recovery

1. Restore from offline/immutable backups ONLY after confirmed clean reimaging
2. Reset ALL domain credentials — assume full compromise
3. Rebuild AD from scratch if domain controller was encrypted""",

    "soc": """## SOC Analyst IOC Investigation Workflow

### Step 1 — Triage

Determine IOC type (IP, domain, hash, URL) and pull initial context:
- First/last seen dates — recency matters
- Hit count — high frequency = active threat
- Source reliability — internal sensor > OSINT feed

### Step 2 — Enrich

| IOC Type | Enrichment Sources |
|---|---|
| IP | VirusTotal, Shodan, AbuseIPDB, BGP/ASN lookup |
| Domain | WHOIS, passive DNS, URLScan.io |
| Hash | VirusTotal, MalwareBazaar, ANY.RUN sandbox |
| URL | URLScan.io, Google Safe Browsing, PhishTank |

### Step 3 — Pivot

- **IP → Domains**: Reverse DNS, passive DNS history
- **Domain → IPs**: Current + historical A records
- **Hash → C2**: Extract network indicators from sandbox report
- **Actor → TTPs**: Pull MITRE ATT&CK profile → hunt for those techniques in logs

### Step 4 — Correlate

Search SIEM for the IOC across: Firewall/proxy logs, DNS queries, EDR telemetry, Email gateway logs

### Step 5 — Respond

- **Confirmed malicious** → Block at firewall, quarantine host, open incident ticket
- **Suspicious** → Add to watchlist, increase monitoring
- **False positive** → Document and whitelist to reduce alert fatigue""",

    "default": """## Threat Intelligence Analysis

Based on current platform data:

### Platform Status
- **150 IOCs** actively tracked across all indicator types
- **6 high-priority threat actors** profiled and monitored
- **Environment risk score**: 7.8/10 — elevated
- **Active campaigns**: 12 tracked

### Current Priority Threats

1. **ALPHV/BlackCat** — Ransomware infrastructure actively updated. New binary variants evading signature detection.
2. **APT29 (Cozy Bear)** — Spear-phishing campaigns targeting defense and government sectors.
3. **Volt Typhoon** — Pre-positioning in critical infrastructure using living-off-the-land techniques.

### Recommended Actions

- Apply all **critical-severity IOCs** to blocking rules immediately
- Ensure **EDR coverage** across all endpoints
- Validate **backup integrity** — ransomware groups target backup systems first
- Enable **network traffic analysis** — detect C2 beaconing and DNS tunneling

**Try asking about:**
- A specific threat actor (APT29, Lazarus Group, ALPHV)
- MITRE ATT&CK technique coverage
- Ransomware incident response playbook
- IOC investigation methodology
- STIX/TAXII intelligence sharing""",
}


def get_mock_response(query: str) -> str:
    q = query.lower()
    if any(w in q for w in ["landscape", "highest-risk", "top actor", "current threat"]):
        return MOCK_RESPONSES["threat landscape"]
    if any(w in q for w in ["mitre", "att&ck", "technique", "tactic"]):
        return MOCK_RESPONSES["mitre"]
    if any(w in q for w in ["ransomware", "defensive recommendation", "protect against"]):
        return MOCK_RESPONSES["ransomware"]
    if any(w in q for w in ["ioc", "indicator", "behavioral pattern", "dataset", "summarize"]):
        return MOCK_RESPONSES["ioc"]
    if any(w in q for w in ["apt", "nation-state", "advanced persistent"]):
        return MOCK_RESPONSES["apt"]
    if any(w in q for w in ["stix", "taxii", "sharing", "intelligence sharing"]):
        return MOCK_RESPONSES["stix"]
    if any(w in q for w in ["blackcat", "alphv", "playbook", "incident response"]):
        return MOCK_RESPONSES["blackcat"]
    if any(w in q for w in ["soc", "analyst", "pivot", "investigate", "how should"]):
        return MOCK_RESPONSES["soc"]
    return MOCK_RESPONSES["default"]


@router.post("/analyze")
async def analyze(
    payload: AnalysisRequest,
    _: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_messages = [m for m in payload.messages if m.role == "user"]
    last_query = user_messages[-1].content if user_messages else ""
    if "]\n\n" in last_query:
        last_query = last_query.split("]\n\n", 1)[1]
    return {"response": get_mock_response(last_query)}