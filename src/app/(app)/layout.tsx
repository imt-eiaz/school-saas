import Link from "next/link";
import type { ReactNode } from "react";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/students", label: "Students" },
  { href: "/attendance", label: "Attendance" },
  { href: "/academics", label: "Examination / Academics" },
  { href: "/fees", label: "Fees" },
  { href: "/staff", label: "Staff / Teachers" },
  { href: "/timetable", label: "Timetable" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings / Master" },
  { href: "/communication", label: "Communication" },
  { href: "/events", label: "Events / Calendar" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="mb-4">
              <div className="text-sm font-semibold">
                SPS School and Colleges
              </div>
              <div className="text-xs text-zinc-500">Admin panel</div>
            </div>
            <nav className="space-y-1">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
