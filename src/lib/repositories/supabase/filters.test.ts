import { describe, it, expect } from "vitest";
import { createRepositories } from "@/lib/repositories/supabase";

// Cliente Supabase falso y encadenable que registra los filtros aplicados.
function makeSupabase(rows: unknown[] = []) {
  const calls = {
    from: [] as string[],
    eq: [] as Array<[string, unknown]>,
    gte: [] as Array<[string, unknown]>,
    lte: [] as Array<[string, unknown]>,
    limit: [] as number[]
  };
  const builder: Record<string, unknown> = {
    select: () => builder,
    eq: (c: string, v: unknown) => {
      calls.eq.push([c, v]);
      return builder;
    },
    gte: (c: string, v: unknown) => {
      calls.gte.push([c, v]);
      return builder;
    },
    lte: (c: string, v: unknown) => {
      calls.lte.push([c, v]);
      return builder;
    },
    order: () => builder,
    limit: (n: number) => {
      calls.limit.push(n);
      return builder;
    },
    then: (resolve: (value: { data: unknown[]; error: null }) => void) => resolve({ data: rows, error: null })
  };
  const supabase = {
    from: (table: string) => {
      calls.from.push(table);
      return builder;
    }
  };
  return { supabase, calls };
}

function has(pairs: Array<[string, unknown]>, col: string, val: unknown) {
  return pairs.some(([c, v]) => c === col && v === val);
}

type SupabaseArg = Parameters<typeof createRepositories>[0];

describe("InvitationRepository.listByFractionation filtros", () => {
  it("aplica todos los filtros en la query (no en memoria)", async () => {
    const { supabase, calls } = makeSupabase();
    const repos = createRepositories(supabase as unknown as SupabaseArg);

    await repos.invitations.listByFractionation("fracc-1", {
      estatus: "VIGENTE",
      tipo: "VISITA",
      domicilioId: "dom-1",
      desde: "2026-06-01",
      hasta: "2026-06-30"
    });

    expect(calls.from).toContain("invitaciones");
    expect(has(calls.eq, "fraccionamiento_id", "fracc-1")).toBe(true);
    expect(has(calls.eq, "estatus", "VIGENTE")).toBe(true);
    expect(has(calls.eq, "tipo_visita", "VISITA")).toBe(true);
    expect(has(calls.eq, "domicilio_id", "dom-1")).toBe(true);
    expect(has(calls.gte, "created_at", "2026-06-01T00:00:00.000Z")).toBe(true);
    expect(has(calls.lte, "created_at", "2026-06-30T23:59:59.999Z")).toBe(true);
    expect(calls.limit).toContain(300);
  });

  it("sin filtros solo acota por fraccionamiento", async () => {
    const { supabase, calls } = makeSupabase();
    const repos = createRepositories(supabase as unknown as SupabaseArg);

    await repos.invitations.listByFractionation("fracc-1");

    expect(has(calls.eq, "fraccionamiento_id", "fracc-1")).toBe(true);
    expect(calls.eq).toHaveLength(1);
    expect(calls.gte).toHaveLength(0);
    expect(calls.lte).toHaveLength(0);
  });
});

describe("AccessLogRepository.listByFractionation filtros", () => {
  it("aplica resultado, metodo, domicilio, guardia y rango de fecha", async () => {
    const { supabase, calls } = makeSupabase();
    const repos = createRepositories(supabase as unknown as SupabaseArg);

    await repos.accessLogs.listByFractionation("fracc-1", {
      resultado: "PERMITIDO",
      metodo: "QR",
      domicilioId: "dom-1",
      guardiaId: "guardia-1",
      desde: "2026-06-01",
      hasta: "2026-06-30"
    });

    expect(calls.from).toContain("accesos");
    expect(has(calls.eq, "fraccionamiento_id", "fracc-1")).toBe(true);
    expect(has(calls.eq, "resultado", "PERMITIDO")).toBe(true);
    expect(has(calls.eq, "metodo_validacion", "QR")).toBe(true);
    expect(has(calls.eq, "domicilio_id", "dom-1")).toBe(true);
    expect(has(calls.eq, "guardia_id", "guardia-1")).toBe(true);
    expect(has(calls.gte, "arrived_at", "2026-06-01T00:00:00.000Z")).toBe(true);
    expect(has(calls.lte, "arrived_at", "2026-06-30T23:59:59.999Z")).toBe(true);
  });
});
