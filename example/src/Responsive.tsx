import React from 'react';

function useContainerWidth<T extends HTMLElement>() {
  const ref = React.useRef<T | null>(null);
  const [width, setWidth] = React.useState(0);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w !== width) setWidth(w);
      }
    });
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  return { ref, width } as const;
}

export function AutoPlot2D(props: any) {
  const { aspect = 0.714, className, style, children, ...rest } = props;
  const { ref, width } = useContainerWidth<HTMLDivElement>();
  const h = Math.max(1, Math.round(width * aspect));
  return (
    <div ref={ref} className={className} style={{ width: '100%', ...style }}>
      {width > 0 ? React.createElement((rest as any).component || (window as any).Plot2D || ({} as any), {}) : null}
      {/* We can't dynamically resolve Plot2D from window safely; instead render directly using import */}
      {width > 0 ? (
        <rest.PlotComponent width={width} height={h} {...rest}>{children}</rest.PlotComponent>
      ) : null}
    </div>
  );
}

export function AutoSizer({ aspect = 0.75, className, style, children }: { aspect?: number; className?: string; style?: React.CSSProperties; children: (w:number,h:number)=>React.ReactNode }) {
  const { ref, width } = useContainerWidth<HTMLDivElement>();
  const h = Math.max(1, Math.round(width * aspect));
  return (
    <div ref={ref} className={className} style={{ width: '100%', ...style }}>
      {width > 0 ? children(width, h) : null}
    </div>
  );
}
