import { createServerFn } from "@tanstack/react-start";

export type Finding = {
  id: number;
  title: string;
  type: string;
  confidence: "High" | "Medium" | "Low";
  x: number;
  y: number;
  color: "cyan" | "gold" | "violet";
  detail: string;
  evidence: string;
  score: number;
  source: string;
};

type AnalyzeInput = {
  assetName: string;
  location: string;
  prompt: string;
  imageDataUrl: string;
};

type RenderInput = AnalyzeInput & {
  direction: string;
  directionNote: string;
  editInstruction?: string;
  editZone?: string;
};

const COLORS = ["gold", "cyan", "violet"] as const;

function clip(value: unknown, max: number) {
  return typeof value === "string" ? value.slice(0, max).trim() : "";
}

function readAnalyze(input: unknown): AnalyzeInput {
  if (!input || typeof input !== "object") throw new Error("Invalid request");
  const raw = input as Record<string, unknown>;
  const imageDataUrl = clip(raw.imageDataUrl, 4_500_000);
  if (imageDataUrl && !imageDataUrl.startsWith("data:image/")) {
    throw new Error("That file is not a supported image.");
  }
  if (imageDataUrl.length > 4_000_000) {
    throw new Error("Image is too large. Try a smaller photo.");
  }
  return {
    assetName: clip(raw.assetName, 160),
    location: clip(raw.location, 160),
    prompt: clip(raw.prompt, 2000),
    imageDataUrl,
  };
}

function readRender(input: unknown): RenderInput {
  const base = readAnalyze(input);
  const raw = input as Record<string, unknown>;
  return {
    ...base,
    direction: clip(raw.direction, 160),
    directionNote: clip(raw.directionNote, 600),
    editInstruction: clip(raw.editInstruction, 600),
    editZone: clip(raw.editZone, 80),
  };
}

async function xai(path: string, body: unknown) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return { ok: false as const, status: 0, json: null, error: "Local Loupe architectural synthesizer active." };
  }
  const res = await fetch(`https://api.x.ai${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(90_000),
  });
  const json = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
  if (!res.ok) {
    return {
      ok: false as const,
      status: res.status,
      json,
      error: json?.error?.message || `xAI API error ${res.status}`,
    };
  }
  return { ok: true as const, status: res.status, json, error: "" };
}

function findingsFromText(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("The model did not return findings.");
  const parsed = JSON.parse(text.slice(start, end + 1)) as { findings?: unknown; summary?: unknown };
  if (!Array.isArray(parsed.findings) || parsed.findings.length === 0) {
    throw new Error("The model did not return findings.");
  }
  const findings = parsed.findings.slice(0, 4).map((item, index) => {
    const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    const confidence: Finding["confidence"] =
      row.confidence === "High" || row.confidence === "Low" ? row.confidence : "Medium";
    const x = typeof row.x === "number" ? row.x : Number(row.x);
    const y = typeof row.y === "number" ? row.y : Number(row.y);
    const rawScore = typeof row.score === "number" ? row.score : Number(row.score);
    const score = Number.isFinite(rawScore)
      ? Math.min(1, Math.max(0, rawScore))
      : confidence === "High"
        ? 0.86
        : confidence === "Low"
          ? 0.44
          : 0.68;
    return {
      id: index + 1,
      title: clip(row.title, 80) || `Residential observation ${index + 1}`,
      type: clip(row.type, 80) || "Architectural envelope",
      confidence,
      x: Number.isFinite(x) ? Math.min(92, Math.max(8, x)) : 28 + index * 20,
      y: Number.isFinite(y) ? Math.min(88, Math.max(12, y)) : 38,
      color: COLORS[index % COLORS.length],
      detail: clip(row.detail, 420) || "No detail returned.",
      evidence: clip(row.evidence, 280) || "Machine observation from supplied residential elevation.",
      score,
      source: "the-loupe",
    };
  });
  return { findings, summary: clip(parsed.summary, 420) };
}

function imageDataFrom(json: unknown) {
  if (!json || typeof json !== "object") return "";
  const item = (json as { data?: Array<{ b64_json?: string; url?: string; mime_type?: string }> }).data?.[0];
  if (!item) return "";
  if (item.b64_json) {
    const mime = item.mime_type?.startsWith("image/") ? item.mime_type : "image/jpeg";
    return `data:${mime};base64,${item.b64_json}`;
  }
  return item.url || "";
}

export type Detection = {
  id: number;
  label: string;
  score: number;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type TextHit = {
  id: number;
  text: string;
  score: number;
  x: number;
  y: number;
  w: number;
  h: number;
};

export const apiStatus = createServerFn({ method: "GET" }).handler(async () => {
  return { available: Boolean(process.env.XAI_API_KEY) };
});

export const analyzeDiscovery = createServerFn({ method: "POST" })
  .validator(readAnalyze)
  .handler(async ({ data }) => {
    const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      {
        type: "text",
        text: `You are The Loupe, FACET's residential property intelligence engine. Return only JSON: {"summary":"","findings":[{"title":"","type":"","confidence":"High"|"Medium"|"Low","score":0.0,"x":0,"y":0,"detail":"","evidence":""}]}. Give 3 or 4 residential architectural findings (roofing envelope, facade & cladding, fenestration/windows, entryway/garage, hardscape/drainage). score is 0 to 1. x and y are percentages (8-92) of where the observation sits on the home. Do not invent measurements, costs, valuations, structural diagnoses, or legal conclusions. Separate what is visible from what requires on-site field inspection.
Residence: ${data.assetName || "Single-family residence"}
Location: ${data.location || "Not specified"}
Objective: ${data.prompt || "Assess residential curb appeal, roof condition, and exterior renovation opportunities."}
${data.imageDataUrl ? "A residential photograph is attached. Ground every finding in that photograph." : "No photograph was attached. Base findings on the written residential description and note that they are not from a photograph."}`,
      },
    ];
    if (data.imageDataUrl) {
      content.push({ type: "image_url", image_url: { url: data.imageDataUrl } });
    }
    const detected = data.imageDataUrl
      ? import("./detector")
          .then((mod) => mod.detectObjects(data.imageDataUrl))
          .catch(() => [] as Detection[])
      : Promise.resolve([] as Detection[]);
    const transcribed = data.imageDataUrl
      ? import("./ocr")
          .then((mod) => mod.readText(data.imageDataUrl))
          .catch(() => [] as TextHit[])
      : Promise.resolve([] as TextHit[]);
    const result = await xai("/v1/chat/completions", {
      model: "grok-4.5",
      max_tokens: 1100,
      messages: [{ role: "user", content }],
    });
    const [detections, textHits] = await Promise.all([detected, transcribed]);
    if (!result.ok) {
      return {
        ok: false as const,
        error: result.error,
        findings: [] as Finding[],
        summary: "",
        detections,
        textHits,
      };
    }
    const text =
      (result.json as { choices?: Array<{ message?: { content?: string } }> } | null)?.choices?.[0]?.message
        ?.content || "";
    try {
      const parsed = findingsFromText(text);
      return {
        ok: true as const,
        error: "",
        findings: parsed.findings,
        summary: parsed.summary,
        detections,
        textHits,
      };
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : "The model did not return findings.",
        findings: [] as Finding[],
        summary: "",
        detections,
        textHits,
      };
    }
  });

export const renderConcept = createServerFn({ method: "POST" })
  .validator(readRender)
  .handler(async ({ data }) => {
    const editClause = data.editInstruction
      ? `Targeted AI Edit (${data.editZone || "entire home"}): ${data.editInstruction}.`
      : "";
    const prompt = `Photorealistic architectural exterior photograph of a single-family residence (${data.assetName || "residential home"})${data.location ? ` in ${data.location}` : ""}. Residential upgrade specification: ${data.direction}. ${data.directionNote}. ${editClause} ${data.prompt}. Keep believable residential proportions, magazine-grade architectural photography, natural landscaping, no text or watermarks.`;
    const imageBody = {
      model: "grok-imagine-image",
      prompt,
      n: 1,
      aspect_ratio: "16:9",
      resolution: "1k",
      response_format: "b64_json",
    };
    let result = data.imageDataUrl
      ? await xai("/v1/images/edits", {
          ...imageBody,
          image: { url: data.imageDataUrl, type: "image_url" },
        })
      : await xai("/v1/images/generations", imageBody);
    if (!result.ok && data.imageDataUrl && result.status >= 400 && result.status < 500) {
      result = await xai("/v1/images/generations", imageBody);
    }
    if (!result.ok) return { ok: false as const, error: result.error, dataUrl: "" };
    const dataUrl = imageDataFrom(result.json);
    if (!dataUrl) return { ok: false as const, error: "The image service returned no picture.", dataUrl: "" };
    return { ok: true as const, error: "", dataUrl };
  });
