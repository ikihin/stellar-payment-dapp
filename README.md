# Stellar Payment dApp

A simple payment dApp built on the Stellar Testnet. Connect your Freighter wallet, check your XLM balance, and send XLM to any Stellar address.

## Features

- Connect/disconnect Freighter wallet
- Display XLM balance
- Fund account via Friendbot (testnet faucet)
- Send XLM transactions on testnet
- Transaction feedback (success/failure with hash)

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- @stellar/stellar-sdk
- @stellar/freighter-api

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Freighter Wallet](https://www.freighter.app/) browser extension
- Switch Freighter to **Testnet** network

## Setup Instructions

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/stellar-payment-dapp.git
cd stellar-payment-dapp

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use

1. Install the Freighter wallet extension
2. Switch to Stellar Testnet in Freighter settings
3. Click "Connect Freighter Wallet"
4. Click "Fund (Friendbot)" to get free testnet XLM
5. Enter a destination address and amount
6. Click "Send XLM" and approve the transaction in Freighter
7. View the transaction hash and link to Stellar Expert

## Screenshots

### Wallet Connected State
![Wallet Connected](./screenshots/wallet-connected.png)

### Balance Displayed
![Balance](./screenshots/balance.png)

### Successful Transaction
![Transaction Success](./screenshots/tx-success.png)

### Transaction Result
![Transaction Result](./screenshots/tx-result.png)

## Deployment

Deploy to Vercel:

```bash
npm run build
```

Or deploy via [Vercel](https://vercel.com) by connecting your GitHub repository.

## License

MIT
