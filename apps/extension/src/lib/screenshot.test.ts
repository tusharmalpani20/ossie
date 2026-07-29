import { afterEach, describe, expect, it, vi } from "vitest";
import { captureVisibleTabScreenshot } from "./screenshot";

const pngDataUrl = "data:image/png;base64,ZmFrZSBwbmc=";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("visible tab screenshot capture", () => {
  it("captures the visible tab as a png blob with image metadata", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-05T10:00:00.000Z"));
    const close = vi.fn();
    const captureVisibleTab = vi.fn(async () => pngDataUrl);
    const createImageBitmap = vi.fn(async () => ({
      width: 320,
      height: 200,
      close,
    }));
    vi.stubGlobal("chrome", {
      tabs: {
        captureVisibleTab,
      },
    });
    vi.stubGlobal("createImageBitmap", createImageBitmap);
    vi.stubGlobal("devicePixelRatio", 2);

    const result = await captureVisibleTabScreenshot();

    expect(captureVisibleTab).toHaveBeenCalledWith({ format: "png" });
    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.blob.type).toBe("image/png");
    expect(result.mimeType).toBe("image/png");
    expect(result.width).toBe(320);
    expect(result.height).toBe(200);
    expect(result.devicePixelRatio).toBe(2);
    expect(result.capturedAt).toBe("2026-06-05T10:00:00.000Z");
    expect(close).toHaveBeenCalled();
  });

  it("keeps the screenshot when image dimensions cannot be decoded", async () => {
    vi.stubGlobal("chrome", {
      tabs: {
        captureVisibleTab: vi.fn(async () => pngDataUrl),
      },
    });
    vi.stubGlobal("createImageBitmap", vi.fn(async () => {
      throw new Error("decode failed");
    }));

    const result = await captureVisibleTabScreenshot();

    expect(result.blob.type).toBe("image/png");
    expect(result.width).toBeNull();
    expect(result.height).toBeNull();
  });

  it("targets the validated sender window for automatic capture", async () => {
    const captureVisibleTab = vi.fn(async () => pngDataUrl);
    vi.stubGlobal("chrome", { tabs: { captureVisibleTab } });

    await captureVisibleTabScreenshot(42);

    expect(captureVisibleTab).toHaveBeenCalledWith(42, { format: "png" });
  });

  it("fails when visible tab capture is unavailable", async () => {
    vi.stubGlobal("chrome", {
      tabs: {},
    });

    await expect(captureVisibleTabScreenshot()).rejects.toThrow("Screenshot capture is unavailable.");
  });

  it("fails when the browser returns a non-png data URL", async () => {
    vi.stubGlobal("chrome", {
      tabs: {
        captureVisibleTab: vi.fn(async () => "data:image/jpeg;base64,ZmFrZQ=="),
      },
    });

    await expect(captureVisibleTabScreenshot()).rejects.toThrow("Unsupported screenshot data URL.");
  });

  it("surfaces browser capture errors", async () => {
    vi.stubGlobal("chrome", {
      tabs: {
        captureVisibleTab: vi.fn(async () => {
          throw new Error("Cannot capture this page");
        }),
      },
    });

    await expect(captureVisibleTabScreenshot()).rejects.toThrow("Cannot capture this page");
  });

  it("times out when the browser never resolves visible tab capture", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("chrome", {
      tabs: {
        captureVisibleTab: vi.fn(() => new Promise<string>(() => undefined)),
      },
    });

    const pending_capture = captureVisibleTabScreenshot();
    const expectation = expect(pending_capture).rejects.toThrow("Screenshot capture timed out.");
    await vi.advanceTimersByTimeAsync(10_000);

    await expectation;
  });
});
