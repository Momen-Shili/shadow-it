import { useState, useEffect } from "react";
import { FaGithub } from "react-icons/fa";
import { SiTrello, SiSlack } from "react-icons/si";
import { MdCircle, MdOpenInNew, MdDelete, MdSave } from "react-icons/md";
import Card from "components/card";
import api from "services/api";

/* ── Service definition ── */
const SERVICES = [
  {
    key: "github",
    label: "GitHub",
    icon: <FaGithub className="h-6 w-6" />,
    color: "bg-gray-800",
    helpUrl: "https://github.com/settings/tokens",
    helpLabel: "Créer un Personal Access Token",
    fields: [
      { key: "github_token", label: "Personal Access Token", placeholder: "ghp_xxxxxxxxxxxxxxxxxxxx", type: "password" },
    ],
  },
  {
    key: "trello",
    label: "Trello",
    icon: <SiTrello className="h-6 w-6" />,
    color: "bg-blue-500",
    helpUrl: "https://trello.com/app-key",
    helpLabel: "Obtenir les clés Trello",
    fields: [
      { key: "trello_api_key", label: "API Key",  placeholder: "Votre Trello API Key", type: "text" },
      { key: "trello_token",   label: "Token",    placeholder: "Votre Trello Token",   type: "password" },
    ],
  },
  {
    key: "slack",
    label: "Slack",
    icon: <SiSlack className="h-6 w-6" />,
    color: "bg-[#E01E5A]",
    helpUrl: "https://api.slack.com/apps",
    helpLabel: "Créer une Slack App",
    fields: [
      { key: "slack_token", label: "Bot Token", placeholder: "xoxb-xxxx-xxxx-xxxx", type: "password" },
    ],
  },
];

/* ── Single service card ── */
function ServiceCard({ service, configured, onSaved, onDeleted }) {
  const [values, setValues]   = useState({});
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveOk, setSaveOk]   = useState(false);
  const [error, setError]     = useState(null);

  function setValue(key, val) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  function allFilled() {
    return service.fields.every((f) => (values[f.key] ?? "").trim() !== "");
  }

  async function handleSave() {
    setError(null);
    setSaving(true);
    const payload = {};
    for (const f of service.fields) {
      payload[f.key] = (values[f.key] ?? "").trim();
    }
    try {
      await api.post("/keys", payload);
      setSaveOk(true);
      setValues({});
      setTimeout(() => setSaveOk(false), 2500);
      onSaved(service.key);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur de sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Supprimer la clé ${service.label} ?`)) return;
    setDeleting(true);
    try {
      await api.delete(`/keys/${service.key}`);
      onDeleted(service.key);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur de suppression.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card extra="p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${service.color}`}
          >
            {service.icon}
          </span>
          <div>
            <h4 className="text-base font-bold text-navy-700 dark:text-white">
              {service.label}
            </h4>
            <a
              href={service.helpUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs text-brand-500 hover:underline"
            >
              {service.helpLabel} <MdOpenInNew className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {configured ? (
            <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <MdCircle className="h-2 w-2" /> Configuré
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500 dark:bg-navy-700">
              <MdCircle className="h-2 w-2" /> Non configuré
            </span>
          )}
          {configured && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              title={`Supprimer la clé ${service.label}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-900/20"
            >
              <MdDelete className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-3">
        {service.fields.map((f) => (
          <div key={f.key}>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {f.label}
              {configured && (
                <span className="ml-2 text-[10px] font-normal normal-case text-gray-400">
                  (laisser vide pour conserver l'existante)
                </span>
              )}
            </label>
            <input
              type={f.type}
              placeholder={configured ? "••••••••••••••••" : f.placeholder}
              value={values[f.key] ?? ""}
              onChange={(e) => setValue(f.key, e.target.value)}
              className="h-10 w-full rounded-xl border border-gray-200 bg-white/0 px-3 text-sm text-navy-700 outline-none placeholder:text-gray-400 focus:border-brand-500 dark:border-white/10 dark:text-white dark:placeholder:text-gray-500"
            />
          </div>
        ))}
      </div>

      {/* Feedback */}
      {saveOk && (
        <p className="mt-3 text-xs font-medium text-green-600 dark:text-green-400">
          ✓ Clé sauvegardée avec succès
        </p>
      )}
      {error && (
        <p className="mt-3 text-xs text-red-500">{error}</p>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving || !allFilled()}
        className="mt-4 flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <MdSave className="h-4 w-4" />
        {saving ? "Sauvegarde…" : configured ? "Mettre à jour" : "Sauvegarder"}
      </button>
    </Card>
  );
}

/* ── Page ── */
export default function SettingsPage() {
  const [keyStatus, setKeyStatus] = useState({ has_github: false, has_trello: false, has_slack: false });
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    api
      .get("/keys")
      .then(({ data }) => setKeyStatus(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function isConfigured(serviceKey) {
    if (serviceKey === "github") return keyStatus.has_github;
    if (serviceKey === "trello") return keyStatus.has_trello;
    if (serviceKey === "slack")  return keyStatus.has_slack;
    return false;
  }

  function handleSaved(serviceKey) {
    const map = { github: "has_github", trello: "has_trello", slack: "has_slack" };
    setKeyStatus((prev) => ({ ...prev, [map[serviceKey]]: true }));
  }

  function handleDeleted(serviceKey) {
    const map = { github: "has_github", trello: "has_trello", slack: "has_slack" };
    setKeyStatus((prev) => ({ ...prev, [map[serviceKey]]: false }));
  }

  return (
    <div className="mt-3 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-navy-700 dark:text-white">
            Paramètres API
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Configurez vos clés d'accès pour chaque service intégré.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-lightPrimary px-4 py-2 dark:bg-navy-700">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {[keyStatus.has_github, keyStatus.has_trello, keyStatus.has_slack].filter(Boolean).length}
            /3 configurés
          </span>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} extra="p-5">
              <div className="flex animate-pulse flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gray-200 dark:bg-navy-700" />
                  <div className="flex flex-col gap-2">
                    <div className="h-4 w-24 rounded bg-gray-200 dark:bg-navy-700" />
                    <div className="h-3 w-32 rounded bg-gray-200 dark:bg-navy-700" />
                  </div>
                </div>
                <div className="h-10 w-full rounded-xl bg-gray-200 dark:bg-navy-700" />
                <div className="h-9 w-28 rounded-xl bg-gray-200 dark:bg-navy-700" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          {SERVICES.map((service) => (
            <ServiceCard
              key={service.key}
              service={service}
              configured={isConfigured(service.key)}
              onSaved={handleSaved}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
