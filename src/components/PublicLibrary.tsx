"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  startTransition,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type {
  DayActivityDto,
  PublicLibraryDto,
} from "@/backend/application/trades/query-public-library";
import type { TradeReviewRecord } from "@/backend/ports/trade-catalog";
import { groupTradesByDate } from "@/lib/group-trades-by-date";
import {
  clearTradeSearchDates,
  parseTradeSearchQuery,
  setTradeSearchDateRange,
  toggleTradeSearchTag,
} from "@/lib/trade-search";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function hrefFor(pathname: string, query: string): string {
  return query ? `${pathname}?q=${encodeURIComponent(query)}` : pathname;
}

function youtubeEmbedUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const hostname = url.hostname.replace(/^www\./, "");
    const videoId =
      hostname === "youtu.be"
        ? url.pathname.split("/").filter(Boolean)[0]
        : (url.searchParams.get("v") ??
          url.pathname.match(/^\/(?:shorts|live|embed)\/([^/]+)/)?.[1]);
    return videoId && /^[\w-]{6,}$/.test(videoId)
      ? `https://www.youtube-nocookie.com/embed/${videoId}`
      : null;
  } catch {
    return null;
  }
}

interface PublicLibraryProps {
  library: PublicLibraryDto;
  query: string;
  selectedTrade?: TradeReviewRecord;
}

export function PublicLibrary({
  library,
  query,
  selectedTrade,
}: PublicLibraryProps) {
  const router = useRouter();
  const [queryDraft, setQueryDraft] = useState(query);
  const parsed = parseTradeSearchQuery(query);
  const tradeGroups = groupTradesByDate(library.trades);

  useEffect(() => {
    if (queryDraft === query) return;
    const timer = window.setTimeout(() => {
      startTransition(() => router.push(hrefFor("/", queryDraft.trim())));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [query, queryDraft, router]);

  function applyQuery(nextQuery: string): void {
    setQueryDraft(nextQuery);
    startTransition(() => router.push(hrefFor("/", nextQuery)));
  }

  return (
    <main className="public-library-shell">
      <aside className="public-sidebar">
        <header className="public-sidebar-header">
          <Link className="library-home-link" href={hrefFor("/", query)}>
            <span className="library-monogram" aria-hidden="true">
              T
            </span>
            <span>
              <small>Review library</small>
              <strong>Trades</strong>
            </span>
          </Link>
        </header>

        <div className="trade-search">
          <label htmlFor="trade-query">Search the library</label>
          <div className="trade-search-field">
            <span aria-hidden="true">⌕</span>
            <input
              id="trade-query"
              value={queryDraft}
              placeholder="tag:breakout date:2026-07-25"
              onChange={(event) => setQueryDraft(event.target.value)}
            />
            {queryDraft && (
              <button
                type="button"
                title="Clear search"
                aria-label="Clear search"
                onClick={() => applyQuery("")}
              >
                ×
              </button>
            )}
          </div>
          {parsed.errors.length > 0 && (
            <p className="query-error">{parsed.errors[0]}</p>
          )}
        </div>

        <div className="public-result-count">
          <span>{query ? "Filtered reviews" : "All reviews"}</span>
          <strong>{library.trades.length}</strong>
        </div>

        <nav className="public-trade-list" aria-label="Trade reviews">
          {tradeGroups.map((group) => (
            <section className="public-trade-day" key={group.date}>
              <h2 className="public-trade-day-heading">
                <time dateTime={group.date}>{formatDate(group.date)}</time>
                <span>{group.trades.length}</span>
              </h2>
              <div className="public-trade-day-items">
                {group.trades.map((trade) => (
                  <Link
                    className={`public-trade-item ${selectedTrade?.id === trade.id ? "is-selected" : ""}`}
                    href={hrefFor(`/trades/${trade.id}`, query)}
                    key={trade.id}
                  >
                    <span className="public-trade-item-heading">
                      <strong>{trade.title || "Untitled trade"}</strong>
                      <span
                        className={`direction direction-${trade.direction}`}
                      >
                        {trade.direction}
                      </span>
                    </span>
                    {trade.tags.length > 0 && (
                      <span className="list-tags">
                        {trade.tags.slice(0, 3).map((tag) => (
                          <span key={tag}>#{tag}</span>
                        ))}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          ))}
          {library.trades.length === 0 && (
            <div className="public-no-results">
              <strong>No matching reviews</strong>
              <span>Adjust the query or clear the filters.</span>
            </div>
          )}
        </nav>
      </aside>

      <section className="public-workspace">
        {selectedTrade ? (
          <PublicTradeDocument trade={selectedTrade} query={query} />
        ) : (
          <DiscoveryHome
            library={library}
            query={query}
            onQueryChange={applyQuery}
          />
        )}
      </section>
    </main>
  );
}

function DiscoveryHome({
  library,
  query,
  onQueryChange,
}: {
  library: PublicLibraryDto;
  query: string;
  onQueryChange: (query: string) => void;
}) {
  const parsed = parseTradeSearchQuery(query);
  const selectedFrom = parsed.date ?? parsed.from;
  const selectedTo = parsed.date ?? parsed.to;
  const initialDate = selectedFrom
    ? new Date(`${selectedFrom}T12:00:00`)
    : new Date();
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
  );

  return (
    <div className="discovery-home">
      <header className="discovery-header">
        <h1>Trade reviews</h1>
      </header>

      <section className="filter-section" aria-labelledby="tag-heading">
        <div className="filter-section-heading">
          <div>
            <p className="eyebrow">Patterns</p>
            <h2 id="tag-heading">Browse by tag</h2>
          </div>
          {parsed.tags.length > 0 && <span>{parsed.tags.length} selected</span>}
        </div>
        <div className="tag-facets">
          {library.tags.map((tag) => {
            const selected = parsed.tags.includes(tag.name);
            return (
              <button
                type="button"
                className={selected ? "is-selected" : ""}
                aria-pressed={selected}
                key={tag.name}
                onClick={() =>
                  onQueryChange(toggleTradeSearchTag(query, tag.name))
                }
              >
                <span>#{tag.name}</span>
                <strong>{tag.count}</strong>
              </button>
            );
          })}
          {library.tags.length === 0 && (
            <p className="empty-filter">
              Tags will appear as reviews are added.
            </p>
          )}
        </div>
      </section>

      <CalendarFilter
        activities={library.days}
        selectedFrom={selectedFrom}
        selectedTo={selectedTo}
        visibleMonth={visibleMonth}
        onMonthChange={setVisibleMonth}
        onRangeChange={(from, to) =>
          onQueryChange(setTradeSearchDateRange(query, from, to))
        }
        onClearDates={() => onQueryChange(clearTradeSearchDates(query))}
      />
    </div>
  );
}

function CalendarFilter({
  activities,
  selectedFrom,
  selectedTo,
  visibleMonth,
  onMonthChange,
  onRangeChange,
  onClearDates,
}: {
  activities: DayActivityDto[];
  selectedFrom?: string;
  selectedTo?: string;
  visibleMonth: Date;
  onMonthChange: (date: Date) => void;
  onRangeChange: (from: string, to: string) => void;
  onClearDates: () => void;
}) {
  const dragStart = useRef<string | undefined>(undefined);
  const dragCurrent = useRef<string | undefined>(undefined);
  const [dragPreview, setDragPreview] = useState<
    { from: string; to: string } | undefined
  >(undefined);
  const activity = new Map(activities.map((day) => [day.date, day.count]));
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const leadingDays = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = [
    ...Array<null>(leadingDays).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const activeFrom = dragPreview?.from ?? selectedFrom;
  const activeTo = dragPreview?.to ?? selectedTo ?? selectedFrom;

  function orderedRange(first: string, second: string) {
    const [from, to] = [first, second].sort();
    return { from, to };
  }

  function selectDate(date: string): void {
    if (selectedFrom && selectedTo === selectedFrom) {
      if (date === selectedFrom) {
        onClearDates();
      } else {
        onRangeChange(selectedFrom, date);
      }
      return;
    }
    onRangeChange(date, date);
  }

  function beginRange(
    event: ReactPointerEvent<HTMLButtonElement>,
    date: string,
  ): void {
    if (event.button !== 0) return;
    event.preventDefault();
    dragStart.current = date;
    dragCurrent.current = date;
    setDragPreview({ from: date, to: date });
    event.currentTarget
      .closest(".calendar-grid")
      ?.setPointerCapture(event.pointerId);
  }

  function moveRange(event: ReactPointerEvent<HTMLDivElement>): void {
    if (!dragStart.current) return;
    const element = document.elementFromPoint(event.clientX, event.clientY);
    const date =
      element?.closest<HTMLButtonElement>("button[data-date]")?.dataset.date;
    if (!date || date === dragCurrent.current) return;
    dragCurrent.current = date;
    setDragPreview(orderedRange(dragStart.current, date));
  }

  function finishRange(event: ReactPointerEvent<HTMLDivElement>): void {
    const from = dragStart.current;
    const to = dragCurrent.current;
    dragStart.current = undefined;
    dragCurrent.current = undefined;
    setDragPreview(undefined);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (!from || !to) return;
    if (from === to) selectDate(from);
    else onRangeChange(from, to);
  }

  function cancelRange(): void {
    dragStart.current = undefined;
    dragCurrent.current = undefined;
    setDragPreview(undefined);
  }

  return (
    <section
      className="filter-section calendar-section"
      aria-labelledby="calendar-heading"
    >
      <div className="filter-section-heading calendar-heading">
        <div>
          <p className="eyebrow">Timeline</p>
          <h2 id="calendar-heading">
            {new Intl.DateTimeFormat("en", {
              month: "long",
              year: "numeric",
            }).format(visibleMonth)}
          </h2>
        </div>
        <div className="calendar-navigation">
          <button
            type="button"
            aria-label="Previous month"
            title="Previous month"
            onClick={() => onMonthChange(new Date(year, month - 1, 1))}
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Next month"
            title="Next month"
            onClick={() => onMonthChange(new Date(year, month + 1, 1))}
          >
            →
          </button>
        </div>
      </div>
      <div
        className="calendar-grid"
        onPointerMove={moveRange}
        onPointerUp={finishRange}
        onPointerCancel={cancelRange}
      >
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <span className="weekday" key={day}>
            {day}
          </span>
        ))}
        {cells.map((day, index) => {
          if (day === null)
            return <span className="calendar-blank" key={`blank-${index}`} />;
          const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const count = activity.get(date) ?? 0;
          const isInRange = Boolean(
            activeFrom && activeTo && date >= activeFrom && date <= activeTo,
          );
          return (
            <button
              type="button"
              data-date={date}
              className={`${count > 0 ? "has-trades" : ""} ${isInRange ? "is-in-range" : ""} ${activeFrom === date ? "is-range-start" : ""} ${activeTo === date ? "is-range-end" : ""}`}
              aria-pressed={isInRange}
              key={date}
              onPointerDown={(event) => beginRange(event, date)}
              onClick={(event) => {
                if (event.detail === 0) selectDate(date);
              }}
            >
              <time dateTime={date}>{day}</time>
              {count > 0 && (
                <span>
                  {count} {count === 1 ? "trade" : "trades"}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function PublicTradeDocument({
  trade,
  query,
}: {
  trade: TradeReviewRecord;
  query: string;
}) {
  const videoUrl = youtubeEmbedUrl(trade.youtubeUrl);
  return (
    <article className="public-trade-document">
      <Link className="back-to-library" href={hrefFor("/", query)}>
        ← Library home
      </Link>
      <header>
        <div className="public-trade-meta">
          <time dateTime={trade.date}>{formatDate(trade.date)}</time>
          <span className={`direction direction-${trade.direction}`}>
            {trade.direction}
          </span>
        </div>
        <h1>{trade.title || "Untitled trade"}</h1>
        {trade.tags.length > 0 && (
          <div className="public-trade-tags">
            {trade.tags.map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
        )}
      </header>

      {(["entry", "exits"] as const).map((role) => {
        const images = trade.images.filter((image) => image.role === role);
        if (images.length === 0) return null;
        return (
          <section className="public-document-section" key={role}>
            <p className="eyebrow">
              {role === "entry" ? "Entry context" : "Outcome"}
            </p>
            <h2>
              {role === "entry"
                ? "When taking entry"
                : "After taking all exits"}
            </h2>
            <div className="public-screenshots">
              {images.map((image) => (
                <figure key={image.id}>
                  <a
                    href={`/api/images/${image.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/images/${image.id}`}
                      alt={`${role} chart for ${trade.title}`}
                    />
                  </a>
                </figure>
              ))}
            </div>
          </section>
        );
      })}

      {videoUrl && (
        <section className="public-document-section">
          <p className="eyebrow">Replay</p>
          <h2>Trade video</h2>
          <div className="video-frame">
            <iframe src={videoUrl} title="Trade replay video" allowFullScreen />
          </div>
        </section>
      )}

      {trade.notes && (
        <section className="public-document-section public-notes">
          <p className="eyebrow">Review notes</p>
          <h2>Notes</h2>
          <p>{trade.notes}</p>
        </section>
      )}
    </article>
  );
}
