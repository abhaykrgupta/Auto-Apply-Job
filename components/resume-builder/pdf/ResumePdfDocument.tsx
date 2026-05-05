import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { ResumeData } from '../types';
import { getTemplate } from '../templates/templateList';

interface Props { data: ResumeData; templateId: string; }

export function ResumePdfDocument({ data, templateId }: Props) {
  const t = getTemplate(templateId);
  const { personal, summary, experience, education, skills, projects } = data;
  const accent = t.accentColor;
  const isBanner = t.layout === 'banner';
  const isCentered = t.headerAlign === 'center';
  const spacing = t.spacing === 'tight' ? 6 : t.spacing === 'relaxed' ? 14 : 10;
  const baseFontSize = t.spacing === 'tight' ? 9 : 10;

  const styles = StyleSheet.create({
    page: { fontFamily: t.fontFamily === 'serif' ? 'Times-Roman' : 'Helvetica', fontSize: baseFontSize, color: '#1a1a1a', backgroundColor: '#ffffff' },
    body: { padding: isBanner ? 0 : 28 },
    banner: { backgroundColor: accent, padding: '18 28 14', marginBottom: 14 },
    bannerName: { fontSize: 20, fontFamily: t.fontFamily === 'serif' ? 'Times-Bold' : 'Helvetica-Bold', color: '#ffffff' },
    bannerContact: { fontSize: 9, color: 'rgba(255,255,255,0.85)', marginTop: 3 },
    headerLeft: { marginBottom: spacing },
    name: { fontSize: 20, fontFamily: t.fontFamily === 'serif' ? 'Times-Bold' : 'Helvetica-Bold', color: accent },
    contact: { fontSize: 9, color: '#555555', marginTop: 3 },
    sectionTitle: { fontSize: 10, fontFamily: t.fontFamily === 'serif' ? 'Times-Bold' : 'Helvetica-Bold', color: accent, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: spacing, marginBottom: 4 },
    dividerLine: { borderBottom: `1 solid ${accent}`, marginBottom: 6 },
    dividerThick: { borderBottom: `2.5 solid ${accent}`, marginBottom: 6 },
    dividerDot: { borderBottom: `1 dashed ${accent}`, marginBottom: 6 },
    expRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
    bold: { fontFamily: t.fontFamily === 'serif' ? 'Times-Bold' : 'Helvetica-Bold' },
    small: { fontSize: 9, color: '#666666' },
    accent: { color: accent, fontFamily: t.fontFamily === 'serif' ? 'Times-Bold' : 'Helvetica-Bold' },
    bullet: { flexDirection: 'row', marginBottom: 2, paddingLeft: 8 },
    bulletDot: { width: 10, fontSize: baseFontSize },
    bulletText: { flex: 1, fontSize: baseFontSize - 1, color: '#333333' },
    innerPad: { paddingHorizontal: isBanner ? 28 : 0 },
    entryBlock: { marginBottom: spacing },
  });

  const contactLine = [personal.email, personal.phone, personal.location, personal.linkedin, personal.github, personal.website].filter(Boolean).join(' • ');

  const renderDivider = () => {
    if (t.dividerStyle === 'none') return null;
    if (t.dividerStyle === 'thick') return <View style={styles.dividerThick} />;
    if (t.dividerStyle === 'dot') return <View style={styles.dividerDot} />;
    return <View style={styles.dividerLine} />;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {isBanner ? (
          <View style={styles.banner}>
            <Text style={styles.bannerName}>{personal.name || 'Your Name'}</Text>
            <Text style={styles.bannerContact}>{contactLine}</Text>
          </View>
        ) : (
          <View style={[styles.body, styles.headerLeft]}>
            <Text style={[styles.name, isCentered ? { textAlign: 'center' } : {}]}>{personal.name || 'Your Name'}</Text>
            <Text style={[styles.contact, isCentered ? { textAlign: 'center' } : {}]}>{contactLine}</Text>
          </View>
        )}

        <View style={isBanner ? styles.innerPad : styles.body}>
          {summary.text ? (
            <View>
              <Text style={styles.sectionTitle}>Summary</Text>
              {renderDivider()}
              <Text style={{ fontSize: baseFontSize, color: '#333333' }}>{summary.text}</Text>
            </View>
          ) : null}

          {experience.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Experience</Text>
              {renderDivider()}
              {experience.map((exp, i) => (
                <View key={i} style={styles.entryBlock}>
                  <View style={styles.expRow}>
                    <Text style={styles.bold}>{exp.title}</Text>
                    <Text style={styles.small}>{exp.startDate}{exp.endDate || exp.current ? ` – ${exp.current ? 'Present' : exp.endDate}` : ''}</Text>
                  </View>
                  <Text style={styles.accent}>{exp.company}{exp.location ? ` • ${exp.location}` : ''}</Text>
                  {exp.bullets.filter(Boolean).map((b, j) => (
                    <View key={j} style={styles.bullet}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>{b}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}

          {education.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Education</Text>
              {renderDivider()}
              {education.map((edu, i) => (
                <View key={i} style={[styles.expRow, { marginBottom: spacing / 2 }]}>
                  <View>
                    <Text style={styles.bold}>{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</Text>
                    <Text style={styles.accent}>{edu.school}{edu.gpa ? ` • GPA: ${edu.gpa}` : ''}</Text>
                  </View>
                  <Text style={styles.small}>{edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ''}</Text>
                </View>
              ))}
            </View>
          )}

          {(skills.technical.length > 0 || skills.soft.length > 0 || skills.languages.length > 0 || skills.certifications.length > 0) && (
            <View>
              <Text style={styles.sectionTitle}>Skills</Text>
              {renderDivider()}
              {skills.technical.length > 0 && <Text style={{ marginBottom: 3 }}><Text style={styles.bold}>Technical: </Text>{skills.technical.join(', ')}</Text>}
              {skills.soft.length > 0 && <Text style={{ marginBottom: 3 }}><Text style={styles.bold}>Soft Skills: </Text>{skills.soft.join(', ')}</Text>}
              {skills.languages.length > 0 && <Text style={{ marginBottom: 3 }}><Text style={styles.bold}>Languages: </Text>{skills.languages.join(', ')}</Text>}
              {skills.certifications.length > 0 && <Text style={{ marginBottom: 3 }}><Text style={styles.bold}>Certifications: </Text>{skills.certifications.join(', ')}</Text>}
            </View>
          )}

          {projects.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Projects</Text>
              {renderDivider()}
              {projects.map((proj, i) => (
                <View key={i} style={styles.entryBlock}>
                  <View style={styles.expRow}>
                    <Text style={styles.bold}>{proj.name}</Text>
                    {proj.technologies.length > 0 && <Text style={styles.small}>{proj.technologies.join(', ')}</Text>}
                  </View>
                  {proj.url ? <Text style={[styles.accent, { fontSize: 9 }]}>{proj.url}</Text> : null}
                  {proj.description ? <Text style={{ fontSize: baseFontSize - 1, color: '#333333', marginTop: 2 }}>{proj.description}</Text> : null}
                  {proj.bullets.filter(Boolean).map((b, j) => (
                    <View key={j} style={styles.bullet}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>{b}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}
