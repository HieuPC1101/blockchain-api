# Blockchain API Server

API server để tương tác với các blockchain networks (Ethereum, Polygon, Arbitrum, Bitcoin, v.v.)

## 📁 Cấu trúc dự án

```
blockchain-api-server/
├── src/
│   ├── data/              # Data models và configurations
│   │   ├── networks.ts    # Cấu hình networks
│   │   ├── types.ts       # TypeScript interfaces
│   │   └── parser.ts      # Parser cho assetId
│   │
│   ├── provider/          # API providers
│   │   ├── coingecko.ts   # CoinGecko API provider
│   │   ├── alchemy.ts     # Alchemy API provider
│   │   └── bitcoin.ts     # Bitcoin API provider
│   │
│   ├── service/           # Business logic
│   │   └── blockchain.service.ts
│   │
│   ├── controller/        # API controllers
│   │   └── blockchain.controller.ts
│   │
│   ├── router/            # Express routes
│   │   └── blockchain.router.ts
│   │
│   └── app.ts             # Express app configuration
│
├── server.ts              # Server entry point
├── package.json
├── tsconfig.json
├── .env.example
└── .gitignore
```

## 🚀 Cài đặt

```bash
# Cài đặt dependencies
npm install

# Copy file environment
cp .env.example .env

# Cập nhật API keys trong file .env
```

## 📝 Environment Variables

Tạo file `.env` từ `.env.example` và cập nhật các giá trị:

```env
PORT=3000
ALCHEMY_API_KEY=your_alchemy_api_key_here
COINGECKO_API_KEY=your_coingecko_api_key_here
BITCOIN_API_URL=https://blockstream.info/api
```

## 🏃 Chạy dự án

```bash
# Development mode
npm run dev

# Build
npm run build

# Production mode
npm start
```

## 📡 API Endpoints

### Health Check
- `GET /` - Health check endpoint

### Balance
- `GET /api/balance/:address/:assetId` - Get balance for address

### Gas Price
- `GET /api/gas/:networkId` - Get gas price for network

### Price
- `GET /api/price/:assetId` - Get current price
- `GET /api/price/:assetId/history` - Get price history

### Transaction History
- `GET /api/history/:address/:assetId` - Get transaction history

### NFT
- `GET /api/nft/owners/:contractAddress/:networkId` - Get NFT owners
- `GET /api/nft/metadata/:assetId` - Get NFT metadata
- `GET /api/nft/owned/:owner/:networkId` - Get NFTs owned by address

### Token
- `GET /api/token/metadata/:assetId` - Get token metadata

## 🔧 Technologies

- **Node.js** - JavaScript runtime
- **TypeScript** - Type-safe JavaScript
- **Express** - Web framework
- **Ethers.js** - Ethereum library
- **Axios** - HTTP client

## 📦 Dependencies

- `express` - Web framework
- `cors` - CORS middleware
- `dotenv` - Environment variables
- `ethers` - Ethereum library
- `axios` - HTTP client
- `typescript` - TypeScript compiler
- `ts-node` - TypeScript execution

## 📄 License

ISC
