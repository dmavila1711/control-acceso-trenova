import { describe, it, expect, vi, beforeEach } from "vitest";

// Modulos con `server-only` o acceso a sesion/DB: se reemplazan para poder
// probar la logica del servicio de forma aislada.
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn()
}));
vi.mock("@/lib/audit/audit", () => ({
  auditAction: vi.fn().mockResolvedValue(undefined)
}));
vi.mock("@/lib/services/context", () => ({
  getServiceContext: vi.fn()
}));

import { getServiceContext } from "@/lib/services/context";
import { updateUser, sendInternalMessage } from "@/lib/services/admin.service";
import { AppError, ForbiddenError } from "@/lib/errors";

const getServiceContextMock = vi.mocked(getServiceContext);

type ServiceContext = Awaited<ReturnType<typeof getServiceContext>>;

function withContext(actor: Record<string, unknown>, repositories: Record<string, unknown>) {
  getServiceContextMock.mockResolvedValue({ actor, repositories } as unknown as ServiceContext);
}

// UUIDs validos para pasar los esquemas Zod.
const ADMIN_ID = "10000000-0000-4000-8000-000000000001";
const COLONO_ID = "20000000-0000-4000-8000-000000000001";
const DOM_A = "30000000-0000-4000-8000-000000000001";
const DOM_B = "40000000-0000-4000-8000-000000000002";

describe("updateUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rechaza reasignar un domicilio de otro fraccionamiento (cross-tenant)", async () => {
    const updateProfile = vi.fn();
    const actor = { id: ADMIN_ID, fraccionamiento_id: "fracc-A", rol: "ADMINISTRACION" };
    const current = {
      id: COLONO_ID,
      fraccionamiento_id: "fracc-A",
      rol: "COLONO",
      domicilio_id: DOM_A,
      estatus: "ACTIVO",
      nombre: "Colono Uno"
    };
    withContext(actor, {
      users: {
        findById: vi.fn().mockResolvedValue(current),
        countActiveColonists: vi.fn(),
        updateProfile
      },
      // Domicilio destino pertenece a OTRO fraccionamiento.
      households: { findById: vi.fn().mockResolvedValue({ id: DOM_B, fraccionamiento_id: "fracc-B" }) },
      fractionations: { getConfig: vi.fn() }
    });

    await expect(
      updateUser({ id: COLONO_ID, nombre: "Nuevo Nombre", domicilio_id: DOM_B })
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it("respeta el tope de colonos activos por domicilio", async () => {
    const updateProfile = vi.fn();
    const actor = { id: ADMIN_ID, fraccionamiento_id: "fracc-A", rol: "ADMINISTRACION" };
    const current = {
      id: COLONO_ID,
      fraccionamiento_id: "fracc-A",
      rol: "COLONO",
      domicilio_id: DOM_A,
      estatus: "ACTIVO",
      nombre: "Colono Uno"
    };
    withContext(actor, {
      users: {
        findById: vi.fn().mockResolvedValue(current),
        countActiveColonists: vi.fn().mockResolvedValue(2),
        updateProfile
      },
      households: { findById: vi.fn().mockResolvedValue({ id: DOM_B, fraccionamiento_id: "fracc-A" }) },
      fractionations: { getConfig: vi.fn().mockResolvedValue({ max_usuarios_por_domicilio: 2 }) }
    });

    await expect(
      updateUser({ id: COLONO_ID, nombre: "Colono Uno", domicilio_id: DOM_B })
    ).rejects.toBeInstanceOf(AppError);
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it("reasigna el domicilio cuando es del mismo fraccionamiento y hay cupo", async () => {
    const updateProfile = vi.fn().mockResolvedValue({
      id: COLONO_ID,
      fraccionamiento_id: "fracc-A",
      domicilio_id: DOM_B,
      nombre: "Colono Uno"
    });
    const actor = { id: ADMIN_ID, fraccionamiento_id: "fracc-A", rol: "ADMINISTRACION" };
    const current = {
      id: COLONO_ID,
      fraccionamiento_id: "fracc-A",
      rol: "COLONO",
      domicilio_id: DOM_A,
      estatus: "ACTIVO",
      nombre: "Colono Uno"
    };
    withContext(actor, {
      users: {
        findById: vi.fn().mockResolvedValue(current),
        countActiveColonists: vi.fn().mockResolvedValue(1),
        updateProfile
      },
      households: { findById: vi.fn().mockResolvedValue({ id: DOM_B, fraccionamiento_id: "fracc-A" }) },
      fractionations: { getConfig: vi.fn().mockResolvedValue({ max_usuarios_por_domicilio: 2 }) }
    });

    await updateUser({ id: COLONO_ID, nombre: "Colono Uno", domicilio_id: DOM_B });
    expect(updateProfile).toHaveBeenCalledWith(COLONO_ID, { nombre: "Colono Uno", domicilio_id: DOM_B });
  });
});

describe("sendInternalMessage (expansion por grupo)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // listMessageRecipients ya entrega solo usuarios ACTIVOS del fraccionamiento;
  // la expansion por grupo filtra ese conjunto por rol.
  const C1 = "a0000000-0000-4000-8000-000000000001";
  const C2 = "a0000000-0000-4000-8000-000000000002";
  const G1 = "b0000000-0000-4000-8000-000000000001";
  const A1 = "c0000000-0000-4000-8000-000000000001";

  async function sendToGroup(group: string) {
    const createMany = vi.fn((rows: Array<{ recipient_id: string }>) =>
      Promise.resolve(rows.map((row, index) => ({ id: `msg-${index}` })))
    );
    withContext(
      { id: ADMIN_ID, fraccionamiento_id: "fracc-A", rol: "ADMINISTRACION" },
      {
        users: {
          listMessageRecipients: vi.fn().mockResolvedValue([
            { id: C1, rol: "COLONO" },
            { id: C2, rol: "COLONO" },
            { id: G1, rol: "GUARDIA" },
            { id: A1, rol: "ADMINISTRACION" }
          ])
        },
        messages: { createMany }
      }
    );

    await sendInternalMessage({ group, titulo: "Aviso", mensaje: "Mensaje de prueba" });
    const rows = createMany.mock.calls[0][0];
    return rows.map((row) => row.recipient_id);
  }

  it("expande COLONOS solo a colonos", async () => {
    expect(await sendToGroup("COLONOS")).toEqual([C1, C2]);
  });

  it("expande GUARDIAS solo a guardias", async () => {
    expect(await sendToGroup("GUARDIAS")).toEqual([G1]);
  });

  it("expande TODOS a colonos y guardias, excluyendo administracion", async () => {
    expect(await sendToGroup("TODOS")).toEqual([C1, C2, G1]);
  });
});
