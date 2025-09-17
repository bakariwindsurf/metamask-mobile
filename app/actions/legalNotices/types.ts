import { type Action } from 'redux';

// Action type enum
export enum LegalNoticesActionType {
  STORE_PRIVACY_POLICY_SHOWN_DATE = 'STORE_PRIVACY_POLICY_SHOWN_DATE',
  STORE_PRIVACY_POLICY_CLICKED_OR_CLOSED = 'STORE_PRIVACY_POLICY_CLICKED_OR_CLOSED',
}

export type StorePrivacyPolicyShownDateAction = Action<LegalNoticesActionType.STORE_PRIVACY_POLICY_SHOWN_DATE> & {
  payload: number;
};

export type StorePrivacyPolicyClickedOrClosedAction = Action<LegalNoticesActionType.STORE_PRIVACY_POLICY_CLICKED_OR_CLOSED>;

/**
 * Legal notices actions union type
 */
export type LegalNoticesAction =
  | StorePrivacyPolicyShownDateAction
  | StorePrivacyPolicyClickedOrClosedAction;
