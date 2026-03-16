import React, { useCallback } from 'react';
import { TouchableOpacity } from 'react-native';

import ClipboardManager from '../../../core/ClipboardManager';
import Text, {
  TextVariant,
} from '../../../component-library/components/Texts/Text';

interface ClipboardTextProps {
  text: string;
  testID: string;
  styles?: unknown;
  }: {?: unknown;
  text: string;?: unknown;
  testID: string;?: unknown;
  styles: any;?: unknown;
}

const ClipboardText = ({
  text,
  testID,
  styles,
}: {
  text: string;
  testID: string;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  styles: any;
}: ClipboardTextProps) => {
  const copy = useCallback(async () => {
    await ClipboardManager.setString(text);
  }, [text]);

  return (
    <TouchableOpacity
      onPress={copy}
      style={styles.clipboardText}
      testID={testID}
    >
      <Text variant={TextVariant.BodyMD}>{text}</Text>
    </TouchableOpacity>
  );
};

export default ClipboardText;
