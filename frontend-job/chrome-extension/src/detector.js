/**
 * detector.js — ATS Fingerprinter
 * Runs first (before content.js). Detects which ATS is loaded and exposes
 * window.__ATS_ID__ and window.__ATS_META__ for all other scripts.
 */
(function () {
  'use strict';

  const h = window.location.hostname;
  const p = window.location.pathname;
  const full = h + p;

  const ATS_MAP = [
    // ── Tier 1: Enterprise ─────────────────────────────────────────────────────
    {
      id: 'workday',
      name: 'Workday',
      tier: 1,
      test: () =>
        /myworkdayjobs\.com/.test(h) ||
        /^wd\d+\.myworkday\.com/.test(h),
      applyPathPattern: /\/job\//,
      jdSelector: '[data-automation-id="jobPostingDescription"]',
      titleSelector: '[data-automation-id="jobPostingHeader"] h2, .css-1t4jknz',
      companySelector: '[data-automation-id="jobPostingHeader"] a, .gwt-Anchor',
    },
    {
      id: 'greenhouse',
      name: 'Greenhouse',
      tier: 1,
      test: () =>
        /greenhouse\.io/.test(h),
      applyPathPattern: /\/(jobs|application)/,
      jdSelector: '#content .job-description, .job__description, .content--right',
      titleSelector: 'h1.app-title, .opening h1, #header h1',
      companySelector: '#header .company-name, .company-name',
    },
    {
      id: 'lever',
      name: 'Lever',
      tier: 1,
      test: () =>
        /lever\.co/.test(h),
      applyPathPattern: /\/(apply|jobs)/,
      jdSelector: '.posting-requirements, .section-wrapper',
      titleSelector: 'h2, .posting-header h2',
      companySelector: '.main-header-logo img[alt], [class*="company"]',
    },
    {
      id: 'icims',
      name: 'iCIMS',
      tier: 1,
      test: () =>
        /icims\.com/.test(h),
      applyPathPattern: /\/jobs\//,
      jdSelector: '#jobDescriptionText, .iCIMS_JobDescription',
      titleSelector: '.iCIMS_Header h1, h1.iCIMS_InfoMsg',
      companySelector: '.iCIMS_Logo img[alt]',
    },
    {
      id: 'taleo',
      name: 'Taleo (Oracle)',
      tier: 1,
      test: () =>
        /taleo\.net/.test(h) ||
        (/oraclecloud\.com/.test(h) && /hcmUI\/CandidateExperience/.test(p)),
      applyPathPattern: /careersection|CandidateExperience/,
      jdSelector: '.job-description, #requisitionDescriptionInterface',
      titleSelector: '.jobTitle, h1[class*="title"]',
      companySelector: '.companyName, .company-name',
    },
    {
      id: 'successfactors',
      name: 'SAP SuccessFactors',
      tier: 1,
      test: () =>
        /successfactors\.com/.test(h) || /sapsf\.com/.test(h),
      applyPathPattern: /careers/,
      jdSelector: '.jobReqDescription, [class*="jobDesc"]',
      titleSelector: '[class*="jobTitle"], h1',
      companySelector: '[class*="companyName"]',
    },
    {
      id: 'adp',
      name: 'ADP Workforce Now',
      tier: 1,
      test: () =>
        /workforcenow\.adp\.com/.test(h),
      applyPathPattern: /jobs|careers/,
      jdSelector: '.job-description, [class*="description"]',
      titleSelector: 'h1, [class*="jobTitle"]',
      companySelector: '[class*="companyName"]',
    },

    // ── Tier 2: Startup/Growth ──────────────────────────────────────────────
    {
      id: 'ashby',
      name: 'Ashby',
      tier: 2,
      test: () =>
        /ashbyhq\.com/.test(h),
      applyPathPattern: /\//,
      jdSelector: '[data-testid="job-description"], [class*="JobDescription"]',
      titleSelector: 'h1, [data-testid="job-title"]',
      companySelector: '[data-testid="company-name"], [class*="CompanyName"]',
    },
    {
      id: 'smartrecruiters',
      name: 'SmartRecruiters',
      tier: 2,
      test: () =>
        /smartrecruiters\.com/.test(h),
      applyPathPattern: /\//,
      jdSelector: '.job-description, [class*="jobDescription"]',
      titleSelector: 'h1.job-title, [class*="jobTitle"]',
      companySelector: '.company-name, [class*="companyName"]',
    },
    {
      id: 'bamboohr',
      name: 'BambooHR',
      tier: 2,
      test: () =>
        /bamboohr\.com/.test(h) && /\/jobs/.test(p),
      applyPathPattern: /\/jobs\//,
      jdSelector: '#description, .BH-JobDescriptions',
      titleSelector: 'h2.BH-JobTitle, h1',
      companySelector: '#company-name, .BH-CompanyName',
    },
    {
      id: 'jazzhr',
      name: 'JazzHR',
      tier: 2,
      test: () =>
        /jazz\.co/.test(h),
      applyPathPattern: /\/apply/,
      jdSelector: '.job-description, #job_description',
      titleSelector: '#apply_form h1, h1',
      companySelector: '#company_name, [class*="company"]',
    },
    {
      id: 'recruitee',
      name: 'Recruitee',
      tier: 2,
      test: () =>
        /recruitee\.com/.test(h),
      applyPathPattern: /\/o\//,
      jdSelector: '.job-description, [class*="offer__description"]',
      titleSelector: 'h1.offer__title',
      companySelector: '[class*="company-name"]',
    },
    {
      id: 'breezy',
      name: 'Breezy HR',
      tier: 2,
      test: () =>
        /breezy\.hr/.test(h),
      applyPathPattern: /\/p\//,
      jdSelector: '.description, [class*="position-description"]',
      titleSelector: 'h1.position-title, h1',
      companySelector: '[class*="company-name"]',
    },
    {
      id: 'teamtailor',
      name: 'Teamtailor',
      tier: 2,
      test: () =>
        /teamtailor\.com/.test(h) || /career\.teamtailor\.com/.test(h),
      applyPathPattern: /\/jobs\//,
      jdSelector: '[class*="job-description"]',
      titleSelector: 'h1[class*="title"]',
      companySelector: '[class*="company-name"]',
    },
    {
      id: 'rippling',
      name: 'Rippling ATS',
      tier: 2,
      test: () =>
        /ats\.rippling\.com/.test(h),
      applyPathPattern: /\/jobs\//,
      jdSelector: '[class*="jobDescription"]',
      titleSelector: 'h1',
      companySelector: '[class*="companyName"]',
    },
    {
      id: 'pinpoint',
      name: 'Pinpoint',
      tier: 2,
      test: () =>
        /pinpointhq\.com/.test(h),
      applyPathPattern: /\/jobs\//,
      jdSelector: '[class*="job-description"]',
      titleSelector: 'h1',
      companySelector: '[class*="company"]',
    },

    // ── Tier 3: Aggregators ────────────────────────────────────────────────
    {
      id: 'linkedin',
      name: 'LinkedIn',
      tier: 3,
      test: () =>
        /linkedin\.com/.test(h) && /\/jobs\//.test(p),
      applyPathPattern: /\/jobs\/view/,
      jdSelector: '.jobs-description__content, .job-view-layout',
      titleSelector: '.job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title',
      companySelector: '.job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name',
    },
    {
      id: 'indeed',
      name: 'Indeed',
      tier: 3,
      test: () =>
        /indeed\.com/.test(h) || /smartapply\.indeed\.com/.test(h),
      applyPathPattern: /viewjob|apply/,
      jdSelector: '#jobDescriptionText, .jobsearch-jobDescriptionText',
      titleSelector: '[data-testid="jobsearch-JobInfoHeader-title"] span, h1.jobsearch-JobInfoHeader-title',
      companySelector: '[data-testid="inlineHeader-companyName"] a',
    },
    {
      id: 'glassdoor',
      name: 'Glassdoor',
      tier: 3,
      test: () =>
        /glassdoor\.com/.test(h),
      applyPathPattern: /job-listing/,
      jdSelector: '.jobDescriptionContent, [class*="JobDescription"]',
      titleSelector: '[data-test="job-title"]',
      companySelector: '[data-test="employer-name"]',
    },
    {
      id: 'wellfound',
      name: 'Wellfound (AngelList)',
      tier: 3,
      test: () =>
        /wellfound\.com/.test(h) || /angel\.co/.test(h),
      applyPathPattern: /\/jobs\//,
      jdSelector: '[class*="description"], [class*="job-description"]',
      titleSelector: 'h1, .job-title',
      companySelector: '.startup-link, [class*="company"]',
    },
    {
      id: 'ziprecruiter',
      name: 'ZipRecruiter',
      tier: 3,
      test: () =>
        /ziprecruiter\.com/.test(h),
      applyPathPattern: /\/jobs\//,
      jdSelector: '[class*="jobDescription"]',
      titleSelector: 'h1',
      companySelector: '[class*="company"]',
    },
    {
      id: 'dice',
      name: 'Dice',
      tier: 3,
      test: () =>
        /dice\.com/.test(h),
      applyPathPattern: /\/jobs\//,
      jdSelector: '[data-testid="jobDescription"]',
      titleSelector: 'h1[data-testid="jobTitle"]',
      companySelector: '[data-testid="companyName"]',
    },
    {
      id: 'builtin',
      name: 'Builtin',
      tier: 3,
      test: () =>
        /builtin\.com/.test(h),
      applyPathPattern: /\/job\//,
      jdSelector: '[class*="job-description"]',
      titleSelector: 'h1',
      companySelector: '[class*="company"]',
    },
    {
      id: 'handshake',
      name: 'Handshake',
      tier: 3,
      test: () =>
        /joinhandshake\.com/.test(h),
      applyPathPattern: /\/jobs\//,
      jdSelector: '[class*="description"]',
      titleSelector: 'h1',
      companySelector: '[class*="employer"]',
    },
  ];

  // Run detection
  let detected = null;
  for (const ats of ATS_MAP) {
    if (ats.test()) {
      detected = ats;
      break;
    }
  }

  if (detected) {
    window.__ATS_ID__   = detected.id;
    window.__ATS_META__ = detected;
  } else {
    window.__ATS_ID__   = 'unknown';
    window.__ATS_META__ = null;
  }

  // Helper: scrape the job description text using the detected ATS's selector
  window.__scrapeJD = function () {
    if (!window.__ATS_META__) return '';
    const sel = window.__ATS_META__.jdSelector;
    const el = document.querySelector(sel);
    return el?.innerText?.slice(0, 4000) ?? '';
  };

  // Helper: scrape job title
  window.__scrapeTitle = function () {
    if (!window.__ATS_META__) return '';
    const el = document.querySelector(window.__ATS_META__.titleSelector);
    return el?.textContent?.trim() ?? document.title;
  };

  // Helper: scrape company name
  window.__scrapeCompany = function () {
    if (!window.__ATS_META__) return '';
    const el = document.querySelector(window.__ATS_META__.companySelector);
    // For img[alt], return alt text; for everything else, textContent
    return el?.getAttribute('alt') ?? el?.textContent?.trim() ?? '';
  };

  if (window.__ATS_ID__ !== 'unknown') {
    console.log(`[Job Agent] Detected ATS: ${window.__ATS_META__.name} (tier ${window.__ATS_META__.tier})`);
  }
})();
