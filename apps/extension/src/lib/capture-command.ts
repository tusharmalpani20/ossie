export type CaptureLifecycleTransition =
  | "finish"
  | "clear"
  | "logout"
  | "change_instance";

export type CaptureCommand =
  | {
      type: "ossie:capture_command";
      action: "capture_manual";
    }
  | {
      type: "ossie:capture_command";
      action: "set_mode";
      mode: "manual" | "automatic";
      paused: boolean;
    }
  | {
      type: "ossie:capture_command";
      action: "quiesce";
      transition: CaptureLifecycleTransition;
    }
  | {
      type: "ossie:capture_command";
      action: "acknowledge_reconciliation";
    };

export type CaptureCommandFailureReason =
  | "capture_command_unavailable"
  | "capture_busy"
  | "capture_inactive"
  | "capture_context_unavailable"
  | "capture_reconciled"
  | "capture_reconciliation_failed"
  | "capture_failed";

export type CaptureCommandResult =
  | { ok: true; event_index?: number }
  | {
      ok: false;
      reason: CaptureCommandFailureReason;
      message: string;
      reconciled_event_index?: number;
    };

export type CaptureRuntime = {
  sendMessage: (message: CaptureCommand) => Promise<CaptureCommandResult>;
};

const defaultRuntime = (): CaptureRuntime | null =>
  (
    globalThis as {
      chrome?: { runtime?: CaptureRuntime };
    }
  ).chrome?.runtime ?? null;

export const sendCaptureCommand = async (
  command: CaptureCommand,
  runtime: CaptureRuntime | null = defaultRuntime(),
): Promise<CaptureCommandResult> => {
  if (!runtime?.sendMessage) {
    return {
      ok: false,
      reason: "capture_command_unavailable",
      message:
        "Capture controls are unavailable. Reopen the extension and retry.",
    };
  }

  return runtime.sendMessage(command);
};

export const isCaptureCommand = (value: unknown): value is CaptureCommand => {
  if (!value || typeof value !== "object") return false;
  const command = value as Partial<CaptureCommand>;
  if (command.type !== "ossie:capture_command") return false;

  if (command.action === "capture_manual") return true;
  if (command.action === "acknowledge_reconciliation") return true;
  if (command.action === "set_mode") {
    return (
      (command.mode === "manual" || command.mode === "automatic") &&
      typeof command.paused === "boolean"
    );
  }
  return (
    command.action === "quiesce" &&
    (command.transition === "finish" ||
      command.transition === "clear" ||
      command.transition === "logout" ||
      command.transition === "change_instance")
  );
};
