"use client";

import { useMemo, useState } from "react";

import { saveAttendance, type AttendanceStatus } from "./actions";

type StudentRow = {
  id: string;
  admission_no: string | null;
  first_name: string | null;
  last_name: string | null;
};

type ExistingRecord = {
  student_id: string;
  status: AttendanceStatus;
};

export function AttendanceMarkingForm({
  date,
  className,
  sectionName,
  students,
  existing,
}: {
  date: string;
  className?: string;
  sectionName?: string;
  students: StudentRow[];
  existing: ExistingRecord[];
}) {
  const existingMap = useMemo(() => {
    const m = new Map<string, AttendanceStatus>();
    for (const r of existing) m.set(r.student_id, r.status);
    return m;
  }, [existing]);

  const [statusByStudent, setStatusByStudent] = useState<Record<string, AttendanceStatus>>(() => {
    const initial: Record<string, AttendanceStatus> = {};
    for (const s of students) {
      initial[s.id] = existingMap.get(s.id) ?? "present";
    }
    return initial;
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const setAll = (status: AttendanceStatus) => {
    const next: Record<string, AttendanceStatus> = {};
    for (const s of students) next[s.id] = status;
    setStatusByStudent(next);
    setSaved(false);
  };

  const onSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    const records = students.map((s) => ({
      student_id: s.id,
      status: statusByStudent[s.id] ?? "present",
    }));

    try {
      const res = await saveAttendance({ date, records });
      if (res?.error) setError(res.error);
      else setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="text-sm text-zinc-700">
          Marking attendance for <span className="font-medium">{date}</span>
          {className ? (
            <>
              {" "}
              • <span className="font-medium">{className}</span>
            </>
          ) : null}
          {sectionName ? (
            <>
              {" "}
              • <span className="font-medium">Section {sectionName}</span>
            </>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAll("present")}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
          >
            Mark all present
          </button>
          <button
            type="button"
            onClick={() => setAll("absent")}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
          >
            Mark all absent
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-xl bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </div>
      ) : null}
      {saved ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-900">
          Saved.
        </div>
      ) : null}

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
            {students.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-sm text-zinc-600" colSpan={3}>
                  No students found for the selected class/section.
                </td>
              </tr>
            ) : (
              students.map((s) => {
                const name =
                  [s.first_name, s.last_name].filter(Boolean).join(" ") || "—";
                const value = statusByStudent[s.id] ?? "present";
                return (
                  <tr key={s.id} className="border-t border-zinc-100">
                    <td className="px-4 py-3 text-sm text-zinc-700">
                      {s.admission_no ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-zinc-900">
                      {name}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={value}
                        onChange={(e) => {
                          setStatusByStudent((prev) => ({
                            ...prev,
                            [s.id]: e.target.value as AttendanceStatus,
                          }));
                          setSaved(false);
                        }}
                        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
                      >
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                        <option value="leave">Leave</option>
                      </select>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

