export type ScreenshotCapture = {
  blob: Blob;
  mimeType: "image/png";
  width: number | null;
  height: number | null;
  devicePixelRatio: number | null;
  capturedAt: string;
};

type ChromeCaptureApi = {
  tabs?: {
    captureVisibleTab?: {
      (options: { format: "png" }): Promise<string>;
      (windowId: number, options: { format: "png" }): Promise<string>;
    };
  };
};

const png_data_url_pattern = /^data:(image\/png);base64,(.*)$/;
const screenshot_capture_timeout_ms = 10_000;

const pngBlobFromDataUrl = (dataUrl: string) => {
  const match = png_data_url_pattern.exec(dataUrl);

  if (!match) {
    throw new Error("Unsupported screenshot data URL.");
  }

  const [, mimeType, base64] = match;
  const binary = atob(base64 ?? "");
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
};

const imageDimensions = async (blob: Blob) => {
  if (typeof createImageBitmap !== "function") {
    return {
      width: null,
      height: null,
    };
  }

  try {
    const bitmap = await createImageBitmap(blob);
    const dimensions = {
      width: bitmap.width,
      height: bitmap.height,
    };
    bitmap.close();
    return dimensions;
  } catch {
    return {
      width: null,
      height: null,
    };
  }
};

const currentDevicePixelRatio = () => (
  typeof devicePixelRatio === "number" && Number.isFinite(devicePixelRatio)
    ? devicePixelRatio
    : null
);

const captureVisibleTabWithTimeout = async (
  captureVisibleTab: NonNullable<
    NonNullable<ChromeCaptureApi["tabs"]>["captureVisibleTab"]
  >,
  windowId?: number,
) => {
  let timeout_id: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      windowId === undefined
        ? captureVisibleTab({ format: "png" })
        : captureVisibleTab(windowId, { format: "png" }),
      new Promise<never>((_resolve, reject) => {
        timeout_id = setTimeout(() => {
          reject(new Error("Screenshot capture timed out."));
        }, screenshot_capture_timeout_ms);
      }),
    ]);
  } finally {
    if (timeout_id !== undefined) {
      clearTimeout(timeout_id);
    }
  }
};

export const captureVisibleTabScreenshot = async (
  windowId?: number,
): Promise<ScreenshotCapture> => {
  const captureVisibleTab = (globalThis as { chrome?: ChromeCaptureApi }).chrome?.tabs?.captureVisibleTab;

  if (!captureVisibleTab) {
    throw new Error("Screenshot capture is unavailable.");
  }

  const dataUrl = await captureVisibleTabWithTimeout(
    captureVisibleTab,
    windowId,
  );
  const capturedAt = new Date().toISOString();
  const blob = pngBlobFromDataUrl(dataUrl);
  const dimensions = await imageDimensions(blob);

  return {
    blob,
    mimeType: "image/png",
    width: dimensions.width,
    height: dimensions.height,
    devicePixelRatio: currentDevicePixelRatio(),
    capturedAt,
  };
};
