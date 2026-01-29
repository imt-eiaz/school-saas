import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

function localDateYYYYMMDD(d: Date) {
  const offsetMs = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 10);
}

type SearchParams = {
  date?: string;
  class_id?: string;
  section_id?: string;
};

export default async function AbsenteesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const today = localDateYYYYMMDD(new Date());
  const date = typeof searchParams.date === "string" ? searchParams.date : today;
  const classId = typeof searchParams.class_id === "string" ? searchParams.class_id : "";
  const sectionId = typeof searchParams.section_id === "string" ? searchParams.section_id : "";

  let classes: Array<{ id: string; name: string }> = [];
  let sections: Array<{ id: string; name: string; class_id: string }> = [];
  let absentees: Array<{
    id: string;
    admission_no: string | null;
    first_name: string | null;
    last_name: string | null;
    status: "absent" | "leave";
  }> = [];
  let className: string | undefined;
  let sectionName: string | undefined;
  let errorMessage: string | null = null;

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

    if (classId) className = classes.find((c) => c.id === classId)?.name;
    if (sectionId) sectionName = sections.find((s) => s.id === sectionId)?.name;

    if (classId) {
      const studentsQuery = supabase
        .from("students")
        .select("id, admission_no, first_name, last_name")
        .eq("class_id", classId);
      const { data: st, error: stErr } = sectionId
        ? await studentsQuery.eq("section_id", sectionId)
        : await studentsQuery;
      if (stErr) throw stErr;
      const students = st ?? [];
      const ids = students.map((s) => s.id);

      if (ids.length > 0) {
        const { data: rows, error: rowsErr } = await supabase
          .from("attendance_records")
          .select("student_id, status")
          .eq("date", date)
          .in("student_id", ids)
          .in("status", ["absent", "leave"]);
        if (rowsErr) throw rowsErr;

        const statusById = new Map<string, "absent" | "leave">(
          (rows ?? []).map((r: any) => [r.student_id, r.status]),
        );

        absentees = students
          .filter((s) => statusById.has(s.id))
          .map((s) => ({
            ...s,
            status: statusById.get(s.id)!,
          })) as any;
      }
    }
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : "Failed to load absentees.";
  }

  const sectionOptions = classId ? sections.filter((s) => s.class_id === classId) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Absentee list</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Students marked <span className="font-medium">Absent</span> or{" "}
            <span className="font-medium">Leave</span> for {date}.
          </p>
        </div>
        <Link
          href={`/attendance?date=${encodeURIComponent(date)}&class_id=${encodeURIComponent(
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
            Date
          </label>
          <input
            type="date"
            name="date"
            defaultValue={date}
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

      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="text-sm text-zinc-700">
          {classId ? (
            <>
              Showing absentees for{" "}
              <span className="font-medium">{className ?? "selected class"}</span>
              {sectionName ? (
                <>
                  {" "}
                  • <span className="font-medium">Section {sectionName}</span>
                </>
              ) : null}
            </>
          ) : (
            "Select a class to view absentees."
          )}
        </div>
      </div>

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
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {absentees.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-sm text-zinc-600" colSpan={3}>
                  No absentees found.
                </td>
              </tr>
            ) : (
              absentees.map((s) => (
                <tr key={s.id} className="border-t border-zinc-100">
                  <td className="px-4 py-3 text-sm text-zinc-700">
                    {s.admission_no ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-zinc-900">
                    {[s.first_name, s.last_name].filter(Boolean).join(" ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                        s.status === "absent"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

