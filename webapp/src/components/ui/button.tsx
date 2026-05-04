import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-300 font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 disabled:pointer-events-none disabled:opacity-70 active:scale-[0.98] cursor-pointer",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary-dark hover:-translate-y-0.5",
        secondary: "bg-transparent border border-border text-secondary hover:bg-surface-muted hover:text-foreground hover:border-border-strong",
        tertiary: "bg-transparent text-muted hover:text-foreground",
        icon: "bg-surface-muted text-muted rounded-full hover:bg-primary-tint hover:text-primary",
        destructive: "bg-destructive text-white shadow-lg shadow-destructive/20 hover:bg-destructive/90 hover:-translate-y-0.5",
      },
      size: {
        sm: "px-4 py-2 text-[10px] uppercase tracking-widest rounded-full",
        md: "px-6 py-3 text-sm rounded-full",
        lg: "px-8 py-4 text-base rounded-full",
        icon: "w-9 h-9 p-0 flex-shrink-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, icon, iconPosition = "left", asChild, children, ...props }, ref) => {
    // Note: for asChild we would normally use @radix-ui/react-slot, 
    // but since we want to keep it simple and the current asChild implementation 
    // in previous files just wraps the child, we'll keep the logic basic or just 
    // render the button if asChild is false.
    
    // In our case, the user's layout.tsx and others used asChild. 
    // If we want to truly support asChild we should use Slot. 
    // But I'll stick to fixing the immediate issue of iconPosition first.

    const content = (
      <>
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            {icon && iconPosition === "left" && <span className="flex-shrink-0">{icon}</span>}
            {asChild ? (children as any)?.props?.children : children}
            {icon && iconPosition === "right" && <span className="flex-shrink-0">{icon}</span>}
          </>
        )}
      </>
    )

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        className: cn(buttonVariants({ variant, size, className }), (children as any).props.className),
        ref,
        ...props,
      }, content)
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {content}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
