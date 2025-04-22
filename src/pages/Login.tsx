
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Icons } from "@/components/icons";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { usePageTransition } from "@/hooks/usePageTransition";

const FormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
});

type LoginFormValues = z.infer<typeof FormSchema>;

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const { transitionClass, isTransitioning } = usePageTransition();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { mutate: signIn } = useMutation({
    mutationFn: async (values: LoginFormValues) => {
      setIsLoading(true);
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });
        
        if (error) {
          throw error;
        }
        
        return { success: true };
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      toast({
        title: "Login successful!",
        description: "You have successfully logged in.",
      });
      navigate("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed.",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: LoginFormValues) {
    signIn(values);
  }

  return (
    <div className="grid h-screen w-screen place-items-center">
      <div className={`container flex w-full max-w-md flex-col items-center justify-center space-y-4 ${transitionClass}`}>
        <div className="flex flex-col items-center space-y-2 text-center">
          <Icons.logo className="h-9 w-9" />
          <h1 className="text-2xl font-semibold">Welcome back.</h1>
          <p className="text-muted-foreground text-sm">
            Enter your email and password to login
          </p>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex w-full flex-col space-y-4"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="mail@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="terms" />
                <Label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Remember me
                </Label>
              </div>
              <Link
                to="/change-password"
                className="text-sm text-blue-500 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Button disabled={isLoading}>
              {isLoading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </Form>
        <div className="relative w-full">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        <Button variant="outline" disabled={isLoading}>
          {isLoading ? (
            <>
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              Please wait
            </>
          ) : (
            <>
              <svg 
                className="mr-2 h-4 w-4" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M1 12C1 5.925 5.925 1 12 1s11 4.925 11 11-4.925 11-11 11S1 18.075 1 12Z" />
                <path d="M12 7v10M7 12h10" />
              </svg>
              Google
            </>
          )}
        </Button>
        <p className="px-8 text-center text-sm text-muted-foreground">
          By continuing, you are setting up a Senso account and agree to our{" "}
          <Link to="/terms-privacy" className="underline underline-offset-4 hover:text-primary">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/terms-privacy" className="underline underline-offset-4 hover:text-primary">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

export default Login;
