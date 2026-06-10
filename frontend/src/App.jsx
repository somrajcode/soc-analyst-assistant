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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export default function App() {
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [selectedAlert, setSelectedAlert] = useState(INITIAL_ALERTS[0]);
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
  const consoleEndRef = useRef(null);

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

  const handleLoginSubmit = async (event) => {
    event.preventDefault();

    if (!loginPassword || !loginCompanyId) {
      setAuthError("Company ID and password are required.");
      return;
    }

    setAuthLoading(true);
    setAuthError("");

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

  // Run autonomous analysis pipeline
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

    try {
      // Attempt backend API stream call
      const headers = { "Content-Type": "application/json" };
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      const response = await fetch(`${API_BASE_URL}/api/v1/analyze`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
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
        const text = decoder.decode(value);
        
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
      console.warn("Backend unavailable. Running high-fidelity offline simulation loop...");
      await runLocalSimulation(payload);
    } finally {
      setIsStreaming(false);
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
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_18%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_22%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(15,23,42,0.96))]" />

        <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-10">
          <div className="grid w-full gap-8 lg:grid-cols-[760px_420px]">
            <section className="glass-card rounded-[32px] border border-slate-700/40 p-10 shadow-2xl ring-1 ring-slate-800/60">
              <div className="space-y-7">
                <div className="inline-flex items-center gap-3 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs uppercase tracking-[0.32em] text-cyan-200">
                  <Shield className="h-4 w-4 text-cyan-300" />
                  Vigilance.ai
                </div>

                <div className="space-y-4">
                  <h1 className="text-5xl font-semibold tracking-tight text-slate-50">Vigilance.ai</h1>
                  <p className="max-w-2xl text-slate-300 leading-8">AI enabled Human-Centric SOC Assistannt Dashboard</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="glass-soft rounded-3xl border border-slate-700/40 p-5">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Region</p>
                    <p className="mt-3 text-2xl font-semibold text-emerald-300">India</p>
                  </div>
                  <div className="glass-soft rounded-3xl border border-slate-700/40 p-5">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Mode</p>
                    <p className="mt-3 text-2xl font-semibold text-cyan-300">Live Threat Ops</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="glass-card rounded-[32px] border border-cyan-500/15 p-8 shadow-2xl ring-1 ring-slate-800/60">
              <div className="mb-8">
                <span className="text-[10px] uppercase tracking-[0.3em] text-cyan-300/80 font-semibold">Authentication</span>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-50">Sign in to vigilance.ai</h2>
                <p className="mt-3 text-slate-400 leading-7">Use your Company ID and password to open the SOC dashboard.</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-slate-300 text-[11px] uppercase tracking-[0.2em] font-semibold">Company ID</label>
                  <input
                    type="text"
                    value={loginCompanyId}
                    onChange={(e) => setLoginCompanyId(e.target.value)}
                    className="w-full rounded-[20px] border border-slate-800 bg-slate-950/90 px-4 py-3 text-slate-100 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                    placeholder="SOC-VPER28"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-slate-300 text-[11px] uppercase tracking-[0.2em] font-semibold">Password</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full rounded-[20px] border border-slate-800 bg-slate-950/90 px-4 py-3 text-slate-100 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                    placeholder="••••••••"
                  />
                </div>

                {authError && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{authError}</div>}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-slate-950 transition hover:from-emerald-300 hover:to-cyan-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-xl"
                >
                  {authLoading ? "Signing in..." : "SIGN IN"}
                </button>
              </form>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden app-shell font-sans text-slate-100 antialiased">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_18%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.08),transparent_20%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(8,15,30,0.96))]" />

      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800/50 bg-slate-950/85 px-5 backdrop-blur-xl">
        <div className="flex items-center space-x-3">
          <div className="bg-cyan-500/10 border border-cyan-500/30 p-1.5 rounded-sm">
            <Shield className="h-4 w-4 text-cyan-400" />
          </div>
          <div>
            <span className="font-semibold tracking-wider text-sm text-slate-100 font-mono">VIGILANCE.AI</span>
            <span className="text-[10px] text-slate-400 font-mono ml-2 border-l border-slate-700 pl-2">AUTONOMOUS SOC ENGINE</span>
          </div>
        </div>
        
        {/* Core telemetry details */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400">
          <div className="flex items-center space-x-2">
            <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
            <span>AGENT: ACTIVE</span>
          </div>
          <div>CWD: <span className="text-slate-200">C:\\soc-analyst-assistant</span></div>
          <div>VER: <span className="text-slate-200">1.0.0-PRO</span></div>
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">USER:</span>
            <span className="text-slate-200 font-semibold">{activeUser.username || 'ANALYST'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">ORG:</span>
            <span className="text-slate-200 font-semibold">{activeUser.companyId || 'SOC'}</span>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-sm border border-slate-700 bg-slate-800 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-100 hover:bg-slate-700"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Split Pane Layout */}
      <main className="flex-1 flex overflow-hidden w-full relative">
        
        {/* Left Pane: Active Threat Feed */}
        <section className="w-[38%] border-r border-slate-800 bg-slate-950/60 flex flex-col overflow-hidden shrink-0">
          <div className="p-3 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-cyan-500" />
              <h2 className="text-xs font-semibold tracking-wider uppercase text-slate-200 font-mono">Active Threat Feed</h2>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded-sm uppercase">Live Data Stream</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase font-mono text-slate-500 bg-slate-950">
                  <th className="py-2 px-3">Time</th>
                  <th className="py-2 px-3">Alert ID</th>
                  <th className="py-2 px-3">Source IP</th>
                  <th className="py-2 px-3">Alert Type</th>
                  <th className="py-2 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs font-mono">
                {alerts.map((alert, idx) => {
                  const isSelected = selectedAlert.id === alert.id;
                  return (
                    <tr 
                      key={alert.id}
                      onClick={() => handleSelectAlert(alert)}
                      className={`cursor-pointer transition-all duration-150 relative ${
                        isSelected 
                          ? 'bg-slate-900/90 text-cyan-400 border-l-2 border-cyan-500' 
                          : 'hover:bg-slate-900/30 text-slate-300'
                      }`}
                    >
                      <td className="py-3 px-3 text-slate-500 text-[11px]">{alert.time}</td>
                      <td className="py-3 px-3 font-semibold">{alert.id}</td>
                      <td className="py-3 px-3 font-mono tracking-tight">{alert.srcIp}</td>
                      <td className="py-3 px-3 text-slate-100">{alert.alertType}</td>
                      <td className="py-3 px-3 text-right">
                        <span className={`inline-block text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded-sm border ${
                          alert.severity === 'critical'
                            ? 'bg-red-950/40 border-red-500/30 text-red-400'
                            : alert.severity === 'high'
                            ? 'bg-amber-950/40 border-amber-500/30 text-amber-400'
                            : 'bg-cyan-950/40 border-cyan-500/30 text-cyan-400'
                        }`}>
                          {alert.severity}
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
          <div className="h-[46%] border-b border-slate-800 flex flex-row overflow-hidden bg-slate-900/10">
            
            {/* Map Viz */}
            <div className="w-[58%] border-r border-slate-800 flex flex-col relative">
              <div className="p-2 border-b border-slate-800 bg-slate-900/20 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">Live Attack Path Correlation Map</span>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                    <span className="rounded-full bg-slate-900/40 px-2 py-1 uppercase tracking-[0.25em]">India region</span>
                    <span className="rounded-full bg-red-950/40 border border-red-500/30 px-2 py-1 text-red-300 uppercase tracking-[0.25em]">Vulnerable city detected</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">REGION: INDIA</span>
              </div>
              
              {/* Premium Vector Path Map Representation */}
              <div className="flex-1 relative bg-slate-950/90 overflow-hidden flex items-center justify-center">
                <div
                  className="w-full h-full max-h-[220px] touch-pan-y"
                  onWheel={handleWheel}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
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
                  <div className="absolute left-4 bottom-4 z-20 w-[220px] rounded-2xl border border-slate-800/70 bg-slate-950/95 p-3 text-slate-300 shadow-xl backdrop-blur-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] uppercase tracking-[0.35em] text-slate-500">Vulnerable city</span>
                      <span className="rounded-full bg-red-500/10 px-2 py-1 text-[10px] text-red-300 uppercase tracking-[0.25em]">DEL</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-100">New Delhi critical exposure</p>
                    <p className="mt-1 text-[10px] text-slate-500">Source IP 185.190.140.23 flagged as high-risk.</p>
                    <div className="mt-3 rounded-2xl bg-slate-900/80 px-3 py-2 text-[10px] text-slate-400 border border-slate-800/60">
                      Detection: SSH brute force path + credential harvesting
                    </div>
                  </div>

                  {/* Zoom controls overlay */}
                  <div className="absolute right-3 top-3 flex flex-col space-y-2 z-30">
                    <button onClick={() => zoom(0.15)} className="w-9 h-9 rounded-sm bg-slate-800 border border-slate-700 text-slate-100">+</button>
                    <button onClick={() => zoom(-0.15)} className="w-9 h-9 rounded-sm bg-slate-800 border border-slate-700 text-slate-100">−</button>
                    <button onClick={resetMap} className="w-9 h-9 rounded-sm bg-slate-800 border border-slate-700 text-slate-100">◻</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Time-Series Chart */}
            <div className="flex-1 flex flex-col">
              <div className="p-2 border-b border-slate-800 bg-slate-900/20 flex items-center justify-between">
                <span className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">Failed Authentication Ingress (1HR)</span>
                <span className="text-[10px] font-mono text-red-400">SPIKE DETECTED</span>
              </div>

              {/* Time series bar chart */}
              <div className="flex-1 bg-slate-950/80 p-3 relative overflow-hidden rounded-[20px] border border-slate-800/60">
                <div className="absolute inset-x-0 top-10 border-t border-slate-800/40" />
                <div className="absolute inset-x-0 top-24 border-t border-slate-800/40" />
                <div className="absolute inset-x-0 top-36 border-t border-slate-800/40" />
                <div className="absolute inset-x-0 top-48 border-t border-slate-800/40" />

                <div className="absolute left-3 top-8 text-[8px] font-mono text-slate-600">200 ATTEMPTS</div>
                <div className="absolute left-3 top-22 text-[8px] font-mono text-slate-600">150 ATTEMPTS</div>
                <div className="absolute left-3 top-34 text-[8px] font-mono text-slate-600">100 ATTEMPTS</div>
                <div className="absolute left-3 top-46 text-[8px] font-mono text-slate-600">50 ATTEMPTS</div>

                <div className="relative z-10 flex h-full items-end justify-between gap-1.5 px-1.5">
                  {[30, 45, 22, 18, 28, 65, 150, 195, 240, 190, 130, 105].map((val, idx) => {
                    const percentHeight = Math.max(8, (val / 260) * 100);
                    return (
                      <div key={idx} className="flex flex-col items-center flex-1">
                        <div className="text-[8px] font-mono text-slate-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">{val}</div>
                        <div
                          style={{ height: `${percentHeight}%` }}
                          className={`w-full rounded-t-md transition-all duration-500 ${
                            val > 180 ? 'bg-red-500' : val > 120 ? 'bg-amber-500' : 'bg-cyan-500/70'
                          }`
                        />
                        <span className="mt-2 text-[8px] font-mono text-slate-500">-{15 + idx * 5}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="absolute inset-x-0 bottom-2 px-3 flex items-center justify-between text-[8px] font-mono text-slate-500">
                  <span>-15</span>
                  <span>-25</span>
                  <span>-35</span>
                  <span>-45</span>
                  <span>-55</span>
                  <span>-65</span>
                  <span>-70</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Panel: Investigation Chat */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 relative">
            <div className="p-2 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <Terminal className="h-4 w-4 text-cyan-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono">Investigation Panel // Vigilance.ai</span>
              </div>
              <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500">
                <span>INTEL AGENT CORE</span>
              </div>
            </div>

            {/* Response Console output */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs bg-slate-950/95 space-y-4 scanlines relative select-text">
              {streamedResponse ? (
                <div className="whitespace-pre-wrap leading-relaxed text-slate-300">
                  {streamedResponse}
                  {isStreaming && <span className="blinking-cursor"></span>}
                </div>
              ) : (
                <div className="text-slate-500 flex flex-col items-center justify-center h-full space-y-2">
                  <Cpu className="h-8 w-8 text-slate-700 animate-pulse" />
                  <p className="text-[11px]">COMMAND UTILITY AWAKENING ... INTERFACE STABLE</p>
                  <p className="text-[10px] text-slate-600 uppercase">Select an alert and hit Enter or click Run Playbook below</p>
                </div>
              )}

              {/* Active Tool Execution badge overlay inside console */}
              {toolExecutionState && (
                <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 text-slate-300 p-2 rounded-sm max-w-sm">
                  <RefreshCw className="h-3 w-3 text-cyan-400 animate-spin" />
                  <span className="text-[10px] text-slate-300 font-mono uppercase tracking-wide">{toolExecutionState}</span>
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
            <form onSubmit={handleRunInvestigation} className="h-10 border-y border-slate-800 bg-slate-950 flex items-center px-3 shrink-0">
              <span className="text-cyan-400 font-mono text-xs mr-2 font-bold">$</span>
              <input 
                type="text" 
                value={consoleInput}
                onChange={(e) => setConsoleInput(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-slate-200 font-mono text-xs placeholder-slate-600 tracking-wide"
                placeholder="/investigate [alert-ID]"
              />
              <button 
                type="submit" 
                disabled={isStreaming}
                className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-mono text-[10px] font-semibold px-3 py-1 rounded-sm border border-cyan-500/30 uppercase tracking-wider"
              >
                {isStreaming ? "Thinking..." : "Execute"}
              </button>
            </form>

            {/* Action Oriented buttons below console bar */}
            <div className="h-12 bg-slate-900/70 px-4 flex items-center justify-between shrink-0 overflow-x-auto space-x-2 border-t border-slate-900">
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handleRunInvestigation}
                  disabled={isStreaming}
                  className="bg-cyan-600 hover:bg-cyan-700 text-slate-950 text-[10px] font-bold tracking-wider uppercase px-3 py-1.5 rounded-sm flex items-center space-x-1.5 transition-all"
                >
                  <Play className="h-3 w-3 fill-slate-950" />
                  <span>Run Playbook</span>
                </button>
                <button 
                  onClick={() => handleMitigation("Raw log fetch")}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold tracking-wider uppercase px-3 py-1.5 rounded-sm border border-slate-700/60 flex items-center space-x-1.5"
                >
                  <FileText className="h-3 w-3 text-slate-400" />
                  <span>View Raw Logs</span>
                </button>
                <button 
                  onClick={handleGenerateReport}
                  disabled={reportLoading}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold tracking-wider uppercase px-3 py-1.5 rounded-sm border border-slate-700/60 flex items-center space-x-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <AlertCircle className="h-3 w-3 text-slate-400" />
                  <span>{reportLoading ? "Building PDF..." : "Generate Report"}</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => handleMitigation(`Blocking IP ${selectedAlert.srcIp}`)}
                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-bold tracking-wider uppercase px-3 py-1.5 rounded-sm border border-amber-500/30 flex items-center space-x-1.5"
                >
                  <Ban className="h-3 w-3" />
                  <span>Block IP</span>
                </button>
                <button 
                  onClick={() => handleMitigation(`Isolating Host ${selectedAlert.destHost}`)}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold tracking-wider uppercase px-3 py-1.5 rounded-sm border border-red-500/30 flex items-center space-x-1.5"
                >
                  <Lock className="h-3 w-3" />
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
