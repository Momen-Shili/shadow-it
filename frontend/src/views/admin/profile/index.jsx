import { useState, useEffect } from "react";
import { FaGithub, FaStar } from "react-icons/fa";
import { SiTrello, SiSlack, SiGoogledrive } from "react-icons/si";
import {
  MdEmail,
  MdPerson,
  MdShield,
  MdCircle,
  MdOpenInNew,
} from "react-icons/md";

import Card from "components/card";
import Banner from "./components/Banner";
import General from "./components/General";
import { useAuth } from "context/AuthContext";
import api from "services/api";

/* ── Account Info ── */
function AccountInfo({ user }) {
  const fields = [
    {
      icon: <MdPerson className="h-4 w-4" />,
      label: "Nom complet",
      value: user?.name ?? "—",
    },
    {
      icon: <MdEmail className="h-4 w-4" />,
      label: "Email",
      value: user?.email ?? "—",
    },
    {
      icon: <MdShield className="h-4 w-4" />,
      label: "Role",
      value: user?.role
        ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
        : "—",
    },
  ];

  return (
    <Card extra="w-full h-full p-5 flex flex-col gap-4">
      <h4 className="text-xl font-bold text-navy-700 dark:text-white">
        Infos Compte
      </h4>
      <div className="flex flex-col gap-3">
        {fields.map(({ icon, label, value }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-2xl bg-lightPrimary px-4 py-3 dark:bg-navy-700"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-brand-500 shadow-sm dark:bg-navy-600 dark:text-white">
              {icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                {label}
              </p>
              <p className="truncate text-sm font-semibold text-navy-700 dark:text-white">
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Connected Services (static badge list) ── */
const SERVICES = [
  {
    key: "github",
    label: "GitHub",
    icon: <FaGithub className="h-5 w-5" />,
    color: "bg-gray-800",
  },
  {
    key: "trello",
    label: "Trello",
    icon: <SiTrello className="h-5 w-5" />,
    color: "bg-blue-500",
  },
  {
    key: "slack",
    label: "Slack",
    icon: <SiSlack className="h-5 w-5" />,
    color: "bg-[#E01E5A]",
  },
  {
    key: "drive",
    label: "Google Drive",
    icon: <SiGoogledrive className="h-5 w-5" />,
    color: "bg-brand-500",
  },
];

function ConnectedServices({ health, loadingHealth }) {
  return (
    <Card extra="w-full h-full p-5 flex flex-col gap-4">
      <h4 className="text-xl font-bold text-navy-700 dark:text-white">
        Services connectés
      </h4>
      <div className="flex flex-col gap-3">
        {SERVICES.map(({ key, label, icon, color }) => (
          <div
            key={key}
            className="flex items-center justify-between rounded-2xl bg-lightPrimary px-4 py-3 dark:bg-navy-700"
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white ${color}`}
              >
                {icon}
              </span>
              <span className="text-sm font-semibold text-navy-700 dark:text-white">
                {label}
              </span>
            </div>
            {loadingHealth ? (
              <div className="h-5 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-navy-600" />
            ) : health[key] ? (
              <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <MdCircle className="h-2 w-2" /> Connecté
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <MdCircle className="h-2 w-2" /> Déconnecté
              </span>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Connected Services Details ── */
function ConnectedServicesDetails({ serviceStats, loadingStats }) {
  const rows = [
    {
      key: "github",
      label: "GitHub",
      icon: <FaGithub className="h-5 w-5" />,
      color: "bg-gray-800",
      description: serviceStats.github
        ? `${serviceStats.github.repos.toLocaleString()} dépôt${serviceStats.github.repos !== 1 ? "s" : ""} · ${serviceStats.github.stars.toLocaleString()} étoile${serviceStats.github.stars !== 1 ? "s" : ""}`
        : null,
    },
    {
      key: "trello",
      label: "Trello",
      icon: <SiTrello className="h-5 w-5" />,
      color: "bg-blue-500",
      description: serviceStats.trello
        ? `${serviceStats.trello.boards.toLocaleString()} tableau${serviceStats.trello.boards !== 1 ? "x" : ""}`
        : null,
    },
    {
      key: "slack",
      label: "Slack",
      icon: <SiSlack className="h-5 w-5" />,
      color: "bg-[#E01E5A]",
      description: serviceStats.slack
        ? `${serviceStats.slack.channels.toLocaleString()} ${serviceStats.slack.channels !== 1 ? "canaux" : "canal"}`
        : null,
    },
    {
      key: "drive",
      label: "Google Drive",
      icon: <SiGoogledrive className="h-5 w-5" />,
      color: "bg-brand-500",
      description: serviceStats.drive
        ? `${serviceStats.drive.files.toLocaleString()} fichier${serviceStats.drive.files !== 1 ? "s" : ""} en Drive`
        : null,
    },
  ];

  return (
    <Card extra="w-full h-full p-5">
      <div className="mb-6">
        <h4 className="text-xl font-bold text-navy-700 dark:text-white">
          Détails des services connectés
        </h4>
        <p className="mt-1 text-sm text-gray-500">
          Statistiques en temps réel récupérées depuis chaque service connecté.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {rows.map(({ key, label, icon, color, description }) => (
          <div
            key={key}
            className="flex items-center gap-4 rounded-2xl bg-white px-4 py-4 shadow-3xl shadow-shadow-500 dark:!bg-navy-700 dark:shadow-none"
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${color}`}
            >
              {icon}
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-navy-700 dark:text-white">
                {label}
              </p>
              {loadingStats ? (
                <div className="mt-1 h-3 w-32 animate-pulse rounded bg-gray-200 dark:bg-navy-600" />
              ) : description ? (
                <p className="mt-0.5 text-xs text-gray-500">{description}</p>
              ) : (
                <p className="mt-0.5 text-xs italic text-gray-400">
                  Non connecté
                </p>
              )}
            </div>
            {description && !loadingStats && (
              <MdCircle className="h-2.5 w-2.5 shrink-0 text-green-500" />
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Activity Summary ── */
function ActivitySummary({ serviceStats, loadingStats }) {
  const cards = [
    {
      icon: <FaGithub className="h-6 w-6" />,
      bg: "bg-gray-800",
      label: "Dépôts GitHub",
      value: serviceStats.github?.repos,
    },
    {
      icon: <FaStar className="h-6 w-6" />,
      bg: "bg-yellow-400",
      label: "Étoiles totales",
      value: serviceStats.github?.stars,
    },
    {
      icon: <SiTrello className="h-6 w-6" />,
      bg: "bg-blue-500",
      label: "Tableaux Trello",
      value: serviceStats.trello?.boards,
    },
    {
      icon: <SiSlack className="h-6 w-6" />,
      bg: "bg-[#E01E5A]",
      label: "Canaux Slack",
      value: serviceStats.slack?.channels,
    },
  ];

  return (
    <Card extra="w-full p-5">
      <div className="mb-5">
        <h4 className="text-xl font-bold text-navy-700 dark:text-white">
          Résumé d'activité
        </h4>
        <p className="mt-1 text-sm text-gray-500">
          Totaux agrégés sur l'ensemble des services connectés.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ icon, bg, label, value }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-3 rounded-2xl bg-lightPrimary px-4 py-6 dark:bg-navy-700"
          >
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-full text-white ${bg}`}
            >
              {icon}
            </span>
            {loadingStats ? (
              <div className="h-6 w-16 animate-pulse rounded bg-gray-200 dark:bg-navy-600" />
            ) : (
              <p className="text-2xl font-bold text-navy-700 dark:text-white">
                {value !== undefined ? value.toLocaleString() : "—"}
              </p>
            )}
            <p className="text-center text-sm font-medium text-gray-500">
              {label}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Page ── */
export default function ProfileOverview() {
  const { user } = useAuth();

  const [health, setHealth] = useState({
    github: false,
    trello: false,
    slack: false,
    drive: false,
  });
  const [serviceStats, setServiceStats] = useState({});
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    async function load() {
      const [ghRes, trRes, slRes, drRes] = await Promise.allSettled([
        api.get("/github/repos"),
        api.get("/trello/boards"),
        api.get("/slack/channels"),
        api.get("/google/files"),
      ]);

      setHealth({
        github: ghRes.status === "fulfilled",
        trello: trRes.status === "fulfilled",
        slack: slRes.status === "fulfilled",
        drive: drRes.status === "fulfilled",
      });

      const stats = {};
      if (ghRes.status === "fulfilled") {
        const repos = ghRes.value.data.data ?? [];
        stats.github = {
          repos: repos.length,
          stars: repos.reduce((s, r) => s + (r.stargazers_count ?? 0), 0),
        };
      }
      if (trRes.status === "fulfilled") {
        stats.trello = { boards: (trRes.value.data.data ?? []).length };
      }
      if (slRes.status === "fulfilled") {
        stats.slack = { channels: (slRes.value.data.data ?? []).length };
      }
      if (drRes.status === "fulfilled") {
        stats.drive = { files: (drRes.value.data.data ?? []).length };
      }

      setServiceStats(stats);
      setLoadingHealth(false);
      setLoadingStats(false);
    }
    load();
  }, []);

  return (
    <div className="flex w-full flex-col gap-5">
      {/* ── Row 1: Banner · Account Info · Connected Services ── */}
      <div className="mt-3 grid w-full grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Banner />
        </div>
        <div className="lg:col-span-4">
          <AccountInfo user={user} />
        </div>
        <div className="lg:col-span-4">
          <ConnectedServices health={health} loadingHealth={loadingHealth} />
        </div>
      </div>

      {/* ── Row 2: Services Details · General Info ── */}
      <div className="grid w-full grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ConnectedServicesDetails
            serviceStats={serviceStats}
            loadingStats={loadingStats}
          />
        </div>
        <div className="lg:col-span-5">
          <General />
        </div>
      </div>

      {/* ── Row 3: Activity Summary ── */}
      <ActivitySummary
        serviceStats={serviceStats}
        loadingStats={loadingStats}
      />
    </div>
  );
}
