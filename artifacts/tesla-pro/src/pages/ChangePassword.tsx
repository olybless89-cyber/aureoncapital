import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AuthLayout } from "@/components/AuthLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getToken } from "@/lib/auth";
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

const schema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirm: z.string(),
}).refine(d => d.newPassword === d.confirm, {
  message: "Passwords do not match",
  path: ["confirm"],
});

export default function ChangePasswordPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: "", confirm: "" },
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ newPassword: values.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? data.error ?? "Failed");
      toast({ title: "Password updated", description: "You're now signed in." });
      setLocation("/dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="text-xs text-primary uppercase tracking-widest font-medium">Security Required</span>
        </div>
        <h1 className="text-3xl font-light tracking-tight mb-2">Set Your Password</h1>
        <p className="text-muted-foreground">
          This is your first login. Please set a secure password before continuing.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-muted-foreground uppercase text-xs tracking-wider">New Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Minimum 8 characters"
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
            name="confirm"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-muted-foreground uppercase text-xs tracking-wider">Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Repeat your password"
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
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Set Password & Continue"}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
