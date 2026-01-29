"use client";

import { useState } from "react";

import { bulkImportStudents, type StudentFormData } from "../actions";

type Props = {
  classes: Array<{ id: string; name: string }>;
  sections: Array<{ id: string; name: string; class_id: string }>;
};

type ImportResult = {
  success: boolean;
  error?: string;
  admission_no?: string;
};

function parseCSV(text: string): Array<Record<string, string>> {
  const lines = text.split("\n").filter((line) => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().toLowerCase().replace(/"/g, ""));
  const rows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    if (values.length !== headers.length) continue;

    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || "";
    });
    rows.push(row);
  }

  return rows;
}

export function BulkImportForm({ classes, sections }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Array<Record<string, string>> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const classMap = new Map(classes.map((c) => [c.name.toLowerCase(), c.id]));
  const sectionMap = new Map(
    sections.map((s) => [`${s.class_id}:${s.name.toLowerCase()}`, s.id]),
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreview(null);
    setResults(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      setPreview(parsed.slice(0, 5)); // Show first 5 rows as preview
    };
    reader.readAsText(selectedFile);
  };

  const mapCSVRowToStudent = (row: Record<string, string>): StudentFormData | null => {
    const firstName = row["first_name"] || row["firstname"] || row["name"]?.split(" ")[0] || "";
    if (!firstName.trim()) return null;

    const lastName =
      row["last_name"] ||
      row["lastname"] ||
      row["name"]?.split(" ").slice(1).join(" ") ||
      "";

    const className = (row["class"] || row["class_name"] || "").toLowerCase();
    const classId = classMap.get(className) || null;

    let sectionId: string | undefined = undefined;
    if (classId) {
      const sectionName = (row["section"] || row["section_name"] || "").toLowerCase();
      sectionId = sectionMap.get(`${classId}:${sectionName}`) || undefined;
    }

    return {
      admission_no: row["admission_no"] || row["admission_number"] || undefined,
      first_name: firstName.trim(),
      last_name: lastName.trim() || undefined,
      gender: (row["gender"]?.toLowerCase() as any) || undefined,
      dob: row["dob"] || row["date_of_birth"] || row["birthdate"] || undefined,
      class_id: classId || undefined,
      section_id: sectionId,
      address: row["address"] || undefined,
      phone: row["phone"] || row["phone_number"] || undefined,
      email: row["email"] || undefined,
      guardians: row["guardian_name"]
        ? [
            {
              name: row["guardian_name"],
              relation: (row["guardian_relation"]?.toLowerCase() as any) || "guardian",
              phone: row["guardian_phone"] || undefined,
              email: row["guardian_email"] || undefined,
              occupation: row["guardian_occupation"] || undefined,
              address: row["guardian_address"] || undefined,
              is_primary: true,
            },
          ]
        : undefined,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setResults(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      const students = rows.map(mapCSVRowToStudent).filter((s): s is StudentFormData => s !== null);

      if (students.length === 0) {
        setError("No valid student data found in CSV.");
        setIsProcessing(false);
        return;
      }

      const result = await bulkImportStudents(students);
      setResults(result.results);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to import students");
    } finally {
      setIsProcessing(false);
    }
  };

  const successCount = results?.filter((r) => r.success).length || 0;
  const errorCount = results?.filter((r) => !r.success).length || 0;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-blue-50 p-4 text-sm text-blue-900">
        <div className="font-medium">CSV Format</div>
        <div className="mt-2 text-blue-800">
          <p>Required columns: <code className="rounded bg-blue-100 px-1">first_name</code></p>
          <p className="mt-1">
            Optional columns: <code className="rounded bg-blue-100 px-1">admission_no</code>,{" "}
            <code className="rounded bg-blue-100 px-1">last_name</code>,{" "}
            <code className="rounded bg-blue-100 px-1">class</code>,{" "}
            <code className="rounded bg-blue-100 px-1">section</code>,{" "}
            <code className="rounded bg-blue-100 px-1">gender</code>,{" "}
            <code className="rounded bg-blue-100 px-1">dob</code>,{" "}
            <code className="rounded bg-blue-100 px-1">phone</code>,{" "}
            <code className="rounded bg-blue-100 px-1">email</code>,{" "}
            <code className="rounded bg-blue-100 px-1">address</code>,{" "}
            <code className="rounded bg-blue-100 px-1">guardian_name</code>,{" "}
            <code className="rounded bg-blue-100 px-1">guardian_phone</code>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-700">CSV File</label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-zinc-600 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-800"
            required
          />
        </div>

        {preview && preview.length > 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="mb-2 text-sm font-medium text-zinc-700">Preview (first 5 rows)</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-zinc-50">
                  <tr>
                    {Object.keys(preview[0]).map((key) => (
                      <th key={key} className="px-2 py-1 text-left font-medium text-zinc-600">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, idx) => (
                    <tr key={idx} className="border-t border-zinc-100">
                      {Object.values(row).map((val, vIdx) => (
                        <td key={vIdx} className="px-2 py-1 text-zinc-700">
                          {val || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
            {error}
          </div>
        ) : null}

        {results ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="mb-3 text-sm font-medium">Import Results</div>
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-green-600 font-medium">{successCount}</span>{" "}
                  <span className="text-zinc-600">succeeded</span>
                </div>
                {errorCount > 0 ? (
                  <div>
                    <span className="text-red-600 font-medium">{errorCount}</span>{" "}
                    <span className="text-zinc-600">failed</span>
                  </div>
                ) : null}
              </div>
            </div>

            {errorCount > 0 ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <div className="mb-2 text-sm font-medium text-red-900">Errors</div>
                <div className="space-y-1 text-xs text-red-800">
                  {results
                    .filter((r) => !r.success)
                    .map((r, idx) => (
                      <div key={idx}>
                        {r.admission_no ? `${r.admission_no}: ` : ""}
                        {r.error}
                      </div>
                    ))}
                </div>
              </div>
            ) : null}

            <div className="flex gap-3">
              <a
                href="/students"
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                View students
              </a>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  setResults(null);
                  setError(null);
                }}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm hover:bg-zinc-50"
              >
                Import another file
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!file || isProcessing}
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {isProcessing ? "Importing..." : "Import students"}
            </button>
            <a
              href="/students"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm hover:bg-zinc-50"
            >
              Cancel
            </a>
          </div>
        )}
      </form>
    </div>
  );
}
