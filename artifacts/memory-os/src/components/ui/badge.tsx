import * as React from "react"
import { cn } from "@/lib/utils"

const Badge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "glass" }
>(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "border-transparent bg-primary/20 text-primary hover:bg-primary/30",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "border-transparent bg-destructive/20 text-destructive hover:bg-destructive/30",
    outline: "text-foreground",
    success: "border-transparent bg-green-500/20 text-green-400 hover:bg-green-500/30",
    warning: "border-transparent bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30",
    glass: "backdrop-blur-sm bg-white/5 border-white/10 text-foreground",
  }

  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  )
})
Badge.displayName = "Badge"

export { Badge }
