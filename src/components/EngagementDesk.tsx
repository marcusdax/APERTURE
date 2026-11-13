import { useState } from "react";
import { Mail, MessageCircle, Phone, Plus, ShieldCheck, Trash2, Users } from "lucide-react";
import {
  audience,
  label,
  loadCrm,
  queueCampaign,
  removeContact,
  saveAutomation,
  saveCampaign,
  saveContact,
  setAutomationEnabled,
  type Campaign,
  type Channel,
  type Consent,
  type Contact,
} from "@/lib/crm";

const channels: { id: Channel; label: string; icon: typeof Mail }[] = [
  { id: "email", label: "Email", icon: Mail },
  { id: "sms", label: "Text", icon: Phone },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
];

const blankConsent = (): Record<Channel, Consent> => ({ email: "none", sms: "none", whatsapp: "none" });

export default function EngagementDesk({ onNotify }: { onNotify: (message: string) => void }) {
  const [store, setStore] = useState(loadCrm);
  const [tab, setTab] = useState<"people" | "campaigns" | "automations">("people");
  const [contact, setContact] = useState({ name: "", organization: "", email: "", phone: "", note: "", consent: blankConsent() });
  const [draft, setDraft] = useState({ name: "", channel: "email" as Channel, subject: "", body: "" });
  const [rule, setRule] = useState({ name: "Brief follow-up", trigger: "brief" as "brief" | "activate", campaignId: "" });

  const refresh = () => setStore(loadCrm());
  const preview = audience(draft.channel);

  const addContact = () => {
    if (!contact.name.trim()) {
      onNotify("A contact needs a name.");
      return;
    }
    saveContact(contact);
    setContact({ name: "", organization: "", email: "", phone: "", note: "", consent: blankConsent() });
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
    setDraft({ name: "", channel: draft.channel, subject: "", body: "" });
    setRule((current) => ({ ...current, campaignId: current.campaignId || saved.id }));
    refresh();
    onNotify("Campaign saved as a draft. It has not been sent.");
  };

  const queue = (campaign: Campaign) => {
    const result = queueCampaign(campaign.id);
    refresh();
    onNotify(result.message);
  };

  const addRule = () => {
    if (!rule.campaignId) {
      onNotify("Choose a campaign before turning on an automation.");
      return;
    }
    saveAutomation({ ...rule, enabled: true });
    refresh();
    onNotify("Automation saved. It queues locally. It does not deliver.");
  };

  return (
    <section className="crm">
      <div className="channel-row">
        {channels.map((channel) => (
          <div key={channel.id} className="channel-card">
            <channel.icon size={15} />
            <div>
              <strong>{channel.label}</strong>
              <span>Not connected</span>
            </div>
          </div>
        ))}
        <p><ShieldCheck size={14} /> Queues stay in this browser. No email, text, or WhatsApp is sent.</p>
      </div>

      <div className="crm-tabs">
        {(["people", "campaigns", "automations"] as const).map((item) => (
          <button key={item} className={tab === item ? "on" : ""} onClick={() => setTab(item)}>{item}</button>
        ))}
      </div>

      {tab === "people" && (
        <div className="crm-grid">
          <form className="input-panel" onSubmit={(event) => { event.preventDefault(); addContact(); }}>
            <div className="panel-label"><Users size={14} /> ADD A CONTACT</div>
            <div className="field-grid">
              <label className="field"><span>NAME</span><input value={contact.name} onChange={(event) => setContact({ ...contact, name: event.target.value })} placeholder="Jordan Hale" /></label>
              <label className="field"><span>ORGANIZATION</span><input value={contact.organization} onChange={(event) => setContact({ ...contact, organization: event.target.value })} placeholder="Northside retail" /></label>
              <label className="field"><span>EMAIL</span><input value={contact.email} onChange={(event) => setContact({ ...contact, email: event.target.value })} placeholder="name@studio.com" /></label>
              <label className="field"><span>MOBILE</span><input value={contact.phone} onChange={(event) => setContact({ ...contact, phone: event.target.value })} placeholder="+1 817 555 0142" /></label>
            </div>
            <label className="field prompt-field"><span>NOTE</span><textarea rows={2} value={contact.note} onChange={(event) => setContact({ ...contact, note: event.target.value })} placeholder="How you know them. Not a message." /></label>
            <div className="consent-row">
              {channels.map((channel) => (
                <button
                  type="button"
                  key={channel.id}
                  className={contact.consent[channel.id] === "in" ? "on" : ""}
                  onClick={() => setContact({ ...contact, consent: { ...contact.consent, [channel.id]: contact.consent[channel.id] === "in" ? "none" : "in" } })}
                >
                  {channel.label} opt-in
                </button>
              ))}
            </div>
            <div className="panel-footer"><span>Opt-in is required before a person can be queued.</span><button className="primary-button" type="submit"><Plus size={15} /> Save contact</button></div>
          </form>
          <div className="crm-list">
            {store.contacts.length === 0 && <p className="crm-empty">No contacts yet. Add someone you already have permission to reach.</p>}
            {store.contacts.map((person: Contact) => (
              <article key={person.id} className="crm-card">
                <div>
                  <strong>{person.name}</strong>
                  <small>{person.organization || "No organization"} · {person.email || "No email"} · {person.phone || "No mobile"}</small>
                </div>
                <div className="chip-row">
                  {channels.map((channel) => (
                    <span key={channel.id} className={person.consent[channel.id] === "in" ? "in" : ""}>{label(channel.id)} {person.consent[channel.id] === "in" ? "in" : "off"}</span>
                  ))}
                </div>
                <button className="icon-button" aria-label={`Remove ${person.name}`} onClick={() => { removeContact(person.id); refresh(); }}><Trash2 size={14} /></button>
              </article>
            ))}
          </div>
        </div>
      )}

      {tab === "campaigns" && (
        <div className="crm-grid">
          <form className="input-panel" onSubmit={(event) => { event.preventDefault(); addCampaign(); }}>
            <div className="panel-label"><Mail size={14} /> DRAFT A CAMPAIGN</div>
            <div className="field-grid">
              <label className="field"><span>NAME</span><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Frontage follow-up" /></label>
              <label className="field"><span>CHANNEL</span>
                <select value={draft.channel} onChange={(event) => setDraft({ ...draft, channel: event.target.value as Channel })}>
                  {channels.map((channel) => <option key={channel.id} value={channel.id}>{channel.label}</option>)}
                </select>
              </label>
            </div>
            {draft.channel === "email" && <label className="field prompt-field"><span>SUBJECT</span><input value={draft.subject} onChange={(event) => setDraft({ ...draft, subject: event.target.value })} placeholder="What we saw at the site" /></label>}
            <label className="field prompt-field"><span>MESSAGE</span><textarea rows={4} value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} placeholder="Write the note a person would actually receive. Do not invent pricing." /></label>
            <p className="audience-note">{preview.eligible.length} of {preview.total} contacts can be queued on {label(draft.channel)}. {preview.excluded} excluded for missing opt-in or address.</p>
            <div className="panel-footer"><span>Saving does not send.</span><button className="primary-button" type="submit">Save draft</button></div>
          </form>
          <div className="crm-list">
            {store.campaigns.length === 0 && <p className="crm-empty">No campaigns yet.</p>}
            {store.campaigns.map((campaign) => {
              const held = store.deliveries.filter((delivery) => delivery.campaignId === campaign.id);
              return (
                <article key={campaign.id} className="crm-card">
                  <div>
                    <strong>{campaign.name}</strong>
                    <small>{label(campaign.channel)} · {campaign.subject || "No subject"} · {held.length ? `${held.length} held queue${held.length === 1 ? "" : "s"}` : "Draft"}</small>
                    <p>{campaign.body}</p>
                  </div>
                  <button className="outline-button" onClick={() => queue(campaign)}>Queue locally</button>
                </article>
              );
            })}
            {store.deliveries.length > 0 && <div className="held-log">{store.deliveries.slice(0, 6).map((delivery) => (
              <p key={delivery.id}><span>HELD</span> {delivery.campaignName} · {delivery.recipientIds.length} {delivery.recipientIds.length === 1 ? "person" : "people"} · {delivery.excluded} excluded · not delivered</p>
            ))}</div>}
          </div>
        </div>
      )}

      {tab === "automations" && (
        <div className="crm-grid">
          <form className="input-panel" onSubmit={(event) => { event.preventDefault(); addRule(); }}>
            <div className="panel-label"><ShieldCheck size={14} /> WHEN THIS HAPPENS</div>
            <label className="field"><span>NAME</span><input value={rule.name} onChange={(event) => setRule({ ...rule, name: event.target.value })} /></label>
            <div className="field-grid">
              <label className="field"><span>TRIGGER</span>
                <select value={rule.trigger} onChange={(event) => setRule({ ...rule, trigger: event.target.value as "brief" | "activate" })}>
                  <option value="brief">Brief is exported</option>
                  <option value="activate">Activate is opened</option>
                </select>
              </label>
              <label className="field"><span>CAMPAIGN</span>
                <select value={rule.campaignId} onChange={(event) => setRule({ ...rule, campaignId: event.target.value })}>
                  <option value="">Choose a draft</option>
                  {store.campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
                </select>
              </label>
            </div>
            <p className="audience-note">A trigger queues the opted-in audience only. It never sends the message.</p>
            <div className="panel-footer"><span>Needs a saved campaign.</span><button className="primary-button" type="submit" disabled={!store.campaigns.length}>Save automation</button></div>
          </form>
          <div className="crm-list">
            {store.automations.length === 0 && <p className="crm-empty">No automations. Exporting a brief will not queue anyone until you add one.</p>}
            {store.automations.map((item) => {
              const campaign = store.campaigns.find((entry) => entry.id === item.campaignId);
              return (
                <article key={item.id} className="crm-card">
                  <div>
                    <strong>{item.name}</strong>
                    <small>{item.trigger === "brief" ? "On brief export" : "On Activate"} · {campaign?.name || "Missing campaign"}</small>
                  </div>
                  <button className={`toggle ${item.enabled ? "on" : ""}`} role="switch" aria-checked={item.enabled} onClick={() => { setAutomationEnabled(item.id, !item.enabled); refresh(); }}><i /></button>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
