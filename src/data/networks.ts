export interface Network {
    id: string;
    name: string;
    chainId: number;
    rpcUrl: string;
    explorerUrl: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    isTestnet: boolean;
}

export interface AssetInfo {
    assetId: string;
    networkId: string;
    contractAddress?: string;
    tokenId?: string;
    type: 'native' | 'erc20' | 'erc721' | 'erc1155' | 'bitcoin';
}

export const NETWORKS: Record<string, Network> = {
    ethereum: {
        id: 'ethereum',
        name: 'Ethereum',
        chainId: 1,
        rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2',
        explorerUrl: 'https://etherscan.io',
        nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18
        },
        isTestnet: false
    },
    polygon: {
        id: 'polygon',
        name: 'Polygon',
        chainId: 137,
        rpcUrl: 'https://polygon-mainnet.g.alchemy.com/v2',
        explorerUrl: 'https://polygonscan.com',
        nativeCurrency: {
            name: 'Polygon',
            symbol: 'MATIC',
            decimals: 18
        },
        isTestnet: false
    },
    arbitrum: {
        id: 'arbitrum',
        name: 'Arbitrum One',
        chainId: 42161,
        rpcUrl: 'https://arb-mainnet.g.alchemy.com/v2',
        explorerUrl: 'https://arbiscan.io',
        nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18
        },
        isTestnet: false
    },
    optimism: {
        id: 'optimism',
        name: 'Optimism',
        chainId: 10,
        rpcUrl: 'https://opt-mainnet.g.alchemy.com/v2',
        explorerUrl: 'https://optimistic.etherscan.io',
        nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18
        },
        isTestnet: false
    },
    base: {
        id: 'base',
        name: 'Base',
        chainId: 8453,
        rpcUrl: 'https://base-mainnet.g.alchemy.com/v2',
        explorerUrl: 'https://basescan.org',
        nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18
        },
        isTestnet: false
    },
    bitcoin: {
        id: 'bitcoin',
        name: 'Bitcoin',
        chainId: 0,
        rpcUrl: 'https://blockstream.info/api',
        explorerUrl: 'https://blockstream.info',
        nativeCurrency: {
            name: 'Bitcoin',
            symbol: 'BTC',
            decimals: 8
        },
        isTestnet: false
    }
};

export const COINGECKO_COIN_IDS: Record<string, string> = {
    ethereum: 'ethereum',
    polygon: 'matic-network',
    arbitrum: 'arbitrum',
    optimism: 'optimism',
    base: 'base',
    bitcoin: 'bitcoin'
};

export const ALCHEMY_NETWORKS: Record<string, string> = {
    ethereum: 'eth-mainnet',
    polygon: 'polygon-mainnet',
    arbitrum: 'arb-mainnet',
    optimism: 'opt-mainnet',
    base: 'base-mainnet'
}; 