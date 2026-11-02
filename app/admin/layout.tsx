import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { permissionsFor } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  if (!["OWNER", "ADMIN", "KASIR"].includes(user.role)) redirect("/tech");
  const permissionList = permissionsFor(user.role);
  const unread = await prisma.notification.count({
    where: { userId: user.id, read: false },
  });

  return (
    <AdminShell
      user={user}
      permissions={permissionList}
      notificationCount={unread}
    >
      {children}
    </AdminShell>
  );
}
