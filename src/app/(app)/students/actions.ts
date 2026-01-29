"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type StudentFormData = {
  admission_no?: string;
  first_name: string;
  last_name?: string;
  gender?: "male" | "female" | "other";
  dob?: string;
  class_id?: string;
  section_id?: string;
  address?: string;
  phone?: string;
  email?: string;
  guardians?: Array<{
    name: string;
    relation: "father" | "mother" | "guardian" | "other";
    phone?: string;
    email?: string;
    occupation?: string;
    address?: string;
    is_primary?: boolean;
  }>;
};

export async function createStudent(formData: StudentFormData) {
  const supabase = createSupabaseServerClient();

  // Insert student
  const { data: student, error: studentError } = await supabase
    .from("students")
    .insert({
      admission_no: formData.admission_no || null,
      first_name: formData.first_name,
      last_name: formData.last_name || null,
      gender: formData.gender || null,
      dob: formData.dob || null,
      class_id: formData.class_id || null,
      section_id: formData.section_id || null,
      address: formData.address || null,
      phone: formData.phone || null,
      email: formData.email || null,
    })
    .select("id")
    .single();

  if (studentError) {
    return { error: studentError.message };
  }

  // Insert guardians if provided
  if (formData.guardians && formData.guardians.length > 0) {
    const guardiansToInsert = formData.guardians.map((g) => ({
      student_id: student.id,
      name: g.name,
      relation: g.relation,
      phone: g.phone || null,
      email: g.email || null,
      occupation: g.occupation || null,
      address: g.address || null,
      is_primary: g.is_primary || false,
    }));

    const { error: guardianError } = await supabase
      .from("guardians")
      .insert(guardiansToInsert);

    if (guardianError) {
      // Student created but guardian failed - still return success but log error
      console.error("Guardian insert error:", guardianError);
    }
  }

  revalidatePath("/students");
  redirect(`/students/${student.id}`);
}

export async function bulkImportStudents(students: StudentFormData[]) {
  const supabase = createSupabaseServerClient();
  const results: Array<{ success: boolean; error?: string; admission_no?: string }> = [];

  for (const studentData of students) {
    try {
      const { data: student, error: studentError } = await supabase
        .from("students")
        .insert({
          admission_no: studentData.admission_no || null,
          first_name: studentData.first_name,
          last_name: studentData.last_name || null,
          gender: studentData.gender || null,
          dob: studentData.dob || null,
          class_id: studentData.class_id || null,
          section_id: studentData.section_id || null,
          address: studentData.address || null,
          phone: studentData.phone || null,
          email: studentData.email || null,
        })
        .select("id")
        .single();

      if (studentError) {
        results.push({
          success: false,
          error: studentError.message,
          admission_no: studentData.admission_no,
        });
        continue;
      }

      // Insert guardians if provided
      if (studentData.guardians && studentData.guardians.length > 0) {
        const guardiansToInsert = studentData.guardians.map((g) => ({
          student_id: student.id,
          name: g.name,
          relation: g.relation,
          phone: g.phone || null,
          email: g.email || null,
          occupation: g.occupation || null,
          address: g.address || null,
          is_primary: g.is_primary || false,
        }));

        await supabase.from("guardians").insert(guardiansToInsert);
      }

      results.push({ success: true, admission_no: studentData.admission_no });
    } catch (e) {
      results.push({
        success: false,
        error: e instanceof Error ? e.message : "Unknown error",
        admission_no: studentData.admission_no,
      });
    }
  }

  revalidatePath("/students");
  return { results };
}
