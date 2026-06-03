"use client";

import { useState, useTransition } from "react";
import { updateName } from "@/lib/actions/profile";
import { Button } from "@/components/ui";

type ProfileNameSectionProps = {
  firstName: string | null;
  lastName: string | null;
};

type EditingField = "firstName" | "lastName" | null;

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-primary outline-none focus:ring-2 focus:ring-accent";

function displayValue(value: string | null, placeholder: string): string {
  return value?.trim() ? value : placeholder;
}

export function ProfileNameSection({
  firstName: initialFirstName,
  lastName: initialLastName,
}: ProfileNameSectionProps) {
  const [firstName, setFirstName] = useState(initialFirstName ?? "");
  const [lastName, setLastName] = useState(initialLastName ?? "");
  const [editing, setEditing] = useState<EditingField>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function startEdit(field: EditingField) {
    if (!field) {
      return;
    }
    setEditing(field);
    setDraft(field === "firstName" ? firstName : lastName);
    setError(null);
    setSuccess(null);
  }

  function cancelEdit() {
    setEditing(null);
    setDraft("");
  }

  function saveEdit() {
    if (!editing) {
      return;
    }

    const nextFirst = editing === "firstName" ? draft : firstName;
    const nextLast = editing === "lastName" ? draft : lastName;

    startTransition(async () => {
      const result = await updateName(
        nextFirst.trim() || null,
        nextLast.trim() || null,
      );

      if (result.error) {
        setError(result.error);
        return;
      }

      setFirstName(nextFirst.trim());
      setLastName(nextLast.trim());
      setEditing(null);
      setDraft("");
      setError(null);
      setSuccess(result.success ?? "Name updated.");
    });
  }

  return (
    <>
      <NameRow
        label="First name"
        value={firstName}
        placeholder="Not set"
        isEditing={editing === "firstName"}
        draft={draft}
        onDraftChange={setDraft}
        onEdit={() => startEdit("firstName")}
        onSave={saveEdit}
        onCancel={cancelEdit}
        pending={isPending && editing === "firstName"}
      />
      <NameRow
        label="Last name"
        value={lastName}
        placeholder="Not set"
        isEditing={editing === "lastName"}
        draft={draft}
        onDraftChange={setDraft}
        onEdit={() => startEdit("lastName")}
        onSave={saveEdit}
        onCancel={cancelEdit}
        pending={isPending && editing === "lastName"}
      />
      {error ? (
        <p className="px-4 pb-3 text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="px-4 pb-3 text-sm text-green-500" role="status">
          {success}
        </p>
      ) : null}
    </>
  );
}

type NameRowProps = {
  label: string;
  value: string;
  placeholder: string;
  isEditing: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  pending: boolean;
};

function NameRow({
  label,
  value,
  placeholder,
  isEditing,
  draft,
  onDraftChange,
  onEdit,
  onSave,
  onCancel,
  pending,
}: NameRowProps) {
  return (
    <div className="grid grid-cols-3 gap-4 px-4 py-3">
      <dt className="text-sm font-medium text-text-muted">{label}</dt>
      <dd className="col-span-2 flex items-start justify-between gap-2 text-sm text-text-primary">
        {isEditing ? (
          <div className="flex w-full flex-col gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              className={inputClass}
              placeholder={placeholder}
              autoFocus
              disabled={pending}
            />
            <div className="flex gap-2">
              <Button type="button" onClick={onSave} disabled={pending}>
                {pending ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={pending}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <span
              className={
                value.trim() ? "text-text-primary" : "text-text-muted italic"
              }
            >
              {displayValue(value, placeholder)}
            </span>
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex shrink-0 rounded-md p-1.5 text-text-muted hover:bg-surface-raised hover:text-accent"
              aria-label={`Edit ${label.toLowerCase()}`}
            >
              <PencilIcon />
            </button>
          </>
        )}
      </dd>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343zM12.803 4.908l3.252 3.252a1 1 0 001.414-1.414L14.217 3.494a1 1 0 00-1.414 1.414z" />
    </svg>
  );
}
