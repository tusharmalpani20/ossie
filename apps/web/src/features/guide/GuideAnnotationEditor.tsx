import { useEffect, useState } from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import type {
  GuideScreenshotAnnotation,
  UpdateGuideBlockAnnotationsInput,
} from "./types";
import { defaultHighlightAnnotation } from "./guideEditorHelpers";
import styles from "./GuideEditorPage.module.css";

type EditableAnnotation =
  UpdateGuideBlockAnnotationsInput["annotations"][number];

const editableAnnotations = (
  annotations: GuideScreenshotAnnotation[],
): EditableAnnotation[] =>
  annotations.map(({ id, x, y, width, height }) => ({
    id,
    type: "highlight",
    x,
    y,
    width,
    height,
  }));

const finiteNumber = (value: string, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

export const GuideAnnotationEditor = ({
  stepNumber,
  annotations,
  disabled = false,
  pending = false,
  onSave,
}: {
  stepNumber: number;
  annotations: GuideScreenshotAnnotation[];
  disabled?: boolean;
  pending?: boolean;
  onSave: (annotations: EditableAnnotation[]) => void;
}) => {
  const [drafts, setDrafts] = useState(() =>
    editableAnnotations(annotations),
  );

  useEffect(() => {
    setDrafts(editableAnnotations(annotations));
  }, [annotations]);

  const changeGeometry = (
    index: number,
    field: "x" | "y" | "width" | "height",
    rawValue: string,
  ) => {
    setDrafts((current) =>
      current.map((annotation, annotationIndex) => {
        if (annotationIndex !== index) return annotation;
        const value = finiteNumber(rawValue, annotation[field]);
        if (field === "x") {
          return {
            ...annotation,
            x: clamp(value, 0, 1 - annotation.width),
          };
        }
        if (field === "y") {
          return {
            ...annotation,
            y: clamp(value, 0, 1 - annotation.height),
          };
        }
        if (field === "width") {
          return {
            ...annotation,
            width: clamp(value, 0.001, 1 - annotation.x),
          };
        }
        return {
          ...annotation,
          height: clamp(value, 0.001, 1 - annotation.y),
        };
      }),
    );
  };

  return (
    <section
      className={styles.annotationEditor}
      aria-label={`Highlights for step ${stepNumber}`}
    >
      <div className={styles.mediaActions}>
        <Button
          variant="secondary"
          disabled={disabled || pending || drafts.length >= 10}
          onClick={() =>
            setDrafts((current) => [
              ...current,
              defaultHighlightAnnotation(),
            ])
          }
        >
          Add highlight
        </Button>
        <Button
          variant="secondary"
          disabled={disabled || pending}
          onClick={() => onSave(drafts)}
        >
          {pending ? "Saving highlights..." : "Save highlights"}
        </Button>
      </div>
      {drafts.map((annotation, index) => (
        <fieldset className={styles.annotationFields} key={annotation.id ?? index}>
          <legend>Highlight {index + 1}</legend>
          {(["x", "y", "width", "height"] as const).map((field) => (
            <label className={styles.annotationField} key={field}>
              <span>{field}</span>
              <Input
                aria-label={`Highlight ${index + 1} ${field}`}
                type="number"
                min={field === "width" || field === "height" ? 0.001 : 0}
                max={1}
                step={0.01}
                disabled={disabled || pending}
                value={annotation[field]}
                onChange={(event) =>
                  changeGeometry(index, field, event.target.value)
                }
              />
            </label>
          ))}
          <Button
            variant="secondary"
            size="sm"
            disabled={disabled || pending}
            onClick={() =>
              setDrafts((current) =>
                current.filter((_, annotationIndex) => annotationIndex !== index),
              )
            }
          >
            Remove highlight {index + 1}
          </Button>
        </fieldset>
      ))}
    </section>
  );
};
