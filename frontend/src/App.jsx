import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, AlertTriangle, Terminal, Cpu, CheckCircle, Play, 
  FileText, Activity, AlertCircle, Trash2, Ban, Radio, Globe, 
  Settings, RefreshCw, Send, Lock
} from 'lucide-react';

// Pre-seeded high-fidelity alerts
const INITIAL_ALERTS = [
  {
    time: "18:29:45",
    id: "a105",
    srcIp: "45.227.254.12",
    destHost: "web-server-alpha",
    user: "admin",
    alertType: "SSH Brute Force",
    severity: "high",
    status: "Active",
    cveId: "CVE-2023-34992",
    location: "Mumbai, IN"
  },
  {
    time: "18:28:10",
    id: "a104",
    srcIp: "185.190.140.23",
    destHost: "metabase-prod-01",
    user: "root",
    alertType: "RCE Injection Attempt",
    severity: "critical",
    status: "Investigating",
    cveId: "CVE-2023-38646",
    location: "Bengaluru, IN"
  },
  {
    time: "18:25:34",
    id: "a103",
    srcIp: "193.56.29.44",
    destHost: "ad-controller-01",
    user: "d_smith",
    alertType: "OS Credential Dumping",
    severity: "critical",
    status: "Mitigated",
    fileHash: "d2f8e12c5b963a789efd123456789abc",
    cveId: "CVE-2021-44228",
    location: "New Delhi, IN"
  },
  {
    time: "18:21:12",
    id: "a102",
    srcIp: "84.21.173.8",
    destHost: "billing-db-01",
    user: "postgres",
    alertType: "SQL Injection Probe",
    severity: "medium",
    status: "Active",
    cveId: "CVE-2023-23397",
    location: "Chennai, IN"
  },
  {
    time: "18:15:02",
    id: "a101",
    srcIp: "10.0.4.82",
    destHost: "internal-reporting",
    user: "system_cron",
    alertType: "Privilege Escalation",
    severity: "medium",
    status: "Closed",
    cveId: "N/A",
    location: "Hyderabad, IN"
  }
];

const CHART_DATA = [
  { time: "18:00", val: 30 },
  { time: "18:05", val: 45 },
  { time: "18:10", val: 22 },
  { time: "18:15", val: 18 },
  { time: "18:20", val: 28 },
  { time: "18:25", val: 65 },
  { time: "18:30", val: 150 },
  { time: "18:35", val: 195 },
  { time: "18:40", val: 240 },
  { time: "18:45", val: 190 },
  { time: "18:50", val: 130 },
  { time: "18:55", val: 105 }
];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export default function App() {
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [selectedAlert, setSelectedAlert] = useState(INITIAL_ALERTS[0]);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [consoleInput, setConsoleInput] = useState(`/investigate ${INITIAL_ALERTS[0].id} --enrichment-details`);
  const [streamedResponse, setStreamedResponse] = useState("");
  const [toolExecutionState, setToolExecutionState] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  // Map zoom & pan state
  const [mapScale, setMapScale] = useState(1);
  const [mapTranslate, setMapTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef(null);
  const [mitigationMessage, setMitigationMessage] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginCompanyId, setLoginCompanyId] = useState("");
  const [authError, setAuthError] = useState("");
  const [activeUser, setActiveUser] = useState({ username: "", companyId: "" });
  const [investigationTimeout, setInvestigationTimeout] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const consoleEndRef = useRef(null);

  // Handle responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Commented out session restoration to ensure the login page always opens first
  /*
  useEffect(() => {
    const session = window.localStorage.getItem("vigilance_session");
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed?.token && parsed?.username && parsed?.company_id) {
          setIsAuthenticated(true);
          setAuthToken(parsed.token);
          setActiveUser({ username: parsed.username, companyId: parsed.company_id });
        }
      } catch (error) {
        console.warn("Failed to restore session", error);
      }
    }
  }, []);
  */

  const handleLoginSubmit = async (event) => {
    event.preventDefault();

    if (!loginPassword || !loginCompanyId) {
      setAuthError("Company ID and password are required.");
      return;
    }

    setAuthLoading(true);
    setAuthError("");

    // Fallback static credentials for offline demo/Vercel compatibility
    const OFFLINE_CREDENTIALS = {
      "SOC-VPER28": "StringLA",
      "SOC-VPER27": "StringBA",
      "SOC": "Demo"
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: loginCompanyId, password: loginPassword })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.detail || 'Invalid credentials');
      }

      const data = await response.json();
      setActiveUser({ username: data.username || 'Analyst', companyId: data.company_id });
      setAuthToken(data.access_token);
      setIsAuthenticated(true);
      window.localStorage.setItem(
        'vigilance_session',
        JSON.stringify({ username: data.username || 'Analyst', company_id: data.company_id, token: data.access_token })
      );
      setLoginPassword('');
    } catch (error) {
      // Check if it's a connection/fetch error
      const isFetchError = error.message && (
        error.message.toLowerCase().includes("failed to fetch") || 
        error.message.toLowerCase().includes("load failed") ||
        error.message.toLowerCase().includes("networkerror")
      );

      if (isFetchError) {
        const expectedPassword = OFFLINE_CREDENTIALS[loginCompanyId];
        if (expectedPassword && loginPassword === expectedPassword) {
          console.warn("Backend server offline. Logging in via client-side demo fallback.");
          const mockToken = "mock-session-token-" + Date.now();
          setActiveUser({ username: 'Analyst', companyId: loginCompanyId });
          setAuthToken(mockToken);
          setIsAuthenticated(true);
          window.localStorage.setItem(
            'vigilance_session',
            JSON.stringify({ username: 'Analyst', company_id: loginCompanyId, token: mockToken })
          );
          setLoginPassword('');
          return;
        } else {
          setAuthError("Invalid company ID or password (Offline Mode).");
          return;
        }
      }

      setAuthError(error.message || 'Unable to authenticate.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    window.localStorage.removeItem("vigilance_session");
    setIsAuthenticated(false);
    setAuthToken("");
    setActiveUser({ username: "", companyId: "" });
  };

  // Auto-scroll investigation log
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [streamedResponse, toolExecutionState]);

  // Simulate incoming live alerts
  useEffect(() => {
    const interval = setInterval(() => {
      const randomIps = ["80.241.218.115", "103.44.192.84", "45.142.120.35"];
      const randomHosts = ["app-gateway-02", "mail-exchange-01", "finance-api"];
      const randomTypes = ["Brute Force Attempt", "Malicious Binary Execution", "Vigilance.ai"];
      const locations = ["Russia", "India", "Netherlands"];
      const cves = ["CVE-2023-38646", "CVE-2021-44228", "N/A"];
      const severities = ["high", "critical", "medium"];
      
      const newAlert = {
        time: new Date().toTimeString().split(' ')[0],
        id: `a${Math.floor(Math.random() * 900) + 200}`,
        srcIp: randomIps[Math.floor(Math.random() * randomIps.length)],
        destHost: randomHosts[Math.floor(Math.random() * randomHosts.length)],
        user: "admin",
        alertType: randomTypes[Math.floor(Math.random() * randomTypes.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        status: "Active",
        cveId: cves[Math.floor(Math.random() * cves.length)],
        location: locations[Math.floor(Math.random() * locations.length)]
      };

      setAlerts(prev => [newAlert, ...prev.slice(0, 7)]);
    }, 20000); // New alert every 20 seconds to keep feed lively

    return () => clearInterval(interval);
  }, []);

  // Update command line value when selecting alert
  const handleSelectAlert = (alert) => {
    setSelectedAlert(alert);
    setConsoleInput(`/investigate ${alert.id} --enrichment-details`);
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const zoom = (delta, center) => {
    setMapScale((prev) => clamp(prev * (1 + delta), 0.5, 3));
    // optional: adjust translate to focus on center (not implemented to keep simple)
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    zoom(delta);
  };

  const handleMouseDown = (e) => {
    setIsPanning(true);
    panStartRef.current = { x: e.clientX, y: e.clientY, tx: mapTranslate.x, ty: mapTranslate.y };
  };

  const handleMouseMove = (e) => {
    if (!isPanning || !panStartRef.current) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    setMapTranslate({ x: panStartRef.current.tx + dx, y: panStartRef.current.ty + dy });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    panStartRef.current = null;
  };

  const resetMap = () => {
    setMapScale(1);
    setMapTranslate({ x: 0, y: 0 });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (investigationTimeout) clearTimeout(investigationTimeout);
    };
  }, [investigationTimeout]);

  // Run autonomous analysis pipeline with timeout protection
  const handleRunInvestigation = async (e) => {
    if (e) e.preventDefault();
    if (isStreaming) return;
    
    setIsStreaming(true);
    setStreamedResponse("");
    setToolExecutionState("Initiating SOC Analysis Deep Think Loop...");

    const payload = {
      alert_id: selectedAlert.id,
      src_ip: selectedAlert.srcIp,
      dest_host: selectedAlert.destHost,
      user: selectedAlert.user,
      cve_id: selectedAlert.cveId,
      file_hash: selectedAlert.fileHash || null,
      alert_type: selectedAlert.alertType
    };

    // Create abort controller for timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
      setIsStreaming(false);
      setToolExecutionState(null);
      setStreamedResponse(prev => prev + "\n[Investigation timed out after 30s - running offline analysis]\n");
      runLocalSimulation(payload).catch(() => {});
    }, 30000);

    try {
      // Attempt backend API stream call
      const headers = { "Content-Type": "application/json" };
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      const response = await fetch(`${API_BASE_URL}/api/v1/analyze`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: abortController.signal
      });

      if (!response.ok) {
        throw new Error("Local API server offline");
      }

      setToolExecutionState(null);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        
        // Parse tool execution messages
        const toolMatch = text.match(/:::tool_execution:(.*?):::/);
        if (toolMatch) {
          setToolExecutionState(toolMatch[1]);
        } else {
          setToolExecutionState(null);
          setStreamedResponse(prev => prev + text);
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn("Backend unavailable. Running high-fidelity offline simulation loop...");
        await runLocalSimulation(payload);
      }
    } finally {
      clearTimeout(timeoutId);
      setIsStreaming(false);
      setToolExecutionState(null);
    }
  };

  // Safe offline high-fidelity simulator representing exactly backend services
  const runLocalSimulation = async (payload) => {
    const steps = [
      { text: "Awaiting VirusTotal data for IP reputation...", delay: 1000 },
      { text: `Querying NVD Database for ${payload.cve_id}...`, delay: 1000 },
      { text: "Querying local ChromaDB vector space for MITRE runbooks...", delay: 1000 }
    ];

    for (let step of steps) {
      setToolExecutionState(step.text);
      await new Promise(r => setTimeout(r, step.delay));
    }
    
    setToolExecutionState(null);
    
    const simulatedSummary = `--- Investigation Summary: [alert-ID: ${payload.alert_id}] ---
Target: [${payload.dest_host}]
User: [${payload.user}]
Threat Vector: [${payload.alert_type}]
--- Intelligence Enrichment: [VirusTotal] ---
Source IP ${payload.src_ip}: MALICIOUS (21/68)
Category: Botnet/Credentials-Scanning
AS Owner: Hostinger International Ltd.
Country: NL
--- [NVD] Related Vulnerability ---
CVE Identifier: ${payload.cve_id !== "N/A" ? payload.cve_id : "CVE-2023-34992"}
CVSS Base Score: 9.8 (CRITICAL)
Vector String: CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H
CVE Description: Standard remote unauthenticated exploit parameters allow arbitrary remote command execution through system setup tokens.
--- [ChromaDB] MITRE ATT&CK Alignment ---
Aligned Tactic: Credential Access (T1110)
Runbook Name: SSH Brute Force Remediation Playbook
Confidence Score: 94.2%
--- Response Recommendations ---
Steps to Execute: 1. Extract source IP from logs. 2. Verify threat reputation with VT. 3. Block malicious IP at firewall/WAF. 4. Force admin credential reset. 5. Enforce Multi-Factor Authentication.
--- EOF Log Investigation ---`;

    // Stream text in
    let i = 0;
    while (i < simulatedSummary.length) {
      const chunkSize = Math.min(15, simulatedSummary.length - i);
      setStreamedResponse(prev => prev + simulatedSummary.substring(i, i + chunkSize));
      i += chunkSize;
      await new Promise(r => setTimeout(r, 30));
    }
  };

  const handleGenerateReport = async () => {
    if (reportLoading) return;
    setReportLoading(true);
    setReportMessage("");

    const reportPayload = {
      alert_id: selectedAlert.id,
      src_ip: selectedAlert.srcIp,
      dest_host: selectedAlert.destHost,
      user: selectedAlert.user,
      cve_id: selectedAlert.cveId,
      file_hash: selectedAlert.fileHash || null,
      alert_type: selectedAlert.alertType,
      analysis_text: streamedResponse || `Investigation produced no streamed analysis for alert ${selectedAlert.id}.`,
    };

    try {
      const headers = { "Content-Type": "application/json" };
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      const response = await fetch(`${API_BASE_URL}/api/v1/report`, {
        method: "POST",
        headers,
        body: JSON.stringify(reportPayload)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.detail || "Unable to generate PDF report.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `vigilance-report-${selectedAlert.id}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      setReportMessage("PDF report generated and downloaded successfully.");
    } catch (error) {
      const isFetchError = error.message && (
        error.message.toLowerCase().includes("failed to fetch") || 
        error.message.toLowerCase().includes("load failed") ||
        error.message.toLowerCase().includes("networkerror")
      );

      if (isFetchError) {
        console.warn("Backend offline. Generating text report client-side.");
        const textContent = `VIGILANCE.AI - LOG ANALYSIS REPORT\n====================================\nAlert ID: ${reportPayload.alert_id}\nSource IP: ${reportPayload.src_ip}\nDestination Host: ${reportPayload.dest_host}\nUser: ${reportPayload.user}\nAlert Type: ${reportPayload.alert_type}\nCVE: ${reportPayload.cve_id}\n\nAnalysis Summary:\n-----------------\n${reportPayload.analysis_text}\n`;
        const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `vigilance-report-${selectedAlert.id}.txt`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.URL.revokeObjectURL(url);
        setReportMessage("Text report generated and downloaded successfully (Offline Fallback).");
        return;
      }
      setReportMessage(error.message || "PDF generation failed.");
    } finally {
      setReportLoading(false);
      setTimeout(() => setReportMessage(""), 7000);
    }
  };

  const handleMitigation = (action) => {
    setMitigationMessage(`Executing ${action}... Complete! System state stabilized.`);
    setTimeout(() => setMitigationMessage(null), 4000);
  };

  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen overflow-hidden app-shell">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.15),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.1),transparent_25%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#030712,#090d16)]" />

        <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 sm:px-6 py-6 sm:py-10">
          <div className="grid w-full gap-6 sm:gap-8 grid-cols-1 md:grid-cols-[1fr_420px]">
            <section className="glass-card rounded-3xl sm:rounded-[32px] border border-slate-800/80 p-6 sm:p-10 shadow-2xl">
              <div className="space-y-5 sm:space-y-7">
                <div className="inline-flex items-center gap-2 sm:gap-3 rounded-full border border-cyan-500/20 bg-cyan-950/40 px-3 sm:px-4 py-1.5 sm:py-2 text-xs uppercase tracking-[0.2em] sm:tracking-[0.32em] text-cyan-400 font-semibold shadow-[0_0_15px_rgba(6,182,212,0.05)]">
                  <Shield className="h-4 w-4 text-cyan-400" />
                  <span className="hidden sm:inline">Vigilance.ai</span>
                  <span className="sm:hidden">Vigilance</span>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-100">Vigilance.ai</h1>
                  <p className="max-w-2xl text-sm sm:text-base text-slate-400 leading-6 sm:leading-8">AI-enabled Human-Centric SOC Assistant Dashboard</p>
                </div>

                <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-2">
                  <div className="glass-soft rounded-2xl sm:rounded-3xl border border-slate-800/80 p-4 sm:p-5">
                    <p className="text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-slate-600 font-semibold font-mono">Region</p>
                    <p className="mt-2 sm:mt-3 text-xl sm:text-2xl font-semibold text-emerald-400">India</p>
                  </div>
                  <div className="glass-soft rounded-2xl sm:rounded-3xl border border-slate-800/80 p-4 sm:p-5">
                    <p className="text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-slate-600 font-semibold font-mono">Mode</p>
                    <p className="mt-2 sm:mt-3 text-xl sm:text-2xl font-semibold text-cyan-400">Live Threat Ops</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="glass-card rounded-3xl sm:rounded-[32px] border border-cyan-500/10 p-6 sm:p-8 shadow-2xl">
              <div className="mb-6 sm:mb-8">
                <span className="text-[10px] uppercase tracking-[0.3em] text-cyan-400 font-bold font-mono">Authentication</span>
                <h2 className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-100">Sign in to vigilance.ai</h2>
                <p className="mt-2 text-sm text-slate-400 leading-6">Use your Company ID and password to open the SOC dashboard.</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4 sm:space-y-5">
                <div className="space-y-2">
                  <label className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-semibold font-mono">Company ID</label>
                  <input
                    type="text"
                    value={loginCompanyId}
                    onChange={(e) => setLoginCompanyId(e.target.value)}
                    className="w-full rounded-2xl sm:rounded-[20px] border border-slate-800 bg-slate-950/40 px-3 sm:px-4 py-2.5 sm:py-3 text-slate-100 text-sm outline-none transition focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/10 placeholder-slate-700"
                    placeholder="SOC-VPER28"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-semibold font-mono">Password</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full rounded-2xl sm:rounded-[20px] border border-slate-800 bg-slate-950/40 px-3 sm:px-4 py-2.5 sm:py-3 text-slate-100 text-sm outline-none transition focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/10 placeholder-slate-700"
                    placeholder="••••••••"
                  />
                </div>

                {authError && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-red-400 leading-5 sm:leading-6 font-mono">{authError}</div>}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-slate-950 transition hover:from-cyan-400 hover:to-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(6,182,212,0.15)] transform active:scale-95 duration-150"
                </button>
              </form>
              <div className="mt-6 text-center text-[10px] text-slate-500 font-mono tracking-wider">
                &copy; Somraj Laskar 2026
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen flex flex-col overflow-hidden app-shell font-sans text-slate-100 antialiased">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.12),transparent_20%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.08),transparent_20%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#030712,#080c16)]" />

      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 flex flex-col sm:flex-row h-auto sm:h-16 items-start sm:items-center justify-between gap-2 sm:gap-0 border-b border-slate-800/80 bg-slate-950/90 px-4 sm:px-6 py-2 sm:py-0 backdrop-blur-xl shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="bg-cyan-950/40 border border-cyan-500/20 p-2 rounded-xl transition-all hover:scale-105 duration-200">
            <Shield className="h-4 w-4 text-cyan-400" />
          </div>
          <div>
            <span className="font-bold tracking-widest text-xs sm:text-sm text-slate-100 font-mono">VIGILANCE.AI</span>
            <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono ml-1 sm:ml-2 border-l border-slate-800 pl-1 sm:pl-2 hidden sm:inline tracking-wider">AUTONOMOUS SOC ENGINE</span>
          </div>
        </div>
        
        {/* Core telemetry details */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[9px] sm:text-[11px] font-mono text-slate-400 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-500/25 text-emerald-400 px-2.5 py-1 rounded-full text-[9px] font-semibold tracking-wider">
            <Radio className="h-2.5 w-2.5 text-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">AGENT: ACTIVE</span>
            <span className="sm:hidden">ACTIVE</span>
          </div>
          <div className="hidden md:block bg-slate-900/60 border border-slate-800/80 text-slate-400 px-2.5 py-1 rounded-full text-[9px] font-semibold tracking-wider">VER: <span className="text-slate-200">1.0.0-PRO</span></div>
          <div className="hidden lg:block bg-slate-900/45 border border-slate-800/60 text-slate-500 px-2.5 py-1 rounded-full text-[9px] font-mono">
            &copy; Somraj Laskar 2026
          </div>
          <div className="flex items-center gap-1 bg-cyan-950/40 border border-cyan-500/25 text-cyan-400 px-2.5 py-1 rounded-full text-[9px] font-semibold tracking-wider">
            <span className="hidden sm:inline text-slate-500">USER:</span>
            <span className="text-cyan-300 font-semibold truncate">{activeUser.companyId || 'SOC'}</span>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-md border border-slate-700/60 bg-slate-900/80 hover:bg-red-950/30 hover:border-red-500/40 hover:text-red-400 transition-all duration-200 px-3.5 py-1 text-[9px] tracking-wider font-semibold uppercase"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Split Pane Layout */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden w-full relative">
        
        {/* Left Pane: Active Threat Feed */}
        <section className="w-full lg:w-[38%] h-auto lg:h-full border-b lg:border-r lg:border-b-0 border-slate-800 bg-[#060a12]/80 flex flex-col overflow-hidden shrink-0 max-h-[40vh] lg:max-h-none backdrop-blur-md">
          <div className="p-3 sm:p-4 border-b border-slate-800/80 bg-slate-900/30 flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-cyan-400 animate-pulse" />
              <h2 className="text-xs font-bold tracking-wider uppercase text-slate-200 font-mono hidden sm:inline">Active Threat Feed</h2>
              <h2 className="text-xs font-bold tracking-wider uppercase text-slate-200 font-mono sm:hidden">Alerts</h2>
            </div>
            <span className="text-[7px] sm:text-[9px] font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold animate-pulse">Live</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 text-[8px] sm:text-[9px] uppercase font-mono text-slate-500 bg-slate-950">
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3 hidden sm:table-cell">Alert ID</th>
                  <th className="py-2.5 px-3 hidden md:table-cell">Source IP</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Sev</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30 text-xs sm:text-sm font-mono">
                {alerts.map((alert, idx) => {
                  const isSelected = selectedAlert.id === alert.id;
                  return (
                    <tr 
                      key={alert.id}
                      onClick={() => handleSelectAlert(alert)}
                      className={`cursor-pointer transition-all duration-150 relative ${
                        isSelected 
                          ? 'bg-cyan-950/20 text-cyan-400 shadow-[inset_3px_0_0_0_#06b6d4,0_0_15px_rgba(6,182,212,0.05)] border-l-0' 
                          : 'hover:bg-slate-900/50 hover:text-cyan-400 text-slate-300'
                      }`}
                    >
                      <td className="py-3 px-3 text-slate-500 text-[9px] sm:text-[11px]">{alert.time}</td>
                      <td className="py-3 px-3 font-semibold text-[8px] sm:text-sm hidden sm:table-cell">{alert.id}</td>
                      <td className="py-3 px-3 font-mono tracking-tight text-[8px] sm:text-sm hidden md:table-cell">{alert.srcIp}</td>
                      <td className="py-3 px-3 text-slate-100 text-[8px] sm:text-sm truncate">{alert.alertType.split(' ')[0]}</td>
                      <td className="py-3 px-3 text-right">
                        <span className={`inline-block text-[8px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border font-semibold ${
                          alert.severity === 'critical'
                            ? 'bg-red-500/10 border-red-500/20 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.1)]'
                            : alert.severity === 'high'
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.1)]'
                            : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.1)]'
                        }`}>
                          {alert.severity.substring(0, 3).toUpperCase()}
                        </span>
                      </td>

                      {/* Embed the world globe graphic ONLY on the first log row inside cell details */}
                      {idx === 0 && (
                        <div className="absolute right-2 top-2 pointer-events-none opacity-[0.06] text-cyan-400">
                          <Globe className="h-8 w-8 animate-spin" style={{ animationDuration: '40s' }} />
                        </div>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right Pane: Workbench & Investigation (Vertical Split) */}
        <section className="flex-1 flex flex-col overflow-hidden bg-slate-950">
          
          {/* Top Panel: Workbench (Data Visualizations) */}
          <div className="h-auto lg:h-[46%] border-b border-slate-800 flex flex-col lg:flex-row overflow-hidden bg-slate-950/30 max-h-[40vh] lg:max-h-none">
            
            {/* Map Viz */}
            <div className="w-full lg:w-[58%] border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col relative h-64 lg:h-full">
              <div className="p-3 border-b border-slate-800/80 bg-slate-900/30 flex items-center justify-between gap-2 flex-wrap">
                <div className="space-y-1 flex-1">
                  <span className="text-[8px] sm:text-[10px] font-mono font-semibold tracking-wider text-slate-300 uppercase">Live Attack Map</span>
                  <div className="flex flex-wrap items-center gap-1.5 text-[8px] sm:text-[10px] text-slate-400">
                    <span className="rounded-full bg-slate-900/60 border border-slate-800/50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-400">India region</span>
                    <span className="rounded-full bg-red-950/40 border border-red-500/30 px-2.5 py-0.5 text-[9px] text-red-400 uppercase tracking-widest font-semibold animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.1)]">Vulnerable</span>
                  </div>
                </div>
                <span className="text-[9px] sm:text-[10px] font-mono text-emerald-400 tracking-widest uppercase font-bold whitespace-nowrap">INDIA</span>
              </div>
              
              {/* Premium Vector Path Map Representation */}
              <div className="flex-1 relative bg-slate-950/90 overflow-hidden flex items-center justify-center h-40 lg:h-full">
                <div
                  className="w-full h-full touch-none"
                  onWheel={handleWheel}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{ cursor: isPanning ? 'grabbing' : 'grab', touchAction: 'none' }}
                >
                  <svg className="w-full h-full" viewBox="0 0 1000 400" fill="none">
                    <g transform={`translate(${mapTranslate.x} ${mapTranslate.y}) scale(${mapScale})`}>
                      <path d="M510 90 Q 540 60 580 70 Q 620 85 640 120 Q 660 150 655 190 Q 645 220 620 240 Q 590 255 560 250 Q 520 240 500 220 Q 480 200 470 175 Q 460 150 465 125 Q 475 105 510 90 Z" fill="rgba(15,23,42,0.2)" stroke="#334155" strokeWidth="1" />

                      <path d="M150 180h30v20h-30zm220-40h50v30h-50zm320-10h60v40h-60zm110 120h40v40h-40z" fill="#1e293b" opacity="0.3" />

                      {/* India Region Indicators (stylized) */}
                      <circle cx="620" cy="200" r="16" fill="rgba(52, 211, 153, 0.08)" stroke="#34d399" strokeWidth="1" strokeDasharray="3,3" />
                      <circle cx="620" cy="200" r="4" fill="#34d399" />
                      <text x="560" y="230" className="map-label" fontSize="12">REGION: INDIA</text>

                      {/* Mumbai Node */}
                      <circle cx="580" cy="210" r="4" fill="#06b6d4" className="animate-pulse" />
                      <text x="590" y="214" className="map-label text-[10px]">MUM (103.44.192.84)</text>
                      <path d="M580 210 Q 600 205 620 200" stroke="#06b6d4" strokeWidth="1.2" className="opacity-70" />

                      {/* Bengaluru Node */}
                      <circle cx="640" cy="230" r="4" fill="#f59e0b" className="animate-pulse" />
                      <text x="646" y="234" className="map-label text-[10px]">BLR (45.227.254.12)</text>
                      <path d="M640 230 Q 630 220 620 200" stroke="#f59e0b" strokeWidth="1.2" className="opacity-70" />

                      {/* New Delhi Node and Vulnerable City Highlight */}
                      <circle cx="620" cy="170" r="14" fill="none" stroke="#ef4444" strokeWidth="1.6" strokeDasharray="4 4" />
                      <circle cx="620" cy="170" r="4" fill="#ef4444" className="animate-pulse" />
                      <text x="626" y="174" className="map-label text-[10px]">DEL (185.190.140.23)</text>
                      <path d="M620 170 Q 620 185 620 200" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="3,3" className="opacity-70" />

                      {/* Animated telemetry towards region center */}
                      <circle cx="620" cy="200" r="3" fill="#ef4444">
                        <animateMotion dur="3s" repeatCount="indefinite" path="M620 170 Q 620 185 620 200" />
                      </circle>
                    </g>
                  </svg>

                  {/* Vulnerability city demo overlay */}
                  <div className="absolute left-4 bottom-4 z-20 w-[240px] rounded-2xl border border-slate-800 bg-[#070b13]/95 p-4 text-slate-300 shadow-2xl backdrop-blur-md">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] uppercase tracking-[0.35em] text-slate-500 font-semibold font-mono">Vulnerable city</span>
                      <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-[9px] text-red-400 border border-red-500/20 uppercase tracking-widest font-bold shadow-[0_0_8px_rgba(239,68,68,0.1)]">DEL</span>
                    </div>
                    <p className="mt-2.5 text-sm font-semibold text-slate-100">New Delhi critical exposure</p>
                    <p className="mt-1 text-[10px] text-slate-400 font-sans">Source IP 185.190.140.23 flagged as high-risk.</p>
                    <div className="mt-3 rounded-xl bg-slate-900/40 px-3 py-2 text-[10px] text-slate-400 border border-slate-800/60 font-mono">
                      Detection: SSH brute force path + harvesting
                    </div>
                  </div>

                  {/* Zoom controls overlay */}
                  <div className="absolute right-4 top-4 flex flex-col space-y-2 z-30 hidden sm:flex">
                    <button onClick={() => zoom(0.15)} className="w-9 h-9 text-base rounded-lg bg-[#0b111e]/90 border border-slate-800 hover:bg-cyan-500/15 hover:border-cyan-500/40 hover:text-cyan-400 text-slate-300 transition-all duration-200 shadow-md backdrop-blur-sm flex items-center justify-center font-bold">+</button>
                    <button onClick={() => zoom(-0.15)} className="w-9 h-9 text-base rounded-lg bg-[#0b111e]/90 border border-slate-800 hover:bg-cyan-500/15 hover:border-cyan-500/40 hover:text-cyan-400 text-slate-300 transition-all duration-200 shadow-md backdrop-blur-sm flex items-center justify-center font-bold">−</button>
                    <button onClick={resetMap} className="w-9 h-9 text-base rounded-lg bg-[#0b111e]/90 border border-slate-800 hover:bg-cyan-500/15 hover:border-cyan-500/40 hover:text-cyan-400 text-slate-300 transition-all duration-200 shadow-md backdrop-blur-sm flex items-center justify-center font-bold">◻</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Time-Series Chart */}
            <div className="flex-1 flex flex-col w-full lg:w-auto">
              <div className="p-2 border-b border-slate-800 bg-slate-900/20 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center space-x-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                  <span className="text-[8px] sm:text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">Auth Ingress Telemetry (1HR)</span>
                </div>
                <span className="text-[8px] sm:text-[10px] font-mono bg-red-950/40 border border-red-500/30 text-red-400 px-1.5 py-0.5 rounded-sm uppercase tracking-wider animate-pulse">Threat Spike Detected</span>
              </div>

              {/* Time series bar chart */}
              <div className="flex-1 bg-slate-950/80 p-4 sm:p-5 relative rounded-lg sm:rounded-[20px] border border-slate-800/60 h-40 lg:h-full flex flex-col justify-between">
                
                {/* Background Gridlines */}
                <div className="absolute inset-0 p-4 sm:p-5 pointer-events-none flex flex-col justify-between">
                  {[250, 180, 120, 50, 0].map((gridVal, i) => (
                    <div key={i} className="flex items-center w-full h-0 relative">
                      <span className="text-[6px] sm:text-[8px] font-mono text-slate-600 w-8 shrink-0">{gridVal}</span>
                      <div className="flex-1 border-t border-dashed border-slate-800/40" />
                      {gridVal === 180 && (
                        <span className="absolute right-0 text-[6px] uppercase tracking-wider text-red-500/50 pr-2 font-mono">Anomaly Threshold</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Bars Container */}
                <div className="relative z-10 flex h-[88%] items-end justify-between gap-1 sm:gap-2 pl-8 pb-1">
                  {CHART_DATA.map((item, idx) => {
                    const percentHeight = Math.max(6, (item.val / 260) * 100);
                    const isHovered = hoveredBar === idx;
                    const isPeak = item.val === 240;
                    return (
                      <div
                        key={idx}
                        className="flex flex-col items-center flex-1 min-w-0 group relative h-full justify-end"
                        onMouseEnter={() => setHoveredBar(idx)}
                        onMouseLeave={() => setHoveredBar(null)}
                      >
                        {/* Tooltip above hovered bar */}
                        {isHovered && (
                          <div className="absolute bottom-[calc(100%+8px)] z-30 bg-slate-900/95 border border-cyan-500/30 text-white rounded-lg p-2 shadow-2xl backdrop-blur-md text-[9px] sm:text-[10px] w-28 text-center pointer-events-none transform -translate-y-1 scale-100 transition-all duration-150 glow-border-cyan">
                            <div className="font-semibold text-cyan-400 font-mono">{item.time}</div>
                            <div className="text-slate-100 font-bold mt-0.5">{item.val} reqs/sec</div>
                            <div className={`text-[7px] uppercase mt-0.5 tracking-wider font-semibold ${
                              item.val > 180 ? 'text-red-400 animate-pulse' : item.val > 120 ? 'text-amber-400' : 'text-emerald-400'
                            }`}>
                              {item.val > 180 ? 'CRITICAL SPIKE' : item.val > 120 ? 'WARNING' : 'STABLE'}
                            </div>
                          </div>
                        )}
                        
                        {/* Bar Graphic */}
                        <div
                          style={{ height: `${percentHeight}%` }}
                          className={`w-full rounded-t-sm transition-all duration-300 ease-out relative cursor-pointer ${
                            item.val > 180
                              ? 'bg-gradient-to-t from-red-950/60 via-red-600/60 to-red-400 shadow-[0_0_12px_rgba(239,68,68,0.25)] border-t border-x border-red-500/40'
                              : item.val > 120
                              ? 'bg-gradient-to-t from-amber-950/60 via-amber-600/50 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.15)] border-t border-x border-amber-500/40'
                              : 'bg-gradient-to-t from-cyan-950/60 via-cyan-600/40 to-cyan-400 border-t border-x border-cyan-500/20'
                          } ${isHovered ? 'brightness-125 scale-x-105 -translate-y-0.5' : ''}`}
                        >
                          {/* Top accent glow line */}
                          <div className={`absolute top-0 inset-x-0 h-[1.5px] rounded-t-full ${
                            item.val > 180 ? 'bg-red-300' : item.val > 120 ? 'bg-amber-300' : 'bg-cyan-300'
                          }`} />
                          
                          {/* Peak Highlight */}
                          {isPeak && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[5px] sm:text-[7px] font-mono px-1 rounded-sm uppercase font-bold animate-bounce whitespace-nowrap">
                              Peak
                            </div>
                          )}
                        </div>

                        {/* X-Axis label */}
                        <span className={`text-[7px] sm:text-[9px] font-mono mt-2 transition-colors duration-150 ${
                          isHovered ? 'text-cyan-400 font-bold' : isPeak ? 'text-red-400 font-semibold' : 'text-slate-500'
                        }`}>
                          {item.time.split(':')[1]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Panel: Investigation Chat */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 relative min-h-[300px] lg:min-h-0">
            <div className="sticky top-0 z-20 p-2 border-b border-slate-800 bg-slate-900/30 backdrop-blur-sm flex items-center justify-between gap-2 flex-wrap shrink-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <Terminal className="h-3 w-3 sm:h-4 sm:w-4 text-cyan-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono hidden sm:inline">Investigation Panel // Vigilance.ai</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono sm:hidden">Console</span>
              </div>
              <div className="flex items-center space-x-1.5 sm:space-x-2 text-[8px] sm:text-[10px] font-mono text-slate-500">
                <span className="hidden sm:inline">INTEL AGENT CORE</span>
                <span className="sm:hidden">ACTIVE</span>
              </div>
            </div>

            {/* Response Console output */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 font-mono text-xs sm:text-sm bg-slate-950/95 space-y-4 scanlines relative select-text text-slate-300 leading-relaxed">
              {streamedResponse ? (
                <div className="whitespace-pre-wrap break-words text-xs sm:text-sm">
                  {streamedResponse}
                  {isStreaming && <span className="blinking-cursor"></span>}
                </div>
              ) : (
                <div className="text-slate-500 flex flex-col items-center justify-center h-full space-y-2">
                  <Cpu className="h-6 w-6 sm:h-8 sm:w-8 text-slate-700 animate-pulse" />
                  <p className="text-[10px] sm:text-[11px] text-center">COMMAND UTILITY AWAKENING ... INTERFACE STABLE</p>
                  <p className="text-[8px] sm:text-[10px] text-slate-600 uppercase text-center">Select an alert and press Enter or click Run</p>
                </div>
              )}

              {/* Active Tool Execution badge overlay inside console */}
              {toolExecutionState && (
                <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 text-slate-300 p-2 rounded-sm max-w-sm">
                  <RefreshCw className="h-3 w-3 text-cyan-400 animate-spin" />
                  <span className="text-[8px] sm:text-[10px] text-slate-300 font-mono uppercase tracking-wide break-words">{toolExecutionState}</span>
                </div>
              )}
              
              <div ref={consoleEndRef} />
            </div>

            {/* Mitigation Status Message */}
            {mitigationMessage && (
              <div className="absolute bottom-16 right-4 bg-emerald-950/90 border border-emerald-500/40 text-emerald-400 text-xs px-3 py-2 rounded-sm font-mono flex items-center space-x-2 animate-bounce">
                <CheckCircle className="h-4 w-4" />
                <span>{mitigationMessage}</span>
              </div>
            )}

            {/* Input Console Bar */}
            <form onSubmit={handleRunInvestigation} className="h-11 border-y border-slate-800 bg-[#05080e]/90 flex items-center px-4 shrink-0 gap-2 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
              <span className="text-cyan-400 font-mono text-xs mr-1 font-bold hidden sm:inline">$</span>
              <input 
                type="text" 
                value={consoleInput}
                onChange={(e) => setConsoleInput(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-slate-100 font-mono text-xs sm:text-sm placeholder-slate-700 tracking-wide min-w-0"
                placeholder="/investigate [id]"
              />
              <button 
                type="submit" 
                disabled={isStreaming}
                className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-mono text-[9px] sm:text-[10px] font-semibold px-3 py-1 rounded-md border border-cyan-500/30 hover:border-cyan-500/60 transition-all uppercase tracking-wider whitespace-nowrap"
              >
                {isStreaming ? "..." : "Run"}
              </button>
            </form>

            {/* Action Oriented buttons below console bar */}
            <div className="h-auto sm:h-14 bg-[#080d19]/80 px-4 py-2 sm:py-0 flex flex-wrap items-center justify-between sm:justify-start gap-3 shrink-0 overflow-x-auto border-t border-slate-800/80">
              <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap">
                <button 
                  onClick={handleRunInvestigation}
                  disabled={isStreaming}
                  className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 text-[9px] sm:text-[10px] font-bold tracking-widest uppercase px-4 py-2 rounded-md flex items-center gap-2 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_15px_rgba(6,182,212,0.25)] whitespace-nowrap"
                >
                  <Play className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-slate-950" />
                  <span className="hidden sm:inline">Run Playbook</span>
                  <span className="sm:hidden">Run</span>
                </button>
                <button 
                  onClick={() => handleMitigation("Raw log fetch")}
                  className="bg-[#0b111e]/80 hover:bg-slate-800/80 text-slate-300 text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase px-4 py-2 rounded-md border border-slate-800 hover:border-slate-700 transition-all rounded-md flex items-center gap-1.5 shadow-md hidden sm:flex whitespace-nowrap"
                >
                  <FileText className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-slate-400" />
                  <span>View Logs</span>
                </button>
                <button 
                  onClick={handleGenerateReport}
                  disabled={reportLoading}
                  className="bg-[#0b111e]/80 hover:bg-slate-800/80 text-slate-300 text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase px-4 py-2 rounded-md border border-slate-800 hover:border-slate-700 transition-all rounded-md flex items-center gap-1.5 shadow-md disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <AlertCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-slate-400" />
                  <span className="hidden sm:inline">{reportLoading ? "Building PDF..." : "PDF Report"}</span>
                  <span className="sm:hidden">PDF</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap">
                <button 
                  onClick={() => handleMitigation(`Blocking IP ${selectedAlert.srcIp}`)}
                  className="bg-amber-500/5 hover:bg-amber-500/15 text-amber-400 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase px-4 py-2 rounded-md border border-amber-500/20 hover:border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.05)] transition-all rounded-md flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Ban className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  <span className="hidden sm:inline">Block IP</span>
                  <span className="sm:hidden">Block</span>
                </button>
                <button 
                  onClick={() => handleMitigation(`Isolating Host ${selectedAlert.destHost}`)}
                  className="bg-red-500/5 hover:bg-red-500/15 text-red-400 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase px-4 py-2 rounded-md border border-red-500/20 hover:border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.05)] transition-all rounded-md flex items-center gap-1.5 hidden sm:flex whitespace-nowrap"
                >
                  <Lock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  <span>Isolate Host</span>
                </button>
              </div>
            </div>
            {reportMessage && (
              <div className="absolute bottom-20 left-4 right-4 z-20 rounded-2xl border border-cyan-500/20 bg-slate-950/95 px-4 py-3 text-slate-100 text-sm font-mono shadow-lg">
                {reportMessage}
              </div>
            )}

          </div>
        </section>

      </main>
    </div>
  );
}
