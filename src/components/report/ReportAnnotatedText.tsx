import React, {useMemo} from 'react';
import {StyleProp, Text, TextStyle} from 'react-native';
import {ThemedText} from '../ThemedText';
import {catForType, PRONUNCIATION_DEF} from './reportIssueCategories';
import type {AnnotatedIssue} from '../../types/report';

interface Span {
  text: string;
  issue: AnnotatedIssue | null;
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// mistakes (grammar/logic) ve voiceErrors (pronunciation) dizilerine göre metin içinde
// vurgulanacak aralıkları bulur (boostifywrite/src/screens/ReportWriting.tsx'teki
// buildSpans ile aynı mantık; pronunciation eşleşmesi kelime bazlı eklendi)
function buildSpans(text: string, issues: AnnotatedIssue[]): Span[] {
  const marks: { start: number; end: number; issue: AnnotatedIssue }[] = [];

  for (const issue of issues) {
    if (issue.kind === 'pronunciation') {
      const word = issue.word;
      if (!word) continue;
      // Kelime sınırı (\b) ile eşleşir; "in" "shopping" içindeki alt-dizeyle değil
      // sadece bağımsız kelime olarak eşleşsin diye (büyük/küçük harf duyarsız)
      const wordRe = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i');
      const wm = wordRe.exec(text);
      if (wm) marks.push({ start: wm.index, end: wm.index + wm[0].length, issue });
    } else if (issue.type === 'logic-error') {
      const sentence = issue.wrongContent;
      if (sentence) {
        const idx = text.indexOf(sentence);
        if (idx >= 0) {
          marks.push({ start: idx, end: idx + sentence.length, issue });
          continue;
        }
      }
      const ww = issue.wrongWord;
      if (!ww) continue;
      const wi = text.indexOf(ww);
      if (wi >= 0) marks.push({ start: wi, end: wi + ww.length, issue });
    } else {
      const ww = issue.wrongWord;
      if (!ww) continue;
      const wrongContent = issue.wrongContent || '';
      const ctxLen = Math.min(30, wrongContent.length);
      const ctxStart = text.indexOf(wrongContent.substring(0, ctxLen));
      if (ctxStart < 0) continue;
      const wIdx = text.indexOf(ww, ctxStart);
      if (wIdx < 0 || wIdx > ctxStart + wrongContent.length + 20) continue;
      marks.push({ start: wIdx, end: wIdx + ww.length, issue });
    }
  }

  marks.sort((a, b) => a.start - b.start);

  const spans: Span[] = [];
  let pos = 0;
  let lastEnd = 0;
  for (const m of marks) {
    if (m.start < lastEnd) continue;
    if (m.start > pos) spans.push({ text: text.slice(pos, m.start), issue: null });
    spans.push({ text: text.slice(m.start, m.end), issue: m.issue });
    pos = m.end;
    lastEnd = m.end;
  }
  if (pos < text.length) spans.push({ text: text.slice(pos), issue: null });
  return spans;
}

// mistakes/voiceErrors metin içinde renkli vurgulanır, tıklanınca detay modalı açılır.
// `issues` her biri { kind: 'error' | 'pronunciation', ... } şeklinde normalize edilmiş olmalı.
interface ReportAnnotatedTextProps {
  text: string | null | undefined;
  issues: AnnotatedIssue[] | null | undefined;
  onIssuePress: (issue: AnnotatedIssue) => void;
  style?: StyleProp<TextStyle>;
}

export default function ReportAnnotatedText({ text, issues, onIssuePress, style }: ReportAnnotatedTextProps) {
  const spans = useMemo(() => buildSpans(text || '', issues || []), [text, issues]);
  let logicCount = 0;

  return (
    <ThemedText style={style}>
      {spans.map((span, i) => {
        if (!span.issue) {
          return <Text key={i}>{span.text}</Text>;
        }

        const issue = span.issue;
        const cat = issue.kind === 'pronunciation' ? PRONUNCIATION_DEF : catForType(issue.type);
        const isLogic = issue.kind === 'error' && issue.type === 'logic-error';
        if (isLogic) logicCount += 1;
        const num = logicCount;

        return (
          <Text
            key={i}
            suppressHighlighting
            onPress={() => onIssuePress(issue)}
            style={{
              backgroundColor: cat.bg,
              color: isLogic ? '#3A3A3A' : cat.color,
              paddingHorizontal: 3,
            }}
          >
            {isLogic && (
              <Text style={{ fontSize: 11, color: '#fff', backgroundColor: '#c00' }}>
                {` ${num} `}
              </Text>
            )}
            {isLogic ? ` ${span.text}` : span.text}
          </Text>
        );
      })}
    </ThemedText>
  );
}
