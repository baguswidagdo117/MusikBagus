import { getSession } from "@/lib/auth";
import { fail, ok } from "@/lib/api";
import { permissionsFor } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSession();
  if (!user) return fail("Belum login.", 401);
  return ok({ user, permissions: permissionsFor(user.role) });
}
