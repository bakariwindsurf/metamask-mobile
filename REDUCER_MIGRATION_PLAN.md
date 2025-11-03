# Reducer TypeScript Migration Plan

## Executive Summary

This document outlines a systematic approach for converting 17 reducers in the MetaMask Mobile codebase from using `any` types to properly typed TypeScript interfaces. The migration is critical for:

- **Type Safety**: Eliminating `any` types enforces proper TypeScript strict mode compliance
- **Developer Experience**: Enabling better IDE autocomplete and compile-time error detection
- **Code Quality**: Reducing runtime errors and improving maintainability
- **ESLint Compliance**: Satisfying the `@typescript-eslint/no-explicit-any: 'error'` rule

**Current State**: The `RootState` interface in `app/reducers/index.ts` (lines 59-132) has 17 reducer state properties typed as `any` with TODO comments.

**Goal**: Convert all 17 reducers to use properly typed TypeScript interfaces that can be exported and used throughout the codebase.

---

## Reducer Status Overview

### Already TypeScript (Need Interface Improvements)
6 reducers are already TypeScript but need proper state interface exports or have `any` types in actions:

1. **signatureRequest** (30 lines) - Has inline `StateType`, needs export
2. **rpcEvents** (129 lines) - Has exported `iEventGroup`, needs consistency review
3. **accounts** (41 lines) - Has exported `iAccountEvent`, needs consistency review
4. **legalNotices** (80 lines) - Has action types but state interface needs export
5. **experimentalSettings** (31 lines) - Has inline action type but state needs export
6. **networkOnboarded** (82 lines) - Uses `any` in action payload

### JavaScript Files (Need Full Migration)
11 reducers are JavaScript files requiring complete TypeScript conversion:

**Very Complex** (>200 lines, extensive selectors):
- **swaps** (449 lines)

**Complex** (170-240 lines, multiple concerns):
- **collectibles** (240 lines)
- **notification** (204 lines)
- **transaction** (172 lines)

**Medium** (70-110 lines, focused concerns):
- **browser** (105 lines)
- **settings** (75 lines)

**Simple** (30-70 lines, straightforward state):
- **modals** (63 lines)
- **privacy** (39 lines)

**Very Simple** (<30 lines, minimal state):
- **infuraAvailability** (29 lines)
- **alert** (29 lines)
- **bookmarks** (12 lines)

---

## Migration Prioritization

### Phase 1: Foundation (Very Simple & Already TypeScript)
**Priority**: HIGH | **Complexity**: LOW | **Duration**: 1-2 days

**Rationale**: Quick wins to establish patterns and build momentum. These reducers have minimal dependencies and clear state shapes.

1. **bookmarks** - Array-based state, 2 action types
2. **alert** - Basic alert state, 2 action types
3. **infuraAvailability** - Single boolean flag, 2 action types
4. **signatureRequest** - Already TS, just needs proper export
5. **accounts** - Already TS, needs consistency review
6. **experimentalSettings** - Already TS, needs proper state export

**Dependencies**: None

**Success Criteria**:
- State interfaces properly defined and exported
- RootState updated to use typed interfaces
- No ESLint errors
- Existing functionality unchanged
- Pattern established for subsequent migrations

---

### Phase 2: UI State Management (Simple & Medium)
**Priority**: HIGH | **Complexity**: MEDIUM | **Duration**: 2-3 days

**Rationale**: These reducers manage UI state that is frequently accessed. Converting them early provides immediate benefits to UI development.

1. **modals** - Modal visibility management, frequently accessed
2. **privacy** - Privacy settings, security-sensitive
3. **legalNotices** - Already TS, needs proper state interface
4. **networkOnboarded** - Already TS, needs to remove `any` from actions
5. **settings** - User configuration state, widely used
6. **rpcEvents** - Already TS, needs consistency review

**Dependencies**: None significant

**Success Criteria**:
- All modal/UI state properly typed
- Privacy-related state has strict types
- Settings state interface supports all configuration options
- No runtime behavior changes

---

### Phase 3: Core Features (Medium-Complex)
**Priority**: HIGH | **Complexity**: HIGH | **Duration**: 3-5 days

**Rationale**: These reducers handle critical app functionality. They're complex but not as interconnected as transaction/swaps.

1. **browser** - Browser history, tabs, and whitelist management
   - **Why now**: Core feature, moderate complexity, clear state structure
   - **Dependencies**: None
   - **Risk**: Medium - touches navigation and dApp interactions

2. **notification** - Notification queue management
   - **Why now**: High traffic, but well-contained logic
   - **Dependencies**: Uses transaction types (can define locally initially)
   - **Risk**: Medium - notification system is user-facing

3. **collectibles** - NFT management and favorites
   - **Why now**: High user engagement, many selectors to type
   - **Dependencies**: NftController selectors (already typed)
   - **Risk**: Medium - complex selector chain

**Success Criteria**:
- Browser state includes all tab/history properties
- Notification queue has proper union types for TRANSACTION/SIMPLE notifications
- Collectibles state properly types NFT metadata and favorites structure
- All selectors maintain correct return types

---

### Phase 4: Critical Transaction Features (Complex)
**Priority**: CRITICAL | **Complexity**: VERY HIGH | **Duration**: 5-7 days

**Rationale**: These are the most critical and complex reducers. They should be done last when patterns are well-established and can be given focused attention.

1. **transaction** (172 lines)
   - **Why last**: High complexity, critical functionality, extensive action types
   - **Dependencies**: Engine state types
   - **Risk**: HIGH - transaction flow is mission-critical
   - **Complexity factors**:
     - 11 action types with varying payloads
     - Complex nested transaction state
     - Helper functions need typing
     - High test coverage requirements

2. **swaps** (449 lines)
   - **Why last**: Highest complexity, most extensive selector system
   - **Dependencies**: SwapsController types, token types
   - **Risk**: VERY HIGH - trading feature with financial implications
   - **Complexity factors**:
     - Extensive selector library (15+ selectors)
     - Complex token combination logic
     - Feature flags and liveness state
     - Chain-specific state management
     - Integration with multiple controllers

**Success Criteria**:
- Transaction state interface covers all transaction properties
- All transaction action types properly typed
- Swaps state interface handles per-chain feature flags
- All selectors maintain type safety
- No regression in transaction or swaps functionality
- Comprehensive test coverage maintained

---

## Migration Strategy by Reducer

### Group A: Very Simple Reducers (bookmarks, alert, infuraAvailability)

**Pattern**: Inline interface definition

**Approach**:
1. Rename `.js` to `.ts`
2. Define state interface inline
3. Export state interface with clear naming (e.g., `BookmarksState`)
4. Type action parameter with inline interface
5. Add typed return annotation if needed
6. Update RootState in `index.ts`

**Example** (bookmarks):
```typescript
// app/reducers/bookmarks/index.ts
export interface Bookmark {
  url: string;
  name: string;
}

export type BookmarksState = Bookmark[];

interface BookmarkAction {
  type: 'ADD_BOOKMARK' | 'REMOVE_BOOKMARK';
  bookmark: Bookmark;
}

const bookmarksReducer = (
  state: BookmarksState = [],
  action: BookmarkAction,
): BookmarksState => {
  // ... implementation
};
```

---

### Group B: Already TypeScript (signatureRequest, rpcEvents, accounts, experimentalSettings)

**Pattern**: Review and improve existing types

**Approach**:
1. Review current interface definitions
2. Ensure state interface is exported with proper naming convention
3. Verify action types are properly defined
4. Remove any `any` types from action payloads
5. Add JSDoc comments for clarity
6. Update RootState in `index.ts`

**Example** (signatureRequest):
```typescript
// app/reducers/signatureRequest/index.ts
export interface SignatureRequestState {
  securityAlertResponse?: SecurityAlertResponse;
}

interface SignatureRequestAction {
  type: string;
  securityAlertResponse?: SecurityAlertResponse;
}

const initialState: SignatureRequestState = {
  securityAlertResponse: undefined,
};

const signatureRequestReducer = (
  state: SignatureRequestState = initialState,
  action: SignatureRequestAction,
): SignatureRequestState => {
  // ... implementation
};
```

---

### Group C: Simple UI State (modals, privacy, legalNotices, networkOnboarded)

**Pattern**: Inline interface with typed actions

**Approach**:
1. Rename `.js` to `.ts`
2. Define state interface inline or in separate types file if shared
3. Define action type constants as const assertions
4. Create union type for actions
5. Type reducer function explicitly
6. Update RootState in `index.ts`

**Example** (modals):
```typescript
// app/reducers/modals/index.ts
export interface ModalsState {
  networkModalVisible: boolean;
  shouldNetworkSwitchPopToWallet: boolean;
  collectibleContractModalVisible: boolean;
  dappTransactionModalVisible: boolean;
  signMessageModalVisible: boolean;
  infoNetworkModalVisible?: boolean;
}

type ModalAction =
  | { type: 'TOGGLE_NETWORK_MODAL'; shouldNetworkSwitchPopToWallet: boolean }
  | { type: 'TOGGLE_COLLECTIBLE_CONTRACT_MODAL' }
  | { type: 'TOGGLE_DAPP_TRANSACTION_MODAL'; show: boolean | null }
  | { type: 'TOGGLE_INFO_NETWORK_MODAL'; show?: boolean }
  | { type: 'TOGGLE_SIGN_MODAL'; show?: boolean };

const modalsReducer = (
  state: ModalsState = initialState,
  action: ModalAction,
): ModalsState => {
  // ... implementation
};
```

---

### Group D: Medium Complexity (browser, settings)

**Pattern**: Separate types file for complex interfaces

**Approach**:
1. Create `types.ts` file in reducer directory
2. Define all interfaces and types in types file
3. Rename reducer `.js` to `.ts`
4. Import types from types file
5. Type all functions and selectors
6. Update RootState in `index.ts`

**Example** (browser):
```typescript
// app/reducers/browser/types.ts
export interface BrowserTab {
  id: string;
  url: string;
  linkType?: string;
}

export interface BrowserHistoryEntry {
  url: string;
  name: string;
}

export interface BrowserFavicon {
  origin: string;
  url: string;
}

export interface BrowserState {
  history: BrowserHistoryEntry[];
  whitelist: string[];
  tabs: BrowserTab[];
  favicons: BrowserFavicon[];
  activeTab: string | null;
  visitedDappsByHostname: Record<string, boolean>;
}

export type BrowserAction =
  | { type: 'ADD_TO_VIEWED_DAPP'; hostname: string }
  | { type: 'ADD_TO_BROWSER_HISTORY'; url: string; name: string }
  | { type: 'ADD_TO_BROWSER_WHITELIST'; url: string }
  // ... more action types
```

```typescript
// app/reducers/browser/index.ts
import { BrowserState, BrowserAction } from './types';

const browserReducer = (
  state: BrowserState = initialState,
  action: BrowserAction,
): BrowserState => {
  // ... implementation
};
```

---

### Group E: Complex Selectors (collectibles, notification)

**Pattern**: Separate types file + typed selectors

**Approach**:
1. Create comprehensive types file with all interfaces
2. Convert reducer to TypeScript
3. Type all selectors with explicit return types
4. Use `createSelector` with proper typing
5. Type all helper functions
6. Add JSDoc comments for complex logic
7. Update RootState in `index.ts`

**Example** (notification):
```typescript
// app/reducers/notification/types.ts
import { NotificationTypes } from '../../util/notifications';

export interface TransactionNotification {
  id: string;
  type: typeof NotificationTypes.TRANSACTION;
  isVisible: boolean;
  autodismiss: number;
  transaction: {
    id: string;
    // ... transaction properties
  };
  status: string;
}

export interface SimpleNotification {
  id: string;
  type: typeof NotificationTypes.SIMPLE;
  isVisible: boolean;
  autodismiss: number;
  title: string;
  description: string;
  status: string;
}

export type Notification = TransactionNotification | SimpleNotification;

export interface NotificationState {
  notifications: Notification[];
}

export type NotificationAction =
  | { type: 'HIDE_CURRENT_NOTIFICATION' }
  | { type: 'HIDE_NOTIFICATION_BY_ID'; id: string }
  | { type: 'MODIFY_OR_SHOW_TRANSACTION_NOTIFICATION'; id: string; transaction: any; autodismiss: number; status: string }
  // ... more actions
```

---

### Group F: Very Complex (transaction, swaps)

**Pattern**: Comprehensive types file + incremental migration + extensive testing

**Approach**:
1. **Audit Phase**:
   - Document all current action types
   - Map all state properties and their usage
   - Identify all selectors and their return types
   - Review test coverage

2. **Type Definition Phase**:
   - Create comprehensive `types.ts` file
   - Define all state interfaces with JSDoc
   - Define discriminated union types for all actions
   - Type all helper functions
   - Consider creating barrel export for types

3. **Migration Phase**:
   - Rename `.js` to `.ts`
   - Import types
   - Type reducer function
   - Type all selectors with explicit return types
   - Type all action creators

4. **Testing Phase**:
   - Run all existing tests
   - Add type-specific tests if needed
   - Test in development environment
   - Verify no runtime behavior changes

5. **Integration Phase**:
   - Update RootState in `index.ts`
   - Update any files importing from this reducer
   - Run full test suite
   - Manual testing of critical flows

**Example** (transaction - partial):
```typescript
// app/reducers/transaction/types.ts
export interface Transaction {
  id: string;
  networkID: string;
  origin?: string;
  // ... all transaction properties
}

export interface TransactionState {
  selectedAsset: Record<string, any>; // TODO: Type properly
  transaction: Transaction;
  transactionTo: string | null;
  transactionToName: string | null;
  transactionFromName: string | null;
  // ... all state properties
}

export type TransactionAction =
  | { type: 'NEW_ASSET_TRANSACTION'; selectedAsset: any }
  | { type: 'SET_RECIPIENT'; to: string; alias: string; network: string }
  | { type: 'RESET_TRANSACTION' }
  // ... all 11 action types as discriminated union
```

**Special Considerations for Swaps**:
- Chain-specific state requires generic typing
- Feature flags need proper enum or union types
- Selector return types must be explicit
- Consider extracting selector types to separate file
- Token combination logic needs careful typing

---

## Step-by-Step Process for Single Reducer

### Prerequisites
- TypeScript strict mode enabled (already configured)
- ESLint with `@typescript-eslint/no-explicit-any: 'error'` (already configured)
- Access to existing typed reducers as reference (user, security, rewards, etc.)

### Step 1: Preparation (15-30 minutes)
1. **Create feature branch**:
   ```bash
   git checkout -b devin/{timestamp}-migrate-{reducer-name}-reducer
   ```

2. **Review reducer**:
   - Read through current implementation
   - List all action types
   - Map all state properties
   - Identify dependencies on other typed/untyped code
   - Check for any complex logic that needs understanding

3. **Check references**:
   ```bash
   # Find all files importing this reducer
   grep -r "from.*reducers/{reducer-name}" app/
   ```

### Step 2: Create Types File (30-60 minutes for complex reducers)

For simple reducers, skip this and define types inline.

1. **Create types file**:
   ```bash
   touch app/reducers/{reducer-name}/types.ts
   ```

2. **Define state interface**:
   ```typescript
   // app/reducers/{reducer-name}/types.ts
   
   /**
    * State shape for {reducer-name} reducer
    */
   export interface {ReducerName}State {
     // Document each property
     property1: string;
     property2: number;
     // Use proper types, no 'any'
   }
   ```

3. **Define action types**:
   ```typescript
   // Use discriminated union for type safety
   export type {ReducerName}Action =
     | { type: 'ACTION_TYPE_1'; payload: string }
     | { type: 'ACTION_TYPE_2'; data: number }
     | { type: 'ACTION_TYPE_3' };
   ```

4. **Export any helper types**:
   ```typescript
   // Any types used in multiple places
   export interface HelperType {
     field: string;
   }
   ```

### Step 3: Migrate Reducer File (30-90 minutes depending on complexity)

1. **Rename file**:
   ```bash
   git mv app/reducers/{reducer-name}/index.js app/reducers/{reducer-name}/index.ts
   ```

2. **Add imports**:
   ```typescript
   // For complex reducers with types file
   import { {ReducerName}State, {ReducerName}Action } from './types';
   
   // For simple reducers, define inline
   export interface {ReducerName}State {
     // ...
   }
   ```

3. **Type initial state**:
   ```typescript
   const initialState: {ReducerName}State = {
     // Ensure all properties match interface
   };
   ```

4. **Type reducer function**:
   ```typescript
   const {reducerName}Reducer = (
     state: {ReducerName}State = initialState,
     action: {ReducerName}Action,
   ): {ReducerName}State => {
     switch (action.type) {
       // TypeScript will enforce action payload types here
       case 'ACTION_TYPE_1':
         return {
           ...state,
           property1: action.payload, // TypeScript knows this exists
         };
       // ...
     }
   };
   ```

5. **Type selectors** (if any):
   ```typescript
   import { RootState } from '../index';
   
   export const selector{Name} = (state: RootState): ReturnType => 
     state.{reducerName}.property;
   ```

6. **Type action creators** (if any):
   ```typescript
   export const action{Name} = (
     payload: string,
   ): {ReducerName}Action => ({
     type: 'ACTION_TYPE_1',
     payload,
   });
   ```

### Step 4: Update RootState (5 minutes)

1. **Edit app/reducers/index.ts**:
   ```typescript
   import {reducerName}Reducer, { {ReducerName}State } from './{reducer-name}';
   
   export interface RootState {
     // ...
     {reducerName}: {ReducerName}State; // Remove 'any' and TODO comment
     // ...
   }
   ```

### Step 5: Verification (15-30 minutes)

1. **Run TypeScript compiler**:
   ```bash
   yarn tsc --noEmit
   ```
   - Fix any type errors
   - Ensure no `any` types remain (except in TODO'd areas)

2. **Run ESLint**:
   ```bash
   yarn lint
   ```
   - Fix any linting errors
   - Verify `@typescript-eslint/no-explicit-any` errors are resolved

3. **Run tests**:
   ```bash
   # Unit tests for the reducer
   yarn test app/reducers/{reducer-name}
   
   # Full test suite if time permits
   yarn test
   ```

4. **Build the app**:
   ```bash
   yarn build:ios # or build:android
   ```

5. **Manual verification** (if applicable):
   - Test the feature in development mode
   - Verify state updates work correctly
   - Check that selectors return expected values

### Step 6: Commit and PR (10-15 minutes)

1. **Stage changes**:
   ```bash
   git add app/reducers/{reducer-name}/
   git add app/reducers/index.ts
   ```

2. **Commit with conventional format**:
   ```bash
   git commit -m "chore(js-ts): migrate {reducer-name} reducer to TypeScript"
   ```

3. **Push and create PR**:
   ```bash
   git push -u origin devin/{timestamp}-migrate-{reducer-name}-reducer
   ```
   
   Use `git_create_pr` command with:
   - Title: `chore(js-ts): Migrate {reducer-name} reducer to TypeScript`
   - Description: Auto-generated, should include:
     - What was migrated
     - Pattern used (inline types vs types file)
     - Any notable decisions
     - Testing performed

4. **Monitor CI**:
   - Wait for CI checks to complete
   - Address any failures
   - Request review when green

---

## Success Criteria

### Per-Reducer Migration Success

A reducer migration is considered complete when ALL of the following are true:

#### 1. Type Safety ✅
- [ ] State interface is properly defined and exported
- [ ] All action types are properly typed (preferably as discriminated union)
- [ ] Reducer function has explicit type annotations
- [ ] No `any` types remain (except in documented TODOs)
- [ ] All selectors have explicit return types
- [ ] All action creators are properly typed

#### 2. ESLint Compliance ✅
- [ ] `yarn lint` passes with no errors in the reducer
- [ ] No `@typescript-eslint/no-explicit-any` violations
- [ ] No TypeScript-specific lint warnings

#### 3. TypeScript Compilation ✅
- [ ] `yarn tsc --noEmit` passes with no errors
- [ ] Strict mode checks pass
- [ ] No implicit any types

#### 4. RootState Integration ✅
- [ ] RootState interface updated to use typed interface
- [ ] TODO comment removed from RootState
- [ ] Import statement added if needed

#### 5. Testing ✅
- [ ] All existing tests pass
- [ ] No new test failures introduced
- [ ] Test coverage maintained or improved

#### 6. Build Success ✅
- [ ] Development build completes successfully
- [ ] No build warnings related to types

#### 7. Runtime Behavior ✅
- [ ] No changes to runtime behavior
- [ ] State updates work correctly
- [ ] Selectors return correct values
- [ ] Action creators work as expected

#### 8. Documentation ✅
- [ ] State interface has JSDoc comments (for complex types)
- [ ] Complex logic has explanatory comments
- [ ] Any breaking changes are documented

### Overall Migration Success

The complete reducer migration project is successful when:

#### 1. All Reducers Migrated ✅
- [ ] All 17 reducers have proper TypeScript interfaces
- [ ] RootState has no `any` types
- [ ] All TODO comments removed from RootState

#### 2. Code Quality ✅
- [ ] Consistent naming conventions across all reducers
- [ ] Similar reducers use similar patterns
- [ ] Code is more maintainable than before

#### 3. Type Safety Achieved ✅
- [ ] TypeScript strict mode fully enforced
- [ ] IDE autocomplete works correctly
- [ ] Type errors caught at compile time

#### 4. No Regressions ✅
- [ ] Full test suite passes
- [ ] CI pipeline passes
- [ ] App builds and runs correctly
- [ ] No performance degradation

#### 5. Developer Experience ✅
- [ ] Better IDE support for reducer state
- [ ] Clearer types for new developers
- [ ] Easier to add new actions/state

---

## Risk Mitigation

### High-Risk Areas

#### 1. Transaction Reducer
**Risks**:
- Critical financial operations
- Complex state with nested objects
- High test coverage requirements

**Mitigation**:
- Save for last when patterns are proven
- Extensive manual testing
- Involve security review for financial types
- Consider pair programming for review

#### 2. Swaps Reducer
**Risks**:
- Most complex reducer (449 lines)
- Many dependent selectors
- Trading feature with financial implications

**Mitigation**:
- Break into smaller PRs if possible
- Extensive testing in development
- Test all swaps flows manually
- Monitor for selector performance issues

#### 3. Breaking Changes
**Risks**:
- Type changes could break consuming code
- Selector return types might change

**Mitigation**:
- Search for all imports before migrating
- Update consumers in same PR when needed
- Use TypeScript compiler to find breaks
- Comprehensive testing

### Medium-Risk Areas

#### 1. Notification Queue
**Risks**:
- Complex queue management logic
- User-facing feature

**Mitigation**:
- Careful typing of notification union types
- Test notification display thoroughly
- Verify queue operations maintain order

#### 2. Browser State
**Risks**:
- Affects dApp interactions
- Tab management is complex

**Mitigation**:
- Test browser navigation flows
- Verify tab state persists correctly
- Test with multiple dApps

### Low-Risk Areas

Simple reducers (bookmarks, alert, infuraAvailability, modals, privacy) have minimal risk due to:
- Simple state shapes
- Limited dependencies
- Straightforward logic
- Easy to test

---

## Timeline and Resource Estimation

### Phase 1: Foundation (1-2 days)
- 6 reducers (very simple + already TS)
- ~1-2 hours per reducer
- Running total: 6 reducers complete

### Phase 2: UI State Management (2-3 days)
- 6 reducers (simple to medium)
- ~2-4 hours per reducer
- Running total: 12 reducers complete

### Phase 3: Core Features (3-5 days)
- 3 reducers (medium-complex)
- ~6-10 hours per reducer
- Running total: 15 reducers complete

### Phase 4: Critical Features (5-7 days)
- 2 reducers (complex to very complex)
- ~12-20 hours per reducer
- Running total: 17 reducers complete ✅

### Buffer Time (2-3 days)
- PR reviews and iterations
- Fixing CI issues
- Addressing feedback
- Final integration testing

### Total Estimated Duration: 13-20 days

This assumes:
- One developer working full-time
- Normal PR review cycle (1-2 days)
- No major blockers or unforeseen issues
- Familiarity with the codebase

For faster completion:
- Could parallelize Phase 1 & 2 with multiple developers
- Phase 3 & 4 should remain sequential due to complexity

---

## Best Practices and Patterns

### Naming Conventions

**State Interfaces**:
- Use PascalCase with "State" suffix: `{ReducerName}State`
- Examples: `BookmarksState`, `TransactionState`, `SwapsState`

**Action Types**:
- Use PascalCase with "Action" suffix: `{ReducerName}Action`
- Use discriminated unions for type safety
- Examples: `BookmarkAction`, `TransactionAction`

**Selectors**:
- Export selectors from reducer file
- Explicit return type annotation
- Use `createSelector` for memoization

### Type Organization

**Simple Reducers** (< 50 lines):
- Define types inline at the top of the reducer file
- Export state interface
- Keep action types inline or in discriminated union

**Medium Reducers** (50-150 lines):
- Consider types file if interfaces are complex
- Otherwise inline is fine
- Export state interface

**Complex Reducers** (> 150 lines):
- Always use separate `types.ts` file
- Export all interfaces and types
- Consider barrel export if many types

### Common Patterns

**Pattern 1: Simple State**
```typescript
export interface SimpleState {
  isVisible: boolean;
  count: number;
}

type SimpleAction = 
  | { type: 'SHOW' }
  | { type: 'HIDE' }
  | { type: 'INCREMENT' };
```

**Pattern 2: Record/Map State**
```typescript
export interface RecordState {
  items: Record<string, ItemType>;
  byId: { [id: string]: ItemType };
}
```

**Pattern 3: Array State**
```typescript
export interface ArrayState {
  items: ItemType[];
}

// Or just export the type directly
export type ArrayState = ItemType[];
```

**Pattern 4: Discriminated Union Actions**
```typescript
export type Action =
  | { type: 'ADD_ITEM'; item: ItemType }
  | { type: 'REMOVE_ITEM'; id: string }
  | { type: 'UPDATE_ITEM'; id: string; updates: Partial<ItemType> };
```

**Pattern 5: Selector Typing**
```typescript
import { createSelector } from 'reselect';
import { RootState } from '../index';

export const selectItems = (state: RootState): ItemType[] => 
  state.myReducer.items;

export const selectItemById = createSelector(
  [selectItems, (_: RootState, id: string) => id],
  (items, id): ItemType | undefined => 
    items.find(item => item.id === id)
);
```

---

## References

### Existing Well-Typed Reducers
Reference these for patterns:
- `app/reducers/user/index.ts` - Complex state with separate types file
- `app/reducers/security/index.ts` - Simple inline types
- `app/reducers/rewards/index.ts` - Good selector typing
- `app/reducers/navigation/index.ts` - Complex navigation state

### Configuration Files
- `tsconfig.json` line 24 - Strict mode enabled
- `.eslintrc.js` line 47 - `@typescript-eslint/no-explicit-any: 'error'`
- `app/reducers/index.ts` lines 59-132 - RootState with TODO comments

### Coding Guidelines
- `.github/guidelines/CODING_GUIDELINES.md` lines 2-5 - TypeScript-first approach
- `CHANGELOG.md` lines 1717-1827 - Recent `chore(js-ts)` commit patterns

### TypeScript Resources
- [TypeScript Handbook - Discriminated Unions](https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html#discriminating-unions)
- [Redux TypeScript Guide](https://redux.js.org/usage/usage-with-typescript)
- [React-Redux TypeScript Guide](https://react-redux.js.org/using-react-redux/usage-with-typescript)

---

## Appendix: Reducer Details

### Detailed Complexity Assessment

| Reducer | Lines | Actions | Selectors | State Props | Complexity | Phase |
|---------|-------|---------|-----------|-------------|------------|-------|
| bookmarks | 12 | 2 | 0 | 1 (array) | Very Simple | 1 |
| alert | 29 | 2 | 0 | 4 | Very Simple | 1 |
| infuraAvailability | 29 | 2 | 1 | 1 | Very Simple | 1 |
| signatureRequest | 30 | 1 | 0 | 1 | Very Simple | 1 |
| accounts | 41 | 1 | 0 | 1 | Very Simple | 1 |
| experimentalSettings | 31 | 1 | 0 | 1 | Very Simple | 1 |
| modals | 63 | 5 | 0 | 6 | Simple | 2 |
| privacy | 39 | 4 | 0 | 2 | Simple | 2 |
| legalNotices | 80 | 2 | 0 | 1 | Simple | 2 |
| networkOnboarded | 82 | 3 | 0 | 3 | Simple | 2 |
| settings | 75 | 9 | 0 | 9 | Medium | 2 |
| rpcEvents | 129 | 3 | 0 | 1 | Medium | 2 |
| browser | 105 | 9 | 0 | 6 | Medium | 3 |
| notification | 204 | 11 | 2 | 1 (array) | Complex | 3 |
| collectibles | 240 | 4 | 9 | 2 | Complex | 3 |
| transaction | 172 | 11 | 0 | 8 | Complex | 4 |
| swaps | 449 | 2 | 15+ | 3+ | Very Complex | 4 |

### Key Dependencies

**No Dependencies**:
- bookmarks, alert, infuraAvailability, modals, privacy, signatureRequest, accounts, experimentalSettings

**Minimal Dependencies**:
- legalNotices (just action types)
- networkOnboarded (action types)
- settings (uses some utility types)
- rpcEvents (imports action types)

**Controller Dependencies**:
- browser (AppConstants)
- collectibles (NftController selectors - already typed)
- notification (transaction types - can define locally)

**Heavy Dependencies**:
- transaction (Engine state types, transaction utilities)
- swaps (SwapsController, TokensController, NetworkController, multiple typed selectors)

---

## Getting Help

### When to Ask Questions
- If action type patterns are unclear
- If state shape seems ambiguous
- If breaking changes are unavoidable
- If test failures can't be resolved
- If performance issues arise

### Escalation Points
- Any CI failure after 2 attempts to fix
- Uncertainty about state interface shape
- Need for breaking changes
- Security-sensitive type decisions (especially for transaction/swaps)

### Resources
- TypeScript team for complex type issues
- Security team for transaction/swaps review
- QA team for comprehensive testing

---

## Conclusion

This migration plan provides a systematic, low-risk approach to converting all 17 reducers from `any` types to properly typed TypeScript interfaces. By following the phased approach:

1. **Phase 1** establishes patterns with quick wins
2. **Phase 2** tackles frequently-used UI state
3. **Phase 3** handles complex but contained features
4. **Phase 4** addresses critical, high-risk reducers last

The step-by-step process ensures consistency, while the success criteria provide clear completion markers. Risk mitigation strategies address the most complex reducers, and the timeline provides realistic expectations.

**Expected Outcomes**:
- ✅ All 17 reducers properly typed
- ✅ RootState has no `any` types
- ✅ Improved developer experience
- ✅ Better type safety throughout app
- ✅ No runtime behavior changes
- ✅ Full test suite passing

**Next Steps**:
1. Review and approve this plan
2. Begin Phase 1 migrations
3. Iterate based on learnings
4. Track progress in project board
5. Celebrate completion! 🎉
