import banner from "assets/img/profile/banner.png";
import Card from "components/card";
import { useAuth } from "context/AuthContext";
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
import api from "services/api";

/* ── helpers ── */
function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return months < 12 ? `${months}mo ago` : `${Math.floor(months / 12)}y ago`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const Banner = () => {
  const { user } = useAuth();
  const initials = getInitials(user?.name);
  const [stats, setStats] = useState({
    githubRepos: 0,
    totalStars: 0,
    trelloBoards: 0,
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
            events.push({ source: "github", title: `Repo updated: ${r.name}`, time: timeAgo(r.updated_at), url: r.html_url, ts: new Date(r.updated_at) })
          );
      }
      if (newHealth.trello) {
        boardList
          .slice(0, 3)
          .forEach((b) =>
            events.push({ source: "trello", title: `Board: ${b.name}`, time: timeAgo(b.last_activity), url: b.url, ts: new Date(b.last_activity ?? 0) })
          );
      }
      if (newHealth.slack) {
        const channels = slackResult.value.data.data ?? [];
        channels
          .slice(0, 3)
          .forEach((c) =>
            events.push({ source: "slack", title: `#${c.name} — ${c.member_count ?? 0} members`, time: "active", ts: new Date(0) })
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
      setStats({ githubRepos, totalStars, trelloBoards: 0, slackChannels, driveFiles });
      setTopRepos(top);
      setRecentRepos(recent);
      setActivityEvents(events);
      setLoading(false);

      if (boardList.length > 0) {
        Promise.allSettled(
          boardList.map((b) => api.get(`/trello/boards/`))
        ).then((results) => {
          const totalBoards = results
            .filter((r) => r.status === "fulfilled")
            .reduce((sum, r) => sum + (r.value.data.total ?? 0), 0);
          setStats((prev) => ({ ...prev, trelloBoards: totalBoards }));
        });
      }
    }
    load();
  }, []);

  const fmt = (n) => (loading ? "…" : n.toLocaleString());
  return (
    <Card extra={"items-center w-full h-full p-[16px] bg-cover"}>
      {/* Background and profile */}
      <div
        className="relative mt-1 flex h-32 w-full justify-center rounded-xl bg-cover"
        style={{ backgroundImage: `url(${banner})` }}
      >
        <div className="absolute -bottom-12 flex h-[87px] w-[87px] items-center justify-center rounded-full border-[4px] border-white bg-brand-500 dark:!border-navy-700">
          <span className="text-2xl font-bold text-white">{initials}</span>
        </div>
      </div>

      {/* Name and role */}
      <div className="mt-16 flex flex-col items-center">
        <h4 className="text-xl font-bold text-navy-700 dark:text-white">
          {user?.name ?? "—"}
        </h4>
        <p className="text-base font-normal text-gray-600">
          {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "User"}
        </p>
      </div>

      {/* Stats row — kept for layout, values neutral */}
      
      <div className="mb-3 mt-6 flex gap-4 md:!gap-14">
        <div className="flex flex-col items-center justify-center">
          <p className="text-2xl font-bold text-navy-700 dark:text-white">{fmt(stats.githubRepos)}</p>
          <p className="text-sm font-normal text-gray-600">Repos</p>
        </div>
        <div className="flex flex-col items-center justify-center">
          <p className="text-2xl font-bold text-navy-700 dark:text-white">{fmt(stats.trelloBoards)}</p>
          <p className="text-sm font-normal text-gray-600">Boards</p>
        </div>
        <div className="flex flex-col items-center justify-center">
          <p className="text-2xl font-bold text-navy-700 dark:text-white">{fmt(stats.driveFiles)} </p>
          <p className="text-sm font-normal text-gray-600">Files</p>
        </div>
      </div>
    </Card>
  );
};

export default Banner;
