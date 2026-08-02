"use client";

import Link from "next/link";
import {
  type ChangeEvent,
  type ClipboardEvent as ReactClipboardEvent,
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  createTrade,
  listTrades,
  removeTrade,
  removeTradeImage,
  saveTrade,
  uploadTradeImage,
  type TradeImage,
  type TradeImageRole,
  type TradeReview,
} from "../lib/trade-library";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function Screenshot({
  image,
  onRemove,
}: {
  image: TradeImage;
  onRemove: () => Promise<void>;
}) {
  const source = `/api/images/${image.id}`;

  return (
    <figure className="screenshot">
      <a href={source} target="_blank" rel="noreferrer" title="Open full size">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={source} alt="Annotated trade chart" />
      </a>
      <button
        className="icon-button screenshot-remove"
        type="button"
        title={`Remove ${image.name}`}
        aria-label={`Remove ${image.name}`}
        onClick={() => void onRemove()}
      >
        ×
      </button>
    </figure>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="field-label">{children}</span>;
}

function youtubeEmbedUrl(value: string | null): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    const hostname = url.hostname.replace(/^www\./, "");
    let videoId: string | null = null;

    if (hostname === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] ?? null;
    } else if (hostname === "youtube.com") {
      videoId =
        url.searchParams.get("v") ??
        url.pathname.match(/^\/(?:shorts|live|embed)\/([^/]+)/)?.[1] ??
        null;
    }

    return videoId && /^[\w-]{6,}$/.test(videoId)
      ? `https://www.youtube-nocookie.com/embed/${videoId}`
      : null;
  } catch {
    return null;
  }
}

export function JournalApp() {
  const [trades, setTrades] = useState<TradeReview[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [draggingRole, setDraggingRole] = useState<TradeImageRole | null>(null);
  const [uploadingRole, setUploadingRole] = useState<TradeImageRole | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState("");
  const entryFileInput = useRef<HTMLInputElement>(null);
  const exitsFileInput = useRef<HTMLInputElement>(null);
  const saveTimers = useRef<Record<string, number>>({});
  const selectedTrade = trades.find((trade) => trade.id === selectedId);

  useEffect(() => {
    void listTrades()
      .then((storedTrades) => {
        setTrades(storedTrades);
        setSelectedId(storedTrades[0]?.id ?? "");
      })
      .catch(() => setErrorMessage("Could not load the review library."))
      .finally(() => setIsLoading(false));
  }, []);

  const existingTags = Array.from(
    new Set(trades.flatMap((trade) => trade.tags)),
  ).sort();

  function updateTrade(update: (trade: TradeReview) => TradeReview): void {
    if (!selectedTrade) return;

    const next = {
      ...update(selectedTrade),
      updatedAt: new Date().toISOString(),
    };
    setTrades((current) =>
      current.map((trade) => (trade.id === next.id ? next : trade)),
    );
    window.clearTimeout(saveTimers.current[next.id]);
    saveTimers.current[next.id] = window.setTimeout(() => {
      void saveTrade(next).catch(() =>
        setErrorMessage("Changes could not be saved."),
      );
    }, 450);
  }

  async function handleCreate(): Promise<void> {
    try {
      const trade = await createTrade();
      setTrades((current) => [trade, ...current]);
      setSelectedId(trade.id);
      setErrorMessage("");
    } catch {
      setErrorMessage("The trade could not be created.");
    }
  }

  async function handleDelete(): Promise<void> {
    if (!selectedTrade || !window.confirm("Delete this trade review?")) return;

    try {
      window.clearTimeout(saveTimers.current[selectedTrade.id]);
      await removeTrade(selectedTrade.id);
      const remaining = trades.filter((trade) => trade.id !== selectedTrade.id);
      setTrades(remaining);
      setSelectedId(remaining[0]?.id ?? "");
      setErrorMessage("");
    } catch {
      setErrorMessage("The trade could not be deleted.");
    }
  }

  function addTag(): void {
    const tag = tagDraft.trim().replace(/^#/, "").toLowerCase();
    if (!tag || !selectedTrade || selectedTrade.tags.includes(tag)) {
      setTagDraft("");
      return;
    }
    updateTrade((trade) => ({ ...trade, tags: [...trade.tags, tag] }));
    setTagDraft("");
  }

  function handleTagKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag();
    }
  }

  async function addImages(
    files: FileList | File[],
    role: TradeImageRole,
  ): Promise<void> {
    if (!selectedTrade) return;
    const images = Array.from(files).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (images.length === 0) return;

    setUploadingRole(role);
    setErrorMessage("");
    try {
      for (const image of images) {
        const created = await uploadTradeImage(selectedTrade.id, image, role);
        setTrades((current) =>
          current.map((trade) =>
            trade.id === selectedTrade.id
              ? { ...trade, images: [...trade.images, created] }
              : trade,
          ),
        );
      }
    } catch {
      setErrorMessage("One or more screenshots could not be uploaded.");
    } finally {
      setUploadingRole(null);
    }
  }

  function handleFiles(
    event: ChangeEvent<HTMLInputElement>,
    role: TradeImageRole,
  ): void {
    if (event.target.files) void addImages(event.target.files, role);
    event.target.value = "";
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>,
    role: TradeImageRole,
  ): void {
    event.preventDefault();
    setDraggingRole(null);
    void addImages(event.dataTransfer.files, role);
  }

  function handlePaste(
    event: ReactClipboardEvent<HTMLDivElement>,
    role: TradeImageRole,
  ): void {
    const images = Array.from(event.clipboardData.files).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (images.length > 0) void addImages(images, role);
  }

  function renderChart(
    role: TradeImageRole,
    number: string,
    title: string,
    input: RefObject<HTMLInputElement | null>,
  ): ReactNode {
    if (!selectedTrade) return null;

    return (
      <div className="chart-group">
        <div className="chart-group-heading">
          <span>{number}</span>
          <h3>{title}</h3>
          <button
            className="upload-button"
            type="button"
            disabled={uploadingRole !== null}
            onClick={() => input.current?.click()}
          >
            <span aria-hidden="true">+</span>{" "}
            {uploadingRole === role ? "Uploading..." : "Add chart"}
          </button>
          <input
            ref={input}
            className="visually-hidden"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => handleFiles(event, role)}
          />
        </div>

        <div className="screenshots">
          {selectedTrade.images
            .filter((image) => image.role === role)
            .map((image) => (
              <Screenshot
                image={image}
                key={image.id}
                onRemove={async () => {
                  try {
                    await removeTradeImage(selectedTrade.id, image.id);
                    setTrades((current) =>
                      current.map((trade) =>
                        trade.id === selectedTrade.id
                          ? {
                              ...trade,
                              images: trade.images.filter(
                                (candidate) => candidate.id !== image.id,
                              ),
                            }
                          : trade,
                      ),
                    );
                  } catch {
                    setErrorMessage("The screenshot could not be removed.");
                  }
                }}
              />
            ))}
        </div>

        <div
          className={`drop-zone ${draggingRole === role ? "is-dragging" : ""}`}
          tabIndex={0}
          onPaste={(event) => handlePaste(event, role)}
          onDragEnter={(event) => {
            event.preventDefault();
            setDraggingRole(role);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDraggingRole(null)}
          onDrop={(event) => handleDrop(event, role)}
        >
          <span className="drop-icon" aria-hidden="true">
            +
          </span>
          <strong>Drop or paste chart</strong>
        </div>
      </div>
    );
  }

  return (
    <main className="library-shell">
      {errorMessage && (
        <button
          className="error-banner"
          type="button"
          title="Dismiss"
          onClick={() => setErrorMessage("")}
        >
          {errorMessage} <span aria-hidden="true">×</span>
        </button>
      )}
      <aside className="library-sidebar">
        <header className="sidebar-header">
          <div>
            <p className="eyebrow">Review library</p>
            <h1>Trades</h1>
          </div>
          <div className="admin-sidebar-actions">
            <Link href="/" title="Open public library">
              Public site
            </Link>
            <form action="/api/auth/logout" method="post">
              <button type="submit">Log out</button>
            </form>
            <button
              className="new-trade-button"
              type="button"
              onClick={() => void handleCreate()}
            >
              <span aria-hidden="true">+</span> New trade
            </button>
          </div>
        </header>

        <nav className="trade-list" aria-label="Trade reviews">
          {trades.map((trade) => (
            <button
              className={`trade-list-item ${trade.id === selectedId ? "is-selected" : ""}`}
              type="button"
              key={trade.id}
              onClick={() => setSelectedId(trade.id)}
            >
              <span className="trade-list-topline">
                <time>{formatDate(trade.date)}</time>
                <span className={`direction direction-${trade.direction}`}>
                  {trade.direction}
                </span>
              </span>
              <strong>{trade.title || "Untitled trade"}</strong>
              {trade.tags.length > 0 && (
                <span className="list-tags">
                  {trade.tags.slice(0, 3).map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </span>
              )}
            </button>
          ))}
        </nav>

        {!isLoading && trades.length === 0 && (
          <div className="sidebar-empty">
            <p>No reviews yet.</p>
            <span>Create one after your next trade.</span>
          </div>
        )}
        <footer className="sidebar-footer">{trades.length} reviews</footer>
      </aside>

      <section className="workspace">
        {selectedTrade ? (
          <div className="review-document">
            <header className="document-header">
              <input
                className="title-input"
                aria-label="Trade title"
                value={selectedTrade.title}
                onChange={(event) =>
                  updateTrade((trade) => ({
                    ...trade,
                    title: event.target.value,
                  }))
                }
              />
              <button
                className="icon-button delete-trade"
                type="button"
                title="Delete trade"
                aria-label="Delete trade"
                onClick={() => void handleDelete()}
              >
                ×
              </button>
            </header>

            <div className="properties">
              <label className="property">
                <FieldLabel>Date</FieldLabel>
                <input
                  type="date"
                  value={selectedTrade.date}
                  onChange={(event) =>
                    updateTrade((trade) => ({
                      ...trade,
                      date: event.target.value,
                    }))
                  }
                />
              </label>

              <div className="property">
                <FieldLabel>Direction</FieldLabel>
                <div className="direction-control" aria-label="Direction">
                  {(["long", "short"] as const).map((direction) => (
                    <button
                      type="button"
                      className={
                        selectedTrade.direction === direction ? "is-active" : ""
                      }
                      key={direction}
                      onClick={() =>
                        updateTrade((trade) => ({ ...trade, direction }))
                      }
                    >
                      {direction}
                    </button>
                  ))}
                </div>
              </div>

              <div className="property property-tags">
                <FieldLabel>Tags</FieldLabel>
                <div className="tag-editor">
                  <input
                    aria-label="Add tag"
                    placeholder="Add a tag"
                    list="existing-tags"
                    value={tagDraft}
                    onChange={(event) => setTagDraft(event.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={addTag}
                  />
                  {selectedTrade.tags.map((tag) => (
                    <button
                      className="tag"
                      type="button"
                      title={`Remove ${tag}`}
                      key={tag}
                      onClick={() =>
                        updateTrade((trade) => ({
                          ...trade,
                          tags: trade.tags.filter(
                            (candidate) => candidate !== tag,
                          ),
                        }))
                      }
                    >
                      #{tag} <span aria-hidden="true">×</span>
                    </button>
                  ))}
                  <datalist id="existing-tags">
                    {existingTags.map((tag) => (
                      <option value={tag} key={tag} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>

            <section className="document-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Primary evidence</p>
                  <h2>Entry chart</h2>
                </div>
              </div>
              {renderChart("entry", "01", "When taking entry", entryFileInput)}
            </section>

            <section className="document-section notes-section">
              <p className="eyebrow">Before and during</p>
              <h2>Initial notes</h2>
              <textarea
                aria-label="Initial notes"
                placeholder="Capture the idea, entry context, invalidation, or plan..."
                value={selectedTrade.initialNotes}
                onChange={(event) =>
                  updateTrade((trade) => ({
                    ...trade,
                    initialNotes: event.target.value,
                  }))
                }
              />
            </section>

            <section className="document-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Outcome evidence</p>
                  <h2>Exit chart</h2>
                </div>
              </div>
              {renderChart(
                "exits",
                "02",
                "After taking all exits",
                exitsFileInput,
              )}
            </section>

            <section className="document-section notes-section">
              <p className="eyebrow">After the trade</p>
              <h2>Final notes</h2>
              <textarea
                aria-label="Final notes"
                placeholder="Capture execution, outcome, lessons, or anything worth remembering..."
                value={selectedTrade.finalNotes}
                onChange={(event) =>
                  updateTrade((trade) => ({
                    ...trade,
                    finalNotes: event.target.value,
                  }))
                }
              />
            </section>

            <section className="document-section video-section">
              <p className="eyebrow">Optional replay</p>
              <h2>YouTube video</h2>
              <input
                type="url"
                aria-label="YouTube video URL"
                placeholder="https://youtube.com/watch?v=..."
                value={selectedTrade.youtubeUrl ?? ""}
                onChange={(event) =>
                  updateTrade((trade) => ({
                    ...trade,
                    youtubeUrl: event.target.value || null,
                  }))
                }
              />
              {youtubeEmbedUrl(selectedTrade.youtubeUrl) && (
                <div className="video-frame">
                  <iframe
                    src={youtubeEmbedUrl(selectedTrade.youtubeUrl) ?? undefined}
                    title="Trade replay video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="workspace-empty">
            <span className="empty-mark">T</span>
            <h2>Your trade reviews live here.</h2>
            <p>Create a review, add your annotated charts, and move on.</p>
            <button type="button" onClick={() => void handleCreate()}>
              Create first review
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
