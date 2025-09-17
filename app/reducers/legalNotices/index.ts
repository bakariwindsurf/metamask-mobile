import { RootState } from '..';
import { LegalNoticesAction, LegalNoticesActionType } from '../../actions/legalNotices/types';
import { LegalNoticesState } from './types';

export * from './types';

const currentDate = new Date(Date.now());
const newPrivacyPolicyDate = new Date('2024-06-18T12:00:00Z');
export const isPastPrivacyPolicyDate = currentDate >= newPrivacyPolicyDate;

const initialState: LegalNoticesState = {
  newPrivacyPolicyToastClickedOrClosed: false,
  newPrivacyPolicyToastShownDate: null,
};

export const storePrivacyPolicyShownDate = (timestamp: number) => ({
  type: LegalNoticesActionType.STORE_PRIVACY_POLICY_SHOWN_DATE,
  payload: timestamp,
});

export const storePrivacyPolicyClickedOrClosed = () => ({
  type: LegalNoticesActionType.STORE_PRIVACY_POLICY_CLICKED_OR_CLOSED,
});

export const shouldShowNewPrivacyToastSelector = (
  state: RootState,
): boolean => {
  const {
    newPrivacyPolicyToastShownDate,
    newPrivacyPolicyToastClickedOrClosed,
  } = state.legalNotices;

  if (newPrivacyPolicyToastClickedOrClosed) return false;

  const shownDate = new Date(newPrivacyPolicyToastShownDate || 0);

  const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
  const isRecent =
    currentDate.getTime() - shownDate.getTime() < oneDayInMilliseconds;

  return (
    currentDate.getTime() >= newPrivacyPolicyDate.getTime() &&
    (!newPrivacyPolicyToastShownDate ||
      (isRecent && !newPrivacyPolicyToastClickedOrClosed))
  );
};

const legalNoticesReducer = (
  state: LegalNoticesState = initialState,
  action: LegalNoticesAction,
): LegalNoticesState => {
  switch (action.type) {
    case LegalNoticesActionType.STORE_PRIVACY_POLICY_SHOWN_DATE: {
      if (state.newPrivacyPolicyToastShownDate !== null) {
        return state;
      }

      return {
        ...state,
        newPrivacyPolicyToastShownDate: action.payload,
      };
    }

    case LegalNoticesActionType.STORE_PRIVACY_POLICY_CLICKED_OR_CLOSED: {
      return { ...state, newPrivacyPolicyToastClickedOrClosed: true };
    }

    default:
      return state;
  }
};
export default legalNoticesReducer;
