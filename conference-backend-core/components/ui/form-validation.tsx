"use client"

import { useState, useEffect } from "react"
import { Input } from "./input"
import { Textarea } from "./textarea"
import { Label } from "./label"
import { Button } from "./button"
import { Alert, AlertDescription } from "./alert"
import { CheckCircle, AlertTriangle, Eye, EyeOff } from "lucide-react"
import { cn } from "@/conference-backend-core/lib/utils"
import { validatePasswordStrength } from "@/conference-backend-core/lib/middleware/security"

interface ValidationResult {
  isValid: boolean
  errors: string[]
}

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  validation?: (value: string) => ValidationResult
  showValidation?: boolean
  required?: boolean
  helperText?: string
}

export function ValidatedInput({
  label,
  validation,
  showValidation = true,
  required = false,
  helperText,
  className,
  ...props
}: ValidatedInputProps) {
  const [value, setValue] = useState(props.value || "")
  const [validationResult, setValidationResult] = useState<ValidationResult>({ isValid: true, errors: [] })
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (validation && (touched || value)) {
      const result = validation(String(value))
      setValidationResult(result)
    }
  }, [value, validation, touched])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    if (props.onChange) {
      props.onChange(e)
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true)
    if (props.onBlur) {
      props.onBlur(e)
    }
  }

  const hasError = touched && !validationResult.isValid && showValidation
  const isValid = touched && validationResult.isValid && showValidation && value

  return (
    <div className="space-y-2">
      <Label htmlFor={props.id} className={cn(required && "after:content-['*'] after:text-red-500 after:ml-1")}>
        {label}
      </Label>
      
      <div className="relative">
        <Input
          {...props}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn(
            className,
            hasError && "border-red-500 focus:border-red-500",
            isValid && "border-green-500 focus:border-green-500"
          )}
        />
        
        {showValidation && touched && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {validationResult.isValid && value ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : hasError ? (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            ) : null}
          </div>
        )}
      </div>

      {helperText && !hasError && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}

      {hasError && (
        <div className="space-y-1">
          {validationResult.errors.map((error, index) => (
            <p key={index} className="text-xs text-red-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {error}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

interface PasswordInputProps extends Omit<ValidatedInputProps, 'type'> {
  showStrengthIndicator?: boolean
}

export function PasswordInput({
  showStrengthIndicator = false,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [value, setValue] = useState(props.value || "")
  const [strengthResult, setStrengthResult] = useState(validatePasswordStrength(""))

  useEffect(() => {
    if (showStrengthIndicator && value) {
      setStrengthResult(validatePasswordStrength(String(value)))
    }
  }, [value, showStrengthIndicator])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    if (props.onChange) {
      props.onChange(e)
    }
  }

  const getStrengthColor = (score: number) => {
    if (score >= 5) return "text-green-600"
    if (score >= 3) return "text-yellow-600"
    return "text-red-600"
  }

  const getStrengthText = (score: number) => {
    if (score >= 5) return "Very Strong"
    if (score >= 4) return "Strong"
    if (score >= 3) return "Medium"
    if (score >= 2) return "Weak"
    return "Very Weak"
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={props.id} className={cn(props.required && "after:content-['*'] after:text-red-500 after:ml-1")}>
        {props.label}
      </Label>
      
      <div className="relative">
        <Input
          {...props}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={handleChange}
          className={cn(props.className, "pr-20")}
        />
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {props.showValidation && (
            <div>
              {/* Validation icon will be shown by ValidatedInput */}
            </div>
          )}
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto p-0 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-500" />
            ) : (
              <Eye className="h-4 w-4 text-gray-500" />
            )}
          </Button>
        </div>
      </div>

      {showStrengthIndicator && value && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  strengthResult.score >= 5 ? "bg-green-500" :
                  strengthResult.score >= 3 ? "bg-yellow-500" : "bg-red-500"
                )}
                style={{ width: `${(strengthResult.score / 6) * 100}%` }}
              />
            </div>
            <span className={cn("text-xs font-medium", getStrengthColor(strengthResult.score))}>
              {getStrengthText(strengthResult.score)}
            </span>
          </div>

          {strengthResult.feedback.length > 0 && (
            <div className="space-y-1">
              {strengthResult.feedback.map((feedback, index) => (
                <p key={index} className="text-xs text-gray-600 dark:text-gray-400">
                  • {feedback}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {props.helperText && (
        <p className="text-xs text-gray-500">{props.helperText}</p>
      )}
    </div>
  )
}

interface ValidatedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  validation?: (value: string) => ValidationResult
  showValidation?: boolean
  required?: boolean
  helperText?: string
  maxLength?: number
}

export function ValidatedTextarea({
  label,
  validation,
  showValidation = true,
  required = false,
  helperText,
  maxLength,
  className,
  ...props
}: ValidatedTextareaProps) {
  const [value, setValue] = useState(props.value || "")
  const [validationResult, setValidationResult] = useState<ValidationResult>({ isValid: true, errors: [] })
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (validation && (touched || value)) {
      const result = validation(String(value))
      setValidationResult(result)
    }
  }, [value, validation, touched])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    if (props.onChange) {
      props.onChange(e)
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setTouched(true)
    if (props.onBlur) {
      props.onBlur(e)
    }
  }

  const hasError = touched && !validationResult.isValid && showValidation
  const isValid = touched && validationResult.isValid && showValidation && value

  return (
    <div className="space-y-2">
      <Label htmlFor={props.id} className={cn(required && "after:content-['*'] after:text-red-500 after:ml-1")}>
        {label}
      </Label>
      
      <div className="relative">
        <Textarea
          {...props}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          maxLength={maxLength}
          className={cn(
            className,
            hasError && "border-red-500 focus:border-red-500",
            isValid && "border-green-500 focus:border-green-500"
          )}
        />
        
        {maxLength && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-500">
            {String(value).length}/{maxLength}
          </div>
        )}
      </div>

      {helperText && !hasError && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}

      {hasError && (
        <div className="space-y-1">
          {validationResult.errors.map((error, index) => (
            <p key={index} className="text-xs text-red-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {error}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}