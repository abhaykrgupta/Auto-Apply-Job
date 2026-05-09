import { z } from 'zod';

export const settingsUpdateSchema = z.record(z.string(), z.unknown());
