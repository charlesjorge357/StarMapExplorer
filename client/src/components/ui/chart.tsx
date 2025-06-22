// Chart component completely disabled to prevent runtime errors
export const ChartContainer = ({ children, ...props }: any) => null;
export const ChartTooltip = ({ children, ...props }: any) => null;
export const ChartTooltipContent = ({ children, ...props }: any) => null;
export const ChartLegend = ({ children, ...props }: any) => null;
export const ChartLegendContent = ({ children, ...props }: any) => null;
export const ChartStyle = ({ children, ...props }: any) => null;
export const useChart = () => ({ config: {} });

// Disable all recharts exports to prevent import errors
export const Area = () => null;
export const AreaChart = () => null;
export const Bar = () => null;
export const BarChart = () => null;
export const Line = () => null;
export const LineChart = () => null;
export const Pie = () => null;
export const PieChart = () => null;
export const ResponsiveContainer = ({ children }: any) => children;