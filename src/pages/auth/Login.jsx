import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Button } from "components/ui/Button";
import { Card } from "components/ui/Card";
import { Input } from "components/ui/Input";
import { useAuth } from "context/AuthContext";
import { getErrorMessage } from "lib/utils";

const schema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(6, "Enter your password.")
});

export default function Login() {
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, defaultRoute, authError } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  async function onSubmit(values) {
    setSubmitting(true);
    try {
      await login(values);
      navigate(location.state?.from?.pathname || defaultRoute || "/dashboard", {
        replace: true
      });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-slate-950 px-4 py-10">
      <div className="mx-auto grid min-h-[90vh] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden rounded-[2rem] border border-white/10 bg-white/5 p-10 text-white shadow-panel backdrop-blur lg:block">
          <div className="space-y-6">
            <div className="inline-flex rounded-3xl bg-white/10 p-4">
              <Building2 className="h-8 w-8" />
            </div>
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.28em] text-brand-100">
                ThinkAloud Outdoor Media
              </p>
              <h1 className="max-w-xl text-5xl font-semibold leading-tight text-white">
                One dashboard for inventory, contracts, inspections, and client visibility.
              </h1>
              <p className="max-w-xl text-base text-brand-100">
                Designed for field teams, sales, management, and clients with live Supabase data and a mobile-friendly workflow.
              </p>
            </div>
          </div>
        </div>

        <Card className="mx-auto w-full max-w-xl border-white/60 bg-white/95 p-8 backdrop-blur">
          <div className="mb-8 space-y-2">
            <p className="text-sm uppercase tracking-[0.22em] text-brand-700">Welcome back</p>
            <h2 className="text-3xl font-semibold">Sign in to your workspace</h2>
            <p className="text-sm text-slate-500">
              Admins create accounts manually in Settings. Public registration is disabled.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="Email address"
              type="email"
              placeholder="name@thinkaloud.com"
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              error={errors.password?.message}
              {...register("password")}
            />
            {authError ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {authError}
              </div>
            ) : null}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <div className="mt-6 border-t border-slate-200 pt-5 text-center">
            <Link to="/availability" className="text-sm font-semibold text-brand-700 hover:text-brand-900">
              View public billboard availability
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
