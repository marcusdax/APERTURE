import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/aperture.functions-C1X0pSGx.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var COLORS = [
	"cyan",
	"gold",
	"violet"
];
function clip(value, max) {
	return typeof value === "string" ? value.slice(0, max).trim() : "";
}
function readAnalyze(input) {
	if (!input || typeof input !== "object") throw new Error("Invalid request");
	const raw = input;
	const imageDataUrl = clip(raw.imageDataUrl, 45e5);
	if (imageDataUrl && !imageDataUrl.startsWith("data:image/")) throw new Error("That file is not a supported image.");
	if (imageDataUrl.length > 4e6) throw new Error("Image is too large. Try a smaller photo.");
	return {
		assetName: clip(raw.assetName, 160),
		location: clip(raw.location, 160),
		prompt: clip(raw.prompt, 2e3),
		imageDataUrl
	};
}
function readRender(input) {
	const base = readAnalyze(input);
	const raw = input;
	return {
		...base,
		direction: clip(raw.direction, 80),
		directionNote: clip(raw.directionNote, 240)
	};
}
async function xai(path, body) {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		status: 0,
		json: null,
		error: "AI is not available in this environment."
	};
	const res = await fetch(`https://api.x.ai${path}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify(body),
		signal: AbortSignal.timeout(9e4)
	});
	const json = await res.json().catch(() => null);
	if (!res.ok) return {
		ok: false,
		status: res.status,
		json,
		error: json?.error?.message || `xAI API error ${res.status}`
	};
	return {
		ok: true,
		status: res.status,
		json,
		error: ""
	};
}
function findingsFromText(text) {
	const start = text.indexOf("{");
	const end = text.lastIndexOf("}");
	if (start < 0 || end <= start) throw new Error("The model did not return findings.");
	const parsed = JSON.parse(text.slice(start, end + 1));
	if (!Array.isArray(parsed.findings) || parsed.findings.length === 0) throw new Error("The model did not return findings.");
	return {
		findings: parsed.findings.slice(0, 4).map((item, index) => {
			const row = item && typeof item === "object" ? item : {};
			const confidence = row.confidence === "High" || row.confidence === "Low" ? row.confidence : "Medium";
			const x = typeof row.x === "number" ? row.x : Number(row.x);
			const y = typeof row.y === "number" ? row.y : Number(row.y);
			const rawScore = typeof row.score === "number" ? row.score : Number(row.score);
			const score = Number.isFinite(rawScore) ? Math.min(1, Math.max(0, rawScore)) : confidence === "High" ? .82 : confidence === "Low" ? .4 : .62;
			return {
				id: index + 1,
				title: clip(row.title, 80) || `Observation ${index + 1}`,
				type: clip(row.type, 80) || "Visual observation",
				confidence,
				x: Number.isFinite(x) ? Math.min(92, Math.max(8, x)) : 30 + index * 18,
				y: Number.isFinite(y) ? Math.min(88, Math.max(12, y)) : 40,
				color: COLORS[index % COLORS.length],
				detail: clip(row.detail, 420) || "No detail returned.",
				evidence: clip(row.evidence, 280) || "Visible in the supplied image. Not independently verified.",
				score,
				source: "grok-4.5"
			};
		}),
		summary: clip(parsed.summary, 420)
	};
}
function imageDataFrom(json) {
	if (!json || typeof json !== "object") return "";
	const item = json.data?.[0];
	if (!item) return "";
	if (item.b64_json) return `data:${item.mime_type?.startsWith("image/") ? item.mime_type : "image/jpeg"};base64,${item.b64_json}`;
	return item.url || "";
}
var apiStatus_createServerFn_handler = createServerRpc({
	id: "955792561171df18c8e6d43fa2a240a81a6a9ac440143c74b9ea3ca66d023677",
	name: "apiStatus",
	filename: "src/lib/aperture.functions.ts"
}, (opts) => apiStatus.__executeServer(opts));
var apiStatus = createServerFn({ method: "GET" }).handler(apiStatus_createServerFn_handler, async () => {
	return { available: Boolean(process.env.XAI_API_KEY) };
});
var analyzeDiscovery_createServerFn_handler = createServerRpc({
	id: "3628bb27b306df6c3386667b732072ea0fe152c19ede4ee63de45c7bdc641dac",
	name: "analyzeDiscovery",
	filename: "src/lib/aperture.functions.ts"
}, (opts) => analyzeDiscovery.__executeServer(opts));
var analyzeDiscovery = createServerFn({ method: "POST" }).validator(readAnalyze).handler(analyzeDiscovery_createServerFn_handler, async ({ data }) => {
	const content = [{
		type: "text",
		text: `You are APERTURE, a careful visual analyst. Return only JSON: {"summary":"","findings":[{"title":"","type":"","confidence":"High"|"Medium"|"Low","score":0.0,"x":0,"y":0,"detail":"","evidence":""}]}. Give 3 or 4 findings. score is 0 to 1. x and y are percentages (8-92) of where the observation sits. Include visible text, objects, and conditions only when they are actually in the frame. evidence must say what in the image supports the finding. Do not invent measurements, costs, valuations, structural diagnoses, or legal conclusions. Separate what is visible from what needs a site visit.
Asset: ${data.assetName || "Untitled"}
Location: ${data.location || "Not specified"}
Question: ${data.prompt || "What is worth investigating in this scene?"}
${data.imageDataUrl ? "An image is attached. Ground every finding in that image." : "No image was attached. Base findings on the written scene and say that they are not from a photograph."}`
	}];
	if (data.imageDataUrl) content.push({
		type: "image_url",
		image_url: { url: data.imageDataUrl }
	});
	const detected = data.imageDataUrl ? import("./detector-DPdROK37.mjs").then((mod) => mod.detectObjects(data.imageDataUrl)).catch(() => []) : Promise.resolve([]);
	const transcribed = data.imageDataUrl ? import("./ocr-C8ZLrcKN.mjs").then((mod) => mod.readText(data.imageDataUrl)).catch(() => []) : Promise.resolve([]);
	const result = await xai("/v1/chat/completions", {
		model: "grok-4.5",
		max_tokens: 1100,
		messages: [{
			role: "user",
			content
		}]
	});
	const [detections, textHits] = await Promise.all([detected, transcribed]);
	if (!result.ok) return {
		ok: false,
		error: result.error,
		findings: [],
		summary: "",
		detections,
		textHits
	};
	const text = result.json?.choices?.[0]?.message?.content || "";
	try {
		const parsed = findingsFromText(text);
		return {
			ok: true,
			error: "",
			findings: parsed.findings,
			summary: parsed.summary,
			detections,
			textHits
		};
	} catch (error) {
		return {
			ok: false,
			error: error instanceof Error ? error.message : "The model did not return findings.",
			findings: [],
			summary: "",
			detections,
			textHits
		};
	}
});
var renderConcept_createServerFn_handler = createServerRpc({
	id: "2d1e7a8e15b79632ce97d1182c131b4086a4e78b0563fc6785e9b402273e64cb",
	name: "renderConcept",
	filename: "src/lib/aperture.functions.ts"
}, (opts) => renderConcept.__executeServer(opts));
var renderConcept = createServerFn({ method: "POST" }).validator(readRender).handler(renderConcept_createServerFn_handler, async ({ data }) => {
	const imageBody = {
		model: "grok-imagine-image",
		prompt: `Photorealistic wide architectural photograph of ${data.assetName || "a commercial property"}${data.location ? ` in ${data.location}` : ""}. Direction: ${data.direction}. ${data.directionNote}. ${data.prompt}. Keep a believable existing building, natural daylight, no people in close-up, no lettering, no watermark, no logo.`,
		n: 1,
		aspect_ratio: "16:9",
		resolution: "1k",
		response_format: "b64_json"
	};
	let result = data.imageDataUrl ? await xai("/v1/images/edits", {
		...imageBody,
		image: {
			url: data.imageDataUrl,
			type: "image_url"
		}
	}) : await xai("/v1/images/generations", imageBody);
	if (!result.ok && data.imageDataUrl && result.status >= 400 && result.status < 500) result = await xai("/v1/images/generations", imageBody);
	if (!result.ok) return {
		ok: false,
		error: result.error,
		dataUrl: ""
	};
	const dataUrl = imageDataFrom(result.json);
	if (!dataUrl) return {
		ok: false,
		error: "The image service returned no picture.",
		dataUrl: ""
	};
	return {
		ok: true,
		error: "",
		dataUrl
	};
});
//#endregion
export { analyzeDiscovery_createServerFn_handler, apiStatus_createServerFn_handler, renderConcept_createServerFn_handler };
