'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useRecentColors } from '../shared/useRecentColors';

interface ColorContextValue {
  recentColors: string[];
  themeColors: string[];
  addRecentColor: (color: string) => void;
}

const ColorCtx = createContext<ColorContextValue>({
  recentColors: [],
  themeColors: [],
  addRecentColor: () => {},
});

export function useColorContext(): ColorContextValue {
  return useContext(ColorCtx);
}

export function ColorProvider({ themeColors, children }: { themeColors: string[]; children: React.ReactNode }) {
  const { recentColors, addRecentColor } = useRecentColors();

  const value = useMemo(
    () => ({ recentColors, themeColors, addRecentColor }),
    [recentColors, themeColors, addRecentColor],
  );

  return <ColorCtx.Provider value={value}>{children}</ColorCtx.Provider>;
}
