import type { Role } from "@/lib/access";

const STYLES: Record<Role, string> = {
  owner: "bg-blue-50 text-blue-700 border-blue-200",
  editor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  viewer: "bg-gray-100 text-gray-700 border-gray-200",
};

const LABELS: Record<Role, string> = { owner: "Owner", editor: "Can edit", viewer: "View only" };

export default function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STYLES[role]}`}>
      {LABELS[role]}
    </span>
  );
}
