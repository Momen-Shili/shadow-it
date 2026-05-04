import { useState, useEffect } from "react";
import {
  MdCheck,
  MdClose,
  MdPeople,
  MdAccessTime,
  MdCircle,
  MdOpenInNew,
  MdAdminPanelSettings,
} from "react-icons/md";
import { FaGithub } from "react-icons/fa";
import { SiTrello, SiSlack } from "react-icons/si";
import Card from "components/card";
import { useAuth } from "context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "services/api";

/* ── Status badge ── */
const STATUS_STYLE = {
  pending:  "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};
const STATUS_LABEL = { pending: "En attente", approved: "Approuvé", rejected: "Rejeté" };

function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLE[status] ?? "bg-gray-100 text-gray-500"}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

/* ── Member dashboard modal ── */
function MemberDashboardModal({ member, onClose }) {
  const [dash, setDash]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/admin/members/${member.id}/dashboard`)
      .then(({ data }) => setDash(data.data))
      .catch(() => setDash({ has_github: false, has_trello: false, has_slack: false }))
      .finally(() => setLoading(false));
  }, [member.id]);

  const services = [
    { key: "has_github", label: "GitHub",       icon: <FaGithub className="h-4 w-4" />,  color: "bg-gray-800" },
    { key: "has_trello", label: "Trello",        icon: <SiTrello className="h-4 w-4" />,  color: "bg-blue-500" },
    { key: "has_slack",  label: "Slack",         icon: <SiSlack className="h-4 w-4" />,   color: "bg-[#E01E5A]" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-navy-800">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-navy-700 dark:text-white">
            Dashboard de {member.name}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <MdClose className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 text-xs text-gray-400">{member.email}</p>

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex animate-pulse items-center justify-between rounded-xl bg-lightPrimary p-3 dark:bg-navy-700">
                <div className="h-4 w-24 rounded bg-gray-200 dark:bg-navy-600" />
                <div className="h-4 w-20 rounded-full bg-gray-200 dark:bg-navy-600" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {services.map(({ key, label, icon, color }) => (
              <div key={key} className="flex items-center justify-between rounded-xl bg-lightPrimary px-4 py-3 dark:bg-navy-700">
                <div className="flex items-center gap-2">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-white ${color}`}>
                    {icon}
                  </span>
                  <span className="text-sm font-semibold text-navy-700 dark:text-white">{label}</span>
                </div>
                {dash?.[key] ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
                    <MdCircle className="h-2 w-2" /> Configuré
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Non configuré</span>
                )}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-lightPrimary py-2 text-sm font-medium text-navy-700 hover:bg-gray-200 dark:bg-navy-700 dark:text-white dark:hover:bg-navy-600"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}

/* ── Team stats ── */
function TeamStats({ stats, loading }) {
  const cards = [
    { label: "Total membres",  value: stats?.total,    color: "text-navy-700 dark:text-white" },
    { label: "En attente",     value: stats?.pending,  color: "text-orange-500" },
    { label: "Approuvés",      value: stats?.approved, color: "text-green-600" },
    { label: "Rejetés",        value: stats?.rejected, color: "text-red-500" },
  ];

  return (
    <Card extra="p-5">
      <h3 className="mb-4 text-lg font-bold text-navy-700 dark:text-white">
        Statistiques équipe
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map(({ label, value, color }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1 rounded-2xl bg-lightPrimary px-3 py-4 dark:bg-navy-700"
          >
            {loading ? (
              <div className="h-7 w-12 animate-pulse rounded bg-gray-200 dark:bg-navy-600" />
            ) : (
              <p className={`text-2xl font-bold ${color}`}>{value ?? "—"}</p>
            )}
            <p className="text-center text-xs font-medium text-gray-500">{label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Main page ── */
export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [members, setMembers]     = useState([]);
  const [stats, setStats]         = useState(null);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingStats, setLoadingStats]     = useState(true);
  const [actionId, setActionId]   = useState(null); // tracks which member is being actioned
  const [selectedMember, setSelectedMember] = useState(null);

  // Guard: admin only
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/admin/default", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    api
      .get("/admin/members")
      .then(({ data }) => setMembers(data.data))
      .catch(() => {})
      .finally(() => setLoadingMembers(false));

    api
      .get("/admin/stats")
      .then(({ data }) => setStats(data.data))
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, []);

  async function approve(id) {
    setActionId(id);
    try {
      const { data } = await api.patch(`/admin/members/${id}/approve`);
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: data.data.status } : m))
      );
      setStats((prev) =>
        prev
          ? { ...prev, pending: prev.pending - 1, approved: prev.approved + 1 }
          : prev
      );
    } catch {}
    setActionId(null);
  }

  async function reject(id) {
    setActionId(id);
    try {
      const { data } = await api.patch(`/admin/members/${id}/reject`);
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: data.data.status } : m))
      );
      setStats((prev) =>
        prev
          ? { ...prev, pending: prev.pending - 1, rejected: prev.rejected + 1 }
          : prev
      );
    } catch {}
    setActionId(null);
  }

  const pendingMembers  = members.filter((m) => m.status === "pending");
  const allMembers      = members;

  function fmtDate(dateStr) {
    return new Date(dateStr).toLocaleDateString(undefined, {
      day: "numeric", month: "short", year: "numeric",
    });
  }

  if (user?.role !== "admin") return null;

  return (
    <div className="mt-3 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <MdAdminPanelSettings className="h-8 w-8 text-brand-500" />
        <div>
          <h2 className="text-2xl font-bold text-navy-700 dark:text-white">
            Admin Panel
          </h2>
          <p className="text-sm text-gray-500">
            Gérez les membres et les accès à la plateforme
          </p>
        </div>
      </div>

      {/* Stats */}
      <TeamStats stats={stats} loading={loadingStats} />

      {/* Pending members */}
      <Card extra="p-5">
        <div className="mb-4 flex items-center gap-2">
          <MdAccessTime className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-bold text-navy-700 dark:text-white">
            Membres en attente
          </h3>
          {pendingMembers.length > 0 && (
            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
              {pendingMembers.length}
            </span>
          )}
        </div>

        {loadingMembers ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex animate-pulse items-center justify-between rounded-xl bg-lightPrimary p-4 dark:bg-navy-700">
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-32 rounded bg-gray-200 dark:bg-navy-600" />
                  <div className="h-3 w-48 rounded bg-gray-200 dark:bg-navy-600" />
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-24 rounded-xl bg-gray-200 dark:bg-navy-600" />
                  <div className="h-8 w-20 rounded-xl bg-gray-200 dark:bg-navy-600" />
                </div>
              </div>
            ))}
          </div>
        ) : pendingMembers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-gray-400">
            <MdPeople className="h-10 w-10" />
            <p className="text-sm">Aucun membre en attente</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pendingMembers.map((m) => (
              <div
                key={m.id}
                className="flex flex-col gap-3 rounded-xl bg-lightPrimary p-4 dark:bg-navy-700 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-navy-700 dark:text-white">
                    {m.name}
                  </p>
                  <p className="truncate text-xs text-gray-400">{m.email}</p>
                  <p className="mt-0.5 text-[11px] text-gray-400">
                    Inscrit le {fmtDate(m.created_at)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => approve(m.id)}
                    disabled={actionId === m.id}
                    className="flex items-center gap-1.5 rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-600 disabled:opacity-60"
                  >
                    <MdCheck className="h-4 w-4" />
                    Approuver
                  </button>
                  <button
                    onClick={() => reject(m.id)}
                    disabled={actionId === m.id}
                    className="flex items-center gap-1.5 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
                  >
                    <MdClose className="h-4 w-4" />
                    Rejeter
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* All members table */}
      <Card extra="p-5">
        <div className="mb-4 flex items-center gap-2">
          <MdPeople className="h-5 w-5 text-brand-500" />
          <h3 className="text-lg font-bold text-navy-700 dark:text-white">
            Tous les membres
          </h3>
          <span className="rounded-full bg-lightPrimary px-2.5 py-0.5 text-xs font-bold text-navy-700 dark:bg-navy-700 dark:text-white">
            {allMembers.length}
          </span>
        </div>

        {loadingMembers ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex animate-pulse items-center gap-4 py-2.5">
                <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-navy-700" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <div className="h-3.5 w-40 rounded bg-gray-200 dark:bg-navy-700" />
                  <div className="h-3 w-56 rounded bg-gray-200 dark:bg-navy-700" />
                </div>
                <div className="h-6 w-20 rounded-full bg-gray-200 dark:bg-navy-700" />
              </div>
            ))}
          </div>
        ) : allMembers.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">Aucun membre enregistré.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/10">
                  <th className="pb-3 pr-4 text-xs font-bold uppercase tracking-wide text-gray-400">
                    Nom
                  </th>
                  <th className="pb-3 pr-4 text-xs font-bold uppercase tracking-wide text-gray-400">
                    Email
                  </th>
                  <th className="pb-3 pr-4 text-xs font-bold uppercase tracking-wide text-gray-400">
                    Statut
                  </th>
                  <th className="pb-3 pr-4 text-xs font-bold uppercase tracking-wide text-gray-400">
                    Inscrit le
                  </th>
                  <th className="pb-3 text-xs font-bold uppercase tracking-wide text-gray-400">
                    Dashboard
                  </th>
                </tr>
              </thead>
              <tbody>
                {allMembers.map((m, i) => (
                  <tr
                    key={m.id}
                    className={`${i < allMembers.length - 1 ? "border-b border-gray-100 dark:border-white/5" : ""}`}
                  >
                    <td className="py-3 pr-4 font-semibold text-navy-700 dark:text-white">
                      {m.name}
                    </td>
                    <td className="py-3 pr-4 text-gray-500">{m.email}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="py-3 pr-4 text-gray-500">{fmtDate(m.created_at)}</td>
                    <td className="py-3">
                      <button
                        onClick={() => setSelectedMember(m)}
                        className="flex items-center gap-1 text-xs font-medium text-brand-500 hover:text-brand-600"
                      >
                        Voir <MdOpenInNew className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Member dashboard modal */}
      {selectedMember && (
        <MemberDashboardModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
}
