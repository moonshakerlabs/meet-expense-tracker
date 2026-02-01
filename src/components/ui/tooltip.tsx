import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = ({ children, ...props }: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>) => {
  const [open, setOpen] = React.useState(false);
  return (
    <TooltipPrimitive.Root open={open} onOpenChange={setOpen} {...props}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child) && child.type === TooltipContent) {
          return React.cloneElement(child as React.ReactElement<{ onClose?: () => void }>, {
            onClose: () => setOpen(false),
          });
        }
        return child;
      })}
    </TooltipPrimitive.Root>
  );
};

const TooltipTrigger = TooltipPrimitive.Trigger;

interface TooltipContentProps extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> {
  onClose?: () => void;
  showCloseButton?: boolean;
}

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(({ className, sideOffset = 4, onClose, showCloseButton = true, children, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className,
    )}
    {...props}
  >
    <div className="flex items-start gap-2">
      <div className="flex-1">{children}</div>
      {showCloseButton && onClose && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="shrink-0 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Close tooltip"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  </TooltipPrimitive.Content>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
