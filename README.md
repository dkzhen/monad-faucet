# Monad Faucet

## Overview

`monad-faucet` is a lightweight, wallet-first frontend built on Next.js 14 + Tailwind CSS. It acts as the user interface for a Monad Testnet faucet contract deployed at `0xa896128aA0452300139787d2401B912e2D91726c`, letting contributors deposit funds, visitors claim tokens (with a locking period), and admins send out custom amounts. The UI is designed for fast feedback, clear network guidance, and polished cards + toast messaging.

## Key features

1. **Wallet connection + network guard** – Uses `ethers` BrowserProvider to connect MetaMask (or injected wallet) and immediately prompts the user to switch to the Monad Testnet (`chainId 10143`). Network status is visualized via a status dot + friendly button.
2. **Contract state display** – Reads `contractBalance`, `faucetAmount`, and per-account `nextAccessTime`. The countdown timer updates every second so claimers know when the faucet unlocks again.
3. **Deposit flow** – Allows any connected wallet to send value (custom amount) directly into the faucet contract. Input is guarded against invalid values and switches network before sending.
4. **Claim flow** – Calls `claimFaucet()` once the lock timer expires, with UI to show the remaining time and informative toasts during the signing/confirmation phases.
5. **Admin panel** – When the connected wallet matches either `admins[0]` or `admins[1]` on-chain, a special card renders that lets the admin send arbitrary amounts via `withdraw(recipient, amount)`.
6. **UX polish** – Custom UI primitives (Card, Button, Input, Select) plus Radix components, Lucide icons, and toast alerts keep the page consistent, responsive, and production-ready.

## Architecture

```
monad-faucet/
├── app/
│   ├── layout.tsx           # Global layout + theme wraps
│   ├── page.tsx             # Entire faucet page logic (wallet, contract, UI cards)
│   └── globals.css
├── components/              # Shared design system primitives (ui folder)
├── hooks/                   # Placeholder for reusable hooks (unused yet)
├── styles/                  # Tailwind config / design tokens
├── public/                  # Images + assets (logo, backgrounds)
└── lib/                     # Helpers (if added later)
```

### `app/page.tsx`

This is the heart of the project:
- Maintains state (account, networkStatus, loading flags, amounts, timers).
- Defines `NETWORKS`, contract ABI, and helper functions (`checkNetwork`, `updateContractInfo`, `checkIfAdmin`, etc.).
- Handles wallet connect, deposit, claim, admin withdraw, and logout.
- Renders cards (`ContractInfoCard`, `DepositCard`, `ClaimCard`, `AdminCard`), plus a Navbar and Footer.
- Utilizes `useEffect` hooks to poll contract info, watch account changes, and monitor chain switches.

### UI Layer

- Built with Tailwind CSS + `components/ui` primitives (Card, Input, Button, Label, Select, Toast).
- Uses Radix UI combos for `Select` (network switch) and custom toasts for success/destructive states.
- Icons from `lucide-react` reinforce action clarity.

## Contract Interaction

```ts
const CONTRACT_ADDRESS = "0xa896128aA0452300139787d2401B912e2D91726c";
const CONTRACT_ABI = [
  // ... claimFaucet, deposit, faucetAmount, lockTime, nextAccessTime, admins, withdraw ...
];
```

Functions used:
- `faucetAmount()` – to drive UI labels and toast messages.
- `nextAccessTime(account)` – to compute the countdown timer.
- `admins(index)` x2 – to toggle admin UI.
- `deposit()` – payable deposit transaction.
- `claimFaucet()` – regular faucet claim.
- `withdraw(address, amount)` – admin-only custom transfers.

All interactions happen after confirming the network via `checkNetwork()` and switching to Monad Testnet if needed.

## Getting started

```bash
cd monad-faucet
yarn install
# Run local dev server
yarn dev
```

Open `http://localhost:3000` and connect MetaMask. The app will prompt for the Monad Testnet chain if MetaMask is on another network.

## Configuration notes

- **Networks** – Extend the `NETWORKS` object in `app/page.tsx` if you want to support more chains. Currently only Monad Testnet (chainId 10143).
- **Contract** – Update `CONTRACT_ADDRESS` + ABI if you redeploy the faucet. The UI assumes the contract exposes `faucetAmount`, `lockTime`, `nextAccessTime`, `admins`, `deposit`, `claimFaucet`, and `withdraw`.
- **Provider** – The UI relies on `window.ethereum` and `ethers.BrowserProvider`. To support WalletConnect or other connectors, swap the provider logic accordingly.
- **UI components** – `components/ui` contains shared primitives with consistent variants. Keep them in sync if you adjust styling or add new button states.

## Running production

```bash
yarn build
yarn start
```

Deploy anywhere that supports Next.js app router (Vercel, Render, Fly.io). The project is static-safe but makes client-side blockchain calls, so ensure the hosting environment has `window.ethereum` available (meaning real browser clients). If deploying behind a CDN, cache policy should allow dynamic wallet interactions.

## Testing & linting

- No tests yet; feel free to add React Testing Library or Vitest.
- `yarn lint` runs `next lint`. Add ESLint rules/plugins if needed.

## Developer notes

- **Hooks folder** – Currently unused but intended for future abstractions (e.g., `useMonadContract`, `useClaimTimer`).
- **Toast** – Custom toasts in `components/ui/use-toast` give consistent success/error messaging. Keep the hook if you modify the UI.
- **Theme** – `next-themes` is installed; you could hook into the layout to support dark mode.

## Future ideas

- Extract contract logic (connect, read, write) into a shared hook + context so other pages (bridge/swap) can reuse it.
- Add analytics or logging for admin withdrawals to monitor faucet drain.
- Show transaction hashes + explorer links when `tx.wait()` resolves.
- Bundled `components` library could be split into a local package (if reused across apps).
- Add tests for the timer logic + network switching behavior.

Kalau mau gue bantu tambah diagram, badge, atau versi PDF README, tinggal bilang aja.
