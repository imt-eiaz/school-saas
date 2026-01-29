"use client";

import { useState } from "react";

import { createStudent, type StudentFormData } from "../actions";

type Props = {
  classes: Array<{ id: string; name: string }>;
  sections: Array<{ id: string; name: string; class_id: string }>;
};

export function StudentAdmissionForm({ classes, sections }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardianCount, setGuardianCount] = useState(1);
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const guardians: StudentFormData["guardians"] = [];
    for (let i = 0; i < guardianCount; i++) {
      const name = formData.get(`guardian_${i}_name`) as string;
      if (name && name.trim()) {
        guardians.push({
          name: name.trim(),
          relation: (formData.get(`guardian_${i}_relation`) as any) || "guardian",
          phone: (formData.get(`guardian_${i}_phone`) as string) || undefined,
          email: (formData.get(`guardian_${i}_email`) as string) || undefined,
          occupation: (formData.get(`guardian_${i}_occupation`) as string) || undefined,
          address: (formData.get(`guardian_${i}_address`) as string) || undefined,
          is_primary: i === 0,
        });
      }
    }

    const studentData: StudentFormData = {
      admission_no: (formData.get("admission_no") as string) || undefined,
      first_name: formData.get("first_name") as string,
      last_name: (formData.get("last_name") as string) || undefined,
      gender: (formData.get("gender") as any) || undefined,
      dob: (formData.get("dob") as string) || undefined,
      class_id: (formData.get("class_id") as string) || undefined,
      section_id: (formData.get("section_id") as string) || undefined,
      address: (formData.get("address") as string) || undefined,
      phone: (formData.get("phone") as string) || undefined,
      email: (formData.get("email") as string) || undefined,
      guardians: guardians.length > 0 ? guardians : undefined,
    };

    try {
      const result = await createStudent(studentData);
      if (result?.error) {
        setError(result.error);
        setIsSubmitting(false);
      }
      // If successful, redirect happens in the action
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create student");
      setIsSubmitting(false);
    }
  };

  const availableSections = sections.filter((s) => s.class_id === selectedClassId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Admission Number</label>
            <input
              name="admission_no"
              type="text"
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
              placeholder="Auto-generated if left empty"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              name="first_name"
              type="text"
              required
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Last Name</label>
            <input
              name="last_name"
              type="text"
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Gender</label>
            <select
              name="gender"
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            >
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Date of Birth</label>
            <input
              name="dob"
              type="date"
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Class & Contact</h2>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Class</label>
            <select
              name="class_id"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
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
            <label className="block text-sm font-medium text-zinc-700">Section</label>
            <select
              name="section_id"
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 disabled:bg-zinc-50"
              disabled={availableSections.length === 0}
            >
              <option value="">Select section</option>
              {availableSections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {availableSections.length === 0 ? (
              <p className="mt-1 text-xs text-zinc-500">Select a class first</p>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Phone</label>
            <input
              name="phone"
              type="tel"
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Email</label>
            <input
              name="email"
              type="email"
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Address</label>
            <textarea
              name="address"
              rows={3}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t border-zinc-200 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Guardian Information</h2>
          <button
            type="button"
            onClick={() => setGuardianCount((c) => c + 1)}
            className="text-sm text-zinc-600 hover:text-zinc-900"
          >
            + Add guardian
          </button>
        </div>

        {Array.from({ length: guardianCount }).map((_, i) => (
          <div key={i} className="grid gap-4 rounded-lg border border-zinc-200 p-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Guardian {i + 1} Name <span className="text-red-500">*</span>
              </label>
              <input
                name={`guardian_${i}_name`}
                type="text"
                required={i === 0}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700">Relation</label>
              <select
                name={`guardian_${i}_relation`}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
                defaultValue={i === 0 ? "father" : "guardian"}
              >
                <option value="father">Father</option>
                <option value="mother">Mother</option>
                <option value="guardian">Guardian</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700">Phone</label>
              <input
                name={`guardian_${i}_phone`}
                type="tel"
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700">Email</label>
              <input
                name={`guardian_${i}_email`}
                type="email"
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700">Occupation</label>
              <input
                name={`guardian_${i}_occupation`}
                type="text"
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700">Address</label>
              <textarea
                name={`guardian_${i}_address`}
                rows={2}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
              />
            </div>

            {guardianCount > 1 ? (
              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={() => setGuardianCount((c) => c - 1)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Remove guardian
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="flex gap-3 border-t border-zinc-200 pt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Create student"}
        </button>
        <a
          href="/students"
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm hover:bg-zinc-50"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
