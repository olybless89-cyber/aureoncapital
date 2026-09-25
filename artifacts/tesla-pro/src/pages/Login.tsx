import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin } from "@workspace/api-client-react";
import { setToken } from "@/lib/auth";
import { AuthLayout } from "@/components/AuthLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data: values }, {
      onSuccess: (res) => {
        if (res.token) {
          setToken(res.token);
          if (res.user?.mustChangePassword) {
            setLocation("/change-password");
          } else {
            setLocation("/dashboard");
          }
        }
      },
      onError: (err: any) => {
        toast({
          title: "Login failed",
          description: err?.data?.message || err?.message || "Invalid credentials. Please try again.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <AuthLayout>
      <div className="mb-10">
        <h1 className="text-3xl font-light tracking-tight mb-2">Welcome Back</h1>
        <p className="text-muted-foreground">Sign in to your Aureon Capital account.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-muted-foreground uppercase text-xs tracking-wider">Email Address</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="name@example.com" 
                    className="bg-black/20 border-white/10 h-12 rounded-sm focus-visible:ring-primary" 
                    {...field} 
                  />
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
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="bg-black/20 border-white/10 h-12 rounded-sm focus-visible:ring-primary" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full h-12 bg-primary hover:bg-primary/90 text-white tracking-[0.1em] font-medium rounded-sm uppercase mt-4 transition-all"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
          </Button>
        </form>
      </Form>

      <div className="mt-8 flex items-center justify-between">
        <div className="h-px bg-border flex-1" />
        <span className="px-4 text-xs text-muted-foreground uppercase tracking-widest">Or continue with</span>
        <div className="h-px bg-border flex-1" />
      </div>

      <div className="grid grid-cols-2 gap-4 mt-8">
        <Button variant="outline" className="h-12 border-white/10 hover:bg-white/5 rounded-sm">
          Apple
        </Button>
        <Button variant="outline" className="h-12 border-white/10 hover:bg-white/5 rounded-sm">
          Google
        </Button>
      </div>

      <div className="mt-12 flex flex-col items-center space-y-4 text-sm text-muted-foreground">
        <div className="flex gap-1">
          <span>Not a member?</span>
          <Link href="/register" className="text-white hover:text-primary transition-colors underline-offset-4 hover:underline">
            Apply for membership
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
