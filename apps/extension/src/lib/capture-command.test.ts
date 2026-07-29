import { describe, expect, it, vi } from "vitest";
import {
  sendCaptureCommand,
  type CaptureCommand,
  type CaptureCommandResult,
} from "./capture-command";

describe("capture command adapter", () => {
  it("sends a serializable manual command to the background controller", async () => {
    const command: CaptureCommand = {
      type: "ossie:capture_command",
      action: "capture_manual",
    };
    const response: CaptureCommandResult = { ok: true, event_index: 4 };
    const sendMessage = vi.fn(async () => response);

    await expect(sendCaptureCommand(command, { sendMessage })).resolves.toEqual(
      response,
    );
    expect(sendMessage).toHaveBeenCalledWith(command);
  });

  it("returns an actionable failure when extension messaging is unavailable", async () => {
    await expect(
      sendCaptureCommand({
        type: "ossie:capture_command",
        action: "quiesce",
        transition: "finish",
      }, null),
    ).resolves.toEqual({
      ok: false,
      reason: "capture_command_unavailable",
      message: "Capture controls are unavailable. Reopen the extension and retry.",
    });
  });
});
