import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default async function StudentProfilePage({
  params,
}: {
  params: { id: string };
}) {
  let student:
    | {
        id: string;
        admission_no: string | null;
        first_name: string | null;
        last_name: string | null;
        gender: string | null;
        dob: string | null;
        address: string | null;
        phone: string | null;
        email: string | null;
        status: string | null;
        created_at: string;
        class?: { name: string } | null;
        section?: { name: string } | null;
      }
    | null = null;
  let guardians:
    | Array<{
        id: string;
        name: string;
        relation: string;
        phone: string | null;
        email: string | null;
        occupation: string | null;
        address: string | null;
        is_primary: boolean;
      }>
    | null = null;
  let errorMessage: string | null = null;

  try {
    const supabase = createSupabaseServerClient();
    const [
      { data: studentData, error: studentError },
      { data: guardiansData, error: guardiansError },
    ] = await Promise.all([
      supabase
        .from("students")
        .select(
          "id, admission_no, first_name, last_name, gender, dob, address, phone, email, status, created_at, class:classes(name), section:sections(name)",
        )
        .eq("id", params.id)
        .maybeSingle(),
      supabase
        .from("guardians")
        .select("id, name, relation, phone, email, occupation, address, is_primary")
        .eq("student_id", params.id)
        .order("is_primary", { ascending: false }),
    ]);

    if (studentError) throw studentError;
    if (guardiansError) throw guardiansError;

    student = studentData as any;
    guardians = guardiansData;
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : "Failed to load student.";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Student profile</h1>
          <p className="mt-1 text-sm text-zinc-600">
            {student?.admission_no ? `Admission #: ${student.admission_no}` : `ID: ${params.id}`}
          </p>
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
          {errorMessage}
        </div>
      ) : !student ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Student not found.
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold">Basic Information</h2>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-zinc-500">Full Name</dt>
                  <dd className="mt-1 font-medium text-zinc-900">
                    {[student.first_name, student.last_name].filter(Boolean).join(" ") || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Admission Number</dt>
                  <dd className="mt-1 text-zinc-900">{student.admission_no || "—"}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Gender</dt>
                  <dd className="mt-1 text-zinc-900 capitalize">{student.gender || "—"}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Date of Birth</dt>
                  <dd className="mt-1 text-zinc-900">{formatDate(student.dob)}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Status</dt>
                  <dd className="mt-1">
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                        student.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-zinc-100 text-zinc-800"
                      }`}
                    >
                      {student.status || "active"}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold">Class & Contact</h2>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-zinc-500">Class</dt>
                  <dd className="mt-1 text-zinc-900">
                    {(student as any).class?.name || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Section</dt>
                  <dd className="mt-1 text-zinc-900">
                    {(student as any).section?.name || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Phone</dt>
                  <dd className="mt-1 text-zinc-900">{student.phone || "—"}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Email</dt>
                  <dd className="mt-1 text-zinc-900">{student.email || "—"}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Address</dt>
                  <dd className="mt-1 text-zinc-900 whitespace-pre-line">
                    {student.address || "—"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {guardians && guardians.length > 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold">Guardians</h2>
              <div className="space-y-4">
                {guardians.map((g) => (
                  <div key={g.id} className="rounded-lg border border-zinc-100 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-zinc-900">{g.name}</span>
                          {g.is_primary ? (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                              Primary
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 text-sm capitalize text-zinc-600">{g.relation}</div>
                      </div>
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      {g.phone ? (
                        <div>
                          <dt className="text-zinc-500">Phone</dt>
                          <dd className="mt-0.5 text-zinc-900">{g.phone}</dd>
                        </div>
                      ) : null}
                      {g.email ? (
                        <div>
                          <dt className="text-zinc-500">Email</dt>
                          <dd className="mt-0.5 text-zinc-900">{g.email}</dd>
                        </div>
                      ) : null}
                      {g.occupation ? (
                        <div>
                          <dt className="text-zinc-500">Occupation</dt>
                          <dd className="mt-0.5 text-zinc-900">{g.occupation}</dd>
                        </div>
                      ) : null}
                      {g.address ? (
                        <div className="col-span-2">
                          <dt className="text-zinc-500">Address</dt>
                          <dd className="mt-0.5 text-zinc-900 whitespace-pre-line">
                            {g.address}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
