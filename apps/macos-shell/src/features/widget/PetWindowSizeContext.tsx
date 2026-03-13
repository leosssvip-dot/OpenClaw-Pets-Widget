/**
 * 桌宠窗口尺寸上下文：菜单打开时请求额外高度，避免右键菜单被裁切。
 */
import { createContext, useContext } from 'react';

export interface PetWindowSizeContextValue {
  setMenuExtraHeight: (height: number | null) => void;
}

const PetWindowSizeContext = createContext<PetWindowSizeContextValue | null>(null);

export function usePetWindowSize() {
  return useContext(PetWindowSizeContext);
}

export function PetWindowSizeProvider({
  children,
  value
}: {
  children: React.ReactNode;
  value: PetWindowSizeContextValue;
}) {
  return (
    <PetWindowSizeContext.Provider value={value}>
      {children}
    </PetWindowSizeContext.Provider>
  );
}
