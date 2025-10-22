export interface BalanceResponse {
    balance: string;
    balanceFormatted: string;
    assetId: string;
    networkId: string;
    timestamp: number;
}

export interface GasPriceResponse {
    gasPrice: string;
    gasPriceGwei: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    networkId: string;
    type: 'legacy' | 'eip1559';
    timestamp: number;
}

export interface PriceResponse {
    price: number;
    priceChange24h: number;
    priceChangePercentage24h: number;
    marketCap: number;
    volume24h: number;
    assetId: string;
    currency: string;
    timestamp: number;
}

export interface HistoryResponse {
    assetId: string;
    networkId: string;
    transactions: Transaction[];
    total: number;
    page: number;
    limit: number;
}

export interface Transaction {
    hash: string;
    from: string;
    to: string;
    value: string;
    valueFormatted: string;
    timestamp: number;
    blockNumber: number;
    gasUsed: string;
    gasPrice: string;
    status: 'success' | 'failed';
    type: 'send' | 'receive';
}

export interface NftOwnerResponse {
    owners: NftOwner[];
    total: number;
    contractAddress: string;
    tokenId?: string;
    networkId: string;
}

export interface NftOwner {
    owner: string;
    tokenId: string;
    balance: string;
    tokenUri?: string;
}

export interface TokenMetadataResponse {
    name: string;
    symbol: string;
    decimals: number;
    totalSupply?: string;
    contractAddress?: string;
    assetId: string;
    networkId: string;
    type: 'native' | 'erc20';
    logo?: string;
}

export interface NftMetadataResponse {
    name: string;
    description: string;
    image: string;
    attributes: NftAttribute[];
    contractAddress: string;
    tokenId: string;
    networkId: string;
    type: 'erc721' | 'erc1155';
    owner?: string;
    tokenUri?: string;
}

export interface NftAttribute {
    trait_type: string;
    value: string | number;
    display_type?: string;
}

export interface ApiError {
    code: string;
    message: string;
    details?: any;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: ApiError;
    timestamp: number;
}