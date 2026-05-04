import { useEffect, useState } from "react";
import { SiTrello } from "react-icons/si";
import { MdArrowBack, MdAccessTime, MdCheckCircle } from "react-icons/md";
import Card from "components/card";
import api from "services/api";

/* ── Trello label colour → Tailwind ── */
const LABEL_BG = {
  red: "bg-red-500",
  orange: "bg-orange-400",
  yellow: "bg-yellow-400",
  green: "bg-green-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  pink: "bg-pink-400",
  sky: "bg-sky-400",
  lime: "bg-lime-400",
  black: "bg-gray-700",
};
const labelBg = (color) => LABEL_BG[color] ?? "bg-gray-400";

/* ── Board accent colour strip (uses Trello background colour if available) ── */
const BOARD_ACCENTS = [
  "bg-blue-500", "bg-purple-500", "bg-green-500",
  "bg-orange-400", "bg-pink-500", "bg-cyan-500",
];
const boardAccent = (idx) => BOARD_ACCENTS[idx % BOARD_ACCENTS.length];

/* ── Helpers ── */
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });
}

function DueBadge({ due, dueComplete }) {
  if (!due) return null;
  const dueDate = new Date(due);
  const now = new Date();
  const hoursLeft = (dueDate - now) / 3_600_000;

  let cls, icon;
  if (dueComplete) {
    cls = "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    icon = <MdCheckCircle className="h-3 w-3" />;
  } else if (dueDate < now) {
    cls = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    icon = <MdAccessTime className="h-3 w-3" />;
  } else if (hoursLeft < 24) {
    cls = "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
    icon = <MdAccessTime className="h-3 w-3" />;
  } else {
    cls = "bg-gray-100 text-gray-600 dark:bg-navy-700 dark:text-gray-400";
    icon = <MdAccessTime className="h-3 w-3" />;
  }

  return (
    <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {icon}
      {formatDate(due)}
    </span>
  );
}

/* ── Sub-components ── */
function BoardCard({ board, index, onClick }) {
  return (
    <button
      onClick={() => onClick(board)}
      className="group text-left w-full"
    >
      <Card extra="overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer">
        {/* Colour strip */}
        <div className={`h-2 w-full ${boardAccent(index)}`} />
        <div className="flex flex-col gap-2 p-5">
          <div className="flex items-center gap-2">
            <SiTrello className={`h-4 w-4 shrink-0 text-blue-500`} />
            <h3 className="truncate font-bold text-navy-700 group-hover:text-brand-500 dark:text-white dark:group-hover:text-brand-400">
              {board.name}
            </h3>
          </div>
          {board.desc && (
            <p className="line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
              {board.desc}
            </p>
          )}
          <p className="mt-1 text-[11px] text-gray-400">
            {board.last_activity
              ? `Actif depuis le ${formatDate(board.last_activity)}`
              : "Aucune activité récente"}
          </p>
        </div>
      </Card>
    </button>
  );
}

function TrelloCard({ card }) {
  return (
    <a href={card.url} target="_blank" rel="noreferrer" className="group block">
      <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-shadow duration-150 hover:shadow-md dark:border-white/10 dark:bg-navy-700">
        {/* Labels */}
        {card.labels.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {card.labels.map((l) => (
              <span
                key={l.id}
                title={l.name}
                className={`h-1.5 w-8 rounded-full ${labelBg(l.color)}`}
              />
            ))}
          </div>
        )}

        {/* Name */}
        <p className="text-sm font-semibold text-navy-700 group-hover:text-brand-500 dark:text-white dark:group-hover:text-brand-400">
          {card.name}
        </p>

        {/* Description */}
        {card.desc && (
          <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
            {card.desc}
          </p>
        )}

        {/* Footer */}
        {card.due && (
          <div className="mt-2">
            <DueBadge due={card.due} dueComplete={card.due_complete} />
          </div>
        )}
      </div>
    </a>
  );
}

function ListColumn({ list, cards }) {
  return (
    <div className="flex w-72 shrink-0 flex-col gap-3">
      {/* Column header */}
      <div className="flex items-center justify-between rounded-xl bg-lightPrimary px-4 py-2.5 dark:bg-navy-800">
        <h4 className="text-sm font-bold text-navy-700 dark:text-white">
          {list.name}
        </h4>
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-navy-700 dark:text-gray-400">
          {cards.length}
        </span>
      </div>
      {/* Cards */}
      <div className="flex flex-col gap-2">
        {cards.length === 0 ? (
          <p className="px-2 text-xs italic text-gray-400">Aucune carte</p>
        ) : (
          cards.map((card) => <TrelloCard key={card.id} card={card} />)
        )}
      </div>
    </div>
  );
}

/* ── Skeletons ── */
function BoardSkeleton() {
  return (
    <Card extra="overflow-hidden animate-pulse">
      <div className="h-2 w-full bg-gray-200 dark:bg-navy-700" />
      <div className="flex flex-col gap-2 p-5">
        <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-navy-700" />
        <div className="h-3 w-full rounded bg-gray-200 dark:bg-navy-700" />
        <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-navy-700" />
      </div>
    </Card>
  );
}

function KanbanSkeleton() {
  return (
    <div className="flex gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex w-72 shrink-0 animate-pulse flex-col gap-3">
          <div className="h-10 rounded-xl bg-gray-200 dark:bg-navy-700" />
          {Array.from({ length: 3 }).map((_, j) => (
            <div key={j} className="h-20 rounded-xl bg-gray-200 dark:bg-navy-700" />
          ))}
        </div>
      ))}
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
export default function TrelloPage() {
  const [boards, setBoards] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [cards, setCards] = useState([]);
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [errorBoards, setErrorBoards] = useState(null);
  const [errorDetail, setErrorDetail] = useState(null);

  /* Fetch boards on mount */
  useEffect(() => {
    api
      .get("/trello/boards")
      .then(({ data }) => setBoards(data.data))
      .catch((err) =>
        setErrorBoards(err.response?.data?.error ?? "Impossible de charger les tableaux")
      )
      .finally(() => setLoadingBoards(false));
  }, []);

  /* Fetch lists + cards when a board is selected */
  async function selectBoard(board) {
    setSelectedBoard(board);
    setLoadingDetail(true);
    setErrorDetail(null);
    setLists([]);
    setCards([]);
    try {
      const [listsRes, cardsRes] = await Promise.all([
        api.get(`/trello/boards/${board.id}/lists`),
        api.get(`/trello/boards/${board.id}/cards`),
      ]);
      setLists(listsRes.data.data);
      setCards(cardsRes.data.data);
    } catch (err) {
      setErrorDetail(err.response?.data?.error ?? "Impossible de charger les détails du tableau");
    } finally {
      setLoadingDetail(false);
    }
  }

  function goBack() {
    setSelectedBoard(null);
    setLists([]);
    setCards([]);
    setErrorDetail(null);
  }

  /* Group cards by list_id, preserving list order */
  const cardsByList = lists.reduce((acc, list) => {
    acc[list.id] = cards.filter((c) => c.list_id === list.id);
    return acc;
  }, {});

  /* ── Boards view ── */
  if (!selectedBoard) {
    return (
      <div className="mt-3 flex flex-col gap-5">
        {/* Header */}
        <Card extra="p-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-lightPrimary p-3 dark:bg-navy-700">
              <SiTrello className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-navy-700 dark:text-white">
                Trello
              </h3>
              <p className="text-sm text-gray-500">
                {loadingBoards ? "Chargement…" : `${boards.length} tableau${boards.length !== 1 ? "x" : ""}`}
              </p>
            </div>
          </div>
        </Card>

        {/* Board grid */}
        {loadingBoards ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <BoardSkeleton key={i} />)}
          </div>
        ) : errorBoards ? (
          <ErrorBanner message={errorBoards} />
        ) : boards.length === 0 ? (
          <Card extra="p-10 flex flex-col items-center gap-3 text-gray-400">
            <SiTrello className="h-10 w-10" />
            <p className="text-sm">Aucun tableau trouvé.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {boards.map((board, i) => (
              <BoardCard key={board.id} board={board} index={i} onClick={selectBoard} />
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ── Board detail (Kanban) view ── */
  return (
    <div className="mt-3 flex flex-col gap-5">
      {/* Header with back button */}
      <Card extra="p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={goBack}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-lightPrimary hover:text-navy-700 dark:hover:bg-navy-700 dark:hover:text-white"
          >
            <MdArrowBack className="h-4 w-4" />
            Tableaux
          </button>
          <span className="text-gray-300 dark:text-white/20">/</span>
          <div className="flex items-center gap-2">
            <SiTrello className="h-4 w-4 text-blue-500" />
            <h3 className="text-lg font-bold text-navy-700 dark:text-white">
              {selectedBoard.name}
            </h3>
          </div>
        </div>
        {!loadingDetail && !errorDetail && (
          <p className="text-sm text-gray-500">
            {lists.length} liste{lists.length !== 1 ? "s" : ""} · {cards.length} carte{cards.length !== 1 ? "s" : ""}
          </p>
        )}
      </Card>

      {/* Kanban board */}
      {loadingDetail ? (
        <KanbanSkeleton />
      ) : errorDetail ? (
        <ErrorBanner message={errorDetail} />
      ) : lists.length === 0 ? (
        <Card extra="p-10 flex flex-col items-center gap-3 text-gray-400">
          <SiTrello className="h-10 w-10" />
          <p className="text-sm">Ce tableau ne contient aucune liste.</p>
        </Card>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4" style={{ minWidth: "max-content" }}>
            {lists.map((list) => (
              <ListColumn
                key={list.id}
                list={list}
                cards={cardsByList[list.id] ?? []}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
