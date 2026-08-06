import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import styles from "./InteractiveDemoCanvas.module.css";

export type DemoCanvasHotspot = {
  id: string;
  label: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, Number(value.toFixed(4))));

export const InteractiveDemoCanvas = ({
  sceneTitle,
  backgroundUrl,
  backgroundAspectRatio,
  hotspots,
  selectedHotspotId,
  onSelect,
  onGeometryChange,
}: {
  sceneTitle: string;
  backgroundUrl: string | null;
  backgroundAspectRatio?: string;
  hotspots: DemoCanvasHotspot[];
  selectedHotspotId: string | null;
  onSelect: (hotspotId: string) => void;
  onGeometryChange: (
    hotspotId: string,
    box: Pick<DemoCanvasHotspot, "x" | "y" | "width" | "height">,
  ) => void;
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [resolvedBackgroundUrl, setResolvedBackgroundUrl] = useState<
    string | null
  >(null);
  const pointerOperationRef = useRef<{
    mode: "move" | "resize";
    hotspot: DemoCanvasHotspot;
    startX: number;
    startY: number;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    setImageFailed(false);
    if (!backgroundUrl) {
      setResolvedBackgroundUrl(null);
      return;
    }

    const resolvedUrl = new URL(backgroundUrl, window.location.href);
    if (resolvedUrl.origin === window.location.origin) {
      setResolvedBackgroundUrl(backgroundUrl);
      return;
    }

    const controller = new AbortController();
    let active = true;
    let objectUrl: string | null = null;
    setResolvedBackgroundUrl(null);

    void fetch(backgroundUrl, {
      credentials: "include",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Captured screen request failed");
        return response.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        if (active) setResolvedBackgroundUrl(objectUrl);
        else URL.revokeObjectURL(objectUrl);
      })
      .catch(() => {
        if (active) {
          setResolvedBackgroundUrl(null);
          setImageFailed(true);
        }
      });

    return () => {
      active = false;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [backgroundUrl]);

  useEffect(() => {
    const move = (event: globalThis.PointerEvent) => {
      const operation = pointerOperationRef.current;
      if (!operation) return;
      const deltaX = (event.clientX - operation.startX) / operation.width;
      const deltaY = (event.clientY - operation.startY) / operation.height;
      const { hotspot } = operation;
      onGeometryChange(
        hotspot.id,
        operation.mode === "move"
          ? {
              x: clamp(hotspot.x + deltaX, 0, 1 - hotspot.width),
              y: clamp(hotspot.y + deltaY, 0, 1 - hotspot.height),
              width: hotspot.width,
              height: hotspot.height,
            }
          : {
              x: hotspot.x,
              y: hotspot.y,
              width: clamp(hotspot.width + deltaX, 0.01, 1 - hotspot.x),
              height: clamp(hotspot.height + deltaY, 0.01, 1 - hotspot.y),
            },
      );
    };
    const end = () => {
      pointerOperationRef.current = null;
    };
    const cancel = () => {
      const operation = pointerOperationRef.current;
      if (operation) {
        const { id, x, y, width, height } = operation.hotspot;
        onGeometryChange(id, { x, y, width, height });
      }
      pointerOperationRef.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", cancel);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", cancel);
    };
  }, [onGeometryChange]);

  const startPointerOperation = (
    event: PointerEvent<HTMLElement>,
    hotspot: DemoCanvasHotspot,
    mode: "move" | "resize",
  ) => {
    const bounds = canvasRef.current?.getBoundingClientRect();
    if (!bounds?.width || !bounds.height) return;
    event.preventDefault();
    onSelect(hotspot.id);
    pointerOperationRef.current = {
      mode,
      hotspot,
      startX: event.clientX,
      startY: event.clientY,
      width: bounds.width,
      height: bounds.height,
    };
  };

  const adjust = (
    event: KeyboardEvent<HTMLButtonElement>,
    hotspot: DemoCanvasHotspot,
  ) => {
    const amount = event.shiftKey ? 0.05 : 0.01;
    let { x, y } = hotspot;
    if (event.key === "ArrowLeft") x -= amount;
    else if (event.key === "ArrowRight") x += amount;
    else if (event.key === "ArrowUp") y -= amount;
    else if (event.key === "ArrowDown") y += amount;
    else return;
    event.preventDefault();
    onGeometryChange(hotspot.id, {
      x: clamp(x, 0, 1 - hotspot.width),
      y: clamp(y, 0, 1 - hotspot.height),
      width: hotspot.width,
      height: hotspot.height,
    });
  };

  const adjustResize = (
    event: KeyboardEvent<HTMLButtonElement>,
    hotspot: DemoCanvasHotspot,
  ) => {
    const amount = event.shiftKey ? 0.05 : 0.01;
    let { width, height } = hotspot;
    if (event.key === "ArrowLeft") width -= amount;
    else if (event.key === "ArrowRight") width += amount;
    else if (event.key === "ArrowUp") height -= amount;
    else if (event.key === "ArrowDown") height += amount;
    else return;
    event.preventDefault();
    onGeometryChange(hotspot.id, {
      x: hotspot.x,
      y: hotspot.y,
      width: clamp(width, 0.01, 1 - hotspot.x),
      height: clamp(height, 0.01, 1 - hotspot.y),
    });
  };

  return (
    <div
      className={styles.canvas}
      aria-label={`${sceneTitle} canvas`}
      ref={canvasRef}
      role="group"
      style={
        backgroundAspectRatio
          ? { aspectRatio: backgroundAspectRatio }
          : undefined
      }
    >
      {resolvedBackgroundUrl && !imageFailed ? (
        <>
          <img
            src={resolvedBackgroundUrl}
            alt={`${sceneTitle} captured screen`}
            onError={() => setImageFailed(true)}
          />
          {hotspots.map((hotspot) => (
            <Fragment key={hotspot.id}>
              <button
                aria-pressed={selectedHotspotId === hotspot.id}
                className={styles.hotspot}
                data-selected={selectedHotspotId === hotspot.id}
                onClick={() => onSelect(hotspot.id)}
                onKeyDown={(event) => adjust(event, hotspot)}
                onPointerDown={(event) =>
                  startPointerOperation(event, hotspot, "move")
                }
                style={{
                  left: `${hotspot.x * 100}%`,
                  top: `${hotspot.y * 100}%`,
                  width: `${hotspot.width * 100}%`,
                  height: `${hotspot.height * 100}%`,
                }}
                type="button"
              >
                <span>{hotspot.label ?? "Hotspot"}</span>
              </button>
              {selectedHotspotId === hotspot.id ? (
                <button
                  aria-label={`Resize ${hotspot.label ?? "Hotspot"}`}
                  className={styles.resizeHandle}
                  onKeyDown={(event) => adjustResize(event, hotspot)}
                  onPointerDown={(event) =>
                    startPointerOperation(event, hotspot, "resize")
                  }
                  style={{
                    left: `${(hotspot.x + hotspot.width) * 100}%`,
                    top: `${(hotspot.y + hotspot.height) * 100}%`,
                  }}
                  type="button"
                />
              ) : null}
            </Fragment>
          ))}
        </>
      ) : (
        <div className={styles.missing}>Captured screen is unavailable.</div>
      )}
    </div>
  );
};
