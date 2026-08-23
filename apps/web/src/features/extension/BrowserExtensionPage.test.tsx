import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BrowserExtensionPage } from "./BrowserExtensionPage";

describe("BrowserExtensionPage", () => {
  it("downloads the authenticated bundle and shows concrete setup values", async () => {
    const blob = new Blob(["archive"], { type: "application/zip" });
    const downloadBundle = vi.fn(async () => ({
      filename: "ossie-extension-v0.1.0.zip",
      blob,
    }));
    const saveFile = vi.fn(async () => undefined);

    render(
      <BrowserExtensionPage
        checkAuth={async () => undefined}
        downloadBundle={downloadBundle}
        saveFile={saveFile}
        instanceUrl="https://api.example.com"
        portalUrl="https://portal.example.com"
      />,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Browser extension",
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Capture workflows from your browser and turn them into Guides and Interactive Demos.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Connect to Ossie" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Manifest V3")).not.toBeInTheDocument();
    expect(screen.getByText("Update, remove, and privacy")).toBeInTheDocument();

    const downloadButton = screen.getByRole("button", {
      name: "Download extension",
    });
    expect(downloadButton).toHaveAttribute("title", "Download extension");
    expect(downloadButton).toHaveTextContent("");

    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(downloadBundle).toHaveBeenCalledTimes(1);
      expect(saveFile).toHaveBeenCalledWith("ossie-extension-v0.1.0.zip", blob);
    });
    expect(screen.getByText("https://api.example.com")).toBeInTheDocument();
    expect(screen.getByText("https://portal.example.com")).toBeInTheDocument();
    expect(screen.getAllByText("chrome://extensions")).toHaveLength(2);
    expect(screen.getByText("manifest.json")).toBeInTheDocument();
  });

  it("does not expose the download instructions before auth succeeds", async () => {
    let finishAuthentication: (() => void) | undefined;
    const checkAuth = () =>
      new Promise<void>((resolve) => {
        finishAuthentication = resolve;
      });

    render(
      <BrowserExtensionPage
        checkAuth={checkAuth}
        instanceUrl="https://api.example.com"
        portalUrl="https://portal.example.com"
      />,
    );

    expect(screen.getByText("Checking extension access…")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Download extension" }),
    ).not.toBeInTheDocument();

    finishAuthentication?.();
    expect(
      await screen.findByRole("button", { name: "Download extension" }),
    ).toBeInTheDocument();
  });
});
