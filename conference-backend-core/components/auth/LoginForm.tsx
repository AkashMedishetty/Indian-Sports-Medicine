"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/conference-backend-core/components/ui/button";
import { Input } from "@/conference-backend-core/components/ui/input";
import { Label } from "@/conference-backend-core/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/conference-backend-core/components/ui/card";
import { Alert, AlertDescription } from "@/conference-backend-core/components/ui/alert";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/conference-backend-core/hooks/use-toast";
import { conferenceConfig } from "@/conference-backend-core/config/conference.config"


interface LoginFormProps {
  callbackUrl?: string;
}

export function LoginForm({ callbackUrl = "/dashboard" }: LoginFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");

        // Simple error logging
        console.error('Login failed:', result.error);

        toast({
          title: "Login Failed",
          description: "Invalid email or password. Please try again.",
          variant: "destructive",
        });
      } else {
        // Simple success logging
        console.log('Login successful');

        toast({
          title: "Login Successful",
          description: "Welcome back! Redirecting to your dashboard...",
        });

        // Wait for session to be confirmed before redirecting
        const checkSessionAndRedirect = async () => {
          let attempts = 0;
          const maxAttempts = 10;
          
          const checkSession = async () => {
            try {
              const response = await fetch('/api/auth/session', {
                cache: 'no-store',
                credentials: 'same-origin'
              });
              const session = await response.json();
              
              console.log('Session check attempt:', attempts, 'Session:', session);
              
              if (session && session.user) {
                // Session confirmed, determine redirect based on role
                const userRole = session.user.role;
                let redirectUrl = callbackUrl;
                
                // Role-based redirect
                if (userRole === 'reviewer') {
                  redirectUrl = '/reviewer';
                } else if (userRole === 'admin') {
                  redirectUrl = '/admin';
                } else if (userRole === 'sponsor') {
                  redirectUrl = '/sponsor/dashboard';
                } else {
                  redirectUrl = '/dashboard';
                }
                
                console.log('Session confirmed, redirecting to:', redirectUrl, 'Role:', userRole);
                window.location.href = redirectUrl;
                return true;
              }
              return false;
            } catch (error) {
              console.error('Session check error:', error);
              return false;
            }
          };
          
          // Poll for session confirmation
          const pollSession = async () => {
            attempts++;
            const sessionExists = await checkSession();
            
            if (sessionExists) {
              return; // Success, redirect happened
            }
            
            if (attempts < maxAttempts) {
              setTimeout(pollSession, 300); // Check every 300ms
            } else {
              // Fallback: force redirect anyway after 3 seconds
              console.warn('Session confirmation timeout, forcing redirect');
              window.location.href = callbackUrl;
            }
          };
          
          // Give the browser a brief moment to persist cookies on some mobile browsers
          setTimeout(pollSession, 400);
        };
        
        checkSessionAndRedirect();
      }
    } catch (error) {
      setError("An unexpected error occurred");
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
        {error && (
          <Alert variant="destructive">
            <AlertDescription aria-live="assertive">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-bold text-gray-700">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="pl-10 h-12 bg-white/70 border-gray-200 focus:border-pink-400 focus:ring-pink-400"
              disabled={isLoading}
              required
              autoComplete="username"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-bold text-gray-700">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className="pl-10 pr-10 h-12 bg-white/70 border-gray-200 focus:border-pink-400 focus:ring-pink-400"
              disabled={isLoading}
              required
              autoComplete="current-password"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword((x) => !x)}
              disabled={isLoading}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-500" />
              ) : (
                <Eye className="h-4 w-4 text-gray-500" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <Link
            href="/auth/forgot-password"
            className="text-sm font-semibold text-pink-600 hover:text-pink-700"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full h-12 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold rounded-xl shadow-lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>
    </motion.div>
  );
}
