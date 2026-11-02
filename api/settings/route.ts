import { getSettings, saveSettings } from "@/lib/settings";
import { handleError, ok, requireApi } from "@/lib/api";
import { settingsSchema } from "@/lib/validators";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const guard = await requireApi("SETTING_MANAGE");
    if (guard.error) return guard.error;
    return ok(await getSettings());
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: Request) {
  try {
    const guard = await requireApi("SETTING_MANAGE");
    if (guard.error) return guard.error;
    const data = settingsSchema.parse(await req.json());
    await saveSettings(data);
    await audit({
      userId: guard.user.id,
      action: "SETTINGS_UPDATE",
      entity: "Setting",
      meta: { keys: Object.keys(data) },
    });
    return ok(await getSettings());
  } catch (err) {
    return handleError(err);
  }
}
