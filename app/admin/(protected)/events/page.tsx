import Link from "next/link";
import { EventsTable } from "@/components/admin/events-table";
import { auth } from "@/lib/auth";
import { getEventsForSession } from "@/lib/events/access";
import { toAdminEventRows } from "@/lib/events/dashboard-rows";
import { getRequestBaseUrl } from "@/lib/urls";
import { Button } from "@/components/ui";

export default async function AdminEventsPage() {
  const session = await auth();
  const isSuperAdmin = session?.user.role === "SUPER_ADMIN";
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
            {isSuperAdmin ? "All events" : "My events"}
          </h1>
          <p className="mt-1 text-text-muted">
            Same list as the dashboard — manage voting, links, and status here.
          </p>
        </div>
        <Link href="/admin/events/new">
          <Button>New event</Button>
        </Link>
      </div>

      <EventsTable events={rows} isSuperAdmin={!!isSuperAdmin} />
    </main>
  );
}
