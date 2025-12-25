"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

// Format: { THEME_NAME: { LIGHT: "hsl(var(--theme-light))", DARK: "hsl(var(--theme-dark))" } }
const THEMES = {
  "zinc": {
    "light": "hsl(240 5.9% 10%)",
    "dark": "hsl(0 0% 98%)",
  },
} as const

export type ChartTheme = keyof typeof THEMES

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
    color?: string
    theme?: Record<keyof typeof THEMES, string>
  }
}

export const ChartContext = React.createContext<{
  config: ChartConfig | null
  theme: ChartTheme
  dir?: "ltr" | "rtl"
} | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    config: ChartConfig
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"]
    theme?: ChartTheme
    dir?: "ltr" | "rtl"
  }
>(({ id, className, children, config, theme = "zinc", dir, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config, theme, dir }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border [&_.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted",
          className
        )}
        style={
          {
            "--theme-light": THEMES[theme].light,
            "--theme-dark": THEMES[theme].dark,
          } as React.CSSProperties
        }
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "Chart"

const ChartTooltip = RechartsPrimitive.Tooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
  React.ComponentProps<"div"> & {
    hideLabel?: boolean
    hideIndicator?: boolean
    indicator?: "line" | "dot" | "dashed"
    nameKey?: string
    labelKey?: string
  }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config, theme } = useChart()

    const formattedLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const item = payload[0]
      const key = `${labelKey || item.dataKey || "value"}`
      const itemLabel =
        !labelKey && typeof item.payload === "object" && item.payload
          ? item.payload[key as keyof typeof item.payload]
          : item.name

      if (label) {
        return label
      }

      if (labelFormatter) {
        return labelFormatter(itemLabel, payload)
      }

      return itemLabel
    }, [label, labelFormatter, payload, hideLabel, labelKey])

    if (!active || !payload?.length) {
      return null
    }

    const nestLabel = payload.length === 1 && indicator !== "dot"

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {!nestLabel && !hideLabel ? (
          <div className={cn("grid gap-1.5", labelClassName)}>
            <span className="font-semibold text-muted-foreground">
              {formattedLabel}
            </span>
            <hr className="-mx-2.5" />
          </div>
        ) : null}
        <div
          className={cn(
            "grid gap-1.5",
            nestLabel && "grid-cols-2 gap-x-4",
            className
          )}
        >
          {payload.map((item, index) => {
            const key = `${nameKey || item.name || "value"}`
            const itemConfig = config?.[key] || {}
            const itemColor = color || item.color || itemConfig.color || "hsl(var(--foreground))"
            const indicatorColor =
              theme && itemColor in THEMES[theme]
                ? THEMES[theme][itemColor as keyof typeof THEMES[typeof theme]]
                : itemColor

            return (
              <div
                key={item.dataKey || index}
                className={cn(
                  "grid grid-cols-2 items-center gap-x-2 gap-y-1 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center",
                  indicator === "line" && "items-center",
                  nestLabel && "items-start"
                )}
              >
                {formatter && item.value && item.name ? (
                  formatter(item.value, item.name, item, index, payload)
                ) : (
                  <>
                    {!hideIndicator ? (
                      <div
                        className={cn(
                          "flex w-max items-center gap-2",
                          indicator === "line" && "w-full",
                          nestLabel && "flex-col items-start gap-0"
                        )}
                      >
                        {indicator === "dot" ? (
                          <div
                            className="h-2.5 w-2.5 shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]"
                            style={
                              {
                                "--color-bg": indicatorColor,
                                "--color-border": indicatorColor,
                              } as React.CSSProperties
                            }
                          />
                        ) : indicator === "line" ? (
                          <div
                            className="h-8 w-px shrink-0 bg-background"
                            style={
                              {
                                "--color-bg": indicatorColor,
                              } as React.CSSProperties
                            }
                          />
                        ) : indicator === "dashed" ? (
                          <div
                            className="w-8 border-t-2 border-dashed border-muted-foreground"
                            style={
                              {
                                "--color-border": indicatorColor,
                              } as React.CSSProperties
                            }
                          />
                        ) : null}
                        <div
                          className={cn(
                            "flex items-baseline gap-1",
                            nestLabel ? "flex-col" : "flex-row"
                          )}
                        >
                          <span className="font-semibold capitalize text-foreground">
                            {itemConfig.label || item.name}
                          </span>
                          {nestLabel ? (
                            <span className="text-xs text-muted-foreground">
                              {formattedLabel}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                    <span
                      className={cn(
                        "w-full text-right font-mono font-semibold tabular-nums text-foreground",
                        nestLabel && "text-left"
                      )}
                    >
                      {item.value?.toString()}
                    </span>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltipContent"

const ChartLegend = RechartsPrimitive.Legend

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
  Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
    hideIcon?: boolean
    nameKey?: string
  }
>(
  (
    { className, hideIcon = false, payload, verticalAlign = "bottom", nameKey },
    ref
  ) => {
    const { config, theme } = useChart()

    if (!payload || !payload.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          verticalAlign === "top" ? "pb-4" : "pt-4",
          className
        )}
      >
        {payload.map((item) => {
          const key = `${nameKey || item.value || "value"}`
          const itemConfig = config?.[key] || {}
          const itemColor =
            item.color || itemConfig.color || "hsl(var(--foreground))"
          const indicatorColor =
            theme && itemColor in THEMES[theme]
              ? THEMES[theme][itemColor as keyof typeof THEMES[typeof theme]]
              : itemColor

          return (
            <div
              key={key}
              className={cn(
                "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
              )}
            >
              {!hideIcon ? (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]"
                  style={
                    {
                      "--color-bg": indicatorColor,
                      "--color-border": indicatorColor,
                    } as React.CSSProperties
                  }
                />
              ) : null}
              {itemConfig.label || item.value}
            </div>
          )
        })}
      </div>
    )
  }
)
ChartLegendContent.displayName = "ChartLegendContent"

const ChartStyle = ({
  id,
  config,
}: {
  id: string
  config: ChartConfig
}) => {
  const { theme } = useChart()
  const styles = React.useMemo(() => {
    return Object.entries(config).map(([key, value]) => {
      const color = value.theme?.[theme] || value.color
      if (!color) return null

      return `
[data-chart=${id}] .recharts-bar-rectangle[name="${key}"],
[data-chart=${id}] .recharts-line-curve[name="${key}"],
[data-chart=${id}] .recharts-area-path[name="${key}"] {
  fill: ${color};
  stroke: ${color};
}
[data-chart=${id}] .recharts-dot[name="${key}"] {
  fill: ${color};
}
[data-chart=${id}] .recharts-legend-item[payload-value="${key}"] .recharts-legend-icon {
  background: ${color} !important;
}
`
    }).filter(Boolean)
  }, [id, config, theme])

  return <style>{styles.join("\n")}</style>
}

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartStyle }