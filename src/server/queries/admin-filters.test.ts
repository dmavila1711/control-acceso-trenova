import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/session", () => ({ requireRole: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: vi.fn().mockResolvedValue({}) }));
vi.mock("@/lib/repositories/supabase", () => ({ createRepositories: vi.fn() }));

import { requireRole } from "@/lib/auth/session";
import { createRepositories } from "@/lib/repositories/supabase";
import { getAdminAccessLogs, getAdminInvitations } from "@/server/queries/admin";
import { zonedDayBounds } from "@/lib/time/zoned";

const requireRoleMock = vi.mocked(requireRole);
const createRepositoriesMock = vi.mocked(createRepositories);

const TZ = "America/Mexico_City";

function setup() {
  requireRoleMock.mockResolvedValue({
    id: "admin-1",
    fraccionamiento_id: "fracc-1",
    rol: "ADMINISTRACION"
  } as unknown as Awaited<ReturnType<typeof requireRole>>);
  const invitationsList = vi.fn().mockResolvedValue([]);
  const accessList = vi.fn().mockResolvedValue([]);
  const getConfig = vi.fn().mockResolvedValue({ zona_horaria: TZ });
  createRepositoriesMock.mockReturnValue({
    fractionations: { getConfig },
    invitations: { listByFractionation: invitationsList },
    accessLogs: { listByFractionation: accessList }
  } as unknown as ReturnType<typeof createRepositories>);
  return { invitationsList, accessList, getConfig };
}

describe("filtros de fecha en zona horaria del fraccionamiento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("convierte desde/hasta a limites de dia en la zona del tenant (no UTC)", async () => {
    const { invitationsList, getConfig } = setup();

    await getAdminInvitations({ desde: "2026-06-01", hasta: "2026-06-30" });

    expect(getConfig).toHaveBeenCalledWith("fracc-1");
    const filters = invitationsList.mock.calls[0][1] as { desde: string; hasta: string };
    expect(filters.desde).toBe(zonedDayBounds("2026-06-01", TZ).start.toISOString());
    expect(filters.hasta).toBe(zonedDayBounds("2026-06-30", TZ).end.toISOString());
    // Debe diferir del UTC naive (Mexico_City = UTC-6).
    expect(filters.desde).not.toBe("2026-06-01T00:00:00.000Z");
  });

  it("aplica los mismos limites de zona en accesos", async () => {
    const { accessList } = setup();

    await getAdminAccessLogs({ desde: "2026-06-01", hasta: "2026-06-30" });

    const filters = accessList.mock.calls[0][1] as { desde: string; hasta: string };
    expect(filters.desde).toBe(zonedDayBounds("2026-06-01", TZ).start.toISOString());
    expect(filters.hasta).toBe(zonedDayBounds("2026-06-30", TZ).end.toISOString());
  });

  it("no consulta la zona horaria si no hay filtro de fecha", async () => {
    const { accessList, getConfig } = setup();

    await getAdminAccessLogs({ resultado: "PERMITIDO" });

    expect(getConfig).not.toHaveBeenCalled();
    const filters = accessList.mock.calls[0][1] as { resultado: string; desde?: string };
    expect(filters.desde).toBeUndefined();
  });
});
