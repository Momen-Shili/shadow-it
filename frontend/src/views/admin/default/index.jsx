import { useState, useEffect } from "react";
import { FaGithub, FaStar, FaCodeBranch } from "react-icons/fa";
import { SiTrello, SiSlack, SiGoogledrive } from "react-icons/si";
import {
  MdLink,
  MdOpenInNew,
  MdCircle,
  MdTag,
  MdInsertDriveFile,
} from "react-icons/md";

import Widget from "components/widget/Widget";
import Card from "components/card";
import BarChart from "components/charts/BarChart";
import api from "services/api";

/* ── helpers ── */
function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "aujourd'hui";
  if (days === 1) return "hier";
  if (days < 30) return `il y a ${days}j`;
  const months = Math.floor(days / 30);
  return months < 12 ? `il y a ${months}mois` : `il y a ${Math.floor(months / 12)}an`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ── Skeleton row helper ── */
function SkeletonRows({ count = 5 }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-3">
          <div className="h-8 w-8 shrink-0 rounded-full bg-gray-200 dark:bg-navy-700" />
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-navy-700" />
            <div className="h-2.5 w-1/3 rounded bg-gray-200 dark:bg-navy-700" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Top-5 repos bar chart ── */
function TopReposChart({ repos, loading }) {
  const names = repos.map((r) =>
    r.name.length > 12 ? r.name.slice(0, 11) + "…" : r.name
  );
  const stars = repos.map((r) => r.stargazers_count ?? 0);

  const chartData = [{ name: "Étoiles", data: stars, color: "#4318FF" }];
  const chartOptions = {
    chart: { toolbar: { show: false }, parentHeightOffset: 0 },
    tooltip: { style: { fontSize: "12px" }, theme: "dark" },
    xaxis: {
      categories: names,
      labels: {
        style: { colors: "#A3AED0", fontSize: "12px", fontWeight: "500" },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { show: false },
    grid: {
      show: true,
      borderColor: "rgba(163,174,208,0.2)",
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
    },
    fill: { type: "solid", colors: ["#4318FF"] },
    dataLabels: { enabled: false },
    plotOptions: { bar: { borderRadius: 8, columnWidth: "40px" } },
    legend: { show: false },
  };

  return (
    <Card extra="flex flex-col bg-white w-full rounded-3xl py-6 px-2 text-center">
      <div className="mb-4 flex items-center justify-between px-6">
        <h2 className="text-lg font-bold text-navy-700 dark:text-white">
          Top 5 Dépôts par Étoiles
        </h2>
        <FaGithub className="h-5 w-5 text-gray-400" />
      </div>
      <div className="h-[250px] w-full xl:h-[300px]">
        {loading ? (
          <div className="flex h-full animate-pulse items-end justify-around gap-2 px-4 pb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-full rounded-t-xl bg-gray-200 dark:bg-navy-700"
                style={{ height: `${40 + i * 10}%` }}
              />
            ))}
          </div>
        ) : repos.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-300">
            <FaGithub className="h-8 w-8" />
            <p className="text-sm">Aucun dépôt trouvé</p>
          </div>
        ) : (
          <BarChart chartData={chartData} chartOptions={chartOptions} />
        )}
      </div>
    </Card>
  );
}

/* ── Recent GitHub activity feed ── */
function RecentActivityFeed({ repos, loading }) {
  return (
    <Card extra="!p-[20px]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-navy-700 dark:text-white">
          Activité GitHub Récente
        </h2>
        <FaGithub className="h-5 w-5 text-gray-400" />
      </div>
      {loading ? (
        <SkeletonRows count={5} />
      ) : repos.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-gray-300">
          <FaGithub className="h-8 w-8" />
          <p className="text-sm">Aucune activité récente</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {repos.map((repo, i) => (
            <div key={repo.id}>
              <div className="flex items-center gap-3 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lightPrimary dark:bg-navy-700">
                  <FaGithub className="h-4 w-4 text-brand-500 dark:text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="truncate text-sm font-semibold text-navy-700 dark:text-white">
                      {repo.name}
                    </p>
                    {repo.html_url && (
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 text-gray-400 hover:text-brand-500"
                      >
                        <MdOpenInNew className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    {repo.language && (
                      <span className="font-medium text-gray-500">
                        {repo.language}
                      </span>
                    )}
                    <span>·</span>
                    <span>Mis à jour {timeAgo(repo.updated_at)}</span>
                    {repo.stargazers_count > 0 && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <FaStar className="h-2.5 w-2.5 text-yellow-400" />
                          {repo.stargazers_count}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {i < repos.length - 1 && (
                <div className="h-px w-full bg-gray-100 dark:bg-white/5" />
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ── Unified Activity Feed ── */
function UnifiedActivityFeed({ events, loading }) {
  const SOURCE_STYLE = {
    github: {
      icon: <FaGithub className="h-4 w-4" />,
      bg: "bg-gray-800",
      label: "GitHub",
    },
    trello: {
      icon: <SiTrello className="h-4 w-4" />,
      bg: "bg-blue-500",
      label: "Trello",
    },
    slack: {
      icon: <SiSlack className="h-4 w-4" />,
      bg: "bg-[#E01E5A]",
      label: "Slack",
    },
    drive: {
      icon: <SiGoogledrive className="h-4 w-4" />,
      bg: "bg-brand-500",
      label: "Drive",
    },
  };

  return (
    <Card extra="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-navy-700 dark:text-white">
          Fil d'Activité
        </h2>
        <span className="rounded-full bg-lightPrimary px-3 py-1 text-xs font-semibold text-navy-700 dark:bg-navy-700 dark:text-white">
          Tous les Services
        </span>
      </div>
      {loading ? (
        <SkeletonRows count={8} />
      ) : events.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">
          Aucune activité à afficher.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/5">
          {events.map((ev, i) => {
            const style = SOURCE_STYLE[ev.source] ?? SOURCE_STYLE.github;
            return (
              <div key={i} className="flex items-center gap-3 py-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ${style.bg}`}
                >
                  {style.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-navy-700 dark:text-white">
                    {ev.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="font-semibold text-gray-500">
                      {style.label}
                    </span>
                    <span>·</span>
                    <span>{ev.time}</span>
                  </div>
                </div>
                {ev.url && (
                  <a
                    href={ev.url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-gray-300 hover:text-brand-500"
                  >
                    <MdOpenInNew className="h-4 w-4" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ── Service Health ── */
function ServiceHealth({ health, loading }) {
  const services = [
    { key: "github", label: "GitHub", icon: <FaGithub className="h-4 w-4" /> },
    { key: "trello", label: "Trello", icon: <SiTrello className="h-4 w-4" /> },
    { key: "slack", label: "Slack", icon: <SiSlack className="h-4 w-4" /> },
    {
      key: "drive",
      label: "Google Drive",
      icon: <SiGoogledrive className="h-4 w-4" />,
    },
  ];

  return (
    <Card extra="p-5 flex flex-col gap-4">
      <h2 className="text-lg font-bold text-navy-700 dark:text-white">
        Statut des Services
      </h2>
      <div className="flex flex-col gap-3">
        {services.map(({ key, label, icon }) => {
          const status = loading ? "loading" : health[key] ? "ok" : "error";
          return (
            <div
              key={key}
              className="flex items-center justify-between rounded-xl bg-lightPrimary px-4 py-3 dark:bg-navy-700"
            >
              <div className="flex items-center gap-3 text-navy-700 dark:text-white">
                <span className="text-gray-500 dark:text-gray-400">{icon}</span>
                <span className="text-sm font-semibold">{label}</span>
              </div>
              {status === "loading" ? (
                <div className="h-2.5 w-14 animate-pulse rounded-full bg-gray-300 dark:bg-navy-600" />
              ) : status === "ok" ? (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-green-500">
                  <MdCircle className="h-2.5 w-2.5" /> Connecté
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-red-400">
                  <MdCircle className="h-2.5 w-2.5" /> Déconnecté
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ── Recent Commits ── */
function RecentCommits() {
  const [repoName, setRepoName] = useState(null);
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/github/commits")
      .then(({ data }) => {
        const first = data.data?.[0];
        if (!first) return;
        setRepoName(first.repo);
        setCommits(first.commits.slice(0, 5));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card extra="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-navy-700 dark:text-white">
            Commits Récents
          </h2>
          {repoName && (
            <p className="mt-0.5 text-xs text-gray-400">{repoName}</p>
          )}
        </div>
        <FaCodeBranch className="h-5 w-5 text-gray-400" />
      </div>

      {loading ? (
        <SkeletonRows count={5} />
      ) : commits.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-gray-300">
          <FaGithub className="h-8 w-8" />
          <p className="text-sm">Aucun commit trouvé</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/5">
          {commits.map((c) => (
            <div key={c.sha} className="flex items-start gap-3 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-800 text-white">
                <FaGithub className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-navy-700 dark:text-white">
                  {c.message}
                </p>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
                  <span className="font-mono text-gray-500">{c.sha}</span>
                  <span>·</span>
                  <span>{c.author}</span>
                  <span>·</span>
                  <span>{timeAgo(c.date)}</span>
                </div>
              </div>
              {c.html_url && (
                <a
                  href={c.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-gray-300 hover:text-brand-500"
                >
                  <MdOpenInNew className="h-4 w-4" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ── Trello Overview ── */
const LIST_BADGE_COLORS = [
  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
];

function TrelloOverview() {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/trello/boards")
      .then(async ({ data }) => {
        const boardList = (data.data ?? []).slice(0, 4);

        const enriched = await Promise.allSettled(
          boardList.map(async (board) => {
            const [listsRes, cardsRes] = await Promise.allSettled([
              api.get(`/trello/boards/${board.id}/lists`),
              api.get(`/trello/boards/${board.id}/cards`),
            ]);

            const lists =
              listsRes.status === "fulfilled"
                ? listsRes.value.data.data ?? []
                : [];
            const cards =
              cardsRes.status === "fulfilled"
                ? cardsRes.value.data.data ?? []
                : [];

            const countByList = {};
            for (const card of cards) {
              countByList[card.idList] = (countByList[card.idList] || 0) + 1;
            }

            return {
              id: board.id,
              name: board.name,
              url: board.url,
              lists: lists.map((l) => ({
                id: l.id,
                name: l.name,
                count: countByList[l.id] ?? 0,
              })),
              totalCards: cards.length,
            };
          })
        );

        setBoards(
          enriched
            .filter((r) => r.status === "fulfilled")
            .map((r) => r.value)
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card extra="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-navy-700 dark:text-white">
          Aperçu Trello
        </h2>
        <SiTrello className="h-5 w-5 text-blue-500" />
      </div>

      {loading ? (
        <div className="flex flex-col gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex animate-pulse flex-col gap-2">
              <div className="h-3.5 w-1/2 rounded bg-gray-200 dark:bg-navy-700" />
              <div className="flex gap-2">
                {Array.from({ length: 3 }).map((__, j) => (
                  <div key={j} className="h-6 w-20 rounded-full bg-gray-200 dark:bg-navy-700" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : boards.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-gray-300">
          <SiTrello className="h-8 w-8" />
          <p className="text-sm">Aucun tableau trouvé</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/5">
          {boards.map((board) => (
            <div key={board.id} className="py-4 first:pt-0 last:pb-0">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-blue-500" />
                  <a
                    href={board.url}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-sm font-semibold text-navy-700 hover:text-brand-500 dark:text-white"
                  >
                    {board.name}
                  </a>
                </div>
                <span className="shrink-0 text-xs text-gray-400">
                  {board.totalCards} carte{board.totalCards !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {board.lists.slice(0, 6).map((list, idx) => (
                  <span
                    key={list.id}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      LIST_BADGE_COLORS[idx % LIST_BADGE_COLORS.length]
                    }`}
                  >
                    {list.name} · {list.count}
                  </span>
                ))}
                {board.lists.length === 0 && (
                  <span className="text-xs text-gray-400 italic">Aucune liste</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ── Slack Recent Messages ── */
function SlackRecentMessages() {
  const [channelName, setChannelName] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/slack/channels")
      .then(async ({ data }) => {
        const first = (data.data ?? [])[0];
        if (!first) return;
        setChannelName(first.name);
        const { data: msgData } = await api.get(
          `/slack/channels/${first.id}/messages`
        );
        setMessages((msgData.data ?? []).slice(0, 5));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function formatUserId(userId) {
    if (!userId) return "Inconnu";
    if (userId.startsWith("B")) return "Bot";
    if (userId.startsWith("U") && userId.length > 4)
      return `Membre ·${userId.slice(-4)}`;
    return userId;
  }

  return (
    <Card extra="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-navy-700 dark:text-white">
            Messages Slack Récents
          </h2>
          {channelName && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
              <MdTag className="h-3 w-3" />
              {channelName}
            </p>
          )}
        </div>
        <SiSlack className="h-5 w-5 text-[#E01E5A]" />
      </div>

      {loading ? (
        <SkeletonRows count={5} />
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-gray-300">
          <SiSlack className="h-8 w-8" />
          <p className="text-sm">Aucun message trouvé</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/5">
          {messages.map((msg) => {
            const isBot = !msg.user || msg.user.startsWith("B");
            const initials = isBot
              ? "B"
              : (msg.user ?? "?").slice(-2).toUpperCase();
            return (
              <div key={msg.ts} className="flex items-start gap-3 py-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                    isBot ? "bg-gray-400" : "bg-[#E01E5A]"
                  }`}
                >
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-navy-700 dark:text-white">
                      {formatUserId(msg.user)}
                    </span>
                    <span className="shrink-0 text-[11px] text-gray-400">
                      {timeAgo(msg.timestamp)}
                    </span>
                  </div>
                  {msg.text && (
                    <p className="mt-0.5 truncate text-sm text-gray-600 dark:text-gray-300">
                      {msg.text
                        .replace(/&lt;/g, "<")
                        .replace(/&gt;/g, ">")
                        .replace(/&amp;/g, "&")}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ── Drive Recent Files ── */
const MIME_BADGE = {
  "application/vnd.google-apps.document":
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "application/vnd.google-apps.spreadsheet":
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "application/vnd.google-apps.presentation":
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  "application/vnd.google-apps.folder":
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  "application/pdf":
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const MIME_LABEL = {
  "application/vnd.google-apps.document": "Document",
  "application/vnd.google-apps.spreadsheet": "Feuille",
  "application/vnd.google-apps.presentation": "Présentation",
  "application/vnd.google-apps.folder": "Dossier",
  "application/pdf": "PDF",
};

function mimeInfo(mimeType) {
  const label =
    MIME_LABEL[mimeType] ??
    (mimeType?.startsWith("image/")
      ? "Image"
      : mimeType?.startsWith("video/")
      ? "Vidéo"
      : "Fichier");
  const badge =
    MIME_BADGE[mimeType] ??
    "bg-gray-100 text-gray-600 dark:bg-navy-700 dark:text-gray-300";
  return { label, badge };
}

function DriveRecentFiles() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/google/files")
      .then(({ data }) => setFiles((data.data ?? []).slice(0, 5)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card extra="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-navy-700 dark:text-white">
          Fichiers Drive Récents
        </h2>
        <SiGoogledrive className="h-5 w-5 text-brand-500" />
      </div>

      {loading ? (
        <SkeletonRows count={5} />
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-gray-300">
          <SiGoogledrive className="h-8 w-8" />
          <p className="text-sm">Aucun fichier trouvé</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100 dark:divide-white/5">
          {files.map((file) => {
            const { label, badge } = mimeInfo(file.mime_type);
            return (
              <div key={file.id} className="flex items-center gap-3 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-lightPrimary dark:bg-navy-700">
                  <MdInsertDriveFile className="h-4 w-4 text-brand-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="truncate text-sm font-medium text-navy-700 dark:text-white">
                      {file.name}
                    </p>
                    {file.web_view_link && (
                      <a
                        href={file.web_view_link}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 text-gray-300 hover:text-brand-500"
                      >
                        <MdOpenInNew className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDate(file.modified_time)}
                  </span>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge}`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ── Main Dashboard ── */
const Dashboard = () => {
  const [stats, setStats] = useState({
    githubRepos: 0,
    totalStars: 0,
    trelloCards: 0,
    slackChannels: 0,
    driveFiles: 0,
  });
  const [topRepos, setTopRepos] = useState([]);
  const [recentRepos, setRecentRepos] = useState([]);
  const [activityEvents, setActivityEvents] = useState([]);
  const [health, setHealth] = useState({
    github: false,
    trello: false,
    slack: false,
    drive: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const [githubResult, trelloResult, slackResult, driveResult] =
        await Promise.allSettled([
          api.get("/github/repos"),
          api.get("/trello/boards"),
          api.get("/slack/channels"),
          api.get("/google/files"),
        ]);

      const newHealth = {
        github: githubResult.status === "fulfilled",
        trello: trelloResult.status === "fulfilled",
        slack: slackResult.status === "fulfilled",
        drive: driveResult.status === "fulfilled",
      };

      let githubRepos = 0,
        totalStars = 0,
        top = [],
        recent = [];
      if (newHealth.github) {
        const repos = githubResult.value.data.data ?? [];
        githubRepos = repos.length;
        totalStars = repos.reduce((s, r) => s + (r.stargazers_count ?? 0), 0);
        top = [...repos]
          .sort((a, b) => b.stargazers_count - a.stargazers_count)
          .slice(0, 5);
        recent = repos.slice(0, 5);
      }

      let boardList = [];
      if (newHealth.trello) boardList = trelloResult.value.data.data ?? [];

      let slackChannels = 0;
      if (newHealth.slack)
        slackChannels = (slackResult.value.data.data ?? []).length;

      let driveFiles = 0;
      if (newHealth.drive)
        driveFiles = (driveResult.value.data.data ?? []).length;

      const events = [];
      if (newHealth.github) {
        const repos = githubResult.value.data.data ?? [];
        repos
          .slice(0, 5)
          .forEach((r) =>
            events.push({ source: "github", title: `Dépôt mis à jour : ${r.name}`, time: timeAgo(r.updated_at), url: r.html_url, ts: new Date(r.updated_at) })
          );
      }
      if (newHealth.trello) {
        boardList
          .slice(0, 3)
          .forEach((b) =>
            events.push({ source: "trello", title: `Tableau : ${b.name}`, time: timeAgo(b.last_activity), url: b.url, ts: new Date(b.last_activity ?? 0) })
          );
      }
      if (newHealth.slack) {
        const channels = slackResult.value.data.data ?? [];
        channels
          .slice(0, 3)
          .forEach((c) =>
            events.push({ source: "slack", title: `#${c.name} — ${c.member_count ?? 0} membres`, time: "actif", ts: new Date(0) })
          );
      }
      if (newHealth.drive) {
        const files = driveResult.value.data.data ?? [];
        files
          .slice(0, 3)
          .forEach((f) =>
            events.push({ source: "drive", title: f.name, time: timeAgo(f.modified_time), url: f.web_view_link, ts: new Date(f.modified_time ?? 0) })
          );
      }
      events.sort((a, b) => b.ts - a.ts);

      setHealth(newHealth);
      setStats({ githubRepos, totalStars, trelloCards: 0, slackChannels, driveFiles });
      setTopRepos(top);
      setRecentRepos(recent);
      setActivityEvents(events);
      setLoading(false);

      if (boardList.length > 0) {
        Promise.allSettled(
          boardList.map((b) => api.get(`/trello/boards/${b.id}/cards`))
        ).then((results) => {
          const totalCards = results
            .filter((r) => r.status === "fulfilled")
            .reduce((sum, r) => sum + (r.value.data.total ?? 0), 0);
          setStats((prev) => ({ ...prev, trelloCards: totalCards }));
        });
      }
    }
    load();
  }, []);

  const fmt = (n) => (loading ? "…" : n.toLocaleString());

  return (
    <div>
      {/* ── KPI Widgets ── */}
      <div className="mt-3 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-6">
        <Widget icon={<FaGithub className="h-6 w-6" />} title="Dépôts GitHub" subtitle={fmt(stats.githubRepos)} />
        <Widget icon={<FaStar className="h-6 w-6" />} title="Total Étoiles" subtitle={fmt(stats.totalStars)} />
        <Widget icon={<SiTrello className="h-6 w-6" />} title="Cartes Trello" subtitle={fmt(stats.trelloCards)} />
        <Widget icon={<SiSlack className="h-6 w-6" />} title="Canaux Slack" subtitle={fmt(stats.slackChannels)} />
        <Widget icon={<SiGoogledrive className="h-6 w-6" />} title="Fichiers Drive" subtitle={fmt(stats.driveFiles)} />
        <Widget icon={<MdLink className="h-7 w-7" />} title="Services Connectés" subtitle="4" />
      </div>

      {/* ── Activity Feed + Service Health ── */}
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <UnifiedActivityFeed events={activityEvents} loading={loading} />
        </div>
        <ServiceHealth health={health} loading={loading} />
      </div>

      {/* ── GitHub Charts ── */}
      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <RecentActivityFeed repos={recentRepos} loading={loading} />
        <TopReposChart repos={topRepos} loading={loading} />
      </div>

      {/* ── Recent Commits + Trello Overview ── */}
      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <RecentCommits />
        <TrelloOverview />
      </div>

      {/* ── Slack Messages + Drive Files ── */}
      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <SlackRecentMessages />
        <DriveRecentFiles />
      </div>
    </div>
  );
};

export default Dashboard;
