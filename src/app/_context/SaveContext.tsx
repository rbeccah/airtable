"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type SaveContextType = {
  triggerSave: () => void;
  setSaveHandler: (handler: () => void) => void;
};

const SaveContext = createContext<SaveContextType | undefined>(undefined);

export const SaveProvider = ({ children }: { children: ReactNode }) => {
  const [saveHandler, setSaveHandler] = useState<(() => void) | null>(null);

  const triggerSave = () => {
    if (saveHandler !== null) {
      saveHandler();
    } else {
      console.warn("No save handler set");
    }
  };

  return (
    <SaveContext.Provider value={{ triggerSave, setSaveHandler }}>
      {children}
    </SaveContext.Provider>
  );
};

export const useSave = () => {
  const context = useContext(SaveContext);
  if (!context) {
    throw new Error("useSave must be used within a SaveProvider");
  }
  return context;
};