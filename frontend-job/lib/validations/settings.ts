import { z } from 'zod';

// Whitelist of allowed setting keys — blocks arbitrary JSON storage
export const ALLOWED_SETTING_KEYS = new Set([
  'autoApplyEnabled',
  'maxConcurrent',
  'notificationsEnabled',
  'telegramEnabled',
  'emailEnabled',
  'minMatchScore',
  'preferredSources',
  'blacklistedCompanies',
  'dailyApplyLimit',
  'applyAutoSubmit',
  'playwrightHeadless',
  'theme',
  'timezone',
]);

// Values are typed by key to prevent unexpected shapes
export const settingsUpdateSchema = z
  .record(z.string(), z.unknown())
  .transform((obj) => {
    const safe: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (ALLOWED_SETTING_KEYS.has(key)) {
        safe[key] = value;
      }
    }
    return safe;
  });
