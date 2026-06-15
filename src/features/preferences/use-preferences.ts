"use client";

import { useCallback, useEffect, useState } from "react";

// Preferencias visuales del colono. Se guardan solo en este dispositivo
// (localStorage); no viajan al servidor ni dependen del fraccionamiento.

export type AccentId = "esmeralda" | "azul" | "indigo" | "ambar" | "rosa" | "grafito";
export type FontScaleId = "compacto" | "normal" | "grande";

export type ColonoPreferences = {
  accent: AccentId;
  fontScale: FontScaleId;
};

export const ACCENTS: { id: AccentId; label: string; hsl: string }[] = [
  { id: "esmeralda", label: "Esmeralda", hsl: "174 72% 29%" },
  { id: "azul", label: "Azul", hsl: "221 76% 48%" },
  { id: "indigo", label: "Indigo", hsl: "245 58% 51%" },
  { id: "ambar", label: "Ambar", hsl: "32 90% 46%" },
  { id: "rosa", label: "Rosa", hsl: "335 74% 48%" },
  { id: "grafito", label: "Grafito", hsl: "220 25% 28%" }
];

export const FONT_SCALES: { id: FontScaleId; label: string; value: number }[] = [
  { id: "compacto", label: "Compacto", value: 0.94 },
  { id: "normal", label: "Normal", value: 1 },
  { id: "grande", label: "Grande", value: 1.12 }
];

export const DEFAULT_PREFERENCES: ColonoPreferences = {
  accent: "esmeralda",
  fontScale: "normal"
};

const STORAGE_KEY = "trenova:colono:preferencias";

function isAccent(value: unknown): value is AccentId {
  return ACCENTS.some((accent) => accent.id === value);
}

function isFontScale(value: unknown): value is FontScaleId {
  return FONT_SCALES.some((scale) => scale.id === value);
}

export function readStoredPreferences(): ColonoPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_PREFERENCES;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_PREFERENCES;
    }
    const parsed = JSON.parse(raw) as Partial<ColonoPreferences>;
    return {
      accent: isAccent(parsed.accent) ? parsed.accent : DEFAULT_PREFERENCES.accent,
      fontScale: isFontScale(parsed.fontScale) ? parsed.fontScale : DEFAULT_PREFERENCES.fontScale
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function applyPreferences(preferences: ColonoPreferences) {
  if (typeof document === "undefined") {
    return;
  }

  const accent = ACCENTS.find((item) => item.id === preferences.accent) ?? ACCENTS[0];
  const scale = FONT_SCALES.find((item) => item.id === preferences.fontScale) ?? FONT_SCALES[1];

  const root = document.documentElement;
  root.style.setProperty("--primary", accent.hsl);
  root.style.setProperty("--ring", accent.hsl);
  root.style.fontSize = `${16 * scale.value}px`;
}

export function resetAppliedPreferences() {
  if (typeof document === "undefined") {
    return;
  }
  const root = document.documentElement;
  root.style.removeProperty("--primary");
  root.style.removeProperty("--ring");
  root.style.removeProperty("font-size");
}

// Hook con estado + persistencia. setPreference aplica el cambio al instante
// (vista previa en vivo) y lo guarda automaticamente en el dispositivo.
export function usePreferences() {
  const [preferences, setPreferences] = useState<ColonoPreferences>(DEFAULT_PREFERENCES);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredPreferences();
    setPreferences(stored);
    applyPreferences(stored);
    setHydrated(true);
  }, []);

  const setPreference = useCallback(<K extends keyof ColonoPreferences>(key: K, value: ColonoPreferences[K]) => {
    setPreferences((current) => {
      const next = { ...current, [key]: value };
      applyPreferences(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // localStorage puede no estar disponible (modo privado); el cambio se
        // mantiene en memoria de todos modos.
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    applyPreferences(DEFAULT_PREFERENCES);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignorar
    }
  }, []);

  return { preferences, setPreference, reset, hydrated };
}
