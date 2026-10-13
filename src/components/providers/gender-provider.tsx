"use client";

import { createContext, useCallback, useContext, useSyncExternalStore, type ReactNode } from "react";
import type { GenderMode } from "@/types/api";

interface GenderContextValue {
  gender: GenderMode;
  setGender: (gender: GenderMode) => void;
}

const GenderContext = createContext<GenderContextValue | null>(null);
const GENDER_STORAGE_KEY = "hairhub-gender";
const GENDER_CHANGE_EVENT = "hairhub:gender-change";

function subscribeToGender(onStoreChange: () => void) {
  window.addEventListener(GENDER_CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(GENDER_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getGenderSnapshot(): GenderMode {
  const storedGender = window.localStorage.getItem(GENDER_STORAGE_KEY);
  if (storedGender === "female" || storedGender === "all") return storedGender;
  return "male";
}

function getServerGenderSnapshot(): GenderMode {
  return "male";
}

export function GenderProvider({ children }: { children: ReactNode }) {
  const gender = useSyncExternalStore(subscribeToGender, getGenderSnapshot, getServerGenderSnapshot);
  const setGender = useCallback((nextGender: GenderMode) => {
    window.localStorage.setItem(GENDER_STORAGE_KEY, nextGender);
    window.dispatchEvent(new Event(GENDER_CHANGE_EVENT));
  }, []);

  return (
    <GenderContext.Provider value={{ gender, setGender }}>
      {children}
    </GenderContext.Provider>
  );
}

export function useGender() {
  const context = useContext(GenderContext);
  if (!context) throw new Error("useGender must be used within GenderProvider.");
  return context;
}

export function GenderSwitcher() {
  const { gender, setGender } = useGender();

  return (
    <div
      aria-label="Hizmet modunu seçin"
      className="gender-switcher inline-flex h-10 w-[12.5rem] shrink-0 items-center rounded-full border p-1"
      role="group"
    >
      <div className="gender-switcher__track">
        <span
          aria-hidden="true"
          className="gender-switcher__indicator"
          style={{ transform: `translateX(${(["male", "female", "all"] as const).indexOf(gender) * 100}%)` }}
        />
        {([
          ["male", "Erkek"],
          ["female", "Kadın"],
          ["all", "Tümü"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={gender === value}
            onClick={() => setGender(value)}
            className="gender-switcher__option"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
