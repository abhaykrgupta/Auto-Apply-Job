import { type Page } from 'playwright';

export type FormType = 'easy_apply' | 'standard_form' | 'complex' | 'unknown';

export async function detectFormType(page: Page): Promise<FormType> {
  // Check for Easy Apply
  const easyApply = await page.$('[aria-label*="Easy Apply"], .easy-apply-button');
  if (easyApply) return 'easy_apply';

  // Check for standard form
  const standardForm = await page.$('form[action*="apply"], form[id*="apply"]');
  if (standardForm) return 'standard_form';

  // Check for multi-step indicators via DOM (no AI needed)
  const multiStep = await page.$('[data-step], [aria-label*="step"], .stepper, .wizard, [class*="multi-step"]');
  if (multiStep) return 'complex';

  return 'unknown';
}
