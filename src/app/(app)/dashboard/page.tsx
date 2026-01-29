import Link from "next/link";
import type { ReactNode } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";

function localDateYYYYMMDD(d: Date) {
  const offsetMs = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 10);
}

function Card({
  title,
  value,
  hint,
}: {
  title: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="text-sm font-medium text-zinc-700">{title}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      {hint ? <div className="mt-1 text-xs text-zinc-500">{hint}</div> : null}
    </div>
  );
}

export default async function DashboardPage() {
  const today = localDateYYYYMMDD(new Date());

  let studentsCount: number | null = null;
  let attendancePercentToday: number | null = null;
  let pendingFeesTotal: number | null = null;
  let upcomingEventsCount: number | null = null;
  let setupError: string | null = null;

  try {
    const supabase = createSupabaseServerClient();
    const [{ count: sc, error: studentsErr }, { data: attendanceRows, error: attErr }, { data: invoices, error: feeErr }, { count: evCount, error: evErr }] =
      await Promise.all([
        supabase.from("students").select("*", { count: "exact", head: true }),
        supabase.from("attendance_records").select("status").eq("date", today),
        supabase.from("fee_invoices").select("amount").eq("status", "pending"),
        supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .gte("start_at", new Date().toISOString())
          .lte("start_at", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

    if (studentsErr || attErr || feeErr || evErr) {
      const msg =
        studentsErr?.message ||
        attErr?.message ||
        feeErr?.message ||
        evErr?.message ||
        "Unknown error";
      throw new Error(msg);
    }

    studentsCount = sc ?? 0;

    const totalMarked = attendanceRows?.length ?? 0;
    if (totalMarked === 0) {
      attendancePercentToday = null;
    } else {
      const present = attendanceRows?.filter((r) => r.status === "present").length ?? 0;
      attendancePercentToday = Math.round((present / totalMarked) * 1000) / 10;
    }

    pendingFeesTotal =
      invoices?.reduce((sum, row) => sum + (typeof row.amount === "number" ? row.amount : Number(row.amount ?? 0)), 0) ??
      0;

    upcomingEventsCount = evCount ?? 0;
  } catch (e) {
    setupError =
      e instanceof Error
        ? e.message
        : "Failed to load dashboard data. Check Supabase env + schema.";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Quick overview for today ({today}).
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/students"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
          >
            Manage students
          </Link>
        </div>
      </div>

      {setupError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="font-medium">Waiting for Supabase setup</div>
          <div className="mt-1 text-amber-800">
            {setupError}. After you add env vars and run the SQL in `supabase/schema.sql`, refresh this page.
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card title="Students" value={studentsCount ?? "—"} hint="Total active students" />
        <Card
          title="Attendance (today)"
          value={attendancePercentToday === null ? "—" : `${attendancePercentToday}%`}
          hint="Based on marked attendance"
        />
        <Card
          title="Pending fees"
          value={pendingFeesTotal === null ? "—" : `Rs.${pendingFeesTotal.toFixed(2)}`}
          hint="Sum of pending invoices"
        />
        <Card
          title="Upcoming events"
          value={upcomingEventsCount ?? "—"}
          hint="Next 7 days"
        />
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="text-sm font-medium">Next steps</div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700">
          <li>Add Supabase env vars (see `.env.example`).</li>
          <li>Run the SQL in `supabase/schema.sql` in Supabase SQL editor.</li>
          <li>Start with Students → Admission + Bulk import.</li>
        </ul>
      </div>
    </div>
  );
}

