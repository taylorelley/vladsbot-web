"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { A2UIChartProps, A2UIChartDataset } from "@/types/a2ui";
import { A2UIComponentWrapper } from "./A2UIComponentWrapper";
import { registerComponent, A2UIRendererProps } from "./A2UIRegistry";

// ============================================================
// Chart.js Lazy Loading
// ============================================================

let ChartJS: typeof import("chart.js").Chart | null = null;
let chartLoaded = false;

async function loadChartJS() {
  if (chartLoaded && ChartJS) return ChartJS;
  
  const chartModule = await import("chart.js");
  const { Chart, registerables } = chartModule;
  Chart.register(...registerables);
  ChartJS = Chart;
  chartLoaded = true;
  return Chart;
}

// ============================================================
// Default Colors
// ============================================================

const defaultColors = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

// ============================================================
// Chart Component
// ============================================================

function Chart({ component, onAction }: A2UIRendererProps) {
  const props = component.props as A2UIChartProps;
  const {
    type = "line",
    data,
    height = 200,
    showLegend = true,
    showGrid = true,
    animate = true,
  } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<InstanceType<typeof import("chart.js").Chart> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initChart = async () => {
      try {
        const Chart = await loadChartJS();
        
        if (!isMounted || !canvasRef.current) return;

        // Destroy existing chart
        if (chartRef.current) {
          chartRef.current.destroy();
        }

        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) return;

        // Prepare datasets with colors
        const datasets = data.datasets.map((dataset, index) => ({
          label: dataset.label,
          data: dataset.data,
          borderColor: dataset.borderColor || dataset.color || defaultColors[index % defaultColors.length],
          backgroundColor: dataset.backgroundColor || 
            (type === "pie" || type === "doughnut" 
              ? defaultColors.slice(0, dataset.data.length)
              : `${dataset.color || defaultColors[index % defaultColors.length]}20`),
          fill: dataset.fill !== undefined ? dataset.fill : (type === "area"),
          tension: type === "line" || type === "area" ? 0.3 : undefined,
        }));

        // Determine chart type
        const chartType = type === "area" ? "line" : type;

        chartRef.current = new Chart(ctx, {
          type: chartType,
          data: {
            labels: data.labels,
            datasets,
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: animate ? {} : false,
            plugins: {
              legend: {
                display: showLegend,
                position: "bottom",
                labels: {
                  color: "rgba(255, 255, 255, 0.7)",
                  padding: 16,
                  usePointStyle: true,
                },
              },
              tooltip: {
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                titleColor: "#fff",
                bodyColor: "rgba(255, 255, 255, 0.8)",
                padding: 12,
                cornerRadius: 8,
              },
            },
            scales: type === "pie" || type === "doughnut" || type === "radar" ? {} : {
              x: {
                grid: {
                  display: showGrid,
                  color: "rgba(255, 255, 255, 0.1)",
                },
                ticks: {
                  color: "rgba(255, 255, 255, 0.5)",
                },
              },
              y: {
                grid: {
                  display: showGrid,
                  color: "rgba(255, 255, 255, 0.1)",
                },
                ticks: {
                  color: "rgba(255, 255, 255, 0.5)",
                },
                beginAtZero: true,
              },
            },
          },
        });

        setIsLoading(false);
      } catch (err) {
        console.error("Chart initialization error:", err);
        setError("Failed to load chart");
        setIsLoading(false);
      }
    };

    initChart();

    return () => {
      isMounted = false;
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [type, data, height, showLegend, showGrid, animate]);

  // Update chart data when props change
  useEffect(() => {
    if (!chartRef.current || isLoading) return;

    const chart = chartRef.current;
    chart.data.labels = data.labels;
    chart.data.datasets.forEach((dataset, index) => {
      if (data.datasets[index]) {
        dataset.data = data.datasets[index].data;
      }
    });
    chart.update(animate ? undefined : "none");
  }, [data, animate, isLoading]);

  return (
    <A2UIComponentWrapper component={component} onAction={onAction}>
      <div className="relative" style={{ height }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading chart...</div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center text-red-500">
            {error}
          </div>
        )}
        <canvas ref={canvasRef} className={cn(isLoading && "opacity-0")} />
      </div>
    </A2UIComponentWrapper>
  );
}

// ============================================================
// Standalone Chart (Mini version for analytics)
// ============================================================

export function MiniChart({
  data,
  type = "line",
  height = 60,
  className,
}: {
  data: number[];
  type?: "line" | "bar";
  height?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<InstanceType<typeof import("chart.js").Chart> | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initChart = async () => {
      const Chart = await loadChartJS();
      if (!isMounted || !canvasRef.current) return;

      if (chartRef.current) {
        chartRef.current.destroy();
      }

      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;

      chartRef.current = new Chart(ctx, {
        type,
        data: {
          labels: data.map((_, i) => i.toString()),
          datasets: [{
            data,
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            fill: true,
            tension: 0.4,
            pointRadius: 0,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
          },
          scales: {
            x: { display: false },
            y: { display: false },
          },
        },
      });
    };

    initChart();

    return () => {
      isMounted = false;
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [data, type]);

  return (
    <div className={cn("relative", className)} style={{ height }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

// ============================================================
// Register Component
// ============================================================

registerComponent("Chart", Chart, "Chart");

export { Chart };
export default Chart;
