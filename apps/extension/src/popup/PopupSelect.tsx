import { useEffect, useId, useRef, useState } from "react";

type PopupSelectOption = {
  value: string;
  label: string;
  secondaryLabel?: string;
};

export const PopupSelect = ({
  label,
  listboxLabel,
  groupLabel,
  placeholder,
  value,
  options,
  disabled = false,
  onChange,
}: {
  label: string;
  listboxLabel: string;
  groupLabel: string;
  placeholder: string;
  value: string | null;
  options: PopupSelectOption[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const controlRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const groupLabelId = useId();
  const selected = options.find((option) => option.value === value) ?? null;
  const selectedLabel = selected?.label ?? placeholder;

  useEffect(() => {
    if (!open) return;

    menuRef.current?.scrollIntoView?.({ block: "nearest" });

    const closeOnPointerDown = (event: PointerEvent) => {
      if (!controlRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnPointerDown);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="popupSelectField">
      <span className="popupSelectLabel">{label}</span>
      <div className="popupSelect" ref={controlRef}>
        <button
          className="popupSelectTrigger"
          type="button"
          aria-label={`${label}: ${selectedLabel}`}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
        >
          <span>{selectedLabel}</span>
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        {open ? (
          <div
            className="popupSelectMenu"
            id={menuId}
            ref={menuRef}
            role="listbox"
            aria-label={listboxLabel}
          >
            <div role="group" aria-labelledby={groupLabelId}>
              <span className="popupSelectGroupLabel" id={groupLabelId}>
                {groupLabel}
              </span>
              {options.map((option) => {
                const optionSelected = option.value === value;
                return (
                  <button
                    className={`popupSelectOption ${
                      optionSelected ? "popupSelectOptionSelected" : ""
                    }`}
                    key={option.value}
                    type="button"
                    role="option"
                    aria-label={option.label}
                    aria-selected={optionSelected}
                    onClick={() => {
                      setOpen(false);
                      if (!optionSelected) onChange(option.value);
                    }}
                  >
                    <span>
                      {option.label}
                      {option.secondaryLabel ? (
                        <small>{option.secondaryLabel}</small>
                      ) : null}
                    </span>
                    {optionSelected ? (
                      <svg
                        aria-hidden="true"
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m5 12 4 4L19 6" />
                      </svg>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
