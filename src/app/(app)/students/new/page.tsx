import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { StudentAdmissionForm } from "./form";

export default async function NewStudentPage() {
  let classes: Array<{ id: string; name: string }> = [];
  let sections: Array<{ id: string; name: string; class_id: string }> = [];
  let errorMessage: string | null = null;

  try {
    const supabase = createSupabaseServerClient();
    const [{ data: classesData, error: classesError }, { data: sectionsData, error: sectionsError }] =
      await Promise.all([
        supabase.from("classes").select("id, name").order("sort_order"),
        supabase.from("sections").select("id, name, class_id"),
      ]);

    if (classesError) throw classesError;
    if (sectionsError) throw sectionsError;

    classes = classesData || [];
    sections = sectionsData || [];
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : "Failed to load classes/sections.";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New student admission</h1>
          <p className="mt-1 text-sm text-zinc-600">Add a new student to the system.</p>
        </div>
        <Link
          href="/students"
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
        >
          ← Back to list
        </Link>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="font-medium">Setup required</div>
          <div className="mt-1 text-amber-800">
            {errorMessage}. Make sure you've run the SQL schema in Supabase.
          </div>
        </div>
      ) : (
        <StudentAdmissionForm classes={classes} sections={sections} />
      )}
    </div>
  );
}
