import React from "react";

export type ThreeContextType = {
  THREE: any | null;
  scene: any | null;
  camera: any | null;
  renderer: any | null;
  htmlOverlay?: HTMLDivElement | null;
};

export const ThreeContext = React.createContext<ThreeContextType>({
  THREE: null,
  scene: null,
  camera: null,
  renderer: null,
  htmlOverlay: null,
});

export const useThree = () => React.useContext(ThreeContext);
