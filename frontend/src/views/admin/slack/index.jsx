import { useEffect, useRef, useState } from "react";
import { SiSlack } from "react-icons/si";
import { MdTag, MdPeople, MdCircle } from "react-icons/md";
import Card from "components/card";
import api from "services/api";

/* ── Helpers ── */
function formatTime(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatFullTime(isoStr) {
  if (!isoStr) return "";
  return new Date(isoStr).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Minimally render Slack mrkdwn: bold, italic, inline code
function renderSlackText(text) {
  if (!text) return null;
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/* ── Sub-components ── */
function ChannelRow({ channel, isSelected, onClick }) {
  return (
    <button
      onClick={() => onClick(channel)}
      className={`group w-full rounded-xl px-3 py-2.5 text-left transition-colors ${
        isSelected
          ? "bg-brand-500 text-white"
          : "hover:bg-lightPrimary dark:hover:bg-navy-700"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <MdTag
            className={`h-4 w-4 shrink-0 ${
              isSelected ? "text-white" : "text-gray-400"
            }`}
          />
          <span
            className={`truncate text-sm font-semibold ${
              isSelected
                ? "text-white"
                : "text-navy-700 dark:text-white"
            }`}
          >
            {channel.name}
          </span>
        </div>
        <div
          className={`flex shrink-0 items-center gap-1 text-[11px] ${
            isSelected ? "text-white/80" : "text-gray-400"
          }`}
        >
          <MdPeople className="h-3 w-3" />
          {channel.member_count?.toLocaleString() ?? "—"}
        </div>
      </div>
      {channel.topic && (
        <p
          className={`mt-0.5 truncate text-[11px] ${
            isSelected ? "text-white/70" : "text-gray-400"
          }`}
        >
          {channel.topic}
        </p>
      )}
    </button>
  );
}

function formatUserId(userId) {
  if (!userId) return "Unknown";
  // Slack user IDs look like U012AB3CD — show last 4 chars as a short handle
  if (userId.startsWith("U") && userId.length > 4) {
    return `Member ·${userId.slice(-4)}`;
  }
  return userId;
}

function MessageBubble({ message }) {
  const isBot = !message.user || message.user.startsWith("B");
  const displayName = isBot ? "Bot" : formatUserId(message.user);
  const initials = isBot
    ? "B"
    : (message.user ?? "?").slice(-2).toUpperCase();

  return (
    <div className="flex flex-col gap-0.5 rounded-xl bg-white px-4 py-3 shadow-sm dark:bg-navy-700">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
              isBot ? "bg-gray-400" : "bg-brand-500"
            }`}
          >
            {initials}
          </div>
          <span className="text-xs font-semibold text-navy-700 dark:text-white">
            {displayName}
          </span>
        </div>
        <span className="text-[11px] text-gray-400" title={message.timestamp}>
          {formatTime(message.timestamp)}
        </span>
      </div>

      {message.text && (
        <p className="mt-1 whitespace-pre-wrap break-words pl-9 text-sm text-gray-700 dark:text-gray-300">
          {renderSlackText(message.text)}
        </p>
      )}

      {/* Reactions */}
      {message.reactions?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5 pl-9">
          {message.reactions.map((r) => (
            <span
              key={r.name}
              className="flex items-center gap-1 rounded-full bg-lightPrimary px-2 py-0.5 text-[11px] font-medium text-navy-700 dark:bg-navy-800 dark:text-white"
            >
              :{r.name}: {r.count > 1 && <span>{r.count}</span>}
            </span>
          ))}
        </div>
      )}

      {/* Reply count */}
      {message.reply_count > 0 && (
        <p className="mt-1 pl-9 text-[11px] font-medium text-brand-500">
          {message.reply_count} {message.reply_count === 1 ? "reply" : "replies"}
        </p>
      )}
    </div>
  );
}

/* ── Skeletons ── */
function WorkspaceSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-4">
      <div className="h-12 w-12 rounded-xl bg-gray-200 dark:bg-navy-700" />
      <div className="flex flex-col gap-2">
        <div className="h-4 w-36 rounded bg-gray-200 dark:bg-navy-700" />
        <div className="h-3 w-24 rounded bg-gray-200 dark:bg-navy-700" />
      </div>
    </div>
  );
}

function ChannelSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-1 rounded-xl px-3 py-2.5">
      <div className="h-3.5 w-3/4 rounded bg-gray-200 dark:bg-navy-700" />
      <div className="h-2.5 w-1/2 rounded bg-gray-200 dark:bg-navy-700" />
    </div>
  );
}

function MessageSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-2 rounded-xl bg-white px-4 py-3 shadow-sm dark:bg-navy-700">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-gray-200 dark:bg-navy-600" />
        <div className="h-3 w-24 rounded bg-gray-200 dark:bg-navy-600" />
      </div>
      <div className="ml-9 h-3 w-full rounded bg-gray-200 dark:bg-navy-600" />
      <div className="ml-9 h-3 w-3/4 rounded bg-gray-200 dark:bg-navy-600" />
    </div>
  );
}

function ErrorBanner({ message }) {
  return (
    <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
      {message}
    </div>
  );
}

/* ── Main page ── */
export default function SlackPage() {
  const [workspace, setWorkspace] = useState(null);
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [errorWorkspace, setErrorWorkspace] = useState(null);
  const [errorChannels, setErrorChannels] = useState(null);
  const [errorMessages, setErrorMessages] = useState(null);
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef(null);

  /* Fetch workspace + channels on mount */
  useEffect(() => {
    api
      .get("/slack/workspace")
      .then(({ data }) => setWorkspace(data.data))
      .catch((err) =>
        setErrorWorkspace(err.response?.data?.error ?? "Failed to load workspace")
      )
      .finally(() => setLoadingWorkspace(false));

    api
      .get("/slack/channels")
      .then(({ data }) => setChannels(data.data))
      .catch((err) =>
        setErrorChannels(err.response?.data?.error ?? "Failed to load channels")
      )
      .finally(() => setLoadingChannels(false));
  }, []);

  /* Fetch messages when a channel is selected */
  async function selectChannel(channel) {
    setSelectedChannel(channel);
    setMessages([]);
    setErrorMessages(null);
    setLoadingMessages(true);
    try {
      const { data } = await api.get(`/slack/channels/${channel.id}/messages`);
      setMessages(data.data);
    } catch (err) {
      setErrorMessages(err.response?.data?.error ?? "Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  }

  /* Scroll to latest message */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mt-3 flex flex-col gap-5">
      {/* ── Workspace header ── */}
      <Card extra="p-5">
        {loadingWorkspace ? (
          <WorkspaceSkeleton />
        ) : errorWorkspace ? (
          <ErrorBanner message={errorWorkspace} />
        ) : (
          <div className="flex items-center gap-4">
            {workspace.icon ? (
              <img
                src={workspace.icon}
                alt={workspace.name}
                className="h-12 w-12 rounded-xl object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-lightPrimary dark:bg-navy-700">
                <SiSlack className="h-6 w-6 text-[#E01E5A]" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <SiSlack className="h-4 w-4 text-[#E01E5A]" />
                <h3 className="text-xl font-bold text-navy-700 dark:text-white">
                  {workspace.name}
                </h3>
                <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <MdCircle className="h-2 w-2" />
                  Online
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {workspace.domain}.slack.com
                {workspace.email_domain && (
                  <span className="ml-2 text-gray-400">
                    · {workspace.email_domain}
                  </span>
                )}
              </p>
            </div>
            {!loadingChannels && !errorChannels && (
              <span className="ml-auto rounded-full bg-lightPrimary px-3 py-1 text-xs font-semibold text-navy-700 dark:bg-navy-700 dark:text-white">
                {channels.length} channel{channels.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
      </Card>

      {/* ── Two-panel layout ── */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">

        {/* Left: Channels list */}
        <Card extra="p-4 lg:w-72 xl:w-80 shrink-0 flex flex-col gap-3">
          <h4 className="text-sm font-bold text-navy-700 dark:text-white">
            Channels
          </h4>

          {/* Search */}
          <input
            type="text"
            placeholder="Search channels…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-xl border border-gray-200 bg-white/0 px-3 text-sm outline-none placeholder:text-gray-400 focus:border-brand-500 dark:border-white/10 dark:text-white dark:placeholder:text-gray-500"
          />

          <div className="flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: "60vh" }}>
            {loadingChannels ? (
              Array.from({ length: 8 }).map((_, i) => <ChannelSkeleton key={i} />)
            ) : errorChannels ? (
              <ErrorBanner message={errorChannels} />
            ) : filteredChannels.length === 0 ? (
              <p className="px-3 py-2 text-xs italic text-gray-400">
                {search ? "No channels match your search." : "No channels found."}
              </p>
            ) : (
              filteredChannels.map((ch) => (
                <ChannelRow
                  key={ch.id}
                  channel={ch}
                  isSelected={selectedChannel?.id === ch.id}
                  onClick={selectChannel}
                />
              ))
            )}
          </div>
        </Card>

        {/* Right: Messages panel */}
        <Card extra="p-0 flex-1 overflow-hidden flex flex-col">
          {/* Panel header */}
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 dark:border-white/10">
            {selectedChannel ? (
              <>
                <MdTag className="h-5 w-5 shrink-0 text-brand-500" />
                <div>
                  <h4 className="font-bold text-navy-700 dark:text-white">
                    {selectedChannel.name}
                  </h4>
                  {selectedChannel.topic && (
                    <p className="text-xs text-gray-400">{selectedChannel.topic}</p>
                  )}
                </div>
                <span className="ml-auto flex items-center gap-1 text-xs text-gray-400">
                  <MdPeople className="h-3.5 w-3.5" />
                  {selectedChannel.member_count?.toLocaleString()}
                </span>
              </>
            ) : (
              <p className="text-sm text-gray-400">
                Select a channel to view messages
              </p>
            )}
          </div>

          {/* Messages body */}
          <div
            className="flex flex-col gap-3 overflow-y-auto p-5"
            style={{ maxHeight: "65vh" }}
          >
            {!selectedChannel ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-gray-300 dark:text-gray-600">
                <SiSlack className="h-12 w-12" />
                <p className="text-sm">Pick a channel from the left to see messages</p>
              </div>
            ) : loadingMessages ? (
              Array.from({ length: 5 }).map((_, i) => <MessageSkeleton key={i} />)
            ) : errorMessages ? (
              <ErrorBanner message={errorMessages} />
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-gray-300 dark:text-gray-600">
                <MdTag className="h-10 w-10" />
                <p className="text-sm">No messages in this channel.</p>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <MessageBubble key={msg.ts} message={msg} />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
