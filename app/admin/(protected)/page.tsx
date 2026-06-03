import Link from "next/link";
import { EventsTable } from "@/components/admin/events-table";
import { auth } from "@/lib/auth";
import { getEventsForSession } from "@/lib/events/access";
import { toAdminEventRows } from "@/lib/events/dashboard-rows";
import { getRequestBaseUrl } from "@/lib/urls";
import { Button } from "@/components/ui";

export default async function AdminDashboardPage() {
  const session = await auth();
  const user = session!.user;
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const [events, baseUrl] = await Promise.all([
    getEventsForSession(),
    getRequestBaseUrl(),
  ]);
  const rows = toAdminEventRows(events, baseUrl);

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Dashboard
          </h1>
          <p className="mt-1 text-text-muted">
            {isSuperAdmin
              ? `All events · signed in as ${user.email}`
              : `Your events · signed in as ${user.email}`}
          </p>
        </div>
        <Link href="/admin/events/new">
          <Button>New event</Button>
        </Link>
      </div>

      {isSuperAdmin ? (
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/users">
            <Button variant="ghost">Manage users</Button>
          </Link>
          <Link href="/admin/invitations">
            <Button variant="ghost">Invitations</Button>
          </Link>
        </div>
      ) : null}

      <EventsTable events={rows} isSuperAdmin={isSuperAdmin} />
    </main>
  );
}
