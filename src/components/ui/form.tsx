"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  useFormContext,
} from "react-hook-form"
import { cn } from "@/lib/utils" // Ensure this path is correct for your project
import { Label } from "@/components/ui/label" // Ensure this path is correct

// Context for the form
const FormContext = React.createContext<UseFormReturn<FieldValues> | null>(null)

// Main Form component
export const Form = <TFieldValues extends FieldValues = FieldValues>(
  props: React.ComponentProps<typeof FormProvider<TFieldValues>>
) => {
  const methods = useFormContext<TFieldValues>();
  return <FormContext.Provider value={methods} {...props} />;
};


interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends ControllerProps<TFieldValues, TName> {}

export const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(
  props: FormFieldProps<TFieldValues, TName>
) => {
  return (
    <FormContext.Consumer>
      {() => (
        <Controller
          {...props}
        />
      )}
    </FormContext.Consumer>
  )
}

interface FormItemContextValue {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue | null>(
  null
)

export const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

export const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

export const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { formItemId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

export const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-[0.8rem] text-muted-foreground", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

export const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message) : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-[0.8rem] font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export function useFormField() {
  const fieldContext = React.useContext(FormContext)
  const itemContext = React.useContext(FormItemContext)

  const { id } = itemContext || {}

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { name, formState } = fieldContext

  const fieldState = formState.errors[name]
  const fieldId = itemContext?.id || name // Using itemContext.id if available, otherwise name

  return {
    formItemId: `${fieldId}-form-item`,
    formDescriptionId: `${fieldId}-form-item-description`,
    formMessageId: `${fieldId}-form-item-message`,
    ...fieldState,
  }
}
