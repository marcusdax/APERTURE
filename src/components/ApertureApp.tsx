import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  Aperture, ArrowRight, ArrowUpRight, Bell, Check, ChevronDown, ChevronLeft,
  ChevronRight, CircleHelp, Clipboard, CloudUpload, Compass, Download,
  FileText, Focus, Grid2X2, Image as ImageIcon, Layers3, MapPin,
  Menu, MoreHorizontal, Plus, Scan, Settings2, ShieldCheck,
  Sparkles, Target, Users, WandSparkles, X, Zap
} from "lucide-react";
import { analyzeDiscovery, apiStatus, renderConcept, type Detection, type Finding, type TextHit } from "@/lib/aperture.functions";
import { runAutomations } from "@/lib/crm";
import EngagementDesk from "@/components/EngagementDesk";

const stages = [
  { id: "discover", n: "01", label: "Discover", sub: "Set the scene" },
  { id: "reveal", n: "02", label: "Reveal", sub: "Read the evidence" },
  { id: "envision", n: "03", label: "Envision", sub: "Explore potential" },
  { id: "quantify", n: "04", label: "Quantify", sub: "Understand impact" },
  { id: "activate", n: "05", label: "Activate", sub: "Move with clarity" },
];

const demoFindings: Finding[] = [
  { id: 1, title: "Primary frontage", type: "Visibility opportunity", confidence: "High", x: 22, y: 47, color: "cyan", detail: "The primary frontage is visually prominent and could support clearer tenant or brand identification.", evidence: "Illustrative marker. Not read from an uploaded image.", score: 0.88, source: "demo" },
  { id: 2, title: "Parking approach", type: "Access consideration", confidence: "Medium", x: 72, y: 69, color: "gold", detail: "The approach path appears to be a useful point for wayfinding and access review.", evidence: "Illustrative marker. Not read from an uploaded image.", score: 0.64, source: "demo" },
  { id: 3, title: "Roofline", type: "Condition review", confidence: "Medium", x: 62, y: 18, color: "violet", detail: "The roofline is a candidate for closer inspection. Image-only review cannot establish material condition.", evidence: "Illustrative marker. Not read from an uploaded image.", score: 0.64, source: "demo" },
];

type ImageMetrics = {
  width: number;
  height: number;
  bytes: number;
  meanLuminance: number;
  contrast: number;
  sharpness: number;
  fingerprint: string;
};

const engineLayers = [
  { name: "Pixel metrics", role: "Resolution, luminance, contrast, sharpness, file fingerprint", state: "Live" },
  { name: "Grok vision", role: "Scene reading and evidence notes", state: "Live" },
  { name: "Concept render", role: "Possibility image from the current scene", state: "Live" },
  { name: "Object detector", role: "YOLOX-S boxes people, vehicles, and signs. Apache 2.0. Not a defect or building model.", state: "Live" },
  { name: "RF-DETR", role: "Fine-tune target for property photos. Weights are not loaded.", state: "Slot" },
  { name: "Supervision", role: "Shared detection overlays. Used once a detector is loaded.", state: "Slot" },
  { name: "PaddleOCR", role: "PP-OCRv5 Latin reads signage in English and other Latin scripts. Apache 2.0. Unverified.", state: "Live" },
  { name: "SAM 2", role: "Click-to-segment regions. Not loaded.", state: "Slot" },
  { name: "Spatial context", role: "Building footprints and map layers. Not connected.", state: "Slot" },
];

const directions = [
  { id: "identity", title: "Identity & visibility", note: "Clearer signage and brand presence on the primary frontage", swatch: "swatch-one" },
  { id: "access", title: "Access & arrival", note: "A clearer arrival, wayfinding, and parking approach", swatch: "swatch-two" },
  { id: "exterior", title: "Exterior refinement", note: "More cohesive materials, lighting, and facade rhythm", swatch: "swatch-three" },
];

type Settings = { liveAnalysis: boolean; renderConcepts: boolean };
const SETTINGS_KEY = "aperture-settings";
const defaultSettings: Settings = { liveAnalysis: true, renderConcepts: true };
const conceptJobs = new Map<string, Promise<string>>();

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.onload = () => {
      const source = new Image();
      source.onload = () => {
        const max = 1280;
        const scale = Math.min(1, max / Math.max(source.width, source.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(source.width * scale));
        canvas.height = Math.max(1, Math.round(source.height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not read that image."));
          return;
        }
        ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      source.onerror = () => reject(new Error("Could not read that image."));
      source.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

function measureImage(file: File, dataUrl: string) {
  return new Promise<ImageMetrics>((resolve, reject) => {
    const source = new Image();
    source.onload = () => {
      const max = 160;
      const scale = Math.min(1, max / Math.max(source.width, source.height));
      const w = Math.max(2, Math.round(source.width * scale));
      const h = Math.max(2, Math.round(source.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        reject(new Error("Could not measure that image."));
        return;
      }
      ctx.drawImage(source, 0, 0, w, h);
      const { data } = ctx.getImageData(0, 0, w, h);
      const gray = new Float32Array(w * h);
      let sum = 0;
      for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
        const value = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        gray[p] = value;
        sum += value;
      }
      const mean = sum / gray.length;
      let variance = 0;
      for (const value of gray) variance += (value - mean) ** 2;
      let lapSum = 0;
      let lapSq = 0;
      let count = 0;
      for (let y = 1; y < h - 1; y += 1) {
        for (let x = 1; x < w - 1; x += 1) {
          const index = y * w + x;
          const lap = gray[index - w] + gray[index - 1] + gray[index + 1] + gray[index + w] - 4 * gray[index];
          lapSum += lap;
          lapSq += lap * lap;
          count += 1;
        }
      }
      const lapMean = lapSum / count;
      const sharpness = lapSq / count - lapMean * lapMean;
      file.arrayBuffer().then(async (bytes) => {
        const digest = await crypto.subtle.digest("SHA-256", bytes);
        const fingerprint = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, 12);
        resolve({
          width: source.width,
          height: source.height,
          bytes: file.size,
          meanLuminance: Math.round(mean * 10) / 10,
          contrast: Math.round(Math.sqrt(variance / gray.length) * 10) / 10,
          sharpness: Math.round(sharpness * 10) / 10,
          fingerprint,
        });
      }).catch(() => reject(new Error("Could not fingerprint that image.")));
    };
    source.onerror = () => reject(new Error("Could not measure that image."));
    source.src = dataUrl;
  });
}

function SceneIllustration() {
  return <svg className="scene-svg" viewBox="0 0 1000 560" role="img" aria-label="Illustrative aerial view of a commercial property">
    <defs>
      <linearGradient id="ground" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#273746"/><stop offset="1" stopColor="#101d29"/></linearGradient>
      <linearGradient id="roof" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#9ba8ac"/><stop offset=".48" stopColor="#596d75"/><stop offset="1" stopColor="#334752"/></linearGradient>
      <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#b6c6c5"/><stop offset="1" stopColor="#3b6069"/></linearGradient>
      <pattern id="parking" width="48" height="30" patternUnits="userSpaceOnUse"><path d="M0 0V30" stroke="#9aadb0" strokeWidth="2" opacity=".55"/></pattern>
      <pattern id="grain" width="120" height="120" patternUnits="userSpaceOnUse"><circle cx="8" cy="10" r="1" fill="#fff" opacity=".13"/><circle cx="72" cy="55" r="1" fill="#fff" opacity=".1"/><circle cx="35" cy="97" r="1" fill="#fff" opacity=".1"/></pattern>
    </defs>
    <rect width="1000" height="560" fill="url(#ground)"/>
    <path d="M0 408L1000 286V560H0Z" fill="#172a32"/>
    <path d="M0 436L1000 313" stroke="#91a3a3" strokeWidth="3" opacity=".2"/>
    <path d="M0 458L1000 335" stroke="#91a3a3" strokeWidth="2" opacity=".16"/>
    <path d="M40 40L960 40L960 520L40 520Z" fill="none" stroke="#78919a" strokeWidth="1" opacity=".18"/>
    <path d="M88 90L705 44L900 174L278 231Z" fill="#2e414a" stroke="#a8b7b8" strokeWidth="2"/>
    <path d="M278 231L900 174L900 364L278 422Z" fill="url(#glass)" stroke="#b7c5c4" strokeWidth="2"/>
    <path d="M88 90L278 231L278 422L88 277Z" fill="#50646c" stroke="#b7c5c4" strokeWidth="2"/>
    <path d="M88 90L705 44L900 174L278 231Z" fill="url(#roof)" stroke="#c0cbca" strokeWidth="2"/>
    <path d="M140 105L705 63L835 151L278 203Z" fill="#63777c" opacity=".55"/>
    <path d="M278 250L900 194M278 286L900 230M278 324L900 268M278 362L900 306" stroke="#d1d9d5" strokeWidth="3" opacity=".6"/>
    <path d="M350 224V414M435 216V406M520 208V398M605 200V390M690 192V382M775 184V374M860 177V367" stroke="#243e49" strokeWidth="8" opacity=".8"/>
    <path d="M88 277L278 422L278 458L88 314Z" fill="#243943"/>
    <path d="M0 405L278 373L278 560L0 560Z" fill="#233943"/>
    <path d="M278 422L900 364L1000 415L1000 560L278 560Z" fill="#263b45"/>
    <path d="M305 455L955 394V550L305 550Z" fill="url(#parking)" opacity=".45"/>
    <path d="M30 350L225 332L225 375L30 393Z" fill="#71888a" opacity=".25"/>
    <g opacity=".85">
      <path d="M78 330l28-3 0 13-28 3zM140 324l29-3 0 13-29 3zM204 318l28-3 0 13-28 3z" fill="#c0c9c2"/>
      <path d="M360 474l40-4 0 16-40 4zM430 468l40-4 0 16-40 4zM500 462l40-4 0 16-40 4zM570 456l40-4 0 16-40 4zM640 450l40-4 0 16-40 4z" fill="#c5d0cb"/>
    </g>
    <g fill="#9caa8a" opacity=".65"><circle cx="60" cy="80" r="28"/><circle cx="34" cy="125" r="20"/><circle cx="946" cy="80" r="35"/><circle cx="950" cy="465" r="27"/><circle cx="40" cy="510" r="34"/></g>
    <rect width="1000" height="560" fill="url(#grain)"/>
  </svg>;
}

function Brand() {
  return <div className="brand"><div className="brand-mark"><Aperture size={20} strokeWidth={1.8}/></div><div><div className="brand-name">APERTURE<span>®</span></div><div className="brand-sub">VISUAL INTELLIGENCE</div></div></div>;
}

function App() {
  const [desk, setDesk] = useState<"discovery" | "crm">("discovery");
  const [stage, setStage] = useState("discover");
  const [prompt, setPrompt] = useState("Identify visible property features, potential improvements, and opportunities worth investigating.");
  const [assetName, setAssetName] = useState("Three-tenant commercial center");
  const [location, setLocation] = useState("Fort Worth, Texas");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [findings, setFindings] = useState<Finding[]>(demoFindings);
  const [source, setSource] = useState<"demo" | "live">("demo");
  const [selectedFinding, setSelectedFinding] = useState(1);
  const [compare, setCompare] = useState(54);
  const [showBrief, setShowBrief] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [textHits, setTextHits] = useState<TextHit[]>([]);
  const [selectedText, setSelectedText] = useState(0);
  const [selectedDetection, setSelectedDetection] = useState(0);
  const [summary, setSummary] = useState("");
  const [metrics, setMetrics] = useState<ImageMetrics | null>(null);
  const [showLayers, setShowLayers] = useState(false);
  const [toast, setToast] = useState("");
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [settingsReady, setSettingsReady] = useState(false);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [directionId, setDirectionId] = useState(directions[0].id);
  const [conceptUrl, setConceptUrl] = useState("");
  const [conceptError, setConceptError] = useState("");
  const [rendering, setRendering] = useState(false);
  const [conceptRetry, setConceptRetry] = useState(0);
  const uploadRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<number | null>(null);
  const currentIndex = stages.findIndex(s => s.id === stage);
  const finding = findings.find(f => f.id === selectedFinding) || findings[0];
  const direction = directions.find(d => d.id === directionId) || directions[0];

  const notify = (message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 3200);
  };

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "") as Partial<Settings>;
      setSettings({
        liveAnalysis: saved.liveAnalysis !== false,
        renderConcepts: saved.renderConcepts !== false,
      });
    } catch {
      /* keep defaults */
    }
    setSettingsReady(true);
    apiStatus()
      .then((status) => setApiAvailable(status.available))
      .catch(() => setApiAvailable(false));
  }, []);

  const saveSettings = (next: Settings) => {
    setSettings(next);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  };

  const advance = () => {
    const next = stages[Math.min(currentIndex + 1, stages.length - 1)];
    if (next.id === "activate" && stage !== "activate") openActivate();
    else setStage(next.id);
  };
  const back = () => setStage(stages[Math.max(currentIndex - 1, 0)].id);
  const openActivate = () => {
    setStage("activate");
    const note = runAutomations("activate");
    if (note) notify(note);
  };

  const ingest = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      notify("Choose an image file.");
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setFileUrl(dataUrl);
      setFileName(file.name);
      setMetrics(await measureImage(file, dataUrl));
      setSummary("");
      notify("Image measured and added to this discovery.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not read that image.");
    }
  };

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void ingest(file);
  };

  const begin = async () => {
    if (!settings.liveAnalysis) {
      setFindings(demoFindings);
      setDetections([]);
      setTextHits([]);
      setSource("demo");
      setSummary("");
      setSelectedFinding(1);
      setStage("reveal");
      return;
    }
    setAnalyzing(true);
    try {
      const result = await analyzeDiscovery({
        data: { assetName, location, prompt, imageDataUrl: fileUrl },
      });
      if (!result.ok) {
        notify(result.error);
        return;
      }
      setFindings(result.findings);
      setDetections(result.detections);
      setTextHits(result.textHits);
      setSelectedText(result.textHits[0]?.id ?? 0);
      setSelectedDetection(result.detections[0]?.id ?? 0);
      setSummary(result.summary);
      setSource("live");
      setSelectedFinding(result.findings[0]?.id ?? 1);
      setStage("reveal");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  const conceptKey = `${direction.id}|${conceptRetry}|${assetName}|${location}|${prompt}|${fileUrl.length}|${fileUrl.slice(-24)}`;

  useEffect(() => {
    if (!settingsReady || stage !== "envision" || !settings.renderConcepts) {
      setRendering(false);
      return;
    }
    const key = conceptKey;
    let alive = true;
    setRendering(true);
    setConceptError("");
    setConceptUrl("");
    const job = conceptJobs.get(key) ?? renderConcept({
      data: {
        assetName,
        location,
        prompt,
        imageDataUrl: fileUrl,
        direction: direction.title,
        directionNote: direction.note,
      },
    }).then((result) => {
      if (!result.ok || !result.dataUrl) throw new Error(result.error || "Concept rendering failed.");
      return result.dataUrl;
    });
    conceptJobs.set(key, job);
    job.then((url) => {
      if (!alive) return;
      setConceptUrl(url);
      setRendering(false);
    }).catch((error: unknown) => {
      conceptJobs.delete(key);
      if (!alive) return;
      setConceptError(error instanceof Error ? error.message : "Concept rendering failed.");
      setRendering(false);
    });
    return () => {
      alive = false;
    };
  }, [settingsReady, stage, settings.renderConcepts, conceptKey, assetName, location, prompt, fileUrl, direction.title, direction.note]);

  const downloadBrief = () => {
    const metricLines = metrics
      ? `\nImage metrics:\n- ${metrics.width} × ${metrics.height}px\n- Luminance ${metrics.meanLuminance} · Contrast ${metrics.contrast} · Sharpness ${metrics.sharpness}\n- SHA-256 ${metrics.fingerprint}\n`
      : "";
    const boxes = detections.length
      ? `\nDetected objects (YOLOX-S, unverified):\n${detections.map(d => `- ${d.label} ${Math.round(d.score * 100)}%`).join("\n")}\n`
      : "";
    const words = textHits.length
      ? `\nVisible text (PP-OCRv5, unverified):\n${textHits.map(hit => `- ${hit.text}`).join("\n")}\n`
      : "";
    const content = `APERTURE INTELLIGENCE BRIEF\n\nAsset: ${assetName}\nLocation: ${location}\nSource: ${source === "live" ? "Live visual reading" : "Demo markers"}\n${summary ? `\nScene:\n${summary}\n` : ""}${metricLines}${boxes}${words}\nDiscovery objective:\n${prompt}\n\nFindings:\n${findings.map(f => `- ${f.title} — ${f.type} (${f.confidence}, ${Math.round(f.score * 100)}%): ${f.detail}\n  Evidence: ${f.evidence}`).join("\n")}\n\nNote: Observations are not measurements of the asset, an inspection, a valuation, or professional advice. Boxes are COCO-class detections, not defects. Recognized text can be wrong. RF-DETR and SAM 2 are not loaded.`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "aperture-intelligence-brief.txt"; a.click();
    URL.revokeObjectURL(url);
    const note = runAutomations("brief");
    notify(note ? `Brief exported. ${note}` : "Intelligence brief exported.");
  };

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
      <div className="sidebar-top"><Brand/><button className="icon-button mobile-close" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={18}/></button></div>
      <div className="workspace-switch"><div className="workspace-avatar">A</div><div className="workspace-copy"><strong>APERTURE Studio</strong><span>Personal workspace</span></div><ChevronDown size={15}/></div>
      <div className="nav-label">WORKSPACE</div>
      <button className={`nav-item ${desk === "discovery" ? "active" : ""}`} onClick={() => { setDesk("discovery"); setMobileNav(false); }}><Compass size={17}/> Discovery workspace {desk === "discovery" && <span className="nav-live"/>}</button>
      <button className={`nav-item ${desk === "crm" ? "active" : ""}`} onClick={() => { setDesk("crm"); setMobileNav(false); }}><Users size={17}/> Engagement {desk === "crm" && <span className="nav-live"/>}</button>
      <button className="nav-item" onClick={() => { setShowLayers(true); setMobileNav(false); }}><Layers3 size={17}/> Intelligence library</button>
      <button className="nav-item" onClick={() => notify("Project tracking is coming into view.")}><Grid2X2 size={17}/> Projects</button>
      <div className="nav-label nav-label-spaced">YOUR WORK</div>
      <div className="recent-item"><span className="recent-dot cyan-dot"/> Three-tenant center <small>Today</small></div>
      <div className="recent-item"><span className="recent-dot gold-dot"/> Northside retail site <small>Oct 28</small></div>
      <button className="new-discovery" onClick={() => {setStage("discover");setMobileNav(false);}}><Plus size={16}/> New discovery</button>
      <div className="sidebar-bottom">
        <div className="signal-card"><div className="signal-icon"><Sparkles size={15}/></div><div><strong>See the bigger picture.</strong><p>Turn visual evidence into your next informed move.</p></div></div>
        <button className="nav-item" onClick={() => { setShowSettings(true); setMobileNav(false); }}><CircleHelp size={17}/> Help & guidance</button>
        <button className="nav-item" onClick={() => { setShowSettings(true); setMobileNav(false); }}><Settings2 size={17}/> Preferences</button>
        <div className="profile"><div className="profile-avatar">MM</div><div><strong>Workspace owner</strong><span>Visionary plan · Demo</span></div><MoreHorizontal size={18}/></div>
      </div>
    </aside>

    <main className="main">
      <header className="topbar">
        <div className="topbar-left"><button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={19}/></button><div className="breadcrumb">Workspace <ChevronRight size={14}/> <strong>{desk === "crm" ? "Engagement" : "Discovery"}</strong></div></div>
        <div className="topbar-right"><button className={`system-status ${apiAvailable === false ? "is-off" : ""}`} onClick={() => setShowSettings(true)}><span/> {apiAvailable === null ? "CHECKING API" : apiAvailable ? "API CONNECTED" : "API UNAVAILABLE"}</button><button className="icon-button" aria-label="Notifications" onClick={() => notify("You're all caught up.")}><Bell size={17}/></button><div className="top-avatar">MM</div></div>
      </header>

      <div className="content">
        <div className="page-heading">
          {desk === "crm" ? <div><div className="eyebrow"><span className="eyebrow-line"/> ENGAGEMENT</div><h1>Reach people <em>you may contact.</em></h1><p className="page-subtitle">Contacts, campaigns, and automations. Delivery stays off until a channel is connected.</p></div> : <div><div className="eyebrow"><span className="eyebrow-line"/> INTELLIGENCE IN MOTION</div><h1>See beyond <em>the visible.</em></h1><p className="page-subtitle">Every image holds a bigger picture. Let's uncover what matters.</p></div>}
          <div className="heading-actions"><span className="saved-state"><span/> {desk === "crm" ? "Saved in this browser" : "Auto-saved"}</span>{desk === "discovery" && <button className="outline-button" onClick={() => setShowBrief(true)}><FileText size={15}/> View brief</button>}</div>
        </div>

        {desk === "crm" ? <EngagementDesk onNotify={notify} /> : <>
        <section className="journey" aria-label="Discovery progress">
          <div className="journey-track"><div className="journey-progress" style={{width: `${currentIndex * 25}%`}}/></div>
          {stages.map((s, i) => <button key={s.id} onClick={() => setStage(s.id)} className={`journey-step ${i === currentIndex ? "current" : ""} ${i < currentIndex ? "complete" : ""}`}>
            <span className="step-node">{i < currentIndex ? <Check size={13}/> : s.n}</span><span className="step-text"><strong>{s.label}</strong><small>{s.sub}</small></span>
          </button>)}
        </section>

        {stage === "discover" && <section className="stage-layout discover-layout">
          <div className="stage-main">
            <div className="section-kicker"><span>01</span> / DISCOVER</div>
            <h2>Start with what<br/>you <em>see.</em></h2>
            <p className="stage-description">Bring a place, an image, or a question. APERTURE will help structure the discovery around what you want to understand.</p>
            <div className="input-panel">
              <div className="panel-label"><ImageIcon size={15}/> YOUR VISUAL STARTING POINT</div>
              <div className={`upload-zone ${fileUrl ? "has-file" : ""}`} onClick={() => uploadRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) void ingest(f); }}>
                {fileUrl ? <img className="uploaded-preview" src={fileUrl} alt="" /> : <div className="upload-graphic"><div className="upload-frame"><CloudUpload size={24}/><span className="upload-cross">+</span></div></div>}
                <div className="upload-copy"><strong>{fileUrl ? fileName : "Drop an image to begin"}</strong><span>{fileUrl ? "Image ready · Click to replace" : "or browse files from your device"}</span></div>
                <button className="browse-button" onClick={e => {e.stopPropagation();uploadRef.current?.click();}}>{fileUrl ? "Replace image" : "Browse images"}</button>
                <input ref={uploadRef} type="file" accept="image/*" hidden onChange={onFile}/>
              </div>
              <div className="field-grid">
                <label className="field"><span>ASSET / SUBJECT</span><input value={assetName} onChange={e => setAssetName(e.target.value)} placeholder="Name this discovery"/></label>
                <label className="field"><span>LOCATION <small>OPTIONAL</small></span><div className="field-with-icon"><MapPin size={15}/><input value={location} onChange={e => setLocation(e.target.value)} placeholder="Add a location"/></div></label>
              </div>
              <label className="field prompt-field"><span>WHAT DO YOU WANT TO DISCOVER?</span><textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3} placeholder="Describe what you want to understand..."/></label>
              <div className="prompt-suggestions"><span>TRY:</span><button onClick={() => setPrompt("Identify visible property features and potential maintenance concerns.")}>Condition review</button><button onClick={() => setPrompt("Find opportunities to improve visibility, access, and customer experience.")}>Opportunity scan</button><button onClick={() => setPrompt("Explore signage, branding, and exterior transformation possibilities.")}>Transformation ideas</button></div>
              <div className="panel-footer"><span><ShieldCheck size={14}/> {settings.liveAnalysis ? "Begin discovery sends this image to the visual API." : "Live analysis is off. Demo markers will be used."}</span><button className="primary-button" onClick={() => void begin()} disabled={analyzing}>{analyzing ? "Reading the image…" : "Begin discovery"} <ArrowRight size={16}/></button></div>
            </div>
          </div>
          <aside className="stage-aside">
            <div className="aside-orbit"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orbit-core"><Aperture size={31}/></div><span className="orbit-point p1"/><span className="orbit-point p2"/><span className="orbit-point p3"/></div>
            <div className="aside-copy"><div className="aside-overline">A DIFFERENT WAY OF SEEING</div><h3>Clarity begins<br/>with <em>curiosity.</em></h3><p>Start broad. Follow the evidence. Let the most meaningful insights emerge naturally.</p></div>
            <div className="aside-note"><span className="note-icon"><Focus size={16}/></span><div><strong>One canvas. A wider view.</strong><p>Images, context, findings, and next steps — connected in one continuous experience.</p></div></div>
          </aside>
        </section>}

        {stage === "reveal" && <section className="stage-layout work-layout">
          <div className="stage-main wide-main">
            <div className="section-kicker"><span>02</span> / REVEAL</div>
            <div className="work-heading"><div><h2>Look closer.<br/><em>See the signals.</em></h2><p className="stage-description">A visual reading of the scene, with evidence points to explore.</p></div><span className="demo-tag"><span/> {source === "live" ? "LIVE READING" : "DEMO MARKERS"}</span></div>
            <div className="evidence-workspace">
              <div className="evidence-toolbar"><div><span className="live-dot"/> VISUAL EVIDENCE CANVAS <small>· {assetName || "Untitled discovery"}</small></div><button className="tool-icon" onClick={() => notify("Canvas view controls are illustrative.")}><MoreHorizontal size={18}/></button></div>
              <div className="evidence-image">
                {fileUrl ? <div className="evidence-stage"><img className="evidence-shot" src={fileUrl} alt={assetName || "Uploaded scene"} /><div className="evidence-overlay">
                  <div className="image-vignette"/>
                  <div className="image-coordinate">APERTURE / OBJECT DETECTOR / YOLOX-S</div>
                  {detections.map(d => <button key={d.id} className={`detect-box ${selectedDetection === d.id ? "on" : ""}`} style={{left:`${d.x}%`,top:`${d.y}%`,width:`${d.w}%`,height:`${d.h}%`}} onClick={() => setSelectedDetection(d.id)} aria-label={`${d.label}, ${Math.round(d.score * 100)} percent`}><span>{d.label} {Math.round(d.score * 100)}</span></button>)}
                  {textHits.map(hit => <button key={hit.id} className={`text-box ${selectedText === hit.id ? "on" : ""}`} style={{left:`${hit.x}%`,top:`${hit.y}%`,width:`${hit.w}%`,height:`${hit.h}%`}} onClick={() => setSelectedText(hit.id)} aria-label={`Text ${hit.text}`}><span>{hit.text}</span></button>)}
                  {findings.map(f => <button key={f.id} className={`evidence-pin pin-${f.color} ${selectedFinding === f.id ? "pin-selected" : ""}`} style={{left:`${f.x}%`,top:`${f.y}%`}} onClick={() => setSelectedFinding(f.id)} aria-label={`View ${f.title}`}><span>{f.id}</span></button>)}
                  <div className="image-scale"><span>FIELD OF VIEW</span><span>100%</span></div>
                </div></div> : <>
                  <SceneIllustration/>
                  <div className="image-vignette"/>
                  <div className="image-coordinate">APERTURE / VISUAL SCAN / 001</div>
                  {findings.map(f => <button key={f.id} className={`evidence-pin pin-${f.color} ${selectedFinding === f.id ? "pin-selected" : ""}`} style={{left:`${f.x}%`,top:`${f.y}%`}} onClick={() => setSelectedFinding(f.id)} aria-label={`View ${f.title}`}><span>{f.id}</span></button>)}
                  <div className="image-scale"><span>FIELD OF VIEW</span><span>100%</span></div>
                </>}
              </div>
              <div className="canvas-footer"><span><Scan size={14}/> {fileUrl ? fileName || "User-provided image" : "Illustrative commercial property scene"}</span><span>{detections.length || textHits.length ? `${detections.length} objects · ${textHits.length} text` : `${String(findings.length).padStart(2, "0")} evidence markers`} <i/> {detections.length || textHits.length ? "YOLOX-S · PP-OCRv5" : source === "live" ? "From the image" : "Demo data"}</span></div>
            </div>
            <div className="evidence-list">
              {metrics && <div className="metric-strip"><div><span>RESOLUTION</span><strong>{metrics.width} × {metrics.height}</strong></div><div><span>LUMINANCE</span><strong>{metrics.meanLuminance.toFixed(0)}</strong></div><div><span>CONTRAST</span><strong>{metrics.contrast.toFixed(0)}</strong></div><div><span>SHARPNESS</span><strong>{metrics.sharpness.toFixed(0)}</strong></div><div><span>SHA-256</span><strong>{metrics.fingerprint}</strong></div></div>}
              {detections.length > 0 && <div className="detect-list">{detections.map(d => <button key={d.id} className={selectedDetection === d.id ? "on" : ""} onClick={() => setSelectedDetection(d.id)}><strong>{d.label}</strong><span>{Math.round(d.score * 100)}%</span></button>)}</div>}
              {textHits.length > 0 && <div className="detect-list text-list">{textHits.map(hit => <button key={hit.id} className={selectedText === hit.id ? "on" : ""} onClick={() => setSelectedText(hit.id)}><strong>{hit.text}</strong><span>{Math.round(hit.score * 100)}%</span></button>)}</div>}
              {summary && source === "live" ? <p className="scene-summary">{summary}</p> : null}
              <div className="list-heading"><div><span className="section-mini">OBSERVATIONS</span><h3>Signals worth exploring</h3></div><span className="count-pill">{String(findings.length).padStart(2, "0")} FOUND</span></div>
              {findings.map(f => <button key={f.id} className={`finding-row ${selectedFinding === f.id ? "finding-active" : ""}`} onClick={() => setSelectedFinding(f.id)}>
                <span className={`finding-index ${f.color}`}>0{f.id}</span><span className="finding-copy"><strong>{f.title}</strong><small>{f.type}</small></span><span className={`confidence ${f.confidence.toLowerCase()}`}>{f.confidence} confidence</span><ChevronRight size={16}/>
              </button>)}
            </div>
          </div>
          <aside className="insight-panel"><div className="panel-label"><Sparkles size={14}/> SELECTED SIGNAL</div><div className={`insight-number ${finding.color}`}>0{finding.id}</div><div className="insight-type">{finding.type}</div><h3>{finding.title}</h3><p>{finding.detail}</p>{finding.evidence ? <p className="evidence-basis">{finding.evidence}</p> : null}<div className="confidence-block"><span>{source === "live" ? `UNVERIFIED · ${finding.source.toUpperCase()}` : "DEMO CONFIDENCE"}</span><strong>{finding.confidence}</strong><div className="confidence-track"><i style={{width:`${Math.round(finding.score * 100)}%`}}/></div></div><div className="insight-disclaimer"><ShieldCheck size={15}/> {source === "live" ? "Machine observation. Not a measurement, inspection, or valuation. Human review is required." : "Demo markers. Turn on live analysis in Preferences to read an uploaded image."}</div><button className="text-action" onClick={() => setStage("envision")}>Explore this opportunity <ArrowRight size={15}/></button></aside>
        </section>}

        {stage === "envision" && <section className="stage-layout work-layout">
          <div className="stage-main wide-main">
            <div className="section-kicker"><span>03</span> / ENVISION</div>
            <h2>Imagine what<br/><em>could be.</em></h2>
            <p className="stage-description">Move from observation to possibility. Compare directions before committing to a plan.</p>
            <div className="concept-card">
              <div className="concept-visual">
                <div className="concept-plate">
                  {fileUrl ? <img className="concept-photo" src={fileUrl} alt="Current scene" /> : <SceneIllustration />}
                </div>
                <div className="concept-plate concept-plate-after" style={{ clipPath: `inset(0 0 0 ${compare}%)` }}>
                  {conceptUrl ? <img className="concept-photo" src={conceptUrl} alt="Rendered possibility" /> : <div className="concept-wait">{rendering ? "Rendering possibility…" : conceptError ? "Rendering failed" : settings.renderConcepts ? "Waiting to render" : "Concept rendering is off"}</div>}
                </div>
                <div className="concept-divider" style={{left:`${compare}%`}}><span><ChevronLeft size={13}/><ChevronRight size={13}/></span></div>
                <input className="compare-range" type="range" min="10" max="90" value={compare} onChange={e=>setCompare(Number(e.target.value))} aria-label="Compare concept view"/>
                <span className="concept-label before-label">CURRENT</span><span className="concept-label after-label">POSSIBILITY</span>
              </div>
              <div className="concept-caption"><div><span className="concept-kicker">DIRECTION · {direction.title.toUpperCase()}</span><h3>{direction.title}.</h3><p>{conceptError || direction.note}. Drag the slider to compare the current scene with the rendered possibility. This is a concept study, not a construction drawing.</p></div><span className="concept-status">{rendering ? "RENDERING" : conceptUrl ? "RENDERED" : "WAITING"}</span></div>
            </div>
            <div className="concept-options">{directions.map(item => <button key={item.id} className={`concept-option ${item.id === direction.id ? "active" : ""}`} onClick={() => setDirectionId(item.id)}><span className={`option-swatch ${item.swatch}`}/><span><strong>{item.title}</strong><small>{item.note}</small></span>{item.id === direction.id ? <Check size={16}/> : <ArrowUpRight size={15}/>}</button>)}</div>
          </div>
          <aside className="insight-panel envision-aside"><div className="panel-label"><WandSparkles size={14}/> CREATIVE INTENT</div><h3>Possibility is a starting point.</h3><p>{settings.renderConcepts ? "The possibility side is rendered from your scene and the selected direction. It is a study, not a permit set." : "Concept rendering is off. Turn it on in Preferences to generate the possibility image."}</p>{conceptError ? <button className="text-action" onClick={() => setConceptRetry(n => n + 1)}>Try rendering again <ArrowRight size={15}/></button> : null}<div className="aside-stat"><span>01</span><div><strong>Explore</strong><small>Surface possible directions</small></div></div><div className="aside-stat"><span>02</span><div><strong>Compare</strong><small>Understand the visual trade-offs</small></div></div><div className="aside-stat"><span>03</span><div><strong>Refine</strong><small>Prepare a brief for execution</small></div></div><button className="text-action" onClick={() => setStage("quantify")}>Understand the impact <ArrowRight size={15}/></button></aside>
        </section>}

        {stage === "quantify" && <section className="stage-layout work-layout">
          <div className="stage-main wide-main">
            <div className="section-kicker"><span>04</span> / QUANTIFY</div>
            <h2>Make the value<br/><em>understandable.</em></h2>
            <p className="stage-description">Frame the decisions, dependencies, and information needed before assigning a budget or forecast.</p>
            <div className="metrics-grid">
              <div className="metric-card"><span>OPPORTUNITY AREAS</span><strong>{String(findings.length).padStart(2, "0")}</strong><small><span className="metric-dot cyan-dot"/> Areas identified for review</small></div>
              <div className="metric-card"><span>DECISION READINESS</span><strong>Early</strong><small><span className="metric-dot gold-dot"/> More evidence required</small></div>
              <div className="metric-card"><span>ESTIMATE STATUS</span><strong>Pending</strong><small><span className="metric-dot violet-dot"/> No verified cost data</small></div>
            </div>
            <div className="decision-card"><div className="decision-head"><div><span className="section-mini">DECISION FRAMEWORK</span><h3>What needs to be known next?</h3></div><span className="count-pill">3 WORKSTREAMS</span></div>
              {[["01","Site verification","Confirm dimensions, access, and existing conditions."],["02","Scope definition","Select the improvement direction and define deliverables."],["03","Commercial validation","Collect supplier pricing, labor assumptions, permits, and timelines."]].map(([n,t,d])=><div className="decision-row" key={n}><span>{n}</span><div><strong>{t}</strong><small>{d}</small></div><span className="pending-label">TO VALIDATE</span></div>)}
            </div>
            <div className="honesty-note"><ShieldCheck size={17}/><p><strong>Evidence before estimates.</strong> APERTURE should only present cost, valuation, or ROI figures when there is a traceable source, stated assumptions, and a clear confidence level. This prototype intentionally does not invent financial projections.</p></div>
          </div>
          <aside className="insight-panel"><div className="panel-label"><Target size={14}/> DECISION SIGNAL</div><div className="readiness-ring"><div><strong>01</strong><span>STAGE</span></div></div><h3>Build the evidence base.</h3><p>The next valuable step is not a speculative number. It is closing the information gaps that make a reliable estimate possible.</p><button className="text-action" onClick={openActivate}>Build the action brief <ArrowRight size={15}/></button></aside>
        </section>}

        {stage === "activate" && <section className="stage-layout work-layout">
          <div className="stage-main wide-main">
            <div className="section-kicker"><span>05</span> / ACTIVATE</div>
            <h2>Turn insight<br/>into <em>momentum.</em></h2>
            <p className="stage-description">Bring the discovery together in a concise brief your team can review, refine, and put to work.</p>
            <div className="activation-card"><div className="activation-top"><div className="activation-icon"><Clipboard size={22}/></div><span className="demo-tag"><span/> READY TO REVIEW</span></div><div className="activation-kicker">APERTURE / INTELLIGENCE BRIEF</div><h3>{assetName || "Untitled discovery"}</h3><p className="activation-location"><MapPin size={14}/>{location || "Location not specified"}</p><div className="activation-divider"/><div className="brief-block"><span>DISCOVERY INTENT</span><p>{prompt}</p></div><div className="brief-block"><span>KEY AREAS TO EXPLORE</span><div className="brief-tags">{findings.map(f=><span key={f.id}>{f.title}</span>)}</div></div><div className="brief-block"><span>RECOMMENDED NEXT MOVES</span><ol><li>Validate the visual observations with on-site or source evidence.</li><li>Confirm scope and gather relevant technical requirements.</li><li>Request sourced pricing and timelines from qualified providers.</li></ol></div><div className="activation-actions"><button className="primary-button" onClick={downloadBrief}><Download size={16}/> Export intelligence brief</button><button className="outline-button" onClick={() => setStage("discover")}><Plus size={15}/> Start another discovery</button></div></div>
            <div className="closing-line"><Aperture size={17}/> <span>SEE BEYOND THE VISIBLE.</span><i/> <span>MOVE WITH CLARITY.</span></div>
          </div>
          <aside className="insight-panel"><div className="panel-label"><Zap size={14}/> NEXT CHAPTER</div><h3>From visual intelligence to real-world action.</h3><p>This is where APERTURE can connect to specialist workflows: property assessment, contractor scoping, insurance documentation, signage planning, and partner services.</p><div className="integration-list"><span><span className="integration-dot"/> Property & asset intelligence</span><span><span className="integration-dot"/> Contractor & supplier network</span><span><span className="integration-dot"/> Insurance & risk workflows</span><span><span className="integration-dot"/> Spatial & geospatial context</span></div><div className="integration-note">Future integrations · Not connected in this prototype</div></aside>
        </section>}

        <footer className="stage-footer"><button className="back-button" onClick={back} disabled={currentIndex===0}><ChevronLeft size={16}/> Back</button><div className="footer-center"><span>APERTURE</span><i/> VISUAL INTELLIGENCE / 2026</div>{currentIndex < 4 ? <button className="next-button" onClick={advance}>Continue to {stages[currentIndex+1].label} <ArrowRight size={16}/></button> : <button className="next-button" onClick={downloadBrief}>Export brief <Download size={15}/></button>}</footer>
        </>}
      </div>
    </main>

    {showLayers && <div className="modal-backdrop" onClick={() => setShowLayers(false)}><div className="brief-modal layers-modal" onClick={e => e.stopPropagation()}><div className="modal-head"><div><span className="section-mini">INTELLIGENCE ENGINE</span><h3>What is actually running</h3></div><button className="icon-button" onClick={() => setShowLayers(false)} aria-label="Close intelligence library"><X size={18}/></button></div><p className="layers-lead">YOLOX-S draws object boxes. PP-OCRv5 reads visible text. Grok writes the scene notes. Pixel metrics stay in the browser. The remaining rows are slots.</p><div className="layer-list">{engineLayers.map(layer => <div key={layer.name} className="layer-row"><span className={layer.state === "Live" && layer.name !== "Grok vision" && layer.name !== "Concept render" || (layer.name === "Grok vision" && apiAvailable) || (layer.name === "Concept render" && apiAvailable && settings.renderConcepts) ? "dot on" : "dot"}/><div><strong>{layer.name}</strong><small>{layer.role}</small></div><em>{layer.name === "Grok vision" ? (apiAvailable ? "Live" : "Off") : layer.name === "Concept render" ? (apiAvailable && settings.renderConcepts ? "Live" : "Off") : layer.state}</em></div>)}</div><p className="modal-disclaimer">A slot is not a detection. No cost, valuation, or ROI is calculated. Findings stay machine observations until a person reviews them.</p><button className="primary-button full-button" onClick={() => setShowLayers(false)}>Done</button></div></div>}
    {showSettings && <div className="modal-backdrop" onClick={() => setShowSettings(false)}><div className="brief-modal" onClick={e => e.stopPropagation()}><div className="modal-head"><div><span className="section-mini">WORKSPACE</span><h3>Preferences</h3></div><button className="icon-button" onClick={() => setShowSettings(false)} aria-label="Close preferences"><X size={18}/></button></div><p className={`api-pill ${apiAvailable ? "ok" : "off"}`}>{apiAvailable === null ? "CHECKING API" : apiAvailable ? "API CONNECTED · GROK-4.5" : "API UNAVAILABLE"}</p><div className="settings-list"><div className="settings-row"><div><strong>Live analysis</strong><p>Begin discovery reads the uploaded image and returns evidence markers. Off keeps the demo markers.</p></div><button className={`toggle ${settings.liveAnalysis ? "on" : ""}`} role="switch" aria-checked={settings.liveAnalysis} onClick={() => saveSettings({ ...settings, liveAnalysis: !settings.liveAnalysis })}><i/></button></div><div className="settings-row"><div><strong>Concept rendering</strong><p>Envision renders one possibility image for the selected direction. Each new direction is a new render.</p></div><button className={`toggle ${settings.renderConcepts ? "on" : ""}`} role="switch" aria-checked={settings.renderConcepts} onClick={() => saveSettings({ ...settings, renderConcepts: !settings.renderConcepts })}><i/></button></div></div><p className="modal-disclaimer">Images stay in this session until you send them. Analysis and renders run only when you start a discovery or open Envision. They are not measurements, inspections, or cost estimates.</p><button className="primary-button full-button" onClick={() => setShowSettings(false)}>Done</button></div></div>}
    {showBrief && <div className="modal-backdrop" onClick={() => setShowBrief(false)}><div className="brief-modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><span className="section-mini">DISCOVERY OVERVIEW</span><h3>Intelligence brief</h3></div><button className="icon-button" onClick={() => setShowBrief(false)}><X size={18}/></button></div><p className="modal-asset">{assetName || "Untitled discovery"}</p><p className="modal-location"><MapPin size={14}/>{location || "Location not specified"}</p><div className="modal-progress">{stages.map((s,i)=><div key={s.id} className={i<=currentIndex?"modal-done":""}><span>{i<currentIndex?<Check size={11}/>:s.n}</span>{s.label}</div>)}</div><p className="modal-disclaimer">{source === "live" ? "Live reading of the image and question. Not a measurement, inspection, or valuation." : "Demo markers. Turn on live analysis in Preferences to read an uploaded image."}</p><button className="primary-button full-button" onClick={() => {setShowBrief(false);downloadBrief();}}>Export brief <Download size={15}/></button></div></div>}
    {toast && <div className="toast"><Check size={15}/>{toast}</div>}
    <div className="demo-watermark">{source === "live" ? "LIVE READING" : "DEMO MARKERS"} <span>·</span> {settings.liveAnalysis ? "API ON" : "API OFF"}</div>
  </div>;
}

export default App;
