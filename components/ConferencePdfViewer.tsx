"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type ConferencePdfViewerProps = {
  pdfPath: string;
  title: string;
};

export const ConferencePdfViewer = ({
  pdfPath,
  title,
}: ConferencePdfViewerProps) => {
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [hasError, setHasError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [pageAspectRatio, setPageAspectRatio] = useState(0.75);
  const [lastRenderedPageImage, setLastRenderedPageImage] = useState<string | null>(
    null,
  );
  const [frozenPageImage, setFrozenPageImage] = useState<string | null>(null);
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);

  const activeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const overlayContainerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [overlayContainerWidth, setOverlayContainerWidth] = useState(0);
  const [overlayContainerHeight, setOverlayContainerHeight] = useState(0);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const apply = () => setIsMobile(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const updateViewport = () => {
      setViewportWidth(window.innerWidth);
    };
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const updateWidth = () => {
      setContainerWidth(Math.floor(container.clientWidth));
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isOverlayOpen) {
      return;
    }
    const overlayContainer = overlayContainerRef.current;
    if (!overlayContainer) {
      return;
    }

    const updateSize = () => {
      setOverlayContainerWidth(Math.floor(overlayContainer.clientWidth));
      setOverlayContainerHeight(Math.floor(overlayContainer.clientHeight));
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(overlayContainer);

    return () => observer.disconnect();
  }, [isOverlayOpen]);

  useEffect(() => {
    if (!isOverlayOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOverlayOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOverlayOpen]);

  const isPreviewMode = isMobile && !isOverlayOpen;
  const visiblePage = isPreviewMode ? 1 : page;
  const maxPage = isPreviewMode ? Math.min(numPages, 1) : numPages;

  const getRenderedWidth = useMemo(
    () => (width: number) => {
      if (!width) {
        return undefined;
      }
      const base = Math.max(280, width - 24);
      if (isPreviewMode) {
        return base;
      }
      return Math.floor(base * zoom);
    },
    [isPreviewMode, zoom],
  );

  const renderedWidth = getRenderedWidth(containerWidth);
  const overlayRenderedWidth = getRenderedWidth(overlayContainerWidth);
  const overlayRenderedHeight = useMemo(() => {
    if (!overlayContainerHeight) {
      return undefined;
    }
    const baseHeight = Math.max(320, overlayContainerHeight - 24);
    return Math.floor(baseHeight * zoom);
  }, [overlayContainerHeight, zoom]);

  const overlayMaxWidth = useMemo(() => {
    if (!viewportWidth || !overlayRenderedHeight) {
      return undefined;
    }
    const targetPageWidth = overlayRenderedHeight * pageAspectRatio;
    const panelChromeWidth = 48;
    const desiredWidth = Math.ceil(targetPageWidth + panelChromeWidth);
    const viewportCap = viewportWidth - 16;
    return Math.min(desiredWidth, viewportCap);
  }, [overlayRenderedHeight, pageAspectRatio, viewportWidth]);

  const transitionToPage = (nextPage: number) => {
    const safePage = Math.min(Math.max(1, nextPage), Math.max(1, numPages));
    if (safePage === page) {
      return;
    }

    if (lastRenderedPageImage) {
      setFrozenPageImage(lastRenderedPageImage);
    } else {
      const canvas = activeCanvasRef.current;
      if (canvas) {
        try {
          setFrozenPageImage(canvas.toDataURL("image/png"));
        } catch {
          setFrozenPageImage(null);
        }
      } else {
        setFrozenPageImage(null);
      }
    }

    setIsPageTransitioning(true);
    setPage(safePage);
  };

  const renderViewer = (
    width: number | undefined,
    height: number | undefined,
    container: React.RefObject<HTMLDivElement | null>,
    expanded = false,
  ) => {
    const frameHeight = height
      ? Math.floor(height)
      : width
        ? Math.max(360, Math.floor(width / pageAspectRatio))
        : 420;

    return (
      <div
        ref={container}
        className={`overflow-auto rounded-xl border border-zinc-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900 ${
          expanded ? "h-full" : ""
        }`}
      >
        <Document
          file={pdfPath}
          loading={
            <div className="rounded-lg border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500 dark:border-slate-700 dark:text-zinc-400">
              Loading PDF...
            </div>
          }
          onLoadSuccess={({ numPages: total }) => {
            setHasError(false);
            setNumPages(total);
            setPage((current) => Math.min(Math.max(1, total), current));
          }}
          onLoadError={() => {
            setHasError(true);
            setIsPageTransitioning(false);
            setFrozenPageImage(null);
          }}
        >
          <div className="relative" style={{ minHeight: frameHeight }}>
            <Page
              pageNumber={Math.min(visiblePage, Math.max(1, numPages || 1))}
              width={height ? undefined : width}
              height={height}
              canvasRef={(canvas) => {
                if (canvas) {
                  activeCanvasRef.current = canvas;
                }
              }}
              onLoadSuccess={(loadedPage) => {
                const viewport = loadedPage.getViewport({ scale: 1 });
                if (viewport.height > 0) {
                  setPageAspectRatio(viewport.width / viewport.height);
                }
              }}
              onRenderSuccess={() => {
                const canvas = activeCanvasRef.current;
                if (canvas) {
                  try {
                    setLastRenderedPageImage(canvas.toDataURL("image/png"));
                  } catch {
                    setLastRenderedPageImage(null);
                  }
                }

                setIsPageTransitioning(false);
                setFrozenPageImage(null);
              }}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              loading={<div style={{ minHeight: frameHeight }} />}
            />
            {isPageTransitioning && frozenPageImage ? (
              <img
                src={frozenPageImage}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-10 h-full w-full object-contain"
              />
            ) : null}
          </div>
        </Document>
      </div>
    );
  };

  const controls = (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white/80 px-3 py-2 text-xs text-zinc-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-zinc-300">
      <div className="flex items-center gap-2">
        {!isPreviewMode ? (
          <>
            <button
              type="button"
              onClick={() => transitionToPage(page - 1)}
              disabled={page <= 1}
              className="rounded-md border border-zinc-200 px-2 py-1 disabled:opacity-40 dark:border-slate-700"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => transitionToPage(page + 1)}
              disabled={page >= numPages}
              className="rounded-md border border-zinc-200 px-2 py-1 disabled:opacity-40 dark:border-slate-700"
            >
              Next
            </button>
          </>
        ) : null}
        <span>
          Page {Math.min(visiblePage, Math.max(1, maxPage || 1))} of{" "}
          {Math.max(1, maxPage || 1)}
        </span>
        {isPreviewMode ? (
          <span className="rounded-full border border-current/20 px-2 py-[1px] text-[10px] uppercase tracking-[0.2em]">
            Preview
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {!isPreviewMode ? (
          <>
            <button
              type="button"
              onClick={() => setZoom((current) => Math.max(0.7, current - 0.1))}
              className="rounded-md border border-zinc-200 px-2 py-1 dark:border-slate-700"
            >
              Zoom -
            </button>
            <button
              type="button"
              onClick={() => setZoom((current) => Math.min(2, current + 0.1))}
              className="rounded-md border border-zinc-200 px-2 py-1 dark:border-slate-700"
            >
              Zoom +
            </button>
          </>
        ) : null}
        <button
          type="button"
          onClick={() => setIsOverlayOpen((current) => !current)}
          className="rounded-md border border-zinc-200 px-2 py-1 dark:border-slate-700"
        >
          {isOverlayOpen ? "Close large view" : "Expand viewer"}
        </button>
      </div>
    </div>
  );

  if (hasError) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white/80 p-5 text-sm text-zinc-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-zinc-300">
        Unable to load this PDF in the embedded viewer. Use the actions above to
        open or download the file.
      </div>
    );
  }

  const overlay =
    isOverlayOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[90] flex min-h-[100dvh] w-full items-center justify-center bg-zinc-900/60 p-2 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setIsOverlayOpen(false);
              }
            }}
          >
            <div
              className="flex h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-950"
              style={{ maxWidth: overlayMaxWidth ? `${overlayMaxWidth}px` : undefined }}
            >
              {controls}
              <div className="mt-3 min-h-0 flex-1">
                {renderViewer(
                  overlayRenderedWidth,
                  overlayRenderedHeight,
                  overlayContainerRef,
                  true,
                )}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="space-y-4">
      {controls}
      {renderViewer(renderedWidth, undefined, containerRef)}
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{title}</p>
      {overlay}
    </div>
  );
};
