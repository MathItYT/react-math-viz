import React from "react";

export type Range = [number, number];

export type Margins = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type PlotContextType = {
  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
  margin: Margins;
  xRange: Range;
  yRange: Range;
  worldToScreen: (x: number, y: number) => { x: number; y: number };
  screenToWorld: (x: number, y: number) => { x: number; y: number };
  htmlOverlay: HTMLDivElement | null;
  clipPathId: string;
  mouse?: { sx: number; sy: number; x: number; y: number; inside: boolean };
};

export const PlotContext = React.createContext<PlotContextType | null>(null);
export const usePlot = () => {
  const ctx = React.useContext(PlotContext);
  if (!ctx) throw new Error("This component must be used inside <Plot2D />");
  return ctx;
};
