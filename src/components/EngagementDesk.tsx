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
  const [contact, setContact] = useState({
    name: "",
    organization: "",
    email: "",
    phone: "",
    note: "",
    consent: blankConsent(),
  });
  const [draft, setDraft] = useState({
    name: "",
    channel: "email" as Channel,
    subject: "",
    body: "",
  });
  const [rule, setRule] = useState({
    name: "Residential dossier follow-up",
    trigger: "brief" as "brief" | "activate",
    campaignId: "",
  });

  const refresh = () => setStore(loadCrm());
  const preview = audience(draft.channel);

  const addContact = () => {
    if (!contact.name.trim()) {
      onNotify("A homeowner or partner record needs a name.");
      return;
    }
    saveContact(contact);
    setContact({ name: "", organization: "", email: "", phone: "", note: "", consent: blankConsent() });
    refresh();
    onNotify("Homeowner record saved in The Vault. No messages are dispatched without explicit opt-in.");
  };

  const addCampaign = () => {
    if (!draft.name.trim() || !draft.body.trim()) {
      onNotify("An outreach sequence needs a name and a message.");
      return;
    }
    if (draft.channel === "email" && !draft.subject.trim()) {
      onNotify("Email dispatches need a subject line.");
      return;
    }
    const saved = saveCampaign(draft);
    setDraft({ name: "", channel: draft.channel, subject: "", body: "" });
    setRule((current) => ({ ...current, campaignId: current.campaignId || saved.id }));
    refresh();
    onNotify("Outreach sequence saved as a local draft in The Vault.");
  };

  const queue = (campaign: Campaign) => {
    const result = queueCampaign(campaign.id);
    refresh();
    onNotify(result.message);
  };

  const addRule = () => {
    if (!rule.campaignId) {
      onNotify("Select an outreach sequence before enabling an automation rule.");
      return;
    }
    saveAutomation({ ...rule, enabled: true });
    refresh();
    onNotify("Automation rule active in The Vault. Queues locally in this browser.");
  };

  return (
    <section className="crm">
      <div className="channel-row">
        {channels.map((channel) => (
          <div key={channel.id} className="channel-card">
            <channel.icon size={15} />
            <div>
              <strong>{channel.label}</strong>
              <span>Local sandbox</span>
            </div>
          </div>
        ))}
        <p>
          <ShieldCheck size={14} /> The Vault holds outreach queues locally in this browser. No external email, SMS, or WhatsApp is transmitted.
        </p>
      </div>

      <div className="crm-tabs">
        {(["people", "campaigns", "automations"] as const).map((item) => (
          <button key={item} className={tab === item ? "on" : ""} onClick={() => setTab(item)}>
            {item === "people" ? "Homeowners & Trade Partners" : item === "campaigns" ? "Outreach Sequences" : "Workflow Triggers"}
          </button>
        ))}
      </div>

      {tab === "people" && (
        <div className="crm-grid">
          <div className="crm-panel">
            <span className="section-mini">THE VAULT · ADD RECORD</span>
            <h3>Homeowner or Trade Specialist</h3>
            <p className="crm-copy">
              Record explicit consent per channel. Only opted-in records with a valid address enter an outreach queue.
            </p>
            <div className="field-grid">
              <label className="field">
                <span>FULL NAME</span>
                <input
                  value={contact.name}
                  onChange={(e) => setContact({ ...contact, name: e.target.value })}
                  placeholder="Elena Vance"
                />
              </label>
              <label className="field">
                <span>RESIDENCE / PARCEL OR TRADE FIRM</span>
                <input
                  value={contact.organization}
                  onChange={(e) => setContact({ ...contact, organization: e.target.value })}
                  placeholder="742 Crestwood Ln · Homeowner"
                />
              </label>
              <label className="field">
                <span>EMAIL</span>
                <input
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  placeholder="elena@example.com"
                />
              </label>
              <label className="field">
                <span>PHONE</span>
                <input
                  value={contact.phone}
                  onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                  placeholder="+1 512 555 0148"
                />
              </label>
            </div>
            <div className="consent-grid">
              {channels.map((channel) => (
                <label key={channel.id} className="field">
                  <span>{channel.label.toUpperCase()} CONSENT</span>
                  <select
                    value={contact.consent[channel.id]}
                    onChange={(e) =>
                      setContact({
                        ...contact,
                        consent: { ...contact.consent, [channel.id]: e.target.value as Consent },
                      })
                    }
                  >
                    <option value="none">Not recorded</option>
                    <option value="in">Opted in</option>
                    <option value="out">Opted out</option>
                  </select>
                </label>
              ))}
            </div>
            <label className="field prompt-field">
              <span>RESIDENTIAL SCOPE & CONSENT NOTE</span>
              <textarea
                rows={2}
                value={contact.note}
                onChange={(e) => setContact({ ...contact, note: e.target.value })}
                placeholder="Requested standing-seam roof & limewash facade dossier after walk-through."
              />
            </label>
            <button className="primary-button" onClick={addContact}>
              <Plus size={15} /> Save to The Vault
            </button>
          </div>

          <div className="crm-panel">
            <div className="list-heading">
              <div>
                <span className="section-mini">THE VAULT PIPELINE</span>
                <h3>Saved Homeowners & Partners</h3>
              </div>
              <span className="count-pill">{store.contacts.length}</span>
            </div>
            {store.contacts.length === 0 ? (
              <div className="crm-empty">
                <Users size={18} />
                <p>No homeowner or trade records yet. Add a record to prepare residential brief handoffs.</p>
              </div>
            ) : (
              <div className="crm-list">
                {store.contacts.map((item: Contact) => (
                  <div key={item.id} className="crm-row">
                    <div>
                      <strong>{item.name}</strong>
                      <small>
                        {[item.organization, item.email, item.phone].filter(Boolean).join(" · ") || "No address on file"}
                      </small>
                      {item.note && <p>{item.note}</p>}
                      <div className="consent-badges">
                        {channels.map((ch) => (
                          <span key={ch.id} className={item.consent[ch.id] === "in" ? "in" : ""}>
                            {ch.label}: {item.consent[ch.id]}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      className="icon-button"
                      onClick={() => {
                        removeContact(item.id);
                        refresh();
                      }}
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "campaigns" && (
        <div className="crm-grid">
          <div className="crm-panel">
            <span className="section-mini">OUTREACH SEQUENCE</span>
            <h3>Draft a Homeowner or Trade Brief</h3>
            <div className="field-grid">
              <label className="field">
                <span>SEQUENCE NAME</span>
                <input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Crestwood Exterior Upgrade Dossier"
                />
              </label>
              <label className="field">
                <span>CHANNEL</span>
                <select
                  value={draft.channel}
                  onChange={(e) => setDraft({ ...draft, channel: e.target.value as Channel })}
                >
                  <option value="email">Email</option>
                  <option value="sms">Text</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </label>
            </div>
            {draft.channel === "email" && (
              <label className="field prompt-field">
                <span>SUBJECT</span>
                <input
                  value={draft.subject}
                  onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                  placeholder="Your FACET Residential Upgrade & Scope Dossier"
                />
              </label>
            )}
            <label className="field prompt-field">
              <span>MESSAGE</span>
              <textarea
                rows={4}
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                placeholder="Share the visual findings, rendered architectural upgrades from The Loupe, and recommended trade next steps."
              />
            </label>
            <p className="crm-copy">
              Eligible on {label(draft.channel)}: <strong>{preview.eligible.length}</strong> opted in ·{" "}
              <strong>{preview.excluded}</strong> excluded.
            </p>
            <button className="primary-button" onClick={addCampaign}>
              <Plus size={15} /> Save sequence draft
            </button>
          </div>

          <div className="crm-panel">
            <div className="list-heading">
              <div>
                <span className="section-mini">OUTREACH QUEUE</span>
                <h3>Drafts & Held Dispatches</h3>
              </div>
              <span className="count-pill">{store.campaigns.length}</span>
            </div>
            {store.campaigns.length === 0 ? (
              <div className="crm-empty">
                <Mail size={18} />
                <p>No outreach sequences drafted yet.</p>
              </div>
            ) : (
              <div className="crm-list">
                {store.campaigns.map((item) => (
                  <div key={item.id} className="crm-row">
                    <div>
                      <strong>{item.name}</strong>
                      <small>
                        {label(item.channel).toUpperCase()}
                        {item.subject ? ` · ${item.subject}` : ""}
                      </small>
                      <p>{item.body}</p>
                    </div>
                    <button className="outline-button" onClick={() => queue(item)}>
                      Queue
                    </button>
                  </div>
                ))}
              </div>
            )}
            {store.deliveries.length > 0 && (
              <div className="delivery-log">
                <span className="section-mini">HELD IN BROWSER</span>
                {store.deliveries.map((item) => (
                  <div key={item.id} className="delivery-row">
                    <strong>{item.campaignName}</strong>
                    <span>
                      {item.recipientIds.length} queued · {item.excluded} excluded · {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "automations" && (
        <div className="crm-grid">
          <div className="crm-panel">
            <span className="section-mini">LOCAL WORKFLOW TRIGGER</span>
            <h3>Queue on Dossier Milestones</h3>
            <div className="field-grid">
              <label className="field">
                <span>RULE NAME</span>
                <input
                  value={rule.name}
                  onChange={(e) => setRule({ ...rule, name: e.target.value })}
                  placeholder="Story dossier follow-up"
                />
              </label>
              <label className="field">
                <span>WHEN</span>
                <select
                  value={rule.trigger}
                  onChange={(e) => setRule({ ...rule, trigger: e.target.value as "brief" | "activate" })}
                >
                  <option value="brief">Property dossier is exported</option>
                  <option value="activate">Story stage is opened</option>
                </select>
              </label>
            </div>
            <label className="field prompt-field">
              <span>SEQUENCE</span>
              <select value={rule.campaignId} onChange={(e) => setRule({ ...rule, campaignId: e.target.value })}>
                <option value="">Choose a saved sequence</option>
                {store.campaigns.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({label(item.channel)})
                  </option>
                ))}
              </select>
            </label>
            <button className="primary-button" onClick={addRule}>
              <Plus size={15} /> Save automation
            </button>
          </div>

          <div className="crm-panel">
            <div className="list-heading">
              <div>
                <span className="section-mini">RULES</span>
                <h3>Saved Triggers</h3>
              </div>
              <span className="count-pill">{store.automations.length}</span>
            </div>
            {store.automations.length === 0 ? (
              <div className="crm-empty">
                <ShieldCheck size={18} />
                <p>No triggers configured yet.</p>
              </div>
            ) : (
              <div className="crm-list">
                {store.automations.map((item) => (
                  <div key={item.id} className="crm-row">
                    <div>
                      <strong>{item.name}</strong>
                      <small>
                        Trigger: {item.trigger === "brief" ? "Export dossier" : "Open Story stage"}
                      </small>
                    </div>
                    <button
                      className={`toggle ${item.enabled ? "on" : ""}`}
                      role="switch"
                      aria-checked={item.enabled}
                      onClick={() => {
                        setAutomationEnabled(item.id, !item.enabled);
                        refresh();
                      }}
                    >
                      <i />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
