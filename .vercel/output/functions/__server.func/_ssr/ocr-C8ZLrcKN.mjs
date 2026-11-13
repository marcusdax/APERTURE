import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import * as ort from "onnxruntime-node";
//#region node_modules/.nitro/vite/services/ssr/assets/ocr-C8ZLrcKN.js
var jpeg = createRequire(import.meta.url)("jpeg-js");
var CHARS = [
	"",
	...readFileSync(path.join(process.cwd(), "models", "ocr", "latin-dict.txt"), "utf8").split(/\r?\n/).filter((line) => line.length > 0),
	" "
];
var detPromise = null;
var recPromise = null;
function detSession() {
	detPromise ??= ort.InferenceSession.create(path.join(process.cwd(), "models", "ocr", "det.onnx"));
	return detPromise;
}
function recSession() {
	recPromise ??= ort.InferenceSession.create(path.join(process.cwd(), "models", "ocr", "rec-v5.onnx"));
	return recPromise;
}
function sample(data, width, height, x, y) {
	const x0 = Math.max(0, Math.min(width - 1, Math.floor(x)));
	const y0 = Math.max(0, Math.min(height - 1, Math.floor(y)));
	const x1 = Math.min(width - 1, x0 + 1);
	const y1 = Math.min(height - 1, y0 + 1);
	const dx = x - x0;
	const dy = y - y0;
	const at = (px, py) => {
		const i = (py * width + px) * 4;
		return [
			data[i],
			data[i + 1],
			data[i + 2]
		];
	};
	const a = at(x0, y0);
	const b = at(x1, y0);
	const c = at(x0, y1);
	const d = at(x1, y1);
	return [
		0,
		1,
		2
	].map((channel) => {
		const top = a[channel] * (1 - dx) + b[channel] * dx;
		const bottom = c[channel] * (1 - dx) + d[channel] * dx;
		return top * (1 - dy) + bottom * dy;
	});
}
function components(mask, width, height) {
	const seen = new Uint8Array(width * height);
	const boxes = [];
	const stack = [];
	for (let start = 0; start < mask.length; start += 1) {
		if (!mask[start] || seen[start]) continue;
		stack.push(start);
		seen[start] = 1;
		let minX = start % width;
		let maxX = minX;
		let minY = Math.floor(start / width);
		let maxY = minY;
		let count = 0;
		while (stack.length) {
			const index = stack.pop();
			const x = index % width;
			const y = Math.floor(index / width);
			count += 1;
			if (x < minX) minX = x;
			if (x > maxX) maxX = x;
			if (y < minY) minY = y;
			if (y > maxY) maxY = y;
			const neighbors = [
				index - 1,
				index + 1,
				index - width,
				index + width
			];
			for (const next of neighbors) {
				if (next < 0 || next >= mask.length || seen[next] || !mask[next]) continue;
				const nx = next % width;
				if (Math.abs(nx - x) > 1) continue;
				seen[next] = 1;
				stack.push(next);
			}
		}
		if (count >= 10 && maxX - minX > 4 && maxY - minY > 2) boxes.push([
			minX,
			minY,
			maxX,
			maxY
		]);
	}
	boxes.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
	return boxes.slice(0, 8);
}
function ctc(probs, steps, classes) {
	let text = "";
	let prev = -1;
	let total = 0;
	let kept = 0;
	for (let t = 0; t < steps; t += 1) {
		let best = 0;
		let bestAt = 0;
		const base = t * classes;
		for (let c = 0; c < classes; c += 1) {
			const value = probs[base + c];
			if (value > best) {
				best = value;
				bestAt = c;
			}
		}
		if (bestAt === prev) continue;
		prev = bestAt;
		if (bestAt === 0) continue;
		text += CHARS[bestAt] || "";
		total += best;
		kept += 1;
	}
	return {
		text: text.trim(),
		score: kept ? total / kept : 0
	};
}
function readable(text, score) {
	if (score < .72 || text.length < 3 || text.length > 40) return false;
	return [...text].filter((char) => /[A-Za-z0-9]/.test(char)).length / text.length >= .6;
}
async function readText(dataUrl) {
	const comma = dataUrl.indexOf(",");
	if (comma < 0 || !dataUrl.startsWith("data:image/jpeg")) return [];
	const raw = jpeg.decode(Buffer.from(dataUrl.slice(comma + 1), "base64"), {
		useTArray: true,
		formatAsRGBA: true
	});
	if (!raw.width || !raw.height) return [];
	const scale = Math.min(1, 960 / Math.max(raw.width, raw.height));
	const rw = Math.max(8, Math.round(raw.width * scale));
	const rh = Math.max(8, Math.round(raw.height * scale));
	const dw = Math.ceil(rw / 32) * 32;
	const dh = Math.ceil(rh / 32) * 32;
	const detInput = new Float32Array(3 * dw * dh);
	const mean = [
		.485,
		.456,
		.406
	];
	const std = [
		.229,
		.224,
		.225
	];
	for (let y = 0; y < rh; y += 1) for (let x = 0; x < rw; x += 1) {
		const rgb = sample(raw.data, raw.width, raw.height, x / scale, y / scale);
		const di = y * dw + x;
		for (let c = 0; c < 3; c += 1) detInput[c * dw * dh + di] = (rgb[c] / 255 - mean[c]) / std[c];
	}
	const detector = await detSession();
	const detTensor = new ort.Tensor("float32", detInput, [
		1,
		3,
		dh,
		dw
	]);
	const map = (await detector.run({ x: detTensor }))[detector.outputNames[0]].data;
	const mask = new Uint8Array(rw * rh);
	for (let y = 0; y < rh; y += 1) for (let x = 0; x < rw; x += 1) mask[y * rw + x] = map[y * dw + x] > .3 ? 1 : 0;
	const recognizer = await recSession();
	const hits = [];
	for (const [x1, y1, x2, y2] of components(mask, rw, rh)) {
		const padX = Math.max(2, Math.round((x2 - x1) * .08));
		const padY = Math.max(2, Math.round((y2 - y1) * .3));
		const ox1 = Math.max(0, Math.floor((x1 - padX) / scale));
		const oy1 = Math.max(0, Math.floor((y1 - padY) / scale));
		const ox2 = Math.min(raw.width - 1, Math.ceil((x2 + padX) / scale));
		const oy2 = Math.min(raw.height - 1, Math.ceil((y2 + padY) / scale));
		const cropW = ox2 - ox1;
		const cropH = oy2 - oy1;
		if (cropW < 8 || cropH < 6) continue;
		const recH = 48;
		const recW = Math.max(8, Math.min(480, Math.round(cropW * (recH / cropH))));
		const recInput = new Float32Array(144 * recW);
		for (let y = 0; y < recH; y += 1) for (let x = 0; x < recW; x += 1) {
			const rgb = sample(raw.data, raw.width, raw.height, ox1 + x / recW * cropW, oy1 + y / recH * cropH);
			const di = y * recW + x;
			for (let c = 0; c < 3; c += 1) recInput[c * recH * recW + di] = (rgb[c] / 255 - .5) / .5;
		}
		const recTensor = new ort.Tensor("float32", recInput, [
			1,
			3,
			recH,
			recW
		]);
		const tensor = (await recognizer.run({ x: recTensor }))[recognizer.outputNames[0]];
		const probs = tensor.data;
		const steps = tensor.dims[1];
		const classes = tensor.dims[2];
		const { text, score } = ctc(probs, steps, classes);
		if (!readable(text, score)) continue;
		hits.push({
			id: hits.length + 1,
			text,
			score: Math.round(score * 100) / 100,
			x: ox1 / raw.width * 100,
			y: oy1 / raw.height * 100,
			w: cropW / raw.width * 100,
			h: cropH / raw.height * 100
		});
	}
	return hits;
}
//#endregion
export { readText };
