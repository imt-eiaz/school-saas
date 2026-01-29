import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type SearchParams = {
  q?: string;
};

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const qRaw = typeof searchParams.q === "string" ? searchParams.q : "";
  const q = qRaw.trim();

  let students:
    | Array<{
        id: string;
        admission_no: string | null;
        first_name: string | null;
        last_name: string | null;
        class?: { name: string } | null;
        section?: { name: string } | null;
      }>
    | null = null;
  let errorMessage: string | null = null;

  try {
    const supabase = createSupabaseServerClient();
    const query = supabase
      .from("students")
      .select("id, admission_no, first_name, last_name, class:classes(name), section:sections(name)")
      .order("created_at", { ascending: false })
      .limit(50);

    const { data, error } =
      q.length > 0
        ? await query.or(
            `admission_no.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`,
          )
        : await query;

    if (error) throw error;
    students = data as any;
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : "Failed to load students.";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Students</h1>
          <p className="mt-1 text-sm text-zinc-600">
            List, profiles, admission, search, and bulk import.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/students/new"
            className="rounded-xl bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-800"
          >
            Add student
          </Link>
          <Link
            href="/students/import"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
          >
            Bulk import
          </Link>
        </div>
      </div>

      <form className="flex gap-2" action="/students" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by admission no, first name, last name"
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
        />
        <button
          type="submit"
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
        >
          Search
        </button>
      </form>

      {errorMessage ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="font-medium">Supabase is not ready yet</div>
          <div className="mt-1 text-amber-800">
            {errorMessage}. Run the SQL in `supabase/schema.sql` and add env vars from
            `.env.example`.
          </div>
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
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Class
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Section
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {(students ?? []).length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-sm text-zinc-600" colSpan={4}>
                  No students found.
                </td>
              </tr>
            ) : (
              students?.map((s) => (
                <tr key={s.id} className="border-t border-zinc-100">
                  <td className="px-4 py-3 text-sm text-zinc-700">{s.admission_no ?? "—"}</td>
                  <td className="px-4 py-3 text-sm font-medium text-zinc-900">
                    <Link className="hover:underline" href={`/students/${s.id}`}>
                      {[s.first_name, s.last_name].filter(Boolean).join(" ") || "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-700">
                    {(s as any).class?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-700">
                    {(s as any).section?.name ?? "—"}
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

