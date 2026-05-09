import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { ResumeData } from '../types';
import { getTemplate, TemplateConfig } from '../templates/templateList';

interface Props { data: ResumeData; templateId: string; }

// ─── Font helpers (react-pdf built-ins only) ──────────────────────────────────
const fN = (t: TemplateConfig) => t.fontFamily === 'serif' ? 'Times-Roman'     : 'Helvetica';
const fB = (t: TemplateConfig) => t.fontFamily === 'serif' ? 'Times-Bold'      : 'Helvetica-Bold';
const fI = (t: TemplateConfig) => t.fontFamily === 'serif' ? 'Times-Italic'    : 'Helvetica-Oblique';

function sp(t: TemplateConfig, base: number) {
  if (t.spacing === 'tight')   return Math.round(base * 0.72);
  if (t.spacing === 'relaxed') return Math.round(base * 1.28);
  return base;
}

function dr(exp: ResumeData['experience'][0]) {
  const end = exp.current ? 'Present' : (exp.endDate || '');
  if (exp.startDate && end) return `${exp.startDate} – ${end}`;
  return exp.startDate || end;
}

function contactRows(p: ResumeData['personal']): [string, string] {
  const r1 = [p.email, p.phone, p.location].filter(Boolean).join('  ·  ');
  const r2 = [p.linkedin, p.github, p.website].filter(Boolean).join('  ·  ');
  return [r1, r2];
}

// ─── Shared sub-renderers ─────────────────────────────────────────────────────

function SectionLabel({ label, t, first = false }: { label: string; t: TemplateConfig; first?: boolean }) {
  const accent = t.accentColor;
  const topMargin = first ? 0 : sp(t, 12);
  return (
    <View style={{ marginTop: topMargin, marginBottom: 4 }}>
      <Text style={{ fontSize: 8.5, fontFamily: fB(t), color: accent, textTransform: 'uppercase', letterSpacing: 1 }}>
        {label}
      </Text>
      {t.dividerStyle !== 'none' && (
        <View style={{
          marginTop: 2,
          borderBottomWidth: t.dividerStyle === 'thick' ? 2 : 0.75,
          borderBottomColor: accent,
          borderBottomStyle: t.dividerStyle === 'dot' ? 'dashed' : 'solid',
        }} />
      )}
    </View>
  );
}

function ExpBlock({ exp, t, gap }: { exp: ResumeData['experience'][0]; t: TemplateConfig; gap: number }) {
  const date = dr(exp);
  const bullets = exp.bullets.filter(Boolean);
  return (
    <View style={{ marginBottom: gap }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, fontFamily: fB(t), color: '#111827' }}>{exp.title}</Text>
          <Text style={{ fontSize: 9.5, fontFamily: fN(t), color: t.accentColor, marginTop: 1 }}>
            {[exp.company, exp.location].filter(Boolean).join(' · ')}
          </Text>
        </View>
        {date ? <Text style={{ fontSize: 8.5, fontFamily: fN(t), color: '#6b7280' }}>{date}</Text> : null}
      </View>
      {bullets.map((b, i) => (
        <View key={i} style={{ flexDirection: 'row', marginTop: 2.5, paddingLeft: 8 }}>
          <Text style={{ fontSize: 9, fontFamily: fN(t), color: '#374151', width: 10 }}>•</Text>
          <Text style={{ fontSize: 9, fontFamily: fN(t), color: '#374151', flex: 1, lineHeight: 1.5 }}>{b}</Text>
        </View>
      ))}
    </View>
  );
}

function EduBlock({ edu, t, gap }: { edu: ResumeData['education'][0]; t: TemplateConfig; gap: number }) {
  const degree = [edu.degree, edu.field ? `in ${edu.field}` : ''].filter(Boolean).join(' ');
  const date = edu.startDate ? `${edu.startDate}${edu.endDate ? ` – ${edu.endDate}` : ''}` : (edu.endDate || '');
  return (
    <View style={{ marginBottom: gap }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, fontFamily: fB(t), color: '#111827' }}>{degree || 'Degree'}</Text>
          <Text style={{ fontSize: 9.5, fontFamily: fN(t), color: t.accentColor, marginTop: 1 }}>
            {edu.school}{edu.gpa ? `  ·  GPA ${edu.gpa}` : ''}
          </Text>
        </View>
        {date ? <Text style={{ fontSize: 8.5, fontFamily: fN(t), color: '#6b7280' }}>{date}</Text> : null}
      </View>
    </View>
  );
}

function ProjBlock({ proj, t, gap }: { proj: ResumeData['projects'][0]; t: TemplateConfig; gap: number }) {
  const bullets = proj.bullets.filter(Boolean);
  return (
    <View style={{ marginBottom: gap }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Text style={{ fontSize: 10, fontFamily: fB(t), color: '#111827', flex: 1 }}>{proj.name}</Text>
        {proj.technologies.length > 0 && (
          <Text style={{ fontSize: 8.5, fontFamily: fI(t), color: '#6b7280' }}>{proj.technologies.slice(0, 4).join(', ')}</Text>
        )}
      </View>
      {proj.url ? <Text style={{ fontSize: 8.5, fontFamily: fN(t), color: t.accentColor, marginTop: 1 }}>{proj.url}</Text> : null}
      {proj.description ? (
        <Text style={{ fontSize: 9, fontFamily: fN(t), color: '#374151', marginTop: 2, lineHeight: 1.5 }}>{proj.description}</Text>
      ) : null}
      {bullets.map((b, i) => (
        <View key={i} style={{ flexDirection: 'row', marginTop: 2.5, paddingLeft: 8 }}>
          <Text style={{ fontSize: 9, fontFamily: fN(t), color: '#374151', width: 10 }}>•</Text>
          <Text style={{ fontSize: 9, fontFamily: fN(t), color: '#374151', flex: 1, lineHeight: 1.5 }}>{b}</Text>
        </View>
      ))}
    </View>
  );
}

function SkillsBlock({ skills, t, dark = false }: { skills: ResumeData['skills']; t: TemplateConfig; dark?: boolean }) {
  const textColor = dark ? '#ffffff' : '#374151';
  const labelColor = dark ? 'rgba(255,255,255,0.6)' : '#6b7280';
  const cats = [
    { label: 'Technical',      items: skills.technical.filter(Boolean) },
    { label: 'Soft Skills',    items: skills.soft.filter(Boolean) },
    { label: 'Languages',      items: skills.languages.filter(Boolean) },
    { label: 'Certifications', items: skills.certifications.filter(Boolean) },
  ].filter(c => c.items.length > 0);
  if (cats.length === 0) return null;
  return (
    <View>
      {cats.map(({ label, items }) => (
        <View key={label} style={{ marginBottom: 4 }}>
          <Text style={{ fontSize: 8.5, fontFamily: fN(t), color: labelColor }}>
            <Text style={{ fontFamily: fB(t) }}>{label}: </Text>
            <Text style={{ color: textColor }}>{items.join(', ')}</Text>
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── SINGLE COLUMN ────────────────────────────────────────────────────────────

function SinglePdf({ data, t }: { data: ResumeData; t: TemplateConfig }) {
  const { personal, summary, experience, education, skills, projects } = data;
  const [r1, r2] = contactRows(personal);
  const PAD = 28;
  const EG = sp(t, 10);
  const SG = sp(t, 12);
  const hasSkills = [skills.technical, skills.soft, skills.languages, skills.certifications].some(a => a.filter(Boolean).length > 0);

  return (
    <Page size="A4" style={{ fontFamily: fN(t), fontSize: 10, color: '#111827', backgroundColor: '#ffffff', padding: PAD }}>
      {/* Header */}
      <View style={{ marginBottom: sp(t, 10), paddingBottom: sp(t, 8), borderBottomWidth: 0.75, borderBottomColor: '#e2e8f0', textAlign: t.headerAlign === 'center' ? 'center' : 'left' }}>
        <Text style={{ fontSize: 20, fontFamily: fB(t), color: t.accentColor, letterSpacing: -0.5, marginBottom: 2 }}>
          {personal.name || 'Your Name'}
        </Text>
        {experience[0]?.title ? (
          <Text style={{ fontSize: 10, fontFamily: fN(t), color: '#64748b', marginBottom: 3 }}>{experience[0].title}</Text>
        ) : null}
        {r1 ? <Text style={{ fontSize: 8.5, fontFamily: fN(t), color: '#4b5563' }}>{r1}</Text> : null}
        {r2 ? <Text style={{ fontSize: 8.5, fontFamily: fN(t), color: '#4b5563', marginTop: 1 }}>{r2}</Text> : null}
      </View>

      {summary.text ? (
        <View style={{ marginBottom: SG }}>
          <SectionLabel label="Professional Summary" t={t} first />
          <Text style={{ fontSize: 9, fontFamily: fN(t), color: '#374151', lineHeight: 1.55 }}>{summary.text}</Text>
        </View>
      ) : null}

      {experience.length > 0 ? (
        <View style={{ marginBottom: SG }}>
          <SectionLabel label="Work Experience" t={t} first={!summary.text} />
          {experience.map(exp => <ExpBlock key={exp.id} exp={exp} t={t} gap={EG} />)}
        </View>
      ) : null}

      {hasSkills ? (
        <View style={{ marginBottom: SG }}>
          <SectionLabel label="Skills" t={t} />
          <SkillsBlock skills={skills} t={t} />
        </View>
      ) : null}

      {education.length > 0 ? (
        <View style={{ marginBottom: SG }}>
          <SectionLabel label="Education" t={t} />
          {education.map(edu => <EduBlock key={edu.id} edu={edu} t={t} gap={sp(t, 7)} />)}
        </View>
      ) : null}

      {projects.length > 0 ? (
        <View>
          <SectionLabel label="Projects" t={t} />
          {projects.map(proj => <ProjBlock key={proj.id} proj={proj} t={t} gap={EG} />)}
        </View>
      ) : null}
    </Page>
  );
}

// ─── BANNER ───────────────────────────────────────────────────────────────────

function BannerPdf({ data, t }: { data: ResumeData; t: TemplateConfig }) {
  const { personal, summary, experience, education, skills, projects } = data;
  const [r1, r2] = contactRows(personal);
  const EG = sp(t, 10);
  const SG = sp(t, 12);
  const hasSkills = [skills.technical, skills.soft, skills.languages, skills.certifications].some(a => a.filter(Boolean).length > 0);

  return (
    <Page size="A4" style={{ fontFamily: fN(t), fontSize: 10, color: '#111827', backgroundColor: '#ffffff' }}>
      {/* Banner */}
      <View style={{ backgroundColor: t.accentColor, padding: '20 28 16', marginBottom: 0 }}>
        <Text style={{ fontSize: 21, fontFamily: fB(t), color: '#ffffff', letterSpacing: -0.4, marginBottom: 2 }}>
          {personal.name || 'Your Name'}
        </Text>
        {experience[0]?.title ? (
          <Text style={{ fontSize: 10, fontFamily: fN(t), color: 'rgba(255,255,255,0.75)', marginBottom: 4 }}>{experience[0].title}</Text>
        ) : null}
        {r1 ? <Text style={{ fontSize: 8.5, fontFamily: fN(t), color: 'rgba(255,255,255,0.70)' }}>{r1}</Text> : null}
        {r2 ? <Text style={{ fontSize: 8.5, fontFamily: fN(t), color: 'rgba(255,255,255,0.70)', marginTop: 1 }}>{r2}</Text> : null}
      </View>

      <View style={{ padding: '18 28 28' }}>
        {summary.text ? (
          <View style={{ marginBottom: SG }}>
            <SectionLabel label="Profile" t={t} first />
            <Text style={{ fontSize: 9, fontFamily: fN(t), color: '#374151', lineHeight: 1.55 }}>{summary.text}</Text>
          </View>
        ) : null}

        {experience.length > 0 ? (
          <View style={{ marginBottom: SG }}>
            <SectionLabel label="Work Experience" t={t} first={!summary.text} />
            {experience.map(exp => <ExpBlock key={exp.id} exp={exp} t={t} gap={EG} />)}
          </View>
        ) : null}

        {hasSkills ? (
          <View style={{ marginBottom: SG }}>
            <SectionLabel label="Skills" t={t} />
            <SkillsBlock skills={skills} t={t} />
          </View>
        ) : null}

        {education.length > 0 ? (
          <View style={{ marginBottom: SG }}>
            <SectionLabel label="Education" t={t} />
            {education.map(edu => <EduBlock key={edu.id} edu={edu} t={t} gap={sp(t, 7)} />)}
          </View>
        ) : null}

        {projects.length > 0 ? (
          <View>
            <SectionLabel label="Projects" t={t} />
            {projects.map(proj => <ProjBlock key={proj.id} proj={proj} t={t} gap={EG} />)}
          </View>
        ) : null}
      </View>
    </Page>
  );
}

// ─── TIMELINE ─────────────────────────────────────────────────────────────────

function TimelinePdf({ data, t }: { data: ResumeData; t: TemplateConfig }) {
  const { personal, summary, experience, education, skills, projects } = data;
  const [r1, r2] = contactRows(personal);
  const EG = sp(t, 11);
  const SG = sp(t, 12);
  const hasSkills = [skills.technical, skills.soft, skills.languages, skills.certifications].some(a => a.filter(Boolean).length > 0);

  return (
    <Page size="A4" style={{ fontFamily: fN(t), fontSize: 10, color: '#111827', backgroundColor: '#ffffff', padding: 28 }}>
      <View style={{ marginBottom: sp(t, 10), paddingBottom: sp(t, 8), borderBottomWidth: 0.75, borderBottomColor: '#e2e8f0' }}>
        <Text style={{ fontSize: 20, fontFamily: fB(t), color: t.accentColor, letterSpacing: -0.5, marginBottom: 2 }}>
          {personal.name || 'Your Name'}
        </Text>
        {experience[0]?.title ? (
          <Text style={{ fontSize: 10, fontFamily: fN(t), color: '#64748b', marginBottom: 3 }}>{experience[0].title}</Text>
        ) : null}
        {r1 ? <Text style={{ fontSize: 8.5, fontFamily: fN(t), color: '#4b5563' }}>{r1}</Text> : null}
        {r2 ? <Text style={{ fontSize: 8.5, fontFamily: fN(t), color: '#4b5563', marginTop: 1 }}>{r2}</Text> : null}
      </View>

      {summary.text ? (
        <View style={{ marginBottom: SG }}>
          <SectionLabel label="Profile" t={t} first />
          <Text style={{ fontSize: 9, fontFamily: fN(t), color: '#374151', lineHeight: 1.55 }}>{summary.text}</Text>
        </View>
      ) : null}

      {experience.length > 0 ? (
        <View style={{ marginBottom: SG }}>
          <SectionLabel label="Experience" t={t} first={!summary.text} />
          {experience.map((exp) => {
            const date = dr(exp);
            const bullets = exp.bullets.filter(Boolean);
            return (
              <View key={exp.id} style={{ flexDirection: 'row', marginBottom: EG }}>
                {/* Timeline dot column */}
                <View style={{ width: 18, alignItems: 'center', paddingTop: 3 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.accentColor }} />
                </View>
                {/* Content */}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 10, fontFamily: fB(t), color: '#111827' }}>{exp.title}</Text>
                      <Text style={{ fontSize: 9.5, fontFamily: fN(t), color: t.accentColor, marginTop: 1 }}>
                        {[exp.company, exp.location].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                    {date ? <Text style={{ fontSize: 8.5, fontFamily: fN(t), color: '#6b7280' }}>{date}</Text> : null}
                  </View>
                  {bullets.map((b, i) => (
                    <View key={i} style={{ flexDirection: 'row', marginTop: 2.5, paddingLeft: 6 }}>
                      <Text style={{ fontSize: 9, fontFamily: fN(t), color: '#374151', width: 10 }}>•</Text>
                      <Text style={{ fontSize: 9, fontFamily: fN(t), color: '#374151', flex: 1, lineHeight: 1.5 }}>{b}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {hasSkills ? (
        <View style={{ marginBottom: SG }}>
          <SectionLabel label="Skills" t={t} />
          <SkillsBlock skills={skills} t={t} />
        </View>
      ) : null}

      {education.length > 0 ? (
        <View style={{ marginBottom: SG }}>
          <SectionLabel label="Education" t={t} />
          {education.map(edu => <EduBlock key={edu.id} edu={edu} t={t} gap={sp(t, 7)} />)}
        </View>
      ) : null}

      {projects.length > 0 ? (
        <View>
          <SectionLabel label="Projects" t={t} />
          {projects.map(proj => <ProjBlock key={proj.id} proj={proj} t={t} gap={EG} />)}
        </View>
      ) : null}
    </Page>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────

function SidebarPdf({ data, t }: { data: ResumeData; t: TemplateConfig }) {
  const { personal, summary, experience, education, skills, projects } = data;
  const sidebarBg   = t.sidebarBg   ?? '#1e3a5f';
  const sidebarText = t.sidebarText ?? '#ffffff';
  const EG = sp(t, 10);
  const hasSkills = [skills.technical, skills.soft, skills.languages, skills.certifications].some(a => a.filter(Boolean).length > 0);

  const sideLabel = (label: string, first = false): React.ReactElement => (
    <View style={{ marginTop: first ? 0 : 12, marginBottom: 4, borderBottomWidth: 0.5, borderBottomColor: `${sidebarText}30`, paddingBottom: 2 }}>
      <Text style={{ fontSize: 7.5, fontFamily: fB(t), color: `${sidebarText}80`, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</Text>
    </View>
  );

  return (
    <Page size="A4" style={{ fontFamily: fN(t), fontSize: 10, color: '#111827', backgroundColor: '#ffffff', flexDirection: 'row' }}>

      {/* Sidebar */}
      <View style={{ width: '33%', backgroundColor: sidebarBg, padding: '26 16 28', flexShrink: 0 }}>
        <Text style={{ fontSize: 15, fontFamily: fB(t), color: sidebarText, lineHeight: 1.2, marginBottom: 2 }}>
          {personal.name || 'Your Name'}
        </Text>
        {experience[0]?.title ? (
          <Text style={{ fontSize: 8.5, fontFamily: fN(t), color: `${sidebarText}70`, marginBottom: 12 }}>{experience[0].title}</Text>
        ) : null}

        {sideLabel('Contact', true)}
        {personal.email    ? <Text style={{ fontSize: 8.5, fontFamily: fN(t), color: `${sidebarText}cc`, marginBottom: 3 }}>{personal.email}</Text>    : null}
        {personal.phone    ? <Text style={{ fontSize: 8.5, fontFamily: fN(t), color: `${sidebarText}cc`, marginBottom: 3 }}>{personal.phone}</Text>    : null}
        {personal.location ? <Text style={{ fontSize: 8.5, fontFamily: fN(t), color: `${sidebarText}cc`, marginBottom: 3 }}>{personal.location}</Text> : null}
        {personal.linkedin ? <Text style={{ fontSize: 8, fontFamily: fN(t), color: `${sidebarText}aa`, marginBottom: 2 }}>{personal.linkedin}</Text>   : null}
        {personal.github   ? <Text style={{ fontSize: 8, fontFamily: fN(t), color: `${sidebarText}aa`, marginBottom: 2 }}>{personal.github}</Text>     : null}
        {personal.website  ? <Text style={{ fontSize: 8, fontFamily: fN(t), color: `${sidebarText}aa`, marginBottom: 2 }}>{personal.website}</Text>    : null}

        {hasSkills ? (
          <>
            {sideLabel('Skills')}
            <SkillsBlock skills={skills} t={t} dark />
          </>
        ) : null}

        {education.length > 0 ? (
          <>
            {sideLabel('Education')}
            {education.map((edu) => {
              const degree = [edu.degree, edu.field ? `in ${edu.field}` : ''].filter(Boolean).join(' ');
              return (
                <View key={edu.id} style={{ marginBottom: 9 }}>
                  <Text style={{ fontSize: 8.5, fontFamily: fB(t), color: sidebarText, lineHeight: 1.3 }}>{degree}</Text>
                  <Text style={{ fontSize: 8, fontFamily: fN(t), color: `${sidebarText}bb`, marginTop: 1 }}>{edu.school}</Text>
                  {(edu.startDate || edu.endDate) ? (
                    <Text style={{ fontSize: 7.5, fontFamily: fN(t), color: `${sidebarText}70`, marginTop: 1 }}>
                      {edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ''}
                    </Text>
                  ) : null}
                  {edu.gpa ? <Text style={{ fontSize: 7.5, fontFamily: fN(t), color: `${sidebarText}70` }}>GPA {edu.gpa}</Text> : null}
                </View>
              );
            })}
          </>
        ) : null}
      </View>

      {/* Main */}
      <View style={{ flex: 1, padding: '26 22 28' }}>
        {summary.text ? (
          <View style={{ marginBottom: sp(t, 12) }}>
            <View style={{ marginBottom: 4, borderBottomWidth: 0.75, borderBottomColor: `${t.accentColor}38`, paddingBottom: 2 }}>
              <Text style={{ fontSize: 8.5, fontFamily: fB(t), color: t.accentColor, textTransform: 'uppercase', letterSpacing: 1 }}>Profile</Text>
            </View>
            <Text style={{ fontSize: 9, fontFamily: fN(t), color: '#374151', lineHeight: 1.55 }}>{summary.text}</Text>
          </View>
        ) : null}

        {experience.length > 0 ? (
          <View style={{ marginBottom: sp(t, 12) }}>
            <View style={{ marginBottom: 4, borderBottomWidth: 0.75, borderBottomColor: `${t.accentColor}38`, paddingBottom: 2 }}>
              <Text style={{ fontSize: 8.5, fontFamily: fB(t), color: t.accentColor, textTransform: 'uppercase', letterSpacing: 1 }}>Work Experience</Text>
            </View>
            {experience.map(exp => <ExpBlock key={exp.id} exp={exp} t={t} gap={EG} />)}
          </View>
        ) : null}

        {projects.length > 0 ? (
          <View>
            <View style={{ marginBottom: 4, borderBottomWidth: 0.75, borderBottomColor: `${t.accentColor}38`, paddingBottom: 2 }}>
              <Text style={{ fontSize: 8.5, fontFamily: fB(t), color: t.accentColor, textTransform: 'uppercase', letterSpacing: 1 }}>Projects</Text>
            </View>
            {projects.map(proj => <ProjBlock key={proj.id} proj={proj} t={t} gap={EG} />)}
          </View>
        ) : null}
      </View>
    </Page>
  );
}

// ─── TWO COLUMN ───────────────────────────────────────────────────────────────

function TwoColPdf({ data, t }: { data: ResumeData; t: TemplateConfig }) {
  const { personal, summary, experience, education, skills, projects } = data;
  const [r1, r2] = contactRows(personal);
  const isMercury = t.id === 'mercury';
  const leftW = isMercury ? '30%' : '35%';
  const EG = sp(t, 10);
  const hasSkills = [skills.technical, skills.soft, skills.languages, skills.certifications].some(a => a.filter(Boolean).length > 0);

  const colLabel = (label: string, first = false): React.ReactElement => (
    <View style={{ marginTop: first ? 0 : sp(t, 12), marginBottom: 4, paddingBottom: 2, borderBottomWidth: t.dividerStyle === 'none' ? 0 : 0.75, borderBottomColor: `${t.accentColor}38` }}>
      <Text style={{ fontSize: 8.5, fontFamily: fB(t), color: t.accentColor, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Text>
    </View>
  );

  return (
    <Page size="A4" style={{ fontFamily: fN(t), fontSize: 10, color: '#111827', backgroundColor: '#ffffff' }}>
      {/* Full-width header */}
      <View style={{ padding: '20 24 14', borderBottomWidth: 2, borderBottomColor: t.accentColor }}>
        <Text style={{ fontSize: 20, fontFamily: fB(t), color: t.accentColor, letterSpacing: -0.5, marginBottom: 2 }}>
          {personal.name || 'Your Name'}
        </Text>
        {experience[0]?.title ? (
          <Text style={{ fontSize: 10, fontFamily: fN(t), color: '#64748b', marginBottom: 3 }}>{experience[0].title}</Text>
        ) : null}
        {r1 ? <Text style={{ fontSize: 8.5, fontFamily: fN(t), color: '#4b5563' }}>{r1}</Text> : null}
        {r2 ? <Text style={{ fontSize: 8.5, fontFamily: fN(t), color: '#4b5563', marginTop: 1 }}>{r2}</Text> : null}
      </View>

      {/* Two columns */}
      <View style={{ flexDirection: 'row', flex: 1 }}>
        {/* Left */}
        <View style={{ width: leftW, padding: '16 14 24 22', borderRightWidth: 0.75, borderRightColor: '#e2e8f0' }}>
          {summary.text ? (
            <View style={{ marginBottom: sp(t, 10) }}>
              {colLabel('Profile', true)}
              <Text style={{ fontSize: 8.5, fontFamily: fN(t), color: '#374151', lineHeight: 1.55 }}>{summary.text}</Text>
            </View>
          ) : null}

          {hasSkills ? (
            <View style={{ marginBottom: sp(t, 10) }}>
              {colLabel('Skills', !summary.text)}
              <SkillsBlock skills={skills} t={t} />
            </View>
          ) : null}

          {education.length > 0 ? (
            <View style={{ marginBottom: sp(t, 10) }}>
              {colLabel('Education', !summary.text && !hasSkills)}
              {education.map((edu) => {
                const degree = [edu.degree, edu.field ? `in ${edu.field}` : ''].filter(Boolean).join(' ');
                const date = edu.startDate ? `${edu.startDate}${edu.endDate ? ` – ${edu.endDate}` : ''}` : (edu.endDate || '');
                return (
                  <View key={edu.id} style={{ marginBottom: sp(t, 8) }}>
                    <Text style={{ fontSize: 9.5, fontFamily: fB(t), color: '#111827' }}>{degree}</Text>
                    <Text style={{ fontSize: 9, fontFamily: fN(t), color: t.accentColor, marginTop: 1 }}>{edu.school}</Text>
                    {(date || edu.gpa) ? (
                      <Text style={{ fontSize: 8.5, fontFamily: fN(t), color: '#6b7280', marginTop: 1 }}>
                        {[date, edu.gpa ? `GPA ${edu.gpa}` : ''].filter(Boolean).join('  ·  ')}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ) : null}

          {skills.certifications.filter(Boolean).length > 0 ? (
            <View>
              {colLabel('Certifications')}
              {skills.certifications.filter(Boolean).map((c, i) => (
                <Text key={i} style={{ fontSize: 8.5, fontFamily: fN(t), color: '#374151', marginBottom: 3 }}>• {c}</Text>
              ))}
            </View>
          ) : null}
        </View>

        {/* Right */}
        <View style={{ flex: 1, padding: '16 22 24 16' }}>
          {experience.length > 0 ? (
            <View style={{ marginBottom: sp(t, 12) }}>
              {colLabel('Work Experience', true)}
              {experience.map(exp => <ExpBlock key={exp.id} exp={exp} t={t} gap={EG} />)}
            </View>
          ) : null}

          {projects.length > 0 ? (
            <View>
              {colLabel('Projects', experience.length === 0)}
              {projects.map(proj => <ProjBlock key={proj.id} proj={proj} t={t} gap={EG} />)}
            </View>
          ) : null}
        </View>
      </View>
    </Page>
  );
}

// ─── TRADITIONAL ──────────────────────────────────────────────────────────────

function TraditionalPdf({ data }: { data: ResumeData }) {
  const { personal, summary, experience, education, skills, projects } = data;
  const fs = 10.5;
  const contactParts = [personal.phone, personal.email, personal.linkedin, personal.github, personal.website].filter(Boolean);
  const skillCats = [
    skills.technical.filter(Boolean).length > 0    && { label: 'Technical Skills',  value: skills.technical.filter(Boolean).join(', ') },
    skills.languages.filter(Boolean).length > 0    && { label: 'Languages',          value: skills.languages.filter(Boolean).join(', ') },
    skills.soft.filter(Boolean).length > 0         && { label: 'Soft Skills',        value: skills.soft.filter(Boolean).join(', ') },
    skills.certifications.filter(Boolean).length > 0 && { label: 'Certifications',  value: skills.certifications.filter(Boolean).join(', ') },
  ].filter(Boolean) as { label: string; value: string }[];

  const HR = () => <View style={{ borderBottomWidth: 0.75, borderBottomColor: '#111', marginTop: 2, marginBottom: 7 }} />;
  const SecT = ({ label }: { label: string }) => (
    <View style={{ marginTop: 12 }}>
      <Text style={{ fontSize: 12, fontFamily: 'Times-Bold', color: '#111', marginBottom: 2 }}>{label}</Text>
      <HR />
    </View>
  );

  return (
    <Page size="A4" style={{ fontFamily: 'Times-Roman', fontSize: fs, color: '#000000', backgroundColor: '#ffffff', padding: '28 36 28 36' }}>
      {/* Name */}
      <Text style={{ fontSize: 21, fontFamily: 'Times-Bold', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 3 }}>
        {personal.name || 'Your Name'}
      </Text>
      {personal.location ? <Text style={{ fontSize: fs, fontFamily: 'Times-Roman', textAlign: 'center', marginBottom: 3 }}>{personal.location}</Text> : null}

      {/* Contact — ATS-safe, pipe separated */}
      {contactParts.length > 0 ? (
        <Text style={{ fontSize: 9, fontFamily: 'Times-Roman', textAlign: 'center', color: '#111', marginBottom: 6 }}>
          {contactParts.join('  |  ')}
        </Text>
      ) : null}
      <HR />

      {/* Skills first */}
      {skillCats.length > 0 ? (
        <View>
          <SecT label="Skills" />
          {skillCats.map((cat, i) => (
            <Text key={i} style={{ fontSize: fs, fontFamily: 'Times-Roman', marginBottom: 3, lineHeight: 1.5 }}>
              <Text style={{ fontFamily: 'Times-Bold' }}>{cat.label}: </Text>
              <Text>{cat.value}</Text>
            </Text>
          ))}
        </View>
      ) : null}

      {summary.text ? (
        <View>
          <SecT label="Summary" />
          <Text style={{ fontSize: fs, fontFamily: 'Times-Roman', lineHeight: 1.55 }}>{summary.text}</Text>
        </View>
      ) : null}

      {experience.length > 0 ? (
        <View>
          <SecT label="Experience" />
          {experience.map((exp) => {
            const date = dr(exp);
            return (
              <View key={exp.id} style={{ marginBottom: 11 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Text style={{ fontSize: fs, fontFamily: 'Times-Bold' }}>{exp.title}</Text>
                  <Text style={{ fontSize: fs, fontFamily: 'Times-Bold' }}>{date}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Text style={{ fontSize: fs, fontFamily: 'Times-Italic' }}>{exp.company}</Text>
                  {exp.location ? <Text style={{ fontSize: fs, fontFamily: 'Times-Italic' }}>{exp.location}</Text> : null}
                </View>
                {exp.bullets.filter(Boolean).map((b, i) => (
                  <View key={i} style={{ flexDirection: 'row', marginTop: 2, paddingLeft: 12 }}>
                    <Text style={{ fontSize: fs, fontFamily: 'Times-Roman', width: 12 }}>•</Text>
                    <Text style={{ fontSize: fs, fontFamily: 'Times-Roman', flex: 1, lineHeight: 1.45 }}>{b}</Text>
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      ) : null}

      {education.length > 0 ? (
        <View>
          <SecT label="Education" />
          {education.map((edu) => {
            const degree = [edu.degree, edu.field ? `in ${edu.field}` : ''].filter(Boolean).join(' ');
            const date = `${edu.startDate || ''}${edu.endDate ? ` – ${edu.endDate}` : ''}`;
            return (
              <View key={edu.id} style={{ marginBottom: 7 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: 'Times-Bold', fontSize: fs }}>{degree}</Text>
                  <Text style={{ fontFamily: 'Times-Roman', fontSize: fs }}>{date}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: 'Times-Italic', fontSize: fs }}>{edu.school}</Text>
                  {edu.gpa ? <Text style={{ fontFamily: 'Times-Roman', fontSize: fs }}>GPA: {edu.gpa}</Text> : null}
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {projects.length > 0 ? (
        <View>
          <SecT label="Projects" />
          {projects.map((proj) => (
            <View key={proj.id} style={{ marginBottom: 9 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'Times-Bold', fontSize: fs }}>{proj.name}</Text>
                {proj.technologies.length > 0 ? (
                  <Text style={{ fontFamily: 'Times-Italic', fontSize: fs }}>{proj.technologies.slice(0, 4).join(', ')}</Text>
                ) : null}
              </View>
              {proj.url ? <Text style={{ fontSize: 9, fontFamily: 'Times-Roman' }}>{proj.url}</Text> : null}
              {proj.description ? <Text style={{ fontSize: fs, fontFamily: 'Times-Roman', marginTop: 2, lineHeight: 1.5 }}>{proj.description}</Text> : null}
              {proj.bullets.filter(Boolean).map((b, i) => (
                <View key={i} style={{ flexDirection: 'row', marginTop: 2, paddingLeft: 12 }}>
                  <Text style={{ fontSize: fs, fontFamily: 'Times-Roman', width: 12 }}>•</Text>
                  <Text style={{ fontSize: fs, fontFamily: 'Times-Roman', flex: 1, lineHeight: 1.45 }}>{b}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      ) : null}
    </Page>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function ResumePdfDocument({ data, templateId }: Props) {
  const t = getTemplate(templateId);
  const page = (() => {
    switch (t.layout) {
      case 'banner':      return <BannerPdf      data={data} t={t} />;
      case 'timeline':    return <TimelinePdf    data={data} t={t} />;
      case 'sidebar':     return <SidebarPdf     data={data} t={t} />;
      case 'two-col':     return <TwoColPdf      data={data} t={t} />;
      case 'traditional': return <TraditionalPdf data={data} />;
      default:            return <SinglePdf      data={data} t={t} />;
    }
  })();
  return <Document>{page}</Document>;
}
