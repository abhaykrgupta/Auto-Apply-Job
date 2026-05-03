import { type Page } from 'playwright';
import { openai } from '@/lib/openai/client';

export type FormType = 'easy_apply' | 'standard_form' | 'complex' | 'unknown';

export async function detectFormType(page: Page): Promise<FormType> {
  // Check for Easy Apply
  const easyApply = await page.$('[aria-label*="Easy Apply"], .easy-apply-button');
  if (easyApply) return 'easy_apply';

  // Check for standard form
  const standardForm = await page.$('form[action*="apply"], form[id*="apply"]');
  if (standardForm) return 'standard_form';

  // Use AI vision for complex forms
  try {
    const screenshotBuffer = await page.screenshot();
    const screenshot = screenshotBuffer.toString('base64');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this job application page. Is this an easy apply, standard form, or complex multi-step application? Reply with only one of: easy_apply, standard_form, complex',
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/png;base64,${screenshot}` },
            },
          ],
        },
      ],
      max_tokens: 20,
    });
    const result = response.choices[0].message.content?.trim().toLowerCase();
    if (result?.includes('easy')) return 'easy_apply';
    if (result?.includes('standard')) return 'standard_form';
    if (result?.includes('complex')) return 'complex';
  } catch {
    // Fallback
  }

  return 'unknown';
}
