"use client";

import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Native modal `<dialog>`: focus trapping, Escape and the backdrop come for free. */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onCancel}
      aria-labelledby="confirm-title"
      aria-describedby="confirm-body"
      className="m-auto w-[min(92vw,28rem)] rounded-3xl bg-phone-surface p-6 text-phone-fg backdrop:bg-black/70"
    >
      <h2 id="confirm-title" className="text-2xl font-bold">
        {title}
      </h2>
      <p id="confirm-body" className="mt-2 text-lg text-phone-dim">
        {body}
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          autoFocus
          onClick={onCancel}
          className="min-h-14 rounded-2xl bg-phone-line text-lg font-semibold"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="min-h-14 rounded-2xl bg-phone-alert text-lg font-bold text-black"
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
