import React from 'react';
import { ResumeData } from './types';
import { getTemplate, TemplateConfig } from './templates/templateList';

interface Props {
  data: ResumeData;
  templateId: string;
}

// ─── Shared helpers ────────────────────────────────────────────────────────

function fontStack(t: TemplateConfig) {
  return t.fontFamily === 'serif'
    ? 'Georgia, "Times New Roman", serif'
    : 'Arial, Helvetica, sans-serif';
}

function contactLine(personal: ResumeData['personal']) {
  return [personal.email, personal.phone, personal.location, personal.linkedin, personal.github, personal.website]
    .filter(Boolean)
    .join(' • ');
}

function Divider({ t }: { t: TemplateConfig }) {
  if (t.dividerStyle === 'none' || t.dividerStyle === 'border-left') return null;
  if (t.dividerStyle === 'thick')
    return <div style={{ height: 3, backgroundColor: t.accentColor, margin: '4px 0 8px' }} />;
  if (t.dividerStyle === 'dot')
    return <div style={{ borderTop: `2px dotted ${t.accentColor}`, margin: '4px 0 8px' }} />;
  return <div style={{ borderTop: `1px solid ${t.accentColor}`, margin: '4px 0 8px' }} />;
}

function SectionTitle({ label, t }: { label: string; t: TemplateConfig }) {
  const base: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: t.accentColor,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: 2,
    fontFamily: fontStack(t),
  };

  if (t.dividerStyle === 'border-left') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, marginTop: 14 }}>
        <div style={{ width: 4, height: 16, backgroundColor: t.accentColor, borderRadius: 2, flexShrink: 0 }} />
        <div style={base}>{label}</div>
      </div>
    );
  }

  return <div style={{ ...base, marginTop: 14 }}>{label}</div>;
}

// Skills renderer
function Skills({ t, skills }: { t: TemplateConfig; skills: ResumeData['skills'] }) {
  const allSkills = [...skills.technical, ...skills.soft, ...skills.languages, ...skills.certifications].filter(Boolean);
  if (allSkills.length === 0) return null;

  if (t.skillStyle === 'pills') {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {skills.technical.filter(Boolean).map((s, i) => (
          <span key={i} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 99, backgroundColor: `${t.accentColor}18`, color: t.accentColor, fontWeight: 600, border: `1px solid ${t.accentColor}30` }}>{s}</span>
        ))}
        {skills.soft.filter(Boolean).map((s, i) => (
          <span key={i} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 99, backgroundColor: '#f3f4f6', color: '#374151', fontWeight: 500 }}>{s}</span>
        ))}
      </div>
    );
  }

  if (t.skillStyle === 'dots') {
    const items = [...skills.technical.slice(0, 8)];
    return (
      <div>
        {items.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10 }}>{s}</span>
            <div style={{ display: 'flex', gap: 2 }}>
              {[1,2,3,4,5].map(d => (
                <div key={d} style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: d <= 4 ? 'currentColor' : 'transparent', border: '1px solid currentColor', opacity: d <= 4 ? 1 : 0.4 }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // text style
  return (
    <div>
      {skills.technical.length > 0 && <div style={{ marginBottom: 3, fontSize: 10 }}><strong>Technical:</strong> {skills.technical.join(', ')}</div>}
      {skills.soft.length > 0 && <div style={{ marginBottom: 3, fontSize: 10 }}><strong>Soft:</strong> {skills.soft.join(', ')}</div>}
      {skills.languages.length > 0 && <div style={{ marginBottom: 3, fontSize: 10 }}><strong>Languages:</strong> {skills.languages.join(', ')}</div>}
      {skills.certifications.length > 0 && <div style={{ marginBottom: 3, fontSize: 10 }}><strong>Certifications:</strong> {skills.certifications.join(', ')}</div>}
    </div>
  );
}

// ─── Layout: SINGLE COLUMN ─────────────────────────────────────────────────

function SingleLayout({ data, t }: { data: ResumeData; t: TemplateConfig }) {
  const { personal, summary, experience, education, skills, projects } = data;
  const sp = t.spacing === 'tight' ? 8 : t.spacing === 'relaxed' ? 18 : 13;
  const fs = t.spacing === 'tight' ? 10 : 11;
  const pad = 28;

  return (
    <div style={{ fontFamily: fontStack(t), fontSize: fs, color: '#1a1a1a', lineHeight: 1.55, padding: pad, backgroundColor: '#fff' }}>
      {/* Header */}
      <div style={{ textAlign: t.headerAlign === 'center' ? 'center' : 'left', marginBottom: sp + 4 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: t.accentColor, letterSpacing: '-0.3px' }}>{personal.name || 'Your Name'}</div>
        <div style={{ fontSize: 10, color: '#555', marginTop: 5, lineHeight: 1.6 }}>{contactLine(personal)}</div>
      </div>

      {summary.text && (
        <>
          <SectionTitle label="Summary" t={t} />
          <Divider t={t} />
          <p style={{ fontSize: fs, color: '#333', margin: '0 0 2px', lineHeight: 1.6 }}>{summary.text}</p>
        </>
      )}

      {experience.length > 0 && (
        <>
          <SectionTitle label="Experience" t={t} />
          <Divider t={t} />
          {experience.map((exp) => (
            <div key={exp.id} style={{ marginBottom: sp }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: fs + 1 }}>{exp.title}</div>
                  <div style={{ color: t.accentColor, fontWeight: 600, fontSize: fs }}>{exp.company}{exp.location ? ` — ${exp.location}` : ''}</div>
                </div>
                <div style={{ fontSize: 9, color: '#666', whiteSpace: 'nowrap', marginLeft: 8 }}>{exp.startDate}{(exp.endDate || exp.current) ? ` – ${exp.current ? 'Present' : exp.endDate}` : ''}</div>
              </div>
              {exp.bullets.filter(Boolean).length > 0 && (
                <ul style={{ margin: '5px 0 0', paddingLeft: 16 }}>
                  {exp.bullets.filter(Boolean).map((b, i) => <li key={i} style={{ fontSize: fs - 1, color: '#333', marginBottom: 2, lineHeight: 1.5 }}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </>
      )}

      {education.length > 0 && (
        <>
          <SectionTitle label="Education" t={t} />
          <Divider t={t} />
          {education.map((edu) => (
            <div key={edu.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: sp / 2 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: fs }}>{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</div>
                <div style={{ color: t.accentColor, fontSize: fs - 1 }}>{edu.school}{edu.gpa ? ` • GPA ${edu.gpa}` : ''}</div>
              </div>
              <div style={{ fontSize: 9, color: '#666', whiteSpace: 'nowrap' }}>{edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ''}</div>
            </div>
          ))}
        </>
      )}

      {(skills.technical.length > 0 || skills.soft.length > 0) && (
        <>
          <SectionTitle label="Skills" t={t} />
          <Divider t={t} />
          <Skills t={t} skills={skills} />
        </>
      )}

      {projects.length > 0 && (
        <>
          <SectionTitle label="Projects" t={t} />
          <Divider t={t} />
          {projects.map((proj) => (
            <div key={proj.id} style={{ marginBottom: sp }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 700, fontSize: fs }}>{proj.name}{proj.url ? <span style={{ fontWeight: 400, fontSize: 9, color: t.accentColor }}> • {proj.url}</span> : ''}</span>
                {proj.technologies.length > 0 && <span style={{ fontSize: 9, color: '#666' }}>{proj.technologies.join(', ')}</span>}
              </div>
              {proj.description && <div style={{ fontSize: fs - 1, color: '#444', marginTop: 1 }}>{proj.description}</div>}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ─── Layout: BANNER ────────────────────────────────────────────────────────

function BannerLayout({ data, t }: { data: ResumeData; t: TemplateConfig }) {
  const { personal, summary, experience, education, skills, projects } = data;
  const sp = 13;
  const fs = 11;

  return (
    <div style={{ fontFamily: fontStack(t), fontSize: fs, color: '#1a1a1a', lineHeight: 1.55, backgroundColor: '#fff' }}>
      {/* Banner header */}
      <div style={{ backgroundColor: t.accentColor, padding: '22px 28px 18px' }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', textAlign: t.headerAlign === 'center' ? 'center' : 'left', letterSpacing: '-0.3px' }}>{personal.name || 'Your Name'}</div>
        <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.8)', marginTop: 6, textAlign: t.headerAlign === 'center' ? 'center' : 'left' }}>{contactLine(personal)}</div>
      </div>

      {/* Body */}
      <div style={{ padding: '20px 28px 28px' }}>
        {summary.text && (
          <>
            <SectionTitle label="Summary" t={t} />
            <Divider t={t} />
            <p style={{ fontSize: fs, color: '#333', margin: '0 0 2px' }}>{summary.text}</p>
          </>
        )}

        {experience.length > 0 && (
          <>
            <SectionTitle label="Experience" t={t} />
            <Divider t={t} />
            {experience.map((exp) => (
              <div key={exp.id} style={{ marginBottom: sp }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{exp.title}</div>
                    <div style={{ color: t.accentColor, fontWeight: 600, fontSize: fs }}>{exp.company}{exp.location ? ` — ${exp.location}` : ''}</div>
                  </div>
                  <div style={{ fontSize: 9, color: '#666', whiteSpace: 'nowrap' }}>{exp.startDate}{(exp.endDate || exp.current) ? ` – ${exp.current ? 'Present' : exp.endDate}` : ''}</div>
                </div>
                {exp.bullets.filter(Boolean).length > 0 && (
                  <ul style={{ margin: '5px 0 0', paddingLeft: 16 }}>
                    {exp.bullets.filter(Boolean).map((b, i) => <li key={i} style={{ fontSize: fs - 1, color: '#333', marginBottom: 2 }}>{b}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </>
        )}

        {education.length > 0 && (
          <>
            <SectionTitle label="Education" t={t} />
            <Divider t={t} />
            {education.map((edu) => (
              <div key={edu.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: sp / 2 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</div>
                  <div style={{ color: t.accentColor, fontSize: fs - 1 }}>{edu.school}{edu.gpa ? ` • GPA ${edu.gpa}` : ''}</div>
                </div>
                <div style={{ fontSize: 9, color: '#666' }}>{edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ''}</div>
              </div>
            ))}
          </>
        )}

        {(skills.technical.length > 0 || skills.soft.length > 0) && (
          <>
            <SectionTitle label="Skills" t={t} />
            <Divider t={t} />
            <Skills t={t} skills={skills} />
          </>
        )}

        {projects.length > 0 && (
          <>
            <SectionTitle label="Projects" t={t} />
            <Divider t={t} />
            {projects.map((proj) => (
              <div key={proj.id} style={{ marginBottom: sp }}>
                <div style={{ fontWeight: 700 }}>{proj.name}{proj.technologies.length > 0 ? <span style={{ fontWeight: 400, fontSize: 9, color: '#666' }}> · {proj.technologies.join(', ')}</span> : ''}</div>
                {proj.description && <div style={{ fontSize: fs - 1, color: '#444' }}>{proj.description}</div>}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Layout: TIMELINE ──────────────────────────────────────────────────────

function TimelineLayout({ data, t }: { data: ResumeData; t: TemplateConfig }) {
  const { personal, summary, experience, education, skills } = data;
  const fs = 11;
  const sp = 13;

  return (
    <div style={{ fontFamily: fontStack(t), fontSize: fs, color: '#1a1a1a', lineHeight: 1.55, padding: 28, backgroundColor: '#fff' }}>
      {/* Header */}
      <div style={{ marginBottom: sp + 4 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: t.accentColor }}>{personal.name || 'Your Name'}</div>
        <div style={{ fontSize: 10, color: '#555', marginTop: 4 }}>{contactLine(personal)}</div>
      </div>

      {summary.text && (
        <>
          <SectionTitle label="Summary" t={t} />
          <Divider t={t} />
          <p style={{ fontSize: fs, color: '#333', margin: '0 0 4px' }}>{summary.text}</p>
        </>
      )}

      {experience.length > 0 && (
        <>
          <SectionTitle label="Experience" t={t} />
          <Divider t={t} />
          {/* Timeline vertical line */}
          <div style={{ position: 'relative', paddingLeft: 20 }}>
            <div style={{ position: 'absolute', left: 5, top: 0, bottom: 0, width: 2, backgroundColor: `${t.accentColor}30` }} />
            {experience.map((exp, idx) => (
              <div key={exp.id} style={{ position: 'relative', marginBottom: sp + 2 }}>
                {/* Dot */}
                <div style={{ position: 'absolute', left: -17, top: 4, width: 10, height: 10, borderRadius: '50%', backgroundColor: t.accentColor, border: '2px solid #fff', boxShadow: `0 0 0 2px ${t.accentColor}` }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: fs + 1 }}>{exp.title}</div>
                    <div style={{ color: t.accentColor, fontWeight: 600, fontSize: fs }}>{exp.company}{exp.location ? ` — ${exp.location}` : ''}</div>
                  </div>
                  <div style={{ fontSize: 9, color: '#666', whiteSpace: 'nowrap', marginLeft: 8 }}>{exp.startDate}{(exp.endDate || exp.current) ? ` – ${exp.current ? 'Present' : exp.endDate}` : ''}</div>
                </div>
                {exp.bullets.filter(Boolean).length > 0 && (
                  <ul style={{ margin: '5px 0 0', paddingLeft: 14 }}>
                    {exp.bullets.filter(Boolean).map((b, i) => <li key={i} style={{ fontSize: fs - 1, color: '#333', marginBottom: 2 }}>{b}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {education.length > 0 && (
        <>
          <SectionTitle label="Education" t={t} />
          <Divider t={t} />
          {education.map((edu) => (
            <div key={edu.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: sp / 2 }}>
              <div>
                <div style={{ fontWeight: 700 }}>{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</div>
                <div style={{ color: t.accentColor, fontSize: fs - 1 }}>{edu.school}</div>
              </div>
              <div style={{ fontSize: 9, color: '#666' }}>{edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ''}</div>
            </div>
          ))}
        </>
      )}

      {(skills.technical.length > 0 || skills.soft.length > 0) && (
        <>
          <SectionTitle label="Skills" t={t} />
          <Divider t={t} />
          <Skills t={t} skills={skills} />
        </>
      )}
    </div>
  );
}

// ─── Layout: SIDEBAR ───────────────────────────────────────────────────────

function SidebarLayout({ data, t }: { data: ResumeData; t: TemplateConfig }) {
  const { personal, summary, experience, education, skills, projects } = data;
  const sidebarBg = t.sidebarBg || '#1e3a5f';
  const sidebarText = t.sidebarText || '#ffffff';
  const fs = 10;
  const sp = 12;

  const sidebarSectionTitle: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: `${sidebarText}99`,
    marginTop: 16,
    marginBottom: 6,
    borderBottom: `1px solid ${sidebarText}30`,
    paddingBottom: 4,
  };

  return (
    <div style={{ fontFamily: fontStack(t), fontSize: fs, color: '#1a1a1a', display: 'flex', minHeight: '100%', backgroundColor: '#fff' }}>
      {/* Sidebar */}
      <div style={{ width: '34%', backgroundColor: sidebarBg, color: sidebarText, padding: '24px 16px', flexShrink: 0 }}>
        {/* Name in sidebar */}
        <div style={{ fontSize: 16, fontWeight: 800, color: sidebarText, lineHeight: 1.2, marginBottom: 4 }}>{personal.name || 'Your Name'}</div>
        <div style={{ fontSize: 8.5, color: `${sidebarText}80`, marginBottom: 16 }}>{experience[0]?.title || 'Professional'}</div>

        {/* Contact */}
        <div style={{ marginBottom: 16 }}>
          <div style={sidebarSectionTitle}>Contact</div>
          {[personal.email, personal.phone, personal.location].filter(Boolean).map((c, i) => (
            <div key={i} style={{ fontSize: 9, color: `${sidebarText}cc`, marginBottom: 4, wordBreak: 'break-all' }}>{c}</div>
          ))}
          {personal.linkedin && <div style={{ fontSize: 9, color: `${sidebarText}cc`, marginBottom: 4 }}>{personal.linkedin}</div>}
          {personal.github && <div style={{ fontSize: 9, color: `${sidebarText}cc`, marginBottom: 4 }}>{personal.github}</div>}
        </div>

        {/* Skills */}
        {skills.technical.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={sidebarSectionTitle}>Skills</div>
            {t.skillStyle === 'dots' ? (
              skills.technical.filter(Boolean).slice(0, 8).map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 9, color: sidebarText }}>{s}</span>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1,2,3,4,5].map(d => (
                      <div key={d} style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: d <= 4 ? sidebarText : 'transparent', border: `1px solid ${sidebarText}60`, opacity: d <= 4 ? 0.9 : 0.4 }} />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {skills.technical.filter(Boolean).map((s, i) => (
                  <span key={i} style={{ fontSize: 8, padding: '2px 6px', borderRadius: 99, backgroundColor: `${sidebarText}20`, color: sidebarText, border: `1px solid ${sidebarText}40` }}>{s}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Languages */}
        {skills.languages.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={sidebarSectionTitle}>Languages</div>
            {skills.languages.filter(Boolean).map((lang, i) => (
              <div key={i} style={{ fontSize: 9, color: `${sidebarText}cc`, marginBottom: 3 }}>{lang}</div>
            ))}
          </div>
        )}

        {/* Education in sidebar */}
        {education.length > 0 && (
          <div>
            <div style={sidebarSectionTitle}>Education</div>
            {education.map((edu) => (
              <div key={edu.id} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: sidebarText }}>{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</div>
                <div style={{ fontSize: 8.5, color: `${sidebarText}bb`, marginTop: 2 }}>{edu.school}</div>
                <div style={{ fontSize: 8, color: `${sidebarText}80`, marginTop: 1 }}>{edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ''}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '24px 22px' }}>
        {summary.text && (
          <div style={{ marginBottom: sp + 2 }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.accentColor, marginBottom: 4 }}>Profile</div>
            <div style={{ borderTop: `2px solid ${t.accentColor}`, marginBottom: 8 }} />
            <p style={{ fontSize: fs, color: '#333', margin: 0, lineHeight: 1.6 }}>{summary.text}</p>
          </div>
        )}

        {experience.length > 0 && (
          <div style={{ marginBottom: sp }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.accentColor, marginBottom: 4 }}>Work Experience</div>
            <div style={{ borderTop: `2px solid ${t.accentColor}`, marginBottom: 8 }} />
            {experience.map((exp) => (
              <div key={exp.id} style={{ marginBottom: sp }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: fs + 1 }}>{exp.title}</div>
                    <div style={{ color: t.accentColor, fontWeight: 600, fontSize: fs }}>{exp.company}{exp.location ? ` — ${exp.location}` : ''}</div>
                  </div>
                  <div style={{ fontSize: 9, color: '#666', whiteSpace: 'nowrap', marginLeft: 8, background: `${t.accentColor}12`, padding: '2px 6px', borderRadius: 4 }}>{exp.startDate}{(exp.endDate || exp.current) ? ` – ${exp.current ? 'Present' : exp.endDate}` : ''}</div>
                </div>
                {exp.bullets.filter(Boolean).length > 0 && (
                  <ul style={{ margin: '5px 0 0', paddingLeft: 14 }}>
                    {exp.bullets.filter(Boolean).map((b, i) => <li key={i} style={{ fontSize: fs - 1, color: '#333', marginBottom: 2 }}>{b}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {projects.length > 0 && (
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.accentColor, marginBottom: 4 }}>Projects</div>
            <div style={{ borderTop: `2px solid ${t.accentColor}`, marginBottom: 8 }} />
            {projects.map((proj) => (
              <div key={proj.id} style={{ marginBottom: sp / 2 }}>
                <div style={{ fontWeight: 700, fontSize: fs }}>{proj.name}{proj.technologies.length > 0 ? <span style={{ fontWeight: 400, fontSize: 9, color: '#666' }}> · {proj.technologies.join(', ')}</span> : ''}</div>
                {proj.description && <div style={{ fontSize: fs - 1, color: '#444' }}>{proj.description}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Layout: TWO COLUMN ────────────────────────────────────────────────────

function TwoColLayout({ data, t }: { data: ResumeData; t: TemplateConfig }) {
  const { personal, summary, experience, education, skills, projects } = data;
  const fs = 10;
  const sp = 11;
  const isMercury = t.id === 'mercury';
  const leftWidth = isMercury ? '32%' : '38%';

  const sTitle: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: t.accentColor,
    marginTop: 14,
    marginBottom: 5,
    paddingBottom: 3,
    borderBottom: t.dividerStyle === 'none' ? 'none' : `1.5px solid ${t.accentColor}40`,
  };

  return (
    <div style={{ fontFamily: fontStack(t), fontSize: fs, color: '#1a1a1a', lineHeight: 1.55, backgroundColor: '#fff' }}>
      {/* Full-width header */}
      <div style={{ padding: '20px 24px 16px', borderBottom: `3px solid ${t.accentColor}` }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: t.accentColor }}>{personal.name || 'Your Name'}</div>
        <div style={{ fontSize: 9.5, color: '#555', marginTop: 4 }}>{contactLine(personal)}</div>
      </div>

      {/* Two columns */}
      <div style={{ display: 'flex', padding: 0 }}>
        {/* Left column */}
        <div style={{ width: leftWidth, padding: '16px 16px 24px 24px', borderRight: `1px solid #e5e7eb` }}>
          {summary.text && (
            <>
              <div style={sTitle}>Summary</div>
              <p style={{ fontSize: fs, color: '#333', margin: 0, lineHeight: 1.6 }}>{summary.text}</p>
            </>
          )}

          {(skills.technical.length > 0 || skills.soft.length > 0) && (
            <>
              <div style={sTitle}>Skills</div>
              <Skills t={t} skills={skills} />
            </>
          )}

          {skills.languages.length > 0 && (
            <>
              <div style={sTitle}>Languages</div>
              {skills.languages.filter(Boolean).map((lang, i) => (
                <div key={i} style={{ fontSize: fs - 1, marginBottom: 3 }}>{lang}</div>
              ))}
            </>
          )}

          {education.length > 0 && (
            <>
              <div style={sTitle}>Education</div>
              {education.map((edu) => (
                <div key={edu.id} style={{ marginBottom: sp }}>
                  <div style={{ fontWeight: 700, fontSize: fs }}>{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</div>
                  <div style={{ color: t.accentColor, fontSize: fs - 1 }}>{edu.school}</div>
                  <div style={{ fontSize: 9, color: '#666' }}>{edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ''}</div>
                  {edu.gpa && <div style={{ fontSize: 9, color: '#666' }}>GPA: {edu.gpa}</div>}
                </div>
              ))}
            </>
          )}

          {skills.certifications.length > 0 && (
            <>
              <div style={sTitle}>Certifications</div>
              {skills.certifications.filter(Boolean).map((c, i) => (
                <div key={i} style={{ fontSize: fs - 1, marginBottom: 3 }}>• {c}</div>
              ))}
            </>
          )}
        </div>

        {/* Right column */}
        <div style={{ flex: 1, padding: '16px 24px 24px 16px' }}>
          {experience.length > 0 && (
            <>
              <div style={sTitle}>Experience</div>
              {experience.map((exp) => (
                <div key={exp.id} style={{ marginBottom: sp }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: fs + 1 }}>{exp.title}</div>
                      <div style={{ color: t.accentColor, fontWeight: 600, fontSize: fs }}>{exp.company}{exp.location ? ` — ${exp.location}` : ''}</div>
                    </div>
                    <div style={{ fontSize: 9, color: '#666', whiteSpace: 'nowrap', marginLeft: 6 }}>{exp.startDate}{(exp.endDate || exp.current) ? ` – ${exp.current ? 'Present' : exp.endDate}` : ''}</div>
                  </div>
                  {exp.bullets.filter(Boolean).length > 0 && (
                    <ul style={{ margin: '4px 0 0', paddingLeft: 14 }}>
                      {exp.bullets.filter(Boolean).map((b, i) => <li key={i} style={{ fontSize: fs - 1, color: '#333', marginBottom: 2 }}>{b}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </>
          )}

          {projects.length > 0 && (
            <>
              <div style={sTitle}>Projects</div>
              {projects.map((proj) => (
                <div key={proj.id} style={{ marginBottom: sp }}>
                  <div style={{ fontWeight: 700, fontSize: fs }}>{proj.name}{proj.technologies.length > 0 ? <span style={{ fontWeight: 400, fontSize: 9, color: '#888' }}> · {proj.technologies.join(', ')}</span> : ''}</div>
                  {proj.url && <div style={{ fontSize: 9, color: t.accentColor }}>{proj.url}</div>}
                  {proj.description && <div style={{ fontSize: fs - 1, color: '#444', marginTop: 2 }}>{proj.description}</div>}
                  {proj.bullets.filter(Boolean).length > 0 && (
                    <ul style={{ margin: '4px 0 0', paddingLeft: 14 }}>
                      {proj.bullets.filter(Boolean).map((b, i) => <li key={i} style={{ fontSize: fs - 1, color: '#333', marginBottom: 2 }}>{b}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Layout: TRADITIONAL ──────────────────────────────────────────────────
// Matches the Abhay Gupta screenshot exactly:
// ALL CAPS serif name, centered contact with icons, skills-first with bold labels,
// bold job title + date, italic company + location, bullet points

function TraditionalLayout({ data }: { data: ResumeData }) {
  const { personal, summary, experience, education, skills, projects } = data;
  const SERIF = 'Georgia, "Times New Roman", serif';
  const fs = 11;

  const HR = () => (
    <div style={{ borderTop: '1px solid #000', margin: '3px 0 7px' }} />
  );

  const SecTitle = ({ label }: { label: string }) => (
    <div>
      <div style={{ fontSize: 13, fontWeight: 400, fontFamily: SERIF, marginTop: 12, marginBottom: 2, color: '#000' }}>{label}</div>
      <HR />
    </div>
  );

  // Contact row with separators
  const contacts = [
    personal.phone && `📞 ${personal.phone}`,
    personal.email && `✉ ${personal.email}`,
    personal.linkedin && `🔗 ${personal.linkedin}`,
    personal.github && `⚙ ${personal.github}`,
    personal.website && `🌐 ${personal.website}`,
  ].filter(Boolean);

  // Skills categories
  const skillCats: { label: string; value: string }[] = [
    skills.technical.length > 0 && { label: 'Technical Skills', value: skills.technical.join(', ') },
    skills.languages.length > 0 && { label: 'Languages', value: skills.languages.join(', ') },
    skills.soft.length > 0 && { label: 'Soft Skills', value: skills.soft.join(', ') },
    skills.certifications.length > 0 && { label: 'Certifications', value: skills.certifications.join(', ') },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div style={{ fontFamily: SERIF, fontSize: fs, color: '#000', lineHeight: 1.5, padding: '28px 36px', backgroundColor: '#fff' }}>

      {/* ── Name ── */}
      <div style={{ textAlign: 'center', marginBottom: 6 }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: SERIF }}>
          {personal.name || 'Your Name'}
        </div>
        {personal.location && (
          <div style={{ fontSize: fs, marginTop: 2 }}>{personal.location}</div>
        )}
      </div>

      {/* ── Contact row ── */}
      {contacts.length > 0 && (
        <div style={{ textAlign: 'center', fontSize: 10, marginBottom: 10, lineHeight: 1.8 }}>
          {contacts.join('   ')}
        </div>
      )}

      <HR />

      {/* ── Skills (shown first, as in the screenshot) ── */}
      {skillCats.length > 0 && (
        <div>
          <SecTitle label="Skills" />
          {skillCats.map((cat, i) => (
            <div key={i} style={{ fontSize: fs, marginBottom: 3, lineHeight: 1.5 }}>
              <strong>{cat.label}:</strong> {cat.value}
            </div>
          ))}
        </div>
      )}

      {/* ── Summary (if provided) ── */}
      {summary.text && (
        <div>
          <SecTitle label="Summary" />
          <p style={{ margin: 0, fontSize: fs, lineHeight: 1.6 }}>{summary.text}</p>
        </div>
      )}

      {/* ── Experience ── */}
      {experience.length > 0 && (
        <div>
          <SecTitle label="Experience" />
          {experience.map((exp) => (
            <div key={exp.id} style={{ marginBottom: 12 }}>
              {/* Row 1: bold title + bold date range */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontWeight: 700, fontSize: fs }}>{exp.title}</div>
                <div style={{ fontWeight: 700, fontSize: fs, whiteSpace: 'nowrap', marginLeft: 8 }}>
                  {exp.startDate}{(exp.endDate || exp.current) ? ` – ${exp.current ? 'Present' : exp.endDate}` : ''}
                </div>
              </div>
              {/* Row 2: italic company + italic location */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontStyle: 'italic', fontSize: fs }}>{exp.company}</div>
                {exp.location && (
                  <div style={{ fontStyle: 'italic', fontSize: fs, whiteSpace: 'nowrap', marginLeft: 8 }}>{exp.location}</div>
                )}
              </div>
              {/* Bullet points */}
              {exp.bullets.filter(Boolean).length > 0 && (
                <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
                  {exp.bullets.filter(Boolean).map((b, i) => (
                    <li key={i} style={{ fontSize: fs, marginBottom: 2, lineHeight: 1.55 }}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Education ── */}
      {education.length > 0 && (
        <div>
          <SecTitle label="Education" />
          {education.map((edu) => (
            <div key={edu.id} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 700 }}>{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</div>
                <div style={{ fontSize: fs, whiteSpace: 'nowrap' }}>{edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ''}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontStyle: 'italic' }}>{edu.school}</div>
                {edu.gpa && <div style={{ fontSize: fs }}>GPA: {edu.gpa}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Projects ── */}
      {projects.length > 0 && (
        <div>
          <SecTitle label="Projects" />
          {projects.map((proj) => (
            <div key={proj.id} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 700 }}>{proj.name}</div>
                {proj.technologies.length > 0 && <div style={{ fontStyle: 'italic', fontSize: fs }}>{proj.technologies.join(', ')}</div>}
              </div>
              {proj.url && <div style={{ fontSize: 10 }}>{proj.url}</div>}
              {proj.description && <div style={{ fontSize: fs, marginTop: 2 }}>{proj.description}</div>}
              {proj.bullets.filter(Boolean).length > 0 && (
                <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
                  {proj.bullets.filter(Boolean).map((b, i) => (
                    <li key={i} style={{ fontSize: fs, marginBottom: 2 }}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────

export function HtmlPreview({ data, templateId }: Props) {
  const t = getTemplate(templateId);

  switch (t.layout) {
    case 'sidebar':      return <SidebarLayout data={data} t={t} />;
    case 'banner':       return <BannerLayout data={data} t={t} />;
    case 'timeline':     return <TimelineLayout data={data} t={t} />;
    case 'two-col':      return <TwoColLayout data={data} t={t} />;
    case 'traditional':  return <TraditionalLayout data={data} />;
    default:             return <SingleLayout data={data} t={t} />;
  }
}
