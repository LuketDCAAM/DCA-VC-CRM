import React from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** A compact, keyboard-accessible name that opens the existing record details. */
export const NameDetailsButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, onClick, ...props }, ref) => (
    <Button
      ref={ref}
      type="button"
      variant="link"
      className={cn('h-auto min-w-0 max-w-full justify-start rounded-sm p-0 text-left font-inherit text-foreground hover:text-primary', className)}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.(event);
      }}
      {...props}
    />
  ),
);
NameDetailsButton.displayName = 'NameDetailsButton';