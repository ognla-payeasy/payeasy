# PayEasy: Full Roadmap (160 Granular Issues)

> [!IMPORTANT]
> **4-Hour Resolution Rule**: Once an issue is assigned to you, it must be resolved and a Pull Request submitted within **4 hours**. If the deadline passes without a PR, the issue will be unassigned and given to another contributor to keep the project moving at speed.

---

## Stage 1: Infrastructure & Project Setup (Issues 1-5)

### [Issue #1] Setup: Workspace Configuration
**Description**  
Configure the root `Cargo.toml` to manage the `contracts/rent-escrow` contract as a workspace member.

**Requirements**  
- Must include `[workspace]` section.
- Must list `contracts/rent-escrow` in `members`.

**Acceptance Criteria**  
- `cargo check` at the root recognizes the contract member.

**Files to Create/Modify**  
- `Cargo.toml` (Modify)

**Test Requirements**  
- N/A (Build check only)

---

### [Issue #2] Setup: Soroban SDK Optimization
**Description**  
Add build profiles to `contracts/rent-escrow/Cargo.toml` to optimize the contract for size and production safety.

**Requirements**  
- Add `[profile.release]` with `opt-level = "z"`.
- Add `panic = "abort"` and `lto = true`.

**Acceptance Criteria**  
- Contract compiles to a smaller `.wasm` file after release build.

**Files to Create/Modify**  
- `contracts/rent-escrow/Cargo.toml` (Modify)

**Test Requirements**  
- N/A

---

### [Issue #3] Setup: Define Base Contract Struct
**Description**  
Implement the `RentEscrow` struct with the `#[contract]` attribute.

**Requirements**  
- Use `soroban_sdk::contract`.
- Struct must be empty for now.

**Acceptance Criteria**  
- Struct `RentEscrow` is defined in `lib.rs`.

**Files to Create/Modify**  
- `contracts/rent-escrow/src/lib.rs` (Modify)

**Test Requirements**  
- N/A

---

### [Issue #4] Setup: Implement No-Standard Flag
**Description**  
Ensure the contract environment is properly set to `#![no_std]`.

**Requirements**  
- Use `#![no_std]` at the top of the crate.

**Acceptance Criteria**  
- Contract builds for the `wasm32-unknown-unknown` target.

**Files to Create/Modify**  
- `contracts/rent-escrow/src/lib.rs` (Modify)

**Test Requirements**  
- N/A

---

### [Issue #5] Setup: Test Environment Boilerplate
**Description**  
Create a basic `test.rs` file that can register the contract in a test environment.

**Requirements**  
- Use `#[cfg(test)]`.
- Use `env.register_contract(None, RentEscrow)`.

**Acceptance Criteria**  
- `cargo test` runs without errors.

**Files to Create/Modify**  
- `contracts/rent-escrow/src/test.rs` (Create)
- `contracts/rent-escrow/src/lib.rs` (Modify to include `mod test;`)

**Test Requirements**  
- At least one passing dummy test.

---

## Stage 2: Error Handling & Constants (6-10)

### [Issue #6] Errors: Define Initialization Guard Errors
**Description**  
Add `AlreadyInitialized` and `NotInitialized` variants to a `#[contracterror]` enum.

**Requirements**  
- Define `pub enum Error`.
- Assign unique integer codes to variants.


---

## Stage 9: Frontend Polish (Issues 41–44)

### [Issue #41] Wallet: Fund Testnet Button Not Wired Up
**Description**  
The "Fund Testnet" quick-action button on the wallet page (`app/wallet/page.tsx`, line 120) renders with no `onClick` handler, so clicking it does nothing. A `FundTestnetButton` component already exists in `components/wallet/FundTestnetButton.tsx` and handles the Friendbot funding flow — the inline button should be replaced with it.

**Requirements**  
- Remove the inert `<button>` at lines 119–126 of `app/wallet/page.tsx`.  
- Import and render `<FundTestnetButton publicKey={walletData?.address ?? ""} />` in its place.  
- The button must only be visible when `walletData?.network === "testnet"` (condition is already present).

**Acceptance Criteria**  
- Clicking "Fund Testnet" on the wallet page triggers the Friendbot request and shows toast feedback.  
- The button does not appear on mainnet.

**Files to Create/Modify**  
- `app/wallet/page.tsx` (Modify)

**Test Requirements**  
- Verify clicking the button triggers the funding flow; confirm it is absent when network is not testnet.

---

### [Issue #42] History: "Latest First" Sort Button Has No Handler
**Description**  
The sort button in `components/history/TransactionList.tsx` (line 103) renders the label "Latest First" but has no `onClick` handler — clicking it does nothing. The transaction list should toggle between newest-first and oldest-first order, and the button label should reflect the current sort direction.

**Requirements**  
- Add a `sortOrder` state (`"desc" | "asc"`, default `"desc"`) to `TransactionList`.  
- Wire the button's `onClick` to toggle `sortOrder` between `"desc"` and `"asc"`.  
- Update the button label to read **"Latest First"** when `sortOrder === "desc"` and **"Oldest First"** when `"asc"`.  
- Sort `filteredTransactions` (inside its existing `useMemo`) by `transaction.timestamp` according to `sortOrder` before returning.

**Acceptance Criteria**  
- Clicking the button reverses the transaction list order.  
- The button label reflects the active sort direction.

**Files to Create/Modify**  
- `components/history/TransactionList.tsx` (Modify)

**Test Requirements**  
- Render with mock transactions; click sort button; confirm list order inverts and label changes.

---

### [Issue #43] History: Retry Button Silently Redirects to Create Escrow When contractId Is Missing
**Description**  
In `components/history/TransactionCard.tsx` (lines 151–167), the "Retry" button for failed transactions falls back to `router.push("/escrow/create")` when `transaction.contractId` is absent. This silently starts a brand-new escrow instead of retrying the failed one, which is confusing and destructive. The button should only appear when a `contractId` is available to navigate to.

**Requirements**  
- Wrap the entire retry `<button>` in a conditional: only render it when `transaction.status === "failed" && transaction.contractId`.  
- Remove the `else` branch that redirects to `/escrow/create`.  
- Add `aria-label={`Retry transaction for escrow ${transaction.contractId}`}` to the button.

**Acceptance Criteria**  
- Failed transactions without a `contractId` do not show a Retry button.  
- Failed transactions with a `contractId` show the button, and clicking it navigates to `/escrow/{contractId}`.

**Files to Create/Modify**  
- `components/history/TransactionCard.tsx` (Modify)

**Test Requirements**  
- Render a failed card without `contractId`; confirm no Retry button.  
- Render a failed card with `contractId`; confirm Retry navigates correctly.

---

### [Issue #44] Escrow: Demo Mode Warning Only Shown at Final Review Step
**Description**  
`components/escrow/CreateEscrowForm.tsx` (lines 626–630) shows a "Demo mode is active" notice only at Step 4 (the final review), after the user has already filled out all three preceding steps. Users who are not in demo mode may not notice this until they are about to submit. A prominent banner should be shown at Step 1 so contributors know from the start that transactions will not execute on-chain.

**Requirements**  
- At the top of the Step 1 section, add a dismissible amber banner when `contractClient` is `null` / `undefined`.  
- The banner must include an info icon and the text: *"Demo mode: transactions will not be executed on-chain. Results are simulated only."*  
- The existing Step 4 inline note may remain as a secondary reminder.

**Acceptance Criteria**  
- When `contractClient` is not provided, the amber banner is visible as soon as Step 1 renders.  
- When `contractClient` is provided, the banner does not render.

**Files to Create/Modify**  
- `components/escrow/CreateEscrowForm.tsx` (Modify)

**Test Requirements**  
- Render form without `contractClient`; confirm banner appears on Step 1.  
- Render form with `contractClient`; confirm banner is absent.

---


### [Issue #19] Init: Storage Persistence
**Description**  
Implement the code to save landlord and amount into persistent storage.

**Requirements**  
- Use `env.storage().persistent()`.

**Acceptance Criteria**  
- State is saved successfully.

**Files to Create/Modify**  
- `contracts/rent-escrow/src/lib.rs` (Modify)

**Test Requirements**  
- N/A

---

### [Issue #20] Init: Test Case - Success Path
**Description**  
Write a unit test verifying that `initialize` sets the state correctly.

**Requirements**  
- Use `env.storage().persistent().get`.

**Acceptance Criteria**  
- Test passes `cargo test`.

**Files to Create/Modify**  
- `contracts/rent-escrow/src/test.rs` (Modify)

**Test Requirements**  
- Verify `landlord` equal to input `landlord`.

---

## Stage 5: Roommate Configuration (21-25)

### [Issue #21] Setup: `add_roommate` Interface
**Description**  
Implement function for the landlord to add roommate addresses and shares.

**Requirements**  
- Callable by landlord.
- Input: `user: Address, share: i128`.

**Acceptance Criteria**  
- Only callable by the landlord address.

**Files to Create/Modify**  
- `contracts/rent-escrow/src/lib.rs` (Modify)

**Test Requirements**  
- Test non-landlord call fails.

---

### [Issue #22] Logic: Share Sum Validation
**Description**  
Ensure the sum of roommate shares does not exceed `total_rent`.

**Requirements**  
- Keep running total or check sum.

**Acceptance Criteria**  
- Reverts if math is incorrect.

**Files to Create/Modify**  
- `contracts/rent-escrow/src/lib.rs` (Modify)

**Test Requirements**  
- Test adding shares above total fails.

---

### [Issue #23] Getter: Landlord Lookup
**Description**  
Implement `fn get_landlord(e: Env) -> Address`.

**Requirements**  
- Read from persistent storage.

**Acceptance Criteria**  
- Returns correct address.

**Files to Create/Modify**  
- `contracts/rent-escrow/src/lib.rs` (Modify)

**Test Requirements**  
- Verify output matches initial landlord.

---

### [Issue #24] Getter: Total Amount Lookup
**Description**  
Implement `fn get_total(e: Env) -> i128`.

**Requirements**  
- Read from persistent storage.

**Acceptance Criteria**  
- Returns correct amount.

**Files to Create/Modify**  
- `contracts/rent-escrow/src/lib.rs` (Modify)

**Test Requirements**  
- Verify output matches initial amount.

---

### [Issue #25] Getter: Deadline Lookup
**Description**  
Implement `fn get_deadline(e: Env) -> u64`.

**Requirements**  
- Read from persistent storage.

**Acceptance Criteria**  
- Returns correct timestamp.

**Files to Create/Modify**  
- `contracts/rent-escrow/src/lib.rs` (Modify)

**Test Requirements**  
- Verify output matches initial deadline.

---

## Stage 6: Contribution Logic (26-30)

### [Issue #26] Deposit: `contribute` Signature
**Description**  
Define the public `contribute(from: Address, amount: i128)` function.

**Requirements**  
- Use `require_auth()`.

**Acceptance Criteria**  
- Properly marked with `require_auth()`.

**Files to Create/Modify**  
- `contracts/rent-escrow/src/lib.rs` (Modify)

**Test Requirements**  
- N/A

---

### [Issue #27] Validation: Roommate Membership check
**Description**  
Logic to verify the caller is actually a registered roommate.

**Requirements**  
- Check if key exists in roommate map.

**Acceptance Criteria**  
- Reverts for unauthorized accounts.

**Files to Create/Modify**  
- `contracts/rent-escrow/src/lib.rs` (Modify)

**Test Requirements**  
- Test stranger call fails.

---

### [Issue #28] Token: Transfer Integration
**Description**  
Implement the `token::Client` transfer from user to contract.

**Requirements**  
- Use `token::Client::new(&e, &token_addr)`.

**Acceptance Criteria**  
- Tokens move successfully on-chain.

**Files to Create/Modify**  
- `contracts/rent-escrow/src/lib.rs` (Modify)

**Test Requirements**  
- Verify contract balance increment.

---

### [Issue #29] Logic: Update Paid Balance
**Description**  
Increment the `paid` field in the roommate's contribution map.

**Requirements**  
- Update `RoommateState`.

**Acceptance Criteria**  
- State reflects the new deposit.

**Files to Create/Modify**  
- `contracts/rent-escrow/src/lib.rs` (Modify)

**Test Requirements**  
- Verify `get_balance` output.

---

### [Issue #30] Event: `Contribution` Emission
**Description**  
Emit an event including the roommate and amount deposited.

**Requirements**  
- Use `env.events().publish`.

**Acceptance Criteria**  
- Event appears in transaction logs.

**Files to Create/Modify**  
- `contracts/rent-escrow/src/lib.rs` (Modify)

**Test Requirements**  
- Verify event in test logs.

---

## Stage 7: Escrow & Release (31-35)

### [Issue #31] Logic: Calculate Total Funded
**Description**  
Helper to sum all current roommate contributions.

**Requirements**  
- Iterative loop or cached total.

**Acceptance Criteria**  
- Correctly identifies if the goal is met.

**Files to Create/Modify**  
- `contracts/rent-escrow/src/lib.rs` (Modify)

**Test Requirements**  
- Logic check for different states.

---

### [Issue #32] Release: `release` Status Guard
**Description**  
Ensure `release()` only works if `is_fully_funded` is true.

**Requirements**  
- Guard check at start of function.

**Acceptance Criteria**  
- prevents premature payout.

**Files to Create/Modify**  
- `contracts/rent-escrow/src/lib.rs` (Modify)

**Test Requirements**  
- Test calling `release` while underfunded fails.

---

### [Issue #33] Release: Transfer to Landlord
**Description**  
Logic to move the full contract balance to the landlord.

**Requirements**  
- Use `token_client.transfer`.

**Acceptance Criteria**  
- Landlord receives funds.

**Files to Create/Modify**  
- `contracts/rent-escrow/src/lib.rs` (Modify)

**Test Requirements**  
- Verify landlord balance increment.

---

### [Issue #34] Event: `AgreementReleased`
**Description**  
Publish event when the total rent is paid out.

**Requirements**  
- Include amount.

**Acceptance Criteria**  
- Event shows full funding was achieved.

**Files to Create/Modify**  
- `contracts/rent-escrow/src/lib.rs` (Modify)

**Test Requirements**  
- Verify event metadata.

---

### [Issue #35] Test: full Flow Scenario
**Description**  
End-to-end test: init -> contribute x3 -> release.

**Requirements**  
- Full multi-user simulation.

**Acceptance Criteria**  
- Full cycle completes successfully.

**Files to Create/Modify**  
- `contracts/rent-escrow/src/test.rs` (Modify)

**Test Requirements**  
- All steps pass.

---

## Stage 8: Expiry & Refund (36-40)

### [Issue #36] Refund: `claim_refund` Signature
**Description**  
Implement function for individual roommates to reclaim deposits.

**Requirements**  
- Check caller auth.

**Acceptance Criteria**  
- Enforces `require_auth()`.

**Files to Create/Modify**  
- `contracts/rent-escrow/src/lib.rs` (Modify)

**Test Requirements**  
- N/A

---

### [Issue #37] Validation: Deadline Verification
**Description**  
Ensure refunds are only available after the deadline.

**Requirements**  
- Use `env.ledger().timestamp()`.

**Acceptance Criteria**  
- Reverts if called too early.

**Files to Create/Modify**  
- `contracts/rent-escrow/src/lib.rs` (Modify)

**Test Requirements**  
- Test calling refund before deadline fails.

---

### [Issue #38] Logic: Individual Token Refund
**Description**  
Transfer the roommate's `paid` amount back to them.

**Requirements**  
- `token_client.transfer`.

**Acceptance Criteria**  
- User receives their money back.

**Files to Create/Modify**  
- `contracts/rent-escrow/src/lib.rs` (Modify)

**Test Requirements**  
- Verify roommate balance reset.

---

### [Issue #39] State: Zeroing Balances
**Description**  
Set the roommate's `paid` balance to `0` after refund.

**Requirements**  
- Prevents re-entrancy / double refund.

**Acceptance Criteria**  
- map updated correctly.

**Files to Create/Modify**  
- `contracts/rent-escrow/src/lib.rs` (Modify)

**Test Requirements**  
- Verify second call fails with 0 balance error.

---

### [Issue #40] Polish: Storage TTL Extension
**Description**  
implement persistent storage TTL extension so the agreement doesn't expire.

**Requirements**  
- Use `env.storage().persistent().extend_ttl`.

**Acceptance Criteria**  
- Storage state is preserved.

**Files to Create/Modify**  
- `contracts/rent-escrow/src/lib.rs` (Modify)

**Test Requirements**  
- N/A

<<<<<<< HEAD

---

## Stage 9: Error Handling & Resilience (Issues 41–50)

### [Issue #41] Errors: Global Error Boundary Component
**Description**
Create a React error boundary that catches unhandled exceptions across the entire app and renders a fallback UI instead of a blank screen.

**Requirements**
- Implement as a class component `ErrorBoundary` wrapping the entire `AppShell`.
- Fallback UI must show the PayEasy logo, a friendly error message, and a "Reload Page" button.
- Log caught errors to `console.error` with a stack trace.

**Acceptance Criteria**
- Throwing inside any page does not produce a blank screen.
- Fallback renders correctly on all screen sizes.

**Files to Create/Modify**
- `components/ui/error-boundary.tsx` (Create)
- `components/ui/app-shell.tsx` (Modify — wrap children)

**Test Requirements**
- Manually throw inside a child; verify fallback renders.

---

### [Issue #42] Errors: Page-Level Error Boundary for Escrow Routes
**Description**
Wrap `app/escrow/` routes with a dedicated error boundary showing an escrow-specific fallback.

**Requirements**
- Create `app/escrow/error.tsx` using Next.js App Router `error.tsx` convention.
- Provide a "Try Again" button that calls `reset()`.

**Acceptance Criteria**
- Network error inside escrow dashboard renders the escrow error UI.
- "Try Again" re-attempts the route render.

**Files to Create/Modify**
- `app/escrow/error.tsx` (Create)

**Test Requirements**
- Simulate a thrown error in `[contractId]/page.tsx`; confirm fallback renders.

---

### [Issue #43] Errors: Toast Notification System
**Description**
Implement a global toast/snackbar system for success, warning, and error feedback that does not block the UI.

**Requirements**
- Use `framer-motion` for slide-in from bottom-right animations.
- Support three variants: `success`, `error`, `info`.
- Auto-dismiss after 4 seconds; manual dismiss via × button.
- Expose a `useToast()` hook for triggering toasts from anywhere.

**Acceptance Criteria**
- `useToast().success("message")` renders a green toast.
- Multiple toasts stack vertically without overlap.

**Files to Create/Modify**
- `components/ui/toast.tsx` (Create)
- `components/ui/toast-provider.tsx` (Create)
- `components/ui/app-shell.tsx` (Modify — add ToastProvider)
- `hooks/useToast.ts` (Create)

**Test Requirements**
- Trigger three simultaneous toasts; all render and dismiss correctly.

---

### [Issue #44] Errors: Wallet-Specific Error Messages
**Description**
Map all Freighter error codes to human-readable messages.

**Requirements**
- Define `ERROR_MESSAGES` map for: `USER_DECLINED`, `NOT_INSTALLED`, `NETWORK_MISMATCH`, `UNKNOWN`.
- Replace all raw `err.message` displays with mapped messages.
- Include a "What does this mean?" expandable help text per error.

**Acceptance Criteria**
- Declining the Freighter popup shows "You declined the connection request."
- Unknown errors show a generic fallback, not raw SDK text.

**Files to Create/Modify**
- `lib/stellar/errors.ts` (Modify)
- `app/connect/page.tsx` (Modify)
- `components/wallet/ConnectWalletButton.tsx` (Modify)

**Test Requirements**
- Unit test each error code maps to the correct string.

---

### [Issue #45] Errors: Network Offline Detection Banner
**Description**
Display a persistent top banner when the browser is offline, warning users blockchain actions will fail.

**Requirements**
- Use `navigator.onLine` and `window` `online`/`offline` events.
- Banner slides in from the top with amber background and warning icon.
- Auto-dismisses when connectivity restores; shows a "Back online" toast.

**Acceptance Criteria**
- Going offline shows the banner within 1 second. Restoring connection dismisses it.

**Files to Create/Modify**
- `components/ui/offline-banner.tsx` (Create)
- `hooks/useOnlineStatus.ts` (Create)
- `components/ui/app-shell.tsx` (Modify — add OfflineBanner)

**Test Requirements**
- Toggle `navigator.onLine` via devtools; banner appears and disappears correctly.

---

### [Issue #46] Errors: Retry Logic for Horizon API Calls
**Description**
Add exponential backoff retry logic to all `lib/stellar/` functions calling Horizon or Soroban RPC.

**Requirements**
- Implement `withRetry(fn, maxAttempts, baseDelayMs)` utility.
- Apply to: `history.ts`, `queries.ts`, `health.ts`.
- Log each retry attempt with attempt number.
- After max attempts, throw the final error.

**Acceptance Criteria**
- A 503 from Horizon retries up to 3 times before surfacing the error.

**Files to Create/Modify**
- `lib/stellar/retry.ts` (Create)
- `lib/stellar/history.ts` (Modify)
- `lib/stellar/queries.ts` (Modify)
- `lib/stellar/health.ts` (Modify)

**Test Requirements**
- Mock 2 failures then success; verify 3 total attempts.

---

### [Issue #47] Errors: Empty State Components
**Description**
Create a reusable `EmptyState` component for every page that can render zero data rows.

**Requirements**
- Props: `icon`, `title`, `description`, optional `action` (label + onClick).
- Use on: history page, escrow list, roommate list.

**Acceptance Criteria**
- History page with no transactions renders empty state with a "Create Escrow" CTA.

**Files to Create/Modify**
- `components/ui/empty-state.tsx` (Create)
- `app/history/page.tsx` (Modify)
- `components/escrow/RoommateList.tsx` (Modify)

**Test Requirements**
- Render component with and without the optional action; verify both layouts.

---

### [Issue #48] Errors: Custom 404 Not Found Page
**Description**
Build a branded 404 page matching PayEasy's visual identity.

**Requirements**
- Display "404" in large gradient text using Space Grotesk.
- Show message: "This page doesn't exist or the escrow was not found."
- Include a "Go Home" button and a "Try Connecting Wallet" link.
- Animate the numbers with a subtle float effect.

**Acceptance Criteria**
- Visiting `/nonexistent-route` renders the 404 page without a blank screen.

**Files to Create/Modify**
- `app/not-found.tsx` (Create)

**Test Requirements**
- Navigate to an unknown URL; confirm 404 page renders.

---

### [Issue #49] Errors: Form Validation Error Display Pattern
**Description**
Standardize inline validation errors across all forms.

**Requirements**
- Errors appear below the invalid field in red with an `AlertCircle` icon.
- Error text announced via `aria-describedby` for screen readers.
- Field border turns red on error, green on valid.
- Errors clear on correction, not on re-submit.

**Acceptance Criteria**
- Submitting a blank landlord address field shows "Required" below the field.

**Files to Create/Modify**
- `components/ui/field-error.tsx` (Create)
- `components/escrow/CreateEscrowForm.tsx` (Modify)
- `components/escrow/RoommateInput.tsx` (Modify)

**Test Requirements**
- Submit empty form; verify each required field shows its error.

---

### [Issue #50] Errors: Freighter Connection Timeout
**Description**
Implement a 30-second timeout for wallet connection attempts.

**Requirements**
- Wrap `connectFreighter()` in `Promise.race` with a timeout promise.
- On timeout, set error: "Connection timed out. Is Freighter open?"
- Reset connecting state after timeout.

**Acceptance Criteria**
- Leaving the Freighter popup unanswered for 30 seconds shows the timeout error.

**Files to Create/Modify**
- `lib/stellar/wallet.ts` (Modify)
- `context/StellarContext.tsx` (Modify)
- `app/connect/page.tsx` (Modify)

**Test Requirements**
- Mock `connectFreighter` to never resolve; verify error appears after 30s.

---

## Stage 10: Loading & Skeleton States (Issues 51–58)

### [Issue #51] Loading: Skeleton Loader Component
**Description**
Build a reusable `Skeleton` component for loading placeholder UI.

**Requirements**
- Shimmer-animated rectangle via CSS `@keyframes`.
- Props: `width`, `height`, `className`, `rounded` (boolean).
- Subtle highlight sweep against `#0a0a0f` background.

**Acceptance Criteria**
- `<Skeleton width="100%" height="20px" />` renders a shimmer block.

**Files to Create/Modify**
- `components/ui/skeleton.tsx` (Create)
- `app/globals.css` (Modify — add shimmer keyframe)

**Test Requirements**
- Visual check: shimmer animation plays continuously.

---

### [Issue #52] Loading: Escrow Dashboard Loading Skeleton
**Description**
Show a skeleton layout while contract state loads on the escrow dashboard.

**Requirements**
- Skeleton mirrors the three-column layout (status card, progress card, roommate list).
- Transition to real content with a fade-in once data arrives.

**Acceptance Criteria**
- On slow connections the page never shows a blank area; skeleton renders immediately.

**Files to Create/Modify**
- `app/escrow/[contractId]/page.tsx` (Modify)
- `components/escrow/EscrowDashboardSkeleton.tsx` (Create)

**Test Requirements**
- Add artificial 3s delay; verify skeleton renders then content replaces it.

---

### [Issue #53] Loading: Transaction History Skeleton
**Description**
Show skeleton rows while transaction history is fetching from Horizon.

**Requirements**
- Render 5 skeleton `TransactionCard`-shaped placeholders.
- Rows animate in staggered fashion (50ms offset each).

**Acceptance Criteria**
- History page always shows skeleton before real data arrives.

**Files to Create/Modify**
- `app/history/page.tsx` (Modify)
- `components/history/TransactionListSkeleton.tsx` (Create)

**Test Requirements**
- Delay the data query by 2s; skeleton rows appear immediately.

---

### [Issue #54] Loading: Create Escrow Form Step Indicator
**Description**
Add a multi-step progress bar to the create escrow form: Setup → Roommates → Review.

**Requirements**
- Steps are numbered with connecting lines.
- Completed steps show a checkmark; current step highlighted in brand blue.
- Sticky at the top of the form on scroll.

**Acceptance Criteria**
- Clicking "Next" advances the indicator; back navigation retreats it.

**Files to Create/Modify**
- `components/ui/step-indicator.tsx` (Create)
- `components/escrow/CreateEscrowForm.tsx` (Modify)

**Test Requirements**
- Verify indicator advances and retreats correctly through all 3 steps.

---

### [Issue #55] Loading: Wallet Button Connection State
**Description**
Improve the visual loading state of `ConnectWalletButton` while a connection is pending.

**Requirements**
- Replace plain "Connecting..." with a `Loader2` spinner icon.
- Button disabled with 70% opacity during pending state.
- Subtle gradient animation on button border during connection.

**Acceptance Criteria**
- Clicking Connect shows the spinner until Freighter responds or times out.

**Files to Create/Modify**
- `components/wallet/ConnectWalletButton.tsx` (Modify)

**Test Requirements**
- Trigger connection; verify spinner appears and button is non-clickable.

---

### [Issue #56] Loading: Page Transition Animation
**Description**
Add smooth fade-in transitions between page navigations using framer-motion.

**Requirements**
- Each `<main>` element fades in over 300ms on mount.
- Use `AnimatePresence` with `mode="wait"`.

**Acceptance Criteria**
- Navigating from `/` to `/connect` triggers a visible fade.

**Files to Create/Modify**
- `components/ui/page-transition.tsx` (Create)
- `app/layout.tsx` (Modify)

**Test Requirements**
- Click between routes; confirm animation plays on each navigation.

---

### [Issue #57] Loading: Escrow Data Refresh Indicator
**Description**
Show a "Last updated X seconds ago" label on the escrow dashboard with a manual refresh button.

**Requirements**
- `setInterval` increments seconds since last fetch.
- "Refresh" icon button triggers a manual re-fetch.
- During re-fetch label reads "Refreshing..." with a spinner.

**Acceptance Criteria**
- Counter increments every second and resets to "just now" after refresh.

**Files to Create/Modify**
- `components/escrow/RefreshIndicator.tsx` (Create)
- `app/escrow/[contractId]/page.tsx` (Modify)

**Test Requirements**
- Wait 10s; verify counter reads ~10s. Click refresh; counter resets.

---

### [Issue #58] Loading: FundTestnet Button Polling
**Description**
After Friendbot funds the testnet account, poll Horizon until the balance confirms.

**Requirements**
- Poll `GET /accounts/{publicKey}` every 3 seconds, up to 5 attempts.
- Show "Confirming on-chain..." with a spinner during polling.
- On confirmation show "10,000 XLM received" with a green checkmark.

**Acceptance Criteria**
- After funding, the button self-transitions to confirmed without a page reload.

**Files to Create/Modify**
- `components/wallet/FundTestnetButton.tsx` (Modify)
- `lib/stellar/queries.ts` (Modify — add getAccountBalance)

**Test Requirements**
- Mock Friendbot then balance API; verify polling and confirmed state.

---

## Stage 11: Navigation & Layout (Issues 59–64)

### [Issue #59] Nav: Active Section Highlighting on Scroll
**Description**
Highlight the correct nav link as the user scrolls past each landing page section.

**Requirements**
- Use `IntersectionObserver` watching `#features`, `#how-it-works`, `#stellar`.
- Active link renders with `text-white` and a small underline accent.
- Transition is smooth (100ms).

**Acceptance Criteria**
- Scrolling into the Features section highlights "Features" in the navbar.

**Files to Create/Modify**
- `components/landing/Navbar.tsx` (Modify)
- `hooks/useActiveSection.ts` (Create)

**Test Requirements**
- Scroll to each section; verify correct link is highlighted.

---

### [Issue #60] Nav: Mobile Menu Auto-Close on Navigation
**Description**
Close the mobile hamburger menu automatically when the user taps a navigation link.

**Requirements**
- Each mobile nav link's `onClick` calls `setIsMobileMenuOpen(false)`.
- Smooth collapse animation using `framer-motion`.

**Acceptance Criteria**
- Tapping "Features" on mobile closes the menu and scrolls to the section.

**Files to Create/Modify**
- `components/landing/Navbar.tsx` (Modify)

**Test Requirements**
- Open menu on mobile viewport; tap link; verify menu closes.

---

### [Issue #61] Nav: Wire Sign In Link to Connect Page
**Description**
Replace the `href="#"` Sign In button in the Navbar with a proper link to `/connect`.

**Requirements**
- Use Next.js `<Link href="/connect">`.
- If wallet is already connected, label changes to "Dashboard".

**Acceptance Criteria**
- Clicking "Sign In" navigates to `/connect`. Connected users see "Dashboard".

**Files to Create/Modify**
- `components/landing/Navbar.tsx` (Modify)

**Test Requirements**
- Verify link in both connected and disconnected states.

---

### [Issue #62] Nav: Footer Links Wiring
**Description**
Wire all footer links that currently point to `#` to their correct destinations.

**Requirements**
- "GitHub" → `https://github.com/Ogstevyn/payeasy` (external, `_blank`).
- "Privacy Policy" → `/privacy`. "Terms of Service" → `/terms`.
- All other `#` links either point to real anchors or are removed.

**Acceptance Criteria**
- No footer link navigates to `#` on click.

**Files to Create/Modify**
- `components/landing/Footer.tsx` (Modify)
- `app/privacy/page.tsx` (Create — placeholder)
- `app/terms/page.tsx` (Create — placeholder)

**Test Requirements**
- Click every footer link; none should be a no-op `#`.

---

### [Issue #63] Nav: Landing CTA Buttons Point to /connect
**Description**
Wire the Hero and CTA section "Get Started" buttons to `/connect`.

**Requirements**
- Hero primary action uses `router.push("/connect")`.
- CTA section uses `<Link href="/connect">`.
- "View on GitHub" opens the repo externally.

**Acceptance Criteria**
- Clicking "Get Started" anywhere on the landing page navigates to `/connect`.

**Files to Create/Modify**
- `components/landing/CTA.tsx` (Modify)
- `app/page.tsx` (Modify)

**Test Requirements**
- Click each CTA; verify `/connect` navigation.

---

### [Issue #64] Nav: Skip-to-Content Accessibility Link
**Description**
Add a visually hidden skip-to-content link that becomes visible on keyboard focus.

**Requirements**
- First element in `<body>`; visible on focus, hidden otherwise.
- Links to `#main-content`; add `id="main-content"` to each page's `<main>`.

**Acceptance Criteria**
- Pressing Tab as the first action on any page reveals the skip link.

**Files to Create/Modify**
- `components/ui/skip-link.tsx` (Create)
- `components/ui/app-shell.tsx` (Modify)
- `app/connect/page.tsx` (Modify — add id)
- `app/history/page.tsx` (Modify — add id)

**Test Requirements**
- Use keyboard Tab on landing page; skip link appears and functions.

---

## Stage 12: Connect Wallet Page Completion (Issues 65–71)

### [Issue #65] Wallet: Network Indicator on Connect Page
**Description**
Display which Stellar network is configured, with a warning if Freighter is on a different network.

**Requirements**
- Read `NEXT_PUBLIC_STELLAR_NETWORK` and display as a pill badge.
- If networks differ, show amber warning: "Network mismatch — switch Freighter to Testnet."
- Badge uses green for Testnet, amber for Mainnet.

**Acceptance Criteria**
- Badge shows "TESTNET" by default. Mismatch warning renders when networks differ.

**Files to Create/Modify**
- `app/connect/page.tsx` (Modify)
- `lib/stellar/wallet.ts` (Modify — add getFreighterNetwork)

**Test Requirements**
- Mock Freighter reporting mainnet while app is testnet; verify warning.

---

### [Issue #66] Wallet: Connected State Balance Display
**Description**
Show the user's XLM balance on the connect page after successful wallet connection.

**Requirements**
- Fetch balance from Horizon `GET /accounts/{publicKey}`.
- Display as "1,234.56 XLM". Show skeleton while loading. Refresh every 60 seconds.

**Acceptance Criteria**
- Connected wallet shows XLM balance below the address.

**Files to Create/Modify**
- `app/connect/page.tsx` (Modify)
- `lib/stellar/queries.ts` (Modify — add getNativeBalance)
- `hooks/useWalletBalance.ts` (Create)

**Test Requirements**
- Mock Horizon response; verify formatted balance renders correctly.

---

### [Issue #67] Wallet: Post-Connect Onboarding Prompt
**Description**
After first-time wallet connection, show a one-time onboarding card.

**Requirements**
- Detect first connection via `localStorage.getItem("payeasy_onboarded")`.
- Show card with three next steps. "Got it" sets the localStorage flag and hides the card.

**Acceptance Criteria**
- First connect shows the onboarding card; second connect does not.

**Files to Create/Modify**
- `app/connect/page.tsx` (Modify)
- `components/ui/onboarding-card.tsx` (Create)

**Test Requirements**
- Clear localStorage; connect; verify card appears. Click "Got it"; reconnect; verify gone.

---

### [Issue #68] Wallet: Disconnect Confirmation Dialog
**Description**
Show a confirmation dialog when the user clicks "Disconnect Wallet".

**Requirements**
- Modal with "Cancel" and "Disconnect" (red) buttons.
- Dismissible via Escape or backdrop click. Uses `framer-motion`.

**Acceptance Criteria**
- Only confirming inside the dialog disconnects the wallet.

**Files to Create/Modify**
- `components/ui/confirm-dialog.tsx` (Create)
- `app/connect/page.tsx` (Modify)

**Test Requirements**
- Click Disconnect; dialog appears. Cancel keeps wallet connected. Confirm disconnects.

---

### [Issue #69] Wallet: Explorer Link for Connected Address
**Description**
Add a "View on Stellar Expert" link next to the connected wallet address.

**Requirements**
- Use `getExplorerLink("account", publicKey)` from `lib/stellar/explorer.ts`.
- Render as `ExternalLink` icon button. Opens in new tab with `rel="noopener noreferrer"`.

**Acceptance Criteria**
- Clicking the icon opens the correct Stellar Expert URL for the connected address.

**Files to Create/Modify**
- `app/connect/page.tsx` (Modify)

**Test Requirements**
- Verify generated URL matches `stellar.expert/explorer/testnet/account/{key}`.

---

### [Issue #70] Wallet: Session Persistence Across Page Reloads
**Description**
Automatically restore wallet connection state on page reload.

**Requirements**
- On `StellarContext` init, call `checkConnection()` and `getPublicKey()` if Freighter reports connected.
- Show brief "Restoring session..." skeleton on the wallet button during the check.

**Acceptance Criteria**
- Connecting wallet then reloading shows the connected state without re-prompting.

**Files to Create/Modify**
- `context/StellarContext.tsx` (Modify)
- `components/wallet/ConnectWalletButton.tsx` (Modify)

**Test Requirements**
- Connect wallet, reload page, verify connected state is restored.

---

### [Issue #71] Wallet: Wallet Dashboard Page Route
**Description**
Create `/wallet` as a dedicated wallet management page.

**Requirements**
- Display: address (copyable), XLM balance, network badge, recent 5 transactions.
- Quick action buttons: "Create Escrow", "View History", "Fund Testnet" (testnet only).
- Redirect to `/connect` if not connected.

**Acceptance Criteria**
- `/wallet` renders all sections when connected. Disconnected users redirected to `/connect`.

**Files to Create/Modify**
- `app/wallet/page.tsx` (Create)

**Test Requirements**
- Access `/wallet` disconnected; verify redirect. Connect; access `/wallet`; verify all sections.

---

## Stage 13: Escrow Create Form (Issues 72–80)

### [Issue #72] Escrow: Real Stellar Address Validation
**Description**
Validate every Stellar address entered in the create escrow form.

**Requirements**
- Use `isValidStellarAddress()` from `lib/stellar/validation.ts` on blur.
- Red error below field for invalid; green checkmark icon for valid.
- Debounce validation by 300ms.

**Acceptance Criteria**
- "GABCDE" shows an error. A full valid G... address shows a checkmark.

**Files to Create/Modify**
- `components/escrow/RoommateInput.tsx` (Modify)
- `components/escrow/CreateEscrowForm.tsx` (Modify)

**Test Requirements**
- Unit test: 10 valid and 10 invalid addresses pass/fail as expected.

---

### [Issue #73] Escrow: Duplicate Roommate Address Detection
**Description**
Prevent the same Stellar address from being added as a roommate more than once.

**Requirements**
- Before adding, check if address already exists in the list.
- If duplicate, show toast: "This address has already been added."
- Prevent form submission if duplicates exist.

**Acceptance Criteria**
- Adding the same address twice shows the toast and does not add a second entry.

**Files to Create/Modify**
- `components/escrow/CreateEscrowForm.tsx` (Modify)
- `components/escrow/RoommateInput.tsx` (Modify)

**Test Requirements**
- Add address A twice; verify only one entry exists in state.

---

### [Issue #74] Escrow: Auto-Save Form Draft to localStorage
**Description**
Persist form state to `localStorage` so users can resume if they reload the page.

**Requirements**
- Save on every field change, debounced 1 second.
- On page load, if draft exists, show "Resume draft?" banner.
- Clear draft on successful form submission.

**Acceptance Criteria**
- Fill half the form, reload, click "Resume draft" — fields are restored.

**Files to Create/Modify**
- `components/escrow/CreateEscrowForm.tsx` (Modify)
- `hooks/useFormDraft.ts` (Create)

**Test Requirements**
- Fill form, reload, click Resume; verify fields match what was entered.

---

### [Issue #75] Escrow: Unsaved Changes Warning on Navigation
**Description**
Warn the user before navigating away from the create escrow form if there are unsaved changes.

**Requirements**
- Use a `useBeforeUnload` hook listening to the `beforeunload` event.
- Show browser confirm dialog: "Leave page? Your escrow draft will not be saved."

**Acceptance Criteria**
- Typing in the form then clicking a nav link shows the browser confirmation.

**Files to Create/Modify**
- `components/escrow/CreateEscrowForm.tsx` (Modify)
- `hooks/useBeforeUnload.ts` (Create)

**Test Requirements**
- Enter text; navigate away; confirm dialog appears.

---

### [Issue #76] Escrow: Share Percentage Auto-Calculation
**Description**
Show each roommate's share as a percentage of total rent in real time.

**Requirements**
- Next to each share input display `(XX.X%)` = `share / totalRent * 100`.
- "Remaining: 250 XLM" shown at the bottom.
- Total exceeding `totalRent` highlights remaining in red.

**Acceptance Criteria**
- Total 1000, roommate 400 → shows "40.0%" and "Remaining: 600".

**Files to Create/Modify**
- `components/escrow/RoommateInput.tsx` (Modify)
- `components/escrow/CreateEscrowForm.tsx` (Modify)

**Test Requirements**
- Unit test: 3 roommates summing to total shows 0 remaining.

---

### [Issue #77] Escrow: Deadline Calendar Picker
**Description**
Replace the plain date text input with a styled calendar date picker.

**Requirements**
- Native `<input type="date">` styled to match the dark glass design system.
- Minimum selectable date must be tomorrow.
- Display selected date formatted as "MMM DD, YYYY".

**Acceptance Criteria**
- Selecting a date shows its formatted version and stores it in form state. Today is prevented.

**Files to Create/Modify**
- `components/escrow/CreateEscrowForm.tsx` (Modify)
- `components/ui/date-input.tsx` (Create)

**Test Requirements**
- Select a date; verify formatted string and ISO value in state.

---

### [Issue #78] Escrow: Token Selector from Supported List
**Description**
Replace the hardcoded token dropdown with a curated list of supported tokens.

**Requirements**
- Define `SUPPORTED_TOKENS` constant with `{ symbol, name, assetCode, issuer }`.
- Styled dropdown showing token name and symbol.
- Selecting a token updates `tokenAddress` in form state.

**Acceptance Criteria**
- Selecting "USDC" updates form state with the USDC testnet issuer address.

**Files to Create/Modify**
- `lib/stellar/config.ts` (Modify — add SUPPORTED_TOKENS)
- `components/escrow/CreateEscrowForm.tsx` (Modify)
- `components/ui/token-select.tsx` (Create)

**Test Requirements**
- Select each token; verify the correct address is stored in form state.

---

### [Issue #79] Escrow: Create Success Confirmation Page
**Description**
After successful escrow creation, redirect to a dedicated success screen.

**Requirements**
- Shows: confetti animation, contract ID (copyable), "View Escrow" and "Share with Roommates" buttons.
- Auto-transitions to `/escrow/{contractId}` after 8 seconds or on button click.
- Share button copies a deep link to the clipboard.

**Acceptance Criteria**
- On successful creation, the success page renders with the real contract ID.

**Files to Create/Modify**
- `app/escrow/success/page.tsx` (Create)
- `components/escrow/CreateEscrowForm.tsx` (Modify — redirect on success)

**Test Requirements**
- Mock a successful creation; verify redirect to `/escrow/success?id=CONTRACT_ID`.

---

### [Issue #80] Escrow: Fee Estimation Display
**Description**
Show an estimated Stellar network fee before the user submits the create escrow transaction.

**Requirements**
- Fetch base fee from Horizon `GET /fee_stats` before submission.
- Display "Estimated network fee: ~0.00001 XLM" in the review step.
- If fee fetch fails, show "Fee unavailable" without blocking submission.

**Acceptance Criteria**
- Review step shows the formatted fee estimate.

**Files to Create/Modify**
- `components/escrow/CreateEscrowForm.tsx` (Modify)
- `lib/stellar/queries.ts` (Modify — add getFeeStats)

**Test Requirements**
- Mock fee stats API; verify fee renders in the review step.

---

## Stage 14: Escrow Dashboard (Issues 81–89)

### [Issue #81] Dashboard: Real Contract State from Soroban RPC
**Description**
Replace `MOCK_CONTRACT_STATE` with real data fetched from Soroban RPC.

**Requirements**
- Call `getContractState(contractId)` from `lib/stellar/queries.ts`.
- Show loading skeleton while fetching; show error state if not found.

**Acceptance Criteria**
- Visiting `/escrow/REAL_CONTRACT_ID` shows live contract data.

**Files to Create/Modify**
- `app/escrow/[contractId]/page.tsx` (Modify)
- `lib/stellar/queries.ts` (Modify — add getContractState)

**Test Requirements**
- Mock Soroban RPC; verify state maps correctly to page UI.

---

### [Issue #82] Dashboard: Auto-Refresh Contract State Every 30s
**Description**
Automatically poll the Soroban RPC for fresh contract state every 30 seconds.

**Requirements**
- Use `setInterval` inside `useEffect`; clear on unmount.
- Pause polling when browser tab is hidden.

**Acceptance Criteria**
- Without user interaction, the dashboard fetches new state every 30 seconds.

**Files to Create/Modify**
- `app/escrow/[contractId]/page.tsx` (Modify)
- `hooks/useContractPolling.ts` (Create)

**Test Requirements**
- Mock two different RPC responses; verify second renders after 30s.

---

### [Issue #83] Dashboard: Landlord Release Action Wiring
**Description**
Wire the "Release Funds" button to submit a Soroban `release` transaction via Freighter.

**Requirements**
- Only render button when `isConnected` and `publicKey === landlord`.
- Build release XDR, show `TransactionReview` modal, sign via Freighter, submit to Horizon.
- On success: toast "Funds released to landlord." and refresh state.

**Acceptance Criteria**
- Landlord sees and can use the Release button. Non-landlord users do not.

**Files to Create/Modify**
- `app/escrow/[contractId]/page.tsx` (Modify)
- `lib/stellar/actions/release.ts` (Modify — integrate real signing)

**Test Requirements**
- Mock Freighter sign + Horizon submit; verify success toast and state refresh.

---

### [Issue #84] Dashboard: Roommate Contribute Action Wiring
**Description**
Wire the contribution form to submit a real Soroban `contribute` transaction via Freighter.

**Requirements**
- Build contribute XDR using `lib/stellar/actions/contribute.ts`.
- Show `TransactionReview` before signing. Sign and submit.
- On success: refresh paid balance and show success toast.

**Acceptance Criteria**
- A roommate can contribute and see their paid amount update on the dashboard.

**Files to Create/Modify**
- `components/escrow/ContributeForm.tsx` (Modify — remove mock setTimeout)
- `lib/stellar/actions/contribute.ts` (Modify — integrate real signing)

**Test Requirements**
- Mock Freighter + Horizon; verify `paid` balance updates after contribution.

---

### [Issue #85] Dashboard: Contract Not Found Error State
**Description**
Show a specific error state when a user visits `/escrow/{id}` with a non-existent contract ID.

**Requirements**
- If `getContractState` returns null, render: "Escrow not found. Check the contract ID."
- Include "Go to History" and "Create New Escrow" links. Do not redirect automatically.

**Acceptance Criteria**
- Visiting `/escrow/INVALID_ID` renders the not-found state, not a crash.

**Files to Create/Modify**
- `app/escrow/[contractId]/page.tsx` (Modify)
- `components/escrow/EscrowNotFound.tsx` (Create)

**Test Requirements**
- Mock RPC returning null; verify not-found component renders.

---

### [Issue #86] Dashboard: Refund Claim Action Wiring
**Description**
Wire the "Claim Refund" button so roommates can reclaim deposits after the deadline.

**Requirements**
- Button visible only if: deadline passed AND escrow not fully funded AND current user has non-zero `paid`.
- Build and sign a `claim_refund` transaction via Freighter.
- On success: toast "Refund of X XLM sent." and refresh state.

**Acceptance Criteria**
- Eligible roommate sees Claim Refund after deadline. Ineligible users do not.

**Files to Create/Modify**
- `app/escrow/[contractId]/page.tsx` (Modify)
- `lib/stellar/actions/claimRefund.ts` (Modify — integrate real signing)

**Test Requirements**
- Mock contract state past deadline with partial funding; verify button appears.

---

### [Issue #87] Dashboard: Roommate Share Breakdown Table
**Description**
Replace the simple roommate list with a full breakdown table.

**Requirements**
- Columns: Address (truncated, copyable), Expected, Paid, Remaining, Status badge.
- Status badges: green (Paid), amber (Partial), gray (Pending). Sort Pending first.

**Acceptance Criteria**
- Table renders for all roommates with correct amounts from contract state.

**Files to Create/Modify**
- `components/escrow/RoommateTable.tsx` (Create)
- `app/escrow/[contractId]/page.tsx` (Modify)

**Test Requirements**
- Render with 3 roommates in different states; verify correct badge for each.

---

### [Issue #88] Dashboard: Copy Contract ID Button
**Description**
Add a copy-to-clipboard button next to the contract ID on the escrow dashboard.

**Requirements**
- Show contract ID truncated as `CABC...XY12`.
- Clicking the copy icon copies the full ID. "Copied!" tooltip for 2 seconds.

**Acceptance Criteria**
- Copying the contract ID and pasting shows the full contract address.

**Files to Create/Modify**
- `app/escrow/[contractId]/page.tsx` (Modify)
- `components/ui/copy-button.tsx` (Create)

**Test Requirements**
- Click copy button; verify `navigator.clipboard.writeText` called with full ID.

---

### [Issue #89] Dashboard: Escrow Deadline Countdown Timer
**Description**
Show a live countdown timer displaying days, hours, and minutes remaining until the deadline.

**Requirements**
- Calculate from `deadline` (Unix timestamp) vs `Date.now()`. Update every minute.
- Deadline passed → show "EXPIRED" in red. Under 24 hours → amber.

**Acceptance Criteria**
- 2-day deadline shows "2d 4h 32m". After deadline, "EXPIRED" renders in red.

**Files to Create/Modify**
- `components/escrow/DeadlineCountdown.tsx` (Create)
- `app/escrow/[contractId]/page.tsx` (Modify)

**Test Requirements**
- Mock deadline as yesterday; verify "EXPIRED". Mock as tomorrow; verify countdown.

---

## Stage 15: Transaction History (Issues 90–97)

### [Issue #90] History: Replace Mock Data with Real Horizon API
**Description**
Remove hardcoded `MOCK_TRANSACTIONS` and replace with real data from Stellar Horizon.

**Requirements**
- Fetch from `lib/stellar/history.ts` using the connected `publicKey`.
- Redirect to `/connect` if no wallet connected.
- Handle empty history with the `EmptyState` component.

**Acceptance Criteria**
- Connected wallet user sees their real Stellar transaction history.

**Files to Create/Modify**
- `app/history/page.tsx` (Modify — remove mock data)
- `lib/stellar/history.ts` (Modify — ensure getTransactionHistory is correct)

**Test Requirements**
- Mock Horizon response; verify transactions render in correct order.

---

### [Issue #91] History: Date Range Filter UI
**Description**
Add a date range filter to the history page.

**Requirements**
- Two `<input type="date">` fields: "From" and "To". Client-side filtering.
- "Clear" button resets both filters. Result count shown: "Showing 3 of 12 transactions".

**Acceptance Criteria**
- Setting a date range hides transactions outside the range.

**Files to Create/Modify**
- `app/history/page.tsx` (Modify)
- `components/history/DateRangeFilter.tsx` (Create)

**Test Requirements**
- Mock 5 transactions across different dates; apply filter; verify correct subset.

---

### [Issue #92] History: Transaction Type Filter
**Description**
Add a filter dropdown for transaction type (All, Contribution, Release, Refund).

**Requirements**
- Read `operationType` from the history data. Client-side filtering.
- Compatible with the date filter.

**Acceptance Criteria**
- Selecting "Release" shows only release transactions.

**Files to Create/Modify**
- `app/history/page.tsx` (Modify)
- `components/history/TypeFilter.tsx` (Create)

**Test Requirements**
- Mock mixed transaction types; apply type filter; verify subset renders.

---

### [Issue #93] History: Transaction Detail Modal
**Description**
Clicking a transaction card opens a modal with full transaction details.

**Requirements**
- Shows: hash, date/time, amount, fee, operation type, source, destination, memo.
- Transaction hash links to Stellar Expert. Dismisses on Escape or backdrop click.

**Acceptance Criteria**
- Clicking a transaction opens the modal with all fields populated.

**Files to Create/Modify**
- `components/history/TransactionDetailModal.tsx` (Create)
- `app/history/page.tsx` (Modify)

**Test Requirements**
- Click a transaction; verify modal renders. Press Escape; verify modal closes.

---

### [Issue #94] History: Export Transactions as CSV
**Description**
Add an "Export CSV" button that downloads the current filtered transaction list.

**Requirements**
- Columns: Date, Type, Amount, Fee, Hash, Status.
- File name: `payeasy-history-YYYY-MM-DD.csv`. Uses browser Blob + anchor download.
- Respects currently active filters.

**Acceptance Criteria**
- Clicking "Export CSV" downloads a file with the correct number of rows.

**Files to Create/Modify**
- `app/history/page.tsx` (Modify)
- `lib/exportCsv.ts` (Create)

**Test Requirements**
- Mock 3 transactions; click export; verify CSV content.

---

### [Issue #95] History: Horizon Cursor-Based Pagination
**Description**
Implement proper cursor-based pagination using Horizon's `cursor` parameter.

**Requirements**
- Show 10 transactions per page. "Load more" fetches next page via `paging_token`.
- Loading state on button. Hide button and show "All transactions loaded" when exhausted.

**Acceptance Criteria**
- First page shows 10 transactions. "Load more" appends the next 10.

**Files to Create/Modify**
- `app/history/page.tsx` (Modify)
- `lib/stellar/history.ts` (Modify — support cursor param)

**Test Requirements**
- Mock 15 results; verify first 10 render, then 5 more on "Load more".

---

### [Issue #96] History: Failed Transaction Retry Button
**Description**
For failed-status transactions, show a "Retry" button that re-opens the relevant flow.

**Requirements**
- Detect failed status from Horizon transaction record.
- Map transaction type to the correct retry route.

**Acceptance Criteria**
- A failed contribute transaction shows "Retry" which navigates to the escrow contribute form.

**Files to Create/Modify**
- `components/history/TransactionCard.tsx` (Modify)

**Test Requirements**
- Render a failed contribute card; click Retry; verify correct navigation.

---

### [Issue #97] History: Real-Time New Transaction Polling
**Description**
Poll for new transactions every 15 seconds and prepend them to the list if found.

**Requirements**
- Compare new results against current list using transaction hash as unique key.
- New transactions prepend with a "New" badge that fades after 5 seconds.

**Acceptance Criteria**
- A new transaction appears in the list within 15 seconds of on-chain confirmation.

**Files to Create/Modify**
- `app/history/page.tsx` (Modify)
- `hooks/useTransactionPolling.ts` (Create)

**Test Requirements**
- Mock polling to return a new transaction on second call; verify it prepends.

---

## Stage 16: Wallet Component Polish (Issues 98–104)

### [Issue #98] Wallet: Network Mismatch Warning in Navbar Button
**Description**
Display an amber warning indicator on `ConnectWalletButton` if the wallet's network doesn't match the app's.

**Requirements**
- If mismatch, show amber `!` badge over the wallet button.
- Hover tooltip: "Wallet is on Mainnet, app uses Testnet."

**Acceptance Criteria**
- Freighter on Mainnet while app is Testnet shows the amber badge.

**Files to Create/Modify**
- `components/wallet/ConnectWalletButton.tsx` (Modify)
- `lib/stellar/wallet.ts` (Modify — add getFreighterNetwork)

**Test Requirements**
- Mock Freighter network as mainnet; verify badge renders.

---

### [Issue #99] Wallet: Balance Display in Wallet Dropdown
**Description**
Show the user's XLM balance inside the connected wallet dropdown menu.

**Requirements**
- Fetch balance on dropdown open. Display as "1,234.56 XLM" with a skeleton while loading.

**Acceptance Criteria**
- Opening the wallet dropdown shows the formatted XLM balance.

**Files to Create/Modify**
- `components/wallet/ConnectWalletButton.tsx` (Modify)
- `hooks/useWalletBalance.ts` (Create or reuse from Issue #66)

**Test Requirements**
- Mock balance API; open dropdown; verify balance renders.

---

### [Issue #100] Wallet: Freighter Version Detection
**Description**
Check the installed Freighter version and warn users if it's outdated.

**Requirements**
- Minimum required version: 10.0.0.
- If below minimum, show banner on `/connect`: "Please update Freighter to version 10+."
- Link to Chrome Web Store for the update.

**Acceptance Criteria**
- Freighter below v10 renders the update banner.

**Files to Create/Modify**
- `lib/stellar/wallet.ts` (Modify — add getFreighterVersion)
- `app/connect/page.tsx` (Modify)

**Test Requirements**
- Mock Freighter version as 9.0.0; verify banner renders.

---

### [Issue #101] Wallet: Mobile-Friendly Wallet Dropdown
**Description**
On mobile screens, replace the dropdown with a bottom sheet for wallet options.

**Requirements**
- Below `sm` breakpoint, render a slide-up sheet from the bottom of the screen.
- Drag handle, backdrop overlay, dismisses on swipe-down or backdrop click.

**Acceptance Criteria**
- On a 375px viewport, tapping the wallet button opens a bottom sheet.

**Files to Create/Modify**
- `components/wallet/ConnectWalletButton.tsx` (Modify)
- `components/ui/bottom-sheet.tsx` (Create)

**Test Requirements**
- Set viewport to 375px; verify bottom sheet opens on click.

---

### [Issue #102] Wallet: Address Format Toggle
**Description**
Allow the user to toggle the displayed address between truncated and full format in the wallet dropdown.

**Requirements**
- Small "expand" icon next to the truncated address.
- Clicking shows the full address. Auto-collapses when the dropdown closes.

**Acceptance Criteria**
- Clicking expand shows the full 56-character Stellar address.

**Files to Create/Modify**
- `components/wallet/ConnectWalletButton.tsx` (Modify)

**Test Requirements**
- Click expand; verify full address renders. Close dropdown; reopen; verify truncated.

---

### [Issue #103] Wallet: Multi-Account Change Detection
**Description**
Detect when Freighter switches to a different account while connected and prompt the user to reconnect.

**Requirements**
- Poll `getPublicKey()` every 30 seconds and compare to stored `publicKey`.
- If accounts differ, show banner: "Your Freighter account changed. Reconnect to continue."

**Acceptance Criteria**
- Switching Freighter accounts while connected shows the reconnect banner.

**Files to Create/Modify**
- `context/StellarContext.tsx` (Modify)
- `components/ui/account-changed-banner.tsx` (Create)

**Test Requirements**
- Mock `getPublicKey()` returning different address on second call; verify banner.

---

### [Issue #104] Wallet: Copy Address Micro-Animation
**Description**
Add a smooth micro-animation to the copy address action: copy icon morphs to checkmark and back.

**Requirements**
- Use `AnimatePresence` to swap icons over 150ms. Checkmark in accent green for 2 seconds.
- Works in both the wallet dropdown and the `/connect` page address card.

**Acceptance Criteria**
- Clicking copy plays the icon swap animation.

**Files to Create/Modify**
- `components/wallet/ConnectWalletButton.tsx` (Modify)
- `app/connect/page.tsx` (Modify)
- `components/ui/copy-button.tsx` (Modify)

**Test Requirements**
- Click copy; verify icon changes to checkmark then reverts after 2s.

---

## Stage 17: Accessibility (Issues 105–113)

### [Issue #105] a11y: ARIA Labels on All Icon Buttons
**Description**
Audit every icon-only button and add descriptive `aria-label` attributes.

**Requirements**
- All `<button>` elements without visible text must have `aria-label`.
- Audit scope: Navbar, ConnectWalletButton, EscrowDashboard, TransactionCard.

**Acceptance Criteria**
- Running axe shows zero "button-name" violations.

**Files to Create/Modify**
- `components/landing/Navbar.tsx` (Modify)
- `components/wallet/ConnectWalletButton.tsx` (Modify)
- `app/escrow/[contractId]/page.tsx` (Modify)
- `components/history/TransactionCard.tsx` (Modify)

**Test Requirements**
- Run axe-core audit; verify zero missing label violations.

---

### [Issue #106] a11y: Keyboard Navigation for Modals
**Description**
Ensure all modals trap focus within them while open and return focus to the trigger on close.

**Requirements**
- Implement a `useFocusTrap` hook. On open: focus first interactive element. Escape closes all modals.

**Acceptance Criteria**
- Tab key cycles only through modal elements while modal is open.

**Files to Create/Modify**
- `hooks/useFocusTrap.ts` (Create)
- `components/escrow/TransactionConfirmModal.tsx` (Modify)
- `components/ui/confirm-dialog.tsx` (Modify)
- `components/history/TransactionDetailModal.tsx` (Modify)

**Test Requirements**
- Open modal via keyboard; Tab through elements; verify focus stays inside.

---

### [Issue #107] a11y: Form Field Labels and Descriptions
**Description**
Ensure every form input has a visible `<label>` and helper text linked via `aria-describedby`.

**Requirements**
- Audit all inputs in `CreateEscrowForm`, `RoommateInput`, `ContributeForm`.
- Add `<label htmlFor="...">` for every input. Link errors via `aria-describedby`.

**Acceptance Criteria**
- Clicking any form label focuses its associated input. Screen reader announces errors.

**Files to Create/Modify**
- `components/escrow/CreateEscrowForm.tsx` (Modify)
- `components/escrow/RoommateInput.tsx` (Modify)
- `components/escrow/ContributeForm.tsx` (Modify)

**Test Requirements**
- Run axe-core; zero "label" violations.

---

### [Issue #108] a11y: Focus Visible Indicator
**Description**
Ensure all interactive elements have a clearly visible focus ring.

**Requirements**
- Global focus style: `outline: 2px solid #5c7cfa; outline-offset: 3px;` in `globals.css`.
- Remove any `outline: none` on focusable elements.

**Acceptance Criteria**
- Tabbing through the page shows a visible blue outline on every focused element.

**Files to Create/Modify**
- `app/globals.css` (Modify)

**Test Requirements**
- Tab through entire page; verify every interactive element shows a visible focus ring.

---

### [Issue #109] a11y: Screen Reader Announcements for Wallet State
**Description**
Announce wallet connection state changes to screen readers via an `aria-live` region.

**Requirements**
- Add visually hidden `<div aria-live="polite" aria-atomic="true">` to the app shell.
- Announce connect, disconnect, and error events.

**Acceptance Criteria**
- Screen reader reads wallet state changes without user focus changing.

**Files to Create/Modify**
- `components/ui/app-shell.tsx` (Modify)
- `context/StellarContext.tsx` (Modify — expose announce callback)

**Test Requirements**
- Connect wallet; verify screen reader announces new state.

---

### [Issue #110] a11y: Table Accessibility for Roommate Breakdown
**Description**
Ensure the roommate share breakdown table is properly accessible.

**Requirements**
- Use semantic `<table>`, `<thead>`, `<tbody>`, `<th scope="col">`, `<td>` elements.
- Sortable columns have `aria-sort` attribute.

**Acceptance Criteria**
- Screen reader announces column headers when navigating table cells.

**Files to Create/Modify**
- `components/escrow/RoommateTable.tsx` (Modify)

**Test Requirements**
- Run axe-core; zero table-related violations.

---

### [Issue #111] a11y: Color Contrast Audit and Fixes
**Description**
Audit text/background color combinations for WCAG AA compliance.

**Requirements**
- Audit `dark-400`, `dark-500`, `dark-600` text on `#0a0a0f`.
- Fix any failing combinations. Body text must pass 4.5:1. Large headings must pass 3:1.

**Acceptance Criteria**
- All body text passes WCAG AA. Large headings pass WCAG AA.

**Files to Create/Modify**
- `app/globals.css` (Modify)
- `tailwind.config.ts` (Modify — adjust dark palette if needed)

**Test Requirements**
- Run automated contrast check; zero AA failures on body text.

---

### [Issue #112] a11y: DottedSurface Reduced Motion Support
**Description**
Respect the user's OS-level "reduce motion" preference for the Three.js animation.

**Requirements**
- Read `window.matchMedia("(prefers-reduced-motion: reduce)")`.
- If preferred, skip the animate loop and render a static dot grid.

**Acceptance Criteria**
- With Reduce Motion enabled in OS, the dotted surface is static.

**Files to Create/Modify**
- `components/ui/dotted-surface.tsx` (Modify)
- `app/layout.tsx` (Modify)

**Test Requirements**
- Enable Reduce Motion in OS; verify no animation plays.

---

### [Issue #113] a11y: Semantic HTML Landmark Audit
**Description**
Ensure each page uses correct semantic HTML landmarks for screen reader navigation.

**Requirements**
- Every page: exactly one `<main>` with unique `aria-label`. Navbar: `<nav aria-label="Main navigation">`. Footer: `<footer>`. Landing sections: `<section aria-labelledby="...">`.

**Acceptance Criteria**
- Running axe-core shows zero landmark-related violations.

**Files to Create/Modify**
- `components/landing/Navbar.tsx` (Modify)
- `components/landing/Footer.tsx` (Modify)
- `components/landing/Features.tsx` (Modify)
- `components/landing/HowItWorks.tsx` (Modify)

**Test Requirements**
- Run axe-core landmark check; zero violations.

---

## Stage 18: Responsive Design (Issues 114–120)

### [Issue #114] Responsive: Touch Target Minimum Sizes
**Description**
Ensure all interactive elements meet the minimum 44×44px touch target size on mobile.

**Requirements**
- Audit and fix all buttons smaller than 44px on mobile. Add `min-h-11 min-w-11` where needed.

**Acceptance Criteria**
- On a 375px viewport, no interactive element is smaller than 44×44px.

**Files to Create/Modify**
- `components/wallet/ConnectWalletButton.tsx` (Modify)
- `components/landing/Navbar.tsx` (Modify)
- `components/escrow/RoommateInput.tsx` (Modify)

**Test Requirements**
- Inspect each element on mobile viewport; verify dimensions ≥ 44×44.

---

### [Issue #115] Responsive: Hero Stats Bar Mobile Layout
**Description**
Fix the three-column stats bar which becomes cramped on screens below 400px.

**Requirements**
- Below `sm`: stack stats vertically (1 column) with dividers. At `lg`+: current layout preserved.

**Acceptance Criteria**
- On a 375px viewport, all three stats are fully readable without horizontal scroll.

**Files to Create/Modify**
- `components/ui/payeasy-hero.tsx` (Modify)

**Test Requirements**
- View hero on 375px; verify all stat labels and values are fully visible.

---

### [Issue #116] Responsive: Escrow Dashboard Mobile Layout
**Description**
Optimize the escrow dashboard for mobile viewports.

**Requirements**
- Single-column stack on mobile. Action buttons full-width on mobile.
- RoommateTable horizontally scrollable on mobile.

**Acceptance Criteria**
- On a 375px viewport, all dashboard content is accessible without horizontal page scroll.

**Files to Create/Modify**
- `app/escrow/[contractId]/page.tsx` (Modify)
- `components/escrow/RoommateTable.tsx` (Modify)

**Test Requirements**
- Render dashboard at 375px; verify no content is clipped off-screen.

---

### [Issue #117] Responsive: History Page Mobile Card Layout
**Description**
Ensure transaction history cards render cleanly on mobile.

**Requirements**
- On mobile: hide the "Fee" column. Amount and date text must not overflow.
- "Export CSV" button full-width below the filter row on mobile.

**Acceptance Criteria**
- History page is fully usable on a 375px viewport.

**Files to Create/Modify**
- `components/history/TransactionCard.tsx` (Modify)
- `app/history/page.tsx` (Modify)

**Test Requirements**
- Render history at 375px; verify all cards and buttons are fully visible.

---

### [Issue #118] Responsive: Connect Page Mobile Layout
**Description**
Verify and fix the `/connect` page layout on mobile.

**Requirements**
- Feature cards stack vertically on mobile. Address code block truncates.
- Action buttons full-width on mobile.

**Acceptance Criteria**
- Connect page is fully usable and readable on a 375px viewport.

**Files to Create/Modify**
- `app/connect/page.tsx` (Modify)

**Test Requirements**
- View connect page at 375px; verify no overflow or clipping.

---

### [Issue #119] Responsive: Footer Mobile Layout
**Description**
Fix the footer's multi-column link layout for mobile.

**Requirements**
- On mobile: stack the three link columns vertically. Each column heading is an accordion.

**Acceptance Criteria**
- Footer on 375px shows stacked columns with no horizontal scroll.

**Files to Create/Modify**
- `components/landing/Footer.tsx` (Modify)

**Test Requirements**
- View footer at 375px; verify no horizontal scroll.

---

### [Issue #120] Responsive: Landscape Orientation Handling
**Description**
Ensure the hero section and connect page display correctly in landscape orientation on mobile.

**Requirements**
- Reduce hero `min-h-screen` to `min-h-[100svh]`.
- Connect page animated icon scales down on landscape.

**Acceptance Criteria**
- On iPhone SE in landscape, the hero CTA is visible without scrolling.

**Files to Create/Modify**
- `components/ui/payeasy-hero.tsx` (Modify)
- `app/connect/page.tsx` (Modify)

**Test Requirements**
- View hero in landscape on 667px-wide viewport; verify CTA is visible.

---

## Stage 19: SEO & Metadata (Issues 121–126)

### [Issue #121] SEO: Dynamic Metadata for Escrow Pages
**Description**
Generate dynamic `<title>` and `<meta description>` for each escrow dashboard page.

**Requirements**
- Export `generateMetadata({ params })` from `app/escrow/[contractId]/page.tsx`.
- Title: `Escrow {shortId} — PayEasy`. Description mentions contract and Stellar.

**Acceptance Criteria**
- Page source for `/escrow/CABC...` shows correct title and meta description.

**Files to Create/Modify**
- `app/escrow/[contractId]/page.tsx` (Modify)

**Test Requirements**
- Verify `<title>` tag in page HTML contains the short contract ID.

---

### [Issue #122] SEO: Open Graph Image Setup
**Description**
Configure a static Open Graph image for social media link previews.

**Requirements**
- Create 1200×630px OG image at `/public/og-image.png`.
- Add `og:image`, `twitter:card`, and `twitter:image` meta tags to root layout.

**Acceptance Criteria**
- Pasting the site URL into a social card validator shows the PayEasy OG image.

**Files to Create/Modify**
- `public/og-image.png` (Create)
- `app/layout.tsx` (Modify — add OG meta)

**Test Requirements**
- Validate with opengraph.xyz; verify image and title display correctly.

---

### [Issue #123] SEO: Schema.org Structured Data
**Description**
Add JSON-LD structured data to the homepage for search engine rich results.

**Requirements**
- Use `SoftwareApplication` schema with `name`, `description`, `applicationCategory: "FinanceApplication"`.
- Inject via `<Script type="application/ld+json">` in root layout.

**Acceptance Criteria**
- Google Rich Results Test validates the data without errors.

**Files to Create/Modify**
- `app/layout.tsx` (Modify)

**Test Requirements**
- Test with Google Rich Results Test; zero validation errors.

---

### [Issue #124] SEO: Sitemap Generation
**Description**
Generate a `sitemap.xml` for all static routes.

**Requirements**
- Use Next.js App Router `sitemap.ts` convention.
- Include: `/`, `/connect`, `/history`, `/escrow/create`, `/privacy`, `/terms`.

**Acceptance Criteria**
- `GET /sitemap.xml` returns a valid XML sitemap.

**Files to Create/Modify**
- `app/sitemap.ts` (Create)

**Test Requirements**
- Fetch `/sitemap.xml` in dev; verify all routes are listed.

---

### [Issue #125] SEO: robots.txt Configuration
**Description**
Create a `robots.txt` that allows crawlers on public pages and disallows `/escrow/`.

**Requirements**
- Use Next.js App Router `robots.ts` convention.
- Allow: `/`, `/connect`, `/history`. Disallow: `/escrow/`.

**Acceptance Criteria**
- `GET /robots.txt` returns the correct disallow rules.

**Files to Create/Modify**
- `app/robots.ts` (Create)

**Test Requirements**
- Fetch `/robots.txt`; verify `/escrow/` is in the Disallow list.

---

### [Issue #126] SEO: Font Optimization with next/font
**Description**
Replace Google Fonts CDN imports with `next/font` for self-hosting and improved performance.

**Requirements**
- Use `next/font/google` to load Inter, Space Grotesk, and JetBrains Mono.
- Remove all `@import url(...)` from `globals.css`. Apply fonts via CSS variables.

**Acceptance Criteria**
- Lighthouse audit shows no render-blocking font warnings.

**Files to Create/Modify**
- `app/layout.tsx` (Modify — add next/font setup)
- `app/globals.css` (Modify — remove @import lines)

**Test Requirements**
- Run Lighthouse audit; verify no render-blocking resource warnings for fonts.

---

## Stage 20: Performance (Issues 127–134)

### [Issue #127] Perf: Replace img Tags with next/image in Hero Carousel
**Description**
Replace all bare `<img>` tags in the hero carousel with `next/image`.

**Requirements**
- Use `<Image src={...} fill style={{ objectFit: "cover" }} alt={...} />`.
- Add Unsplash and pravatar to `next.config.js` `images.remotePatterns`.
- Add `priority` prop to the first visible carousel image.

**Acceptance Criteria**
- Build produces zero `@next/next/no-img-element` lint warnings.

**Files to Create/Modify**
- `components/ui/payeasy-hero.tsx` (Modify)
- `next.config.js` (Modify)

**Test Requirements**
- Run `npm run build`; verify zero img-element lint warnings.

---

### [Issue #128] Perf: WebGL Fallback for Dotted Surface
**Description**
Detect WebGL availability and skip the Three.js renderer gracefully if unavailable.

**Requirements**
- Test `document.createElement("canvas").getContext("webgl")` before init.
- If unavailable, render empty div and log a single `console.warn`.

**Acceptance Criteria**
- In a WebGL-disabled browser, the app renders without any console errors.

**Files to Create/Modify**
- `components/ui/dotted-surface.tsx` (Modify)

**Test Requirements**
- Disable WebGL via browser flag; verify no console errors.

---

### [Issue #129] Perf: Low-End Device Detection for DottedSurface
**Description**
Disable the Three.js animation on low-end devices to prevent frame drops.

**Requirements**
- Use `navigator.hardwareConcurrency < 4` as a proxy for low-end device.
- If low-end, skip `DottedSurface` and show a CSS-only gradient background.

**Acceptance Criteria**
- On a device with 2 CPU cores, the Three.js canvas does not render.

**Files to Create/Modify**
- `components/ui/dotted-surface.tsx` (Modify)
- `components/ui/app-shell.tsx` (Modify)

**Test Requirements**
- Mock `navigator.hardwareConcurrency` as 2; verify canvas does not mount.

---

### [Issue #130] Perf: Lazy Load Carousel Images
**Description**
Add lazy loading to carousel images so off-screen images don't block page paint.

**Requirements**
- Only the first 2 visible cards have `priority` or `loading="eager"`. All others use `loading="lazy"`.

**Acceptance Criteria**
- Network panel shows carousel images loading as they scroll into view.

**Files to Create/Modify**
- `components/ui/payeasy-hero.tsx` (Modify)

**Test Requirements**
- Open Network panel; verify only first 2 images load on initial paint.

---

### [Issue #131] Perf: Memoize Escrow State Computations
**Description**
Wrap expensive computed values on the escrow dashboard in `useMemo`.

**Requirements**
- `totalFunded`, `fundingPercentage`, and `roommateStatusMap` all in `useMemo`.

**Acceptance Criteria**
- React DevTools Profiler shows computations don't re-run on unrelated state changes.

**Files to Create/Modify**
- `app/escrow/[contractId]/page.tsx` (Modify)

**Test Requirements**
- Profile renders; verify memoized values only recalculate when dependencies change.

---

### [Issue #132] Perf: Prefetch Key Routes on Hover
**Description**
Prefetch `/connect` and `/escrow/create` routes on hover over their links.

**Requirements**
- Use `router.prefetch("/connect")` inside an `onMouseEnter` handler on Navbar and CTA buttons.

**Acceptance Criteria**
- Hovering "Get Started" triggers a prefetch request in the Network panel.

**Files to Create/Modify**
- `components/landing/Navbar.tsx` (Modify)
- `components/landing/CTA.tsx` (Modify)

**Test Requirements**
- Open Network panel; hover button; verify prefetch request appears.

---

### [Issue #133] Perf: Debounce Resize Handler in DottedSurface
**Description**
Debounce the `handleResize` callback in `DottedSurface` to prevent excessive calls.

**Requirements**
- Wrap `handleResize` in a 150ms debounce without an external library.

**Acceptance Criteria**
- During window resize, the renderer update fires at most once per 150ms.

**Files to Create/Modify**
- `components/ui/dotted-surface.tsx` (Modify)

**Test Requirements**
- Log calls to `handleResize`; resize rapidly; verify max 1 call per 150ms.

---

### [Issue #134] Perf: next.config.js Image Optimization Settings
**Description**
Configure `next.config.js` with proper image optimization settings.

**Requirements**
- `remotePatterns` for `images.unsplash.com` and `i.pravatar.cc`.
- `formats: ["image/avif", "image/webp"]` and `minimumCacheTTL: 3600`.

**Acceptance Criteria**
- `next/image` serves WebP or AVIF versions of Unsplash images.

**Files to Create/Modify**
- `next.config.js` (Modify)

**Test Requirements**
- Check Network panel; `Content-Type` shows `image/webp` for optimized images.

---

## Stage 21: Real-Time & Polling (Issues 135–139)

### [Issue #135] Realtime: Escrow Event Subscription via Horizon Stream
**Description**
Subscribe to real-time Stellar ledger events for the escrow contract using Horizon's SSE endpoint.

**Requirements**
- Use Horizon's `transactions().forAccount().stream()` in `hooks/useEscrowEvents.ts`.
- On each new event, refresh contract state and prepend a log entry.
- Clean up the stream on component unmount.

**Acceptance Criteria**
- A new transaction affecting the escrow contract updates the dashboard within 5 seconds.

**Files to Create/Modify**
- `hooks/useEscrowEvents.ts` (Modify)
- `app/escrow/[contractId]/page.tsx` (Modify)

**Test Requirements**
- Mock SSE stream emitting an event; verify dashboard state updates.

---

### [Issue #136] Realtime: Transaction History Live Updates
**Description**
Subscribe to new transactions for the connected wallet using Horizon's real-time stream.

**Requirements**
- Open a Horizon SSE stream for wallet transactions on page mount.
- New transactions prepend with a "New" badge (fades after 5s). Close stream on unmount.

**Acceptance Criteria**
- A new contribution appears in the history list within 5 seconds without page refresh.

**Files to Create/Modify**
- `hooks/useTransactionPolling.ts` (Modify — upgrade to SSE stream)
- `app/history/page.tsx` (Modify)

**Test Requirements**
- Mock SSE stream; verify new transaction prepends to the list.

---

### [Issue #137] Realtime: Wallet Balance Auto-Refresh
**Description**
Automatically refresh the wallet's XLM balance every 60 seconds and after any transaction.

**Requirements**
- Re-fetch balance when a new transaction is detected. Poll every 60 seconds as fallback.

**Acceptance Criteria**
- After contributing to an escrow, the balance updates within 60 seconds.

**Files to Create/Modify**
- `hooks/useWalletBalance.ts` (Modify)
- `components/wallet/ConnectWalletButton.tsx` (Modify)

**Test Requirements**
- Mock balance change after 60s; verify dropdown shows new balance.

---

### [Issue #138] Realtime: Network Health Status Indicator
**Description**
Show a real-time Stellar network health indicator in the footer.

**Requirements**
- Poll `lib/stellar/health.ts` every 5 minutes. Colored dot: green/amber/red.
- Hover tooltip: "Stellar Network: Healthy (last checked 2m ago)".

**Acceptance Criteria**
- Footer shows a green dot when Horizon is reachable.

**Files to Create/Modify**
- `components/landing/Footer.tsx` (Modify)
- `hooks/useNetworkStatus.ts` (Modify)
- `components/ui/network-indicator.tsx` (Create)

**Test Requirements**
- Mock health check returning degraded; verify amber dot renders.

---

### [Issue #139] Realtime: Contract Event Log Display
**Description**
Display a chronological log of all events emitted by the escrow contract on the dashboard.

**Requirements**
- Fetch events from `lib/stellar/events.ts`. Display as a vertical timeline with icons.
- New events prepend at the top via polling every 30s.

**Acceptance Criteria**
- Escrow dashboard shows all past events with correct icons and descriptions.

**Files to Create/Modify**
- `components/escrow/EventLog.tsx` (Create)
- `app/escrow/[contractId]/page.tsx` (Modify)
- `lib/stellar/events.ts` (Modify — ensure getContractEvents works)

**Test Requirements**
- Mock 3 contract events; verify all 3 render in reverse chronological order.

---

## Stage 22: UX Polish & Micro-Interactions (Issues 140–150)

### [Issue #140] UX: Confetti Animation on Escrow Creation
**Description**
Play a confetti burst animation on the escrow creation success page.

**Requirements**
- Pure CSS/canvas confetti using brand colors: `#5c7cfa`, `#20c997`, `#748ffc`.
- Plays once on mount. Skipped if `prefers-reduced-motion` is set.

**Acceptance Criteria**
- After successful escrow creation, confetti bursts on the success screen.

**Files to Create/Modify**
- `components/ui/confetti.tsx` (Create)
- `app/escrow/success/page.tsx` (Modify)

**Test Requirements**
- Render success page; verify confetti canvas mounts and animation plays.

---

### [Issue #141] UX: Wallet Connected Success Toast
**Description**
Show a success toast immediately when the user's wallet connects successfully.

**Requirements**
- Trigger `useToast().success("Wallet connected — " + truncatedKey)` from `StellarContext`.
- Must not show on page reload session restore (only on explicit connect action).

**Acceptance Criteria**
- Clicking Connect Wallet and approving in Freighter shows the success toast.

**Files to Create/Modify**
- `context/StellarContext.tsx` (Modify)

**Test Requirements**
- Trigger connect; verify toast appears with the truncated address.

---

### [Issue #142] UX: Landing Page Scroll-Reveal Animations
**Description**
Add scroll-triggered reveal animations to landing page sections.

**Requirements**
- Use framer-motion `useInView` with `once: true`. Feature cards stagger at 100ms, HowItWorks at 150ms.

**Acceptance Criteria**
- Scrolling down the landing page triggers reveal animations for each section.

**Files to Create/Modify**
- `components/landing/Features.tsx` (Modify)
- `components/landing/HowItWorks.tsx` (Modify)
- `components/landing/Stellar.tsx` (Modify)

**Test Requirements**
- Scroll to Features section; verify cards animate in sequentially.

---

### [Issue #143] UX: Reusable Copy Button Component
**Description**
Extract the copy-to-clipboard pattern into a single reusable `CopyButton` component.

**Requirements**
- Props: `value` (string), `size` (icon size), optional `label`. Works with keyboard.

**Acceptance Criteria**
- `<CopyButton value="GABC..." />` renders and copies on click everywhere it's used.

**Files to Create/Modify**
- `components/ui/copy-button.tsx` (Create)
- `app/connect/page.tsx` (Modify)
- `app/escrow/[contractId]/page.tsx` (Modify)
- `components/wallet/ConnectWalletButton.tsx` (Modify)

**Test Requirements**
- Click copy button; verify `navigator.clipboard.writeText` called with `value`.

---

### [Issue #144] UX: Animated Number Counter for Hero Stats
**Description**
Animate the landing page hero stats with a counting-up animation when they come into view.

**Requirements**
- Use framer-motion `animate` counting from 0 to target over 1.5s with `easeOut`.
- Only trigger when stats bar enters the viewport.

**Acceptance Criteria**
- Scrolling to the stats bar triggers a count-up animation for each number.

**Files to Create/Modify**
- `components/ui/payeasy-hero.tsx` (Modify)
- `components/ui/animated-number.tsx` (Create)

**Test Requirements**
- Scroll to stats; verify each number animates from 0 to its target.

---

### [Issue #145] UX: Funding Progress Bar Animation
**Description**
Animate the escrow funding progress bar so it fills from left to right on load.

**Requirements**
- Start at `width: 0%`; animate to `width: {fundingPercentage}%` over 1s.
- If 100%, pulse the bar green once after reaching full width.

**Acceptance Criteria**
- Loading the escrow dashboard shows the progress bar filling in.

**Files to Create/Modify**
- `components/escrow/FundingProgress.tsx` (Modify)

**Test Requirements**
- Render with 75% funded; verify bar animates to 75% on mount.

---

### [Issue #146] UX: Escrow Status Badge System
**Description**
Add distinct color-coded badge styles for each escrow status with consistent usage across all components.

**Requirements**
- Open: gray | Funded: amber | Released: green | Refunded: blue | Expired: red.
- Each badge includes a corresponding lucide-react icon.

**Acceptance Criteria**
- Each status shows its correct color and icon consistently across the app.

**Files to Create/Modify**
- `components/escrow/EscrowStatus.tsx` (Modify)
- `components/ui/status-badge.tsx` (Create)
- `components/history/TransactionCard.tsx` (Modify)

**Test Requirements**
- Render each status; verify correct color and icon for all 5 states.

---

### [Issue #147] UX: Roommate Hover Card
**Description**
Show an informational hover card when the user hovers a roommate address in the table.

**Requirements**
- Card appears after 500ms hover. Shows: full address (copyable), paid, expected, status badge.
- Repositions if near viewport edge. Dismissed on mouse leave.

**Acceptance Criteria**
- Hovering a roommate row shows the hover card with correct data after 500ms.

**Files to Create/Modify**
- `components/ui/hover-card.tsx` (Create)
- `components/escrow/RoommateTable.tsx` (Modify)

**Test Requirements**
- Hover a roommate row; verify hover card appears with correct data.

---

### [Issue #148] UX: Page Exit Animation
**Description**
Add exit animations when navigating away from a page.

**Requirements**
- Wrap page `<main>` with `<motion.main exit={{ opacity: 0, y: -10 }}>`. Exit duration: 200ms.

**Acceptance Criteria**
- Clicking a nav link fades out the current page before the new page fades in.

**Files to Create/Modify**
- `components/ui/page-transition.tsx` (Modify)
- `app/layout.tsx` (Modify)

**Test Requirements**
- Navigate between pages; verify fade-out before fade-in.

---

### [Issue #149] UX: Hero Carousel Manual Controls
**Description**
Add previous/next arrow buttons to the hero program card carousel.

**Requirements**
- Arrows appear on hover. Clicking pauses auto-scroll and advances/retreats by one card.
- Auto-scroll resumes after 5 seconds of inactivity.

**Acceptance Criteria**
- Clicking the next arrow advances the carousel by one card and pauses auto-scroll.

**Files to Create/Modify**
- `components/ui/payeasy-hero.tsx` (Modify)

**Test Requirements**
- Click next arrow; verify carousel advances one position and auto-scroll pauses.

---

### [Issue #150] UX: Dark/Light Theme Toggle
**Description**
Add a theme toggle button to the Navbar that switches between dark and light modes.

**Requirements**
- Toggle using the existing `ThemeProvider` with `Sun` / `Moon` icons from lucide-react.
- Persist choice to `localStorage` via `next-themes`. Light mode adapts glass-card colours.

**Acceptance Criteria**
- Clicking the theme toggle switches the site between dark and light and persists on reload.

**Files to Create/Modify**
- `components/landing/Navbar.tsx` (Modify)
- `components/ui/theme-toggle.tsx` (Create)
- `app/globals.css` (Modify — add light mode overrides)
- `tailwind.config.ts` (Modify — set darkMode: "class")

**Test Requirements**
- Toggle to light mode; reload page; verify light mode persists.

---

## Stage 23: New Pages & Routes (Issues 151–156)

### [Issue #151] Page: User Escrow List at /escrows
**Description**
Build a `/escrows` page listing all escrow contracts associated with the connected wallet.

**Requirements**
- Fetch contracts where `publicKey` appears as landlord or roommate.
- Card grid: contract ID, status badge, total rent, deadline, "View" button.
- Empty state if no contracts. Redirect to `/connect` if not connected.

**Acceptance Criteria**
- Connected user with 2 escrows sees both listed with correct status.

**Files to Create/Modify**
- `app/escrows/page.tsx` (Create)
- `lib/stellar/queries.ts` (Modify — add getUserEscrows)

**Test Requirements**
- Mock 2 escrow contracts; verify both render with correct data.

---

### [Issue #152] Page: Privacy Policy Placeholder
**Description**
Create a minimal `/privacy` page appropriate for a testnet blockchain app.

**Requirements**
- Sections: Data collected, how it's used, third parties, contact.
- Matches PayEasy visual design. Last updated date shown at the top.

**Acceptance Criteria**
- `/privacy` renders a readable policy page in the PayEasy design system.

**Files to Create/Modify**
- `app/privacy/page.tsx` (Create)

**Test Requirements**
- Navigate to `/privacy`; verify page renders without errors.

---

### [Issue #153] Page: Terms of Service Placeholder
**Description**
Create a minimal `/terms` page for a blockchain escrow application.

**Requirements**
- Sections: Service description, user responsibilities, limitation of liability, testnet disclaimer.
- Must prominently include: "This is a testnet application. Do not use real funds."

**Acceptance Criteria**
- `/terms` renders with the testnet disclaimer prominently visible.

**Files to Create/Modify**
- `app/terms/page.tsx` (Create)

**Test Requirements**
- Navigate to `/terms`; verify page renders and testnet disclaimer is visible.

---

### [Issue #154] Page: FAQ Page with Accordion
**Description**
Build a `/faq` page with the most common questions about PayEasy and Stellar escrow.

**Requirements**
- Accordion-style Q&A with smooth framer-motion expand/collapse.
- Minimum 8 questions covering: escrow, Freighter, Stellar, fees, testnet vs mainnet, contributing, releasing, deadline.

**Acceptance Criteria**
- `/faq` renders 8+ accordion items; clicking each expands/collapses correctly.

**Files to Create/Modify**
- `app/faq/page.tsx` (Create)
- `components/ui/accordion.tsx` (Create)

**Test Requirements**
- Click all accordion items; verify correct expand/collapse behavior.

---

### [Issue #155] Page: Landlord Dashboard Overview
**Description**
Build a dedicated landlord view at `/dashboard`.

**Requirements**
- Cards showing each escrow: progress bar, roommate count, days to deadline, release button.
- Quick stats row: total escrowed, active escrows, total released.
- Redirect to `/connect` if not connected.

**Acceptance Criteria**
- Landlord user sees all their escrows with progress bars and totals.

**Files to Create/Modify**
- `app/dashboard/page.tsx` (Create)
- `lib/stellar/queries.ts` (Modify — filter by landlord address)

**Test Requirements**
- Mock 2 landlord escrows; verify dashboard renders with correct data.

---

### [Issue #156] Page: Roommate Payment Portal
**Description**
Build a `/pay/{contractId}` shortcut page deep-linking a roommate to the contribution form.

**Requirements**
- Load contract basic info via Soroban RPC. Show a focused contribute form only.
- After successful contribution, redirect to the full dashboard.

**Acceptance Criteria**
- Visiting `/pay/CABC...` shows only the contribution form for that contract.

**Files to Create/Modify**
- `app/pay/[contractId]/page.tsx` (Create)

**Test Requirements**
- Visit `/pay/VALID_CONTRACT_ID`; verify contribution form renders with correct data.

---

## Stage 24: Configuration & Build Quality (Issues 157–160)

### [Issue #157] Config: Environment Variable Validation on Startup
**Description**
Validate that all required environment variables are present at app startup.

**Requirements**
- Create `lib/env.ts` checking `NEXT_PUBLIC_STELLAR_NETWORK`, `NEXT_PUBLIC_HORIZON_URL`, `NEXT_PUBLIC_SOROBAN_RPC_URL`.
- In development: throw an error listing all missing vars. In production: log a warning.

**Acceptance Criteria**
- Removing `NEXT_PUBLIC_STELLAR_NETWORK` in dev logs a clear error at startup.

**Files to Create/Modify**
- `lib/env.ts` (Create)
- `app/layout.tsx` (Modify — import env validation)

**Test Requirements**
- Unit test with missing vars in dev mode; verify error is thrown.

---

### [Issue #158] Config: Security Headers in next.config.js
**Description**
Add security HTTP response headers to protect against XSS, clickjacking, and MIME sniffing.

**Requirements**
- Headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=()`.
- Apply to all routes via `headers()` in `next.config.js`.

**Acceptance Criteria**
- `curl -I` on any page shows all required security headers.

**Files to Create/Modify**
- `next.config.js` (Modify)

**Test Requirements**
- Run `curl -I http://localhost:3000`; verify all security headers present.

---

### [Issue #159] Config: ESLint Rules for Stellar Patterns
**Description**
Add ESLint rules that prevent common Stellar integration mistakes.

**Requirements**
- Disallow raw `console.log` in `lib/stellar/` (use `console.error` or `console.warn` only).
- Warn on `setTimeout` inside escrow action files (mocked transaction pattern).

**Acceptance Criteria**
- `npm run lint` flags any `console.log` in `lib/stellar/` files.

**Files to Create/Modify**
- `.eslintrc.js` (Modify)

**Test Requirements**
- Add `console.log` to `lib/stellar/wallet.ts`; run lint; verify error.

---

### [Issue #160] Config: Bundle Size Analysis and Optimization
**Description**
Set up `@next/bundle-analyzer` to identify and reduce oversized JavaScript bundles.

**Requirements**
- Install and configure `@next/bundle-analyzer`.
- Lazy-load `three` in `DottedSurface` via dynamic import.
- Document before/after bundle sizes in a comment in `next.config.js`.

**Acceptance Criteria**
- Landing page (`/`) First Load JS is reduced from 142 kB toward 100 kB.

**Files to Create/Modify**
- `next.config.js` (Modify)
- `components/ui/dotted-surface.tsx` (Modify — dynamic import Three.js)

**Test Requirements**
- Run bundle analyzer; verify landing page chunk reduction is documented.

---

## Stage 25: Critical Bug Fixes (Issues 161–170)

### [Issue #161] Bug: Missing `getContractBasicInfo` Function Breaks `/pay/[contractId]` Page
**Description**
`app/pay/[contractId]/page.tsx` calls `getContractBasicInfo(contractId)` on line 22, but this function is never exported from `lib/stellar/queries.ts`. The entire page crashes at runtime with a ReferenceError on load.

**Requirements**
- Implement and export `getContractBasicInfo(contractId: string)` from `lib/stellar/queries.ts`.
- Function should return `{ landlord, totalRent, deadline, token }` from Soroban storage, or `null` if not found.
- Update `app/pay/[contractId]/page.tsx` to handle the `null` case and show a "Contract not found" state.

**Acceptance Criteria**
- Visiting `/pay/VALID_CONTRACT_ID` renders the contribute form without a crash.
- Visiting `/pay/INVALID_ID` renders a not-found state, not a blank screen.

**Files to Create/Modify**
- `lib/stellar/queries.ts` (Modify — add `getContractBasicInfo`)
- `app/pay/[contractId]/page.tsx` (Modify)

**Test Requirements**
- Mock Soroban RPC returning valid data; verify contract info renders.
- Mock null response; verify not-found state renders.

---

### [Issue #162] Bug: `TokenHelper.invoke()` Throws "Method Not Implemented"
**Description**
`lib/stellar/token.ts` line 74 throws `"Method not implemented: requires Soroban RPC integration."` inside `TokenHelper.invoke()`. Any code path that calls token-related Soroban operations will fail at runtime with this unhandled exception.

**Requirements**
- Implement `TokenHelper.invoke()` using `SorobanRpc.Server` and Freighter signing, following the same pattern as `lib/stellar/actions/contribute.ts`.
- If Soroban RPC is unavailable, throw a descriptive `StellarError` instead of a plain string.

**Acceptance Criteria**
- Calling `TokenHelper.invoke()` submits a real Soroban transaction via Freighter, not an exception.

**Files to Create/Modify**
- `lib/stellar/token.ts` (Modify — implement `invoke`)

**Test Requirements**
- Mock Soroban RPC; verify `invoke` builds and submits a transaction without throwing.

---

### [Issue #163] Bug: Missing `/api/auth/logout` Route Causes 404 on Logout
**Description**
`context/EmailAuthContext.tsx` line 66 calls `POST /api/auth/logout` on sign-out, but the route file `app/api/auth/logout/route.ts` does not exist. Every logout attempt results in a 404 error and the user's session is never cleared server-side.

**Requirements**
- Create `app/api/auth/logout/route.ts` that clears the JWT cookie.
- Return `{ success: true }` on success.
- Invalidate the `Authorization` header token if present.

**Acceptance Criteria**
- Clicking "Sign out" clears the auth cookie and navigates the user to `/login`.

**Files to Create/Modify**
- `app/api/auth/logout/route.ts` (Create)

**Test Requirements**
- Call `POST /api/auth/logout` with a valid cookie; verify cookie is cleared in the response.

---

### [Issue #164] Bug: Dashboard Page Hardcodes `connected = true`, Bypassing Auth
**Description**
`app/dashboard/page.tsx` line 15 sets `const [connected, setConnected] = useState(true)` and line 21 has `const isConnected = true`. Authentication is never actually checked, meaning any unauthenticated user can view the dashboard with no redirect.

**Requirements**
- Replace hardcoded state with `const { isConnected, publicKey } = useStellar()` from `StellarContext`.
- Redirect to `/connect` if `!isConnected` after the context initializes.
- Remove the TODO comment and empty catch block on line 35.

**Acceptance Criteria**
- An unauthenticated user visiting `/dashboard` is redirected to `/connect`.

**Files to Create/Modify**
- `app/dashboard/page.tsx` (Modify)

**Test Requirements**
- Render page without wallet; verify redirect to `/connect`.

---

### [Issue #165] Bug: `getLandlordEscrows()` Returns Hardcoded Mock Data
**Description**
`lib/stellar/queries.ts` lines 2–22 define `getLandlordEscrows()` with a comment `// TODO: Replace with actual Soroban RPC call`. It returns an array of three hardcoded mock objects regardless of the landlord address passed. The dashboard always shows the same fake data.

**Requirements**
- Implement real Soroban RPC call to fetch escrow contracts where `landlord === address`.
- Query the deployed contract registry or iterate known contract IDs stored in user session.
- Return `EscrowContract[]` typed array, not `any[]`.

**Acceptance Criteria**
- Dashboard shows only escrows where the connected wallet is the landlord.

**Files to Create/Modify**
- `lib/stellar/queries.ts` (Modify — replace mock `getLandlordEscrows`)

**Test Requirements**
- Mock Soroban returning 2 contracts; verify only those 2 render on dashboard.

---

### [Issue #166] Bug: `getLandlordStats()` Returns Stubbed Zeros
**Description**
`lib/stellar/queries.ts` lines 25–32 define `getLandlordStats()` that always returns `{ totalEscrowed: 0, activeEscrows: 0, totalReleased: 0 }` with a TODO comment. The stats row on the dashboard always shows all zeros.

**Requirements**
- Derive stats by aggregating the result from `getLandlordEscrows()`.
- `totalEscrowed`: sum of `totalRent` across all escrows.
- `activeEscrows`: count of escrows with status "open" or "funded".
- `totalReleased`: sum of `totalRent` for released escrows.

**Acceptance Criteria**
- Dashboard stats accurately reflect the landlord's real escrow data.

**Files to Create/Modify**
- `lib/stellar/queries.ts` (Modify — implement `getLandlordStats`)

**Test Requirements**
- Mock 3 escrows (2 active, 1 released); verify stats totals are correct.

---

### [Issue #167] Bug: ContributeForm Receives Wrong Props from `/pay/[contractId]`
**Description**
`app/pay/[contractId]/page.tsx` line 43 renders `<ContributeForm contractId={contractId} contractInfo={contractInfo} onSuccess={handleSuccess} />`. However, `components/escrow/ContributeForm.tsx` expects `{ escrowId, expectedShare, remainingBalance }`. This prop mismatch causes a TypeScript error and runtime failure where amounts never render.

**Requirements**
- Either update `ContributeForm` to accept `contractInfo` and extract `expectedShare`/`remainingBalance` internally.
- Or update `app/pay/[contractId]/page.tsx` to destructure and pass the correct props.
- Ensure TypeScript strict mode compiles without errors.

**Acceptance Criteria**
- Visiting `/pay/VALID_ID` renders the contribution form with the correct expected share amount.

**Files to Create/Modify**
- `app/pay/[contractId]/page.tsx` (Modify)
- `components/escrow/ContributeForm.tsx` (Modify)

**Test Requirements**
- Render `ContributeForm` with valid props; verify amount fields populate correctly.

---

### [Issue #168] Bug: Empty Catch Blocks Silently Hide Errors in Dashboard and Success Pages
**Description**
`app/dashboard/page.tsx` line 35 has `} catch (e) { // handle error }` which swallows all data-fetch errors silently. `app/escrow/success/page.tsx` lines 51–63 have two empty catch blocks ignoring clipboard errors. These make debugging impossible and leave users with no feedback when things go wrong.

**Requirements**
- `app/dashboard/page.tsx`: replace the empty catch with `setError(e instanceof Error ? e.message : "Failed to load dashboard")` and render an error banner.
- `app/escrow/success/page.tsx`: replace clipboard catch blocks with `setClipboardError(true)` and show a "Copy failed — paste manually" fallback.

**Acceptance Criteria**
- A fetch failure on the dashboard shows a visible error message to the user.
- A clipboard failure on the success page shows a fallback copy instruction.

**Files to Create/Modify**
- `app/dashboard/page.tsx` (Modify)
- `app/escrow/success/page.tsx` (Modify)

**Test Requirements**
- Mock a fetch failure; verify error message renders. Mock clipboard failure; verify fallback renders.

---

### [Issue #169] Bug: File-Based User Storage (`data/users.json`) Not Suitable for Production
**Description**
`lib/auth/users.ts` reads and writes user credentials to `data/users.json` on disk. This approach fails in multi-process deployments (e.g., Vercel serverless), loses data on cold starts, and has no concurrency protection. Any two simultaneous signups can corrupt the file.

**Requirements**
- Replace `data/users.json` file storage with a proper persistence layer.
- Minimum viable: use an environment-variable-configured database (SQLite via Prisma for local dev, or a hosted option).
- Add file locking or atomic writes as an interim measure if a full DB migration is deferred.
- Add a `DATA_STORE` environment variable to switch between `file` and `db` modes.

**Acceptance Criteria**
- Two simultaneous signups do not corrupt user data.
- App works correctly after a server restart without losing registered users.

**Files to Create/Modify**
- `lib/auth/users.ts` (Modify — add atomic write or DB adapter)
- `lib/auth/db-adapter.ts` (Create — optional DB abstraction)
- `.env.example` (Modify — document `DATA_STORE`)

**Test Requirements**
- Simulate concurrent writes; verify no data corruption.

---

### [Issue #170] Bug: JWT Token Expiration Hardcoded to "7d" With No Refresh Mechanism
**Description**
`lib/auth/jwt.ts` line 19 hardcodes `"7d"` as the token expiration. There is no refresh token flow, so when a 7-day session expires, the user is silently logged out mid-session with no warning. API calls fail with 401 after expiry.

**Requirements**
- Move token expiration to `JWT_EXPIRY` environment variable (default `"7d"`).
- Implement a `POST /api/auth/refresh` route that issues a new token if the current one is within 1 day of expiry.
- On 401 responses, `EmailAuthContext` should attempt one silent refresh before redirecting to login.

**Acceptance Criteria**
- A user active within 24 hours of token expiry gets a seamless silent refresh.
- A fully expired token redirects the user to `/login` with a "Session expired" message.

**Files to Create/Modify**
- `lib/auth/jwt.ts` (Modify)
- `app/api/auth/refresh/route.ts` (Create)
- `context/EmailAuthContext.tsx` (Modify — add refresh interceptor)

**Test Requirements**
- Mock token expiring in 23 hours; verify silent refresh fires. Mock fully expired token; verify redirect.

---

## Stage 26: Security Hardening (Issues 171–178)

### [Issue #171] Security: Development Auth Secret Used in Production Config
**Description**
`.env.local` line 6 sets `AUTH_SECRET=payeasy-dev-secret-change-in-production-32chars`. The inline comment admits this is not production-safe. If this value is accidentally deployed, all JWT tokens are signed with a known, public secret.

**Requirements**
- Generate a cryptographically secure random 32-byte secret: `openssl rand -base64 32`.
- Update `.env.example` with a placeholder and clear instructions.
- Add a startup check in `lib/auth/jwt.ts` that throws an error if `AUTH_SECRET` matches the known dev placeholder.
- Document the secret rotation procedure in a comment.

**Acceptance Criteria**
- App refuses to start if `AUTH_SECRET` equals the dev placeholder value.

**Files to Create/Modify**
- `lib/auth/jwt.ts` (Modify — add secret validation)
- `.env.example` (Modify — update placeholder)
- `.env.local` (Modify — replace secret value)

**Test Requirements**
- Set `AUTH_SECRET` to the dev placeholder; verify app throws on startup.

---

### [Issue #172] Security: Add Rate Limiting to Authentication API Routes
**Description**
`app/api/auth/signup/route.ts` and `app/api/auth/login/route.ts` have no rate limiting. An attacker can make unlimited brute-force login attempts or flood signups without restriction.

**Requirements**
- Implement IP-based rate limiting: max 10 requests per 15 minutes on `/api/auth/login`.
- Max 5 requests per hour on `/api/auth/signup`.
- Return HTTP 429 with `Retry-After` header when limit is exceeded.
- Use in-memory sliding window for dev; support Upstash Redis for production.

**Acceptance Criteria**
- Making 11 login requests in 15 minutes returns a 429 on the 11th.

**Files to Create/Modify**
- `lib/auth/rate-limit.ts` (Create)
- `app/api/auth/login/route.ts` (Modify)
- `app/api/auth/signup/route.ts` (Modify)

**Test Requirements**
- Simulate 11 rapid login requests; verify 429 on the 11th with correct headers.

---

### [Issue #173] Security: Add CSRF Protection to Auth API Routes
**Description**
The authentication routes (`/api/auth/login`, `/api/auth/signup`, `/api/auth/logout`) have no CSRF token validation. This makes the app vulnerable to cross-site request forgery attacks where a malicious page can silently log users in or out.

**Requirements**
- Implement double-submit cookie CSRF protection.
- On GET requests to auth pages, set a `csrf_token` cookie (HttpOnly: false, SameSite: Strict).
- All mutating auth API routes must verify the `X-CSRF-Token` header matches the cookie value.
- Return HTTP 403 if the CSRF token is missing or mismatched.

**Acceptance Criteria**
- A request to `/api/auth/login` without a matching CSRF token returns HTTP 403.

**Files to Create/Modify**
- `lib/auth/csrf.ts` (Create)
- `app/api/auth/login/route.ts` (Modify)
- `app/api/auth/signup/route.ts` (Modify)
- `app/api/auth/logout/route.ts` (Modify)

**Test Requirements**
- POST to login without `X-CSRF-Token`; verify 403. POST with valid token; verify 200.

---

### [Issue #174] Security: Missing Input Sanitization on Signup and Login Forms
**Description**
`app/api/auth/signup/route.ts` and `app/api/auth/login/route.ts` do not sanitize the `email` or `password` fields before processing. An email like `admin@test.com<script>` is accepted as-is and stored in `data/users.json`, creating a stored XSS vector.

**Requirements**
- Validate email with a strict RFC-5321 regex before processing.
- Trim and reject emails containing HTML-special characters (`<`, `>`, `"`, `'`).
- Add `Content-Type: application/json` response header validation on incoming requests.
- Return HTTP 400 with a field-specific error message for invalid inputs.

**Acceptance Criteria**
- `POST /api/auth/signup` with `email: "a<script>@b.com"` returns HTTP 400.

**Files to Create/Modify**
- `lib/auth/validation.ts` (Create)
- `app/api/auth/signup/route.ts` (Modify)
- `app/api/auth/login/route.ts` (Modify)

**Test Requirements**
- Unit test 10 invalid email patterns; all return 400. Valid email; returns 200.

---

### [Issue #175] Security: Add Content Security Policy Header
**Description**
The app has no `Content-Security-Policy` (CSP) header. This exposes the app to XSS attacks by allowing inline scripts and arbitrary external resources. The Stellar/Soroban frontend is particularly sensitive as it handles wallet interactions.

**Requirements**
- Add a strict CSP via `next.config.js` headers:
  - `default-src 'self'`; `script-src 'self' 'nonce-{nonce}'`
  - `connect-src 'self' https://horizon-testnet.stellar.org https://soroban-testnet.stellar.org`
  - `img-src 'self' data: https://images.unsplash.com https://i.pravatar.cc`
- Generate a per-request nonce via Next.js middleware for inline scripts.

**Acceptance Criteria**
- Response headers include a valid `Content-Security-Policy`.
- Inline scripts not bearing the nonce are blocked by the browser.

**Files to Create/Modify**
- `next.config.js` (Modify)
- `middleware.ts` (Create — nonce generation)

**Test Requirements**
- Run `curl -I` and verify `Content-Security-Policy` header is present and well-formed.

---

### [Issue #176] Security: Stellar Address Injection in Soroban RPC Calls
**Description**
`lib/stellar/queries.ts` and `lib/stellar/actions/contribute.ts` pass user-supplied `contractId` and `address` strings directly into Soroban RPC calls and XDR builders with no validation. A malformed address could cause unexpected RPC behavior or client-side errors that reveal internal structure.

**Requirements**
- Create `lib/stellar/validation.ts` with `isValidStellarAddress(addr)` and `isValidContractId(id)` using the Stellar SDK's `StrKey` class.
- Validate all user-supplied addresses before they reach RPC calls.
- Return a typed `ValidationError` rather than passing invalid strings to the SDK.

**Acceptance Criteria**
- Passing `"not-a-stellar-address"` to any Soroban action returns a `ValidationError` immediately.

**Files to Create/Modify**
- `lib/stellar/validation.ts` (Create or Modify)
- `lib/stellar/queries.ts` (Modify — add validation gates)
- `lib/stellar/actions/contribute.ts` (Modify)
- `lib/stellar/actions/initialize.ts` (Modify)

**Test Requirements**
- Unit test 5 invalid addresses; all throw `ValidationError`. Valid address; no error.

---

### [Issue #177] Security: Sensitive Data Logged to Console in Production
**Description**
Seven `console.error` calls in `lib/stellar/wallet.ts`, `lib/stellar/token.ts`, `lib/stellar/health.ts`, and `app/escrow/error.tsx` may log Stellar public keys, transaction details, or error stacks to the browser console in production. This leaks implementation details and potentially sensitive metadata.

**Requirements**
- Create `lib/logger.ts` with `log.error(msg, context?)` that only logs in `NODE_ENV !== "production"`.
- In production, send errors to an error tracking sink (or suppress them entirely).
- Replace all 7 bare `console.error` calls in the Stellar library with `log.error`.

**Acceptance Criteria**
- Running in `NODE_ENV=production`, no Stellar-related messages appear in the browser console.

**Files to Create/Modify**
- `lib/logger.ts` (Create)
- `lib/stellar/wallet.ts` (Modify)
- `lib/stellar/token.ts` (Modify)
- `lib/stellar/health.ts` (Modify)
- `app/escrow/error.tsx` (Modify)

**Test Requirements**
- Set `NODE_ENV=production`; trigger a Freighter error; verify nothing logged to console.

---

### [Issue #178] Security: Hardcoded Soroban RPC URL Bypasses Environment Config
**Description**
`lib/stellar/actions/contribute.ts` line 12 and `lib/stellar/actions/initialize.ts` line 27 hardcode `"https://soroban-testnet.stellar.org"` as a string literal instead of reading from `process.env.NEXT_PUBLIC_SOROBAN_RPC_URL`. This makes the app impossible to reconfigure for different networks without code changes.

**Requirements**
- Replace both hardcoded URL strings with `process.env.NEXT_PUBLIC_SOROBAN_RPC_URL`.
- Throw a startup error (via `lib/env.ts`) if the variable is not set.
- Update `.env.example` to document the variable.

**Acceptance Criteria**
- Setting `NEXT_PUBLIC_SOROBAN_RPC_URL` to a different endpoint in `.env.local` routes all Soroban calls to that endpoint.

**Files to Create/Modify**
- `lib/stellar/actions/contribute.ts` (Modify)
- `lib/stellar/actions/initialize.ts` (Modify)
- `.env.example` (Modify)

**Test Requirements**
- Set env var to a mock URL; verify all Soroban RPC calls go to that URL.

---

## Stage 27: Settings & Account Management (Issues 179–186)

### [Issue #179] Feature: Settings Page — Display Name and Email Edit
**Description**
`app/settings/page.tsx` is a design placeholder with no functional state management. The profile section has no `onChange` handlers, no form submission, and no API call. Users cannot actually update their display name or email.

**Requirements**
- Add controlled inputs for display name and email with `useState`.
- On submit, call `PATCH /api/user/profile` with the updated fields.
- Show a success toast on save. Show inline errors for invalid email or name too short.
- Create the `PATCH /api/user/profile` route.

**Acceptance Criteria**
- User can update their display name in settings and see the change persist after page reload.

**Files to Create/Modify**
- `app/settings/page.tsx` (Modify)
- `app/api/user/profile/route.ts` (Create)

**Test Requirements**
- Submit valid name change; verify PATCH is called and success toast shows.

---

### [Issue #180] Feature: Settings Page — Change Password Flow
**Description**
The settings page has a password section in the layout but no implementation. Users have no way to change their password without a developer directly modifying `data/users.json`.

**Requirements**
- Add "Current Password", "New Password", and "Confirm New Password" fields.
- Validate: current password correct, new password ≥ 8 chars, passwords match.
- Call `PATCH /api/user/password` on submit; return 403 if current password is wrong.
- Clear fields on success. Show toast "Password updated successfully."

**Acceptance Criteria**
- User can change their password from settings. Wrong current password shows an error.

**Files to Create/Modify**
- `app/settings/page.tsx` (Modify)
- `app/api/user/password/route.ts` (Create)

**Test Requirements**
- Submit wrong current password; verify 403 and error message. Submit correct; verify success.

---

### [Issue #181] Feature: Settings Page — Delete Account with Confirmation
**Description**
The settings page has a "Danger Zone" delete account placeholder but no implementation. Users cannot remove their accounts, which is a GDPR requirement.

**Requirements**
- "Delete Account" button opens a confirmation dialog requiring the user to type their email.
- On confirmation, call `DELETE /api/user/account`.
- Clear all cookies and localStorage, then redirect to `/`.
- Server-side: remove user from storage, invalidate all sessions.

**Acceptance Criteria**
- User who confirms deletion is logged out and their account no longer exists.

**Files to Create/Modify**
- `app/settings/page.tsx` (Modify)
- `app/api/user/account/route.ts` (Create)

**Test Requirements**
- Type wrong email in confirmation; verify button stays disabled. Type correct; verify deletion proceeds.

---

### [Issue #182] Feature: Password Reset / Forgot Password Flow
**Description**
There is no password reset mechanism. Users who forget their password are permanently locked out of their accounts. The email auth system has no recovery path.

**Requirements**
- Add "Forgot password?" link on `/login` page.
- Create `/forgot-password` page with email input.
- Generate a time-limited (1 hour) reset token; store hashed in user record.
- Send reset link via a configured email service (or log to console in dev).
- Create `/reset-password?token=...` page for the actual reset.

**Acceptance Criteria**
- User enters email, receives a reset link (logged in dev), and can set a new password.

**Files to Create/Modify**
- `app/forgot-password/page.tsx` (Create)
- `app/reset-password/page.tsx` (Create)
- `app/api/auth/forgot-password/route.ts` (Create)
- `app/api/auth/reset-password/route.ts` (Create)
- `lib/auth/users.ts` (Modify — add reset token fields)

**Test Requirements**
- Request reset for valid email; verify token stored. Use token to reset; verify password changes.

---

### [Issue #183] Feature: Email Verification on Signup
**Description**
`app/api/auth/signup/route.ts` creates user accounts without any email verification step. Anyone can register with any email address, including ones they do not own.

**Requirements**
- After signup, store user with `emailVerified: false` and generate a 24-hour verification token.
- Send a verification email (or log link to console in dev).
- Create `GET /api/auth/verify-email?token=...` route that sets `emailVerified: true`.
- Require `emailVerified: true` to access protected routes (escrow creation, dashboard).

**Acceptance Criteria**
- New user who has not verified email cannot create an escrow. Verified user can.

**Files to Create/Modify**
- `app/api/auth/signup/route.ts` (Modify)
- `app/api/auth/verify-email/route.ts` (Create)
- `app/verify-email/page.tsx` (Create)
- `lib/auth/users.ts` (Modify)

**Test Requirements**
- Signup; attempt escrow creation without verification; verify redirect to verification prompt.

---

### [Issue #184] Feature: Settings Page — Connected Wallet Display and Disconnect
**Description**
The settings page has no section showing the currently connected Stellar wallet. Users cannot see which wallet is linked to their account or disconnect it from within settings.

**Requirements**
- Add a "Connected Wallet" card showing truncated address, network badge, XLM balance.
- "Disconnect Wallet" button calls `StellarContext.disconnect()`.
- If no wallet connected, show "No wallet connected" with a link to `/connect`.

**Acceptance Criteria**
- Settings page shows the connected wallet address. Disconnecting returns the card to "not connected" state.

**Files to Create/Modify**
- `app/settings/page.tsx` (Modify)

**Test Requirements**
- Render settings with connected wallet; verify address shows. Click disconnect; verify card changes.

---

### [Issue #185] Feature: Settings Page — Notification Preferences
**Description**
The settings page design includes a notifications section but it has no implementation. Users cannot configure whether they receive alerts for contribution deadlines, funded escrows, or refund availability.

**Requirements**
- Add notification toggle switches for: "Escrow deadline reminders", "Payment confirmed", "Refund available".
- Store preferences in user record via `PATCH /api/user/notifications`.
- Preferences should be read by the dashboard and escrow pages to conditionally show banners.

**Acceptance Criteria**
- Toggling a notification preference persists after page reload.

**Files to Create/Modify**
- `app/settings/page.tsx` (Modify)
- `app/api/user/notifications/route.ts` (Create)
- `lib/auth/users.ts` (Modify — add notification prefs field)

**Test Requirements**
- Toggle a preference; reload settings page; verify toggle state is preserved.

---

### [Issue #186] Feature: Settings Page — Export Personal Data (GDPR)
**Description**
Users have no way to export their account data, which is required under GDPR Article 20 (data portability). The settings page should include a "Download My Data" feature.

**Requirements**
- "Download My Data" button calls `GET /api/user/export` and downloads a JSON file.
- Exported data includes: email, display name, account creation date, notification preferences.
- File named `payeasy-data-{email}-{date}.json`.

**Acceptance Criteria**
- Clicking "Download My Data" triggers a JSON file download with the user's data.

**Files to Create/Modify**
- `app/settings/page.tsx` (Modify)
- `app/api/user/export/route.ts` (Create)

**Test Requirements**
- Call `GET /api/user/export` as an authenticated user; verify JSON response with correct fields.

---

## Stage 28: Testing Infrastructure (Issues 187–193)

### [Issue #187] Testing: Set Up Vitest with React Testing Library
**Description**
The project has `.test.ts` files (`components/escrow/ContributeForm.test.ts`, `CreateEscrowForm.test.ts`, `lib/stellar/queries.test.ts`) but no testing framework is installed. Running `npm test` fails with "no test runner configured".

**Requirements**
- Install `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`.
- Configure `vitest.config.ts` with jsdom environment and `@testing-library/jest-dom` setup.
- Add `"test": "vitest"` to `package.json` scripts.
- Write at least one passing smoke test to confirm the setup works.

**Acceptance Criteria**
- `npm test` runs without errors and shows passing tests.

**Files to Create/Modify**
- `vitest.config.ts` (Create)
- `package.json` (Modify — add test script and devDependencies)
- `tests/setup.ts` (Create)

**Test Requirements**
- `npm test` exits with code 0 and shows at least 1 passing test.

---

### [Issue #188] Testing: Unit Tests for JWT Auth Library
**Description**
`lib/auth/jwt.ts` has zero test coverage. The functions `signToken`, `verifyToken`, and the token refresh logic are critical security code that should be fully tested.

**Requirements**
- Test `signToken`: verify returned token is a valid JWT with correct payload.
- Test `verifyToken`: valid token returns payload; expired token throws; tampered token throws.
- Test `verifyToken` with wrong secret throws.
- All tests use mocked time via `vi.useFakeTimers`.

**Acceptance Criteria**
- `npm test lib/auth/jwt` shows 100% function coverage.

**Files to Create/Modify**
- `lib/auth/jwt.test.ts` (Create)

**Test Requirements**
- 8 test cases covering happy path, expiry, tampered signature, and wrong secret.

---

### [Issue #189] Testing: Unit Tests for Stellar Address Validation
**Description**
`lib/stellar/validation.ts` (once implemented per Issue #176) needs comprehensive tests for both valid and invalid Stellar addresses and contract IDs.

**Requirements**
- Test 5 valid G... addresses pass `isValidStellarAddress`.
- Test 5 invalid inputs (too short, wrong prefix, wrong checksum) fail.
- Test valid and invalid Soroban contract IDs (`C...` prefix).

**Acceptance Criteria**
- All 15+ test cases pass.

**Files to Create/Modify**
- `lib/stellar/validation.test.ts` (Create)

**Test Requirements**
- 15 test cases; all pass; zero false positives or negatives.

---

### [Issue #190] Testing: Integration Tests for Auth API Routes
**Description**
`/api/auth/signup` and `/api/auth/login` have no automated tests. Changes to the auth logic could silently break login for all users.

**Requirements**
- Use `vitest` with Next.js route handler testing pattern.
- Test signup: valid body creates user, duplicate email returns 409, missing fields return 400.
- Test login: correct credentials return JWT cookie, wrong password returns 401, unknown email returns 401.

**Acceptance Criteria**
- `npm test api/auth` runs 6+ tests covering both routes, all passing.

**Files to Create/Modify**
- `app/api/auth/signup/route.test.ts` (Create)
- `app/api/auth/login/route.test.ts` (Create)

**Test Requirements**
- 6+ test cases across both route files; all pass.

---

### [Issue #191] Testing: Component Tests for CreateEscrowForm
**Description**
`components/escrow/CreateEscrowForm.test.ts` exists but contains no test content. The multi-step form is the most complex component in the app and has no automated test coverage.

**Requirements**
- Test Step 1: validates required fields, shows errors on empty submit.
- Test Step 2: adding a roommate with valid address shows them in the list; duplicate address shows toast.
- Test Step 3: share percentages sum correctly; over-allocation highlights in red.
- Test Step 4: review step shows submitted data correctly.

**Acceptance Criteria**
- 8+ tests covering all 4 steps of the create escrow form.

**Files to Create/Modify**
- `components/escrow/CreateEscrowForm.test.ts` (Modify — add actual tests)

**Test Requirements**
- 8+ tests; all pass with mocked `contractClient`.

---

### [Issue #192] Testing: E2E Test for Wallet Connect Flow
**Description**
The wallet connection flow (Freighter detect → connect → display address) is the critical onboarding path but has no end-to-end tests. A regression here blocks all blockchain functionality.

**Requirements**
- Install Playwright (`@playwright/test`).
- Test: visit `/connect`, mock Freighter as not installed, verify install prompt renders.
- Test: mock Freighter as installed but not connected, click Connect, mock approval, verify address displays.

**Acceptance Criteria**
- `npx playwright test connect` runs both tests successfully against `http://localhost:3000`.

**Files to Create/Modify**
- `e2e/connect.spec.ts` (Create)
- `playwright.config.ts` (Create)
- `package.json` (Modify — add e2e script)

**Test Requirements**
- 2 E2E tests; both pass with mocked Freighter extension.

---

### [Issue #193] Testing: Snapshot Tests for Landing Page Components
**Description**
The landing page has complex visual components (hero, features, how-it-works, stellar section) that could silently regress during refactors. Snapshot tests provide a safety net.

**Requirements**
- Create snapshot tests for: `PayEasyHero`, `Features`, `HowItWorks`, `Navbar`, `Footer`.
- Use `@testing-library/react` with vitest snapshot support.
- Snapshots committed to the repository.

**Acceptance Criteria**
- `npm test components/landing` runs 5 snapshot tests; all pass.

**Files to Create/Modify**
- `components/landing/__tests__/hero.test.tsx` (Create)
- `components/landing/__tests__/features.test.tsx` (Create)
- `components/landing/__tests__/navbar.test.tsx` (Create)
- `components/landing/__tests__/footer.test.tsx` (Create)

**Test Requirements**
- 5 snapshot tests; all pass; snapshots committed.

---

## Stage 29: TypeScript Strict Mode & Code Quality (Issues 194–200)

### [Issue #194] TypeScript: Enable Strict Mode and Fix All Resulting Errors
**Description**
`tsconfig.json` does not have `"strict": true`. This allows implicit `any` types, missing null checks, and other unsafe patterns that have already caused bugs (e.g., the prop mismatch in Issue #167). Enabling strict mode is necessary for long-term type safety.

**Requirements**
- Add `"strict": true` to `tsconfig.json`.
- Fix all TypeScript errors that surface as a result (expected: 20–50 errors based on `any` usage and missing null checks).
- Replace `any` types in `app/pay/[contractId]/page.tsx`, `app/dashboard/page.tsx`, and `components/escrow/ContributeForm.tsx` with specific interfaces.

**Acceptance Criteria**
- `npm run build` completes with zero TypeScript errors after enabling strict mode.

**Files to Create/Modify**
- `tsconfig.json` (Modify — add strict)
- Multiple files (Modify — fix strict errors)

**Test Requirements**
- `npx tsc --noEmit` exits with code 0.

---

### [Issue #195] TypeScript: Define Shared Type Interfaces for Stellar Data
**Description**
`lib/stellar/queries.ts` returns `any[]` from multiple functions. Components consume these as `any`, making it impossible for TypeScript to catch prop mismatches or missing fields. Shared interfaces would eliminate this entire class of bugs.

**Requirements**
- Define and export from `lib/stellar/types.ts`:
  - `EscrowContract { contractId, landlord, totalRent, deadline, token, status, roommates }`
  - `RoommateState { address, expectedShare, paid, status }`
  - `LandlordStats { totalEscrowed, activeEscrows, totalReleased }`
  - `ContractBasicInfo { landlord, totalRent, deadline, token }`
- Update all query functions to return these types instead of `any`.

**Acceptance Criteria**
- `lib/stellar/queries.ts` exports zero `any`-typed functions.

**Files to Create/Modify**
- `lib/stellar/types.ts` (Create)
- `lib/stellar/queries.ts` (Modify — use defined types)

**Test Requirements**
- `npx tsc --noEmit`; zero implicit `any` errors in `lib/stellar/`.

---

### [Issue #196] TypeScript: Fix `catch (e: any)` Pattern Across Codebase
**Description**
`app/pay/[contractId]/page.tsx` line 24 and at least 3 other files use `catch (e: any)` which bypasses TypeScript's error narrowing. The correct pattern is `catch (e: unknown)` with `instanceof Error` checks.

**Requirements**
- Grep codebase for `catch (e: any)` and `catch (error: any)`.
- Replace each with `catch (e: unknown)` and add proper `instanceof Error` narrowing.
- Ensure error message extraction uses `e instanceof Error ? e.message : String(e)`.

**Acceptance Criteria**
- Zero `catch (e: any)` or `catch (error: any)` patterns remain in the codebase.

**Files to Create/Modify**
- `app/pay/[contractId]/page.tsx` (Modify)
- All other files with `catch (e: any)` (Modify)

**Test Requirements**
- `grep -r "catch (e: any)"` and `grep -r "catch (error: any)"` return no results.

---

### [Issue #197] Code Quality: Remove All `setTimeout` Mock Delays from Production Code
**Description**
`components/escrow/ContributeForm.tsx` uses `setTimeout` to simulate transaction processing instead of real Soroban calls. When `USE_DEMO_MODE` is false, real transaction flow should be used. Shipping with mock delays misleads users into thinking transactions have completed.

**Requirements**
- Identify all `setTimeout` calls in escrow action files.
- Replace mock delays with real Soroban transaction building and submission.
- Keep `USE_DEMO_MODE` flag functional for local development only; it must not be active if `NEXT_PUBLIC_SOROBAN_RPC_URL` is set.

**Acceptance Criteria**
- With a real Soroban RPC URL configured, no `setTimeout` mock delays execute during contribution.

**Files to Create/Modify**
- `components/escrow/ContributeForm.tsx` (Modify — remove mock setTimeout)
- `lib/stellar/actions/contribute.ts` (Modify — ensure real flow is used)

**Test Requirements**
- With `USE_DEMO_MODE=false`, verify no setTimeout fires during a mocked Soroban transaction.

---

### [Issue #198] Code Quality: Resolve Merge Conflict Artifacts in Codebase
**Description**
A merge conflict was introduced in `issues.md` (lines 611–3165) between `HEAD` and commit `8de1963`. The conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`) were committed to the repository, causing the file to be unparseable by any tooling that reads it.

**Requirements**
- Resolve the conflict by keeping the HEAD version (stages 9–24 from the main branch).
- Remove all conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`) from the file.
- Verify the resulting file has no duplicate issue numbers.

**Acceptance Criteria**
- `issues.md` parses cleanly with no merge conflict markers.
- `grep -n "<<<<<<" issues.md` returns no results.

**Files to Create/Modify**
- `issues.md` (Modify — resolve conflict)

**Test Requirements**
- `grep -c "<<<<<<" issues.md` returns 0.

---

### [Issue #199] Code Quality: Enforce Consistent Error Handling Pattern via ESLint
**Description**
The codebase has a mix of error handling patterns: empty catch blocks, `catch (e: any)`, `console.error`, and silently swallowed errors. There is no ESLint rule enforcing a consistent approach, so new contributions continue adding inconsistent patterns.

**Requirements**
- Add ESLint rules to `.eslintrc.js`:
  - `no-empty`: error on empty catch blocks.
  - `@typescript-eslint/no-explicit-any`: warn on `any` type usage.
  - Custom rule or `unicorn/no-useless-catch` to prevent re-throwing without modification.
- Fix all violations surfaced by the new rules.

**Acceptance Criteria**
- `npm run lint` shows zero `no-empty` violations and zero `no-explicit-any` warnings.

**Files to Create/Modify**
- `.eslintrc.js` (Modify)
- All files with ESLint violations (Modify)

**Test Requirements**
- `npm run lint` exits with code 0 after fixes.

---

### [Issue #200] Code Quality: Add Pre-Commit Hook for Type Check and Lint
**Description**
Developers can currently commit TypeScript errors and ESLint violations because there is no pre-commit validation. Adding a pre-commit hook ensures that type errors and lint failures are caught before they reach the repository.

**Requirements**
- Install `husky` and `lint-staged`.
- Configure pre-commit hook to run `tsc --noEmit` and `eslint` on staged `.ts` and `.tsx` files.
- Hook must complete in under 30 seconds on a cold run.
- Document the setup in a brief comment in `package.json`.

**Acceptance Criteria**
- Committing a file with a TypeScript error is blocked by the pre-commit hook.

**Files to Create/Modify**
- `package.json` (Modify — add husky + lint-staged config)
- `.husky/pre-commit` (Create)

**Test Requirements**
- Stage a file with a deliberate TypeScript error; verify `git commit` is rejected with a clear message.
