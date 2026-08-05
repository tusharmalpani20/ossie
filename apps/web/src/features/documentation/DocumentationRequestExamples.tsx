import { useId, useMemo, useRef, useState } from "react";
import type { DocumentationTryItRequestDescriptor } from "@repo/types";
import {
  documentation_request_example_registry,
  DOCUMENTATION_REQUEST_EXAMPLE_LANGUAGE_IDS,
  generate_documentation_request_example,
} from "@repo/documentation-domain/policies/documentation-request-example-policy";
import "./documentation-api-operation.css";

type Props = {
  descriptor: DocumentationTryItRequestDescriptor;
  operationName?: string;
};

const safe_filename = (value: string) => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9._-]+/gu, "-")
    .replaceAll(/^-+|-+$/gu, "")
    .slice(0, 80);
  return normalized || "request-example";
};

export const DocumentationRequestExamples = ({
  descriptor,
  operationName,
}: Props) => {
  const headingId = useId();
  const [selectedId, setSelectedId] = useState<
    (typeof DOCUMENTATION_REQUEST_EXAMPLE_LANGUAGE_IDS)[number]
  >(DOCUMENTATION_REQUEST_EXAMPLE_LANGUAGE_IDS[0]);
  const [status, setStatus] = useState("");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const examples = useMemo(
    () =>
      DOCUMENTATION_REQUEST_EXAMPLE_LANGUAGE_IDS.map((languageId) => ({
        languageId,
        result: generate_documentation_request_example(descriptor, languageId),
        metadata: documentation_request_example_registry.find(
          (entry) => entry.id === languageId,
        ),
      })),
    [descriptor],
  );
  const selected =
    examples.find((example) => example.languageId === selectedId) ??
    examples[0];
  const selectedResult = selected?.result;

  const selectTab = (index: number) => {
    const nextIndex =
      (index + DOCUMENTATION_REQUEST_EXAMPLE_LANGUAGE_IDS.length) %
      DOCUMENTATION_REQUEST_EXAMPLE_LANGUAGE_IDS.length;
    const nextId = DOCUMENTATION_REQUEST_EXAMPLE_LANGUAGE_IDS[nextIndex]!;
    setSelectedId(nextId);
    tabRefs.current[nextIndex]?.focus();
  };

  const copy = async () => {
    if (!selectedResult || selectedResult.status !== "generated") return;
    try {
      await navigator.clipboard.writeText(selectedResult.code);
      setStatus(selectedResult.display_name + " example copied.");
    } catch {
      setStatus(selectedResult.display_name + " example could not be copied.");
    }
  };

  const download = () => {
    if (!selectedResult || selectedResult.status !== "generated") return;
    const objectUrl = URL.createObjectURL(
      new Blob([selectedResult.code], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download =
      safe_filename(operationName ?? descriptor.destination_key) +
      "-" +
      selectedResult.language_id +
      selectedResult.file_extension;
    link.click();
    URL.revokeObjectURL(objectUrl);
    setStatus(selectedResult.display_name + " example downloaded.");
  };

  return (
    <section
      aria-labelledby={headingId}
      className="documentation-request-examples"
    >
      <h3 id={headingId}>Request examples</h3>
      <p>
        Inert examples use the public placeholder origin and documented values.
        They never execute a request or use Try-It credentials.
      </p>
      <div
        aria-label="Request example languages"
        className="documentation-request-examples__tabs"
        onKeyDown={(event) => {
          const index =
            DOCUMENTATION_REQUEST_EXAMPLE_LANGUAGE_IDS.indexOf(selectedId);
          if (event.key === "ArrowRight") {
            event.preventDefault();
            selectTab(index + 1);
          } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            selectTab(index - 1);
          } else if (event.key === "Home") {
            event.preventDefault();
            selectTab(0);
          } else if (event.key === "End") {
            event.preventDefault();
            selectTab(DOCUMENTATION_REQUEST_EXAMPLE_LANGUAGE_IDS.length - 1);
          }
        }}
        role="tablist"
      >
        {examples.map(({ languageId, metadata }, index) => (
          <button
            aria-controls={headingId + "-" + languageId}
            aria-selected={languageId === selectedId}
            className="documentation-request-examples__tab"
            key={languageId}
            onClick={() => setSelectedId(languageId)}
            onFocus={() => setSelectedId(languageId)}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            role="tab"
            tabIndex={languageId === selectedId ? 0 : -1}
            type="button"
          >
            {metadata?.display_name ?? languageId}
          </button>
        ))}
      </div>
      {selectedResult?.status === "generated" ? (
        <div
          aria-labelledby={headingId + "-" + selectedId + "-label"}
          className="documentation-request-examples__panel"
          id={headingId + "-" + selectedId}
          role="tabpanel"
          tabIndex={0}
        >
          <h4 id={headingId + "-" + selectedId + "-label"}>
            {selectedResult.display_name} · {selectedResult.runtime}
          </h4>
          <div className="documentation-request-examples__actions">
            <button type="button" onClick={() => void copy()}>
              Copy {selectedResult.display_name} example
            </button>
            <button type="button" onClick={download}>
              Download {selectedResult.display_name} example
            </button>
          </div>
          <pre tabIndex={0}>
            <code>{selectedResult.code}</code>
          </pre>
        </div>
      ) : (
        <p id={headingId + "-" + selectedId} role="note">
          This language is unavailable for this operation.{" "}
          {selectedResult?.reasons.join(" ")}
        </p>
      )}
      <p aria-live="polite">{status}</p>
    </section>
  );
};
