import {useEffect, useState} from 'react';
import {generateFileUrl} from '../../services/speak';

// Ses dosyası private (gs://) ise generate-file-url ile imzalı URL alır, değilse doğrudan kullanır
export default function useResolvedAudioUrl(rawAudioUrl: string | null | undefined) {
  const [resolvedAudioUrl, setResolvedAudioUrl] = useState<string | null>(null);
  const [audioResolving, setAudioResolving] = useState(false);

  useEffect(() => {
    if (!rawAudioUrl) {
      setResolvedAudioUrl(null);
      return;
    }

    if (!rawAudioUrl.startsWith('gs://')) {
      setResolvedAudioUrl(rawAudioUrl);
      return;
    }

    let cancelled = false;
    setAudioResolving(true);

    generateFileUrl(rawAudioUrl)
      .then((response) => {
        if (!cancelled && response?.success && response?.data) {
          setResolvedAudioUrl(response.data as string);
        }
      })
      .catch((error) => {
        console.error('generateFileUrl error:', error);
      })
      .finally(() => {
        if (!cancelled) {
          setAudioResolving(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [rawAudioUrl]);

  return { resolvedAudioUrl, audioResolving };
}
