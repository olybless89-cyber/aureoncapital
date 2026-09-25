import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegister } from "@workspace/api-client-react";
import { setToken } from "@/lib/auth";
import { AuthLayout } from "@/components/AuthLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(7, "Enter a valid phone number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegister();
  
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: "", lastName: "", email: "", phone: "", password: "" },
  });

  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    registerMutation.mutate({ data: values }, {
      onSuccess: (res) => {
        if (res.token) {
          setToken(res.token);
          setLocation("/dashboard");
        }
      },
      onError: (err: any) => {
        // This app's fetch client (custom-fetch.ts ApiError) puts the parsed
        // error body on `err.data` and a formatted message on `err.message`
        // directly — there is no axios-style `err.response.data`, so that
        // lookup was always undefined and silently fell through to the
        // generic fallback below regardless of the real failure.
        toast({
          title: "Registration failed",
          description: err?.data?.message || err?.message || "An error occurred. Please try again.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <AuthLayout>
      <div className="mb-10">
        <h1 className="text-3xl font-light tracking-tight mb-2">Apply for Membership</h1>
        <p className="text-muted-foreground">Join the exclusive Aureon Capital ecosystem.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground uppercase text-xs tracking-wider">First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Alex" className="bg-black/20 border-white/10 h-12 rounded-sm focus-visible:ring-primary" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground uppercase text-xs tracking-wider">Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Morgan" className="bg-black/20 border-white/10 h-12 rounded-sm focus-visible:ring-primary" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-muted-foreground uppercase text-xs tracking-wider">Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="+1 234 567 8900" className="bg-black/20 border-white/10 h-12 rounded-sm focus-visible:ring-primary" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-muted-foreground uppercase text-xs tracking-wider">Email Address</FormLabel>
                <FormControl>
                  <Input placeholder="name@example.com" className="bg-black/20 border-white/10 h-12 rounded-sm focus-visible:ring-primary" {...field} />
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
                <FormLabel className="text-muted-foreground uppercase text-xs tracking-wider">Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" className="bg-black/20 border-white/10 h-12 rounded-sm focus-visible:ring-primary" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full h-12 bg-primary hover:bg-primary/90 text-white tracking-[0.1em] font-medium rounded-sm uppercase mt-6 transition-all"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Register Account"}
          </Button>
        </form>
      </Form>

      <div className="mt-8 flex flex-col items-center space-y-4 text-sm text-muted-foreground">
        <div className="flex gap-1">
          <span>Already have an account?</span>
          <Link href="/login" className="text-white hover:text-primary transition-colors underline-offset-4 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
