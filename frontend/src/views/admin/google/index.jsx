import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { SiGoogledrive } from "react-icons/si";
import {
  MdInsertDriveFile,
  MdImage,
  MdVideoFile,
  MdAudioFile,
  MdTableChart,
  MdSlideshow,
  MdDescription,
  MdFolder,
  MdCode,
  MdPictureAsPdf,
  MdArchive,
  MdOpenInNew,
  MdLinkOff,
} from "react-icons/md";
import Card from "components/card";
import api from "services/api";
import { useAuth } from "context/AuthContext";

/* ── MIME type → icon + label ── */
const MIME_MAP = {
  "application/vnd.google-apps.document":     { icon: MdDescription,    label: "Doc",          color: "text-blue-500" },
  "application/vnd.google-apps.spreadsheet":  { icon: MdTableChart,     label: "Feuille",      color: "text-green-500" },
  "application/vnd.google-apps.presentation": { icon: MdSlideshow,      label: "Diapo",        color: "text-yellow-500" },
  "application/vnd.google-apps.folder":       { icon: MdFolder,         label: "Dossier",      color: "text-yellow-400" },
  "application/vnd.google-apps.form":         { icon: MdDescription,    label: "Formulaire",   color: "text-purple-500" },
  "application/pdf":                          { icon: MdPictureAsPdf,   label: "PDF",          color: "text-red-500" },
  "image/jpeg":                               { icon: MdImage,          label: "JPEG",         color: "text-pink-400" },
  "image/png":                                { icon: MdImage,          label: "PNG",          color: "text-pink-400" },
  "image/gif":                                { icon: MdImage,          label: "GIF",          color: "text-pink-400" },
  "image/svg+xml":                            { icon: MdImage,          label: "SVG",          color: "text-pink-400" },
  "video/mp4":                                { icon: MdVideoFile,      label: "Vidéo",        color: "text-purple-400" },
  "audio/mpeg":                               { icon: MdAudioFile,      label: "Audio",        color: "text-indigo-400" },
  "text/plain":                               { icon: MdDescription,    label: "Texte",        color: "text-gray-500" },
  "text/csv":                                 { icon: MdTableChart,     label: "CSV",          color: "text-green-400" },
  "application/json":                         { icon: MdCode,           label: "JSON",         color: "text-orange-400" },
  "application/zip":                          { icon: MdArchive,        label: "ZIP",          color: "text-gray-500" },
};

function getMimeInfo(mimeType) {
  if (MIME_MAP[mimeType]) return MIME_MAP[mimeType];
  if (mimeType?.startsWith("image/"))  return { icon: MdImage,           label: "Image", color: "text-pink-400" };
  if (mimeType?.startsWith("video/"))  return { icon: MdVideoFile,       label: "Vidéo", color: "text-purple-400" };
  if (mimeType?.startsWith("audio/"))  return { icon: MdAudioFile,       label: "Audio", color: "text-indigo-400" };
  if (mimeType?.startsWith("text/"))   return { icon: MdDescription,     label: "Texte",  color: "text-gray-500" };
  return { icon: MdInsertDriveFile, label: "Fichier", color: "text-gray-400" };
}

/* ── Helpers ── */
function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "—";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
}

function formatDate(isoStr) {
  if (!isoStr) return "—";
  return new Date(isoStr).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}

/* ── Sub-components ── */
function QuotaBar({ quota }) {
  const used    = quota.usage ?? 0;
  const limit   = quota.limit;
  const pct     = quota.used_percent ?? 0;
  const barColor =
    pct >= 90 ? "bg-red-500"
    : pct >= 70 ? "bg-orange-400"
    : "bg-brand-500";

  return (
    <Card extra="p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-navy-700 dark:text-white">
          Quota de Stockage
        </h4>
        <span className="text-sm font-semibold text-navy-700 dark:text-white">
          {pct !== null ? `${pct}%` : "—"}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-navy-700">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(pct ?? 0, 100)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{formatBytes(used)} utilisé</span>
        {limit ? (
          <span>{formatBytes(limit)} au total</span>
        ) : (
          <span>Illimité</span>
        )}
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="rounded-xl bg-lightPrimary px-3 py-2 dark:bg-navy-700">
          <p className="text-[11px] text-gray-500">En Drive</p>
          <p className="text-sm font-bold text-navy-700 dark:text-white">
            {formatBytes(quota.usage_in_drive)}
          </p>
        </div>
        <div className="rounded-xl bg-lightPrimary px-3 py-2 dark:bg-navy-700">
          <p className="text-[11px] text-gray-500">À la Corbeille</p>
          <p className="text-sm font-bold text-navy-700 dark:text-white">
            {formatBytes(quota.usage_in_drive_trash)}
          </p>
        </div>
      </div>
    </Card>
  );
}

function FileRow({ file }) {
  const { icon: Icon, label, color } = getMimeInfo(file.mime_type);
  return (
    <tr className="group border-b border-gray-100 last:border-0 hover:bg-lightPrimary dark:border-white/5 dark:hover:bg-navy-700">
      <td className="py-3 pl-5 pr-3">
        <Icon className={`h-5 w-5 ${color}`} />
      </td>
      <td className="py-3 pr-4">
        {file.web_view_link ? (
          <a
            href={file.web_view_link}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 font-medium text-navy-700 hover:text-brand-500 dark:text-white dark:hover:text-brand-400"
          >
            <span className="line-clamp-1">{file.name}</span>
            <MdOpenInNew className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
          </a>
        ) : (
          <span className="line-clamp-1 text-navy-700 dark:text-white">{file.name}</span>
        )}
      </td>
      <td className="hidden py-3 pr-4 md:table-cell">
        <span className="rounded-full bg-lightPrimary px-2.5 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-navy-700 dark:text-gray-400">
          {label}
        </span>
      </td>
      <td className="hidden py-3 pr-4 text-right text-xs text-gray-400 sm:table-cell">
        {formatBytes(file.size)}
      </td>
      <td className="py-3 pr-5 text-right text-xs text-gray-400">
        {formatDate(file.modified_time)}
      </td>
    </tr>
  );
}

/* ── Skeletons ── */
function QuotaSkeleton() {
  return (
    <Card extra="p-5 flex flex-col gap-3 animate-pulse">
      <div className="flex justify-between">
        <div className="h-4 w-32 rounded bg-gray-200 dark:bg-navy-700" />
        <div className="h-4 w-10 rounded bg-gray-200 dark:bg-navy-700" />
      </div>
      <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-navy-700" />
      <div className="flex justify-between">
        <div className="h-3 w-20 rounded bg-gray-200 dark:bg-navy-700" />
        <div className="h-3 w-20 rounded bg-gray-200 dark:bg-navy-700" />
      </div>
    </Card>
  );
}

function FileSkeleton() {
  return (
    <tr className="border-b border-gray-100 dark:border-white/5">
      <td className="py-3 pl-5 pr-3">
        <div className="h-5 w-5 animate-pulse rounded bg-gray-200 dark:bg-navy-700" />
      </td>
      <td className="py-3 pr-4">
        <div className="h-4 w-48 animate-pulse rounded bg-gray-200 dark:bg-navy-700" />
      </td>
      <td className="hidden py-3 pr-4 md:table-cell">
        <div className="h-4 w-14 animate-pulse rounded-full bg-gray-200 dark:bg-navy-700" />
      </td>
      <td className="hidden py-3 pr-4 sm:table-cell">
        <div className="ml-auto h-3 w-12 animate-pulse rounded bg-gray-200 dark:bg-navy-700" />
      </td>
      <td className="py-3 pr-5">
        <div className="ml-auto h-3 w-20 animate-pulse rounded bg-gray-200 dark:bg-navy-700" />
      </td>
    </tr>
  );
}

function ErrorBanner({ message }) {
  return (
    <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
      {message}
    </div>
  );
}

/* ── Not-connected prompt ── */
function ConnectPrompt({ onConnect, connecting }) {
  return (
    <Card extra="p-10 flex flex-col items-center gap-5">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-lightPrimary dark:bg-navy-700">
        <MdLinkOff className="h-10 w-10 text-gray-400" />
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <h3 className="text-lg font-bold text-navy-700 dark:text-white">
          Google Drive non connecté
        </h3>
        <p className="max-w-xs text-sm text-gray-500">
          Autorisez l'accès en lecture seule à votre Drive pour voir les fichiers et l'utilisation du stockage.
        </p>
      </div>
      <button
        onClick={onConnect}
        disabled={connecting}
        className="flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 active:bg-brand-700 disabled:opacity-60"
      >
        <SiGoogledrive className="h-4 w-4" />
        {connecting ? "Redirection…" : "Connecter Google Drive"}
      </button>
    </Card>
  );
}

/* ── Main page ── */
export default function GoogleDrivePage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [connected, setConnected]         = useState(null);  // null=unknown, true, false
  const [quota, setQuota]                 = useState(null);
  const [files, setFiles]                 = useState([]);
  const [loadingFiles, setLoadingFiles]   = useState(true);
  const [loadingQuota, setLoadingQuota]   = useState(false);
  const [errorFiles, setErrorFiles]       = useState(null);
  const [errorQuota, setErrorQuota]       = useState(null);
  const [connecting, setConnecting]       = useState(false);
  const [justConnected]                   = useState(searchParams.get("connected") === "true");

  const fetchDriveData = useCallback(async () => {
    setLoadingFiles(true);
    setErrorFiles(null);
    try {
      const { data } = await api.get("/google/files");
      setFiles(data.data);
      setConnected(true);
    } catch (err) {
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        setConnected(false);
      } else {
        setErrorFiles(err.response?.data?.error ?? "Failed to load files");
        setConnected(true); // connected but another error
      }
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  const fetchQuota = useCallback(async () => {
    setLoadingQuota(true);
    setErrorQuota(null);
    try {
      const { data } = await api.get("/google/quota");
      setQuota(data.data);
    } catch (err) {
      setErrorQuota(err.response?.data?.error ?? "Failed to load quota");
    } finally {
      setLoadingQuota(false);
    }
  }, []);

  useEffect(() => {
    fetchDriveData();
  }, [fetchDriveData]);

  useEffect(() => {
    if (connected === true) fetchQuota();
  }, [connected, fetchQuota]);

  async function handleConnect() {
    if (!user?.id) return;
    setConnecting(true);
    try {
      const { data } = await api.get(`/google/auth?userId=${user.id}`);
      window.location.href = data.url;
    } catch (err) {
      setErrorFiles(err.response?.data?.error ?? "Failed to get authorization URL");
      setConnecting(false);
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-5">
      {/* ── Header ── */}
      <Card extra="p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-lightPrimary dark:bg-navy-700">
            <SiGoogledrive className="h-6 w-6 text-brand-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-navy-700 dark:text-white">
              Google Drive
            </h3>
            <p className="text-sm text-gray-500">
              {connected === null && "Vérification de la connexion…"}
              {connected === true && !loadingFiles && `${files.length} fichier${files.length !== 1 ? "s" : ""} récent${files.length !== 1 ? "s" : ""}`}
              {connected === false && "Non connecté"}
            </p>
          </div>
        </div>

        {/* Re-authorize button when already connected */}
        {connected === true && (
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 transition hover:bg-lightPrimary dark:border-white/10 dark:text-gray-400 dark:hover:bg-navy-700"
          >
            <SiGoogledrive className="h-3.5 w-3.5" />
            {connecting ? "Redirection…" : "Réautoriser"}
          </button>
        )}
      </Card>

      {/* ── Just-connected banner ── */}
      {justConnected && (
        <div className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
          Google Drive connecté avec succès !
        </div>
      )}

      {/* ── Not connected ── */}
      {connected === false && (
        <ConnectPrompt onConnect={handleConnect} connecting={connecting} />
      )}

      {/* ── Connected: quota + files ── */}
      {connected === true && (
        <>
          {/* Storage quota */}
          {loadingQuota ? (
            <QuotaSkeleton />
          ) : errorQuota ? (
            <ErrorBanner message={errorQuota} />
          ) : quota ? (
            <QuotaBar quota={quota} />
          ) : null}

          {/* Files table */}
          <Card extra="overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <h4 className="text-lg font-bold text-navy-700 dark:text-white">
                Fichiers Récents
                {files.length > 0 && (
                  <span className="ml-2 text-sm font-medium text-gray-400">
                    ({files.length})
                  </span>
                )}
              </h4>
            </div>

            {loadingFiles ? (
              <table className="w-full">
                <tbody>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <FileSkeleton key={i} />
                  ))}
                </tbody>
              </table>
            ) : errorFiles ? (
              <div className="px-5 pb-5">
                <ErrorBanner message={errorFiles} />
              </div>
            ) : files.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-gray-300 dark:text-gray-600">
                <SiGoogledrive className="h-10 w-10" />
                <p className="text-sm">Aucun fichier trouvé dans votre Drive.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px]">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-white/5">
                      <th className="py-3 pl-5 pr-3 text-left" />
                      <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Nom
                      </th>
                      <th className="hidden py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 md:table-cell">
                        Type
                      </th>
                      <th className="hidden py-3 pr-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-400 sm:table-cell">
                        Taille
                      </th>
                      <th className="py-3 pr-5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Modifié
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((file) => (
                      <FileRow key={file.id} file={file} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
