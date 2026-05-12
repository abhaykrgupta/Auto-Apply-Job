'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { signUpAction } from '@/app/actions/auth';

const schema = z
  .object({
    firstName: z.string().min(1, 'First name is required').min(2, 'At least 2 characters'),
    lastName:  z.string().min(1, 'Last name is required').min(2, 'At least 2 characters'),
    email:     z.string().min(1, 'Email address is required').email('Enter a valid email address'),
    password:  z.string().min(1, 'Password is required').min(8, 'Must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine(d => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

/* ─── Field ─── */
function Field({
  label,
  id,
  error,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0">
      <label
        htmlFor={id}
        className="text-[11px] font-semibold uppercase tracking-[0.1em] text-foreground/55 select-none mb-2"
      >
        {label}
      </label>
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

/* ─── Input ─── */
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
          : 'border-border/60 focus:border-foreground/40 focus:ring-4 focus:ring-foreground/[0.06]'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    />
  );
}

/* ─── Password strength bar ─── */
function StrengthBar({ password }: { password: string }) {
  if (!password) return null;

  const rules = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score   = rules.filter(Boolean).length;
  const configs = [
    { color: 'bg-red-500',     text: 'text-red-500',     label: 'Too weak'  },
    { color: 'bg-orange-500',  text: 'text-orange-500',  label: 'Weak'      },
    { color: 'bg-amber-400',   text: 'text-amber-400',   label: 'Fair'      },
    { color: 'bg-emerald-500', text: 'text-emerald-500', label: 'Strong'    },
  ];
  const cfg = configs[score - 1] ?? configs[0];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2.5 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`h-[3px] flex-1 rounded-full transition-all duration-300 ${i <= score ? cfg.color : 'bg-border/40'}`}
          />
        ))}
      </div>
      <span className={`text-[11px] font-semibold ${cfg.text}`}>{cfg.label}</span>
    </motion.div>
  );
}

/* ─── Right branding panel ─── */
function RightPanel() {
  return (
    <div className="hidden lg:flex lg:w-[45%] shrink-0 relative overflow-hidden bg-[oklch(0.08_0.014_265)]">
      <div className="absolute top-[-5%] right-[-10%] w-[70%] h-[55%] rounded-full bg-primary/[0.07] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[5%]  left-[-5%]  w-[50%] h-[40%] rounded-full bg-violet-500/[0.05] blur-[90px]  pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage: 'radial-gradient(circle, oklch(0.8 0 0) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative z-10 flex flex-col h-full px-14 xl:px-16 py-12">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="text-[15px] font-bold text-white/90 tracking-tight">Job Agent</span>
            <span className="block text-[10px] text-white/30 uppercase tracking-[0.12em] font-medium">AI Automations</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <h1 className="text-[52px] xl:text-[60px] font-bold leading-[1.06] tracking-[-0.035em] text-white">
              Your job search<br />
              on<br />
              <span className="text-primary">autopilot.</span>
            </h1>
            <p className="mt-7 text-[16px] leading-[1.7] text-white/38 max-w-[310px] font-normal">
              Set up once. Resume tailored per role,
              applications sent, progress tracked — all automatically.
            </p>
          </motion.div>

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

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex items-center gap-3"
        >
          <div className="h-px flex-1 bg-white/[0.07]" />
          <span className="text-[11px] text-white/22 tracking-[0.1em] uppercase shrink-0">Free to start</span>
          <div className="h-px flex-1 bg-white/[0.07]" />
        </motion.div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPending, startTransition]           = useTransition();
  const [serverError, setServerError]          = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const passwordValue = watch('password', '');

  function onSubmit(values: FormValues) {
    setServerError('');
    startTransition(async () => {
      const fd = new FormData();
      fd.set('firstName', values.firstName);
      fd.set('lastName',  values.lastName);
      fd.set('email',     values.email);
      fd.set('password',  values.password);

      const result = await signUpAction({}, fd);
      if (result.success) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setServerError(result.error ?? 'Something went wrong.');
      }
    });
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Form side — LEFT  55% */}
      <div className="flex-1 lg:flex-none lg:w-[55%] flex flex-col items-center justify-center px-5 py-10 sm:px-10 lg:px-16 overflow-y-auto">
        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-10 lg:hidden self-start">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <Bot className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Job Agent</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="w-full max-w-[440px]"
        >
          <div className="mb-8">
            <h2 className="text-[30px] sm:text-[34px] font-semibold tracking-tight leading-[1.1]">
              Create an account.
            </h2>
            <p className="mt-2 text-[15px] text-foreground/50">Free forever. No credit card.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
            {/* Name row — side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="First name" id="firstName" error={errors.firstName?.message}>
                <AuthInput
                  id="firstName"
                  type="text"
                  placeholder="Jane"
                  hasError={!!errors.firstName}
                  autoComplete="given-name"
                  autoFocus
                  {...register('firstName')}
                />
              </Field>

              <Field label="Last name" id="lastName" error={errors.lastName?.message}>
                <AuthInput
                  id="lastName"
                  type="text"
                  placeholder="Smith"
                  hasError={!!errors.lastName}
                  autoComplete="family-name"
                  {...register('lastName')}
                />
              </Field>
            </div>

            {/* Email */}
            <Field label="Email address" id="email" error={errors.email?.message}>
              <AuthInput
                id="email"
                type="email"
                placeholder="you@example.com"
                hasError={!!errors.email}
                autoComplete="email"
                {...register('email')}
              />
            </Field>

            {/* Password */}
            <Field label="Password" id="password" error={errors.password?.message}>
              <div className="relative">
                <AuthInput
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Choose a strong password"
                  hasError={!!errors.password}
                  autoComplete="new-password"
                  className="pr-12"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                  aria-label={showPassword ? 'Hide' : 'Show'}
                >
                  {showPassword
                    ? <EyeOff className="h-[17px] w-[17px]" />
                    : <Eye    className="h-[17px] w-[17px]" />}
                </button>
              </div>
              <StrengthBar password={passwordValue} />
            </Field>

            {/* Confirm Password */}
            <Field label="Confirm password" id="confirmPassword" error={errors.confirmPassword?.message}>
              <div className="relative">
                <AuthInput
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  hasError={!!errors.confirmPassword}
                  autoComplete="new-password"
                  className="pr-12"
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(v => !v)}
                  tabIndex={-1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                  aria-label={showConfirmPassword ? 'Hide' : 'Show'}
                >
                  {showConfirmPassword
                    ? <EyeOff className="h-[17px] w-[17px]" />
                    : <Eye    className="h-[17px] w-[17px]" />}
                </button>
              </div>
            </Field>

            {/* Server error */}
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

            {/* Submit — black */}
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
                  Creating account…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Get started free
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>

            <p className="text-center text-[12px] text-muted-foreground/60 leading-relaxed">
              By continuing you agree to our{' '}
              <Link href="/terms" className="underline underline-offset-2 text-foreground/60 hover:text-foreground transition-colors">Terms</Link>
              {' '}and{' '}
              <Link href="/privacy" className="underline underline-offset-2 text-foreground/60 hover:text-foreground transition-colors">Privacy Policy</Link>.
            </p>
          </form>

          <p className="mt-7 text-center text-[13px] text-muted-foreground/70">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-foreground hover:text-primary transition-colors">
              Sign in
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
