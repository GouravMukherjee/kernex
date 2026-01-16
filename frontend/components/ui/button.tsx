import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

// Simple Slot replacement
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Slot = React.forwardRef<unknown, any>(({ children, ...props }: any, _ref: unknown) => {
  if (React.isValidElement(children)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return React.cloneElement(children as React.ReactElement<any>, {
      ...props,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      className: cn((children.props as any).className, props.className),
    });
  }
  return children;
});

Slot.displayName = 'Slot';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background-base disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default: 'bg-accent-primary text-white hover:bg-accent-hover shadow-lg shadow-blue-500/25 hover-glow',
        secondary: 'bg-background-elevated text-text-primary border border-border-default hover:bg-background-elevated/80 hover:border-border-hover',
        ghost: 'text-text-primary hover:bg-background-elevated/50',
        outline: 'border border-border-default text-text-primary hover:bg-background-elevated/30 hover:border-border-hover',
        destructive: 'bg-status-error text-white hover:bg-red-600 shadow-lg shadow-red-500/25',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
        'icon-sm': 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={loading || disabled}
        {...props}
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
