"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/conference-backend-core/lib/utils"

const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden transition-all duration-200",
  {
    variants: {
      size: {
        xs: "h-6 w-6",
        sm: "h-8 w-8",
        default: "h-10 w-10",
        lg: "h-12 w-12",
        xl: "h-16 w-16",
        "2xl": "h-20 w-20",
        "3xl": "h-24 w-24",
      },
      shape: {
        circle: "rounded-full",
        square: "rounded-xl",
        rounded: "rounded-2xl",
      },
      variant: {
        default: "",
        ring: "ring-2 ring-ocean-200 ring-offset-2 ring-offset-background",
        "ring-primary": "ring-2 ring-ocean-500 ring-offset-2 ring-offset-background",
        "ring-success": "ring-2 ring-emerald-500 ring-offset-2 ring-offset-background",
        "ring-warning": "ring-2 ring-amber-500 ring-offset-2 ring-offset-background",
        "ring-danger": "ring-2 ring-coral-500 ring-offset-2 ring-offset-background",
        glow: "shadow-glow",
        glass: "ring-1 ring-white/20 backdrop-blur-sm",
      },
    },
    defaultVariants: {
      size: "default",
      shape: "circle",
      variant: "default",
    },
  }
)

export interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, size, shape, variant, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(avatarVariants({ size, shape, variant }), className)}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const avatarFallbackVariants = cva(
  "flex h-full w-full items-center justify-center font-semibold text-white",
  {
    variants: {
      variant: {
        default: "gradient-ocean",
        secondary: "bg-midnight-400",
        success: "bg-emerald-500",
        warning: "bg-amber-500",
        danger: "bg-coral-500",
        glass: "glass text-ocean-700 dark:text-white",
      },
      textSize: {
        xs: "text-xs",
        sm: "text-xs",
        default: "text-sm",
        lg: "text-base",
        xl: "text-lg",
        "2xl": "text-xl",
        "3xl": "text-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      textSize: "default",
    },
  }
)

export interface AvatarFallbackProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>,
    VariantProps<typeof avatarFallbackVariants> {}

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  AvatarFallbackProps
>(({ className, variant, textSize, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(avatarFallbackVariants({ variant, textSize }), className)}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

// Enhanced avatar group component
export interface AvatarGroupProps {
  avatars: Array<{
    src?: string
    alt?: string
    fallback: string
  }>
  max?: number
  size?: VariantProps<typeof avatarVariants>["size"]
  className?: string
}

export function AvatarGroup({ 
  avatars, 
  max = 4, 
  size = "default", 
  className 
}: AvatarGroupProps) {
  const displayAvatars = avatars.slice(0, max)
  const remainingCount = Math.max(0, avatars.length - max)

  return (
    <div className={cn("flex -space-x-2", className)}>
      {displayAvatars.map((avatar, index) => (
        <Avatar
          key={index}
          size={size}
          variant="ring"
          className="border-2 border-background"
        >
          <AvatarImage src={avatar.src} alt={avatar.alt} />
          <AvatarFallback textSize={size}>
            {avatar.fallback}
          </AvatarFallback>
        </Avatar>
      ))}
      {remainingCount > 0 && (
        <Avatar
          size={size}
          variant="ring"
          className="border-2 border-background"
        >
          <AvatarFallback variant="secondary" textSize={size}>
            +{remainingCount}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}

export { Avatar, AvatarImage, AvatarFallback, avatarVariants }
