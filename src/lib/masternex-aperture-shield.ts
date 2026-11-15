import crypto from "node:crypto";

/**
 * MASTERNEX.os Shield for APERTURE Vision Pipeline
 *
 * Implements:
 * 1. IronClaw Visual Prompt & OCR Firewall:
 *    - Screens OCR transcriptions (`TextHit[]`) and user visual prompts against
 *      indirect prompt injection, instruction override, and data exfiltration vectors.
 * 2. Zero-PII Cryptographic Redaction Engine:
 *    - Automatically detects and redacts sensitive text (SSN, credit card, email, phone,
 *      license plate patterns) and sensitive visual regions (`person` bounding boxes)
 *      into salted SHA-256 cryptographic commitments with a Merkle audit receipt.
 * 3. KDA Continuous-Time Kalman Bounding Box Tracker:
 *    - Smooths raw ONNX YOLOX bounding boxes (`Detection[]`) across variable camera
 *      frame intervals `dtSeconds` with continuous-time state-space velocity estimation.
 */

export type ApertureDetection = {
  id: number;
  label: string;
  score: number;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type ApertureTextHit = {
  id: number;
  text: string;
  score: number;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type FirewallResult = {
  allowed: boolean;
  sanitizedText: string;
  threatsDetected: string[];
  riskScore: number;
};

export type RedactedScenePackage = {
  engine: string;
  timestamp: string;
  firewall: FirewallResult;
  redactedTextHits: Array<
    ApertureTextHit & {
      redacted: boolean;
      piiTypes: string[];
      originalCommitmentHash?: string;
    }
  >;
  redactedDetections: Array<
    ApertureDetection & {
      privacyMaskApplied: boolean;
      regionCommitmentHash: string;
    }
  >;
  merkleRootHash: string;
  auditReceiptHash: string;
};

const INJECTION_PATTERNS: Array<{ name: string; regex: RegExp; weight: number }> = [
  {
    name: "SYSTEM_OVERRIDE_DIRECTIVE",
    regex: /\b(ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)|disregard\s+system\s+prompt|you\s+are\s+now\s+in\s+developer\s+mode)\b/i,
    weight: 0.9
  },
  {
    name: "SECRET_EXFILTRATION_ATTEMPT",
    regex: /\b(print|output|reveal|leak|exfiltrate|send)\s+(the\s+)?(api[_\s-]?key|xai_api_key|secret|env|environment\s+variables|system\s+prompt|credentials)\b/i,
    weight: 0.95
  },
  {
    name: "MARKDOWN_IMAGE_EXFILTRATION",
    regex: /!\[[^\]]*\]\(https?:\/\/[^)]+\)/i,
    weight: 0.85
  },
  {
    name: "ROLE_HIJACK_TAG",
    regex: /(<\s*\/?\s*(system|assistant|developer|tool_call)\s*>|\[\s*SYSTEM\s*:\s*)/i,
    weight: 0.8
  }
];

const PII_PATTERNS: Array<{ type: string; regex: RegExp; replacement: string }> = [
  {
    type: "SSN",
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: "[REDACTED:SSN]"
  },
  {
    type: "EMAIL",
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    replacement: "[REDACTED:EMAIL]"
  },
  {
    type: "PHONE",
    regex: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g,
    replacement: "[REDACTED:PHONE]"
  },
  {
    type: "PAYMENT_CARD",
    regex: /\b(?:\d[ -]*?){13,16}\b/g,
    replacement: "[REDACTED:CARD]"
  },
  {
    type: "LICENSE_PLATE",
    regex: /\b[A-Z]{2,3}[-\s]?\d{3,4}[A-Z]?\b/g,
    replacement: "[REDACTED:PLATE]"
  }
];

export function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * IronClaw Visual Prompt & OCR Firewall
 * Screens user prompts and scene OCR text against indirect visual prompt injection.
 */
export function screenVisualPromptAndOcr(
  userPrompt: string,
  ocrHits: ApertureTextHit[] = []
): FirewallResult {
  const threatsDetected: string[] = [];
  let riskScore = 0;

  const combinedCorpus = [
    userPrompt || "",
    ...ocrHits.map((h) => h.text || "")
  ].join("\n");

  let sanitizedText = userPrompt || "";

  for (const rule of INJECTION_PATTERNS) {
    if (rule.regex.test(combinedCorpus)) {
      threatsDetected.push(rule.name);
      riskScore = Math.min(1.0, Number((riskScore + rule.weight).toFixed(3)));
      sanitizedText = sanitizedText.replace(
        new RegExp(rule.regex.source, "gi"),
        "[BLOCKED_BY_IRONCLAW]"
      );
    }
  }

  return {
    allowed: threatsDetected.length === 0,
    sanitizedText,
    threatsDetected,
    riskScore
  };
}

/**
 * Zero-PII Cryptographic Redaction Engine
 * Redacts PII in OCR text hits and flags biometric/identity regions (`person`)
 * with salted SHA-256 commitments and a binary Merkle root.
 */
export function redactSceneZeroPii(
  userPrompt: string,
  detections: ApertureDetection[] = [],
  textHits: ApertureTextHit[] = [],
  salt = "MASTERNEX-APERTURE-ZERO-PII-V1"
): RedactedScenePackage {
  const firewall = screenVisualPromptAndOcr(userPrompt, textHits);
  const leafHashes: string[] = [];

  const redactedTextHits = textHits.map((hit) => {
    let text = hit.text || "";
    const piiTypes: string[] = [];

    // Neutralize any indirect prompt injection inside scene text as well
    for (const rule of INJECTION_PATTERNS) {
      if (rule.regex.test(text)) {
        piiTypes.push(`INJECTION:${rule.name}`);
        text = text.replace(new RegExp(rule.regex.source, "gi"), "[BLOCKED_OCR_INJECTION]");
      }
    }

    for (const pii of PII_PATTERNS) {
      const matcher = new RegExp(pii.regex.source, "g");
      if (matcher.test(text)) {
        piiTypes.push(pii.type);
        text = text.replace(new RegExp(pii.regex.source, "g"), pii.replacement);
      }
    }

    const redacted = piiTypes.length > 0;
    const originalCommitmentHash = sha256Hex(`${salt}:OCR:${hit.id}:${hit.text}`);
    leafHashes.push(originalCommitmentHash);

    return {
      ...hit,
      text,
      redacted,
      piiTypes,
      originalCommitmentHash
    };
  });

  const sensitiveLabels = new Set(["person", "car", "truck", "bus", "motorcycle"]);
  const redactedDetections = detections.map((det) => {
    const privacyMaskApplied = sensitiveLabels.has(det.label.toLowerCase());
    const regionCommitmentHash = sha256Hex(
      `${salt}:DET:${det.id}:${det.label}:${det.x}:${det.y}:${det.w}:${det.h}`
    );
    leafHashes.push(regionCommitmentHash);

    return {
      ...det,
      privacyMaskApplied,
      regionCommitmentHash
    };
  });

  // Compute Merkle root over all commitments
  let currentLayer =
    leafHashes.length > 0 ? leafHashes : [sha256Hex(`${salt}:EMPTY_SCENE`)];
  while (currentLayer.length > 1) {
    const nextLayer: string[] = [];
    for (let i = 0; i < currentLayer.length; i += 2) {
      const left = currentLayer[i];
      const right = i + 1 < currentLayer.length ? currentLayer[i + 1] : left;
      nextLayer.push(sha256Hex(`NODE:${left}:${right}`));
    }
    currentLayer = nextLayer;
  }

  const merkleRootHash = currentLayer[0];
  const timestamp = new Date().toISOString();
  const auditReceiptHash = sha256Hex(
    JSON.stringify({
      merkleRootHash,
      allowed: firewall.allowed,
      threatsDetected: firewall.threatsDetected,
      redactedCount: redactedTextHits.filter((t) => t.redacted).length,
      maskedObjects: redactedDetections.filter((d) => d.privacyMaskApplied).length
    })
  );

  return {
    engine: "MASTERNEX-IronClaw-ZeroPII-v1",
    timestamp,
    firewall,
    redactedTextHits,
    redactedDetections,
    merkleRootHash,
    auditReceiptHash
  };
}

type TrackState = {
  trackId: number;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  score: number;
  uncertainty: number;
  ageFrames: number;
  missedFrames: number;
};

function boxIoU(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
): number {
  const ax2 = a.x + a.w;
  const ay2 = a.y + a.h;
  const bx2 = b.x + b.w;
  const by2 = b.y + b.h;
  const ix1 = Math.max(a.x, b.x);
  const iy1 = Math.max(a.y, b.y);
  const ix2 = Math.min(ax2, bx2);
  const iy2 = Math.min(ay2, by2);
  const inter = Math.max(0, ix2 - ix1) * Math.max(0, iy2 - iy1);
  const union = a.w * a.h + b.w * b.h - inter;
  return union > 0 ? inter / union : 0;
}

/**
 * KDA Continuous-Time Kalman Trajectory Tracker for YOLOX Detections
 * Smooths jittery frame-by-frame bounding boxes and estimates object velocity (vx, vy)
 * across variable frame intervals `dtSeconds`.
 */
export class MasternexKdaObjectTracker {
  private tracks: Map<number, TrackState>;
  private nextTrackId: number;
  private iouMatchThreshold: number;

  constructor(options?: { iouMatchThreshold?: number }) {
    this.tracks = new Map();
    this.nextTrackId = 1;
    this.iouMatchThreshold = options?.iouMatchThreshold ?? 0.25;
  }

  updateFrame(
    detections: ApertureDetection[],
    dtSeconds = 1 / 15
  ): Array<ApertureDetection & { trackId: number; vx: number; vy: number; ageFrames: number }> {
    const dt = Math.max(0.005, Math.min(5.0, Number(dtSeconds) || 1 / 15));
    const velocityDecay = Math.exp(-dt / 1.5); // Continuous-time KDA momentum decay

    // 1. Predict step for existing tracks
    for (const track of this.tracks.values()) {
      track.x = Number((track.x + track.vx * dt).toFixed(2));
      track.y = Number((track.y + track.vy * dt).toFixed(2));
      track.vx = Number((track.vx * velocityDecay).toFixed(3));
      track.vy = Number((track.vy * velocityDecay).toFixed(3));
      track.uncertainty = Math.min(10.0, track.uncertainty + 0.35 * dt);
      track.missedFrames += 1;
    }

    const unmatchedDetections = new Set<number>(detections.map((_, idx) => idx));
    const activeOutputs: Array<
      ApertureDetection & { trackId: number; vx: number; vy: number; ageFrames: number }
    > = [];

    // 2. Greedy IoU + label association
    for (const track of this.tracks.values()) {
      let bestDetIdx = -1;
      let bestScore = this.iouMatchThreshold;

      for (const detIdx of unmatchedDetections) {
        const det = detections[detIdx];
        if (det.label !== track.label) continue;
        const overlap = boxIoU(track, det);
        if (overlap > bestScore) {
          bestScore = overlap;
          bestDetIdx = detIdx;
        }
      }

      if (bestDetIdx >= 0) {
        unmatchedDetections.delete(bestDetIdx);
        const det = detections[bestDetIdx];
        const measNoise = Math.max(0.15, 1.0 - det.score);
        const kalmanGain = track.uncertainty / (track.uncertainty + measNoise);

        const residualX = det.x - track.x;
        const residualY = det.y - track.y;

        track.x = Number((track.x + kalmanGain * residualX).toFixed(2));
        track.y = Number((track.y + kalmanGain * residualY).toFixed(2));
        track.w = Number((track.w + kalmanGain * (det.w - track.w)).toFixed(2));
        track.h = Number((track.h + kalmanGain * (det.h - track.h)).toFixed(2));
        track.vx = Number((0.6 * track.vx + 0.4 * (residualX / dt)).toFixed(3));
        track.vy = Number((0.6 * track.vy + 0.4 * (residualY / dt)).toFixed(3));
        track.score = Number(Math.min(0.99, 0.4 * track.score + 0.6 * det.score).toFixed(3));
        track.uncertainty = (1 - kalmanGain) * track.uncertainty;
        track.ageFrames += 1;
        track.missedFrames = 0;

        activeOutputs.push({
          id: det.id,
          trackId: track.trackId,
          label: track.label,
          score: track.score,
          x: track.x,
          y: track.y,
          w: track.w,
          h: track.h,
          vx: track.vx,
          vy: track.vy,
          ageFrames: track.ageFrames
        });
      }
    }

    // 3. Spawn new tracks for unmatched detections
    for (const detIdx of unmatchedDetections) {
      const det = detections[detIdx];
      const trackId = this.nextTrackId++;
      const newTrack: TrackState = {
        trackId,
        label: det.label,
        x: det.x,
        y: det.y,
        w: det.w,
        h: det.h,
        vx: 0,
        vy: 0,
        score: det.score,
        uncertainty: 0.5,
        ageFrames: 1,
        missedFrames: 0
      };
      this.tracks.set(trackId, newTrack);
      activeOutputs.push({
        id: det.id,
        trackId,
        label: det.label,
        score: det.score,
        x: det.x,
        y: det.y,
        w: det.w,
        h: det.h,
        vx: 0,
        vy: 0,
        ageFrames: 1
      });
    }

    // 4. Prune stale tracks missed > 5 frames
    for (const [trackId, track] of this.tracks.entries()) {
      if (track.missedFrames > 5) {
        this.tracks.delete(trackId);
      }
    }

    return activeOutputs;
  }
}
