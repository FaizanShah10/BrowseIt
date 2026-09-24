"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Person } from "@/types";

const PERSON_STORAGE_KEY = "browseit:personId";

type PersonContextValue = {
  people: Person[];
  person: Person | null;
  personId: string;
  setPersonId: (id: string) => void;
};

const PersonContext = createContext<PersonContextValue | null>(null);

function readStoredPersonId(): string | null {
  try {
    return window.sessionStorage.getItem(PERSON_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredPersonId(id: string) {
  try {
    window.sessionStorage.setItem(PERSON_STORAGE_KEY, id);
  } catch {
    // Private browsing / blocked storage — ignore.
  }
}

type PersonProviderProps = {
  people: Person[];
  children: ReactNode;
};

/**
 * Current person identity — Context + sessionStorage (AGENTS.md).
 * Not a security boundary; just "which name is browsing."
 */
export function PersonProvider({ people, children }: PersonProviderProps) {
  // Server + first client paint: always people[0] to avoid hydration mismatch.
  const [personId, setPersonIdState] = useState(() => people[0]?._id ?? "");

  useEffect(() => {
    const stored = readStoredPersonId();
    if (stored && people.some((p) => p._id === stored)) {
      setPersonIdState(stored);
      return;
    }
    setPersonIdState((current) => {
      if (people.some((p) => p._id === current)) return current;
      return people[0]?._id ?? "";
    });
  }, [people]);

  const setPersonId = useCallback(
    (id: string) => {
      if (!people.some((p) => p._id === id)) return;
      setPersonIdState(id);
      writeStoredPersonId(id);
    },
    [people],
  );

  const person = useMemo(
    () => people.find((p) => p._id === personId) ?? people[0] ?? null,
    [people, personId],
  );

  const value = useMemo<PersonContextValue>(
    () => ({
      people,
      person,
      personId: person?._id ?? "",
      setPersonId,
    }),
    [people, person, setPersonId],
  );

  return (
    <PersonContext.Provider value={value}>{children}</PersonContext.Provider>
  );
}

export function usePersonContext(): PersonContextValue {
  const ctx = useContext(PersonContext);
  if (!ctx) {
    throw new Error("usePersonContext must be used within PersonProvider");
  }
  return ctx;
}
