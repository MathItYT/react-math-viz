import React from "react";

// We intentionally avoid importing 'three' types to keep the library runtime-agnostic.
export const ThreeParentContext = React.createContext<any | null>(null);
export const useThreeParent = () => React.useContext(ThreeParentContext);
