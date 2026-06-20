import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/session", () => ({ requireRole: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: vi.fn().mockResolvedValue({}) }));
vi.mock("@/lib/repositories/supabase", () => ({ createRepositories: vi.fn() }));

import { requireRole } from "@/lib/auth/session";
import { createRepositories } from "@/lib/repositories/supabase";
import { getAdminHouseholdDetail } from "@/server/queries/admin";

const requireRoleMock = vi.mocked(requireRole);
const createRepositoriesMock = vi.mocked(createRepositories);

function setup(repositories: Record<string, unknown>) {
  requireRoleMock.mockResolvedValue({
    id: "admin-1",
    fraccionamiento_id: "fracc-1",
    rol: "ADMINISTRACION"
  } as unknown as Awaited<ReturnType<typeof requireRole>>);
  createRepositoriesMock.mockReturnValue(repositories as unknown as ReturnType<typeof createRepositories>);
}

describe("getAdminHouseholdDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve null si el domicilio es de otro fraccionamiento (tenant-scoped)", async () => {
    const listByHousehold = vi.fn();
    setup({
      households: { findById: vi.fn().mockResolvedValue({ id: "dom-1", fraccionamiento_id: "fracc-2" }) },
      users: { listByHousehold },
      invitations: { listByHousehold },
      accessLogs: { listByHousehold }
    });

    const result = await getAdminHouseholdDetail("dom-1");
    expect(result).toBeNull();
    expect(listByHousehold).not.toHaveBeenCalled();
  });

  it("agrega colonos, invitaciones y accesos (recientes recortados a 10)", async () => {
    const invitations = Array.from({ length: 12 }, (_, i) => ({ id: `inv-${i}` }));
    const accessLogs = Array.from({ length: 5 }, (_, i) => ({ id: `acc-${i}` }));
    setup({
      households: {
        findById: vi.fn().mockResolvedValue({ id: "dom-1", fraccionamiento_id: "fracc-1", calle: "Principal" })
      },
      users: { listByHousehold: vi.fn().mockResolvedValue([{ id: "c1" }, { id: "c2" }, { id: "c3" }]) },
      invitations: { listByHousehold: vi.fn().mockResolvedValue(invitations) },
      accessLogs: { listByHousehold: vi.fn().mockResolvedValue(accessLogs) }
    });

    const result = await getAdminHouseholdDetail("dom-1");
    expect(result).not.toBeNull();
    expect(result?.counts).toEqual({ colonos: 3, invitaciones: 12, accesos: 5 });
    expect(result?.invitations).toHaveLength(10);
    expect(result?.accessLogs).toHaveLength(5);
  });
});
