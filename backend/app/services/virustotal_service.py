import httpx
import logging
from app.config import settings

logger = logging.getLogger(__name__)

async def lookup_ip(ip: str) -> dict:
    """Queries VirusTotal API for IP address reputation, with high-fidelity simulated fallback."""
    if not settings.VIRUSTOTAL_API_KEY or "your_virustotal_api_key" in settings.VIRUSTOTAL_API_KEY or settings.VIRUSTOTAL_API_KEY == "":
        return get_simulated_ip_data(ip)
    
    url = f"https://www.virustotal.com/api/v3/ip_addresses/{ip}"
    headers = {"x-apikey": settings.VIRUSTOTAL_API_KEY}
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                data = response.json().get("data", {})
                attributes = data.get("attributes", {})
                stats = attributes.get("last_analysis_stats", {})
                malicious = stats.get("malicious", 0)
                total = sum(stats.values())
                
                # Get category/tags
                categories = attributes.get("categories", {})
                primary_category = next(iter(categories.values())) if categories else "Unknown"
                
                return {
                    "provider": "VirusTotal",
                    "status": "MALICIOUS" if malicious > 5 else "SUSPICIOUS" if malicious > 0 else "CLEAN",
                    "detection_ratio": f"{malicious}/{total}",
                    "malicious_count": malicious,
                    "total_count": total,
                    "category": primary_category,
                    "reputation": attributes.get("reputation", 0),
                    "as_owner": attributes.get("as_owner", "Unknown Provider"),
                    "country": attributes.get("country", "Unknown")
                }
            else:
                logger.warning(f"VirusTotal IP lookup returned status {response.status_code}. Using fallback.")
                return get_simulated_ip_data(ip)
    except Exception as e:
        logger.error(f"Error querying VirusTotal IP API: {e}. Using fallback.")
        return get_simulated_ip_data(ip)

async def lookup_hash(file_hash: str) -> dict:
    """Queries VirusTotal API for file hash reputation, with high-fidelity simulated fallback."""
    if not settings.VIRUSTOTAL_API_KEY or "your_virustotal_api_key" in settings.VIRUSTOTAL_API_KEY or settings.VIRUSTOTAL_API_KEY == "":
        return get_simulated_hash_data(file_hash)
        
    url = f"https://www.virustotal.com/api/v3/files/{file_hash}"
    headers = {"x-apikey": settings.VIRUSTOTAL_API_KEY}
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                data = response.json().get("data", {})
                attributes = data.get("attributes", {})
                stats = attributes.get("last_analysis_stats", {})
                malicious = stats.get("malicious", 0)
                total = sum(stats.values())
                
                return {
                    "provider": "VirusTotal",
                    "status": "MALICIOUS" if malicious > 5 else "SUSPICIOUS" if malicious > 0 else "CLEAN",
                    "detection_ratio": f"{malicious}/{total}",
                    "malicious_count": malicious,
                    "total_count": total,
                    "meaningful_name": attributes.get("meaningful_name", "unknown_binary"),
                    "type_description": attributes.get("type_description", "Binary Executable"),
                    "size": attributes.get("size", 0),
                    "tags": attributes.get("tags", [])
                }
            else:
                logger.warning(f"VirusTotal hash lookup returned status {response.status_code}. Using fallback.")
                return get_simulated_hash_data(file_hash)
    except Exception as e:
        logger.error(f"Error querying VirusTotal hash API: {e}. Using fallback.")
        return get_simulated_hash_data(file_hash)

def get_simulated_ip_data(ip: str) -> dict:
    """Generates high-fidelity mock details for IP addresses based on realistic SOC alerts."""
    # Simulated database for demo robustness
    threat_db = {
        "185.190.140.23": {
            "status": "MALICIOUS",
            "detection_ratio": "42/72",
            "malicious_count": 42,
            "total_count": 72,
            "category": "Botnet/C2 Server",
            "reputation": -85,
            "as_owner": "Chunghwa Telecom Co., Ltd.",
            "country": "TW"
        },
        "45.227.254.12": {
            "status": "MALICIOUS",
            "detection_ratio": "21/68",
            "malicious_count": 21,
            "total_count": 68,
            "category": "SSH Brute Force Bot",
            "reputation": -45,
            "as_owner": "Hostinger International Ltd.",
            "country": "NL"
        },
        "193.56.29.44": {
            "status": "MALICIOUS",
            "detection_ratio": "54/74",
            "malicious_count": 54,
            "total_count": 74,
            "category": "Phishing/Credential Harvesting",
            "reputation": -110,
            "as_owner": "DigitalOcean, LLC",
            "country": "US"
        }
    }
    
    # Default return if not in DB (simulated benign/suspicious lookup)
    return threat_db.get(ip, {
        "provider": "VirusTotal (Simulated)",
        "status": "SUSPICIOUS" if ip.startswith("192.168") or ip.startswith("10.") else "SUSPICIOUS",
        "detection_ratio": "3/68" if not (ip.startswith("192.168") or ip.startswith("10.")) else "0/68",
        "malicious_count": 3 if not (ip.startswith("192.168") or ip.startswith("10.")) else 0,
        "total_count": 68,
        "category": "Suspicious Port Scanner" if not (ip.startswith("192.168") or ip.startswith("10.")) else "Local RFC1918 Private IP",
        "reputation": -5 if not (ip.startswith("192.168") or ip.startswith("10.")) else 0,
        "as_owner": "Private IPv4 Subnet" if (ip.startswith("192.168") or ip.startswith("10.")) else "Unknown Autonomous System",
        "country": "LOCAL" if (ip.startswith("192.168") or ip.startswith("10.")) else "DE"
    })

def get_simulated_hash_data(file_hash: str) -> dict:
    """Generates high-fidelity mock details for file hashes based on realistic SOC alerts."""
    hash_db = {
        "d2f8e12c5b963a789efd123456789abc": {
            "status": "MALICIOUS",
            "detection_ratio": "57/70",
            "malicious_count": 57,
            "total_count": 70,
            "meaningful_name": "mimikatz.exe",
            "type_description": "Win32 DLL/Executable",
            "size": 1245088,
            "tags": ["credential-stealer", "lsass-dump", "hacktool"]
        },
        "7e9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c": {
            "status": "MALICIOUS",
            "detection_ratio": "49/71",
            "malicious_count": 49,
            "total_count": 71,
            "meaningful_name": "cobaltstrike_beacon.bin",
            "type_description": "Raw Shellcode",
            "size": 284102,
            "tags": ["c2-agent", "trojan", "cobalt-strike"]
        }
    }
    
    return hash_db.get(file_hash, {
        "provider": "VirusTotal (Simulated)",
        "status": "CLEAN",
        "detection_ratio": "0/70",
        "malicious_count": 0,
        "total_count": 70,
        "meaningful_name": "unknown_file.bin",
        "type_description": "Unknown Data File",
        "size": 4096,
        "tags": []
    })
