import * as React from "react"
import { Tooltip as TooltipPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

function TooltipProvider({ delayDuration = 150, ...props }) {
  return <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />
}

function Tooltip({ ...props }) {
  return <TooltipPrimitive.Root {...props} />
}

function TooltipTrigger({ ...props }) {
  return <TooltipPrimitive.Trigger {...props} />
}

function TooltipContent({
  className,
  side = "top",
  sideOffset = 6,
  children,
  ...props
}) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        side={side}
        sideOffset={sideOffset}
        className={cn(
          "z-50 overflow-hidden rounded-lg bg-gray-900/95 px-2.5 py-1.5 text-xs text-white shadow-lg backdrop-blur-xs select-none animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-1.5 data-[side=left]:slide-in-from-right-1.5 data-[side=right]:slide-in-from-left-1.5 data-[side=top]:slide-in-from-bottom-1.5",
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="fill-gray-900/95" width={8} height={4} />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

/**
 * Convenient wrapper:
 * <SimpleTooltip content="Chỉnh sửa banner" side="top">
 *   <button>...</button>
 * </SimpleTooltip>
 */
function SimpleTooltip({
  content,
  side = "top",
  sideOffset = 6,
  children,
  disabled = false,
  className,
}) {
  if (!content || disabled) return children

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent side={side} sideOffset={sideOffset} className={className}>
        {content}
      </TooltipContent>
    </Tooltip>
  )
}

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  SimpleTooltip,
}
