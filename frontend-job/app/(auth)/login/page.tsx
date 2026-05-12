'use client';

import { useState, useTransition, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const schema = z.object({
  email:    z.string().min(1, 'Email address is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
});
type FormValues = z.infer<typeof schema>;

/* ─── Field component — label + input + inline error ─── */
function Field({
  label,
  id,
  error,
  hint,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0">
      <div className="flex items-center justify-between mb-2">
        <label
          htmlFor={id}
          className="text-[11px] font-semibold uppercase tracking-[0.1em] text-foreground/55 select-none"
        >
          {label}
        </label>
        {hint}
      </div>
      {children}
      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            key="err"
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0,  height: 'auto' }}
            exit={{   opacity: 0, y: -4,  height: 0 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="flex items-center gap-1.5 text-[12px] text-destructive font-medium mt-2 overflow-hidden"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Input — big, intentional, with error state ─── */
function AuthInput({
  hasError = false,
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) {
  return (
    <input
      className={`
        w-full h-[52px] rounded-xl px-4 text-[15px] font-normal
        border-2 bg-card
        text-foreground placeholder:text-muted-foreground/35
        outline-none transition-all duration-150
        ${hasError
          ? 'border-destructive/70 bg-destructive/[0.02] focus:border-destructive focus:ring-4 focus:ring-destructive/10'
          : 'border-border/60 focus:border-primary/60 focus:ring-4 focus:ring-primary/8'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    />
  );
}

/* ─── Right branding panel — spacious, editorial ─── */
function RightPanel() {
  return (
    <div className="hidden lg:flex lg:w-[45%] shrink-0 relative overflow-hidden bg-[oklch(0.08_0.014_265)]">
      {/* Two ambient orbs, offset for depth */}
      <div className="absolute top-[-5%] right-[-10%] w-[75%] h-[60%] rounded-full bg-primary/[0.08] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-5%]  w-[55%] h-[45%] rounded-full bg-violet-500/[0.05] blur-[100px] pointer-events-none" />

      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage: 'radial-gradient(circle, oklch(0.8 0 0) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative z-10 flex flex-col h-full px-14 xl:px-16 py-12">
        {/* Logo top */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30">
            <Bot className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <span className="text-[15px] font-bold text-white/90 tracking-tight">Job Agent</span>
            <span className="block text-[10px] text-white/30 uppercase tracking-[0.12em] font-medium">AI Automations</span>
          </div>
        </div>

        {/* Main editorial text — very large, lots of air around it */}
        <div className="flex-1 flex flex-col justify-center py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <h1 className="text-[52px] xl:text-[60px] font-bold leading-[1.06] tracking-[-0.035em] text-white">
              Automate your<br />
              entire job<br />
              <span className="text-primary">search.</span>
            </h1>
            <p className="mt-7 text-[16px] leading-[1.7] text-white/38 max-w-[310px] font-normal">
              Every application tailored to the role.
              Applied while you focus on what matters.
            </p>
          </motion.div>

          {/* Feature list — more breathing room between items */}
          <motion.ul
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-12 space-y-4"
          >
            {[
              'AI resume tailoring per job application',
              'Auto-apply across 8+ major job boards',
              'Real-time application tracker & analytics',
            ].map(item => (
              <li key={item} className="flex items-center gap-3 text-[14px] text-white/40">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/70 shrink-0" />
                {item}
              </li>
            ))}
          </motion.ul>
        </div>

        {/* Bottom rule */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex items-center gap-3"
        >
          <div className="h-px flex-1 bg-white/[0.07]" />
          <span className="text-[11px] text-white/22 tracking-[0.1em] uppercase shrink-0">
            Built for serious job seekers
          </span>
          <div className="h-px flex-1 bg-white/[0.07]" />
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Form ─── */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';

  const [showPassword, setShowPassword]   = useState(false);
  const [isPending, startTransition]       = useTransition();
  const [serverError, setServerError]      = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  function onSubmit(values: FormValues) {
    setServerError('');
    startTransition(async () => {
      const result = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      if (result?.error) {
        setServerError('Incorrect email or password. Please try again.');
      } else {
        toast.success('Signed in');
        router.push(callbackUrl);
        router.refresh();
      }
    });
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Form side — LEFT  55% */}
      <div className="flex-1 lg:flex-none lg:w-[55%] flex flex-col items-center justify-center px-6 py-12 sm:px-12 lg:px-16">
        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-12 lg:hidden self-start">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <Bot className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Job Agent</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="w-full max-w-[400px]"
        >
          {/* Heading */}
          <div className="mb-9">
            <h2 className="text-[26px] font-semibold tracking-tight">Sign in.</h2>
            <p className="mt-1.5 text-[14px] text-foreground/50">Good to have you back.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
            {/* Email */}
            <Field
              label="Email address"
              id="email"
              error={errors.email?.message}
            >
              <AuthInput
                id="email"
                type="email"
                placeholder="you@example.com"
                hasError={!!errors.email}
                autoComplete="email"
                autoFocus
                {...register('email')}
              />
            </Field>

            {/* Password */}
            <Field
              label="Password"
              id="password"
              error={errors.password?.message}
              hint={
                <Link
                  href="#"
                  className="text-[11px] text-foreground/45 hover:text-foreground transition-colors"
                >
                  Forgot password?
                </Link>
              }
            >
              <div className="relative">
                <AuthInput
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your password"
                  hasError={!!errors.password}
                  autoComplete="current-password"
                  className="pr-12"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword
                    ? <EyeOff className="h-[17px] w-[17px]" />
                    : <Eye    className="h-[17px] w-[17px]" />}
                </button>
              </div>
            </Field>

            {/* Server-level error */}
            <AnimatePresence mode="wait">
              {serverError && (
                <motion.div
                  key="srv-err"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{   opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-2 text-[13px] text-destructive bg-destructive/8 border border-destructive/15 rounded-xl px-4 py-3"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {serverError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="
                mt-1 h-[52px] w-full rounded-xl text-[15px] font-semibold
                bg-foreground text-background
                hover:bg-foreground/90 active:scale-[0.985]
                disabled:opacity-55 disabled:cursor-not-allowed
                transition-all duration-150
                flex items-center justify-center gap-2
              "
            >
              {isPending ? (
                <span className="flex items-center gap-2.5">
                  <span className="h-[18px] w-[18px] rounded-full border-2 border-background/25 border-t-background animate-spin" />
                  Signing in…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-[13px] text-muted-foreground/70">
            No account?{' '}
            <Link href="/signup" className="font-semibold text-foreground hover:text-primary transition-colors">
              Create one free
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Vertical separator */}
      <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-border/60 to-transparent shrink-0" />

      {/* Branding panel — RIGHT */}
      <RightPanel />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
