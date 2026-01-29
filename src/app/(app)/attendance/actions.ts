"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AttendanceStatus = "present" | "absent" | "late" | "leave";

export type SaveAttendanceInput = {
  date: string; // YYYY-MM-DD
  records: Array<{
    student_id: string;
    status: AttendanceStatus;
  }>;
};

export async function saveAttendance(input: SaveAttendanceInput) {
  const supabase = createSupabaseServerClient();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    return { error: "Invalid date format. Use YYYY-MM-DD." };
  }

  if (!input.records || input.records.length === 0) {
    return { error: "No attendance records to save." };
  }

  const rows = input.records.map((r) => ({
    student_id: r.student_id,
    date: input.date,
    status: r.status,
  }));

  const { error } = await supabase
    .from("attendance_records")
    .upsert(rows, { onConflict: "student_id,date" });

  if (error) return { error: error.message };

  revalidatePath("/attendance");
  revalidatePath("/dashboard");
  return { ok: true };
}

