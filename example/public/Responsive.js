import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
function useContainerWidth() {
    const ref = React.useRef(null);
    const [width, setWidth] = React.useState(0);
    React.useEffect(() => {
        const el = ref.current;
        if (!el)
            return;
        const ro = new ResizeObserver(entries => {
            for (const entry of entries) {
                const w = entry.contentRect.width;
                if (w !== width)
                    setWidth(w);
            }
        });
        ro.observe(el);
        setWidth(el.clientWidth);
        return () => ro.disconnect();
    }, []);
    return { ref, width };
}
export function AutoPlot2D(props) {
    const { aspect = 0.714, className, style, children, ...rest } = props;
    const { ref, width } = useContainerWidth();
    const h = Math.max(1, Math.round(width * aspect));
    return (_jsxs("div", { ref: ref, className: className, style: { width: '100%', ...style }, children: [width > 0 ? React.createElement(rest.component || window.Plot2D || {}, {}) : null, width > 0 ? (_jsx(rest.PlotComponent, { width: width, height: h, ...rest, children: children })) : null] }));
}
export function AutoSizer({ aspect = 0.75, className, style, children }) {
    const { ref, width } = useContainerWidth();
    const h = Math.max(1, Math.round(width * aspect));
    return (_jsx("div", { ref: ref, className: className, style: { width: '100%', ...style }, children: width > 0 ? children(width, h) : null }));
}
