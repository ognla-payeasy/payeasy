"use client";

import { useRef, useState } from "react";
import { Check, Pencil, Tag, X } from "lucide-react";
import { useEscrowLabels } from "@/hooks/useEscrowLabels";

interface EscrowLabelProps {
  contractId: string;
  fallback?: string;
}

export default function EscrowLabel({ contractId, fallback }: EscrowLabelProps) {
  const { getLabel, setLabel, removeLabel } = useEscrowLabels();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const label = getLabel(contractId);
  const shortId =
    fallback ??
    (contractId.length > 10
      ? `${contractId.slice(0, 6)}...${contractId.slice(-4)}`
      : contractId);

  function startEditing() {
    setDraft(label ?? "");
    setEditing(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function handleSave() {
    if (draft.trim()) {
      setLabel(contractId, draft.trim());
    } else {
      removeLabel(contractId);
    }
    setEditing(false);
  }

  function handleCancel() {
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          placeholder="Enter label..."
          className="rounded-lg border border-brand-500/40 bg-white/5 px-3 py-1.5 text-sm text-dark-100 outline-none focus:border-brand-400 transition-colors w-44"
        />
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            handleSave();
          }}
          aria-label="Save label"
          className="p-1 text-accent-400 hover:text-accent-300 transition-colors"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            handleCancel();
          }}
          aria-label="Cancel edit"
          className="p-1 text-dark-400 hover:text-dark-200 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={startEditing}
      title="Click to edit label"
      className="group flex items-center gap-2 transition-colors"
    >
      {label ? (
        <>
          <Tag className="h-3.5 w-3.5 text-brand-400 shrink-0" />
          <span className="text-sm font-medium text-white">{label}</span>
        </>
      ) : (
        <span className="text-xs font-mono text-dark-500">{shortId}</span>
      )}
      <Pencil className="h-3 w-3 text-dark-600 group-hover:text-brand-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0" />
    </button>
  );
}
