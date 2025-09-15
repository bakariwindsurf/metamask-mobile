import browserReducer, { browserInitialState } from './index';
import { BrowserActionType } from '../../actions/browser/types';
import AppConstants from '../../core/AppConstants';

describe('browserReducer STORE_FAVICON_URL', () => {
  it('adds favicon in the state', () => {
    const initialState = {
      ...browserInitialState,
    };

    const action = {
      type: BrowserActionType.STORE_FAVICON_URL,
      origin: 'testOrigin',
      url: 'testUrl',
    };

    const expectedState = {
      ...browserInitialState,
      favicons: [{ origin: 'testOrigin', url: 'testUrl' }],
    };

    const newState = browserReducer(initialState, action);

    expect(newState).toEqual(expectedState);
  });

  it('limits the number of stored favicons in state to FAVICON_CACHE_MAX_SIZE', () => {
    const initialState = {
      ...browserInitialState,
      favicons: new Array(AppConstants.FAVICON_CACHE_MAX_SIZE).fill({
        origin: 'oldOrigin',
        url: 'oldUrl',
      }),
    };

    const action = {
      type: BrowserActionType.STORE_FAVICON_URL,
      origin: 'newOrigin',
      url: 'newUrl',
    };

    const expectedState = {
      ...browserInitialState,
      favicons: [
        { origin: 'newOrigin', url: 'newUrl' },
        ...new Array(AppConstants.FAVICON_CACHE_MAX_SIZE - 1).fill({
          origin: 'oldOrigin',
          url: 'oldUrl',
        }),
      ],
    };

    const newState = browserReducer(initialState, action);

    expect(newState).toEqual(expectedState);
  });
});
