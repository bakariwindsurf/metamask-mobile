import React, { useCallback, useEffect, useState } from 'react';
import LoaderModal from './LoaderModal';
import Loader from './Loader';

interface SwitchLoadingModalProps {
  loading: boolean;
  loadingText?: unknown;
  error: string;
  }: {?: unknown;
  loading: boolean;?: unknown;
  loadingText: string;?: unknown;
  error?: string;?: unknown;
}

const SwitchLoadingModal = ({
  loading,
  loadingText,
  error,
}: {
  loading: boolean;
  loadingText: string;
  error?: string;
}: SwitchLoadingModalProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(loading || !!error);
  }, [loading, error]);

  const handleVisibility = useCallback(() => {
    setIsVisible(false);
  }, []);

  return (
    <LoaderModal isVisible={isVisible} onCancel={handleVisibility}>
      <Loader
        loadingText={loadingText}
        errorText={error}
        onDismiss={handleVisibility}
      />
    </LoaderModal>
  );
};

export default SwitchLoadingModal;
