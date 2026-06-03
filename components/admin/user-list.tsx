"use client";

import { useState, useTransition } from "react";
import { deleteUser } from "@/lib/actions/users";
import { Card } from "@/components/ui";
import type { Role } from "@prisma/client";

export type UserListItem = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  canDelete: boolean;
};

function roleClasses(role: Role): string {
  return role === "SUPER_ADMIN"
    ? "bg-accent/20 text-accent"
    : "bg-surface-raised text-text-muted";
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

type DeleteUserButtonProps = {
  userId: string;
  userName: string;
};

function DeleteUserButton({ userId, userName }: DeleteUserButtonProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    const confirmed = window.confirm(
      `Delete admin "${userName}"? This cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await deleteUser(userId);
      if (result.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="text-sm font-medium text-red-400 hover:text-red-300 disabled:opacity-60"
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      {error ? (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type UserListProps = {
  users: UserListItem[];
};

export function UserList({ users }: UserListProps) {
  if (users.length === 0) {
    return (
      <Card className="border-dashed p-8 text-center text-sm text-text-muted">
        No admin users found.
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-surface-raised">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                Joined
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-text-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-surface-raised/60">
                <td className="px-4 py-3 text-sm font-medium text-text-primary">
                  {user.name}
                </td>
                <td className="px-4 py-3 text-sm text-text-muted">{user.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${roleClasses(user.role)}`}
                  >
                    {user.role === "SUPER_ADMIN" ? "Super admin" : "Admin"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-text-muted">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  {user.canDelete ? (
                    <DeleteUserButton userId={user.id} userName={user.name} />
                  ) : (
                    <span className="text-xs text-text-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
