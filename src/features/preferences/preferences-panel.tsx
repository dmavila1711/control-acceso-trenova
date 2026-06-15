"use client";

import { Check, Palette, RotateCcw, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ACCENTS, FONT_SCALES, usePreferences } from "./use-preferences";

export function PreferencesPanel() {
  const { preferences, setPreference, reset, hydrated } = usePreferences();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Personalizar mi portal</h2>
        <p className="text-sm text-muted-foreground">
          Ajusta el color y el tamano del texto. Se guarda automaticamente en este dispositivo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" aria-hidden="true" />
            Color principal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Color principal">
            {ACCENTS.map((accent) => {
              const selected = preferences.accent === accent.id;
              return (
                <button
                  key={accent.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setPreference("accent", accent.id)}
                  className="flex flex-col items-center gap-1.5 rounded-lg border p-2 transition hover:bg-secondary/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: `hsl(${accent.hsl})`,
                      // Anillo de seleccion solo en la opcion activa.
                      boxShadow: selected
                        ? `0 0 0 2px hsl(var(--card)), 0 0 0 4px hsl(${accent.hsl})`
                        : "none"
                    }}
                  >
                    {selected ? <Check className="h-5 w-5 text-white" aria-hidden="true" /> : null}
                  </span>
                  <span className="text-xs font-medium">{accent.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5 text-primary" aria-hidden="true" />
            Tamano del texto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="inline-flex rounded-lg border p-1" role="radiogroup" aria-label="Tamano del texto">
            {FONT_SCALES.map((scale) => {
              const selected = preferences.fontScale === scale.id;
              return (
                <button
                  key={scale.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setPreference("fontScale", scale.id)}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    selected ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary/60"
                  }`}
                >
                  {scale.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vista previa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Asi se veran los botones y enlaces de tu portal.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button">Crear invitacion</Button>
            <Button type="button" variant="secondary">
              Mis invitaciones
            </Button>
            <span className="font-medium text-primary">Texto destacado</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          {hydrated ? "Cambios guardados en este dispositivo." : "Cargando preferencias..."}
        </p>
        <Button type="button" variant="secondary" size="sm" onClick={reset}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Restablecer
        </Button>
      </div>
    </div>
  );
}
