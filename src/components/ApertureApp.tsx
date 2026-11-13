import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clipboard,
  CloudUpload,
  Compass,
  Download,
  FileText,
  Focus,
  Grid2X2,
  Home,
  Image as ImageIcon,
  Layers3,
  MapPin,
  Menu,
  MoreHorizontal,
  PenTool,
  Plus,
  RotateCcw,
  Scan,
  Settings2,
  ShieldCheck,
  Sliders,
  Sparkles,
  Sun,
  Target,
  Users,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import {
  analyzeDiscovery,
  apiStatus,
  renderConcept,
  type Detection,
  type Finding,
  type TextHit,
} from "@/lib/aperture.functions";
import { runAutomations } from "@/lib/crm";
import EngagementDesk from "@/components/EngagementDesk";
import {
  BASELINE_SPEC,
  DEFAULT_UPGRADE_SPEC,
  buildTradeItems,
  parseNaturalLanguageToSpec,
  renderResidentialSceneToDataUrl,
  type EditZone,
  type RenderRevision,
  type ResidentialUpgradeSpec,
} from "@/lib/residential-renderer";

const stages = [
  { id: "sight", n: "01", label: "Sight", sub: "Market & envelope evidence" },
  { id: "worth", n: "02", label: "Worth", sub: "Underwriting & receipts" },
  { id: "work", n: "03", label: "Work", sub: "Render & AI Edit studio" },
  { id: "story", n: "04", label: "Story", sub: "Marketing & property dossier" },
];

type ComparableReceipt = {
  id: string;
  address: string;
  distance: string;
  closedDate: string;
  salePriceUsd: number;
  sqft: number;
  pricePerSqft: number;
  similarityPct: number;
  note: string;
};

type ResidencePreset = {
  id: string;
  name: string;
  location: string;
  era: string;
  baselineWorthUsd: number;
  worthConfidencePct: number;
  asOfDate: string;
  comparables: ComparableReceipt[];
  prompt: string;
  upgradePrompt: string;
  findings: Finding[];
};

const RESIDENCE_PRESETS: ResidencePreset[] = [
  {
    id: "crestwood",
    name: "742 Crestwood Lane — Single-Family Ranch",
    location: "Austin, Texas · 78704",
    era: "1968 Brick Ranch · 2,480 sq ft",
    baselineWorthUsd: 945000,
    worthConfidencePct: 93,
    asOfDate: "2026-11-12",
    comparables: [
      {
        id: "COMP-78704-A",
        address: "814 Crestwood Ln, Austin TX",
        distance: "0.14 mi",
        closedDate: "2026-10-18",
        salePriceUsd: 962000,
        sqft: 2510,
        pricePerSqft: 383,
        similarityPct: 95,
        note: "Unrenovated 1969 brick ranch on 0.22-acre lot",
      },
      {
        id: "COMP-78704-B",
        address: "609 Hollow Creek Dr, Austin TX",
        distance: "0.31 mi",
        closedDate: "2026-09-29",
        salePriceUsd: 1095000,
        sqft: 2490,
        pricePerSqft: 440,
        similarityPct: 91,
        note: "Renovated standing-seam metal roof + limewash masonry",
      },
      {
        id: "COMP-78704-C",
        address: "1102 Barton Skyway, Austin TX",
        distance: "0.48 mi",
        closedDate: "2026-10-04",
        salePriceUsd: 928000,
        sqft: 2420,
        pricePerSqft: 383,
        similarityPct: 92,
        note: "Original 3-tab shingle & builder-grade aluminum glazing",
      },
    ],
    prompt:
      "Evaluate roof shingle weathering, uncoated 1960s red brick masonry, builder-grade aluminum windows, and front entry curb appeal.",
    upgradePrompt:
      "Install charcoal standing-seam metal roof with copper gutters, warm alabaster limewash brick with limestone wainscot, matte black steel casement windows, western red cedar pergola with oak pivot door, fluted walnut garage door, herringbone bluestone walkway, and golden hour architectural lighting.",
    findings: [
      {
        id: 1,
        title: "Primary roof slope & ridge line",
        type: "Roofing & Envelope · Curvature & wear",
        confidence: "High",
        x: 48,
        y: 26,
        color: "gold",
        detail:
          "Existing 3-tab asphalt shingle roof exhibits granule weathering along the south-facing slope; prime candidate for 24-ga charcoal standing-seam metal or architectural slate.",
        evidence: "Machine observation on elevation baseline. On-site deck & flashing inspection required.",
        score: 0.91,
        source: "the-loupe",
      },
      {
        id: 2,
        title: "Uncoated red brick masonry facade",
        type: "Facade & Cladding · Masonry finish",
        confidence: "High",
        x: 29,
        y: 52,
        color: "cyan",
        detail:
          "Low-contrast 1968 brick facade absorbs natural daylight. Breathable mineral limewash or vertical board-and-batten cladding will modernize proportions.",
        evidence: "Machine observation from facade luminance and mortar contrast profile.",
        score: 0.87,
        source: "the-loupe",
      },
      {
        id: 3,
        title: "Single-pane aluminum window units",
        type: "Fenestration & Glazing · Sightlines",
        confidence: "Medium",
        x: 36,
        y: 48,
        color: "violet",
        detail:
          "Wide silver aluminum frames interrupt the front elevation rhythm. Narrow-sightline matte black steel casements improve both U-factor and curb geometry.",
        evidence: "Visible frame profile along primary front gable bays.",
        score: 0.76,
        source: "the-loupe",
      },
      {
        id: 4,
        title: "Stamped sectional garage & concrete apron",
        type: "Entry & Hardscape · Arrival sequence",
        confidence: "High",
        x: 74,
        y: 62,
        color: "gold",
        detail:
          "The two-car garage occupies 38% of the street elevation. Upgrading to horizontal fluted walnut or frosted glass with a herringbone bluestone apron anchors the home.",
        evidence: "Proportional elevation span and visible expansion joint cracking.",
        score: 0.84,
        source: "the-loupe",
      },
    ],
  },
  {
    id: "beverly",
    name: "1804 Beverly Drive — Tudor Revival Residence",
    location: "Highland Park, Texas · 75205",
    era: "1926 Tudor Revival · 3,620 sq ft",
    baselineWorthUsd: 2180000,
    worthConfidencePct: 91,
    asOfDate: "2026-11-12",
    comparables: [
      {
        id: "COMP-75205-A",
        address: "1719 Beverly Dr, Highland Park TX",
        distance: "0.09 mi",
        closedDate: "2026-10-11",
        salePriceUsd: 2150000,
        sqft: 3580,
        pricePerSqft: 601,
        similarityPct: 94,
        note: "1928 Tudor prior to exterior envelope restoration",
      },
      {
        id: "COMP-75205-B",
        address: "3812 Miramar Ave, Highland Park TX",
        distance: "0.24 mi",
        closedDate: "2026-09-19",
        salePriceUsd: 2345000,
        sqft: 3660,
        pricePerSqft: 641,
        similarityPct: 90,
        note: "Restored slate roof, copper gutters & limestone portico",
      },
      {
        id: "COMP-75205-C",
        address: "3604 Euclid Ave, Highland Park TX",
        distance: "0.37 mi",
        closedDate: "2026-10-22",
        salePriceUsd: 2210000,
        sqft: 3610,
        pricePerSqft: 612,
        similarityPct: 92,
        note: "Comparable lot frontage with updated bronze casements",
      },
    ],
    prompt:
      "Assess steep gable roof slate condition, masonry limewash potential, steel casement sightlines, and arched limestone portico entry.",
    upgradePrompt:
      "Upgrade to architectural natural slate roof with half-round copper gutters, smooth warm Santa Barbara stucco with limestone watertable, anodized bronze architectural windows, carved limestone arched portico, artisan carriage oak garage door, permeable ivory travertine pavers, and twilight 2700K lighting.",
    findings: [
      {
        id: 1,
        title: "Steep-pitch gable roof & valleys",
        type: "Roofing & Envelope · Slate & copper spec",
        confidence: "High",
        x: 42,
        y: 25,
        color: "gold",
        detail:
          "High-visibility front gable slope benefits from synthetic architectural slate paired with half-round copper valleys and downspouts.",
        evidence: "Machine observation of pitch geometry and eave line.",
        score: 0.89,
        source: "the-loupe",
      },
      {
        id: 2,
        title: "Front entry stoop & transom bay",
        type: "Entry & Millwork · Portico architecture",
        confidence: "High",
        x: 44,
        y: 56,
        color: "cyan",
        detail:
          "Adding a carved limestone portico and arched oak entry door establishes a sheltered, period-authentic focal point.",
        evidence: "Elevation center-axis alignment.",
        score: 0.85,
        source: "the-loupe",
      },
      {
        id: 3,
        title: "Driveway apron & foundation planting",
        type: "Hardscape & Lighting · Permeable stone",
        confidence: "Medium",
        x: 68,
        y: 74,
        color: "violet",
        detail:
          "Replacing monolithic concrete with ivory travertine pavers and sculpted boxwood parterres softens the street transition.",
        evidence: "Foreground hardscape coverage ratio.",
        score: 0.74,
        source: "the-loupe",
      },
    ],
  },
  {
    id: "peachtree",
    name: "315 Peachtree Battle Ave — Traditional Split-Level",
    location: "Atlanta, Georgia · 30305",
    era: "1994 Traditional Brick · 3,150 sq ft",
    baselineWorthUsd: 1320000,
    worthConfidencePct: 92,
    asOfDate: "2026-11-12",
    comparables: [
      {
        id: "COMP-30305-A",
        address: "289 Peachtree Battle Ave, Atlanta GA",
        distance: "0.12 mi",
        closedDate: "2026-10-08",
        salePriceUsd: 1310000,
        sqft: 3120,
        pricePerSqft: 420,
        similarityPct: 94,
        note: "1992 traditional brick elevation on wooded parcel",
      },
      {
        id: "COMP-30305-B",
        address: "412 Woodward Way NW, Atlanta GA",
        distance: "0.28 mi",
        closedDate: "2026-09-24",
        salePriceUsd: 1465000,
        sqft: 3190,
        pricePerSqft: 459,
        similarityPct: 91,
        note: "Renovated board-and-batten + standing-seam metal roof",
      },
      {
        id: "COMP-30305-C",
        address: "244 Alton Rd NW, Atlanta GA",
        distance: "0.41 mi",
        closedDate: "2026-10-15",
        salePriceUsd: 1340000,
        sqft: 3160,
        pricePerSqft: 424,
        similarityPct: 90,
        note: "Updated fenestration and bluestone front walk",
      },
    ],
    prompt:
      "Review roof solar readiness, fiber-cement board-and-batten conversion, divided-light window upgrade, and evening landscape illumination.",
    upgradePrompt:
      "Install standing-seam metal roof with integrated flush solar panels, architectural sage board-and-batten siding with stone wainscot, black steel casement windows with shutters, cantilevered steel and brass canopy, frosted glass and black steel garage door, herringbone bluestone walkway, and twilight 2700K soffit lighting.",
    findings: [
      {
        id: 1,
        title: "Unobstructed upper roof plane",
        type: "Roofing & Envelope · Solar + metal integration",
        confidence: "High",
        x: 54,
        y: 24,
        color: "gold",
        detail:
          "Continuous ridge plane supports a standing-seam metal envelope with flush-mounted monocrystalline solar glass.",
        evidence: "Unbroken upper roof span free of dormers.",
        score: 0.92,
        source: "the-loupe",
      },
      {
        id: 2,
        title: "Full-width facade cladding transition",
        type: "Facade & Cladding · Board & batten",
        confidence: "High",
        x: 31,
        y: 50,
        color: "cyan",
        detail:
          "Vertical board-and-batten in architectural sage over a dry-stacked limestone wainscot breaks up horizontal massing.",
        evidence: "Wall plane height-to-width ratio.",
        score: 0.86,
        source: "the-loupe",
      },
      {
        id: 3,
        title: "Evening curb illumination",
        type: "Hardscape & Lighting · 2700K lighting",
        confidence: "Medium",
        x: 52,
        y: 76,
        color: "violet",
        detail:
          "Low-voltage 2700K brass soffit downlights and walkway bollards dramatically improve nighttime arrival safety and architectural depth.",
        evidence: "Eave overhang depth and walkway edge geometry.",
        score: 0.79,
        source: "the-loupe",
      },
    ],
  },
];

const QUICK_UPGRADE_CHIPS = [
  {
    label: "+ Standing-Seam Metal Roof",
    snippet: "charcoal standing-seam metal roof with copper gutters",
  },
  {
    label: "+ Spanish Terracotta Roof",
    snippet: "terracotta barrel clay tile roof",
  },
  {
    label: "+ Integrated Solar Array",
    snippet: "flush low-profile monocrystalline solar panels on upper roof",
  },
  {
    label: "+ Alabaster Limewash Brick",
    snippet: "warm alabaster mineral limewash brick facade with limestone watertable",
  },
  {
    label: "+ Sage Board & Batten",
    snippet: "architectural sage vertical board-and-batten siding",
  },
  {
    label: "+ Charcoal Board & Batten",
    snippet: "deep charcoal ironstone board-and-batten cladding",
  },
  {
    label: "+ Black Steel Windows",
    snippet: "narrow-sightline matte black steel casement windows",
  },
  {
    label: "+ Cedar Pergola & Pivot Door",
    snippet: "heavy-timber western red cedar pergola and white oak pivot entry door",
  },
  {
    label: "+ Fluted Walnut Garage",
    snippet: "horizontal fluted walnut modern carriage garage door",
  },
  {
    label: "+ Frosted Glass Garage",
    snippet: "frosted glass and matte black steel modern garage door",
  },
  {
    label: "+ Herringbone Bluestone",
    snippet: "herringbone Pennsylvania bluestone walkway and driveway apron with olive trees",
  },
  {
    label: "+ Twilight 2700K Lighting",
    snippet: "twilight dusk atmosphere with warm 2700K soffit downlights and brass path bollards",
  },
];

const AI_EDIT_ZONES: { id: EditZone; label: string; hint: string }[] = [
  {
    id: "all",
    label: "Entire Residence",
    hint: "e.g., Switch to twilight 2700K lighting, sage board-and-batten siding, and solar roof panels",
  },
  {
    id: "roof",
    label: "Roof & Solar",
    hint: "e.g., Change roof to Spanish terracotta barrel tile and add flush solar panels",
  },
  {
    id: "facade",
    label: "Facade & Siding",
    hint: "e.g., Restyle exterior walls in deep charcoal board-and-batten with limestone wainscot",
  },
  {
    id: "windows",
    label: "Windows & Trim",
    hint: "e.g., Upgrade to anodized architectural bronze windows and add louvered shutters",
  },
  {
    id: "entry",
    label: "Entry & Garage",
    hint: "e.g., Swap garage door for frosted glass & black steel and add an arched limestone portico",
  },
  {
    id: "landscape",
    label: "Driveway & Landscape",
    hint: "e.g., Replace driveway with large-format ivory travertine pavers and sculpted olive trees",
  },
  {
    id: "lighting",
    label: "Lighting & Time",
    hint: "e.g., Change atmosphere to twilight dusk with warm 2700K soffit and pathway bollards",
  },
];

const AI_EDIT_QUICK_IDEAS: { zone: EditZone; label: string; instruction: string }[] = [
  {
    zone: "lighting",
    label: "Switch to Twilight 2700K Lighting",
    instruction: "Change to twilight evening atmosphere with warm 2700K soffit downlights and brass path bollards",
  },
  {
    zone: "facade",
    label: "Sage Green Board & Batten",
    instruction: "Refinish facade in architectural sage vertical board-and-batten with limestone wainscot",
  },
  {
    zone: "facade",
    label: "Deep Charcoal Ironstone Siding",
    instruction: "Refinish exterior walls in deep charcoal board-and-batten cladding",
  },
  {
    zone: "roof",
    label: "Add Flush Solar Array",
    instruction: "Add integrated flush monocrystalline solar panels to the main roof slope",
  },
  {
    zone: "roof",
    label: "Terracotta Clay Barrel Tile",
    instruction: "Replace roof with Spanish terracotta barrel clay tile and copper rainware",
  },
  {
    zone: "entry",
    label: "Frosted Glass + Black Steel Garage",
    instruction: "Swap garage door for satin-etched frosted glass in a matte black steel frame",
  },
  {
    zone: "entry",
    label: "Carved Limestone Arched Portico",
    instruction: "Replace front entry cover with a carved limestone arched portico",
  },
  {
    zone: "landscape",
    label: "Ivory Travertine Pavers",
    instruction: "Upgrade walkway and driveway apron to permeable ivory travertine pavers with specimen olive trees",
  },
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
  {
    name: "The Loupe · Pixel Telemetry",
    role: "Resolution, luminance, contrast, Laplacian sharpness, SHA-256 evidence digest",
    state: "Live",
  },
  {
    name: "The Loupe · Architectural Synthesizer",
    role: "Natural-language residential upgrade renderer & zone-targeted AI Edit compositor",
    state: "Live",
  },
  {
    name: "Grok Vision & Imagine Engine",
    role: "Cloud neural scene reading and photorealistic architectural image synthesis when API key is present",
    state: "Live",
  },
  {
    name: "YOLOX-S Object Detector",
    role: "Boxes vehicles, persons, and street context on uploaded home photos. Apache 2.0.",
    state: "Live",
  },
  {
    name: "PP-OCRv5 House & Street Reader",
    role: "Reads visible curb numbers, street signs, and parcel markers. Apache 2.0.",
    state: "Live",
  },
  {
    name: "FACET Underwriting & Receipt Ledger",
    role: "Attaches closed residential comparables, as-of dates, and confidence scores to every valuation and renovation scope number",
    state: "Live",
  },
];

type Settings = { liveAnalysis: boolean; renderConcepts: boolean };
const SETTINGS_KEY = "facet-settings-v2";
const defaultSettings: Settings = { liveAnalysis: true, renderConcepts: true };

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
        resolve(canvas.toDataURL("image/jpeg", 0.85));
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
      file
        .arrayBuffer()
        .then(async (bytes) => {
          const digest = await crypto.subtle.digest("SHA-256", bytes);
          const fingerprint = [...new Uint8Array(digest)]
            .map((byte) => byte.toString(16).padStart(2, "0"))
            .join("")
            .slice(0, 12);
          resolve({
            width: source.width,
            height: source.height,
            bytes: file.size,
            meanLuminance: Math.round(mean * 10) / 10,
            contrast: Math.round(Math.sqrt(variance / gray.length) * 10) / 10,
            sharpness: Math.round(sharpness * 10) / 10,
            fingerprint,
          });
        })
        .catch(() => reject(new Error("Could not fingerprint that image.")));
    };
    source.onerror = () => reject(new Error("Could not measure that image."));
    source.src = dataUrl;
  });
}

function FacetMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2.5L21.5 12L12 21.5L2.5 12L12 2.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path d="M12 2.5V21.5M2.5 12H21.5" stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
      <rect
        x="8.5"
        y="8.5"
        width="7"
        height="7"
        transform="rotate(45 12 12)"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function Brand() {
  return (
    <div className="brand">
      <div className="brand-mark">
        <FacetMark />
      </div>
      <div>
        <div className="brand-name">
          FACET<span>®</span>
        </div>
        <div className="brand-sub">RESIDENTIAL INTELLIGENCE</div>
      </div>
    </div>
  );
}

export default function ApertureApp() {
  const [desk, setDesk] = useState<"discovery" | "crm">("discovery");
  const [stage, setStage] = useState("sight");
  const [activePresetId, setActivePresetId] = useState<string>(RESIDENCE_PRESETS[0].id);

  // Sight state
  const [assetName, setAssetName] = useState(RESIDENCE_PRESETS[0].name);
  const [location, setLocation] = useState(RESIDENCE_PRESETS[0].location);
  const [prompt, setPrompt] = useState(RESIDENCE_PRESETS[0].prompt);
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [baselineRenderUrl, setBaselineRenderUrl] = useState("");
  const [findings, setFindings] = useState<Finding[]>(RESIDENCE_PRESETS[0].findings);
  const [source, setSource] = useState<"demo" | "live">("demo");
  const [selectedFinding, setSelectedFinding] = useState(1);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [textHits, setTextHits] = useState<TextHit[]>([]);
  const [selectedText, setSelectedText] = useState(0);
  const [selectedDetection, setSelectedDetection] = useState(0);
  const [summary, setSummary] = useState("");
  const [metrics, setMetrics] = useState<ImageMetrics | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Work (Render & AI Edit Studio) state
  const [upgradePrompt, setUpgradePrompt] = useState(RESIDENCE_PRESETS[0].upgradePrompt);
  const [aiEditInput, setAiEditInput] = useState("");
  const [editZone, setEditZone] = useState<EditZone>("all");
  const [revisions, setRevisions] = useState<RenderRevision[]>([]);
  const [activeRevisionId, setActiveRevisionId] = useState<string>("");
  const [compare, setCompare] = useState(50);
  const [rendering, setRendering] = useState(false);

  // Modals & UI chrome
  const [showBrief, setShowBrief] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState("");
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);

  const uploadRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<number | null>(null);

  const currentIndex = stages.findIndex((s) => s.id === stage);
  const activePreset =
    RESIDENCE_PRESETS.find((p) => p.id === activePresetId) || RESIDENCE_PRESETS[0];
  const finding = findings.find((f) => f.id === selectedFinding) || findings[0];
  const activeRevision =
    revisions.find((r) => r.id === activeRevisionId) || revisions[revisions.length - 1] || null;
  const activeSpec: ResidentialUpgradeSpec = activeRevision
    ? activeRevision.spec
    : { ...DEFAULT_UPGRADE_SPEC, tradeItems: buildTradeItems(DEFAULT_UPGRADE_SPEC) };

  const totalScopeCostUsd = activeSpec.tradeItems.reduce((sum, item) => sum + item.scopeCostUsd, 0);
  const totalValueUpliftUsd = activeSpec.tradeItems.reduce(
    (sum, item) => sum + item.valueUpliftUsd,
    0
  );
  const projectedWorthUsd = activePreset.baselineWorthUsd + totalValueUpliftUsd;
  const netEquityDeltaUsd = totalValueUpliftUsd - totalScopeCostUsd;
  const formatUsd = (n: number) => `$${n.toLocaleString("en-US")}`;

  const notify = (message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 3600);
  };

  // Load saved preferences & API readiness
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
    apiStatus()
      .then((status) => setApiAvailable(status.available))
      .catch(() => setApiAvailable(false));
  }, []);

  // Generate initial baseline and initial v1 upgrade render on mount or photo change
  useEffect(() => {
    let alive = true;
    const initRenders = async () => {
      const baseDataUrl = await renderResidentialSceneToDataUrl(BASELINE_SPEC, {
        isBaseline: true,
        uploadedPhotoUrl: fileUrl || undefined,
        propertyName: assetName,
      });
      if (!alive) return;
      setBaselineRenderUrl(baseDataUrl);

      const parsed = parseNaturalLanguageToSpec(upgradePrompt, DEFAULT_UPGRADE_SPEC, "all");
      const upgradedDataUrl = await renderResidentialSceneToDataUrl(parsed.spec, {
        isBaseline: false,
        uploadedPhotoUrl: fileUrl || undefined,
        propertyName: assetName,
        customBadge: "THE LOUPE · v1 NATURAL LANGUAGE RENDER",
      });
      if (!alive) return;
      const initialRev: RenderRevision = {
        id: "rev-v1",
        version: 1,
        kind: "initial-render",
        zone: "all",
        prompt: upgradePrompt,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        spec: parsed.spec,
        dataUrl: upgradedDataUrl,
        summary: parsed.summary,
      };
      setRevisions([initialRev]);
      setActiveRevisionId(initialRev.id);
    };
    void initRenders();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePresetId, fileUrl]);

  const selectPreset = (preset: ResidencePreset) => {
    setActivePresetId(preset.id);
    setFileUrl("");
    setFileName("");
    setMetrics(null);
    setAssetName(preset.name);
    setLocation(preset.location);
    setPrompt(preset.prompt);
    setUpgradePrompt(preset.upgradePrompt);
    setFindings(preset.findings);
    setSelectedFinding(preset.findings[0]?.id ?? 1);
    setSource("demo");
    setSummary("");
    setDesk("discovery");
    setMobileNav(false);
    notify(`Loaded residential parcel: ${preset.name}`);
  };

  const saveSettings = (next: Settings) => {
    setSettings(next);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  };

  const advance = () => {
    const next = stages[Math.min(currentIndex + 1, stages.length - 1)];
    if (next.id === "story" && stage !== "story") openStory();
    else setStage(next.id);
  };

  const back = () => setStage(stages[Math.max(currentIndex - 1, 0)].id);

  const openStory = () => {
    setStage("story");
    const note = runAutomations("activate");
    if (note) notify(note);
  };

  const ingest = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      notify("Please select a residential photograph (PNG, JPG, WebP).");
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setFileUrl(dataUrl);
      setFileName(file.name);
      setMetrics(await measureImage(file, dataUrl));
      setSummary("");
      notify("Residential photograph measured and loaded into The Loupe.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not read that photograph.");
    }
  };

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void ingest(file);
  };

  const runSightAnalysis = async () => {
    if (!settings.liveAnalysis) {
      setSource("demo");
      setStage("sight");
      notify("Sight markers ready. Inspect findings below or continue to Work.");
      return;
    }
    setAnalyzing(true);
    try {
      const result = await analyzeDiscovery({
        data: { assetName, location, prompt, imageDataUrl: fileUrl },
      });
      if (result.ok && result.findings.length > 0) {
        setFindings(result.findings);
        setDetections(result.detections);
        setTextHits(result.textHits);
        setSelectedText(result.textHits[0]?.id ?? 0);
        setSelectedDetection(result.detections[0]?.id ?? 0);
        setSummary(result.summary);
        setSource("live");
        setSelectedFinding(result.findings[0]?.id ?? 1);
        notify("The Loupe completed live residential reading.");
      } else {
        setSource("demo");
        notify("Residential elevation markers mapped. Explore findings below.");
      }
    } catch {
      setSource("demo");
      notify("Residential elevation markers mapped.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Generate fresh natural-language upgrade render
  const handleGenerateFromNaturalLanguage = async () => {
    if (!upgradePrompt.trim()) {
      notify("Describe the residential upgrades you want to render.");
      return;
    }
    setRendering(true);
    try {
      const parsed = parseNaturalLanguageToSpec(upgradePrompt, DEFAULT_UPGRADE_SPEC, "all");
      const nextVersion = revisions.length + 1;
      let renderedDataUrl = "";

      if (settings.renderConcepts && apiAvailable) {
        const cloud = await renderConcept({
          data: {
            assetName,
            location,
            prompt: upgradePrompt,
            imageDataUrl: fileUrl,
            direction: "Residential Architectural Upgrade",
            directionNote: parsed.summary,
          },
        }).catch(() => null);
        if (cloud?.ok && cloud.dataUrl) {
          renderedDataUrl = cloud.dataUrl;
        }
      }

      if (!renderedDataUrl) {
        renderedDataUrl = await renderResidentialSceneToDataUrl(parsed.spec, {
          isBaseline: false,
          uploadedPhotoUrl: fileUrl || undefined,
          propertyName: assetName,
          customBadge: `THE LOUPE · v${nextVersion} NATURAL LANGUAGE RENDER`,
        });
      }

      const newRev: RenderRevision = {
        id: `rev-v${nextVersion}-${Date.now()}`,
        version: nextVersion,
        kind: "initial-render",
        zone: "all",
        prompt: upgradePrompt.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        spec: parsed.spec,
        dataUrl: renderedDataUrl,
        summary: parsed.summary,
      };

      setRevisions((prev) => [...prev, newRev]);
      setActiveRevisionId(newRev.id);
      notify(`Rendered v${nextVersion} residential upgrade from natural language.`);
    } finally {
      setRendering(false);
    }
  };

  // Apply iterative AI Edit on top of the currently active upgrade revision
  const handleApplyAiEdit = async (customInstruction?: string, forcedZone?: EditZone) => {
    const instruction = (customInstruction ?? aiEditInput).trim();
    const targetZone = forcedZone ?? editZone;
    if (!instruction) {
      notify("Enter an AI Edit instruction (e.g., 'Switch siding to sage board-and-batten').");
      return;
    }
    setRendering(true);
    try {
      const baseSpec = activeRevision ? activeRevision.spec : DEFAULT_UPGRADE_SPEC;
      const parsed = parseNaturalLanguageToSpec(instruction, baseSpec, targetZone);
      const nextVersion = revisions.length + 1;
      const zoneLabel = AI_EDIT_ZONES.find((z) => z.id === targetZone)?.label.toUpperCase() || "HOME";

      let renderedDataUrl = "";
      if (settings.renderConcepts && apiAvailable) {
        const cloud = await renderConcept({
          data: {
            assetName,
            location,
            prompt: upgradePrompt,
            imageDataUrl: activeRevision?.dataUrl || fileUrl,
            direction: `AI Edit on ${zoneLabel}`,
            directionNote: parsed.summary,
            editInstruction: instruction,
            editZone: zoneLabel,
          },
        }).catch(() => null);
        if (cloud?.ok && cloud.dataUrl) {
          renderedDataUrl = cloud.dataUrl;
        }
      }

      if (!renderedDataUrl) {
        renderedDataUrl = await renderResidentialSceneToDataUrl(parsed.spec, {
          isBaseline: false,
          uploadedPhotoUrl: fileUrl || undefined,
          propertyName: assetName,
          customBadge: `THE LOUPE · v${nextVersion} AI EDIT (${zoneLabel})`,
        });
      }

      const newRev: RenderRevision = {
        id: `rev-v${nextVersion}-${Date.now()}`,
        version: nextVersion,
        kind: "ai-edit",
        zone: targetZone,
        prompt: instruction,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        spec: parsed.spec,
        dataUrl: renderedDataUrl,
        summary: parsed.summary,
      };

      setRevisions((prev) => [...prev, newRev]);
      setActiveRevisionId(newRev.id);
      if (!customInstruction) setAiEditInput("");
      notify(`Applied v${nextVersion} AI Edit (${zoneLabel}): ${parsed.summary}`);
    } finally {
      setRendering(false);
    }
  };

  const appendChipToUpgradePrompt = (snippet: string) => {
    setUpgradePrompt((current) => {
      const trimmed = current.trim().replace(/\.$/, "");
      return trimmed ? `${trimmed}, ${snippet}.` : `Install ${snippet}.`;
    });
  };

  const downloadDossier = () => {
    const metricLines = metrics
      ? `\nIMAGE TELEMETRY (origin verified):\n- Resolution: ${metrics.width} × ${metrics.height}px\n- Luminance: ${metrics.meanLuminance} · Contrast: ${metrics.contrast} · Sharpness: ${metrics.sharpness}\n- SHA-256 Digest: ${metrics.fingerprint}\n`
      : "";
    const compLines = activePreset.comparables
      .map(
        (c) =>
          `  - [${c.id}] ${c.address} (${c.distance} · closed ${c.closedDate}): ${formatUsd(c.salePriceUsd)} (${c.sqft} sq ft @ $${c.pricePerSqft}/sq ft · ${c.similarityPct}% similarity)`
      )
      .join("\n");
    const revisionLines = revisions
      .map(
        (r) =>
          `  [v${r.version} · ${r.kind === "ai-edit" ? `AI EDIT (${r.zone.toUpperCase()})` : "NATURAL LANGUAGE RENDER"} · ${r.timestamp}]\n  Prompt: "${r.prompt}"\n  Applied Spec: ${r.summary}`
      )
      .join("\n\n");
    const tradeLines = activeSpec.tradeItems
      .map(
        (t) =>
          `- [${t.code}] ${t.trade}: ${t.label}\n  Spec: ${t.spec}\n  Receipt: Scope ${formatUsd(t.scopeCostUsd)} · Value Uplift +${formatUsd(t.valueUpliftUsd)} · Confidence ${t.confidencePct}% · As of ${t.asOfDate} (${t.comparableBasis})`
      )
      .join("\n");

    const content = `FACET — RESIDENTIAL PROPERTY DOSSIER
Every property has four sides: Sight · Worth · Work · Story

Residence: ${assetName}
Location: ${location}
As-Of Date: ${activePreset.asOfDate}
Evidence Mode: ${source === "live" ? "Live reading via The Loupe" : "Baseline residential markers"}
${metricLines}
------------------------------------------------------------
01 / SIGHT — ARCHITECTURAL OBSERVATIONS
Objective: ${prompt}
${findings
  .map(
    (f) =>
      `- ${f.title} [${f.type}] (${f.confidence} confidence, ${Math.round(f.score * 100)}%)\n  ${f.detail}\n  Evidence: ${f.evidence}`
  )
  .join("\n")}

------------------------------------------------------------
02 / WORTH — UNDERWRITING NUMBER WITH ITS RECEIPT
Baseline Worth: ${formatUsd(activePreset.baselineWorthUsd)} (As of ${activePreset.asOfDate} · ${activePreset.worthConfidencePct}% confidence)
Estimated Renovation Scope: ${formatUsd(totalScopeCostUsd)}
Projected Post-Renovation Worth: ${formatUsd(projectedWorthUsd)} (Net Uplift: +${formatUsd(netEquityDeltaUsd)})
Comparable Sales Receipt:
${compLines}

Itemized Renovation Receipts:
${tradeLines}

------------------------------------------------------------
03 / WORK — THE LOUPE RENDER & AI EDIT REVISION HISTORY
Active Material Tags: ${activeSpec.activeTags.join(" · ")}

${revisionLines}

Disclosed Fee Policy: Applicable platform fees are disclosed alongside any settled transaction. Observations and AI concept renders are architectural studies, not structural engineering certifications.

© 2026 FACET · Engineered by ODASI Technologies Inc.`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "facet-residential-dossier.txt";
    a.click();
    URL.revokeObjectURL(url);
    const note = runAutomations("brief");
    notify(note ? `Residential dossier exported. ${note}` : "FACET Residential Dossier exported.");
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <Brand />
          <button
            className="icon-button mobile-close"
            onClick={() => setMobileNav(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <div className="workspace-switch">
          <div className="workspace-avatar">F</div>
          <div className="workspace-copy">
            <strong>FACET Residential</strong>
            <span>The Loupe · The Vault</span>
          </div>
          <ChevronDown size={15} />
        </div>

        <div className="nav-label">FOUR SIDES STUDIO</div>
        <button
          className={`nav-item ${desk === "discovery" && stage !== "work" ? "active" : ""}`}
          onClick={() => {
            setDesk("discovery");
            setStage("sight");
            setMobileNav(false);
          }}
        >
          <Compass size={17} /> Sight · Worth · Story
          {desk === "discovery" && stage !== "work" && <span className="nav-live" />}
        </button>
        <button
          className={`nav-item ${desk === "discovery" && stage === "work" ? "active" : ""}`}
          onClick={() => {
            setDesk("discovery");
            setStage("work");
            setMobileNav(false);
          }}
        >
          <WandSparkles size={17} /> The Loupe · Render & AI Edit
          {desk === "discovery" && stage === "work" && <span className="nav-live" />}
        </button>
        <button
          className={`nav-item ${desk === "crm" ? "active" : ""}`}
          onClick={() => {
            setDesk("crm");
            setMobileNav(false);
          }}
        >
          <Users size={17} /> The Vault · Homeowners
          {desk === "crm" && <span className="nav-live" />}
        </button>
        <button
          className="nav-item"
          onClick={() => {
            setShowLayers(true);
            setMobileNav(false);
          }}
        >
          <Layers3 size={17} /> Engine & Trust Architecture
        </button>

        <div className="nav-label nav-label-spaced">RESIDENTIAL PARCELS</div>
        {RESIDENCE_PRESETS.map((preset, idx) => (
          <button
            key={preset.id}
            className={`recent-item recent-btn ${activePresetId === preset.id && !fileUrl ? "active" : ""}`}
            onClick={() => selectPreset(preset)}
          >
            <span
              className={`recent-dot ${idx === 0 ? "gold-dot" : idx === 1 ? "cyan-dot" : "violet-dot"}`}
            />
            <span className="recent-name">{preset.name.split("—")[0].trim()}</span>
            <small>{preset.era.split("·")[0].trim()}</small>
          </button>
        ))}

        <button
          className="new-discovery"
          onClick={() => {
            setDesk("discovery");
            setStage("sight");
            uploadRef.current?.click();
            setMobileNav(false);
          }}
        >
          <Plus size={16} /> Upload home photograph
        </button>

        <div className="sidebar-bottom">
          <div className="signal-card">
            <div className="signal-icon">
              <Home size={15} />
            </div>
            <div>
              <strong>Every property has four sides.</strong>
              <p>Sight reads market &amp; envelope evidence. Worth shows every number with its receipt. Work renders &amp; AI-edits upgrades. Story exports the dossier.</p>
            </div>
          </div>
          <button
            className="nav-item"
            onClick={() => {
              setShowSettings(true);
              setMobileNav(false);
            }}
          >
            <Settings2 size={17} /> Studio preferences
          </button>
          <div className="profile">
            <div className="profile-avatar">MD</div>
            <div>
              <strong>Residential Architect</strong>
              <span>FACET Studio · v2</span>
            </div>
            <MoreHorizontal size={18} />
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMobileNav(true)}
              aria-label="Open navigation"
            >
              <Menu size={19} />
            </button>
            <div className="breadcrumb">
              FACET <ChevronRight size={14} />{" "}
              <strong>
                {desk === "crm"
                  ? "The Vault · Prospect Pipeline"
                  : `Four Sides · ${stages[currentIndex]?.label || "Sight"}`}
              </strong>
            </div>
          </div>
          <div className="topbar-right">
            <button
              className="system-status"
              onClick={() => setShowLayers(true)}
              title="Inspect The Loupe engine layers"
            >
              <span /> THE LOUPE ENGINE · {apiAvailable ? "CLOUD + LOCAL" : "SYNTHESIZER READY"}
            </button>
            <button
              className="icon-button"
              aria-label="Preferences"
              onClick={() => setShowSettings(true)}
            >
              <Sliders size={16} />
            </button>
            <button
              className="icon-button"
              aria-label="Notifications"
              onClick={() => notify("The Loupe render synthesizer and AI Edit stack are active.")}
            >
              <Bell size={17} />
            </button>
            <div className="top-avatar">MD</div>
          </div>
        </header>

        <div className="content">
          <div className="page-heading">
            {desk === "crm" ? (
              <div>
                <div className="eyebrow">
                  <span className="eyebrow-line" /> THE VAULT · RESIDENTIAL PROSPECT PIPELINE
                </div>
                <h1>
                  Homeowners &amp; <em>advisors.</em>
                </h1>
                <p className="page-subtitle">
                  Consent-first residential prospect pipeline with Verified relationship tracking for homeowners, architects, and residential advisors.
                </p>
              </div>
            ) : (
              <div>
                <div className="eyebrow">
                  <span className="eyebrow-line" /> FACET · EVERY PROPERTY HAS FOUR SIDES
                </div>
                <h1>
                  Every number with <em>its receipt.</em>
                </h1>
                <p className="page-subtitle">
                  Read residential evidence in <strong>Sight</strong>, underwrite value with comparables in <strong>Worth</strong>, generate &amp; AI-edit natural-language exterior upgrades in <strong>Work</strong>, and export in <strong>Story</strong>.
                </p>
              </div>
            )}
            <div className="heading-actions">
              <span className="saved-state">
                <span /> {revisions.length} render {revisions.length === 1 ? "revision" : "revisions"} in session
              </span>
              {desk === "discovery" && (
                <>
                  {stage !== "work" && (
                    <button className="primary-button" onClick={() => setStage("work")}>
                      <WandSparkles size={15} /> Open Render &amp; AI Edit Studio
                    </button>
                  )}
                  <button className="outline-button" onClick={() => setShowBrief(true)}>
                    <FileText size={15} /> Property dossier
                  </button>
                </>
              )}
            </div>
          </div>

          {desk === "crm" ? (
            <EngagementDesk onNotify={notify} />
          ) : (
            <>
              <section className="journey" aria-label="FACET Four Sides progress">
                <div className="journey-track">
                  <div
                    className="journey-progress"
                    style={{ width: `${(currentIndex / (stages.length - 1)) * 100}%` }}
                  />
                </div>
                {stages.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setStage(s.id)}
                    className={`journey-step ${i === currentIndex ? "current" : ""} ${
                      i < currentIndex ? "complete" : ""
                    }`}
                  >
                    <span className="step-node">{i < currentIndex ? <Check size={13} /> : s.n}</span>
                    <span className="step-text">
                      <strong>{s.label}</strong>
                      <small>{s.sub}</small>
                    </span>
                  </button>
                ))}
              </section>

              {/* ============================================================
                  01 / SIGHT — RESIDENTIAL EVIDENCE & CURB SCAN
                 ============================================================ */}
              {stage === "sight" && (
                <section className="stage-layout work-layout">
                  <div className="stage-main wide-main">
                    <div className="section-kicker">
                      <span>01</span> / SIGHT · MARKET &amp; RESIDENTIAL EVIDENCE
                    </div>
                    <div className="work-heading">
                      <div>
                        <h2>
                          Read the home&apos;s <em>existing envelope.</em>
                        </h2>
                        <p className="stage-description">
                          Upload a residential street-elevation photo or explore a curated residence. Click any numbered pin on the home to inspect roof, cladding, window, and hardscape signals.
                        </p>
                      </div>
                      <span className="demo-tag" style={{ textTransform: "none" }}>
                        <span /> {fileUrl ? "origin verified" : "BASELINE ELEVATION"}
                      </span>
                    </div>

                    {/* Interactive Evidence Canvas */}
                    <div className="evidence-workspace">
                      <div className="evidence-toolbar">
                        <div>
                          <span className="live-dot" /> THE LOUPE · SIGHT ELEVATION CANVAS{" "}
                          <small>· {assetName}</small>
                        </div>
                        <div className="toolbar-actions">
                          <button
                            className="browse-button"
                            onClick={() => uploadRef.current?.click()}
                          >
                            {fileUrl ? "Replace home photo" : "Upload home photo"}
                          </button>
                          <input
                            ref={uploadRef}
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={onFile}
                          />
                        </div>
                      </div>

                      <div className="evidence-image">
                        {fileUrl || baselineRenderUrl ? (
                          <div className="evidence-stage">
                            <img
                              className="evidence-shot"
                              src={fileUrl || baselineRenderUrl}
                              alt={assetName || "Residential elevation"}
                            />
                            <div className="evidence-overlay">
                              <div className="image-vignette" />
                              <div className="image-coordinate">
                                FACET / THE LOUPE / {fileUrl ? "EVIDENCE PHOTOGRAPHY" : "RESIDENTIAL BASELINE 01"}
                              </div>
                              {detections.map((d) => (
                                <button
                                  key={d.id}
                                  className={`detect-box ${selectedDetection === d.id ? "on" : ""}`}
                                  style={{
                                    left: `${d.x}%`,
                                    top: `${d.y}%`,
                                    width: `${d.w}%`,
                                    height: `${d.h}%`,
                                  }}
                                  onClick={() => setSelectedDetection(d.id)}
                                >
                                  <span>
                                    {d.label} {Math.round(d.score * 100)}%
                                  </span>
                                </button>
                              ))}
                              {textHits.map((hit) => (
                                <button
                                  key={hit.id}
                                  className={`text-box ${selectedText === hit.id ? "on" : ""}`}
                                  style={{
                                    left: `${hit.x}%`,
                                    top: `${hit.y}%`,
                                    width: `${hit.w}%`,
                                    height: `${hit.h}%`,
                                  }}
                                  onClick={() => setSelectedText(hit.id)}
                                >
                                  <span>{hit.text}</span>
                                </button>
                              ))}
                              {findings.map((f) => (
                                <button
                                  key={f.id}
                                  className={`evidence-pin pin-${f.color} ${
                                    selectedFinding === f.id ? "pin-selected" : ""
                                  }`}
                                  style={{ left: `${f.x}%`, top: `${f.y}%` }}
                                  onClick={() => setSelectedFinding(f.id)}
                                  aria-label={`Inspect ${f.title}`}
                                >
                                  <span>{f.id}</span>
                                </button>
                              ))}
                              <div className="image-scale">
                                <span>STREET ELEVATION</span>
                                <span>100%</span>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className="canvas-footer">
                        <span>
                          <Scan size={14} />{" "}
                          {fileUrl
                            ? `${fileName} (origin verified)`
                            : `${assetName} · ${location}`}
                        </span>
                        <span>
                          {String(findings.length).padStart(2, "0")} residential envelope markers{" "}
                          <i />{" "}
                          {source === "live" ? "Live reading · The Loupe" : "Baseline architectural scan"}
                        </span>
                      </div>
                    </div>

                    {/* Residence Details & Sight Input Panel */}
                    <div className="input-panel sight-input-panel">
                      <div className="panel-label">
                        <Home size={15} /> RESIDENCE PROFILE &amp; SIGHT OBJECTIVE
                      </div>
                      <div className="field-grid">
                        <label className="field">
                          <span>RESIDENCE / PARCEL NAME</span>
                          <input
                            value={assetName}
                            onChange={(e) => setAssetName(e.target.value)}
                            placeholder="e.g., 742 Crestwood Lane — Ranch Residence"
                          />
                        </label>
                        <label className="field">
                          <span>NEIGHBORHOOD / CITY</span>
                          <div className="field-with-icon">
                            <MapPin size={15} />
                            <input
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              placeholder="Austin, Texas"
                            />
                          </div>
                        </label>
                      </div>
                      <label className="field prompt-field">
                        <span>SIGHT INSPECTION FOCUS</span>
                        <textarea
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          rows={2}
                          placeholder="What residential elements should The Loupe evaluate?"
                        />
                      </label>
                      <div className="panel-footer">
                        <span>
                          <ShieldCheck size={14} /> Machine observations separate visible evidence from on-site field inspection.
                        </span>
                        <div className="button-group">
                          <button
                            className="outline-button"
                            onClick={() => void runSightAnalysis()}
                            disabled={analyzing}
                          >
                            {analyzing ? "Scanning elevation…" : "Re-scan elevation"}
                          </button>
                          <button className="primary-button" onClick={() => setStage("work")}>
                            Render upgrades in Work <ArrowRight size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Findings List */}
                    <div className="evidence-list">
                      {metrics && (
                        <div className="metric-strip">
                          <div>
                            <span>RESOLUTION</span>
                            <strong>
                              {metrics.width} × {metrics.height}
                            </strong>
                          </div>
                          <div>
                            <span>LUMINANCE</span>
                            <strong>{metrics.meanLuminance.toFixed(0)}</strong>
                          </div>
                          <div>
                            <span>CONTRAST</span>
                            <strong>{metrics.contrast.toFixed(0)}</strong>
                          </div>
                          <div>
                            <span>SHARPNESS</span>
                            <strong>{metrics.sharpness.toFixed(0)}</strong>
                          </div>
                          <div>
                            <span>ORIGIN DIGEST</span>
                            <strong>{metrics.fingerprint}</strong>
                          </div>
                        </div>
                      )}
                      <div className="list-heading">
                        <div>
                          <span className="section-mini">ENVELOPE &amp; CURB APPEAL SIGNALS</span>
                          <h3>Residential observations</h3>
                        </div>
                        <span className="count-pill">{String(findings.length).padStart(2, "0")} SIGNALS</span>
                      </div>
                      {findings.map((f) => (
                        <button
                          key={f.id}
                          className={`finding-row ${selectedFinding === f.id ? "finding-active" : ""}`}
                          onClick={() => setSelectedFinding(f.id)}
                        >
                          <span className={`finding-index ${f.color}`}>0{f.id}</span>
                          <span className="finding-copy">
                            <strong>{f.title}</strong>
                            <small>{f.type}</small>
                          </span>
                          <span className={`confidence ${f.confidence.toLowerCase()}`}>
                            {f.confidence} confidence
                          </span>
                          <ChevronRight size={16} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selected Signal Inspector */}
                  <aside className="insight-panel">
                    <div className="panel-label">
                      <Sparkles size={14} /> SELECTED ENVELOPE SIGNAL
                    </div>
                    <div className={`insight-number ${finding.color}`}>0{finding.id}</div>
                    <div className="insight-type">{finding.type}</div>
                    <h3>{finding.title}</h3>
                    <p>{finding.detail}</p>
                    {finding.evidence ? <p className="evidence-basis">{finding.evidence}</p> : null}
                    <div className="confidence-block">
                      <span>MACHINE OBSERVATION · THE LOUPE</span>
                      <strong>{finding.confidence}</strong>
                      <div className="confidence-track">
                        <i style={{ width: `${Math.round(finding.score * 100)}%` }} />
                      </div>
                    </div>
                    <div className="insight-disclaimer">
                      <ShieldCheck size={15} /> Visual observation only. Roof deck integrity, structural framing, and permit code compliance require an on-site architectural inspection.
                    </div>
                    <button className="primary-button full-button" onClick={() => setStage("work")}>
                      <WandSparkles size={15} /> Render upgrade for this signal <ArrowRight size={15} />
                    </button>
                  </aside>
                </section>
              )}

              {/* ============================================================
                  03 / WORK — NATURAL-LANGUAGE RENDER & AI EDIT STUDIO
                 ============================================================ */}
              {stage === "work" && (
                <section className="stage-layout work-layout">
                  <div className="stage-main wide-main">
                    <div className="section-kicker">
                      <span>03</span> / WORK · THE LOUPE RENDER &amp; AI EDIT STUDIO
                    </div>
                    <div className="work-heading">
                      <div>
                        <h2>
                          Render upgrades from <em>natural language.</em>
                        </h2>
                        <p className="stage-description">
                          Describe any residential exterior renovation in plain English to generate a high-resolution architectural render, then use the <strong>AI Edit Studio</strong> below to iteratively modify specific zones or materials.
                        </p>
                      </div>
                      <span className="demo-tag">
                        <span /> {rendering ? "SYNTHESIZING RENDER…" : `ACTIVE: v${activeRevision?.version ?? 1} RENDER`}
                      </span>
                    </div>

                    {/* 1. NATURAL LANGUAGE UPGRADE GENERATOR BAR */}
                    <div className="input-panel nl-render-panel">
                      <div className="panel-label">
                        <WandSparkles size={15} /> NATURAL-LANGUAGE UPGRADE PROMPT
                      </div>
                      <label className="field">
                        <span>DESCRIBE THE FULL RESIDENTIAL RENOVATION TO GENERATE</span>
                        <textarea
                          value={upgradePrompt}
                          onChange={(e) => setUpgradePrompt(e.target.value)}
                          rows={3}
                          placeholder="e.g., Install a charcoal standing-seam metal roof with flush solar panels, refinish the red brick in warm alabaster limewash, add matte black steel casement windows, a western red cedar entry pergola, fluted walnut garage door, herringbone bluestone walkway, and golden hour lighting..."
                        />
                      </label>
                      <div className="prompt-suggestions">
                        <span>ADD TO PROMPT:</span>
                        {QUICK_UPGRADE_CHIPS.map((chip) => (
                          <button
                            key={chip.label}
                            type="button"
                            onClick={() => appendChipToUpgradePrompt(chip.snippet)}
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                      <div className="panel-footer">
                        <span>
                          <Sparkles size={14} /> Parses roof, cladding, fenestration, garage, hardscape &amp; lighting into a live architectural render.
                        </span>
                        <button
                          className="primary-button"
                          onClick={() => void handleGenerateFromNaturalLanguage()}
                          disabled={rendering}
                        >
                          <WandSparkles size={15} />{" "}
                          {rendering ? "Rendering upgrade…" : "Generate Upgrade Render"}
                        </button>
                      </div>
                    </div>

                    {/* 2. INTERACTIVE BEFORE / AFTER LOUPE SPLIT CANVAS */}
                    <div className="concept-card">
                      <div className="concept-visual">
                        <div className="concept-plate">
                          {baselineRenderUrl ? (
                            <img
                              className="concept-photo"
                              src={baselineRenderUrl}
                              alt="Existing residential baseline"
                            />
                          ) : null}
                        </div>
                        <div
                          className="concept-plate concept-plate-after"
                          style={{ clipPath: `inset(0 0 0 ${compare}%)` }}
                        >
                          {activeRevision?.dataUrl ? (
                            <img
                              className="concept-photo"
                              src={activeRevision.dataUrl}
                              alt="Rendered residential upgrade"
                            />
                          ) : (
                            <div className="concept-wait">Synthesizing architectural upgrade…</div>
                          )}
                        </div>
                        <div className="concept-divider" style={{ left: `${compare}%` }}>
                          <span>
                            <ChevronLeft size={13} />
                            <ChevronRight size={13} />
                          </span>
                        </div>
                        <input
                          className="compare-range"
                          type="range"
                          min="5"
                          max="95"
                          value={compare}
                          onChange={(e) => setCompare(Number(e.target.value))}
                          aria-label="Compare existing home and rendered upgrade"
                        />
                        <span className="concept-label before-label">EXISTING HOME · EVIDENCE</span>
                        <span className="concept-label after-label">
                          v{activeRevision?.version ?? 1} ·{" "}
                          {activeRevision?.kind === "ai-edit"
                            ? `AI EDIT (${activeRevision.zone.toUpperCase()})`
                            : "UPGRADE RENDER"}
                        </span>
                      </div>

                      <div className="concept-caption">
                        <div>
                          <span className="concept-kicker">
                            ACTIVE SPEC · v{activeRevision?.version ?? 1}{" "}
                            {activeRevision?.kind === "ai-edit"
                              ? `· AI EDIT ON ${activeRevision.zone.toUpperCase()}`
                              : "· NATURAL-LANGUAGE GENERATION"}
                          </span>
                          <h3>{activeRevision?.summary || "Custom Residential Upgrade"}</h3>
                          <div className="active-spec-tags">
                            {activeSpec.activeTags.map((tag) => (
                              <span key={tag} className="spec-tag">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="compare-quick-btns">
                          <button
                            className="outline-button"
                            onClick={() => setCompare(12)}
                            title="Show full upgraded render"
                          >
                            View Upgrade
                          </button>
                          <button
                            className="outline-button"
                            onClick={() => setCompare(50)}
                            title="Split 50/50"
                          >
                            50 / 50 Split
                          </button>
                          <button
                            className="outline-button"
                            onClick={() => setCompare(88)}
                            title="Show existing home"
                          >
                            View Existing
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 3. ITERATIVE AI EDIT STUDIO (EDIT THE INPUTTED UPGRADE) */}
                    <div className="input-panel ai-edit-studio">
                      <div className="ai-edit-header">
                        <div className="panel-label">
                          <PenTool size={15} /> AI EDIT STUDIO · REFINE THE CURRENT UPGRADE (v
                          {activeRevision?.version ?? 1})
                        </div>
                        <span className="ai-edit-badge">NON-DESTRUCTIVE LAYER EDIT</span>
                      </div>
                      <p className="ai-edit-sub">
                        Want to tweak the rendered upgrade above without starting over? Select a target architectural zone and instruct <strong>The Loupe</strong> what to change. Each AI edit stacks onto your current upgrade and saves a new version.
                      </p>

                      {/* Target Zone Selector */}
                      <div className="zone-selector" role="radiogroup" aria-label="Target zone for AI Edit">
                        {AI_EDIT_ZONES.map((z) => (
                          <button
                            key={z.id}
                            type="button"
                            className={`zone-pill ${editZone === z.id ? "active" : ""}`}
                            onClick={() => setEditZone(z.id)}
                          >
                            {z.label}
                          </button>
                        ))}
                      </div>

                      {/* AI Edit Input + Submit */}
                      <div className="ai-edit-input-row">
                        <input
                          className="ai-edit-input"
                          value={aiEditInput}
                          onChange={(e) => setAiEditInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              void handleApplyAiEdit();
                            }
                          }}
                          placeholder={
                            AI_EDIT_ZONES.find((z) => z.id === editZone)?.hint ||
                            "Describe how to edit the current upgrade..."
                          }
                        />
                        <button
                          className="primary-button"
                          onClick={() => void handleApplyAiEdit()}
                          disabled={rendering}
                        >
                          <Sparkles size={15} /> {rendering ? "Editing…" : "Apply AI Edit"}
                        </button>
                      </div>

                      {/* One-click AI Edit presets */}
                      <div className="prompt-suggestions">
                        <span>ONE-CLICK AI EDITS:</span>
                        {AI_EDIT_QUICK_IDEAS.map((idea) => (
                          <button
                            key={idea.label}
                            type="button"
                            onClick={() => {
                              setEditZone(idea.zone);
                              setAiEditInput(idea.instruction);
                              void handleApplyAiEdit(idea.instruction, idea.zone);
                            }}
                          >
                            {idea.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT ASIDE: REVISION TIMELINE & TRADE PREVIEW */}
                  <aside className="insight-panel envision-aside">
                    <div className="panel-label">
                      <Layers3 size={14} /> UPGRADE REVISION STACK
                    </div>
                    <h3>Version history ({revisions.length})</h3>
                    <p>
                      Click any revision below to compare it against the existing home or use it as the base for your next AI Edit.
                    </p>

                    <div className="revision-stack">
                      {revisions.map((rev) => (
                        <button
                          key={rev.id}
                          className={`revision-card ${rev.id === activeRevision?.id ? "active" : ""}`}
                          onClick={() => setActiveRevisionId(rev.id)}
                        >
                          <div className="revision-top">
                            <span className="revision-ver">v{rev.version}</span>
                            <span className={`revision-kind ${rev.kind}`}>
                              {rev.kind === "ai-edit"
                                ? `AI EDIT · ${rev.zone.toUpperCase()}`
                                : "INITIAL RENDER"}
                            </span>
                            <small>{rev.timestamp}</small>
                          </div>
                          <strong className="revision-prompt">&ldquo;{rev.prompt}&rdquo;</strong>
                          <span className="revision-summary">{rev.summary}</span>
                        </button>
                      ))}
                    </div>

                    {revisions.length > 1 && (
                      <button
                        className="outline-button full-button"
                        onClick={() => {
                          const first = revisions[0];
                          setRevisions([first]);
                          setActiveRevisionId(first.id);
                          notify("Reverted revision history to v1.");
                        }}
                      >
                        <RotateCcw size={14} /> Reset to v1 baseline render
                      </button>
                    )}

                    <div className="aside-divider" />
                    <div className="panel-label">
                      <Sun size={14} /> PARSED TRADE ITEMS ({activeSpec.tradeItems.length})
                    </div>
                    {activeSpec.tradeItems.slice(0, 3).map((item) => (
                      <div key={item.code} className="aside-stat">
                        <span>{item.code.split("-")[1]}</span>
                        <div>
                          <strong>{item.label}</strong>
                          <small>{item.trade}</small>
                        </div>
                      </div>
                    ))}

                    <button
                      className="primary-button full-button"
                      style={{ marginTop: "18px" }}
                      onClick={() => setStage("worth")}
                    >
                      Inspect Worth &amp; Receipts <ArrowRight size={15} />
                    </button>
                  </aside>
                </section>
              )}

              {/* ============================================================
                  02 / WORTH — UNDERWRITING NUMBER WITH ITS RECEIPT
                 ============================================================ */}
              {stage === "worth" && (
                <section className="stage-layout work-layout">
                  <div className="stage-main wide-main">
                    <div className="section-kicker">
                      <span>02</span> / WORTH · UNDERWRITING &amp; NUMBER-LEVEL RECEIPTS
                    </div>
                    <h2>
                      Every number with <em>its receipt.</em>
                    </h2>
                    <p className="stage-description">
                      Know what this residence is worth—and show the receipt. Every valuation and renovation scope figure attaches its closed comparables, as-of date (<strong>{activePreset.asOfDate}</strong>), and confidence score.
                    </p>

                    <div className="metrics-grid">
                      <div className="metric-card">
                        <span>BASELINE UNDERWRITING WORTH</span>
                        <strong>{formatUsd(activePreset.baselineWorthUsd)}</strong>
                        <small>
                          <span className="metric-dot gold-dot" /> As of {activePreset.asOfDate} · {activePreset.worthConfidencePct}% confidence
                        </small>
                      </div>
                      <div className="metric-card">
                        <span>RENOVATION SCOPE (v{activeRevision?.version ?? 1})</span>
                        <strong>{formatUsd(totalScopeCostUsd)}</strong>
                        <small>
                          <span className="metric-dot cyan-dot" /> {activeSpec.tradeItems.length} workstreams · As of {activePreset.asOfDate}
                        </small>
                      </div>
                      <div className="metric-card">
                        <span>POST-RENOVATION WORTH</span>
                        <strong>{formatUsd(projectedWorthUsd)}</strong>
                        <small>
                          <span className="metric-dot violet-dot" /> +{formatUsd(totalValueUpliftUsd)} gross uplift (+{formatUsd(netEquityDeltaUsd)} net)
                        </small>
                      </div>
                    </div>

                    {/* Closed Comparables Receipt Table */}
                    <div className="decision-card" style={{ marginBottom: "18px" }}>
                      <div className="decision-head">
                        <div>
                          <span className="section-mini">COMPARABLE SALES RECEIPT · AS OF {activePreset.asOfDate}</span>
                          <h3>Closed residential comparables supporting baseline worth</h3>
                        </div>
                        <span className="count-pill">{activePreset.worthConfidencePct}% CONFIDENCE</span>
                      </div>
                      {activePreset.comparables.map((comp) => (
                        <div className="decision-row" key={comp.id}>
                          <span>{comp.id}</span>
                          <div>
                            <strong>
                              {comp.address} <em className="trade-badge">{comp.distance} · Closed {comp.closedDate}</em>
                            </strong>
                            <small>
                              {comp.sqft.toLocaleString("en-US")} sq ft · ${comp.pricePerSqft}/sq ft · {comp.note}
                            </small>
                          </div>
                          <span className="pending-label">
                            {formatUsd(comp.salePriceUsd)} · {comp.similarityPct}% MATCH
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Itemized Renovation Receipts */}
                    <div className="decision-card">
                      <div className="decision-head">
                        <div>
                          <span className="section-mini">RENOVATION UNDERWRITING LEDGER · v{activeRevision?.version ?? 1}</span>
                          <h3>Itemized upgrade scope &amp; value uplift receipts</h3>
                        </div>
                        <span className="count-pill">{activeSpec.tradeItems.length} RECEIPTS</span>
                      </div>
                      {activeSpec.tradeItems.map((item) => (
                        <div className="decision-row" key={item.code}>
                          <span>{item.code}</span>
                          <div>
                            <strong>
                              {item.label} <em className="trade-badge">{item.trade}</em>
                            </strong>
                            <small>
                              {item.spec} · Receipt basis: {item.comparableBasis} (as of {item.asOfDate})
                            </small>
                          </div>
                          <span className="pending-label">
                            SCOPE {formatUsd(item.scopeCostUsd)} → +{formatUsd(item.valueUpliftUsd)} ({item.confidencePct}% CONF.)
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="honesty-note">
                      <ShieldCheck size={17} />
                      <p>
                        <strong>Numbers before adjectives · Disclosed fee standard.</strong> Every underwriting figure above carries its comparable basis, as-of date ({activePreset.asOfDate}), and confidence score. Applicable platform fees are disclosed alongside any settled transaction.
                      </p>
                    </div>
                  </div>

                  <aside className="insight-panel">
                    <div className="panel-label">
                      <Target size={14} /> RECEIPT SUMMARY
                    </div>
                    <div className="readiness-ring">
                      <div>
                        <strong>{activePreset.worthConfidencePct}%</strong>
                        <span>CONFIDENCE</span>
                      </div>
                    </div>
                    <h3>Underwritten as of {activePreset.asOfDate}.</h3>
                    <p>
                      Baseline worth of <strong>{formatUsd(activePreset.baselineWorthUsd)}</strong> plus{" "}
                      <strong>+{formatUsd(totalValueUpliftUsd)}</strong> from your v{activeRevision?.version ?? 1} renovation spec yields a projected worth of{" "}
                      <strong>{formatUsd(projectedWorthUsd)}</strong>.
                    </p>
                    <button
                      className="primary-button full-button"
                      onClick={() => setStage("work")}
                      style={{ marginBottom: "10px" }}
                    >
                      <WandSparkles size={15} /> Render &amp; AI-Edit in Work <ArrowRight size={15} />
                    </button>
                    <button className="outline-button full-button" onClick={openStory}>
                      Compile Story Dossier <ArrowRight size={15} />
                    </button>
                  </aside>
                </section>
              )}

              {/* ============================================================
                  04 / STORY — RESIDENTIAL DOSSIER & MARKETING
                 ============================================================ */}
              {stage === "story" && (
                <section className="stage-layout work-layout">
                  <div className="stage-main wide-main">
                    <div className="section-kicker">
                      <span>04</span> / STORY · RESIDENTIAL PROPERTY DOSSIER
                    </div>
                    <h2>
                      Move from vision <em>to execution.</em>
                    </h2>
                    <p className="stage-description">
                      Your complete residential record—combining Sight elevation evidence, Worth underwriting receipts (as of {activePreset.asOfDate}), and The Loupe v{activeRevision?.version ?? 1} upgrade render &amp; AI edit history.
                    </p>

                    <div className="activation-card">
                      <div className="activation-top">
                        <div className="activation-icon">
                          <Clipboard size={22} />
                        </div>
                        <span className="demo-tag">
                          <span /> DOSSIER READY · v{activeRevision?.version ?? 1}
                        </span>
                      </div>
                      <div className="activation-kicker">FACET / FOUR SIDES RESIDENTIAL DOSSIER</div>
                      <h3>{assetName}</h3>
                      <p className="activation-location">
                        <MapPin size={14} />
                        {location} · As of {activePreset.asOfDate}
                      </p>
                      <div className="activation-divider" />

                      <div className="brief-block">
                        <span>UNDERWRITING RECEIPT SUMMARY (AS OF {activePreset.asOfDate})</span>
                        <p>
                          Baseline Worth: <strong>{formatUsd(activePreset.baselineWorthUsd)}</strong> ({activePreset.worthConfidencePct}% confidence across {activePreset.comparables.length} closed comps) · Renovation Scope: <strong>{formatUsd(totalScopeCostUsd)}</strong> · Projected Post-Renovation Worth: <strong>{formatUsd(projectedWorthUsd)}</strong>.
                        </p>
                      </div>

                      <div className="brief-block">
                        <span>ACTIVE RENDERED UPGRADE (v{activeRevision?.version ?? 1})</span>
                        <p>{activeRevision?.summary}</p>
                        <div className="brief-tags">
                          {activeSpec.activeTags.map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
                        </div>
                      </div>

                      <div className="brief-block">
                        <span>REVISION &amp; AI EDIT LOG ({revisions.length} VERSIONS)</span>
                        <ol>
                          {revisions.map((r) => (
                            <li key={r.id}>
                              <strong>
                                v{r.version} ({r.kind === "ai-edit" ? `AI Edit · ${r.zone}` : "Initial Render"}):
                              </strong>{" "}
                              &ldquo;{r.prompt}&rdquo;
                            </li>
                          ))}
                        </ol>
                      </div>

                      <div className="brief-block">
                        <span>EXECUTION &amp; RECORD PATHWAY</span>
                        <ol>
                          <li>
                            <strong>Roofing &amp; Envelope</strong> — On-site ridge, deck, flashing, and solar measurement for{" "}
                            <em>{activeSpec.tradeItems[0]?.label || "roof envelope"}</em>.
                          </li>
                          <li>
                            <strong>Facade &amp; Fenestration</strong> — Mockup sample board for{" "}
                            <em>{activeSpec.facade.replace(/-/g, " ")}</em> and{" "}
                            <em>{activeSpec.windows.replace(/-/g, " ")}</em>.
                          </li>
                          <li>
                            <strong>The Vault</strong> — Share dossier with homeowners and residential advisors with a Verified relationship.
                          </li>
                        </ol>
                      </div>

                      <div className="activation-actions">
                        <button className="primary-button" onClick={downloadDossier}>
                          <Download size={16} /> Export FACET Dossier (.txt)
                        </button>
                        <button className="outline-button" onClick={() => setStage("work")}>
                          <PenTool size={15} /> Return to AI Edit Studio
                        </button>
                        <button className="outline-button" onClick={() => setDesk("crm")}>
                          <Users size={15} /> Open in The Vault
                        </button>
                      </div>
                    </div>

                    <div className="closing-line">
                      <FacetMark /> <span>SIGHT · WORTH · WORK · STORY</span>
                      <i /> <span>EVERY PROPERTY HAS FOUR SIDES.</span>
                    </div>
                  </div>

                  <aside className="insight-panel">
                    <div className="panel-label">
                      <Zap size={14} /> FOUR SIDES ARCHITECTURE
                    </div>
                    <h3>Defensible residential certainty.</h3>
                    <p>
                      FACET structures the residential record so homeowners, buyers, and advisors work from the exact same visual evidence, underwriting comparables, and renovation specification.
                    </p>
                    <div className="integration-list">
                      <span>
                        <span className="integration-dot" /> <strong>01 · Sight</strong> · Market &amp; elevation evidence
                      </span>
                      <span>
                        <span className="integration-dot" /> <strong>02 · Worth</strong> · Underwriting number with its receipt
                      </span>
                      <span>
                        <span className="integration-dot" /> <strong>03 · Work</strong> · The Loupe render &amp; AI Edit studio
                      </span>
                      <span>
                        <span className="integration-dot" /> <strong>04 · Story</strong> · Exportable dossier &amp; The Vault
                      </span>
                    </div>
                    <div className="integration-note">
                      © 2026 FACET · Engineered by ODASI Technologies Inc.
                    </div>
                  </aside>
                </section>
              )}

              <footer className="stage-footer">
                <button className="back-button" onClick={back} disabled={currentIndex === 0}>
                  <ChevronLeft size={16} /> Back
                </button>
                <div className="footer-center">
                  <span>© 2026 FACET</span>
                  <i /> ENGINEERED BY ODASI TECHNOLOGIES INC.
                </div>
                {currentIndex < stages.length - 1 ? (
                  <button className="next-button" onClick={advance}>
                    Continue to {stages[currentIndex + 1].label} <ArrowRight size={16} />
                  </button>
                ) : (
                  <button className="next-button" onClick={downloadDossier}>
                    Export dossier <Download size={15} />
                  </button>
                )}
              </footer>
            </>
          )}
        </div>
      </main>

      {/* About / Engine & Trust Architecture Modal (only surface permitted to carry neutral engine attribution per §4a) */}
      {showLayers && (
        <div className="modal-backdrop" onClick={() => setShowLayers(false)}>
          <div className="brief-modal layers-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <span className="section-mini">FACET · ABOUT &amp; ENGINE ARCHITECTURE</span>
                <h3>What powers this studio</h3>
              </div>
              <button
                className="icon-button"
                onClick={() => setShowLayers(false)}
                aria-label="Close engine architecture"
              >
                <X size={18} />
              </button>
            </div>
            <p className="layers-lead">
              <strong>The Loupe</strong> is FACET&apos;s analysis, ranking, render, and QC engine. It combines deterministic residential canvas synthesis with optional cloud vision and local object/text detection.
            </p>
            <div className="layer-list">
              {engineLayers.map((layer) => (
                <div key={layer.name} className="layer-row">
                  <span className="dot on" />
                  <div>
                    <strong>{layer.name}</strong>
                    <small>{layer.role}</small>
                  </div>
                  <em>{layer.state}</em>
                </div>
              ))}
            </div>
            <p className="modal-disclaimer">
              © 2026 FACET · Engineered by ODASI Technologies Inc. · Trust records by the AUCTUM engine. Generated renders are explicitly labelled as AI concept studies.
            </p>
            <button className="primary-button full-button" onClick={() => setShowLayers(false)}>
              Done
            </button>
          </div>
        </div>
      )}

      {/* Studio Preferences Modal */}
      {showSettings && (
        <div className="modal-backdrop" onClick={() => setShowSettings(false)}>
          <div className="brief-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <span className="section-mini">FACET STUDIO</span>
                <h3>Preferences</h3>
              </div>
              <button
                className="icon-button"
                onClick={() => setShowSettings(false)}
                aria-label="Close preferences"
              >
                <X size={18} />
              </button>
            </div>
            <p className={`api-pill ${apiAvailable ? "ok" : "off"}`}>
              {apiAvailable
                ? "CLOUD VISION CONNECTED + LOCAL LOUPE SYNTHESIZER"
                : "LOCAL LOUPE ARCHITECTURAL SYNTHESIZER ACTIVE"}
            </p>
            <div className="settings-list">
              <div className="settings-row">
                <div>
                  <strong>Live elevation analysis</strong>
                  <p>
                    Inspect uploaded home photographs with YOLOX-S object detection, PP-OCRv5 house-number reading, and scene analysis.
                  </p>
                </div>
                <button
                  className={`toggle ${settings.liveAnalysis ? "on" : ""}`}
                  role="switch"
                  aria-checked={settings.liveAnalysis}
                  onClick={() => saveSettings({ ...settings, liveAnalysis: !settings.liveAnalysis })}
                >
                  <i />
                </button>
              </div>
              <div className="settings-row">
                <div>
                  <strong>Cloud neural rendering fallback</strong>
                  <p>
                    When enabled, pairs The Loupe&apos;s parametric architectural renderer with cloud image synthesis when an API key is configured.
                  </p>
                </div>
                <button
                  className={`toggle ${settings.renderConcepts ? "on" : ""}`}
                  role="switch"
                  aria-checked={settings.renderConcepts}
                  onClick={() =>
                    saveSettings({ ...settings, renderConcepts: !settings.renderConcepts })
                  }
                >
                  <i />
                </button>
              </div>
            </div>
            <p className="modal-disclaimer">
              Photographs and AI Edit revisions remain in your current browser session. Concept renders are architectural visualizations, not structural engineering drawings.
            </p>
            <button className="primary-button full-button" onClick={() => setShowSettings(false)}>
              Done
            </button>
          </div>
        </div>
      )}

      {/* Property Dossier Summary Modal */}
      {showBrief && (
        <div className="modal-backdrop" onClick={() => setShowBrief(false)}>
          <div className="brief-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <span className="section-mini">FOUR SIDES SUMMARY</span>
                <h3>Residential Property Dossier</h3>
              </div>
              <button className="icon-button" onClick={() => setShowBrief(false)}>
                <X size={18} />
              </button>
            </div>
            <p className="modal-asset">{assetName}</p>
            <p className="modal-location">
              <MapPin size={14} />
              {location} · As of {activePreset.asOfDate}
            </p>
            <div className="modal-progress">
              {stages.map((s, i) => (
                <div key={s.id} className={i <= currentIndex ? "modal-done" : ""}>
                  <span>{i < currentIndex ? <Check size={11} /> : s.n}</span>
                  {s.label}
                </div>
              ))}
            </div>
            <p className="modal-disclaimer">
              Baseline Worth: {formatUsd(activePreset.baselineWorthUsd)} ({activePreset.worthConfidencePct}% confidence) · Active Upgrade (v{activeRevision?.version ?? 1}): {activeRevision?.summary} · Projected Post-Renovation Worth: {formatUsd(projectedWorthUsd)}.
            </p>
            <button
              className="primary-button full-button"
              onClick={() => {
                setShowBrief(false);
                downloadDossier();
              }}
            >
              Export FACET Dossier <Download size={15} />
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast">
          <Check size={15} />
          {toast}
        </div>
      )}
      <div className="demo-watermark">
        FACET · THE LOUPE <span>·</span> v{activeRevision?.version ?? 1} RENDER ACTIVE
      </div>
    </div>
  );
}
