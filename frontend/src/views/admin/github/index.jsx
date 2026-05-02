import { useEffect, useMemo, useState } from "react";
import {
  FaGithub,
  FaStar,
  FaCodeBranch,
  FaUsers,
  FaUserFriends,
} from "react-icons/fa";
import { MdOutlineBook, MdSearch } from "react-icons/md";
import Card from "components/card";
import PieChart from "components/charts/PieChart";
import api from "services/api";

const LANG_COLORS = {
  JavaScript: "bg-yellow-400",
  TypeScript: "bg-blue-500",
  Python: "bg-blue-400",
  Java: "bg-orange-500",
  "C#": "bg-purple-500",
  "C++": "bg-pink-500",
  Go: "bg-cyan-400",
  Rust: "bg-orange-600",
  Ruby: "bg-red-500",
  PHP: "bg-indigo-400",
  HTML: "bg-orange-400",
  CSS: "bg-blue-300",
  Shell: "bg-gray-500",
};

const LANG_HEX = {
  JavaScript: "#FACC15",
  TypeScript: "#3B82F6",
  Python: "#60A5FA",
  Java: "#F97316",
  "C#": "#A855F7",
  "C++": "#EC4899",
  Go: "#22D3EE",
  Rust: "#EA580C",
  Ruby: "#EF4444",
  PHP: "#818CF8",
  HTML: "#FB923C",
  CSS: "#93C5FD",
  Shell: "#6B7280",
};

const langColor = (lang) => LANG_COLORS[lang] ?? "bg-gray-400";
const langHex = (lang) => LANG_HEX[lang] ?? "#9CA3AF";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function StatBadge({ icon, label, value }) {
  return (
    <Card extra="flex flex-col items-center justify-center py-6 gap-2">
      <span className="text-brand-500 dark:text-white">{icon}</span>
      <p className="text-2xl font-bold text-navy-700 dark:text-white">
        {value?.toLocaleString() ?? "—"}
      </p>
      <p className="text-sm font-medium text-gray-500">{label}</p>
    </Card>
  );
}

function RepoCard({ repo }) {
  return (
    <Card extra="p-5 flex flex-col gap-3 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between gap-2">
        <a
          href={repo.html_url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 font-bold text-navy-700 hover:text-brand-500 dark:text-white dark:hover:text-brand-400 truncate"
        >
          <MdOutlineBook className="h-4 w-4 shrink-0 text-brand-500" />
          <span className="truncate">{repo.name}</span>
        </a>
        {repo.private && (
          <span className="shrink-0 rounded-full border border-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:border-white/10">
            Private
          </span>
        )}
      </div>

      {repo.language && (
        <div className="flex items-center gap-1.5">
          <span className={`h-3 w-3 rounded-full ${langColor(repo.language)}`} />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {repo.language}
          </span>
        </div>
      )}

      <div className="mt-auto flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <FaStar className="h-3 w-3 text-yellow-400" />
          {repo.stargazers_count.toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          <FaCodeBranch className="h-3 w-3" />
          {repo.forks_count.toLocaleString()}
        </span>
        <span className="ml-auto">{timeAgo(repo.updated_at)}</span>
      </div>
    </Card>
  );
}

function LanguagePieChart({ repos }) {
  const langStats = useMemo(() => {
    const map = {};
    for (const repo of repos) {
      if (repo.language) {
        map[repo.language] = (map[repo.language] || 0) + 1;
      }
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [repos]);

  if (langStats.length === 0) return null;

  const labels = langStats.map(([lang]) => lang);
  const series = langStats.map(([, count]) => count);
  const colors = langStats.map(([lang]) => langHex(lang));

  const options = {
    chart: { type: "pie", toolbar: { show: false } },
    labels,
    colors,
    legend: {
      position: "right",
      fontSize: "12px",
      fontFamily: "inherit",
      labels: { colors: "#94A3B8" },
      markers: { width: 10, height: 10, radius: 5 },
    },
    dataLabels: { enabled: false },
    tooltip: {
      y: {
        formatter: (val) =>
          `${val} repo${val !== 1 ? "s" : ""}`,
      },
    },
    stroke: { width: 0 },
    plotOptions: { pie: { expandOnClick: false } },
  };

  return (
    <Card extra="p-5">
      <h4 className="mb-1 text-base font-bold text-navy-700 dark:text-white">
        Languages
      </h4>
      <p className="mb-4 text-xs text-gray-400">
        Distribution across {repos.length} repositories
      </p>
      <div style={{ height: "220px" }}>
        <PieChart series={series} options={options} />
      </div>
    </Card>
  );
}

export default function GitHubPage() {
  const [profile, setProfile] = useState(null);
  const [repos, setRepos] = useState([]);
  const [search, setSearch] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [errorProfile, setErrorProfile] = useState(null);
  const [errorRepos, setErrorRepos] = useState(null);

  useEffect(() => {
    api
      .get("/github/profile")
      .then(({ data }) => setProfile(data.data))
      .catch((err) =>
        setErrorProfile(err.response?.data?.error ?? "Failed to load profile")
      )
      .finally(() => setLoadingProfile(false));

    api
      .get("/github/repos")
      .then(({ data }) => setRepos(data.data))
      .catch((err) =>
        setErrorRepos(err.response?.data?.error ?? "Failed to load repos")
      )
      .finally(() => setLoadingRepos(false));
  }, []);

  const filteredRepos = useMemo(
    () =>
      repos.filter((r) =>
        r.name.toLowerCase().includes(search.toLowerCase())
      ),
    [repos, search]
  );

  return (
    <div className="mt-3 flex flex-col gap-5">
      {/* ── Profile card ── */}
      <Card extra="p-6">
        {loadingProfile ? (
          <ProfileSkeleton />
        ) : errorProfile ? (
          <ErrorBanner message={errorProfile} />
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <img
              src={profile.avatar_url}
              alt={profile.login}
              className="h-24 w-24 rounded-full border-4 border-brand-500 object-cover shadow-md"
            />
            <div className="flex flex-col items-center gap-1 sm:items-start">
              <div className="flex items-center gap-2">
                <FaGithub className="h-5 w-5 text-navy-700 dark:text-white" />
                <h3 className="text-2xl font-bold text-navy-700 dark:text-white">
                  {profile.name ?? profile.login}
                </h3>
              </div>
              <p className="text-sm text-gray-500">@{profile.login}</p>
              <a
                href={profile.html_url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 text-xs font-medium text-brand-500 hover:underline"
              >
                View on GitHub →
              </a>
            </div>
          </div>
        )}
      </Card>

      {/* ── Stat badges ── */}
      {!loadingProfile && !errorProfile && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <StatBadge
            icon={<MdOutlineBook className="h-7 w-7" />}
            label="Public Repos"
            value={profile.public_repos}
          />
          <StatBadge
            icon={<FaUsers className="h-6 w-6" />}
            label="Followers"
            value={profile.followers}
          />
          <StatBadge
            icon={<FaUserFriends className="h-6 w-6" />}
            label="Following"
            value={profile.following}
          />
        </div>
      )}

      {/* ── Language chart + Repos side by side (when repos loaded) ── */}
      {!loadingRepos && !errorRepos && repos.length > 0 && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="xl:col-span-1">
            <LanguagePieChart repos={repos} />
          </div>

          {/* ── Repos section ── */}
          <div className="xl:col-span-2">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h4 className="text-xl font-bold text-navy-700 dark:text-white">
                Repositories
                <span className="ml-2 text-sm font-medium text-gray-400">
                  ({filteredRepos.length}
                  {search && repos.length !== filteredRepos.length
                    ? ` of ${repos.length}`
                    : ""}
                  )
                </span>
              </h4>
              <div className="relative w-full sm:w-56">
                <MdSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search repositories…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-full rounded-xl border border-gray-200 bg-white/0 pl-9 pr-3 text-sm outline-none placeholder:text-gray-400 focus:border-brand-500 dark:border-white/10 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>
            </div>

            {filteredRepos.length === 0 ? (
              <Card extra="p-10 flex flex-col items-center gap-3 text-gray-400">
                <FaGithub className="h-10 w-10" />
                <p className="text-sm">
                  {search ? "No repositories match your search." : "No repositories found."}
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filteredRepos.map((repo) => (
                  <RepoCard key={repo.id} repo={repo} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Loading / error states for repos ── */}
      {loadingRepos && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <RepoSkeleton key={i} />
          ))}
        </div>
      )}
      {errorRepos && <ErrorBanner message={errorRepos} />}
    </div>
  );
}

/* ── Skeleton / error helpers ── */

function ProfileSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-4">
      <div className="h-24 w-24 rounded-full bg-gray-200 dark:bg-navy-700" />
      <div className="flex flex-col gap-2">
        <div className="h-5 w-36 rounded bg-gray-200 dark:bg-navy-700" />
        <div className="h-3 w-24 rounded bg-gray-200 dark:bg-navy-700" />
      </div>
    </div>
  );
}

function RepoSkeleton() {
  return (
    <Card extra="p-5 flex flex-col gap-3 animate-pulse">
      <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-navy-700" />
      <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-navy-700" />
      <div className="flex gap-4">
        <div className="h-3 w-10 rounded bg-gray-200 dark:bg-navy-700" />
        <div className="h-3 w-10 rounded bg-gray-200 dark:bg-navy-700" />
      </div>
    </Card>
  );
}

function ErrorBanner({ message }) {
  return (
    <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
      {message}
    </div>
  );
}
