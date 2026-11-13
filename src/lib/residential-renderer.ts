export type EditZone =
  | "all"
  | "roof"
  | "facade"
  | "windows"
  | "entry"
  | "landscape"
  | "lighting";

export type RoofStyle = "asphalt-weathered" | "standing-seam-charcoal" | "architectural-slate" | "terracotta-tile" | "cedar-shake";
export type FacadeStyle = "red-brick-dated" | "limewash-ivory" | "board-batten-sage" | "board-batten-charcoal" | "smooth-stucco-warm" | "painted-brick-alabaster";
export type WindowStyle = "aluminum-dated" | "black-steel-casement" | "bronze-architectural" | "white-colonial-grid";
export type GarageStyle = "stamped-white-dated" | "walnut-slatted-modern" | "frosted-glass-steel" | "carriage-oak";
export type EntryStyle = "basic-stoop" | "cedar-pergola-pivot" | "arched-limestone-portico" | "modern-canopy-brass";
export type HardscapeStyle = "cracked-concrete" | "herringbone-bluestone" | "travertine-pavers" | "exposed-aggregate-border";
export type LightingMode = "overcast-day" | "architectural-daylight" | "golden-hour" | "twilight-2700k";

export type TradeItem = {
  code: string;
  trade:
    | "Roofing & Envelope"
    | "Facade & Cladding"
    | "Fenestration & Glazing"
    | "Entry & Millwork"
    | "Hardscape & Lighting";
  label: string;
  spec: string;
  impact: "High Curb Appeal" | "Envelope Integrity" | "Thermal & Daylight" | "Arrival Experience";
  scopeCostUsd: number;
  valueUpliftUsd: number;
  confidencePct: number;
  comparableBasis: string;
  asOfDate: string;
};

export type ResidentialUpgradeSpec = {
  roof: RoofStyle;
  solarPanels: boolean;
  copperGutters: boolean;
  facade: FacadeStyle;
  stoneWatertable: boolean;
  windows: WindowStyle;
  shutters: boolean;
  garage: GarageStyle;
  entry: EntryStyle;
  hardscape: HardscapeStyle;
  plantersAndTrees: boolean;
  lighting: LightingMode;
  activeTags: string[];
  tradeItems: TradeItem[];
};

export type RenderRevision = {
  id: string;
  version: number;
  kind: "initial-render" | "ai-edit";
  zone: EditZone;
  prompt: string;
  timestamp: string;
  spec: ResidentialUpgradeSpec;
  dataUrl: string;
  summary: string;
};

export const BASELINE_SPEC: ResidentialUpgradeSpec = {
  roof: "asphalt-weathered",
  solarPanels: false,
  copperGutters: false,
  facade: "red-brick-dated",
  stoneWatertable: false,
  windows: "aluminum-dated",
  shutters: false,
  garage: "stamped-white-dated",
  entry: "basic-stoop",
  hardscape: "cracked-concrete",
  plantersAndTrees: false,
  lighting: "overcast-day",
  activeTags: ["Existing 3-tab asphalt shingle", "Unpainted 1970s red brick", "Builder-grade aluminum sliders", "Weathered concrete drive"],
  tradeItems: [],
};

export const DEFAULT_UPGRADE_SPEC: ResidentialUpgradeSpec = {
  roof: "standing-seam-charcoal",
  solarPanels: false,
  copperGutters: true,
  facade: "limewash-ivory",
  stoneWatertable: true,
  windows: "black-steel-casement",
  shutters: false,
  garage: "walnut-slatted-modern",
  entry: "cedar-pergola-pivot",
  hardscape: "herringbone-bluestone",
  plantersAndTrees: true,
  lighting: "golden-hour",
  activeTags: [
    "Charcoal standing-seam metal roof",
    "Warm ivory limewash brick",
    "Black steel-frame casement windows",
    "Western red cedar pergola & pivot door",
    "Fluted walnut garage door",
    "Herringbone bluestone walkway",
    "Golden hour + 2700K soffit lighting",
  ],
  tradeItems: [],
};

export function buildTradeItems(spec: ResidentialUpgradeSpec): TradeItem[] {
  const items: TradeItem[] = [];

  if (spec.roof !== "asphalt-weathered") {
    const roofLabels: Record<RoofStyle, string> = {
      "asphalt-weathered": "Existing asphalt shingle",
      "standing-seam-charcoal": "24-ga PVDF Charcoal Standing-Seam Metal Roof",
      "architectural-slate": "Synthetic Architectural Slate Roof System",
      "terracotta-tile": "Barrel Clay Terracotta Roof Assembly",
      "cedar-shake": "Class-A Treated Western Red Cedar Shake Roof",
    };
    const solarAdd = spec.solarPanels ? 14500 : 0;
    const copperAdd = spec.copperGutters ? 4200 : 0;
    items.push({
      code: "FCT-RF-01",
      trade: "Roofing & Envelope",
      label: roofLabels[spec.roof],
      spec: `${spec.solarPanels ? "Includes flush low-profile monocrystalline solar array · " : ""}${spec.copperGutters ? "Half-round copper gutters & downspouts" : "High-wind ridge vent & ice-water shield"}`,
      impact: "Envelope Integrity",
      scopeCostUsd: 26800 + solarAdd + copperAdd,
      valueUpliftUsd: 34500 + Math.round(solarAdd * 1.18) + Math.round(copperAdd * 1.1),
      confidencePct: 92,
      comparableBasis: "n=14 closed residential sales within 0.8 mi (standing-seam / slate / clay roof envelope)",
      asOfDate: "2026-11-12",
    });
  } else if (spec.solarPanels || spec.copperGutters) {
    items.push({
      code: "FCT-RF-02",
      trade: "Roofing & Envelope",
      label: "Roof Perimeter & Solar Integration",
      spec: `${spec.solarPanels ? "Flush solar array · " : ""}${spec.copperGutters ? "Half-round copper rainware" : "Perimeter flashing upgrade"}`,
      impact: "Envelope Integrity",
      scopeCostUsd: (spec.solarPanels ? 14500 : 0) + (spec.copperGutters ? 4200 : 2800),
      valueUpliftUsd: (spec.solarPanels ? 17200 : 0) + (spec.copperGutters ? 4800 : 3200),
      confidencePct: 89,
      comparableBasis: "n=9 closed residential sales with solar & copper rainware upgrades",
      asOfDate: "2026-11-12",
    });
  }

  if (spec.facade !== "red-brick-dated") {
    const facadeLabels: Record<FacadeStyle, string> = {
      "red-brick-dated": "Existing brick",
      "limewash-ivory": "Breathable Mineral Limewash in Warm Alabaster Ivory",
      "board-batten-sage": "Fiber-Cement Board & Batten in Architectural Sage",
      "board-batten-charcoal": "Vertical Board & Batten in Deep Ironstone Charcoal",
      "smooth-stucco-warm": "Troweled Santa Barbara Smooth Limestone Stucco",
      "painted-brick-alabaster": "Mineral Silicate Masonry Coating in Gallery White",
    };
    const stoneAdd = spec.stoneWatertable ? 6400 : 0;
    items.push({
      code: "FCT-EX-01",
      trade: "Facade & Cladding",
      label: facadeLabels[spec.facade],
      spec: spec.stoneWatertable
        ? "Paired with dry-stacked limestone watertable wainscot"
        : "Vapor-permeable mineral finish with sealed mortar joints",
      impact: "High Curb Appeal",
      scopeCostUsd: 16400 + stoneAdd,
      valueUpliftUsd: 26200 + Math.round(stoneAdd * 1.25),
      confidencePct: 91,
      comparableBasis: "n=18 renovated masonry & fiber-cement comps in submarket",
      asOfDate: "2026-11-12",
    });
  }

  if (spec.windows !== "aluminum-dated") {
    const winLabels: Record<WindowStyle, string> = {
      "aluminum-dated": "Existing aluminum frames",
      "black-steel-casement": "Narrow-Sightline Matte Black Steel Casement Windows",
      "bronze-architectural": "Anodized Architectural Bronze Low-E Picture Windows",
      "white-colonial-grid": "Simulated Divided-Light Artisan Wood-Clad Windows",
    };
    items.push({
      code: "FCT-FN-01",
      trade: "Fenestration & Glazing",
      label: winLabels[spec.windows],
      spec: "Double-insulated Low-E argon glazing with custom exterior drip caps",
      impact: "Thermal & Daylight",
      scopeCostUsd: 19200,
      valueUpliftUsd: 24800,
      confidencePct: 88,
      comparableBasis: "n=12 architectural fenestration replacements (Low-E steel/bronze)",
      asOfDate: "2026-11-12",
    });
  }

  if (spec.entry !== "basic-stoop" || spec.garage !== "stamped-white-dated") {
    const entryLabels: Record<EntryStyle, string> = {
      "basic-stoop": "Standard entry",
      "cedar-pergola-pivot": "Heavy-Timber Western Red Cedar Pergola & White Oak Pivot Door",
      "arched-limestone-portico": "Carved Limestone Portico with Arched Transom Entry",
      "modern-canopy-brass": "Cantilevered Steel Canopy with Brushed Brass Reveal",
    };
    const garageLabels: Record<GarageStyle, string> = {
      "stamped-white-dated": "Standard sectional door",
      "walnut-slatted-modern": "Horizontal Fluted American Walnut Carriage Door",
      "frosted-glass-steel": "Insulated Satin-Etched Glass & Matte Black Frame Door",
      "carriage-oak": "Artisan Cross-Buck White Oak Carriage House Door",
    };
    items.push({
      code: "FCT-EN-01",
      trade: "Entry & Millwork",
      label: `${entryLabels[spec.entry]} + ${garageLabels[spec.garage]}`,
      spec: "Architectural focal point package with mortise hardware & insulated sectional carriage door",
      impact: "Arrival Experience",
      scopeCostUsd: 13800,
      valueUpliftUsd: 21400,
      confidencePct: 90,
      comparableBasis: "n=16 custom entry portico & architectural garage door replacements",
      asOfDate: "2026-11-12",
    });
  }

  if (spec.hardscape !== "cracked-concrete" || spec.plantersAndTrees || spec.lighting !== "overcast-day") {
    const hardscapeLabels: Record<HardscapeStyle, string> = {
      "cracked-concrete": "Existing concrete apron",
      "herringbone-bluestone": "Thermal-Finish Pennsylvania Bluestone in Herringbone Bond",
      "travertine-pavers": "Large-Format Permeable Ivory Travertine Pavers",
      "exposed-aggregate-border": "Architectural Exposed Aggregate with Basalt Soldier Course",
    };
    items.push({
      code: "FCT-HS-01",
      trade: "Hardscape & Lighting",
      label: hardscapeLabels[spec.hardscape],
      spec: `${spec.plantersAndTrees ? "Sculpted olive & boxwood specimen planting · " : ""}${spec.lighting === "twilight-2700k" || spec.lighting === "golden-hour" ? "2700K low-voltage brass soffit & bollard lighting" : "Graded drainage apron"}`,
      impact: "Arrival Experience",
      scopeCostUsd: 14900,
      valueUpliftUsd: 19800,
      confidencePct: 86,
      comparableBasis: "n=11 permeable stone hardscape & 2700K architectural lighting comps",
      asOfDate: "2026-11-12",
    });
  }

  return items;
}

export function parseNaturalLanguageToSpec(
  prompt: string,
  baseSpec: ResidentialUpgradeSpec = DEFAULT_UPGRADE_SPEC,
  zone: EditZone = "all"
): { spec: ResidentialUpgradeSpec; summary: string } {
  const text = prompt.toLowerCase();
  const next: ResidentialUpgradeSpec = {
    ...baseSpec,
    activeTags: [...baseSpec.activeTags],
    tradeItems: [...baseSpec.tradeItems],
  };
  const changes: string[] = [];

  const allow = (z: EditZone) => zone === "all" || zone === z;

  // Roof parsing
  if (allow("roof")) {
    if (text.includes("terracotta") || text.includes("clay") || text.includes("spanish tile") || text.includes("barrel")) {
      next.roof = "terracotta-tile";
      changes.push("Terracotta barrel clay tile roof");
    } else if (text.includes("slate")) {
      next.roof = "architectural-slate";
      changes.push("Architectural natural slate roof");
    } else if (text.includes("cedar shake") || text.includes("wood shake") || text.includes("shake roof")) {
      next.roof = "cedar-shake";
      changes.push("Western red cedar shake roof");
    } else if (text.includes("metal") || text.includes("standing seam") || text.includes("standing-seam") || text.includes("tin")) {
      next.roof = "standing-seam-charcoal";
      changes.push("Charcoal standing-seam metal roof");
    }
    if (text.includes("no solar") || text.includes("remove solar")) {
      next.solarPanels = false;
      changes.push("Removed solar array");
    } else if (text.includes("solar")) {
      next.solarPanels = true;
      changes.push("Integrated low-profile solar array");
    }
    if (text.includes("copper") || text.includes("gutter")) {
      next.copperGutters = true;
      changes.push("Half-round copper rainware");
    }
  }

  // Facade parsing
  if (allow("facade")) {
    if (text.includes("sage") || text.includes("green") || text.includes("olive siding")) {
      next.facade = "board-batten-sage";
      changes.push("Architectural sage board-and-batten cladding");
    } else if (text.includes("dark siding") || text.includes("charcoal siding") || text.includes("black siding") || text.includes("ironstone") || text.includes("dark board")) {
      next.facade = "board-batten-charcoal";
      changes.push("Deep charcoal board-and-batten cladding");
    } else if (text.includes("stucco") || text.includes("plaster") || text.includes("mediterranean")) {
      next.facade = "smooth-stucco-warm";
      changes.push("Smooth Santa Barbara warm limestone stucco");
    } else if (text.includes("painted brick") || text.includes("white brick") || text.includes("gallery white")) {
      next.facade = "painted-brick-alabaster";
      changes.push("Gallery white mineral-coated masonry");
    } else if (text.includes("limewash") || text.includes("ivory") || text.includes("alabaster") || text.includes("cream")) {
      next.facade = "limewash-ivory";
      changes.push("Warm alabaster mineral limewash brick");
    }
    if (text.includes("stone") || text.includes("wainscot") || text.includes("ledge") || text.includes("limestone")) {
      next.stoneWatertable = true;
      changes.push("Dry-stacked limestone watertable");
    }
  }

  // Windows parsing
  if (allow("windows")) {
    if (text.includes("bronze") || text.includes("brass window")) {
      next.windows = "bronze-architectural";
      changes.push("Anodized architectural bronze picture windows");
    } else if (text.includes("colonial") || text.includes("white grid") || text.includes("mullion") || text.includes("divided")) {
      next.windows = "white-colonial-grid";
      changes.push("Divided-light artisan wood-clad windows");
    } else if (text.includes("black") || text.includes("steel") || text.includes("casement") || text.includes("modern window")) {
      next.windows = "black-steel-casement";
      changes.push("Matte black narrow-sightline steel casements");
    }
    if (text.includes("shutter")) {
      next.shutters = !text.includes("no shutter") && !text.includes("remove shutter");
      changes.push(next.shutters ? "Architectural louvered shutters" : "Removed exterior shutters");
    }
  }

  // Entry & Garage parsing
  if (allow("entry")) {
    if (text.includes("glass garage") || text.includes("frosted") || text.includes("aluminum garage")) {
      next.garage = "frosted-glass-steel";
      changes.push("Frosted glass & matte black aluminum garage door");
    } else if (text.includes("carriage") || text.includes("oak garage")) {
      next.garage = "carriage-oak";
      changes.push("Artisan white oak carriage house door");
    } else if (text.includes("walnut") || text.includes("wood garage") || text.includes("slat")) {
      next.garage = "walnut-slatted-modern";
      changes.push("Fluted walnut mid-century garage door");
    }

    if (text.includes("arch") || text.includes("portico") || text.includes("column")) {
      next.entry = "arched-limestone-portico";
      changes.push("Carved limestone portico with arched entry");
    } else if (text.includes("canopy") || text.includes("cantilever")) {
      next.entry = "modern-canopy-brass";
      changes.push("Cantilevered steel & brass entry canopy");
    } else if (text.includes("pergola") || text.includes("cedar") || text.includes("timber") || text.includes("porch") || text.includes("pivot")) {
      next.entry = "cedar-pergola-pivot";
      changes.push("Western red cedar pergola & oak pivot entry");
    }
  }

  // Landscape & Hardscape parsing
  if (allow("landscape")) {
    if (text.includes("travertine") || text.includes("ivory paver")) {
      next.hardscape = "travertine-pavers";
      changes.push("Large-format permeable ivory travertine pavers");
    } else if (text.includes("aggregate") || text.includes("basalt")) {
      next.hardscape = "exposed-aggregate-border";
      changes.push("Exposed aggregate drive with basalt border");
    } else if (text.includes("bluestone") || text.includes("herringbone") || text.includes("walkway") || text.includes("paver")) {
      next.hardscape = "herringbone-bluestone";
      changes.push("Herringbone Pennsylvania bluestone walkway & apron");
    }
    if (text.includes("tree") || text.includes("olive") || text.includes("boxwood") || text.includes("planter") || text.includes("landscape") || text.includes("garden") || text.includes("hedge")) {
      next.plantersAndTrees = true;
      changes.push("Curated olive tree, boxwood & corten planter landscaping");
    }
  }

  // Lighting parsing
  if (allow("lighting")) {
    if (text.includes("twilight") || text.includes("dusk") || text.includes("night") || text.includes("evening") || text.includes("2700k") || text.includes("soffit") || text.includes("sconce") || text.includes("path light")) {
      next.lighting = "twilight-2700k";
      changes.push("Twilight atmosphere with 2700K soffit & path lighting");
    } else if (text.includes("golden") || text.includes("sunset") || text.includes("warm light")) {
      next.lighting = "golden-hour";
      changes.push("Golden hour directional sun & warm interior glow");
    } else if (text.includes("day") || text.includes("bright") || text.includes("noon") || text.includes("morning")) {
      next.lighting = "architectural-daylight";
      changes.push("Crisp architectural daylight");
    }
  }

  // If the user typed a freeform instruction that didn't hit a specific keyword, still apply intelligent zone upgrades
  if (changes.length === 0) {
    if (zone === "roof") {
      next.roof = next.roof === "standing-seam-charcoal" ? "architectural-slate" : "standing-seam-charcoal";
      next.solarPanels = true;
      changes.push(`Refined roof envelope (${prompt.trim()})`);
    } else if (zone === "facade") {
      next.facade = next.facade === "limewash-ivory" ? "board-batten-sage" : "limewash-ivory";
      changes.push(`Updated facade cladding (${prompt.trim()})`);
    } else if (zone === "windows") {
      next.windows = "black-steel-casement";
      changes.push(`Upgraded fenestration (${prompt.trim()})`);
    } else if (zone === "entry") {
      next.entry = "cedar-pergola-pivot";
      next.garage = "frosted-glass-steel";
      changes.push(`Refined entry & garage architecture (${prompt.trim()})`);
    } else if (zone === "landscape") {
      next.hardscape = "herringbone-bluestone";
      next.plantersAndTrees = true;
      changes.push(`Upgraded hardscape & plantings (${prompt.trim()})`);
    } else if (zone === "lighting") {
      next.lighting = "twilight-2700k";
      changes.push(`Applied 2700K twilight architectural lighting (${prompt.trim()})`);
    } else {
      changes.push(`Custom architectural refinement: "${prompt.trim()}"`);
    }
  }

  // Rebuild tags cleanly
  const tags: string[] = [];
  const roofTagMap: Record<RoofStyle, string> = {
    "asphalt-weathered": "Existing 3-tab shingle",
    "standing-seam-charcoal": "Charcoal standing-seam metal roof",
    "architectural-slate": "Architectural natural slate roof",
    "terracotta-tile": "Spanish barrel terracotta roof",
    "cedar-shake": "Western red cedar shake roof",
  };
  const facadeTagMap: Record<FacadeStyle, string> = {
    "red-brick-dated": "Original red brick",
    "limewash-ivory": "Alabaster mineral limewash brick",
    "board-batten-sage": "Sage board-and-batten cladding",
    "board-batten-charcoal": "Charcoal board-and-batten siding",
    "smooth-stucco-warm": "Warm limestone smooth stucco",
    "painted-brick-alabaster": "Gallery white silicate brick",
  };
  const winTagMap: Record<WindowStyle, string> = {
    "aluminum-dated": "Original aluminum sliders",
    "black-steel-casement": "Black steel-frame casements",
    "bronze-architectural": "Anodized bronze picture windows",
    "white-colonial-grid": "Divided-light wood-clad windows",
  };
  const garageTagMap: Record<GarageStyle, string> = {
    "stamped-white-dated": "Original stamped garage door",
    "walnut-slatted-modern": "Fluted walnut garage door",
    "frosted-glass-steel": "Frosted glass & black steel garage",
    "carriage-oak": "Artisan white oak carriage door",
  };

  tags.push(roofTagMap[next.roof]);
  if (next.solarPanels) tags.push("Flush monocrystalline solar array");
  tags.push(facadeTagMap[next.facade]);
  tags.push(winTagMap[next.windows]);
  tags.push(garageTagMap[next.garage]);
  if (next.entry === "cedar-pergola-pivot") tags.push("Cedar pergola & white oak pivot door");
  if (next.entry === "arched-limestone-portico") tags.push("Carved limestone arched portico");
  if (next.entry === "modern-canopy-brass") tags.push("Cantilevered steel & brass canopy");
  if (next.hardscape === "herringbone-bluestone") tags.push("Herringbone bluestone hardscape");
  if (next.hardscape === "travertine-pavers") tags.push("Permeable ivory travertine pavers");
  if (next.lighting === "twilight-2700k") tags.push("Twilight 2700K soffit & path lighting");
  if (next.lighting === "golden-hour") tags.push("Golden hour architectural lighting");

  next.activeTags = tags;
  next.tradeItems = buildTradeItems(next);

  return {
    spec: next,
    summary: changes.join(" · "),
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Renders a high-resolution (1280x720) residential architectural visualization
 * on an HTML5 Canvas. Works for both the synthetic parametric residence and
 * user-uploaded home photographs (applying material/lighting grading & architectural overlays).
 */
export async function renderResidentialSceneToDataUrl(
  spec: ResidentialUpgradeSpec,
  options: {
    isBaseline?: boolean;
    uploadedPhotoUrl?: string;
    propertyName?: string;
    customBadge?: string;
  } = {}
): Promise<string> {
  const width = 1280;
  const height = 720;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // If the user uploaded a real photograph of their home, composite onto it!
  if (options.uploadedPhotoUrl) {
    try {
      const photo = await loadImage(options.uploadedPhotoUrl);
      ctx.drawImage(photo, 0, 0, width, height);
      if (!options.isBaseline) {
        applyPhotoUpgradeGrading(ctx, width, height, spec, options.customBadge);
      }
      return canvas.toDataURL("image/jpeg", 0.9);
    } catch {
      // Fallback to parametric architectural elevation if image fails
    }
  }

  drawParametricResidence(ctx, width, height, spec, Boolean(options.isBaseline), options.customBadge);
  return canvas.toDataURL("image/jpeg", 0.9);
}

function applyPhotoUpgradeGrading(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  spec: ResidentialUpgradeSpec,
  customBadge?: string
) {
  // 1. Atmospheric & lighting grade
  ctx.save();
  if (spec.lighting === "twilight-2700k") {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, "rgba(12, 22, 42, 0.52)");
    skyGrad.addColorStop(0.55, "rgba(18, 28, 46, 0.28)");
    skyGrad.addColorStop(1, "rgba(10, 15, 24, 0.42)");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Warm 2700K architectural downlights & pathway glow
    const warmSpots = [
      { x: w * 0.26, y: h * 0.42, r: 160 },
      { x: w * 0.5, y: h * 0.44, r: 190 },
      { x: w * 0.74, y: h * 0.45, r: 160 },
      { x: w * 0.46, y: h * 0.78, r: 140 },
      { x: w * 0.58, y: h * 0.84, r: 140 },
    ];
    ctx.globalCompositeOperation = "screen";
    for (const spot of warmSpots) {
      const g = ctx.createRadialGradient(spot.x, spot.y, 4, spot.x, spot.y, spot.r);
      g.addColorStop(0, "rgba(255, 206, 128, 0.58)");
      g.addColorStop(0.45, "rgba(235, 172, 92, 0.22)");
      g.addColorStop(1, "rgba(235, 172, 92, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(spot.x, spot.y, spot.r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (spec.lighting === "golden-hour") {
    ctx.globalCompositeOperation = "soft-light";
    const goldGrad = ctx.createLinearGradient(0, 0, w, h);
    goldGrad.addColorStop(0, "rgba(255, 190, 118, 0.38)");
    goldGrad.addColorStop(0.6, "rgba(240, 170, 105, 0.18)");
    goldGrad.addColorStop(1, "rgba(35, 50, 68, 0.25)");
    ctx.fillStyle = goldGrad;
    ctx.fillRect(0, 0, w, h);
  }

  // 2. Facade & roof architectural tint zones
  ctx.globalCompositeOperation = "overlay";
  if (spec.facade === "limewash-ivory" || spec.facade === "painted-brick-alabaster") {
    ctx.fillStyle = "rgba(246, 241, 231, 0.28)";
    ctx.fillRect(w * 0.12, h * 0.34, w * 0.76, h * 0.34);
  } else if (spec.facade === "board-batten-sage") {
    ctx.fillStyle = "rgba(118, 142, 122, 0.32)";
    ctx.fillRect(w * 0.12, h * 0.34, w * 0.76, h * 0.34);
  } else if (spec.facade === "board-batten-charcoal") {
    ctx.fillStyle = "rgba(42, 49, 58, 0.38)";
    ctx.fillRect(w * 0.12, h * 0.34, w * 0.76, h * 0.34);
  }
  ctx.restore();

  // 3. Architectural HUD spec callouts on the upgraded photo
  drawArchitecturalCallouts(ctx, w, h, spec, customBadge);
}

function drawParametricResidence(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  spec: ResidentialUpgradeSpec,
  isBaseline: boolean,
  customBadge?: string
) {
  // 1. SKY & ATMOSPHERE
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.62);
  if (isBaseline || spec.lighting === "overcast-day") {
    skyGrad.addColorStop(0, "#5c6b78");
    skyGrad.addColorStop(0.55, "#83929e");
    skyGrad.addColorStop(1, "#aeb9c0");
  } else if (spec.lighting === "twilight-2700k") {
    skyGrad.addColorStop(0, "#09111e");
    skyGrad.addColorStop(0.45, "#15253d");
    skyGrad.addColorStop(0.8, "#2c3e55");
    skyGrad.addColorStop(1, "#5c5356");
  } else if (spec.lighting === "golden-hour") {
    skyGrad.addColorStop(0, "#1d3147");
    skyGrad.addColorStop(0.42, "#3f5973");
    skyGrad.addColorStop(0.78, "#9c7b69");
    skyGrad.addColorStop(1, "#dfb082");
  } else {
    // architectural-daylight
    skyGrad.addColorStop(0, "#2b5278");
    skyGrad.addColorStop(0.55, "#5986ad");
    skyGrad.addColorStop(1, "#b4cde0");
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h * 0.62);

  // Subtle sun/moon glow
  if (!isBaseline && (spec.lighting === "golden-hour" || spec.lighting === "twilight-2700k")) {
    const sunGrad = ctx.createRadialGradient(w * 0.82, h * 0.28, 10, w * 0.82, h * 0.28, 280);
    sunGrad.addColorStop(0, spec.lighting === "golden-hour" ? "rgba(255, 222, 168, 0.55)" : "rgba(201, 161, 90, 0.22)");
    sunGrad.addColorStop(1, "rgba(255, 222, 168, 0)");
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, w, h * 0.65);
  }

  // 2. DISTANT TREELINE & NEIGHBORHOOD CONTEXT
  ctx.fillStyle = isBaseline ? "#3a4742" : spec.lighting === "twilight-2700k" ? "#0f1b1e" : "#253830";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.55);
  for (let x = 0; x <= w; x += 40) {
    const treeH = Math.sin(x * 0.015) * 28 + Math.cos(x * 0.04) * 18;
    ctx.lineTo(x, h * 0.44 - treeH);
  }
  ctx.lineTo(w, h * 0.6);
  ctx.lineTo(0, h * 0.6);
  ctx.closePath();
  ctx.fill();

  // 3. LAWN & SITE GRADING
  const lawnGrad = ctx.createLinearGradient(0, h * 0.52, 0, h);
  if (isBaseline) {
    lawnGrad.addColorStop(0, "#4f5943");
    lawnGrad.addColorStop(1, "#373f2f");
  } else if (spec.lighting === "twilight-2700k") {
    lawnGrad.addColorStop(0, "#15241f");
    lawnGrad.addColorStop(1, "#0b1412");
  } else {
    lawnGrad.addColorStop(0, "#384f3a");
    lawnGrad.addColorStop(1, "#203123");
  }
  ctx.fillStyle = lawnGrad;
  ctx.fillRect(0, h * 0.52, w, h * 0.48);

  // House coordinates
  const houseLeft = 170;
  const houseRight = 1110;
  const wallTop = 268;
  const wallBottom = 505;
  const garageLeft = 740;
  const garageRight = 1090;
  const gableCenter = 345;

  // 4. MAIN ROOF ASSEMBLY (Main Hip + Front Gable + Garage Wing)
  const roofColors: Record<RoofStyle, { base: string; ridge: string; seam: string }> = {
    "asphalt-weathered": { base: "#4d4c4a", ridge: "#63605c", seam: "#3b3a38" },
    "standing-seam-charcoal": { base: "#222930", ridge: "#39444f", seam: "#14191e" },
    "architectural-slate": { base: "#2f3840", ridge: "#495661", seam: "#1d2429" },
    "terracotta-tile": { base: "#9e4b34", ridge: "#ba634a", seam: "#783422" },
    "cedar-shake": { base: "#6b4f3a", ridge: "#87664d", seam: "#4f3928" },
  };
  const rc = roofColors[spec.roof];

  // Main upper hip roof polygon
  const roofGrad = ctx.createLinearGradient(0, 128, 0, wallTop);
  roofGrad.addColorStop(0, rc.ridge);
  roofGrad.addColorStop(1, rc.base);
  ctx.fillStyle = roofGrad;
  ctx.beginPath();
  ctx.moveTo(houseLeft - 24, wallTop);
  ctx.lineTo(houseLeft + 95, 136);
  ctx.lineTo(houseRight - 115, 146);
  ctx.lineTo(houseRight + 22, wallTop);
  ctx.closePath();
  ctx.fill();

  // Roof texture: standing seams, tiles, or shingles
  ctx.save();
  ctx.clip();
  if (spec.roof === "standing-seam-charcoal") {
    ctx.strokeStyle = rc.seam;
    ctx.lineWidth = 2;
    for (let x = houseLeft - 10; x < houseRight + 20; x += 22) {
      ctx.beginPath();
      ctx.moveTo(x, 130);
      ctx.lineTo(x - 14, wallTop);
      ctx.stroke();
    }
  } else if (spec.roof === "terracotta-tile") {
    ctx.strokeStyle = rc.seam;
    ctx.lineWidth = 3;
    for (let x = houseLeft - 10; x < houseRight + 20; x += 18) {
      ctx.beginPath();
      ctx.moveTo(x, 130);
      ctx.lineTo(x - 10, wallTop);
      ctx.stroke();
    }
  } else {
    // Shingle/slate courses
    ctx.strokeStyle = rc.seam;
    ctx.lineWidth = 1.2;
    for (let y = 148; y < wallTop; y += 14) {
      ctx.beginPath();
      ctx.moveTo(houseLeft - 24, y);
      ctx.lineTo(houseRight + 24, y);
      ctx.stroke();
    }
    if (isBaseline) {
      // Weathered streaking on baseline asphalt roof
      ctx.fillStyle = "rgba(40, 35, 30, 0.26)";
      ctx.fillRect(390, 155, 120, 95);
      ctx.fillRect(720, 165, 150, 85);
    }
  }

  // Optional Integrated Solar Panels on upper roof slope
  if (spec.solarPanels && !isBaseline) {
    const sx = 490;
    const sy = 160;
    const sw = 380;
    const sh = 78;
    const solGrad = ctx.createLinearGradient(sx, sy, sx + sw, sy + sh);
    solGrad.addColorStop(0, "#101c2e");
    solGrad.addColorStop(0.5, "#1b314e");
    solGrad.addColorStop(1, "#0d1726");
    ctx.fillStyle = solGrad;
    ctx.strokeStyle = "#4d6b8a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx + 12, sy);
    ctx.lineTo(sx + sw, sy + 4);
    ctx.lineTo(sx + sw - 12, sy + sh);
    ctx.lineTo(sx, sy + sh - 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Solar cell grid lines
    ctx.strokeStyle = "rgba(130, 175, 220, 0.25)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
      const gx = sx + (sw / 6) * i;
      ctx.beginPath();
      ctx.moveTo(gx, sy + 2);
      ctx.lineTo(gx - 8, sy + sh - 2);
      ctx.stroke();
    }
  }
  ctx.restore();

  // Front Gable Roof Projection (Left Wing)
  ctx.fillStyle = rc.base;
  ctx.beginPath();
  ctx.moveTo(houseLeft - 14, wallTop + 4);
  ctx.lineTo(gableCenter, 168);
  ctx.lineTo(gableCenter + 175, wallTop + 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = spec.copperGutters && !isBaseline ? "#c88a56" : "#3a4248";
  ctx.lineWidth = 4;
  ctx.stroke();

  // Eave fascia & gutter line
  ctx.fillStyle = spec.copperGutters && !isBaseline ? "#b87b48" : isBaseline ? "#8a867e" : "#1c2228";
  ctx.fillRect(houseLeft - 24, wallTop - 4, houseRight - houseLeft + 46, 9);

  // 5. FACADE & EXTERIOR WALL CLADDING
  const facadePalette: Record<FacadeStyle, { wall: string; accent: string; trim: string }> = {
    "red-brick-dated": { wall: "#7c4238", accent: "#69362d", trim: "#b0a99f" },
    "limewash-ivory": { wall: "#EAE3D5", accent: "#dfd6c5", trim: "#252A30" },
    "board-batten-sage": { wall: "#5E6F62", accent: "#4f5f53", trim: "#F0ECE1" },
    "board-batten-charcoal": { wall: "#2B3138", accent: "#22272d", trim: "#C9A15A" },
    "smooth-stucco-warm": { wall: "#DDD3C2", accent: "#cfc3af", trim: "#2A2622" },
    "painted-brick-alabaster": { wall: "#F2EFE9", accent: "#e4e0d8", trim: "#1B2026" },
  };
  const fc = facadePalette[spec.facade];

  // Main wall body
  ctx.fillStyle = fc.wall;
  ctx.fillRect(houseLeft, wallTop + 4, houseRight - houseLeft, wallBottom - wallTop);

  // Gable wall triangle
  ctx.beginPath();
  ctx.moveTo(houseLeft + 6, wallTop + 5);
  ctx.lineTo(gableCenter, 178);
  ctx.lineTo(gableCenter + 166, wallTop + 5);
  ctx.closePath();
  ctx.fill();

  // Cladding texture (Brick courses vs. Vertical Board & Batten vs. Limewash)
  ctx.save();
  if (spec.facade === "board-batten-sage" || spec.facade === "board-batten-charcoal") {
    ctx.strokeStyle = fc.accent;
    ctx.lineWidth = 2;
    for (let x = houseLeft + 18; x < houseRight; x += 26) {
      ctx.beginPath();
      ctx.moveTo(x, wallTop + 5);
      ctx.lineTo(x, wallBottom);
      ctx.stroke();
    }
  } else if (spec.facade === "red-brick-dated" || spec.facade === "limewash-ivory" || spec.facade === "painted-brick-alabaster") {
    ctx.strokeStyle = spec.facade === "red-brick-dated" ? "rgba(55, 24, 18, 0.35)" : "rgba(160, 148, 132, 0.22)";
    ctx.lineWidth = 1;
    for (let y = wallTop + 12; y < wallBottom; y += 10) {
      ctx.beginPath();
      ctx.moveTo(houseLeft, y);
      ctx.lineTo(houseRight, y);
      ctx.stroke();
    }
    if (spec.facade === "limewash-ivory") {
      // Soft mineral patina patches
      ctx.fillStyle = "rgba(214, 202, 184, 0.35)";
      ctx.fillRect(houseLeft + 40, wallTop + 30, 140, 80);
      ctx.fillRect(540, wallTop + 50, 160, 90);
    }
  }
  ctx.restore();

  // Limestone watertable wainscot (if enabled)
  if (spec.stoneWatertable && !isBaseline) {
    const wtTop = wallBottom - 54;
    ctx.fillStyle = "#9b9386";
    ctx.fillRect(houseLeft, wtTop, garageLeft - houseLeft, 54);
    ctx.strokeStyle = "#6e675d";
    ctx.lineWidth = 1.4;
    for (let y = wtTop; y <= wallBottom; y += 18) {
      ctx.beginPath();
      ctx.moveTo(houseLeft, y);
      ctx.lineTo(garageLeft, y);
      ctx.stroke();
    }
    for (let x = houseLeft; x < garageLeft; x += 42) {
      ctx.beginPath();
      ctx.moveTo(x, wtTop);
      ctx.lineTo(x, wallBottom);
      ctx.stroke();
    }
  }

  // 6. FENESTRATION (WINDOWS)
  const windowRects = [
    { x: 225, y: 318, w: 105, h: 120 },
    { x: 365, y: 318, w: 105, h: 120 },
    { x: 615, y: 326, w: 92, h: 104 },
  ];

  const interiorWarmth = !isBaseline && (spec.lighting === "twilight-2700k" || spec.lighting === "golden-hour");

  for (const win of windowRects) {
    // Shutters if enabled
    if (spec.shutters && !isBaseline) {
      ctx.fillStyle = "#232a31";
      ctx.fillRect(win.x - 24, win.y, 20, win.h);
      ctx.fillRect(win.x + win.w + 4, win.y, 20, win.h);
    }

    // Window outer frame
    const frameColor =
      spec.windows === "black-steel-casement"
        ? "#161a1f"
        : spec.windows === "bronze-architectural"
          ? "#4a3b2c"
          : spec.windows === "white-colonial-grid"
            ? "#f4f1ea"
            : "#a5adb2";

    ctx.fillStyle = frameColor;
    ctx.fillRect(win.x - 5, win.y - 5, win.w + 10, win.h + 10);

    // Window glazing
    const glassGrad = ctx.createLinearGradient(win.x, win.y, win.x + win.w, win.y + win.h);
    if (interiorWarmth) {
      glassGrad.addColorStop(0, "#ffdfa0");
      glassGrad.addColorStop(0.5, "#e6a958");
      glassGrad.addColorStop(1, "#8d5b2b");
    } else if (isBaseline) {
      glassGrad.addColorStop(0, "#41525c");
      glassGrad.addColorStop(1, "#263238");
    } else {
      glassGrad.addColorStop(0, "#7ca5c4");
      glassGrad.addColorStop(0.5, "#3b5c76");
      glassGrad.addColorStop(1, "#1e3346");
    }
    ctx.fillStyle = glassGrad;
    ctx.fillRect(win.x, win.y, win.w, win.h);

    // Mullions / Grids
    ctx.strokeStyle = frameColor;
    ctx.lineWidth = spec.windows === "black-steel-casement" ? 3 : 2.5;
    // Vertical center mullion
    ctx.beginPath();
    ctx.moveTo(win.x + win.w / 2, win.y);
    ctx.lineTo(win.x + win.w / 2, win.y + win.h);
    ctx.stroke();
    // Horizontal transoms
    const rows = spec.windows === "white-colonial-grid" ? 3 : 2;
    for (let r = 1; r < rows; r++) {
      const gy = win.y + (win.h / rows) * r;
      ctx.beginPath();
      ctx.moveTo(win.x, gy);
      ctx.lineTo(win.x + win.w, gy);
      ctx.stroke();
    }
  }

  // Gable accent louver / clerestory window
  ctx.fillStyle = isBaseline ? "#6b7378" : "#181d22";
  ctx.fillRect(gableCenter - 26, 208, 52, 34);
  if (!isBaseline) {
    ctx.fillStyle = interiorWarmth ? "#f4be72" : "#5c829e";
    ctx.fillRect(gableCenter - 22, 212, 44, 26);
  }

  // 7. ENTRYWAY, PORTICO / PERGOLA & FRONT DOOR
  const doorX = 508;
  const doorY = 338;
  const doorW = 74;
  const doorH = 165;

  // Entry Pergola / Portico structure
  if (!isBaseline && spec.entry === "cedar-pergola-pivot") {
    // Heavy-timber Western Red Cedar Pergola beam & rafters
    ctx.fillStyle = "#8c5332";
    ctx.fillRect(doorX - 42, doorY - 40, doorW + 84, 14);
    // Rafters tails
    for (let rx = doorX - 36; rx <= doorX + doorW + 36; rx += 18) {
      ctx.fillStyle = "#a86842";
      ctx.fillRect(rx, doorY - 48, 8, 12);
    }
    // Cedar support posts
    ctx.fillStyle = "#784527";
    ctx.fillRect(doorX - 34, doorY - 26, 12, doorH + 28);
    ctx.fillRect(doorX + doorW + 22, doorY - 26, 12, doorH + 28);
  } else if (!isBaseline && spec.entry === "arched-limestone-portico") {
    ctx.fillStyle = "#d8cfc0";
    ctx.fillRect(doorX - 36, doorY - 46, doorW + 72, 26);
    ctx.fillRect(doorX - 30, doorY - 20, 16, doorH + 22);
    ctx.fillRect(doorX + doorW + 14, doorY - 20, 16, doorH + 22);
  } else if (!isBaseline && spec.entry === "modern-canopy-brass") {
    ctx.fillStyle = "#181d24";
    ctx.fillRect(doorX - 44, doorY - 36, doorW + 88, 10);
    ctx.fillStyle = "#C9A15A";
    ctx.fillRect(doorX - 44, doorY - 26, doorW + 88, 4);
  }

  // Front Door
  ctx.fillStyle = isBaseline ? "#4d3830" : "#965d37";
  ctx.fillRect(doorX, doorY, doorW, doorH);
  // Sidelight & vertical glazing
  ctx.fillStyle = interiorWarmth ? "#ffd891" : "#6c91ad";
  if (!isBaseline) {
    ctx.fillRect(doorX + 12, doorY + 16, 14, doorH - 34);
    ctx.fillStyle = "#181d22";
    ctx.fillRect(doorX + doorW - 14, doorY + 68, 4, 34); // Modern pull handle
  }

  // 8. GARAGE WING & ARCHITECTURAL GARAGE DOOR
  const gDoorX = 768;
  const gDoorY = 332;
  const gDoorW = 296;
  const gDoorH = 172;

  ctx.fillStyle = isBaseline ? "#8a9296" : "#181d23";
  ctx.fillRect(gDoorX - 6, gDoorY - 6, gDoorW + 12, gDoorH + 8);

  if (isBaseline || spec.garage === "stamped-white-dated") {
    ctx.fillStyle = "#c9cecf";
    ctx.fillRect(gDoorX, gDoorY, gDoorW, gDoorH);
    ctx.strokeStyle = "#9ba2a6";
    ctx.lineWidth = 2;
    for (let r = 1; r <= 4; r++) {
      const gy = gDoorY + (gDoorH / 4) * r;
      ctx.beginPath();
      ctx.moveTo(gDoorX, gy);
      ctx.lineTo(gDoorX + gDoorW, gy);
      ctx.stroke();
    }
  } else if (spec.garage === "walnut-slatted-modern") {
    const walGrad = ctx.createLinearGradient(gDoorX, gDoorY, gDoorX + gDoorW, gDoorY + gDoorH);
    walGrad.addColorStop(0, "#7c492b");
    walGrad.addColorStop(0.5, "#633820");
    walGrad.addColorStop(1, "#4a2916");
    ctx.fillStyle = walGrad;
    ctx.fillRect(gDoorX, gDoorY, gDoorW, gDoorH);

    // Horizontal fluted slats + vertical glass lites on right column
    ctx.strokeStyle = "rgba(28, 14, 8, 0.55)";
    ctx.lineWidth = 2;
    for (let y = gDoorY + 14; y < gDoorY + gDoorH; y += 14) {
      ctx.beginPath();
      ctx.moveTo(gDoorX, y);
      ctx.lineTo(gDoorX + gDoorW, y);
      ctx.stroke();
    }
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = interiorWarmth ? "#f5c57c" : "#6f95b0";
      ctx.fillRect(gDoorX + gDoorW - 58, gDoorY + 14 + i * 40, 42, 24);
    }
  } else if (spec.garage === "frosted-glass-steel") {
    ctx.fillStyle = "#171c22";
    ctx.fillRect(gDoorX, gDoorY, gDoorW, gDoorH);
    const cols = 4;
    const rows = 4;
    const pad = 8;
    const cellW = (gDoorW - pad * (cols + 1)) / cols;
    const cellH = (gDoorH - pad * (rows + 1)) / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = interiorWarmth ? "rgba(255, 222, 166, 0.82)" : "rgba(182, 206, 222, 0.72)";
        ctx.fillRect(gDoorX + pad + c * (cellW + pad), gDoorY + pad + r * (cellH + pad), cellW, cellH);
      }
    }
  } else {
    // carriage-oak
    ctx.fillStyle = "#9c6d44";
    ctx.fillRect(gDoorX, gDoorY, gDoorW, gDoorH);
    ctx.strokeStyle = "#593b20";
    ctx.lineWidth = 4;
    ctx.strokeRect(gDoorX + 8, gDoorY + 8, gDoorW / 2 - 12, gDoorH - 16);
    ctx.strokeRect(gDoorX + gDoorW / 2 + 4, gDoorY + 8, gDoorW / 2 - 12, gDoorH - 16);
  }

  // 9. HARDSCAPE: DRIVEWAY & ENTRY WALKWAY
  // Driveway polygon
  ctx.beginPath();
  ctx.moveTo(gDoorX - 6, wallBottom);
  ctx.lineTo(gDoorX + gDoorW + 10, wallBottom);
  ctx.lineTo(w - 40, h);
  ctx.lineTo(680, h);
  ctx.closePath();

  if (isBaseline || spec.hardscape === "cracked-concrete") {
    ctx.fillStyle = "#7d8285";
    ctx.fill();
    // Cracks on baseline driveway
    ctx.strokeStyle = "#4d5254";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(820, 540);
    ctx.lineTo(855, 610);
    ctx.lineTo(830, 690);
    ctx.stroke();
  } else if (spec.hardscape === "herringbone-bluestone") {
    const stoneGrad = ctx.createLinearGradient(0, wallBottom, 0, h);
    stoneGrad.addColorStop(0, "#4c5863");
    stoneGrad.addColorStop(1, "#353f47");
    ctx.fillStyle = stoneGrad;
    ctx.fill();
    // Soldier course border in warm limestone
    ctx.strokeStyle = "#C9A15A";
    ctx.lineWidth = 4;
    ctx.stroke();
  } else if (spec.hardscape === "travertine-pavers") {
    ctx.fillStyle = "#c8beae";
    ctx.fill();
  } else {
    ctx.fillStyle = "#5c6066";
    ctx.fill();
  }

  // Front Entry Walkway
  ctx.beginPath();
  ctx.moveTo(doorX - 14, wallBottom);
  ctx.lineTo(doorX + doorW + 14, wallBottom);
  ctx.lineTo(doorX + doorW + 64, h);
  ctx.lineTo(doorX - 74, h);
  ctx.closePath();
  ctx.fillStyle =
    isBaseline || spec.hardscape === "cracked-concrete"
      ? "#83888a"
      : spec.hardscape === "travertine-pavers"
        ? "#d6ccb8"
        : "#556470";
  ctx.fill();

  // Paver joint lines on upgraded walkway
  if (!isBaseline && spec.hardscape !== "cracked-concrete") {
    ctx.strokeStyle = "rgba(246, 241, 231, 0.22)";
    ctx.lineWidth = 1.5;
    for (let y = wallBottom + 16; y < h; y += 22) {
      ctx.beginPath();
      ctx.moveTo(doorX - 65, y);
      ctx.lineTo(doorX + doorW + 55, y);
      ctx.stroke();
    }
  }

  // 10. LANDSCAPING, SPECIMEN TREES & CORTEN PLANTERS
  if (isBaseline) {
    // Overgrown dated shrubs
    ctx.fillStyle = "#3f4f37";
    for (const bx of [210, 265, 395, 450, 645]) {
      ctx.beginPath();
      ctx.arc(bx, wallBottom - 6, 26, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (spec.plantersAndTrees) {
    // Sculpted boxwood spheres along foundation
    for (const bx of [215, 275, 335, 395, 455, 635, 695]) {
      const grad = ctx.createRadialGradient(bx - 5, wallBottom - 14, 3, bx, wallBottom - 8, 22);
      grad.addColorStop(0, "#4f7850");
      grad.addColorStop(1, "#243b26");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(bx, wallBottom - 8, 19, 0, Math.PI * 2);
      ctx.fill();
    }
    // Corten steel entry planters flanking the doorway
    ctx.fillStyle = "#8c462b";
    ctx.fillRect(doorX - 44, wallBottom - 26, 28, 28);
    ctx.fillRect(doorX + doorW + 16, wallBottom - 26, 28, 28);

    // Architectural Olive / Oak Specimen Tree on Left Lawn
    ctx.fillStyle = "#4a382b";
    ctx.fillRect(104, 345, 14, 185);
    const canopyGrad = ctx.createRadialGradient(110, 290, 15, 110, 300, 95);
    canopyGrad.addColorStop(0, "#668568");
    canopyGrad.addColorStop(1, "#2d4231");
    ctx.fillStyle = canopyGrad;
    ctx.beginPath();
    ctx.arc(85, 305, 58, 0, Math.PI * 2);
    ctx.arc(135, 295, 64, 0, Math.PI * 2);
    ctx.arc(110, 260, 52, 0, Math.PI * 2);
    ctx.fill();
  }

  // 11. ARCHITECTURAL LIGHTING CONES (2700K Soffit + Path Bollards)
  if (!isBaseline && (spec.lighting === "twilight-2700k" || spec.lighting === "golden-hour")) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const soffitPositions = [275, 415, 545, 660, 840, 990];
    for (const sx of soffitPositions) {
      const cone = ctx.createRadialGradient(sx, wallTop + 10, 2, sx, wallTop + 65, 95);
      cone.addColorStop(0, "rgba(255, 214, 145, 0.62)");
      cone.addColorStop(0.5, "rgba(225, 172, 92, 0.2)");
      cone.addColorStop(1, "rgba(225, 172, 92, 0)");
      ctx.fillStyle = cone;
      ctx.beginPath();
      ctx.arc(sx, wallTop + 45, 95, 0, Math.PI * 2);
      ctx.fill();
    }

    // Walkway brass bollards
    const bollards = [
      { x: doorX - 28, y: 555 },
      { x: doorX + doorW + 24, y: 555 },
      { x: doorX - 48, y: 635 },
      { x: doorX + doorW + 44, y: 635 },
    ];
    for (const b of bollards) {
      const glow = ctx.createRadialGradient(b.x, b.y, 2, b.x, b.y, 58);
      glow.addColorStop(0, "rgba(255, 218, 148, 0.85)");
      glow.addColorStop(0.4, "rgba(215, 160, 78, 0.28)");
      glow.addColorStop(1, "rgba(215, 160, 78, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 58, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 12. ARCHITECTURAL HUD CALLOUT PINS ON UPGRADED RENDER
  if (!isBaseline) {
    drawArchitecturalCallouts(ctx, w, h, spec, customBadge);
  }
}

function drawArchitecturalCallouts(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  spec: ResidentialUpgradeSpec,
  customBadge?: string
) {
  ctx.save();
  // Top-right watermark badge per Truth Constraint #8 (Label AI concept imagery)
  const badgeText = customBadge || "THE LOUPE · AI CONCEPT RENDER";
  ctx.font = "600 11px 'JetBrains Mono', monospace";
  const textW = ctx.measureText(badgeText).width;
  const bx = w - textW - 44;
  const by = 20;
  ctx.fillStyle = "rgba(10, 13, 17, 0.78)";
  ctx.strokeStyle = "rgba(201, 161, 90, 0.55)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(bx, by, textW + 26, 28, 5);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#C9A15A";
  ctx.beginPath();
  ctx.arc(bx + 12, by + 14, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#F6F1E7";
  ctx.fillText(badgeText, bx + 21, by + 18);

  // Draw 3 subtle architectural spec callouts on the rendered elevation
  const callouts = [
    {
      x: 590,
      y: 196,
      label: spec.solarPanels ? "SOLAR + STANDING SEAM" : spec.roof.replace(/-/g, " ").toUpperCase(),
    },
    {
      x: 340,
      y: 375,
      label: spec.facade.replace(/-/g, " ").toUpperCase(),
    },
    {
      x: 890,
      y: 410,
      label: spec.garage.replace(/-/g, " ").toUpperCase(),
    },
  ];

  ctx.font = "500 10px 'JetBrains Mono', monospace";
  for (const c of callouts) {
    const cw = ctx.measureText(c.label).width + 20;
    ctx.fillStyle = "rgba(10, 13, 17, 0.82)";
    ctx.strokeStyle = "rgba(201, 161, 90, 0.65)";
    ctx.beginPath();
    ctx.roundRect(c.x - cw / 2, c.y - 12, cw, 22, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#F6F1E7";
    ctx.fillText(c.label, c.x - cw / 2 + 10, c.y + 3);
  }
  ctx.restore();
}
