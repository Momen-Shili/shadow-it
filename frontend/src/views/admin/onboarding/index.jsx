import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdDashboard, MdCheck, MdArrowForward, MdOpenInNew } from "react-icons/md";
import { FaGithub } from "react-icons/fa";
import { SiTrello, SiSlack } from "react-icons/si";
import api from "services/api";

const STEPS = [
  {
    id: 1,
    service: "github",
    label: "GitHub",
    icon: <FaGithub className="h-6 w-6" />,
    color: "bg-gray-800",
    description:
      "Connectez votre compte GitHub pour afficher vos repos, commits et statistiques.",
    helpText: "Créez un Personal Access Token (classic) avec les scopes : repo, read:user",
    helpUrl: "https://github.com/settings/tokens",
    fields: [
      { key: "github_token", label: "Personal Access Token", placeholder: "ghp_xxxxxxxxxxxxxxxx", type: "password" },
    ],
  },
  {
    id: 2,
    service: "trello",
    label: "Trello",
    icon: <SiTrello className="h-6 w-6" />,
    color: "bg-blue-500",
    description:
      "Connectez Trello pour visualiser vos boards, listes et cartes.",
    helpText: "Récupérez votre API Key sur la page développeur Trello, puis générez un Token.",
    helpUrl: "https://trello.com/app-key",
    fields: [
      { key: "trello_api_key", label: "API Key", placeholder: "Votre Trello API Key", type: "text" },
      { key: "trello_token",   label: "Token",   placeholder: "Votre Trello Token",   type: "password" },
    ],
  },
  {
    id: 3,
    service: "slack",
    label: "Slack",
    icon: <SiSlack className="h-6 w-6" />,
    color: "bg-[#E01E5A]",
    description:
      "Connectez Slack pour accéder à vos channels et messages récents.",
    helpText: "Créez une Slack App, ajoutez les scopes channels:read et conversations:history, puis installez-la.",
    helpUrl: "https://api.slack.com/apps",
    fields: [
      { key: "slack_token", label: "Bot Token", placeholder: "xoxb-xxxx-xxxx-xxxx", type: "password" },
    ],
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep]     = useState(0); // 0-indexed
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState(null);

  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;

  function setValue(key, val) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  function stepFilled() {
    return current.fields.every((f) => (values[f.key] ?? "").trim() !== "");
  }

  async function finish(skip = false) {
    setError(null);
    if (skip) {
      if (isLast) {
        await saveAndRedirect();
      } else {
        setStep((s) => s + 1);
      }
      return;
    }
    if (isLast) {
      await saveAndRedirect();
    } else {
      setStep((s) => s + 1);
    }
  }

  async function saveAndRedirect() {
    const payload = {};
    for (const [key, val] of Object.entries(values)) {
      if (val && val.trim()) payload[key] = val.trim();
    }

    if (Object.keys(payload).length > 0) {
      setSaving(true);
      try {
        await api.post("/keys", payload);
      } catch (err) {
        setError(err.response?.data?.error || "Erreur lors de la sauvegarde des clés.");
        setSaving(false);
        return;
      }
      setSaving(false);
    }
    navigate("/admin/default", { replace: true });
  }

  return (
    <div className="flex min-h-screen w-full items-start justify-center bg-lightPrimary px-4 py-16 dark:bg-navy-900">
      <div className="w-full max-w-lg">
        {/* Brand */}
        <div className="mb-10 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500">
            <MdDashboard className="h-5 w-5 text-white" />
          </div>
          <span className="font-poppins text-2xl font-bold text-navy-700 dark:text-white">
            Nexa<span className="font-light text-brand-500">Board</span>
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-8 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  i < step
                    ? "bg-brand-500 text-white"
                    : i === step
                    ? "bg-brand-500 text-white ring-4 ring-brand-500/20"
                    : "bg-gray-200 text-gray-500 dark:bg-navy-700 dark:text-gray-400"
                }`}
              >
                {i < step ? <MdCheck className="h-4 w-4" /> : s.id}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 rounded-full transition-colors ${
                    i < step ? "bg-brand-500" : "bg-gray-200 dark:bg-navy-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Card */}
        <div className="rounded-2xl bg-white p-8 shadow-xl dark:bg-navy-800">
          {/* Header */}
          <div className="mb-6 flex items-center gap-4">
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white ${current.color}`}
            >
              {current.icon}
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Étape {step + 1} sur {STEPS.length}
              </p>
              <h3 className="text-xl font-bold text-navy-700 dark:text-white">
                Connecter {current.label}
              </h3>
            </div>
          </div>

          <p className="mb-5 text-sm text-gray-500">{current.description}</p>

          {/* Help box */}
          <div className="mb-5 flex items-start gap-2 rounded-xl bg-lightPrimary px-4 py-3 dark:bg-navy-700">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">{current.helpText}</p>
            </div>
            <a
              href={current.helpUrl}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-brand-500 hover:text-brand-600"
            >
              <MdOpenInNew className="h-4 w-4" />
            </a>
          </div>

          {/* Fields */}
          <div className="flex flex-col gap-4">
            {current.fields.map((f) => (
              <div key={f.key}>
                <label className="mb-1.5 block text-sm font-semibold text-navy-700 dark:text-white">
                  {f.label}
                </label>
                <input
                  type={f.type}
                  placeholder={f.placeholder}
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValue(f.key, e.target.value)}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-white/0 px-3 text-sm text-navy-700 outline-none placeholder:text-gray-400 focus:border-brand-500 dark:border-white/10 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>
            ))}
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => finish(true)}
              disabled={saving}
              className="text-sm font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {isLast ? "Terminer sans sauvegarder" : "Passer cette étape"}
            </button>

            <button
              type="button"
              onClick={() => finish(false)}
              disabled={saving || !stepFilled()}
              className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 active:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Sauvegarde…" : isLast ? "Terminer" : "Suivant"}
              {!saving && <MdArrowForward className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Step labels */}
        <div className="mt-4 flex justify-between px-1">
          {STEPS.map((s) => (
            <span key={s.id} className="text-[10px] font-medium text-gray-400">
              {s.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
