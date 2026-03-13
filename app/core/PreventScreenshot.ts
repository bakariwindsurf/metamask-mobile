import { NativeModules, Platform } from 'react-native';
import { isQa } from '../util/test/utils';

const isAndroid = Platform.OS === 'android';

interface PreventScreenshotModule {
  forbid: () => boolean;
  allow: () => boolean;
}

const PreventScreenshot: PreventScreenshotModule = {
  forbid: isQa
    ? () => true
    : isAndroid
    ? NativeModules.PreventScreenshot.forbid
    : () => true,
  allow: isQa
    ? () => true
    : isAndroid
    ? NativeModules.PreventScreenshot.allow
    : () => true,
};

export default PreventScreenshot;
