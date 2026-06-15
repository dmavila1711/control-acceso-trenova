"use client";

import { useEffect } from "react";
import { applyPreferences, readStoredPreferences, resetAppliedPreferences } from "./use-preferences";

// Aplica las preferencias guardadas a toda la seccion del colono apenas carga,
// para que el color y el tamano elegidos se vean en cada pantalla. Limpia los
// estilos al desmontar para no contaminar otras secciones del navegador.
export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyPreferences(readStoredPreferences());
    return () => {
      resetAppliedPreferences();
    };
  }, []);

  return <>{children}</>;
}
