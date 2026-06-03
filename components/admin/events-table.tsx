"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EventActiveToggle } from "@/components/admin/event-active-toggle";
import { EventRowActions } from "@/components/admin/event-row-actions";
import { Card } from "@/components/ui";

export type AdminEventRow = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  participantCount: number;
  voteCount: number;
  createdByName?: string;
  createdByRole?: string;
  voteUrl: string;
  resultsUrl: string;
};

type EventsTableProps = {
  events: AdminEventRow[];
  isSuperAdmin: boolean;
};

const inputClass =
  "w-full max-w-sm rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-accent";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function EventsTable({ events, isSuperAdmin }: EventsTableProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return events;
    }
    return events.filter(
      (event) =>
        event.name.toLowerCase().includes(q) ||
        event.slug.toLowerCase().includes(q) ||
        (event.createdByName?.toLowerCase().includes(q) ?? false) ||
        (event.createdByRole?.toLowerCase().includes(q) ?? false),
    );
  }, [events, query]);

  if (events.length === 0) {
    return (
      <Card className="border-dashed p-10 text-center">
        <p className="text-text-muted">No events yet.</p>
        <Link
          href="/admin/events/new"
          className="mt-3 inline-block text-sm font-medium text-accent hover:text-accent-hover"
        >
          Create your first event
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="sr-only">Search events</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, slug, or creator…"
          className={inputClass}
        />
      </label>

      {filtered.length === 0 ? (
        <p className="text-sm text-text-muted">No events match your search.</p>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-raised text-text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Participants</th>
                  <th className="px-4 py-3 font-medium">Votes</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  {isSuperAdmin ? (
                    <th className="px-4 py-3 font-medium">Created by</th>
                  ) : null}
                  <th className="px-4 py-3 font-medium">Links</th>
                  <th className="w-10 px-4 py-3">
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((event) => (
                  <tr key={event.id} className="align-top hover:bg-surface-raised/60">
                    <td className="px-4 py-3">
                      <span className="font-medium text-text-primary">{event.name}</span>
                      <p className="font-mono text-xs text-text-muted">{event.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <EventActiveToggle
                        eventId={event.id}
                        isActive={event.isActive}
                      />
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {event.participantCount}
                    </td>
                    <td className="px-4 py-3 text-text-muted">{event.voteCount}</td>
                    <td className="px-4 py-3 text-text-muted">
                      {formatDate(event.createdAt)}
                    </td>
                    {isSuperAdmin ? (
                      <td className="px-4 py-3 text-text-muted">
                        {event.createdByName}
                        {event.createdByRole ? (
                          <p className="text-xs text-text-muted">
                            {event.createdByRole === "SUPER_ADMIN"
                              ? "Super admin"
                              : "Admin"}
                          </p>
                        ) : null}
                      </td>
                    ) : null}
                    <td className="px-4 py-3">
                      <EventRowActions
                        voteUrl={event.voteUrl}
                        resultsUrl={event.resultsUrl}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="inline-flex rounded-md p-1.5 text-text-muted hover:bg-surface-raised hover:text-accent"
                        aria-label={`Edit ${event.name}`}
                      >
                        <PencilIcon />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
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
