import { createRequire } from "node:module";
import path from "node:path";
import * as ort from "onnxruntime-node";
//#region node_modules/.nitro/vite/services/ssr/assets/detector-DPdROK37.js
var jpeg = createRequire(import.meta.url)("jpeg-js");
var NAMES = [
	"person",
	"bicycle",
	"car",
	"motorcycle",
	"airplane",
	"bus",
	"train",
	"truck",
	"boat",
	"traffic light",
	"fire hydrant",
	"stop sign",
	"parking meter",
	"bench",
	"bird",
	"cat",
	"dog",
	"horse",
	"sheep",
	"cow",
	"elephant",
	"bear",
	"zebra",
	"giraffe",
	"backpack",
	"umbrella",
	"handbag",
	"tie",
	"suitcase",
	"frisbee",
	"skis",
	"snowboard",
	"sports ball",
	"kite",
	"baseball bat",
	"baseball glove",
	"skateboard",
	"surfboard",
	"tennis racket",
	"bottle",
	"wine glass",
	"cup",
	"fork",
	"knife",
	"spoon",
	"bowl",
	"banana",
	"apple",
	"sandwich",
	"orange",
	"broccoli",
	"carrot",
	"hot dog",
	"pizza",
	"donut",
	"cake",
	"chair",
	"couch",
	"potted plant",
	"bed",
	"dining table",
	"toilet",
	"tv",
	"laptop",
	"mouse",
	"remote",
	"keyboard",
	"cell phone",
	"microwave",
	"oven",
	"toaster",
	"sink",
	"refrigerator",
	"book",
	"clock",
	"vase",
	"scissors",
	"teddy bear",
	"hair drier",
	"toothbrush"
];
var SIZE = 640;
var ANCHORS = 8400;
var sessionPromise = null;
var GRID = (() => {
	const gx = new Int16Array(ANCHORS);
	const gy = new Int16Array(ANCHORS);
	const stride = new Int16Array(ANCHORS);
	let index = 0;
	for (const step of [
		8,
		16,
		32
	]) {
		const cells = SIZE / step;
		for (let y = 0; y < cells; y += 1) for (let x = 0; x < cells; x += 1) {
			gx[index] = x;
			gy[index] = y;
			stride[index] = step;
			index += 1;
		}
	}
	return {
		gx,
		gy,
		stride
	};
})();
function session() {
	sessionPromise ??= ort.InferenceSession.create(path.join(process.cwd(), "models", "yolox_s.onnx"));
	return sessionPromise;
}
function iou(a, b) {
	const x1 = Math.max(a.x1, b.x1);
	const y1 = Math.max(a.y1, b.y1);
	const x2 = Math.min(a.x2, b.x2);
	const y2 = Math.min(a.y2, b.y2);
	const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
	const area = (a.x2 - a.x1) * (a.y2 - a.y1) + (b.x2 - b.x1) * (b.y2 - b.y1) - inter;
	return area > 0 ? inter / area : 0;
}
function letterbox(rgba, width, height) {
	const scale = Math.min(SIZE / width, SIZE / height);
	const nw = Math.max(1, Math.round(width * scale));
	const nh = Math.max(1, Math.round(height * scale));
	const input = new Float32Array(3 * SIZE * SIZE);
	input.fill(114);
	for (let y = 0; y < nh; y += 1) {
		const sy = Math.min(height - 1, Math.round((y + .5) / scale - .5));
		for (let x = 0; x < nw; x += 1) {
			const sx = Math.min(width - 1, Math.round((x + .5) / scale - .5));
			const si = (sy * width + sx) * 4;
			const di = y * SIZE + x;
			input[di] = rgba[si + 2];
			input[SIZE * SIZE + di] = rgba[si + 1];
			input[2 * SIZE * SIZE + di] = rgba[si];
		}
	}
	return {
		input,
		scale
	};
}
async function detectObjects(dataUrl) {
	const comma = dataUrl.indexOf(",");
	if (comma < 0 || !dataUrl.startsWith("data:image/jpeg")) return [];
	const raw = jpeg.decode(Buffer.from(dataUrl.slice(comma + 1), "base64"), {
		useTArray: true,
		formatAsRGBA: true
	});
	if (!raw.width || !raw.height) return [];
	const { input, scale } = letterbox(raw.data, raw.width, raw.height);
	const model = await session();
	const tensor = new ort.Tensor("float32", input, [
		1,
		3,
		SIZE,
		SIZE
	]);
	const pred = (await model.run({ images: tensor })).output.data;
	const candidates = [];
	for (let i = 0; i < ANCHORS; i += 1) {
		const base = i * 85;
		const objectness = pred[base + 4];
		if (objectness < .4) continue;
		let best = 0;
		let bestClass = 0;
		for (let c = 0; c < 80; c += 1) {
			const score = objectness * pred[base + 5 + c];
			if (score > best) {
				best = score;
				bestClass = c;
			}
		}
		if (best < .45) continue;
		const step = GRID.stride[i];
		const cx = (pred[base] + GRID.gx[i]) * step;
		const cy = (pred[base + 1] + GRID.gy[i]) * step;
		const bw = Math.exp(Math.min(8, pred[base + 2])) * step;
		const bh = Math.exp(Math.min(8, pred[base + 3])) * step;
		const x1 = Math.max(0, Math.min(raw.width, (cx - bw / 2) / scale));
		const y1 = Math.max(0, Math.min(raw.height, (cy - bh / 2) / scale));
		const x2 = Math.max(0, Math.min(raw.width, (cx + bw / 2) / scale));
		const y2 = Math.max(0, Math.min(raw.height, (cy + bh / 2) / scale));
		if (x2 - x1 < 4 || y2 - y1 < 4) continue;
		candidates.push({
			score: best,
			label: NAMES[bestClass] || "object",
			x1,
			y1,
			x2,
			y2
		});
	}
	candidates.sort((a, b) => b.score - a.score);
	const picked = [];
	for (const candidate of candidates) {
		if (picked.every((kept) => iou(candidate, kept) < .45)) picked.push(candidate);
		if (picked.length >= 6) break;
	}
	return picked.map((box, index) => ({
		id: index + 1,
		label: box.label,
		score: Math.round(box.score * 100) / 100,
		x: box.x1 / raw.width * 100,
		y: box.y1 / raw.height * 100,
		w: (box.x2 - box.x1) / raw.width * 100,
		h: (box.y2 - box.y1) / raw.height * 100
	}));
}
//#endregion
export { detectObjects };
