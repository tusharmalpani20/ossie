import type { AutomaticCaptureResult } from "./lib/automatic-capture";
import {
  buildCaptureController,
  type CaptureMessage,
  type CaptureMessageSender,
} from "./lib/capture-controller";
import {
  isCaptureCommand,
  type CaptureCommandResult,
} from "./lib/capture-command";
import type { PageClickCaptureMessage } from "./lib/content-click-capture";

type RuntimeMessage =
  | PageClickCaptureMessage
  | CaptureMessage
  | { type: string };

type RuntimeApi = {
  runtime?: {
    onMessage?: {
      addListener?: (
        callback: (
          message: RuntimeMessage,
          sender: CaptureMessageSender,
          sendResponse: (
            response: AutomaticCaptureResult | CaptureCommandResult,
          ) => void,
        ) => boolean | void,
      ) => void;
    };
  };
};

const isPageClickCaptureMessage = (
  message: RuntimeMessage,
): message is PageClickCaptureMessage => message.type === "ossie:page_click";

const runtime = (globalThis as { chrome?: RuntimeApi }).chrome?.runtime;
const controller = buildCaptureController();

runtime?.onMessage?.addListener?.(
  (message: RuntimeMessage, sender, sendResponse) => {
    const captureCommand = isCaptureCommand(message);
    if (!isPageClickCaptureMessage(message) && !captureCommand) {
      return false;
    }

    controller
      .handle(message, sender)
      .then(sendResponse)
      .catch((error: unknown) => {
        sendResponse({
          ok: false,
          reason: captureCommand
            ? "capture_failed"
            : "automatic_capture_failed",
          message:
            error instanceof Error
              ? error.message
              : captureCommand
                ? "Capture command failed"
                : "Automatic capture failed",
        });
      });

    return true;
  },
);
