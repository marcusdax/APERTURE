import { i as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, q as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { A as ChevronLeft, C as Ellipsis, D as Clipboard, E as CloudUpload, F as ArrowRight, I as Aperture, M as Check, N as Bell, O as CircleHelp, P as ArrowUpRight, S as FileText, T as Compass, _ as Mail, b as Grid2x2, c as Sparkles, d as Scan, f as Plus, g as MapPin, h as Menu, i as Users, j as ChevronDown, k as ChevronRight, l as ShieldCheck, m as MessageCircle, n as X, o as Trash2, p as Phone, r as WandSparkles, s as Target, t as Zap, u as Settings2, v as Layers, w as Download, x as Focus, y as Image$1 } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CVYk1A-L.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
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
var apiStatus = createServerFn({ method: "GET" }).handler(createSsrRpc("955792561171df18c8e6d43fa2a240a81a6a9ac440143c74b9ea3ca66d023677"));
var analyzeDiscovery = createServerFn({ method: "POST" }).validator(readAnalyze).handler(createSsrRpc("3628bb27b306df6c3386667b732072ea0fe152c19ede4ee63de45c7bdc641dac"));
var renderConcept = createServerFn({ method: "POST" }).validator(readRender).handler(createSsrRpc("2d1e7a8e15b79632ce97d1182c131b4086a4e78b0563fc6785e9b402273e64cb"));
var KEY = "aperture.crm.v1";
var empty = () => ({
	contacts: [],
	campaigns: [],
	deliveries: [],
	automations: []
});
function read() {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return empty();
		const parsed = JSON.parse(raw);
		return {
			contacts: parsed.contacts ?? [],
			campaigns: parsed.campaigns ?? [],
			deliveries: parsed.deliveries ?? [],
			automations: parsed.automations ?? []
		};
	} catch {
		return empty();
	}
}
function write(store) {
	localStorage.setItem(KEY, JSON.stringify(store));
}
function loadCrm() {
	return read();
}
function saveContact(input) {
	const store = read();
	const contact = {
		id: input.id || crypto.randomUUID(),
		name: input.name.trim(),
		organization: input.organization.trim(),
		email: input.email.trim(),
		phone: input.phone.trim(),
		consent: input.consent,
		note: input.note.trim()
	};
	const index = store.contacts.findIndex((item) => item.id === contact.id);
	if (index >= 0) store.contacts[index] = contact;
	else store.contacts.unshift(contact);
	write(store);
	return contact;
}
function removeContact(id) {
	const store = read();
	store.contacts = store.contacts.filter((item) => item.id !== id);
	write(store);
}
function saveCampaign(input) {
	const store = read();
	const existing = store.campaigns.find((item) => item.id === input.id);
	const campaign = {
		id: input.id || crypto.randomUUID(),
		name: input.name.trim(),
		channel: input.channel,
		subject: input.subject.trim(),
		body: input.body.trim(),
		createdAt: existing?.createdAt || (/* @__PURE__ */ new Date()).toISOString()
	};
	const index = store.campaigns.findIndex((item) => item.id === campaign.id);
	if (index >= 0) store.campaigns[index] = campaign;
	else store.campaigns.unshift(campaign);
	write(store);
	return campaign;
}
function reachable(contact, channel) {
	if (contact.consent[channel] !== "in") return false;
	if (channel === "email") return contact.email.includes("@");
	return contact.phone.replace(/\D/g, "").length >= 8;
}
function audience(channel) {
	const store = read();
	const eligible = store.contacts.filter((contact) => reachable(contact, channel));
	return {
		eligible,
		excluded: store.contacts.length - eligible.length,
		total: store.contacts.length
	};
}
function queueCampaign(campaignId) {
	const store = read();
	const campaign = store.campaigns.find((item) => item.id === campaignId);
	if (!campaign) return {
		ok: false,
		message: "That campaign is no longer here."
	};
	if (!campaign.body) return {
		ok: false,
		message: "Add a message before queueing."
	};
	if (campaign.channel === "email" && !campaign.subject) return {
		ok: false,
		message: "Email campaigns need a subject."
	};
	const eligible = store.contacts.filter((contact) => reachable(contact, campaign.channel));
	const excluded = store.contacts.length - eligible.length;
	if (!eligible.length) return {
		ok: false,
		message: `${campaign.name} stayed a draft. No contact has opted in on ${label(campaign.channel)} with an address.`
	};
	store.deliveries.unshift({
		id: crypto.randomUUID(),
		campaignId: campaign.id,
		campaignName: campaign.name,
		channel: campaign.channel,
		at: (/* @__PURE__ */ new Date()).toISOString(),
		recipientIds: eligible.map((contact) => contact.id),
		excluded,
		status: "held"
	});
	write(store);
	return {
		ok: true,
		message: `Queued ${eligible.length} for ${campaign.name}. Held here. Nothing was delivered.`
	};
}
function saveAutomation(input) {
	const store = read();
	const rule = {
		id: input.id || crypto.randomUUID(),
		name: input.name.trim() || "Follow-up",
		enabled: input.enabled,
		trigger: input.trigger,
		campaignId: input.campaignId
	};
	const index = store.automations.findIndex((item) => item.id === rule.id);
	if (index >= 0) store.automations[index] = rule;
	else store.automations.unshift(rule);
	write(store);
	return rule;
}
function setAutomationEnabled(id, enabled) {
	const store = read();
	const rule = store.automations.find((item) => item.id === id);
	if (!rule) return;
	rule.enabled = enabled;
	write(store);
}
function runAutomations(trigger) {
	const rules = read().automations.filter((rule) => rule.enabled && rule.trigger === trigger);
	if (!rules.length) return "";
	return rules.map((rule) => queueCampaign(rule.campaignId).message).join(" ");
}
function label(channel) {
	if (channel === "email") return "email";
	if (channel === "sms") return "text";
	return "WhatsApp";
}
var channels = [
	{
		id: "email",
		label: "Email",
		icon: Mail
	},
	{
		id: "sms",
		label: "Text",
		icon: Phone
	},
	{
		id: "whatsapp",
		label: "WhatsApp",
		icon: MessageCircle
	}
];
var blankConsent = () => ({
	email: "none",
	sms: "none",
	whatsapp: "none"
});
function EngagementDesk({ onNotify }) {
	const [store, setStore] = (0, import_react.useState)(loadCrm);
	const [tab, setTab] = (0, import_react.useState)("people");
	const [contact, setContact] = (0, import_react.useState)({
		name: "",
		organization: "",
		email: "",
		phone: "",
		note: "",
		consent: blankConsent()
	});
	const [draft, setDraft] = (0, import_react.useState)({
		name: "",
		channel: "email",
		subject: "",
		body: ""
	});
	const [rule, setRule] = (0, import_react.useState)({
		name: "Brief follow-up",
		trigger: "brief",
		campaignId: ""
	});
	const refresh = () => setStore(loadCrm());
	const preview = audience(draft.channel);
	const addContact = () => {
		if (!contact.name.trim()) {
			onNotify("A contact needs a name.");
			return;
		}
		saveContact(contact);
		setContact({
			name: "",
			organization: "",
			email: "",
			phone: "",
			note: "",
			consent: blankConsent()
		});
		refresh();
		onNotify("Contact saved. They are not messaged until they opt in and you queue a campaign.");
	};
	const addCampaign = () => {
		if (!draft.name.trim() || !draft.body.trim()) {
			onNotify("A campaign needs a name and a message.");
			return;
		}
		if (draft.channel === "email" && !draft.subject.trim()) {
			onNotify("Email campaigns need a subject.");
			return;
		}
		const saved = saveCampaign(draft);
		setDraft({
			name: "",
			channel: draft.channel,
			subject: "",
			body: ""
		});
		setRule((current) => ({
			...current,
			campaignId: current.campaignId || saved.id
		}));
		refresh();
		onNotify("Campaign saved as a draft. It has not been sent.");
	};
	const queue = (campaign) => {
		const result = queueCampaign(campaign.id);
		refresh();
		onNotify(result.message);
	};
	const addRule = () => {
		if (!rule.campaignId) {
			onNotify("Choose a campaign before turning on an automation.");
			return;
		}
		saveAutomation({
			...rule,
			enabled: true
		});
		refresh();
		onNotify("Automation saved. It queues locally. It does not deliver.");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "crm",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "channel-row",
				children: [channels.map((channel) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "channel-card",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(channel.icon, { size: 15 }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: channel.label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Not connected" })] })]
				}, channel.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { size: 14 }), " Queues stay in this browser. No email, text, or WhatsApp is sent."] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "crm-tabs",
				children: [
					"people",
					"campaigns",
					"automations"
				].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: tab === item ? "on" : "",
					onClick: () => setTab(item),
					children: item
				}, item))
			}),
			tab === "people" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "crm-grid",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "input-panel",
					onSubmit: (event) => {
						event.preventDefault();
						addContact();
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "panel-label",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { size: 14 }), " ADD A CONTACT"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "field-grid",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "field",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "NAME" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: contact.name,
										onChange: (event) => setContact({
											...contact,
											name: event.target.value
										}),
										placeholder: "Jordan Hale"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "field",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "ORGANIZATION" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: contact.organization,
										onChange: (event) => setContact({
											...contact,
											organization: event.target.value
										}),
										placeholder: "Northside retail"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "field",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "EMAIL" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: contact.email,
										onChange: (event) => setContact({
											...contact,
											email: event.target.value
										}),
										placeholder: "name@studio.com"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "field",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "MOBILE" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: contact.phone,
										onChange: (event) => setContact({
											...contact,
											phone: event.target.value
										}),
										placeholder: "+1 817 555 0142"
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "field prompt-field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "NOTE" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								rows: 2,
								value: contact.note,
								onChange: (event) => setContact({
									...contact,
									note: event.target.value
								}),
								placeholder: "How you know them. Not a message."
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "consent-row",
							children: channels.map((channel) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: contact.consent[channel.id] === "in" ? "on" : "",
								onClick: () => setContact({
									...contact,
									consent: {
										...contact.consent,
										[channel.id]: contact.consent[channel.id] === "in" ? "none" : "in"
									}
								}),
								children: [channel.label, " opt-in"]
							}, channel.id))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "panel-footer",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Opt-in is required before a person can be queued." }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								className: "primary-button",
								type: "submit",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 15 }), " Save contact"]
							})]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "crm-list",
					children: [store.contacts.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "crm-empty",
						children: "No contacts yet. Add someone you already have permission to reach."
					}), store.contacts.map((person) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "crm-card",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: person.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [
								person.organization || "No organization",
								" · ",
								person.email || "No email",
								" · ",
								person.phone || "No mobile"
							] })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "chip-row",
								children: channels.map((channel) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: person.consent[channel.id] === "in" ? "in" : "",
									children: [
										label(channel.id),
										" ",
										person.consent[channel.id] === "in" ? "in" : "off"
									]
								}, channel.id))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "icon-button",
								"aria-label": `Remove ${person.name}`,
								onClick: () => {
									removeContact(person.id);
									refresh();
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 14 })
							})
						]
					}, person.id))]
				})]
			}),
			tab === "campaigns" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "crm-grid",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "input-panel",
					onSubmit: (event) => {
						event.preventDefault();
						addCampaign();
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "panel-label",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { size: 14 }), " DRAFT A CAMPAIGN"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "field-grid",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "NAME" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: draft.name,
									onChange: (event) => setDraft({
										...draft,
										name: event.target.value
									}),
									placeholder: "Frontage follow-up"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "CHANNEL" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
									value: draft.channel,
									onChange: (event) => setDraft({
										...draft,
										channel: event.target.value
									}),
									children: channels.map((channel) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: channel.id,
										children: channel.label
									}, channel.id))
								})]
							})]
						}),
						draft.channel === "email" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "field prompt-field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "SUBJECT" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: draft.subject,
								onChange: (event) => setDraft({
									...draft,
									subject: event.target.value
								}),
								placeholder: "What we saw at the site"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "field prompt-field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "MESSAGE" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								rows: 4,
								value: draft.body,
								onChange: (event) => setDraft({
									...draft,
									body: event.target.value
								}),
								placeholder: "Write the note a person would actually receive. Do not invent pricing."
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "audience-note",
							children: [
								preview.eligible.length,
								" of ",
								preview.total,
								" contacts can be queued on ",
								label(draft.channel),
								". ",
								preview.excluded,
								" excluded for missing opt-in or address."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "panel-footer",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Saving does not send." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "primary-button",
								type: "submit",
								children: "Save draft"
							})]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "crm-list",
					children: [
						store.campaigns.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "crm-empty",
							children: "No campaigns yet."
						}),
						store.campaigns.map((campaign) => {
							const held = store.deliveries.filter((delivery) => delivery.campaignId === campaign.id);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
								className: "crm-card",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: campaign.name }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [
										label(campaign.channel),
										" · ",
										campaign.subject || "No subject",
										" · ",
										held.length ? `${held.length} held queue${held.length === 1 ? "" : "s"}` : "Draft"
									] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: campaign.body })
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "outline-button",
									onClick: () => queue(campaign),
									children: "Queue locally"
								})]
							}, campaign.id);
						}),
						store.deliveries.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "held-log",
							children: store.deliveries.slice(0, 6).map((delivery) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "HELD" }),
								" ",
								delivery.campaignName,
								" · ",
								delivery.recipientIds.length,
								" ",
								delivery.recipientIds.length === 1 ? "person" : "people",
								" · ",
								delivery.excluded,
								" excluded · not delivered"
							] }, delivery.id))
						})
					]
				})]
			}),
			tab === "automations" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "crm-grid",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "input-panel",
					onSubmit: (event) => {
						event.preventDefault();
						addRule();
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "panel-label",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { size: 14 }), " WHEN THIS HAPPENS"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "NAME" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: rule.name,
								onChange: (event) => setRule({
									...rule,
									name: event.target.value
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "field-grid",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "TRIGGER" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									value: rule.trigger,
									onChange: (event) => setRule({
										...rule,
										trigger: event.target.value
									}),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "brief",
										children: "Brief is exported"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "activate",
										children: "Activate is opened"
									})]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "CAMPAIGN" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									value: rule.campaignId,
									onChange: (event) => setRule({
										...rule,
										campaignId: event.target.value
									}),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "",
										children: "Choose a draft"
									}), store.campaigns.map((campaign) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: campaign.id,
										children: campaign.name
									}, campaign.id))]
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "audience-note",
							children: "A trigger queues the opted-in audience only. It never sends the message."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "panel-footer",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Needs a saved campaign." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "primary-button",
								type: "submit",
								disabled: !store.campaigns.length,
								children: "Save automation"
							})]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "crm-list",
					children: [store.automations.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "crm-empty",
						children: "No automations. Exporting a brief will not queue anyone until you add one."
					}), store.automations.map((item) => {
						const campaign = store.campaigns.find((entry) => entry.id === item.campaignId);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							className: "crm-card",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: item.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [
								item.trigger === "brief" ? "On brief export" : "On Activate",
								" · ",
								campaign?.name || "Missing campaign"
							] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: `toggle ${item.enabled ? "on" : ""}`,
								role: "switch",
								"aria-checked": item.enabled,
								onClick: () => {
									setAutomationEnabled(item.id, !item.enabled);
									refresh();
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {})
							})]
						}, item.id);
					})]
				})]
			})
		]
	});
}
var stages = [
	{
		id: "discover",
		n: "01",
		label: "Discover",
		sub: "Set the scene"
	},
	{
		id: "reveal",
		n: "02",
		label: "Reveal",
		sub: "Read the evidence"
	},
	{
		id: "envision",
		n: "03",
		label: "Envision",
		sub: "Explore potential"
	},
	{
		id: "quantify",
		n: "04",
		label: "Quantify",
		sub: "Understand impact"
	},
	{
		id: "activate",
		n: "05",
		label: "Activate",
		sub: "Move with clarity"
	}
];
var demoFindings = [
	{
		id: 1,
		title: "Primary frontage",
		type: "Visibility opportunity",
		confidence: "High",
		x: 22,
		y: 47,
		color: "cyan",
		detail: "The primary frontage is visually prominent and could support clearer tenant or brand identification.",
		evidence: "Illustrative marker. Not read from an uploaded image.",
		score: .88,
		source: "demo"
	},
	{
		id: 2,
		title: "Parking approach",
		type: "Access consideration",
		confidence: "Medium",
		x: 72,
		y: 69,
		color: "gold",
		detail: "The approach path appears to be a useful point for wayfinding and access review.",
		evidence: "Illustrative marker. Not read from an uploaded image.",
		score: .64,
		source: "demo"
	},
	{
		id: 3,
		title: "Roofline",
		type: "Condition review",
		confidence: "Medium",
		x: 62,
		y: 18,
		color: "violet",
		detail: "The roofline is a candidate for closer inspection. Image-only review cannot establish material condition.",
		evidence: "Illustrative marker. Not read from an uploaded image.",
		score: .64,
		source: "demo"
	}
];
var engineLayers = [
	{
		name: "Pixel metrics",
		role: "Resolution, luminance, contrast, sharpness, file fingerprint",
		state: "Live"
	},
	{
		name: "Grok vision",
		role: "Scene reading and evidence notes",
		state: "Live"
	},
	{
		name: "Concept render",
		role: "Possibility image from the current scene",
		state: "Live"
	},
	{
		name: "Object detector",
		role: "YOLOX-S boxes people, vehicles, and signs. Apache 2.0. Not a defect or building model.",
		state: "Live"
	},
	{
		name: "RF-DETR",
		role: "Fine-tune target for property photos. Weights are not loaded.",
		state: "Slot"
	},
	{
		name: "Supervision",
		role: "Shared detection overlays. Used once a detector is loaded.",
		state: "Slot"
	},
	{
		name: "PaddleOCR",
		role: "PP-OCRv5 Latin reads signage in English and other Latin scripts. Apache 2.0. Unverified.",
		state: "Live"
	},
	{
		name: "SAM 2",
		role: "Click-to-segment regions. Not loaded.",
		state: "Slot"
	},
	{
		name: "Spatial context",
		role: "Building footprints and map layers. Not connected.",
		state: "Slot"
	}
];
var directions = [
	{
		id: "identity",
		title: "Identity & visibility",
		note: "Clearer signage and brand presence on the primary frontage",
		swatch: "swatch-one"
	},
	{
		id: "access",
		title: "Access & arrival",
		note: "A clearer arrival, wayfinding, and parking approach",
		swatch: "swatch-two"
	},
	{
		id: "exterior",
		title: "Exterior refinement",
		note: "More cohesive materials, lighting, and facade rhythm",
		swatch: "swatch-three"
	}
];
var SETTINGS_KEY = "aperture-settings";
var defaultSettings = {
	liveAnalysis: true,
	renderConcepts: true
};
var conceptJobs = /* @__PURE__ */ new Map();
function fileToDataUrl(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = () => reject(/* @__PURE__ */ new Error("Could not read that image."));
		reader.onload = () => {
			const source = new Image();
			source.onload = () => {
				const scale = Math.min(1, 1280 / Math.max(source.width, source.height));
				const canvas = document.createElement("canvas");
				canvas.width = Math.max(1, Math.round(source.width * scale));
				canvas.height = Math.max(1, Math.round(source.height * scale));
				const ctx = canvas.getContext("2d");
				if (!ctx) {
					reject(/* @__PURE__ */ new Error("Could not read that image."));
					return;
				}
				ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
				resolve(canvas.toDataURL("image/jpeg", .82));
			};
			source.onerror = () => reject(/* @__PURE__ */ new Error("Could not read that image."));
			source.src = String(reader.result || "");
		};
		reader.readAsDataURL(file);
	});
}
function measureImage(file, dataUrl) {
	return new Promise((resolve, reject) => {
		const source = new Image();
		source.onload = () => {
			const scale = Math.min(1, 160 / Math.max(source.width, source.height));
			const w = Math.max(2, Math.round(source.width * scale));
			const h = Math.max(2, Math.round(source.height * scale));
			const canvas = document.createElement("canvas");
			canvas.width = w;
			canvas.height = h;
			const ctx = canvas.getContext("2d", { willReadFrequently: true });
			if (!ctx) {
				reject(/* @__PURE__ */ new Error("Could not measure that image."));
				return;
			}
			ctx.drawImage(source, 0, 0, w, h);
			const { data } = ctx.getImageData(0, 0, w, h);
			const gray = new Float32Array(w * h);
			let sum = 0;
			for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
				const value = .2126 * data[i] + .7152 * data[i + 1] + .0722 * data[i + 2];
				gray[p] = value;
				sum += value;
			}
			const mean = sum / gray.length;
			let variance = 0;
			for (const value of gray) variance += (value - mean) ** 2;
			let lapSum = 0;
			let lapSq = 0;
			let count = 0;
			for (let y = 1; y < h - 1; y += 1) for (let x = 1; x < w - 1; x += 1) {
				const index = y * w + x;
				const lap = gray[index - w] + gray[index - 1] + gray[index + 1] + gray[index + w] - 4 * gray[index];
				lapSum += lap;
				lapSq += lap * lap;
				count += 1;
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
					fingerprint
				});
			}).catch(() => reject(/* @__PURE__ */ new Error("Could not fingerprint that image.")));
		};
		source.onerror = () => reject(/* @__PURE__ */ new Error("Could not measure that image."));
		source.src = dataUrl;
	});
}
function SceneIllustration() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		className: "scene-svg",
		viewBox: "0 0 1000 560",
		role: "img",
		"aria-label": "Illustrative aerial view of a commercial property",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("defs", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
					id: "ground",
					x1: "0",
					y1: "0",
					x2: "1",
					y2: "1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", { stopColor: "#273746" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "1",
						stopColor: "#101d29"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
					id: "roof",
					x1: "0",
					y1: "0",
					x2: "1",
					y2: "1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", { stopColor: "#9ba8ac" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: ".48",
							stopColor: "#596d75"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: "1",
							stopColor: "#334752"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
					id: "glass",
					x1: "0",
					y1: "0",
					x2: "0",
					y2: "1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", { stopColor: "#b6c6c5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "1",
						stopColor: "#3b6069"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pattern", {
					id: "parking",
					width: "48",
					height: "30",
					patternUnits: "userSpaceOnUse",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M0 0V30",
						stroke: "#9aadb0",
						strokeWidth: "2",
						opacity: ".55"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("pattern", {
					id: "grain",
					width: "120",
					height: "120",
					patternUnits: "userSpaceOnUse",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
							cx: "8",
							cy: "10",
							r: "1",
							fill: "#fff",
							opacity: ".13"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
							cx: "72",
							cy: "55",
							r: "1",
							fill: "#fff",
							opacity: ".1"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
							cx: "35",
							cy: "97",
							r: "1",
							fill: "#fff",
							opacity: ".1"
						})
					]
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				width: "1000",
				height: "560",
				fill: "url(#ground)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M0 408L1000 286V560H0Z",
				fill: "#172a32"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M0 436L1000 313",
				stroke: "#91a3a3",
				strokeWidth: "3",
				opacity: ".2"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M0 458L1000 335",
				stroke: "#91a3a3",
				strokeWidth: "2",
				opacity: ".16"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M40 40L960 40L960 520L40 520Z",
				fill: "none",
				stroke: "#78919a",
				strokeWidth: "1",
				opacity: ".18"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M88 90L705 44L900 174L278 231Z",
				fill: "#2e414a",
				stroke: "#a8b7b8",
				strokeWidth: "2"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M278 231L900 174L900 364L278 422Z",
				fill: "url(#glass)",
				stroke: "#b7c5c4",
				strokeWidth: "2"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M88 90L278 231L278 422L88 277Z",
				fill: "#50646c",
				stroke: "#b7c5c4",
				strokeWidth: "2"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M88 90L705 44L900 174L278 231Z",
				fill: "url(#roof)",
				stroke: "#c0cbca",
				strokeWidth: "2"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M140 105L705 63L835 151L278 203Z",
				fill: "#63777c",
				opacity: ".55"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M278 250L900 194M278 286L900 230M278 324L900 268M278 362L900 306",
				stroke: "#d1d9d5",
				strokeWidth: "3",
				opacity: ".6"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M350 224V414M435 216V406M520 208V398M605 200V390M690 192V382M775 184V374M860 177V367",
				stroke: "#243e49",
				strokeWidth: "8",
				opacity: ".8"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M88 277L278 422L278 458L88 314Z",
				fill: "#243943"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M0 405L278 373L278 560L0 560Z",
				fill: "#233943"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M278 422L900 364L1000 415L1000 560L278 560Z",
				fill: "#263b45"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M305 455L955 394V550L305 550Z",
				fill: "url(#parking)",
				opacity: ".45"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M30 350L225 332L225 375L30 393Z",
				fill: "#71888a",
				opacity: ".25"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
				opacity: ".85",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M78 330l28-3 0 13-28 3zM140 324l29-3 0 13-29 3zM204 318l28-3 0 13-28 3z",
					fill: "#c0c9c2"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M360 474l40-4 0 16-40 4zM430 468l40-4 0 16-40 4zM500 462l40-4 0 16-40 4zM570 456l40-4 0 16-40 4zM640 450l40-4 0 16-40 4z",
					fill: "#c5d0cb"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
				fill: "#9caa8a",
				opacity: ".65",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "60",
						cy: "80",
						r: "28"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "34",
						cy: "125",
						r: "20"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "946",
						cy: "80",
						r: "35"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "950",
						cy: "465",
						r: "27"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "40",
						cy: "510",
						r: "34"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				width: "1000",
				height: "560",
				fill: "url(#grain)"
			})
		]
	});
}
function Brand() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "brand",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "brand-mark",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Aperture, {
				size: 20,
				strokeWidth: 1.8
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "brand-name",
			children: ["APERTURE", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "®" })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "brand-sub",
			children: "VISUAL INTELLIGENCE"
		})] })]
	});
}
function App() {
	const [desk, setDesk] = (0, import_react.useState)("discovery");
	const [stage, setStage] = (0, import_react.useState)("discover");
	const [prompt, setPrompt] = (0, import_react.useState)("Identify visible property features, potential improvements, and opportunities worth investigating.");
	const [assetName, setAssetName] = (0, import_react.useState)("Three-tenant commercial center");
	const [location, setLocation] = (0, import_react.useState)("Fort Worth, Texas");
	const [fileUrl, setFileUrl] = (0, import_react.useState)("");
	const [fileName, setFileName] = (0, import_react.useState)("");
	const [findings, setFindings] = (0, import_react.useState)(demoFindings);
	const [source, setSource] = (0, import_react.useState)("demo");
	const [selectedFinding, setSelectedFinding] = (0, import_react.useState)(1);
	const [compare, setCompare] = (0, import_react.useState)(54);
	const [showBrief, setShowBrief] = (0, import_react.useState)(false);
	const [showSettings, setShowSettings] = (0, import_react.useState)(false);
	const [mobileNav, setMobileNav] = (0, import_react.useState)(false);
	const [detections, setDetections] = (0, import_react.useState)([]);
	const [textHits, setTextHits] = (0, import_react.useState)([]);
	const [selectedText, setSelectedText] = (0, import_react.useState)(0);
	const [selectedDetection, setSelectedDetection] = (0, import_react.useState)(0);
	const [summary, setSummary] = (0, import_react.useState)("");
	const [metrics, setMetrics] = (0, import_react.useState)(null);
	const [showLayers, setShowLayers] = (0, import_react.useState)(false);
	const [toast, setToast] = (0, import_react.useState)("");
	const [settings, setSettings] = (0, import_react.useState)(defaultSettings);
	const [settingsReady, setSettingsReady] = (0, import_react.useState)(false);
	const [apiAvailable, setApiAvailable] = (0, import_react.useState)(null);
	const [analyzing, setAnalyzing] = (0, import_react.useState)(false);
	const [directionId, setDirectionId] = (0, import_react.useState)(directions[0].id);
	const [conceptUrl, setConceptUrl] = (0, import_react.useState)("");
	const [conceptError, setConceptError] = (0, import_react.useState)("");
	const [rendering, setRendering] = (0, import_react.useState)(false);
	const [conceptRetry, setConceptRetry] = (0, import_react.useState)(0);
	const uploadRef = (0, import_react.useRef)(null);
	const toastTimer = (0, import_react.useRef)(null);
	const currentIndex = stages.findIndex((s) => s.id === stage);
	const finding = findings.find((f) => f.id === selectedFinding) || findings[0];
	const direction = directions.find((d) => d.id === directionId) || directions[0];
	const notify = (message) => {
		setToast(message);
		if (toastTimer.current) window.clearTimeout(toastTimer.current);
		toastTimer.current = window.setTimeout(() => setToast(""), 3200);
	};
	(0, import_react.useEffect)(() => {
		try {
			const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "");
			setSettings({
				liveAnalysis: saved.liveAnalysis !== false,
				renderConcepts: saved.renderConcepts !== false
			});
		} catch {}
		setSettingsReady(true);
		apiStatus().then((status) => setApiAvailable(status.available)).catch(() => setApiAvailable(false));
	}, []);
	const saveSettings = (next) => {
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
	const ingest = async (file) => {
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
	const onFile = (event) => {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (file) ingest(file);
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
			const result = await analyzeDiscovery({ data: {
				assetName,
				location,
				prompt,
				imageDataUrl: fileUrl
			} });
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
	(0, import_react.useEffect)(() => {
		if (!settingsReady || stage !== "envision" || !settings.renderConcepts) {
			setRendering(false);
			return;
		}
		const key = conceptKey;
		let alive = true;
		setRendering(true);
		setConceptError("");
		setConceptUrl("");
		const job = conceptJobs.get(key) ?? renderConcept({ data: {
			assetName,
			location,
			prompt,
			imageDataUrl: fileUrl,
			direction: direction.title,
			directionNote: direction.note
		} }).then((result) => {
			if (!result.ok || !result.dataUrl) throw new Error(result.error || "Concept rendering failed.");
			return result.dataUrl;
		});
		conceptJobs.set(key, job);
		job.then((url) => {
			if (!alive) return;
			setConceptUrl(url);
			setRendering(false);
		}).catch((error) => {
			conceptJobs.delete(key);
			if (!alive) return;
			setConceptError(error instanceof Error ? error.message : "Concept rendering failed.");
			setRendering(false);
		});
		return () => {
			alive = false;
		};
	}, [
		settingsReady,
		stage,
		settings.renderConcepts,
		conceptKey,
		assetName,
		location,
		prompt,
		fileUrl,
		direction.title,
		direction.note
	]);
	const downloadBrief = () => {
		const metricLines = metrics ? `\nImage metrics:\n- ${metrics.width} × ${metrics.height}px\n- Luminance ${metrics.meanLuminance} · Contrast ${metrics.contrast} · Sharpness ${metrics.sharpness}\n- SHA-256 ${metrics.fingerprint}\n` : "";
		const boxes = detections.length ? `\nDetected objects (YOLOX-S, unverified):\n${detections.map((d) => `- ${d.label} ${Math.round(d.score * 100)}%`).join("\n")}\n` : "";
		const words = textHits.length ? `\nVisible text (PP-OCRv5, unverified):\n${textHits.map((hit) => `- ${hit.text}`).join("\n")}\n` : "";
		const content = `APERTURE INTELLIGENCE BRIEF\n\nAsset: ${assetName}\nLocation: ${location}\nSource: ${source === "live" ? "Live visual reading" : "Demo markers"}\n${summary ? `\nScene:\n${summary}\n` : ""}${metricLines}${boxes}${words}\nDiscovery objective:\n${prompt}\n\nFindings:\n${findings.map((f) => `- ${f.title} — ${f.type} (${f.confidence}, ${Math.round(f.score * 100)}%): ${f.detail}\n  Evidence: ${f.evidence}`).join("\n")}\n\nNote: Observations are not measurements of the asset, an inspection, a valuation, or professional advice. Boxes are COCO-class detections, not defects. Recognized text can be wrong. RF-DETR and SAM 2 are not loaded.`;
		const blob = new Blob([content], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "aperture-intelligence-brief.txt";
		a.click();
		URL.revokeObjectURL(url);
		const note = runAutomations("brief");
		notify(note ? `Brief exported. ${note}` : "Intelligence brief exported.");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "app-shell",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: `sidebar ${mobileNav ? "sidebar-open" : ""}`,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "sidebar-top",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brand, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "icon-button mobile-close",
							onClick: () => setMobileNav(false),
							"aria-label": "Close navigation",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 18 })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "workspace-switch",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "workspace-avatar",
								children: "A"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "workspace-copy",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "APERTURE Studio" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Personal workspace" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { size: 15 })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "nav-label",
						children: "WORKSPACE"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: `nav-item ${desk === "discovery" ? "active" : ""}`,
						onClick: () => {
							setDesk("discovery");
							setMobileNav(false);
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Compass, { size: 17 }),
							" Discovery workspace ",
							desk === "discovery" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "nav-live" })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: `nav-item ${desk === "crm" ? "active" : ""}`,
						onClick: () => {
							setDesk("crm");
							setMobileNav(false);
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { size: 17 }),
							" Engagement ",
							desk === "crm" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "nav-live" })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "nav-item",
						onClick: () => {
							setShowLayers(true);
							setMobileNav(false);
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, { size: 17 }), " Intelligence library"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "nav-item",
						onClick: () => notify("Project tracking is coming into view."),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Grid2x2, { size: 17 }), " Projects"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "nav-label nav-label-spaced",
						children: "YOUR WORK"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "recent-item",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "recent-dot cyan-dot" }),
							" Three-tenant center ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Today" })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "recent-item",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "recent-dot gold-dot" }),
							" Northside retail site ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Oct 28" })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "new-discovery",
						onClick: () => {
							setStage("discover");
							setMobileNav(false);
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 16 }), " New discovery"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "sidebar-bottom",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "signal-card",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "signal-icon",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { size: 15 })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "See the bigger picture." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Turn visual evidence into your next informed move." })] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								className: "nav-item",
								onClick: () => {
									setShowSettings(true);
									setMobileNav(false);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleHelp, { size: 17 }), " Help & guidance"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								className: "nav-item",
								onClick: () => {
									setShowSettings(true);
									setMobileNav(false);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings2, { size: 17 }), " Preferences"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "profile",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "profile-avatar",
										children: "MM"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Workspace owner" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Visionary plan · Demo" })] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, { size: 18 })
								]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "main",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "topbar",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "topbar-left",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "icon-button mobile-menu",
							onClick: () => setMobileNav(true),
							"aria-label": "Open navigation",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { size: 19 })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "breadcrumb",
							children: [
								"Workspace ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 14 }),
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: desk === "crm" ? "Engagement" : "Discovery" })
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "topbar-right",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								className: `system-status ${apiAvailable === false ? "is-off" : ""}`,
								onClick: () => setShowSettings(true),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}),
									" ",
									apiAvailable === null ? "CHECKING API" : apiAvailable ? "API CONNECTED" : "API UNAVAILABLE"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "icon-button",
								"aria-label": "Notifications",
								onClick: () => notify("You're all caught up."),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { size: 17 })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "top-avatar",
								children: "MM"
							})
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "content",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "page-heading",
						children: [desk === "crm" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "eyebrow",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "eyebrow-line" }), " ENGAGEMENT"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", { children: ["Reach people ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "you may contact." })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "page-subtitle",
								children: "Contacts, campaigns, and automations. Delivery stays off until a channel is connected."
							})
						] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "eyebrow",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "eyebrow-line" }), " INTELLIGENCE IN MOTION"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", { children: ["See beyond ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "the visible." })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "page-subtitle",
								children: "Every image holds a bigger picture. Let's uncover what matters."
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "heading-actions",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "saved-state",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}),
									" ",
									desk === "crm" ? "Saved in this browser" : "Auto-saved"
								]
							}), desk === "discovery" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								className: "outline-button",
								onClick: () => setShowBrief(true),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { size: 15 }), " View brief"]
							})]
						})]
					}), desk === "crm" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EngagementDesk, { onNotify: notify }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "journey",
							"aria-label": "Discovery progress",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "journey-track",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "journey-progress",
									style: { width: `${currentIndex * 25}%` }
								})
							}), stages.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => setStage(s.id),
								className: `journey-step ${i === currentIndex ? "current" : ""} ${i < currentIndex ? "complete" : ""}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "step-node",
									children: i < currentIndex ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 13 }) : s.n
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "step-text",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: s.label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: s.sub })]
								})]
							}, s.id))]
						}),
						stage === "discover" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "stage-layout discover-layout",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "stage-main",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "section-kicker",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "01" }), " / DISCOVER"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", { children: [
										"Start with what",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
										"you ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "see." })
									] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "stage-description",
										children: "Bring a place, an image, or a question. APERTURE will help structure the discovery around what you want to understand."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "input-panel",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "panel-label",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image$1, { size: 15 }), " YOUR VISUAL STARTING POINT"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: `upload-zone ${fileUrl ? "has-file" : ""}`,
												onClick: () => uploadRef.current?.click(),
												onDragOver: (e) => e.preventDefault(),
												onDrop: (e) => {
													e.preventDefault();
													const f = e.dataTransfer.files?.[0];
													if (f) ingest(f);
												},
												children: [
													fileUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
														className: "uploaded-preview",
														src: fileUrl,
														alt: ""
													}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "upload-graphic",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "upload-frame",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CloudUpload, { size: 24 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "upload-cross",
																children: "+"
															})]
														})
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "upload-copy",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: fileUrl ? fileName : "Drop an image to begin" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: fileUrl ? "Image ready · Click to replace" : "or browse files from your device" })]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														className: "browse-button",
														onClick: (e) => {
															e.stopPropagation();
															uploadRef.current?.click();
														},
														children: fileUrl ? "Replace image" : "Browse images"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														ref: uploadRef,
														type: "file",
														accept: "image/*",
														hidden: true,
														onChange: onFile
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "field-grid",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
													className: "field",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "ASSET / SUBJECT" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														value: assetName,
														onChange: (e) => setAssetName(e.target.value),
														placeholder: "Name this discovery"
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
													className: "field",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["LOCATION ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "OPTIONAL" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "field-with-icon",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { size: 15 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
															value: location,
															onChange: (e) => setLocation(e.target.value),
															placeholder: "Add a location"
														})]
													})]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
												className: "field prompt-field",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "WHAT DO YOU WANT TO DISCOVER?" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
													value: prompt,
													onChange: (e) => setPrompt(e.target.value),
													rows: 3,
													placeholder: "Describe what you want to understand..."
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "prompt-suggestions",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "TRY:" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														onClick: () => setPrompt("Identify visible property features and potential maintenance concerns."),
														children: "Condition review"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														onClick: () => setPrompt("Find opportunities to improve visibility, access, and customer experience."),
														children: "Opportunity scan"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														onClick: () => setPrompt("Explore signage, branding, and exterior transformation possibilities."),
														children: "Transformation ideas"
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "panel-footer",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { size: 14 }),
													" ",
													settings.liveAnalysis ? "Begin discovery sends this image to the visual API." : "Live analysis is off. Demo markers will be used."
												] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													className: "primary-button",
													onClick: () => void begin(),
													disabled: analyzing,
													children: [
														analyzing ? "Reading the image…" : "Begin discovery",
														" ",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { size: 16 })
													]
												})]
											})
										]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
								className: "stage-aside",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "aside-orbit",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "orbit orbit-one" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "orbit orbit-two" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "orbit-core",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Aperture, { size: 31 })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "orbit-point p1" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "orbit-point p2" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "orbit-point p3" })
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "aside-copy",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "aside-overline",
												children: "A DIFFERENT WAY OF SEEING"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", { children: [
												"Clarity begins",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
												"with ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "curiosity." })
											] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Start broad. Follow the evidence. Let the most meaningful insights emerge naturally." })
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "aside-note",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "note-icon",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Focus, { size: 16 })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "One canvas. A wider view." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Images, context, findings, and next steps — connected in one continuous experience." })] })]
									})
								]
							})]
						}),
						stage === "reveal" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "stage-layout work-layout",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "stage-main wide-main",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "section-kicker",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "02" }), " / REVEAL"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "work-heading",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", { children: [
											"Look closer.",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "See the signals." })
										] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "stage-description",
											children: "A visual reading of the scene, with evidence points to explore."
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "demo-tag",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}),
												" ",
												source === "live" ? "LIVE READING" : "DEMO MARKERS"
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "evidence-workspace",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "evidence-toolbar",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "live-dot" }),
													" VISUAL EVIDENCE CANVAS ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: ["· ", assetName || "Untitled discovery"] })
												] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													className: "tool-icon",
													onClick: () => notify("Canvas view controls are illustrative."),
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, { size: 18 })
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "evidence-image",
												children: fileUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "evidence-stage",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
														className: "evidence-shot",
														src: fileUrl,
														alt: assetName || "Uploaded scene"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "evidence-overlay",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "image-vignette" }),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "image-coordinate",
																children: "APERTURE / OBJECT DETECTOR / YOLOX-S"
															}),
															detections.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
																className: `detect-box ${selectedDetection === d.id ? "on" : ""}`,
																style: {
																	left: `${d.x}%`,
																	top: `${d.y}%`,
																	width: `${d.w}%`,
																	height: `${d.h}%`
																},
																onClick: () => setSelectedDetection(d.id),
																"aria-label": `${d.label}, ${Math.round(d.score * 100)} percent`,
																children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
																	d.label,
																	" ",
																	Math.round(d.score * 100)
																] })
															}, d.id)),
															textHits.map((hit) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
																className: `text-box ${selectedText === hit.id ? "on" : ""}`,
																style: {
																	left: `${hit.x}%`,
																	top: `${hit.y}%`,
																	width: `${hit.w}%`,
																	height: `${hit.h}%`
																},
																onClick: () => setSelectedText(hit.id),
																"aria-label": `Text ${hit.text}`,
																children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: hit.text })
															}, hit.id)),
															findings.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
																className: `evidence-pin pin-${f.color} ${selectedFinding === f.id ? "pin-selected" : ""}`,
																style: {
																	left: `${f.x}%`,
																	top: `${f.y}%`
																},
																onClick: () => setSelectedFinding(f.id),
																"aria-label": `View ${f.title}`,
																children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: f.id })
															}, f.id)),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "image-scale",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "FIELD OF VIEW" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "100%" })]
															})
														]
													})]
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SceneIllustration, {}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "image-vignette" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "image-coordinate",
														children: "APERTURE / VISUAL SCAN / 001"
													}),
													findings.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														className: `evidence-pin pin-${f.color} ${selectedFinding === f.id ? "pin-selected" : ""}`,
														style: {
															left: `${f.x}%`,
															top: `${f.y}%`
														},
														onClick: () => setSelectedFinding(f.id),
														"aria-label": `View ${f.title}`,
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: f.id })
													}, f.id)),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "image-scale",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "FIELD OF VIEW" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "100%" })]
													})
												] })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "canvas-footer",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scan, { size: 14 }),
													" ",
													fileUrl ? fileName || "User-provided image" : "Illustrative commercial property scene"
												] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
													detections.length || textHits.length ? `${detections.length} objects · ${textHits.length} text` : `${String(findings.length).padStart(2, "0")} evidence markers`,
													" ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}),
													" ",
													detections.length || textHits.length ? "YOLOX-S · PP-OCRv5" : source === "live" ? "From the image" : "Demo data"
												] })]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "evidence-list",
										children: [
											metrics && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "metric-strip",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "RESOLUTION" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [
														metrics.width,
														" × ",
														metrics.height
													] })] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "LUMINANCE" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: metrics.meanLuminance.toFixed(0) })] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "CONTRAST" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: metrics.contrast.toFixed(0) })] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "SHARPNESS" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: metrics.sharpness.toFixed(0) })] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "SHA-256" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: metrics.fingerprint })] })
												]
											}),
											detections.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "detect-list",
												children: detections.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													className: selectedDetection === d.id ? "on" : "",
													onClick: () => setSelectedDetection(d.id),
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: d.label }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [Math.round(d.score * 100), "%"] })]
												}, d.id))
											}),
											textHits.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "detect-list text-list",
												children: textHits.map((hit) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													className: selectedText === hit.id ? "on" : "",
													onClick: () => setSelectedText(hit.id),
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: hit.text }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [Math.round(hit.score * 100), "%"] })]
												}, hit.id))
											}),
											summary && source === "live" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "scene-summary",
												children: summary
											}) : null,
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "list-heading",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "section-mini",
													children: "OBSERVATIONS"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Signals worth exploring" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "count-pill",
													children: [String(findings.length).padStart(2, "0"), " FOUND"]
												})]
											}),
											findings.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												className: `finding-row ${selectedFinding === f.id ? "finding-active" : ""}`,
												onClick: () => setSelectedFinding(f.id),
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: `finding-index ${f.color}`,
														children: ["0", f.id]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "finding-copy",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: f.title }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: f.type })]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: `confidence ${f.confidence.toLowerCase()}`,
														children: [f.confidence, " confidence"]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 16 })
												]
											}, f.id))
										]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
								className: "insight-panel",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "panel-label",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { size: 14 }), " SELECTED SIGNAL"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: `insight-number ${finding.color}`,
										children: ["0", finding.id]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "insight-type",
										children: finding.type
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: finding.title }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: finding.detail }),
									finding.evidence ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "evidence-basis",
										children: finding.evidence
									}) : null,
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "confidence-block",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: source === "live" ? `UNVERIFIED · ${finding.source.toUpperCase()}` : "DEMO CONFIDENCE" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: finding.confidence }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "confidence-track",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { style: { width: `${Math.round(finding.score * 100)}%` } })
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "insight-disclaimer",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { size: 15 }),
											" ",
											source === "live" ? "Machine observation. Not a measurement, inspection, or valuation. Human review is required." : "Demo markers. Turn on live analysis in Preferences to read an uploaded image."
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										className: "text-action",
										onClick: () => setStage("envision"),
										children: ["Explore this opportunity ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { size: 15 })]
									})
								]
							})]
						}),
						stage === "envision" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "stage-layout work-layout",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "stage-main wide-main",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "section-kicker",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "03" }), " / ENVISION"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", { children: [
										"Imagine what",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "could be." })
									] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "stage-description",
										children: "Move from observation to possibility. Compare directions before committing to a plan."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "concept-card",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "concept-visual",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "concept-plate",
													children: fileUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
														className: "concept-photo",
														src: fileUrl,
														alt: "Current scene"
													}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SceneIllustration, {})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "concept-plate concept-plate-after",
													style: { clipPath: `inset(0 0 0 ${compare}%)` },
													children: conceptUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
														className: "concept-photo",
														src: conceptUrl,
														alt: "Rendered possibility"
													}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "concept-wait",
														children: rendering ? "Rendering possibility…" : conceptError ? "Rendering failed" : settings.renderConcepts ? "Waiting to render" : "Concept rendering is off"
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "concept-divider",
													style: { left: `${compare}%` },
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 13 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 13 })] })
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													className: "compare-range",
													type: "range",
													min: "10",
													max: "90",
													value: compare,
													onChange: (e) => setCompare(Number(e.target.value)),
													"aria-label": "Compare concept view"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "concept-label before-label",
													children: "CURRENT"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "concept-label after-label",
													children: "POSSIBILITY"
												})
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "concept-caption",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "concept-kicker",
													children: ["DIRECTION · ", direction.title.toUpperCase()]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", { children: [direction.title, "."] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [conceptError || direction.note, ". Drag the slider to compare the current scene with the rendered possibility. This is a concept study, not a construction drawing."] })
											] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "concept-status",
												children: rendering ? "RENDERING" : conceptUrl ? "RENDERED" : "WAITING"
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "concept-options",
										children: directions.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											className: `concept-option ${item.id === direction.id ? "active" : ""}`,
											onClick: () => setDirectionId(item.id),
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `option-swatch ${item.swatch}` }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: item.title }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: item.note })] }),
												item.id === direction.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 16 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { size: 15 })
											]
										}, item.id))
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
								className: "insight-panel envision-aside",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "panel-label",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WandSparkles, { size: 14 }), " CREATIVE INTENT"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Possibility is a starting point." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: settings.renderConcepts ? "The possibility side is rendered from your scene and the selected direction. It is a study, not a permit set." : "Concept rendering is off. Turn it on in Preferences to generate the possibility image." }),
									conceptError ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										className: "text-action",
										onClick: () => setConceptRetry((n) => n + 1),
										children: ["Try rendering again ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { size: 15 })]
									}) : null,
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "aside-stat",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "01" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Explore" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Surface possible directions" })] })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "aside-stat",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "02" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Compare" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Understand the visual trade-offs" })] })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "aside-stat",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "03" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Refine" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Prepare a brief for execution" })] })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										className: "text-action",
										onClick: () => setStage("quantify"),
										children: ["Understand the impact ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { size: 15 })]
									})
								]
							})]
						}),
						stage === "quantify" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "stage-layout work-layout",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "stage-main wide-main",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "section-kicker",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "04" }), " / QUANTIFY"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", { children: [
										"Make the value",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "understandable." })
									] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "stage-description",
										children: "Frame the decisions, dependencies, and information needed before assigning a budget or forecast."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "metrics-grid",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "metric-card",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "OPPORTUNITY AREAS" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: String(findings.length).padStart(2, "0") }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "metric-dot cyan-dot" }), " Areas identified for review"] })
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "metric-card",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "DECISION READINESS" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Early" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "metric-dot gold-dot" }), " More evidence required"] })
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "metric-card",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "ESTIMATE STATUS" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Pending" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "metric-dot violet-dot" }), " No verified cost data"] })
												]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "decision-card",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "decision-head",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "section-mini",
												children: "DECISION FRAMEWORK"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "What needs to be known next?" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "count-pill",
												children: "3 WORKSTREAMS"
											})]
										}), [
											[
												"01",
												"Site verification",
												"Confirm dimensions, access, and existing conditions."
											],
											[
												"02",
												"Scope definition",
												"Select the improvement direction and define deliverables."
											],
											[
												"03",
												"Commercial validation",
												"Collect supplier pricing, labor assumptions, permits, and timelines."
											]
										].map(([n, t, d]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "decision-row",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: n }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: t }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: d })] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "pending-label",
													children: "TO VALIDATE"
												})
											]
										}, n))]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "honesty-note",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { size: 17 }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Evidence before estimates." }), " APERTURE should only present cost, valuation, or ROI figures when there is a traceable source, stated assumptions, and a clear confidence level. This prototype intentionally does not invent financial projections."] })]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
								className: "insight-panel",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "panel-label",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Target, { size: 14 }), " DECISION SIGNAL"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "readiness-ring",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "01" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "STAGE" })] })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Build the evidence base." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "The next valuable step is not a speculative number. It is closing the information gaps that make a reliable estimate possible." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										className: "text-action",
										onClick: openActivate,
										children: ["Build the action brief ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { size: 15 })]
									})
								]
							})]
						}),
						stage === "activate" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "stage-layout work-layout",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "stage-main wide-main",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "section-kicker",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "05" }), " / ACTIVATE"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", { children: [
										"Turn insight",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
										"into ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "momentum." })
									] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "stage-description",
										children: "Bring the discovery together in a concise brief your team can review, refine, and put to work."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "activation-card",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "activation-top",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "activation-icon",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clipboard, { size: 22 })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "demo-tag",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}), " READY TO REVIEW"]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "activation-kicker",
												children: "APERTURE / INTELLIGENCE BRIEF"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: assetName || "Untitled discovery" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "activation-location",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { size: 14 }), location || "Location not specified"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "activation-divider" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "brief-block",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "DISCOVERY INTENT" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: prompt })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "brief-block",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "KEY AREAS TO EXPLORE" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "brief-tags",
													children: findings.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: f.title }, f.id))
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "brief-block",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "RECOMMENDED NEXT MOVES" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Validate the visual observations with on-site or source evidence." }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Confirm scope and gather relevant technical requirements." }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Request sourced pricing and timelines from qualified providers." })
												] })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "activation-actions",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													className: "primary-button",
													onClick: downloadBrief,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { size: 16 }), " Export intelligence brief"]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													className: "outline-button",
													onClick: () => setStage("discover"),
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 15 }), " Start another discovery"]
												})]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "closing-line",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Aperture, { size: 17 }),
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "SEE BEYOND THE VISIBLE." }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}),
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "MOVE WITH CLARITY." })
										]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
								className: "insight-panel",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "panel-label",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { size: 14 }), " NEXT CHAPTER"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "From visual intelligence to real-world action." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "This is where APERTURE can connect to specialist workflows: property assessment, contractor scoping, insurance documentation, signage planning, and partner services." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "integration-list",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "integration-dot" }), " Property & asset intelligence"] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "integration-dot" }), " Contractor & supplier network"] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "integration-dot" }), " Insurance & risk workflows"] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "integration-dot" }), " Spatial & geospatial context"] })
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "integration-note",
										children: "Future integrations · Not connected in this prototype"
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
							className: "stage-footer",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									className: "back-button",
									onClick: back,
									disabled: currentIndex === 0,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 16 }), " Back"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "footer-center",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "APERTURE" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}),
										" VISUAL INTELLIGENCE / 2026"
									]
								}),
								currentIndex < 4 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									className: "next-button",
									onClick: advance,
									children: [
										"Continue to ",
										stages[currentIndex + 1].label,
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { size: 16 })
									]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									className: "next-button",
									onClick: downloadBrief,
									children: ["Export brief ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { size: 15 })]
								})
							]
						})
					] })]
				})]
			}),
			showLayers && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "modal-backdrop",
				onClick: () => setShowLayers(false),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "brief-modal layers-modal",
					onClick: (e) => e.stopPropagation(),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "modal-head",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "section-mini",
								children: "INTELLIGENCE ENGINE"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "What is actually running" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "icon-button",
								onClick: () => setShowLayers(false),
								"aria-label": "Close intelligence library",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 18 })
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "layers-lead",
							children: "YOLOX-S draws object boxes. PP-OCRv5 reads visible text. Grok writes the scene notes. Pixel metrics stay in the browser. The remaining rows are slots."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "layer-list",
							children: engineLayers.map((layer) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "layer-row",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: layer.state === "Live" && layer.name !== "Grok vision" && layer.name !== "Concept render" || layer.name === "Grok vision" && apiAvailable || layer.name === "Concept render" && apiAvailable && settings.renderConcepts ? "dot on" : "dot" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: layer.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: layer.role })] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: layer.name === "Grok vision" ? apiAvailable ? "Live" : "Off" : layer.name === "Concept render" ? apiAvailable && settings.renderConcepts ? "Live" : "Off" : layer.state })
								]
							}, layer.name))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "modal-disclaimer",
							children: "A slot is not a detection. No cost, valuation, or ROI is calculated. Findings stay machine observations until a person reviews them."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "primary-button full-button",
							onClick: () => setShowLayers(false),
							children: "Done"
						})
					]
				})
			}),
			showSettings && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "modal-backdrop",
				onClick: () => setShowSettings(false),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "brief-modal",
					onClick: (e) => e.stopPropagation(),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "modal-head",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "section-mini",
								children: "WORKSPACE"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Preferences" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "icon-button",
								onClick: () => setShowSettings(false),
								"aria-label": "Close preferences",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 18 })
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: `api-pill ${apiAvailable ? "ok" : "off"}`,
							children: apiAvailable === null ? "CHECKING API" : apiAvailable ? "API CONNECTED · GROK-4.5" : "API UNAVAILABLE"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "settings-list",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "settings-row",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Live analysis" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Begin discovery reads the uploaded image and returns evidence markers. Off keeps the demo markers." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: `toggle ${settings.liveAnalysis ? "on" : ""}`,
									role: "switch",
									"aria-checked": settings.liveAnalysis,
									onClick: () => saveSettings({
										...settings,
										liveAnalysis: !settings.liveAnalysis
									}),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {})
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "settings-row",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Concept rendering" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Envision renders one possibility image for the selected direction. Each new direction is a new render." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: `toggle ${settings.renderConcepts ? "on" : ""}`,
									role: "switch",
									"aria-checked": settings.renderConcepts,
									onClick: () => saveSettings({
										...settings,
										renderConcepts: !settings.renderConcepts
									}),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {})
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "modal-disclaimer",
							children: "Images stay in this session until you send them. Analysis and renders run only when you start a discovery or open Envision. They are not measurements, inspections, or cost estimates."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "primary-button full-button",
							onClick: () => setShowSettings(false),
							children: "Done"
						})
					]
				})
			}),
			showBrief && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "modal-backdrop",
				onClick: () => setShowBrief(false),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "brief-modal",
					onClick: (e) => e.stopPropagation(),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "modal-head",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "section-mini",
								children: "DISCOVERY OVERVIEW"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Intelligence brief" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "icon-button",
								onClick: () => setShowBrief(false),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 18 })
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "modal-asset",
							children: assetName || "Untitled discovery"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "modal-location",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { size: 14 }), location || "Location not specified"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "modal-progress",
							children: stages.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: i <= currentIndex ? "modal-done" : "",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: i < currentIndex ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 11 }) : s.n }), s.label]
							}, s.id))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "modal-disclaimer",
							children: source === "live" ? "Live reading of the image and question. Not a measurement, inspection, or valuation." : "Demo markers. Turn on live analysis in Preferences to read an uploaded image."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							className: "primary-button full-button",
							onClick: () => {
								setShowBrief(false);
								downloadBrief();
							},
							children: ["Export brief ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { size: 15 })]
						})
					]
				})
			}),
			toast && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "toast",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 15 }), toast]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "demo-watermark",
				children: [
					source === "live" ? "LIVE READING" : "DEMO MARKERS",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }),
					" ",
					settings.liveAnalysis ? "API ON" : "API OFF"
				]
			})
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(App, {});
}
//#endregion
export { Home as component };
