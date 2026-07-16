import {useCallback, useState} from 'react';

// Pronunciation/Language Convention/Logic bottom sheet'i ile metin üzerindeki
// vurgulamalar (ReportAnnotatedText) arasında paylaşılan state: aktif sekme,
// Language Convention filtresi ve açık olan detay modalı (prev/next ile gezinilir)
export default function useReportIssuesPanel() {
  const [activeIssueTab, setActiveIssueTab] = useState('Pronunciation');
  const [lcFilter, setLcFilter] = useState('all');
  const [sheetExpanded, setSheetExpanded] = useState(true);
  const [modalState, setModalState] = useState(null); // { list, index, kind: 'error' | 'pronunciation' }

  const openModal = useCallback((list, index, kind) => {
    if (!list || list.length === 0) return;
    setModalState({ list, index, kind });
  }, []);

  const closeModal = useCallback(() => setModalState(null), []);

  const goPrev = useCallback(() => {
    setModalState((m) => (m ? { ...m, index: Math.max(0, m.index - 1) } : m));
  }, []);

  const goNext = useCallback(() => {
    setModalState((m) => (m ? { ...m, index: Math.min(m.list.length - 1, m.index + 1) } : m));
  }, []);

  // Metinde vurgulanan bir kelimeye/cümleye tıklanınca doğru sekmeye geçip ilgili listeden modalı açar.
  // lists: { pronunciation: [...], languageConvention: [...], logic: [...] }
  const handleIssuePress = useCallback((issue, lists) => {
    if (issue.kind === 'pronunciation') {
      setActiveIssueTab('Pronunciation');
      const idx = (lists.pronunciation || []).findIndex((i) => i === issue || (i.word === issue.word && i.startTime === issue.startTime));
      openModal(lists.pronunciation, idx >= 0 ? idx : 0, 'pronunciation');
      return;
    }

    if (issue.type === 'logic-error') {
      setActiveIssueTab('Logic');
      const idx = (lists.logic || []).findIndex((i) => i === issue);
      openModal(lists.logic, idx >= 0 ? idx : 0, 'error');
      return;
    }

    setActiveIssueTab('Language Convention');
    const idx = (lists.languageConvention || []).findIndex((i) => i === issue);
    openModal(lists.languageConvention, idx >= 0 ? idx : 0, 'error');
  }, [openModal]);

  return {
    activeIssueTab,
    setActiveIssueTab,
    lcFilter,
    setLcFilter,
    sheetExpanded,
    setSheetExpanded,
    modalState,
    openModal,
    closeModal,
    goPrev,
    goNext,
    handleIssuePress,
  };
}
