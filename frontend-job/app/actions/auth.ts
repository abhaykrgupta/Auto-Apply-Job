'use server';

import { db } from '@/lib/db';
import { authUsers, profile } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { signIn, signOut } from '@/lib/auth';
import { z } from 'zod';
import { AuthError } from 'next-auth';

const signupSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName:  z.string().min(2, 'Last name must be at least 2 characters'),
  email:     z.string().email('Invalid email address'),
  password:  z.string().min(8, 'Password must be at least 8 characters'),
});

export type AuthState = {
  error?: string;
  success?: boolean;
};

export async function signUpAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName:  formData.get('lastName'),
    email:     formData.get('email'),
    password:  formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Validation failed' };
  }

  const { firstName, lastName, email, password } = parsed.data;
  const name = `${firstName} ${lastName}`.trim();

  const [existing] = await db
    .select({ id: authUsers.id })
    .from(authUsers)
    .where(eq(authUsers.email, email))
    .limit(1);

  if (existing) {
    return { error: 'An account with this email already exists.' };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const [newUser] = await db
    .insert(authUsers)
    .values({ name, email, password: hashedPassword, plan: 'free' })
    .returning({ id: authUsers.id });

  // Create linked profile record
  await db.insert(profile).values({
    userId: newUser.id,
    name,
    email,
  });

  try {
    await signIn('credentials', { email, password, redirect: false });
    return { success: true };
  } catch {
    return { error: 'Account created. Please sign in.' };
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: '/login' });
}
