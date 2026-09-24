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

/** Tab-scoped only — not durable across browser restarts (AGENTS.md). */
const PERSON_STORAGE_KEY = "browseit:currentPersonId";

type PersonContextValue = {
  people: Person[];
  /** Currently chosen name, or null until the picker is used / restored. */
  currentPerson: Person | null;
  setCurrentPerson: (person: Person) => void;
  /** False until sessionStorage has been read (avoids flashing the gate). */
  isReady: boolean;
  /** @deprecated Prefer currentPerson — kept for existing call sites. */
  person: Person | null;
  /** Empty string when nobody is selected. */
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
  /** Server-fetched list from PersonService (AGENTS.md — page.tsx, not client fetch). */
  people: Person[];
  children: ReactNode;
};

/**
 * Current person identity — Context + sessionStorage (AGENTS.md).
 * Not auth: just which name this tab is browsing / publishing as.
 */
export function PersonProvider({ people, children }: PersonProviderProps) {
  // null on server + first client paint — restore from sessionStorage after mount.
  const [personId, setPersonIdState] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = readStoredPersonId();
    if (stored && people.some((p) => p._id === stored)) {
      setPersonIdState(stored);
    } else {
      // Missing or stale id → nobody selected (do NOT fall back to people[0]).
      setPersonIdState(null);
    }
    setIsReady(true);
  }, [people]);

  const setPersonId = useCallback(
    (id: string) => {
      if (!people.some((p) => p._id === id)) return;
      setPersonIdState(id);
      writeStoredPersonId(id);
    },
    [people],
  );

  const setCurrentPerson = useCallback(
    (person: Person) => {
      setPersonId(person._id);
    },
    [setPersonId],
  );

  const currentPerson = useMemo(() => {
    if (!personId) return null;
    return people.find((p) => p._id === personId) ?? null;
  }, [people, personId]);

  const value = useMemo<PersonContextValue>(
    () => ({
      people,
      currentPerson,
      setCurrentPerson,
      isReady,
      person: currentPerson,
      personId: currentPerson?._id ?? "",
      setPersonId,
    }),
    [people, currentPerson, setCurrentPerson, isReady, setPersonId],
  );

  return (
    <PersonContext.Provider value={value}>{children}</PersonContext.Provider>
  );
}

export function usePerson(): PersonContextValue {
  const ctx = useContext(PersonContext);
  if (!ctx) {
    throw new Error("usePerson must be used within PersonProvider");
  }
  return ctx;
}

/** Alias kept for existing imports. */
export const usePersonContext = usePerson;
