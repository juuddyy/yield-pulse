# Yield Pulse 🔴

**Track Your Real DeFi Yields, Not Just APR Numbers**

Yield Pulse is a portfolio tracking application built for the Mezo community. It helps users understand their actual profits from yield-generating protocols, demystifying APR/APY percentages with real dollar values.

![Yield Pulse](https://via.placeholder.com/800x400/dc2626/ffffff?text=Yield+Pulse)

## ✨ Features

### Current (MVP)
- **Wallet Connection** - Connect via MetaMask, WalletConnect, Coinbase Wallet, and more
- **Portfolio Dashboard** - See your total value, deposits, and real PnL at a glance
- **Position Breakdown** - View each vault/pool position with detailed profit tracking
- **APR Explainer** - Understand what APR percentages mean in real dollar terms
- **Leaderboard** - See top-performing wallets and their strategies

### Coming Soon
- Historical portfolio charts
- Multi-protocol support (Pendle, Convex, etc.)
- Strategy insights and recommendations
- Alerts and notifications
- Tax export functionality

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- A WalletConnect Project ID (free at [cloud.walletconnect.com](https://cloud.walletconnect.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd yield-pulse
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example env file
   cp .env.example .env.local
   
   # Edit .env.local and add your WalletConnect Project ID
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
yield-pulse/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx            # Main dashboard page
│   │   └── globals.css         # Global styles & Tailwind
│   ├── components/
│   │   ├── layout/             # Navbar, Footer
│   │   ├── ui/                 # Reusable UI components
│   │   └── providers.tsx       # Wagmi/RainbowKit providers
│   ├── config/
│   │   └── wagmi.ts            # Wallet configuration
│   ├── lib/
│   │   ├── utils.ts            # Utility functions
│   │   └── mock-data.ts        # Demo data
│   └── types/
│       └── index.ts            # TypeScript types
├── public/
│   └── protocols/              # Protocol logos
├── .env.example                # Environment variables template
├── package.json
├── tailwind.config.ts
└── README.md
```

## 🎨 Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | TailwindCSS |
| Wallet Connection | RainbowKit + Wagmi v2 |
| Charts | Recharts |
| Icons | Lucide React |

## 🔧 Configuration

### Adding WalletConnect Project ID

1. Go to [cloud.walletconnect.com](https://cloud.walletconnect.com)
2. Create a new project (free)
3. Copy the Project ID
4. Add it to your `.env.local` file:
   ```
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
   ```

### Configuring Mezo Chain

The Mezo chain is pre-configured in `src/config/wagmi.ts`. Update the chain configuration if needed:

```typescript
const mezoMainnet = {
  id: 31337, // Update with actual chain ID
  name: "Mezo",
  rpcUrls: {
    default: { http: ["https://rpc.mezo.org"] },
  },
  // ... more config
};
```

## 🛠️ Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

### Adding New Components

1. Create component in `src/components/ui/`
2. Export from `src/components/index.ts`
3. Import and use in pages

### Working with Mock Data

Demo data is in `src/lib/mock-data.ts`. This will be replaced with real blockchain data in future updates.

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repo to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy automatically on every push

### Manual Build

```bash
npm run build
npm start
```

## 🔒 Security

- **Read-Only Mode**: Yield Pulse only reads blockchain data. It never requests transaction signatures or token approvals.
- **No Private Keys**: Your wallet's private keys never leave your wallet.
- **Public Data Only**: All data displayed is publicly available on the blockchain.

## 🗺️ Roadmap

### Phase 1 (Current)
- [x] Project setup
- [x] Wallet connection
- [x] Portfolio dashboard UI
- [x] Position cards
- [x] Leaderboard
- [ ] Real Mezo data integration

### Phase 2
- [ ] Historical charts
- [ ] Multi-protocol support
- [ ] Strategy insights
- [ ] Performance alerts

### Phase 3
- [ ] Social features
- [ ] Copy trading
- [ ] Mobile app

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🔗 Links

- [Mezo Documentation](https://github.com/mezo-org/documentation)
- [Mezo GitHub](https://github.com/orgs/mezo-org/repositories)
- [RainbowKit Docs](https://rainbowkit.com/docs)
- [Wagmi Docs](https://wagmi.sh)

---

Built with ❤️ for the Mezo community
