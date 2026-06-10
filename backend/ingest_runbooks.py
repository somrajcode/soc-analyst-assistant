import os
import sys

from app.config import settings


def ingest_mitre_runbooks():
    print("==================================================")
    print("     Vigilance.ai - Runbook Ingestion Script      ")
    print("==================================================")
    print("This project is configured to use static runbook fallbacks, so no native dependency ingestion is required.")
    print("The static MITRE ATT&CK runbook fallback is already available for analysis.")
    print("==================================================")


if __name__ == "__main__":
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    ingest_mitre_runbooks()
