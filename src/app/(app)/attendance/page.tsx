import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { AttendanceMarkingForm } from "./marking-form";

function localDateYYYYMMDD(d: Date) {
  const offsetMs = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 10);
}

type SearchParams = {
  date?: string;
  class_id?: string;
  section_id?: string;
};

export default async function AttendancePage({
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
  let students: Array<{
    id: string;
    admission_no: string | null;
    first_name: string | null;
    last_name: string | null;
  }> = [];
  let existing: Array<{ student_id: string; status: "present" | "absent" | "late" | "leave" }> = [];

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

    if (classId) {
      className = classes.find((c) => c.id === classId)?.name;
    }
    if (sectionId) {
      sectionName = sections.find((s) => s.id === sectionId)?.name;
    }

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

      const studentIds = students.map((s) => s.id);
      if (studentIds.length > 0) {
        const { data: att, error: attErr } = await supabase
          .from("attendance_records")
          .select("student_id, status")
          .eq("date", date)
          .in("student_id", studentIds);
        if (attErr) throw attErr;
        existing = (att ?? []) as any;
      }
    }
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : "Failed to load attendance.";
  }

  const sectionOptions = classId ? sections.filter((s) => s.class_id === classId) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Daily marking, absentee list, and monthly report.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/attendance/absentees?date=${encodeURIComponent(date)}&class_id=${encodeURIComponent(
              classId,
            )}&section_id=${encodeURIComponent(sectionId)}`}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
          >
            Absentees
          </Link>
          <Link
            href={`/attendance/reports?month=${encodeURIComponent(date.slice(0, 7))}&class_id=${encodeURIComponent(
              classId,
            )}&section_id=${encodeURIComponent(sectionId)}`}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
          >
            Monthly report
          </Link>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="font-medium">Setup required</div>
          <div className="mt-1 text-amber-800">
            {errorMessage}. Ensure env vars are set and Supabase schema is applied.
          </div>
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

      {classId ? (
        <AttendanceMarkingForm
          date={date}
          className={className}
          sectionName={sectionName}
          students={students}
          existing={existing}
        />
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Select a class to start marking attendance.
        </div>
      )}
    </div>
  );
}

