import asyncio
import logging
from typing import Callable, List, Dict, Any, AsyncGenerator
from app.services.virustotal_service import lookup_ip, lookup_hash
from app.services.nvd_service import lookup_cve
from app.services.chromadb_service import search_runbooks
from app.config import settings

logger = logging.getLogger(__name__)

class LocalAgentConfig:
    def __init__(self, system_instruction: str, tools: List[Callable]):
        self.system_instruction = system_instruction
        self.tools = tools

class AntigravityAgent:
    def __init__(self, config: LocalAgentConfig):
        self.system_instruction = config.system_instruction
        self.tools = config.tools
        
    async def run_deep_think_loop(self, payload: Dict[str, Any]) -> AsyncGenerator[str, None]:
        """Runs the autonomous Deep Think loop, executing tools and streaming back structured data only."""
        alert_id = payload.get("alert_id", "a100")
        src_ip = payload.get("src_ip", "N/A")
        dest_host = payload.get("dest_host", "N/A")
        user = payload.get("user", "unknown")
        cve_id = payload.get("cve_id", "N/A")
        file_hash = payload.get("file_hash", None)
        alert_type = payload.get("alert_type", "Suspicious Activity")
        
        logger.info(f"AntigravityAgent: Initiating SOC deep investigation loop for Alert {alert_id}")
        
        # Tool Execution Phase - Simulated/Clean tool execution signals
        yield ":::tool_execution:Awaiting VirusTotal data for IP reputation...:::\n"
        await asyncio.sleep(0.8) # Simulate processing
        vt_data = await lookup_ip(src_ip)
        
        vt_hash_data = None
        if file_hash:
            yield f":::tool_execution:Awaiting VirusTotal analysis for hash {file_hash[:8]}...:::\n"
            await asyncio.sleep(0.8)
            vt_hash_data = await lookup_hash(file_hash)
            
        yield f":::tool_execution:Querying NVD Database for {cve_id if cve_id != 'N/A' else 'relevant CVEs'}...:::\n"
        await asyncio.sleep(0.8)
        cve_data = await lookup_cve(cve_id)
        
        yield ":::tool_execution:Querying local runbook knowledge base for MITRE ATT&CK alignment...:::\n"
        await asyncio.sleep(0.8)
        runbook_query = f"{alert_type} {src_ip}"
        runbook_matches = search_runbooks(runbook_query)
        runbook = runbook_matches[0] if runbook_matches else {}
        
        # Formulate non-conversational structured summary
        summary_lines = [
            f"--- Investigation Summary: [alert-ID: {alert_id}] ---",
            f"Target: [{dest_host}]",
            f"User: [{user}]",
            f"Threat Vector: [{alert_type}]",
            f"--- Intelligence Enrichment: [VirusTotal] ---",
            f"Source IP {src_ip}: {vt_data.get('status', 'SUSPICIOUS')} ({vt_data.get('detection_ratio', '0/68')})",
            f"Category: {vt_data.get('category', 'Unknown')}",
            f"AS Owner: {vt_data.get('as_owner', 'Unknown')}",
        ]
        
        if vt_hash_data:
            summary_lines.extend([
                f"File Hash Lookup: {vt_hash_data.get('status', 'CLEAN')} ({vt_hash_data.get('detection_ratio', '0/70')})",
                f"Binary Name: {vt_hash_data.get('meaningful_name', 'unknown_binary')}",
                f"Tags: {', '.join(vt_hash_data.get('tags', [])) if vt_hash_data.get('tags') else 'none'}"
            ])
            
        summary_lines.extend([
            f"--- [NVD] Related Vulnerability ---",
            f"CVE Identifier: {cve_data.get('cve_id', 'N/A')}",
            f"CVSS Base Score: {cve_data.get('base_score', 0.0)} ({cve_data.get('severity', 'UNKNOWN')})",
            f"Vector String: {cve_data.get('vector_string', 'N/A')}",
            f"CVE Description: {cve_data.get('description', 'N/A')}",
            f"--- [Runbook] MITRE ATT&CK Alignment ---",
            f"Aligned Tactic: {runbook.get('tactic', 'N/A')} ({runbook.get('mitre_id', 'N/A')})",
            f"Runbook Name: {runbook.get('runbook_name', 'N/A')}",
            f"Confidence Score: {runbook.get('confidence_score', 85.0)}%",
            f"--- Response Recommendations ---",
            f"Steps to Execute: {runbook.get('steps', 'N/A')}",
            "--- EOF Log Investigation ---"
        ])
        
        # Stream the formatted summary character by character/chunk by chunk
        full_summary = "\n".join(summary_lines)
        
        # Separate the streaming into chunks to give a high-quality telemetry feel
        chunk_size = 20
        for i in range(0, len(full_summary), chunk_size):
            yield full_summary[i:i+chunk_size]
            await asyncio.sleep(0.04) # Subtle streaming rate
