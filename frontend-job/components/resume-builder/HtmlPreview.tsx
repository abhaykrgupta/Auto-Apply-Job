import React from 'react';
import { ResumeData } from './types';
import { getTemplate, TemplateConfig } from './templates/templateList';

interface Props {
  data: ResumeData;
  templateId: string;
}

// ─── Font stacks (zero external dependencies — safe for Puppeteer PDF) ──────

const SANS = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;
const SERIF = `Georgia, Cambria, 'Times New Roman', Times, serif`;

function fontStack(t: TemplateConfig): string {
  return t.fontFamily === 'serif' ? SERIF : SANS;
}

// ─── Spacing scale ────────────────────────────────────────────────────────────

function sp(t: TemplateConfig, base: number): number {
  if (t.spacing === 'tight') return Math.round(base * 0.72);
  if (t.spacing === 'relaxed') return Math.round(base * 1.28);
  return base;
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function dateRange(start: string, end: string, current: boolean): string {
  const endStr = current ? 'Present' : (end || '');
  if (start && endStr) return `${start} – ${endStr}`;
  if (start) return start;
  return endStr;
}

// Split contact into 2 clean rows for header
function contactRows(p: ResumeData['personal']): [string, string] {
  const r1 = [p.email, p.phone, p.location].filter(Boolean).join('  ·  ');
  const r2 = [p.linkedin, p.github, p.website].filter(Boolean).join('  ·  ');
  return [r1, r2];
}

// ─── Section title ────────────────────────────────────────────────────────────

function SectionTitle({
  label, t, mt, mb,
}: {
  label: string;
  t: TemplateConfig;
  mt?: number;
  mb?: number;
}) {
  const font = fontStack(t);
  const col = t.accentColor;
  const topMargin = mt ?? sp(t, 16);
  const botMargin = mb ?? 7;

  const labelStyle: React.CSSProperties = {
    fontSize: 9.5,
    fontWeight: 700,
    color: col,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontFamily: font,
    lineHeight: 1,
  };

  if (t.dividerStyle === 'border-left') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: topMargin, marginBottom: botMargin }}>
        <div style={{ width: 3, height: 13, backgroundColor: col, borderRadius: 2, flexShrink: 0 }} />
        <h2 style={{ ...labelStyle, margin: 0 }}>{label}</h2>
      </div>
    );
  }

  if (t.dividerStyle === 'thick') {
    return (
      <div style={{ marginTop: topMargin, marginBottom: botMargin }}>
        <h2 style={{ ...labelStyle, marginBottom: 4, margin: 0 }}>{label}</h2>
        <div style={{ height: 2.5, backgroundColor: col, borderRadius: 1 }} />
      </div>
    );
  }

  if (t.dividerStyle === 'dot') {
    return (
      <div style={{ marginTop: topMargin, marginBottom: botMargin }}>
        <h2 style={{ ...labelStyle, marginBottom: 4, margin: 0 }}>{label}</h2>
        <div style={{ borderTop: `1.5px dotted ${col}65` }} />
      </div>
    );
  }

  if (t.dividerStyle === 'none') {
    return (
      <div style={{ marginTop: topMargin, marginBottom: botMargin }}>
        <h2 style={{ ...labelStyle, margin: 0 }}>{label}</h2>
      </div>
    );
  }

  // 'line' — default
  return (
    <div style={{ marginTop: topMargin, marginBottom: botMargin }}>
      <h2 style={{ ...labelStyle, marginBottom: 4, margin: 0 }}>{label}</h2>
      <div style={{ borderTop: `1px solid ${col}40` }} />
    </div>
  );
}

// ─── Experience entry ─────────────────────────────────────────────────────────

function ExpEntry({ exp, t, gap }: { exp: ResumeData['experience'][0]; t: TemplateConfig; gap: number }) {
  const font = fontStack(t);
  const date = dateRange(exp.startDate, exp.endDate, exp.current);
  const bullets = exp.bullets.filter(Boolean);
  const metrics = (exp.metrics || []).filter(Boolean);

  return (
    <div style={{ marginBottom: gap }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontWeight: 700, fontSize: 11, color: '#111827', lineHeight: 1.3, fontFamily: font, margin: 0 }}>
            {exp.title}
          </h3>
          <div style={{ fontSize: 10.5, color: t.accentColor, fontWeight: 500, lineHeight: 1.4, fontFamily: font, marginTop: 1 }}>
            {[exp.company, exp.location].filter(Boolean).join(' · ')}
          </div>
        </div>
        {date && (
          <div style={{ fontSize: 9.5, color: '#6b7280', whiteSpace: 'nowrap', fontFamily: font, paddingTop: 1.5, flexShrink: 0 }}>
            {date}
          </div>
        )}
      </div>
      {metrics.length > 0 && (
        <ul style={{ margin: '5px 0 0', paddingLeft: 15, listStyleType: 'square' }}>
          {metrics.map((m, i) => (
            <li key={`m-${i}`} style={{ fontSize: 10, color: t.accentColor, fontWeight: 600, marginBottom: 2.5, lineHeight: 1.58, fontFamily: font }}>
              {m}
            </li>
          ))}
        </ul>
      )}
      {bullets.length > 0 && (
        <ul style={{ margin: '5px 0 0', paddingLeft: 15, listStyleType: 'disc' }}>
          {bullets.map((b, i) => (
            <li key={i} style={{ fontSize: 10, color: '#374151', marginBottom: 2.5, lineHeight: 1.58, fontFamily: font }}>
              {b}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Education entry ──────────────────────────────────────────────────────────

function EduEntry({ edu, t, gap }: { edu: ResumeData['education'][0]; t: TemplateConfig; gap: number }) {
  const font = fontStack(t);
  const degree = [edu.degree, edu.field ? `in ${edu.field}` : ''].filter(Boolean).join(' ');
  const date = edu.startDate
    ? `${edu.startDate}${edu.endDate ? ` – ${edu.endDate}` : ''}`
    : edu.endDate || '';

  return (
    <div style={{ marginBottom: gap }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: 10.5, color: '#111827', lineHeight: 1.3, fontFamily: font, margin: 0 }}>
            {degree || 'Degree'}
          </h3>
          <div style={{ fontSize: 10, lineHeight: 1.4, marginTop: 1.5, fontFamily: font }}>
            <span style={{ color: t.accentColor }}>{edu.school}</span>
            {edu.gpa ? <span style={{ color: '#6b7280', marginLeft: 8 }}>GPA {edu.gpa}</span> : null}
          </div>
        </div>
        {date && (
          <div style={{ fontSize: 9.5, color: '#6b7280', whiteSpace: 'nowrap', fontFamily: font, paddingTop: 1.5, flexShrink: 0 }}>
            {date}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Project entry ────────────────────────────────────────────────────────────

function ProjEntry({ proj, t, gap }: { proj: ResumeData['projects'][0]; t: TemplateConfig; gap: number }) {
  const font = fontStack(t);
  const bullets = proj.bullets.filter(Boolean);

  return (
    <div style={{ marginBottom: gap }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 2 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontWeight: 700, fontSize: 10.5, color: '#111827', fontFamily: font, display: 'inline', margin: 0 }}>
            {proj.name}
          </h3>
          {proj.url && (
            <span style={{ fontSize: 9, color: t.accentColor, marginLeft: 7, fontFamily: font }}>{proj.url}</span>
          )}
        </div>
        {proj.technologies.length > 0 && (
          <div style={{ fontSize: 9.5, color: '#6b7280', fontStyle: 'italic', whiteSpace: 'nowrap', fontFamily: font, flexShrink: 0 }}>
            {proj.technologies.slice(0, 4).join(', ')}
          </div>
        )}
      </div>
      {proj.description && (
        <div style={{ fontSize: 10, color: '#374151', lineHeight: 1.58, fontFamily: font, marginBottom: bullets.length ? 3 : 0 }}>
          {proj.description}
        </div>
      )}
      {bullets.length > 0 && (
        <ul style={{ margin: '4px 0 0', paddingLeft: 15, listStyleType: 'disc' }}>
          {bullets.map((b, i) => (
            <li key={i} style={{ fontSize: 10, color: '#374151', marginBottom: 2.5, lineHeight: 1.58, fontFamily: font }}>
              {b}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Skills block ─────────────────────────────────────────────────────────────

function SkillsBlock({ skills, t, dark = false }: { skills: ResumeData['skills']; t: TemplateConfig; dark?: boolean }) {
  const font = fontStack(t);
  const accent = dark ? (t.sidebarText ?? '#fff') : t.accentColor;
  const muted = dark ? `${t.sidebarText ?? '#fff'}65` : '#6b7280';
  const text = dark ? (t.sidebarText ?? '#fff') : '#374151';

  const cats = [
    { label: 'Technical', items: skills.technical.filter(Boolean) },
    { label: 'Soft Skills', items: skills.soft.filter(Boolean) },
    { label: 'Languages', items: skills.languages.filter(Boolean) },
    { label: 'Certifications', items: skills.certifications.filter(Boolean) },
  ].filter(c => c.items.length > 0);

  if (cats.length === 0) return null;

  // Dots style — only used in sidebar (dark). Outside sidebar, fall through to pills.
  if (t.skillStyle === 'dots' && dark) {
    return (
      <div>
        {skills.technical.filter(Boolean).slice(0, 8).map((s, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 9.5, color: text, fontFamily: font }}>{s}</span>
            <div style={{ display: 'flex', gap: 3 }}>
              {[1, 2, 3, 4, 5].map(d => (
                <div key={d} style={{
                  width: 7, height: 7, borderRadius: '50%',
                  backgroundColor: d <= 4 ? accent : 'transparent',
                  border: `1.5px solid ${d <= 4 ? accent : `${accent}45`}`,
                }} />
              ))}
            </div>
          </div>
        ))}
        {[
          { label: 'Soft Skills', items: skills.soft.filter(Boolean) },
          { label: 'Languages', items: skills.languages.filter(Boolean) },
          { label: 'Certifications', items: skills.certifications.filter(Boolean) },
        ].filter(g => g.items.length > 0).map(({ label, items }) => (
          <div key={label} style={{ marginTop: 9 }}>
            <div style={{ fontSize: 9, color: muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, fontFamily: font }}>
              {label}
            </div>
            <div style={{ fontSize: 9.5, color: `${text}cc`, fontFamily: font, lineHeight: 1.6 }}>
              {items.join(', ')}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Text style
  if (t.skillStyle === 'text') {
    return (
      <div>
        {cats.map(({ label, items }) => (
          <div key={label} style={{ marginBottom: 5, lineHeight: 1.55, fontFamily: font }}>
            <span style={{ fontWeight: 700, fontSize: 10, color: text }}>{label}:{' '}</span>
            <span style={{ fontSize: 10, color: text }}>{items.join(', ')}</span>
          </div>
        ))}
      </div>
    );
  }

  // Pills style (default + dots non-dark)
  return (
    <div>
      {cats.map(({ label, items }) => (
        <div key={label} style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, fontFamily: font }}>
            {label}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {items.map((s, i) => (
              <span key={i} style={{
                fontSize: 9.5, padding: '2.5px 8px', borderRadius: 4,
                backgroundColor: dark ? `${accent}18` : `${accent}0f`,
                color: dark ? accent : accent,
                border: `1px solid ${dark ? `${accent}35` : `${accent}28`}`,
                fontWeight: 500, fontFamily: font, lineHeight: 1.5,
              }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── LAYOUT: SINGLE COLUMN ───────────────────────────────────────────────────

function SingleLayout({ data, t }: { data: ResumeData; t: TemplateConfig }) {
  const { personal, summary, experience, education, skills, projects } = data;
  const font = fontStack(t);
  const PAD = 32;
  const EG = sp(t, 12); // entry gap
  const SG = sp(t, 14); // section gap
  const [r1, r2] = contactRows(personal);
  const hasSkills = skills.technical.length + skills.soft.length + skills.languages.length + skills.certifications.length > 0;

  return (
    <div style={{ fontFamily: font, fontSize: 10.5, color: '#111827', lineHeight: 1.6, padding: PAD, backgroundColor: '#ffffff' }}>

      {/* ── Header ── */}
      <div style={{
        textAlign: t.headerAlign === 'center' ? 'center' : 'left',
        marginBottom: sp(t, 12),
        paddingBottom: sp(t, 10),
        borderBottom: `1px solid #e2e8f0`,
      }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: t.accentColor, letterSpacing: '-0.5px', lineHeight: 1.15, marginBottom: 3, fontFamily: font }}>
          {personal.name || 'Your Name'}
        </div>
        {experience[0]?.title && (
          <div style={{ fontSize: 11, fontWeight: 500, color: '#64748b', marginBottom: 5, fontFamily: font }}>
            {experience[0].title}
          </div>
        )}
        {r1 && <div style={{ fontSize: 9.5, color: '#4b5563', lineHeight: 1.75, fontFamily: font }}>{r1}</div>}
        {r2 && <div style={{ fontSize: 9.5, color: '#4b5563', lineHeight: 1.75, fontFamily: font }}>{r2}</div>}
      </div>

      {/* ── Summary ── */}
      {summary.text && (
        <>
          <SectionTitle label="Professional Summary" t={t} mt={0} />
          <p style={{ margin: `0 0 ${SG}px`, fontSize: 10, color: '#374151', lineHeight: 1.68, fontFamily: font }}>{summary.text}</p>
        </>
      )}

      {/* ── Experience ── */}
      {experience.length > 0 && (
        <>
          <SectionTitle label="Work Experience" t={t} mt={summary.text ? undefined : 0} />
          <div style={{ marginBottom: SG }}>
            {experience.map(exp => <ExpEntry key={exp.id} exp={exp} t={t} gap={EG} />)}
          </div>
        </>
      )}

      {/* ── Skills ── */}
      {hasSkills && (
        <>
          <SectionTitle label="Skills" t={t} />
          <div style={{ marginBottom: SG }}><SkillsBlock skills={skills} t={t} /></div>
        </>
      )}

      {/* ── Education ── */}
      {education.length > 0 && (
        <>
          <SectionTitle label="Education" t={t} />
          <div style={{ marginBottom: SG }}>
            {education.map(edu => <EduEntry key={edu.id} edu={edu} t={t} gap={sp(t, 9)} />)}
          </div>
        </>
      )}

      {/* ── Projects ── */}
      {projects.length > 0 && (
        <>
          <SectionTitle label="Projects" t={t} />
          {projects.map(proj => <ProjEntry key={proj.id} proj={proj} t={t} gap={EG} />)}
        </>
      )}
    </div>
  );
}

// ─── LAYOUT: BANNER ──────────────────────────────────────────────────────────

function BannerLayout({ data, t }: { data: ResumeData; t: TemplateConfig }) {
  const { personal, summary, experience, education, skills, projects } = data;
  const font = fontStack(t);
  const EG = sp(t, 12);
  const SG = sp(t, 14);
  const [r1, r2] = contactRows(personal);
  const hasSkills = skills.technical.length + skills.soft.length + skills.languages.length + skills.certifications.length > 0;

  return (
    <div style={{ fontFamily: font, fontSize: 10.5, color: '#111827', lineHeight: 1.6, backgroundColor: '#ffffff' }}>

      {/* ── Banner header ── */}
      <div style={{
        backgroundColor: t.accentColor,
        padding: '24px 32px 20px',
        textAlign: t.headerAlign === 'center' ? 'center' : 'left',
      }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.4px', lineHeight: 1.15, marginBottom: 3, fontFamily: font }}>
          {personal.name || 'Your Name'}
        </div>
        {experience[0]?.title && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 400, marginBottom: 6, fontFamily: font }}>
            {experience[0].title}
          </div>
        )}
        {r1 && <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.72)', lineHeight: 1.75, fontFamily: font }}>{r1}</div>}
        {r2 && <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.72)', lineHeight: 1.75, fontFamily: font }}>{r2}</div>}
      </div>

      {/* ── Body ── */}
      <div style={{ padding: '22px 32px 32px' }}>
        {summary.text && (
          <>
            <SectionTitle label="Profile" t={t} mt={0} />
            <p style={{ margin: `0 0 ${SG}px`, fontSize: 10, color: '#374151', lineHeight: 1.68, fontFamily: font }}>{summary.text}</p>
          </>
        )}

        {experience.length > 0 && (
          <>
            <SectionTitle label="Work Experience" t={t} mt={summary.text ? undefined : 0} />
            <div style={{ marginBottom: SG }}>
              {experience.map(exp => <ExpEntry key={exp.id} exp={exp} t={t} gap={EG} />)}
            </div>
          </>
        )}

        {hasSkills && (
          <>
            <SectionTitle label="Skills" t={t} />
            <div style={{ marginBottom: SG }}><SkillsBlock skills={skills} t={t} /></div>
          </>
        )}

        {education.length > 0 && (
          <>
            <SectionTitle label="Education" t={t} />
            <div style={{ marginBottom: SG }}>
              {education.map(edu => <EduEntry key={edu.id} edu={edu} t={t} gap={sp(t, 9)} />)}
            </div>
          </>
        )}

        {projects.length > 0 && (
          <>
            <SectionTitle label="Projects" t={t} />
            {projects.map(proj => <ProjEntry key={proj.id} proj={proj} t={t} gap={EG} />)}
          </>
        )}
      </div>
    </div>
  );
}

// ─── LAYOUT: TIMELINE ────────────────────────────────────────────────────────

function TimelineLayout({ data, t }: { data: ResumeData; t: TemplateConfig }) {
  const { personal, summary, experience, education, skills, projects } = data;
  const font = fontStack(t);
  const EG = sp(t, 13);
  const SG = sp(t, 14);
  const [r1, r2] = contactRows(personal);
  const hasSkills = skills.technical.length + skills.soft.length + skills.languages.length + skills.certifications.length > 0;

  return (
    <div style={{ fontFamily: font, fontSize: 10.5, color: '#111827', lineHeight: 1.6, padding: 32, backgroundColor: '#ffffff' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: sp(t, 12), paddingBottom: sp(t, 10), borderBottom: `1px solid #e2e8f0` }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: t.accentColor, letterSpacing: '-0.5px', lineHeight: 1.15, marginBottom: 3, fontFamily: font }}>
          {personal.name || 'Your Name'}
        </div>
        {experience[0]?.title && (
          <div style={{ fontSize: 11, fontWeight: 500, color: '#64748b', marginBottom: 5, fontFamily: font }}>{experience[0].title}</div>
        )}
        {r1 && <div style={{ fontSize: 9.5, color: '#4b5563', lineHeight: 1.75, fontFamily: font }}>{r1}</div>}
        {r2 && <div style={{ fontSize: 9.5, color: '#4b5563', lineHeight: 1.75, fontFamily: font }}>{r2}</div>}
      </div>

      {summary.text && (
        <>
          <SectionTitle label="Profile" t={t} mt={0} />
          <p style={{ margin: `0 0 ${SG}px`, fontSize: 10, color: '#374151', lineHeight: 1.68, fontFamily: font }}>{summary.text}</p>
        </>
      )}

      {/* ── Timeline experience ── */}
      {experience.length > 0 && (
        <>
          <SectionTitle label="Experience" t={t} mt={summary.text ? undefined : 0} />
          <div style={{ position: 'relative', paddingLeft: 24, marginBottom: SG }}>
            {/* Connector line */}
            <div style={{ position: 'absolute', left: 7, top: 7, bottom: 0, width: 1.5, backgroundColor: `${t.accentColor}28` }} />
            {experience.map((exp) => {
              const date = dateRange(exp.startDate, exp.endDate, exp.current);
              const bullets = exp.bullets.filter(Boolean);
              return (
                <div key={exp.id} style={{ position: 'relative', marginBottom: EG }}>
                  {/* Dot */}
                  <div style={{
                    position: 'absolute', left: -19, top: 4,
                    width: 11, height: 11, borderRadius: '50%',
                    backgroundColor: t.accentColor,
                    border: '2.5px solid #ffffff',
                    boxShadow: `0 0 0 1.5px ${t.accentColor}55`,
                  }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 11, color: '#111827', lineHeight: 1.3, fontFamily: font }}>{exp.title}</div>
                      <div style={{ fontSize: 10.5, color: t.accentColor, fontWeight: 500, lineHeight: 1.4, fontFamily: font, marginTop: 1 }}>
                        {[exp.company, exp.location].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    {date && (
                      <div style={{ fontSize: 9.5, color: '#6b7280', whiteSpace: 'nowrap', fontFamily: font, paddingTop: 1.5, flexShrink: 0 }}>{date}</div>
                    )}
                  </div>
                  {bullets.length > 0 && (
                    <ul style={{ margin: '5px 0 0', paddingLeft: 15, listStyleType: 'disc' }}>
                      {bullets.map((b, i) => (
                        <li key={i} style={{ fontSize: 10, color: '#374151', marginBottom: 2.5, lineHeight: 1.58, fontFamily: font }}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {hasSkills && (
        <>
          <SectionTitle label="Skills" t={t} />
          <div style={{ marginBottom: SG }}><SkillsBlock skills={skills} t={t} /></div>
        </>
      )}

      {education.length > 0 && (
        <>
          <SectionTitle label="Education" t={t} />
          <div style={{ marginBottom: SG }}>
            {education.map(edu => <EduEntry key={edu.id} edu={edu} t={t} gap={sp(t, 9)} />)}
          </div>
        </>
      )}

      {projects.length > 0 && (
        <>
          <SectionTitle label="Projects" t={t} />
          {projects.map(proj => <ProjEntry key={proj.id} proj={proj} t={t} gap={EG} />)}
        </>
      )}
    </div>
  );
}

// ─── LAYOUT: SIDEBAR ─────────────────────────────────────────────────────────

function SidebarLayout({ data, t }: { data: ResumeData; t: TemplateConfig }) {
  const { personal, summary, experience, education, skills, projects } = data;
  const sidebarBg = t.sidebarBg ?? '#1e3a5f';
  const sidebarText = t.sidebarText ?? '#ffffff';
  const font = fontStack(t);
  const EG = sp(t, 12);
  const hasSkills = skills.technical.length + skills.soft.length + skills.languages.length + skills.certifications.length > 0;

  const SIDEBAR_ST: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: `${sidebarText}70`,
    marginTop: 16,
    marginBottom: 7,
    borderBottom: `1px solid ${sidebarText}20`,
    paddingBottom: 4,
    fontFamily: font,
  };

  const MAIN_ST_STYLE = (accent: string, first = false): React.CSSProperties => ({
    fontSize: 9.5,
    fontWeight: 700,
    color: accent,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontFamily: font,
    marginTop: first ? 0 : sp(t, 16),
    marginBottom: 7,
    paddingBottom: 3,
    borderBottom: `1px solid ${accent}38`,
  });

  return (
    <div style={{ fontFamily: font, fontSize: 10.5, color: '#111827', display: 'flex', minHeight: '297mm', backgroundColor: '#ffffff' }}>

      {/* ── Sidebar ── */}
      <div style={{ width: '33%', backgroundColor: sidebarBg, color: sidebarText, padding: '28px 18px 32px', flexShrink: 0 }}>

        {/* Name */}
        <div style={{ fontSize: 17, fontWeight: 800, color: sidebarText, lineHeight: 1.2, marginBottom: 3, fontFamily: font }}>
          {personal.name || 'Your Name'}
        </div>
        {experience[0]?.title && (
          <div style={{ fontSize: 9.5, color: `${sidebarText}70`, marginBottom: 16, fontFamily: font }}>
            {experience[0].title}
          </div>
        )}

        {/* Contact */}
        <div style={{ ...SIDEBAR_ST, marginTop: 0 }}>Contact</div>
        {personal.email && <div style={{ fontSize: 9.5, color: `${sidebarText}cc`, marginBottom: 4, wordBreak: 'break-word', lineHeight: 1.5, fontFamily: font }}>{personal.email}</div>}
        {personal.phone && <div style={{ fontSize: 9.5, color: `${sidebarText}cc`, marginBottom: 4, fontFamily: font }}>{personal.phone}</div>}
        {personal.location && <div style={{ fontSize: 9.5, color: `${sidebarText}cc`, marginBottom: 4, fontFamily: font }}>{personal.location}</div>}
        {personal.linkedin && <div style={{ fontSize: 9, color: `${sidebarText}bb`, marginBottom: 3, wordBreak: 'break-all', fontFamily: font }}>{personal.linkedin}</div>}
        {personal.github && <div style={{ fontSize: 9, color: `${sidebarText}bb`, marginBottom: 3, wordBreak: 'break-all', fontFamily: font }}>{personal.github}</div>}
        {personal.website && <div style={{ fontSize: 9, color: `${sidebarText}bb`, marginBottom: 3, wordBreak: 'break-all', fontFamily: font }}>{personal.website}</div>}

        {/* Skills */}
        {hasSkills && (
          <>
            <div style={SIDEBAR_ST}>Skills</div>
            <SkillsBlock skills={skills} t={t} dark />
          </>
        )}

        {/* Education */}
        {education.length > 0 && (
          <>
            <div style={SIDEBAR_ST}>Education</div>
            {education.map((edu) => {
              const degree = [edu.degree, edu.field ? `in ${edu.field}` : ''].filter(Boolean).join(' ');
              return (
                <div key={edu.id} style={{ marginBottom: 11 }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: sidebarText, fontFamily: font, lineHeight: 1.3 }}>{degree}</div>
                  <div style={{ fontSize: 9, color: `${sidebarText}bb`, marginTop: 2, fontFamily: font }}>{edu.school}</div>
                  {(edu.startDate || edu.endDate) && (
                    <div style={{ fontSize: 8.5, color: `${sidebarText}70`, marginTop: 1.5, fontFamily: font }}>
                      {edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ''}
                    </div>
                  )}
                  {edu.gpa && <div style={{ fontSize: 8.5, color: `${sidebarText}70`, fontFamily: font }}>GPA {edu.gpa}</div>}
                </div>
              );
            })}
          </>
        )}

        {/* Certifications */}
        {skills.certifications.filter(Boolean).length > 0 && t.skillStyle !== 'dots' && (
          <>
            <div style={SIDEBAR_ST}>Certifications</div>
            {skills.certifications.filter(Boolean).map((c, i) => (
              <div key={i} style={{ fontSize: 9, color: `${sidebarText}cc`, marginBottom: 4, lineHeight: 1.5, fontFamily: font }}>• {c}</div>
            ))}
          </>
        )}
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, padding: '28px 26px' }}>
        {summary.text && (
          <div style={{ marginBottom: sp(t, 14) }}>
            <div style={MAIN_ST_STYLE(t.accentColor, true)}>Profile</div>
            <p style={{ margin: 0, fontSize: 10, color: '#374151', lineHeight: 1.68, fontFamily: font }}>{summary.text}</p>
          </div>
        )}

        {experience.length > 0 && (
          <div style={{ marginBottom: sp(t, 14) }}>
            <div style={MAIN_ST_STYLE(t.accentColor, !summary.text)}>Work Experience</div>
            {experience.map((exp) => {
              const date = dateRange(exp.startDate, exp.endDate, exp.current);
              const bullets = exp.bullets.filter(Boolean);
              return (
                <div key={exp.id} style={{ marginBottom: EG }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 11, color: '#111827', lineHeight: 1.3, fontFamily: font }}>{exp.title}</div>
                      <div style={{ fontSize: 10, color: t.accentColor, fontWeight: 500, lineHeight: 1.4, fontFamily: font, marginTop: 1 }}>
                        {[exp.company, exp.location].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    {date && (
                      <div style={{
                        fontSize: 9, color: '#fff', whiteSpace: 'nowrap', fontFamily: font,
                        backgroundColor: t.accentColor, padding: '2px 7px', borderRadius: 3,
                        flexShrink: 0, marginTop: 1,
                      }}>
                        {date}
                      </div>
                    )}
                  </div>
                  {bullets.length > 0 && (
                    <ul style={{ margin: '5px 0 0', paddingLeft: 15, listStyleType: 'disc' }}>
                      {bullets.map((b, i) => (
                        <li key={i} style={{ fontSize: 10, color: '#374151', marginBottom: 2.5, lineHeight: 1.58, fontFamily: font }}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {projects.length > 0 && (
          <div>
            <div style={MAIN_ST_STYLE(t.accentColor, false)}>Projects</div>
            {projects.map(proj => <ProjEntry key={proj.id} proj={proj} t={t} gap={EG} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── LAYOUT: TWO COLUMN ──────────────────────────────────────────────────────

function TwoColLayout({ data, t }: { data: ResumeData; t: TemplateConfig }) {
  const { personal, summary, experience, education, skills, projects } = data;
  const font = fontStack(t);
  const isMercury = t.id === 'mercury';
  const leftW = isMercury ? '30%' : '35%';
  const EG = sp(t, 12);
  const [r1, r2] = contactRows(personal);
  const hasSkills = skills.technical.length + skills.soft.length + skills.languages.length + skills.certifications.length > 0;

  const colTitle = (first = false): React.CSSProperties => ({
    fontSize: 9.5, fontWeight: 700, color: t.accentColor,
    textTransform: 'uppercase', letterSpacing: '0.1em',
    fontFamily: font,
    marginTop: first ? 0 : sp(t, 14),
    marginBottom: 7, paddingBottom: 3,
    borderBottom: t.dividerStyle === 'none' ? 'none' : `1px solid ${t.accentColor}38`,
  });

  return (
    <div style={{ fontFamily: font, fontSize: 10.5, color: '#111827', lineHeight: 1.6, backgroundColor: '#ffffff' }}>

      {/* ── Full-width header ── */}
      <div style={{
        padding: '22px 26px 16px',
        borderBottom: `3px solid ${t.accentColor}`,
        background: `linear-gradient(120deg, ${t.accentColor}07 0%, transparent 65%)`,
      }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: t.accentColor, letterSpacing: '-0.5px', lineHeight: 1.15, marginBottom: 3, fontFamily: font }}>
          {personal.name || 'Your Name'}
        </div>
        {experience[0]?.title && (
          <div style={{ fontSize: 11, fontWeight: 500, color: '#64748b', marginBottom: 4, fontFamily: font }}>{experience[0].title}</div>
        )}
        {r1 && <div style={{ fontSize: 9.5, color: '#4b5563', lineHeight: 1.75, fontFamily: font }}>{r1}</div>}
        {r2 && <div style={{ fontSize: 9.5, color: '#4b5563', lineHeight: 1.75, fontFamily: font }}>{r2}</div>}
      </div>

      {/* ── Two columns ── */}
      <div style={{ display: 'flex' }}>

        {/* Left */}
        <div style={{ width: leftW, padding: '18px 16px 28px 24px', borderRight: `1px solid #e2e8f0`, flexShrink: 0 }}>
          {summary.text && (
            <>
              <div style={colTitle(true)}>Profile</div>
              <p style={{ margin: `0 0 ${sp(t, 12)}px`, fontSize: 10, color: '#374151', lineHeight: 1.65, fontFamily: font }}>{summary.text}</p>
            </>
          )}

          {hasSkills && (
            <>
              <div style={colTitle(!summary.text)}>Skills</div>
              <div style={{ marginBottom: sp(t, 12) }}><SkillsBlock skills={skills} t={t} /></div>
            </>
          )}

          {education.length > 0 && (
            <>
              <div style={colTitle(false)}>Education</div>
              {education.map((edu) => {
                const degree = [edu.degree, edu.field ? `in ${edu.field}` : ''].filter(Boolean).join(' ');
                const date = edu.startDate ? `${edu.startDate}${edu.endDate ? ` – ${edu.endDate}` : ''}` : (edu.endDate || '');
                return (
                  <div key={edu.id} style={{ marginBottom: sp(t, 10) }}>
                    <div style={{ fontWeight: 700, fontSize: 10.5, color: '#111827', lineHeight: 1.3, fontFamily: font }}>{degree}</div>
                    <div style={{ fontSize: 10, color: t.accentColor, fontFamily: font, marginTop: 1.5 }}>{edu.school}</div>
                    <div style={{ fontSize: 9.5, color: '#6b7280', fontFamily: font, marginTop: 1 }}>
                      {[date, edu.gpa ? `GPA ${edu.gpa}` : ''].filter(Boolean).join('  ·  ')}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {skills.certifications.filter(Boolean).length > 0 && (
            <>
              <div style={colTitle(false)}>Certifications</div>
              {skills.certifications.filter(Boolean).map((c, i) => (
                <div key={i} style={{ fontSize: 9.5, color: '#374151', marginBottom: 4, fontFamily: font }}>• {c}</div>
              ))}
            </>
          )}
        </div>

        {/* Right */}
        <div style={{ flex: 1, padding: '18px 24px 28px 18px' }}>
          {experience.length > 0 && (
            <>
              <div style={colTitle(true)}>Work Experience</div>
              {experience.map(exp => <ExpEntry key={exp.id} exp={exp} t={t} gap={EG} />)}
            </>
          )}

          {projects.length > 0 && (
            <>
              <div style={colTitle(experience.length === 0)}>Projects</div>
              {projects.map(proj => <ProjEntry key={proj.id} proj={proj} t={t} gap={EG} />)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── LAYOUT: TRADITIONAL ─────────────────────────────────────────────────────
// Classic serif resume: ALL CAPS name, skills-first, no emoji (ATS-safe)

function TraditionalLayout({ data }: { data: ResumeData }) {
  const { personal, summary, experience, education, skills, projects } = data;
  const fs = 11;

  const HR = () => <div style={{ borderTop: '1px solid #111', margin: '3px 0 8px' }} />;

  const SecTitle = ({ label }: { label: string }) => (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, fontFamily: SERIF, marginTop: 14, marginBottom: 2, color: '#111' }}>{label}</div>
      <HR />
    </div>
  );

  // ATS-safe: NO emoji, pipe-separated
  const contactParts = [
    personal.phone, personal.email,
    personal.linkedin, personal.github, personal.website,
  ].filter(Boolean);

  const skillCats = [
    skills.technical.filter(Boolean).length > 0 && { label: 'Technical Skills', value: skills.technical.filter(Boolean).join(', ') },
    skills.languages.filter(Boolean).length > 0 && { label: 'Languages', value: skills.languages.filter(Boolean).join(', ') },
    skills.soft.filter(Boolean).length > 0 && { label: 'Soft Skills', value: skills.soft.filter(Boolean).join(', ') },
    skills.certifications.filter(Boolean).length > 0 && { label: 'Certifications', value: skills.certifications.filter(Boolean).join(', ') },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div style={{ fontFamily: SERIF, fontSize: fs, color: '#000', lineHeight: 1.55, padding: '28px 36px', backgroundColor: '#fff' }}>

      {/* Name */}
      <div style={{ textAlign: 'center', marginBottom: 5 }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: SERIF }}>
          {personal.name || 'Your Name'}
        </div>
        {personal.location && <div style={{ fontSize: fs, marginTop: 2, fontFamily: SERIF }}>{personal.location}</div>}
      </div>

      {/* Contact — no emoji, pipe separator */}
      {contactParts.length > 0 && (
        <div style={{ textAlign: 'center', fontSize: 10, marginBottom: 8, lineHeight: 1.75, fontFamily: SERIF, color: '#111' }}>
          {contactParts.join('  |  ')}
        </div>
      )}

      <HR />

      {/* Skills first */}
      {skillCats.length > 0 && (
        <div>
          <SecTitle label="Skills" />
          {skillCats.map((cat, i) => (
            <div key={i} style={{ fontSize: fs, marginBottom: 3.5, lineHeight: 1.55, fontFamily: SERIF }}>
              <strong>{cat.label}:</strong>{' '}{cat.value}
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {summary.text && (
        <div>
          <SecTitle label="Summary" />
          <p style={{ margin: 0, fontSize: fs, lineHeight: 1.65, fontFamily: SERIF }}>{summary.text}</p>
        </div>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <div>
          <SecTitle label="Experience" />
          {experience.map((exp) => {
            const date = dateRange(exp.startDate, exp.endDate, exp.current);
            return (
              <div key={exp.id} style={{ marginBottom: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ fontWeight: 700, fontSize: fs, fontFamily: SERIF }}>{exp.title}</div>
                  <div style={{ fontWeight: 700, fontSize: fs, whiteSpace: 'nowrap', marginLeft: 8, fontFamily: SERIF }}>{date}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ fontStyle: 'italic', fontSize: fs, fontFamily: SERIF }}>{exp.company}</div>
                  {exp.location && <div style={{ fontStyle: 'italic', fontSize: fs, whiteSpace: 'nowrap', marginLeft: 8, fontFamily: SERIF }}>{exp.location}</div>}
                </div>
                {exp.bullets.filter(Boolean).length > 0 && (
                  <ul style={{ margin: '5px 0 0', paddingLeft: 20 }}>
                    {exp.bullets.filter(Boolean).map((b, i) => (
                      <li key={i} style={{ fontSize: fs, marginBottom: 2.5, lineHeight: 1.58, fontFamily: SERIF }}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div>
          <SecTitle label="Education" />
          {education.map((edu) => {
            const degree = [edu.degree, edu.field ? `in ${edu.field}` : ''].filter(Boolean).join(' ');
            return (
              <div key={edu.id} style={{ marginBottom: 9 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 700, fontFamily: SERIF }}>{degree}</div>
                  <div style={{ fontSize: fs, whiteSpace: 'nowrap', fontFamily: SERIF }}>
                    {edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontStyle: 'italic', fontFamily: SERIF }}>{edu.school}</div>
                  {edu.gpa && <div style={{ fontFamily: SERIF }}>GPA: {edu.gpa}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div>
          <SecTitle label="Projects" />
          {projects.map((proj) => {
            const bullets = proj.bullets.filter(Boolean);
            return (
              <div key={proj.id} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 700, fontFamily: SERIF }}>{proj.name}</div>
                  {proj.technologies.length > 0 && (
                    <div style={{ fontStyle: 'italic', fontSize: fs, fontFamily: SERIF }}>{proj.technologies.slice(0, 4).join(', ')}</div>
                  )}
                </div>
                {proj.url && <div style={{ fontSize: 10, fontFamily: SERIF }}>{proj.url}</div>}
                {proj.description && <div style={{ fontSize: fs, marginTop: 2, lineHeight: 1.58, fontFamily: SERIF }}>{proj.description}</div>}
                {bullets.length > 0 && (
                  <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
                    {bullets.map((b, i) => (
                      <li key={i} style={{ fontSize: fs, marginBottom: 2.5, lineHeight: 1.58, fontFamily: SERIF }}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function HtmlPreview({ data, templateId }: Props) {
  const t = getTemplate(templateId);
  switch (t.layout) {
    case 'sidebar':     return <SidebarLayout data={data} t={t} />;
    case 'banner':      return <BannerLayout data={data} t={t} />;
    case 'timeline':    return <TimelineLayout data={data} t={t} />;
    case 'two-col':     return <TwoColLayout data={data} t={t} />;
    case 'traditional': return <TraditionalLayout data={data} />;
    default:            return <SingleLayout data={data} t={t} />;
  }
}
