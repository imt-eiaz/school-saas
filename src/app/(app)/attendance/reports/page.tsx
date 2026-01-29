import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type SearchParams = {
  month?: string; // YYYY-MM
  class_id?: string;
  section_id?: string;
};

function monthStartEnd(month: string) {
  const [y, m] = month.split("-").map((x) => Number(x));
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 0)); // last day of month
  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);
  const daysInMonth = end.getUTCDate();
  return { startStr, endStr, daysInMonth };
}

export default async function AttendanceReportsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const month = typeof searchParams.month === "string" ? searchParams.month : defaultMonth;
  const classId = typeof searchParams.class_id === "string" ? searchParams.class_id : "";
  const sectionId = typeof searchParams.section_id === "string" ? searchParams.section_id : "";

  let classes: Array<{ id: string; name: string }> = [];
  let sections: Array<{ id: string; name: string; class_id: string }> = [];
  let students: Array<{
    id: string;
    admission_no: string | null;
    first_name: string | null;
    last_name: string | null;
  }> = [];
  let summary: Array<{
    id: string;
    admission_no: string | null;
    name: string;
    present: number;
    absent: number;
    late: number;
    leave: number;
    marked: number;
    percent: number | null;
  }> = [];

  let errorMessage: string | null = null;

  const { startStr, endStr, daysInMonth } = monthStartEnd(month);

  try {
    const supabase = createSupabaseServerClient();

    const [{ data: cls, error: clsErr }, { data: sec, error: secErr }] = await Promise.all([
      supabase.from("classes").select("id, name").order("sort_order"),
      supabase.from("sections").select("id, name, class_id"),
    ]);
    if (clsErr) throw clsErr;
    if (secErr) throw secErr;
    classes = cls ?? [];
    sections = sec ?? [];

    if (classId) {
      const studentsQuery = supabase
        .from("students")
        .select("id, admission_no, first_name, last_name")
        .eq("class_id", classId)
        .order("created_at", { ascending: true });

      const { data: st, error: stErr } = sectionId
        ? await studentsQuery.eq("section_id", sectionId)
        : await studentsQuery;
      if (stErr) throw stErr;
      students = st ?? [];

      const ids = students.map((s) => s.id);
      if (ids.length > 0) {
        const { data: rows, error: rowsErr } = await supabase
          .from("attendance_records")
          .select("student_id, status")
          .gte("date", startStr)
          .lte("date", endStr)
          .in("student_id", ids);
        if (rowsErr) throw rowsErr;

        const counts = new Map<
          string,
          { present: number; absent: number; late: number; leave: number; marked: number }
        >();
        for (const id of ids) {
          counts.set(id, { present: 0, absent: 0, late: 0, leave: 0, marked: 0 });
        }

        for (const r of (rows ?? []) as any[]) {
          const c = counts.get(r.student_id);
          if (!c) continue;
          c.marked += 1;
          if (r.status === "present") c.present += 1;
          else if (r.status === "absent") c.absent += 1;
          else if (r.status === "late") c.late += 1;
          else if (r.status === "leave") c.leave += 1;
        }

        summary = students.map((s) => {
          const c = counts.get(s.id)!;
          const name = [s.first_name, s.last_name].filter(Boolean).join(" ") || "—";
          const percent =
            c.marked === 0 ? null : Math.round(((c.present + c.late) / c.marked) * 1000) / 10;
          return {
            id: s.id,
            admission_no: s.admission_no,
            name,
            ...c,
            percent,
          };
        });
      }
    }
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : "Failed to load monthly report.";
  }

  const sectionOptions = classId ? sections.filter((s) => s.class_id === classId) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Attendance monthly report</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Month: <span className="font-medium">{month}</span> • Range: {startStr} → {endStr} (
            {daysInMonth} days)
          </p>
        </div>
        <Link
          href={`/attendance?date=${encodeURIComponent(startStr)}&class_id=${encodeURIComponent(
            classId,
          )}&section_id=${encodeURIComponent(sectionId)}`}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
        >
          ← Back to marking
        </Link>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {errorMessage}
        </div>
      ) : null}

      <form className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 md:grid-cols-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-600">
            Month
          </label>
          <input
            type="month"
            name="month"
            defaultValue={month}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-600">
            Class
          </label>
          <select
            name="class_id"
            defaultValue={classId}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
          >
            <option value="">Select class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-600">
            Section
          </label>
          <select
            name="section_id"
            defaultValue={sectionId}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            disabled={!classId || sectionOptions.length === 0}
          >
            <option value="">All</option>
            {sectionOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Load
          </button>
        </div>
      </form>

      {!classId ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Select a class to view the monthly report.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200">
          <table className="w-full border-separate border-spacing-0">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                  Admission #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                  Present
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                  Late
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                  Leave
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                  Absent
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                  Marked
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                  %
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {summary.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-zinc-600" colSpan={8}>
                    No attendance records found for this month (or no students in selection).
                  </td>
                </tr>
              ) : (
                summary.map((s) => (
                  <tr key={s.id} className="border-t border-zinc-100">
                    <td className="px-4 py-3 text-sm text-zinc-700">
                      {s.admission_no ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-zinc-900">{s.name}</td>
                    <td className="px-4 py-3 text-sm text-zinc-700">{s.present}</td>
                    <td className="px-4 py-3 text-sm text-zinc-700">{s.late}</td>
                    <td className="px-4 py-3 text-sm text-zinc-700">{s.leave}</td>
                    <td className="px-4 py-3 text-sm text-zinc-700">{s.absent}</td>
                    <td className="px-4 py-3 text-sm text-zinc-700">{s.marked}</td>
                    <td className="px-4 py-3 text-sm font-medium text-zinc-900">
                      {s.percent === null ? "—" : `${s.percent}%`}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

