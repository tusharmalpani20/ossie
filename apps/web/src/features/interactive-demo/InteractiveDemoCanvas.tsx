import type { KeyboardEvent } from "react";
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
  hotspots,
  selectedHotspotId,
  onSelect,
  onGeometryChange,
}: {
  sceneTitle: string;
  backgroundUrl: string | null;
  hotspots: DemoCanvasHotspot[];
  selectedHotspotId: string | null;
  onSelect: (hotspotId: string) => void;
  onGeometryChange: (
    hotspotId: string,
    box: Pick<DemoCanvasHotspot, "x" | "y" | "width" | "height">,
  ) => void;
}) => {
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

  return (
    <div className={styles.canvas} aria-label={`${sceneTitle} canvas`}>
      {backgroundUrl ? (
        <>
          <img src={backgroundUrl} alt={`${sceneTitle} captured screen`} />
          {hotspots.map((hotspot) => (
            <button
              aria-pressed={selectedHotspotId === hotspot.id}
              className={styles.hotspot}
              data-selected={selectedHotspotId === hotspot.id}
              key={hotspot.id}
              onClick={() => onSelect(hotspot.id)}
              onKeyDown={(event) => adjust(event, hotspot)}
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
          ))}
        </>
      ) : (
        <div className={styles.missing}>Captured screen is unavailable.</div>
      )}
    </div>
  );
};
