"use client";

import { useState, useTransition } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { importHouseholdsAction } from "@/server/actions/admin.actions";
import type { ImportResult } from "@/lib/services/admin.service";

type ParsedRow = {
  calle: string;
  numero_exterior: string;
  numero_interior: string;
  referencia: string;
  error: string | null;
};

// Parser CSV simple. Columnas en orden: calle, numero_exterior, numero_interior,
// referencia. Calle/numeros no deben contener comas; la referencia si (toma el resto).
function parseCsv(text: string): ParsedRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return [];
  }

  const startsWithHeader = lines[0].toLowerCase().startsWith("calle");
  const dataLines = startsWithHeader ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const parts = line.split(",");
    const calle = (parts[0] ?? "").trim();
    const numero_exterior = (parts[1] ?? "").trim();
    const numero_interior = (parts[2] ?? "").trim();
    const referencia = parts.slice(3).join(",").trim();

    let error: string | null = null;
    if (calle.length < 2) {
      error = "Calle requerida.";
    } else if (numero_exterior.length < 1) {
      error = "Numero exterior requerido.";
    }

    return { calle, numero_exterior, numero_interior, referencia, error };
  });
}

export function ImportHouseholdsForm() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const validRows = rows.filter((row) => !row.error);

  async function handleFile(file: File) {
    setResult(null);
    setErrorMsg(null);
    const text = await file.text();
    setRows(parseCsv(text));
  }

  function handleImport() {
    setErrorMsg(null);
    setResult(null);
    startTransition(async () => {
      const response = await importHouseholdsAction(
        validRows.map((row) => ({
          calle: row.calle,
          numero_exterior: row.numero_exterior,
          numero_interior: row.numero_interior || undefined,
          referencia: row.referencia || undefined
        }))
      );
      if (response.ok) {
        setResult(response.data ?? { inserted: 0, errors: [] });
        setRows([]);
      } else {
        setErrorMsg(response.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" aria-hidden="true" />
          Importar domicilios (CSV)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Columnas: <code>calle, numero_exterior, numero_interior, referencia</code>. La
          primera fila puede ser encabezado. Maximo 500 filas.
        </p>

        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleFile(file);
            }
          }}
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium"
        />

        {rows.length > 0 ? (
          <div className="space-y-2">
            <div className="max-h-64 overflow-auto rounded-md border">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary/60 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-2 py-1.5">#</th>
                    <th className="px-2 py-1.5">Calle</th>
                    <th className="px-2 py-1.5">Ext.</th>
                    <th className="px-2 py-1.5">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-2 py-1.5 text-muted-foreground">{index + 1}</td>
                      <td className="px-2 py-1.5">{row.calle || "—"}</td>
                      <td className="px-2 py-1.5">{row.numero_exterior || "—"}</td>
                      <td className="px-2 py-1.5">
                        {row.error ? (
                          <span className="text-red-700">{row.error}</span>
                        ) : (
                          <span className="text-emerald-700">Valido</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground">
              {validRows.length} validos · {rows.length - validRows.length} con error
            </p>
            <Button type="button" onClick={handleImport} disabled={pending || validRows.length === 0}>
              {pending ? "Importando..." : `Importar ${validRows.length} domicilios`}
            </Button>
          </div>
        ) : null}

        {errorMsg ? <p className="text-sm text-red-700">{errorMsg}</p> : null}
        {result ? (
          <div className="rounded-md bg-emerald-50 p-2 text-sm text-emerald-800">
            <p>Importados: {result.inserted}.</p>
            {result.errors.length > 0 ? (
              <ul className="mt-1 list-inside list-disc text-red-700">
                {result.errors.slice(0, 10).map((error) => (
                  <li key={error.row}>
                    Fila {error.row}: {error.message}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
