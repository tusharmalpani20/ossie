import type { PublicPublishLinkResponse } from "@repo/types/publish";
import styles from "./PublicVersionSelector.module.css";

export const PublicVersionSelector = ({
  response,
  mode = "reader",
}: {
  response: PublicPublishLinkResponse;
  mode?: "reader" | "embed";
}) => {
  const entries = response.publish_link.entries;
  if (entries.length === 1)
    return (
      <span className={styles.label}>
        Project Version: {entries[0]!.project_version_name}
      </span>
    );
  return (
    <label className={styles.field}>
      <span>Project Version</span>
      <select
        aria-label="Public Project Version"
        value={response.selected_entry.project_version_slug}
        onChange={(event) => {
          const entry = entries.find(
            (item) => item.project_version_slug === event.target.value,
          );
          if (entry)
            window.location.assign(
              `${entry.public_url}${mode === "embed" ? "/embed" : ""}`,
            );
        }}
      >
        {entries.map((entry) => (
          <option
            key={entry.project_version_slug}
            value={entry.project_version_slug}
          >
            {entry.project_version_name}
            {entry.is_default ? " (default)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
};
