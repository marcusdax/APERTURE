export type Channel = "email" | "sms" | "whatsapp";
export type Consent = "none" | "in" | "out";

export type Contact = {
  id: string;
  name: string;
  organization: string;
  email: string;
  phone: string;
  consent: Record<Channel, Consent>;
  note: string;
};

export type Campaign = {
  id: string;
  name: string;
  channel: Channel;
  subject: string;
  body: string;
  createdAt: string;
};

export type Delivery = {
  id: string;
  campaignId: string;
  campaignName: string;
  channel: Channel;
  at: string;
  recipientIds: string[];
  excluded: number;
  status: "held";
};

export type Automation = {
  id: string;
  name: string;
  enabled: boolean;
  trigger: "brief" | "activate";
  campaignId: string;
};

const KEY = "aperture.crm.v1";

type Store = {
  contacts: Contact[];
  campaigns: Campaign[];
  deliveries: Delivery[];
  automations: Automation[];
};

const empty = (): Store => ({ contacts: [], campaigns: [], deliveries: [], automations: [] });

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Partial<Store>;
    return {
      contacts: parsed.contacts ?? [],
      campaigns: parsed.campaigns ?? [],
      deliveries: parsed.deliveries ?? [],
      automations: parsed.automations ?? [],
    };
  } catch {
    return empty();
  }
}

function write(store: Store) {
  localStorage.setItem(KEY, JSON.stringify(store));
}

export function loadCrm() {
  return read();
}

export function saveContact(input: Omit<Contact, "id"> & { id?: string }) {
  const store = read();
  const contact: Contact = {
    id: input.id || crypto.randomUUID(),
    name: input.name.trim(),
    organization: input.organization.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    consent: input.consent,
    note: input.note.trim(),
  };
  const index = store.contacts.findIndex((item) => item.id === contact.id);
  if (index >= 0) store.contacts[index] = contact;
  else store.contacts.unshift(contact);
  write(store);
  return contact;
}

export function removeContact(id: string) {
  const store = read();
  store.contacts = store.contacts.filter((item) => item.id !== id);
  write(store);
}

export function saveCampaign(input: Omit<Campaign, "id" | "createdAt"> & { id?: string }) {
  const store = read();
  const existing = store.campaigns.find((item) => item.id === input.id);
  const campaign: Campaign = {
    id: input.id || crypto.randomUUID(),
    name: input.name.trim(),
    channel: input.channel,
    subject: input.subject.trim(),
    body: input.body.trim(),
    createdAt: existing?.createdAt || new Date().toISOString(),
  };
  const index = store.campaigns.findIndex((item) => item.id === campaign.id);
  if (index >= 0) store.campaigns[index] = campaign;
  else store.campaigns.unshift(campaign);
  write(store);
  return campaign;
}

export function reachable(contact: Contact, channel: Channel) {
  if (contact.consent[channel] !== "in") return false;
  if (channel === "email") return contact.email.includes("@");
  return contact.phone.replace(/\D/g, "").length >= 8;
}

export function audience(channel: Channel) {
  const store = read();
  const eligible = store.contacts.filter((contact) => reachable(contact, channel));
  return { eligible, excluded: store.contacts.length - eligible.length, total: store.contacts.length };
}

export function queueCampaign(campaignId: string): { ok: boolean; message: string } {
  const store = read();
  const campaign = store.campaigns.find((item) => item.id === campaignId);
  if (!campaign) return { ok: false, message: "That campaign is no longer here." };
  if (!campaign.body) return { ok: false, message: "Add a message before queueing." };
  if (campaign.channel === "email" && !campaign.subject) return { ok: false, message: "Email campaigns need a subject." };
  const eligible = store.contacts.filter((contact) => reachable(contact, campaign.channel));
  const excluded = store.contacts.length - eligible.length;
  if (!eligible.length) {
    return { ok: false, message: `${campaign.name} stayed a draft. No contact has opted in on ${label(campaign.channel)} with an address.` };
  }
  store.deliveries.unshift({
    id: crypto.randomUUID(),
    campaignId: campaign.id,
    campaignName: campaign.name,
    channel: campaign.channel,
    at: new Date().toISOString(),
    recipientIds: eligible.map((contact) => contact.id),
    excluded,
    status: "held",
  });
  write(store);
  return {
    ok: true,
    message: `Queued ${eligible.length} for ${campaign.name}. Held here. Nothing was delivered.`,
  };
}

export function saveAutomation(input: Omit<Automation, "id"> & { id?: string }) {
  const store = read();
  const rule: Automation = {
    id: input.id || crypto.randomUUID(),
    name: input.name.trim() || "Follow-up",
    enabled: input.enabled,
    trigger: input.trigger,
    campaignId: input.campaignId,
  };
  const index = store.automations.findIndex((item) => item.id === rule.id);
  if (index >= 0) store.automations[index] = rule;
  else store.automations.unshift(rule);
  write(store);
  return rule;
}

export function setAutomationEnabled(id: string, enabled: boolean) {
  const store = read();
  const rule = store.automations.find((item) => item.id === id);
  if (!rule) return;
  rule.enabled = enabled;
  write(store);
}

export function runAutomations(trigger: Automation["trigger"]) {
  const store = read();
  const rules = store.automations.filter((rule) => rule.enabled && rule.trigger === trigger);
  if (!rules.length) return "";
  return rules.map((rule) => queueCampaign(rule.campaignId).message).join(" ");
}

export function label(channel: Channel) {
  if (channel === "email") return "email";
  if (channel === "sms") return "text";
  return "WhatsApp";
}
