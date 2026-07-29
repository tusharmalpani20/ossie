import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@repo/ui/button";
import { ChevronLeft, ChevronRight, Minus, Plus, X } from "lucide-react";
import styles from "./GuideScreenshotViewer.module.css";

export type GuideScreenshotViewerImage = {
  id: string;
  sourceAssetId: string;
  src: string;
  alt: string;
  title: string;
};

export type GuideScreenshotViewerProps = {
  images: GuideScreenshotViewerImage[];
  activeImageId: string | null;
  onActiveImageChange: (imageId: string) => void;
  onClose: () => void;
};

const zoomLevels = [0.75, 1, 1.25, 1.5, 2, 3] as const;

type ZoomState = "fit" | typeof zoomLevels[number];

const zoomLabel = (zoom: ZoomState) => (
  zoom === "fit" ? "Fit" : `${Math.round(zoom * 100)}%`
);

const nextZoom = (zoom: ZoomState) => {
  if (zoom === "fit") {
    return 1;
  }

  const index = zoomLevels.indexOf(zoom);
  return zoomLevels[Math.min(index + 1, zoomLevels.length - 1)] ?? zoom;
};

const previousZoom = (zoom: ZoomState) => {
  if (zoom === "fit") {
    return "fit";
  }

  const index = zoomLevels.indexOf(zoom);
  return zoomLevels[Math.max(index - 1, 0)] ?? zoom;
};

export const GuideScreenshotViewer = ({
  images,
  activeImageId,
  onActiveImageChange,
  onClose,
}: GuideScreenshotViewerProps) => {
  const [zoom, setZoom] = useState<ZoomState>("fit");
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const activeIndex = images.findIndex((image) => image.id === activeImageId);
  const activeImage = activeIndex >= 0 ? images[activeIndex] : null;
  const isOpen = activeImage !== null;
  const hasMultipleImages = images.length > 1;

  const navigation = useMemo(() => {
    if (!activeImage || activeIndex < 0) {
      return {
        previous: null,
        next: null,
      };
    }

    return {
      previous: activeIndex > 0 ? images[activeIndex - 1] : null,
      next: activeIndex < images.length - 1 ? images[activeIndex + 1] : null,
    };
  }, [activeImage, activeIndex, images]);

  useEffect(() => {
    setZoom("fit");
  }, [activeImageId]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    closeButtonRef.current?.focus();

    return () => {
      restoreFocusRef.current?.focus();
      restoreFocusRef.current = null;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!activeImage) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key === "ArrowLeft" && navigation.previous) {
        onActiveImageChange(navigation.previous.id);
      }

      if (event.key === "ArrowRight" && navigation.next) {
        onActiveImageChange(navigation.next.id);
      }

      if (event.key === "Tab") {
        const focusable = Array.from(
          dialogRef.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ) ?? [],
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (first && last) {
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeImage, navigation.next, navigation.previous, onActiveImageChange, onClose]);

  if (!activeImage) {
    return null;
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} aria-hidden="true" onClick={onClose} />
      <section
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={activeImage.title}
      >
        <header className={styles.header}>
          <div className={styles.titleGroup}>
            <h2 className={styles.title}>{activeImage.title}</h2>
            <div className={styles.counter}>{activeIndex + 1} / {images.length}</div>
          </div>
          <Button
            ref={closeButtonRef}
            className={styles.darkButton}
            size="icon"
            variant="secondary"
            aria-label="Close screenshot viewer"
            onClick={onClose}
          >
            <X aria-hidden="true" size={16} />
          </Button>
        </header>

        <div className={styles.toolbar}>
          <Button
            className={styles.darkButton}
            variant="secondary"
            size="sm"
            aria-label="Previous screenshot"
            disabled={!hasMultipleImages || !navigation.previous}
            onClick={() => {
              if (navigation.previous) {
                onActiveImageChange(navigation.previous.id);
              }
            }}
          >
            <ChevronLeft aria-hidden="true" size={16} />
            Previous
          </Button>
          <div className={styles.zoomControls} aria-label="Zoom controls">
            <Button
              className={styles.darkButton}
              variant="secondary"
              size="icon"
              aria-label="Zoom out"
              disabled={zoom !== "fit" && zoom === zoomLevels[0]}
              onClick={() => setZoom((value) => previousZoom(value))}
            >
              <Minus aria-hidden="true" size={16} />
            </Button>
            <Button
              className={styles.darkButton}
              variant="secondary"
              size="sm"
              aria-label="Reset zoom"
              onClick={() => setZoom("fit")}
            >
              {zoomLabel(zoom)}
            </Button>
            <Button
              className={styles.darkButton}
              variant="secondary"
              size="icon"
              aria-label="Zoom in"
              disabled={zoom === zoomLevels[zoomLevels.length - 1]}
              onClick={() => setZoom((value) => nextZoom(value))}
            >
              <Plus aria-hidden="true" size={16} />
            </Button>
          </div>
          <Button
            className={styles.darkButton}
            variant="secondary"
            size="sm"
            aria-label="Next screenshot"
            disabled={!hasMultipleImages || !navigation.next}
            onClick={() => {
              if (navigation.next) {
                onActiveImageChange(navigation.next.id);
              }
            }}
          >
            Next
            <ChevronRight aria-hidden="true" size={16} />
          </Button>
        </div>

        <div className={styles.viewport}>
          <img
            className={zoom === "fit" ? styles.imageFit : styles.imageZoomed}
            style={zoom === "fit" ? undefined : { width: `${zoom * 100}%` }}
            src={activeImage.src}
            alt={activeImage.alt}
          />
        </div>
      </section>
    </div>
  );
};
