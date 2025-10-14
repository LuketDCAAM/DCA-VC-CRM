// Unified chart configuration for consistent styling across all dashboard charts

// Unified color palette using theme-aware colors
export const CHART_COLORS = {
  primary: [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ],
  extended: [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(350 80% 58%)',  // Extended pink
    'hsl(270 70% 62%)',  // Extended purple
    'hsl(300 75% 58%)',  // Extended magenta
    'hsl(250 65% 60%)',  // Extended indigo
    'hsl(330 75% 60%)',  // Extended rose
  ]
};

// Unified typography settings
export const CHART_TYPOGRAPHY = {
  title: {
    fontSize: 18,
    fontWeight: 600,
  },
  description: {
    fontSize: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: 500,
  },
  tooltip: {
    fontSize: 14,
    fontWeight: 500,
  },
  legend: {
    fontSize: 12,
  },
  axisLabel: {
    fontSize: 11,
  }
};

// Unified chart dimensions
export const CHART_DIMENSIONS = {
  pieOuterRadius: 80,
  pieInnerRadius: 0,
  donutInnerRadius: 40,
  strokeWidth: 2,
  minHeight: 300,
  maxHeight: 400,
};

// Unified spacing
export const CHART_SPACING = {
  cardPadding: 'pb-0',
  contentPadding: 'pb-0',
  legendGap: 2,
};

// Get color by index
export function getChartColor(index: number, extended = false): string {
  const palette = extended ? CHART_COLORS.extended : CHART_COLORS.primary;
  return palette[index % palette.length];
}

// Common chart config structure
export function createChartConfig(items: string[]) {
  return items.reduce((config, item, index) => {
    config[item] = {
      label: item,
      color: getChartColor(index, items.length > 5),
    };
    return config;
  }, {} as Record<string, { label: string; color: string }>);
}
