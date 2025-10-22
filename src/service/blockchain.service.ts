import { CoinGeckoProvider } from '../provider/coingecko';
import { AlchemyProvider } from '../provider/alchemy';
import { BitcoinProvider } from '../provider/bitcoin';
import { parseAssetId } from '../data/parser';
import {
    BalanceResponse,
    GasPriceResponse,
    PriceResponse,
    HistoryResponse,
    NftOwnerResponse,
    TokenMetadataResponse,
    NftMetadataResponse,
    ApiResponse
} from '../data/types';

export class BlockchainService {
    private coingeckoProvider: CoinGeckoProvider;
    private alchemyProvider: AlchemyProvider;
    private bitcoinProvider: BitcoinProvider;

    constructor() {
        this.coingeckoProvider = new CoinGeckoProvider();
        this.alchemyProvider = new AlchemyProvider();
        this.bitcoinProvider = new BitcoinProvider();
    }

    /** 
     * Get balance for any asset (Bitcoin or EVM) 
     */
    async getBalance(address: string, assetId: string):
        Promise<ApiResponse<BalanceResponse>> {
        try {
            const assetInfo = parseAssetId(assetId);

            if (assetInfo.type === 'bitcoin') {
                return await this.bitcoinProvider.getBalance(address);
            } else {
                return await this.alchemyProvider.getBalance(address, assetId);
            }
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'BALANCE_SERVICE_ERROR',
                    message: error.message || 'Failed to get balance',
                    details: error
                },
                timestamp: Date.now()
            };
        }
    }

    /** 
     * Get gas price for EVM networks 
     */
    async getGas(networkId: string, type: 'legacy' | 'eip1559' =
        'eip1559'): Promise<ApiResponse<GasPriceResponse>> {
        try {
            if (networkId === 'bitcoin') {
                return {
                    success: false,
                    error: {
                        code: 'UNSUPPORTED_NETWORK',
                        message: 'Gas price not applicable for Bitcoin',
                        details: null
                    },
                    timestamp: Date.now()
                };
            }

            return await this.alchemyProvider.getGas(networkId, type);
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'GAS_SERVICE_ERROR',
                    message: error.message || 'Failed to get gas price',
                    details: error
                },
                timestamp: Date.now()
            };
        }
    }

    /** 
     * Get price for any asset 
     */
    async getPrice(assetId: string, currency: string = 'usd'):
        Promise<ApiResponse<PriceResponse>> {
        try {
            return await this.coingeckoProvider.getPrice(assetId, currency);
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'PRICE_SERVICE_ERROR',
                    message: error.message || 'Failed to get price',
                    details: error
                },
                timestamp: Date.now()
            };
        }
    }

    /** 
     * Get price history for any asset 
     */
    async getPriceHistory(assetId: string, days: number = 7, currency:
        string = 'usd'): Promise<ApiResponse<any[]>> {
        try {
            return await this.coingeckoProvider.getPriceHistory(assetId, days,
                currency);
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'PRICE_HISTORY_SERVICE_ERROR',
                    message: error.message || 'Failed to get price history',
                    details: error
                },
                timestamp: Date.now()
            };
        }
    }

    /** 
     * Get transaction history for any asset 
     */
    async getHistory(address: string, assetId: string, page: number = 1,
        limit: number = 50): Promise<ApiResponse<HistoryResponse>> {
        try {
            const assetInfo = parseAssetId(assetId);

            if (assetInfo.type === 'bitcoin') {
                return await this.bitcoinProvider.getHistory(address, page,
                    limit);
            } else {
                return await this.alchemyProvider.getHistory(address, assetId,
                    page, limit);
            }
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'HISTORY_SERVICE_ERROR',
                    message: error.message || 'Failed to get transaction history',
                    details: error
                },
                timestamp: Date.now()
            };
        }
    }

    /** 
     * Get NFT owners 
     */
    async getNftOwners(contractAddress: string, networkId: string,
        tokenId?: string): Promise<ApiResponse<NftOwnerResponse>> {
        try {
            if (networkId === 'bitcoin') {
                return {
                    success: false,
                    error: {
                        code: 'UNSUPPORTED_NETWORK',
                        message: 'NFTs not supported on Bitcoin',
                        details: null
                    },
                    timestamp: Date.now()
                };
            }

            return await this.alchemyProvider.getNftOwners(contractAddress,
                networkId, tokenId);
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'NFT_OWNERS_SERVICE_ERROR',
                    message: error.message || 'Failed to get NFT owners',
                    details: error
                },
                timestamp: Date.now()
            };
        }
    }

    /**
     * Get NFTs owned by an address (optionally filter by contract)
     */
    async getNftsForOwner(owner: string, networkId: string, contractAddress?: string): Promise<ApiResponse<any>> {
        try {
            if (networkId === 'bitcoin') {
                return {
                    success: false,
                    error: {
                        code: 'UNSUPPORTED_NETWORK',
                        message: 'NFTs not supported on Bitcoin',
                        details: null
                    },
                    timestamp: Date.now()
                };
            }

            return await this.alchemyProvider.getNftsForOwner(owner, networkId, contractAddress);
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'NFTS_FOR_OWNER_SERVICE_ERROR',
                    message: error.message || 'Failed to fetch NFTs for owner',
                    details: error
                },
                timestamp: Date.now()
            };
        }
    }

    /**
     * Get token metadata (ERC20 or native)
     */
    async getTokenMetadata(assetId: string): Promise<ApiResponse<TokenMetadataResponse>> {
        try {
            const assetInfo = parseAssetId(assetId);

            if (assetInfo.type === 'bitcoin') {
                const metadata: TokenMetadataResponse = {
                    name: 'Bitcoin',
                    symbol: 'BTC',
                    decimals: 8,
                    assetId: 'bitcoin',
                    networkId: 'bitcoin',
                    type: 'native'
                };

                return {
                    success: true,
                    data: metadata,
                    timestamp: Date.now()
                };
            } else {
                return await this.alchemyProvider.getTokenMetadata(assetId);
            }
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'TOKEN_METADATA_SERVICE_ERROR',
                    message: error.message || 'Failed to get token metadata',
                    details: error
                },
                timestamp: Date.now()
            };
        }
    }

    /**
     * Get NFT metadata (ERC721 or ERC1155)
     */
    async getNftMetadata(assetId: string): Promise<ApiResponse<NftMetadataResponse>> {
        try {
            const assetInfo = parseAssetId(assetId);

            if (assetInfo.type === 'bitcoin') {
                return {
                    success: false,
                    error: {
                        code: 'UNSUPPORTED_ASSET_TYPE',
                        message: 'NFTs not supported on Bitcoin',
                        details: null
                    },
                    timestamp: Date.now()
                };
            }

            return await this.alchemyProvider.getNftMetadata(assetId);
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'NFT_METADATA_SERVICE_ERROR',
                    message: error.message || 'Failed to get NFT metadata',
                    details: error
                },
                timestamp: Date.now()
            };
        }
    }

    /**
     * Get multiple balances at once
     */
    async getMultipleBalances(address: string, assetIds: string[]): Promise<ApiResponse<Record<string, BalanceResponse>>> {
        try {
            const results: Record<string, BalanceResponse> = {};

            const promises = assetIds.map(async (assetId) => {
                const result = await this.getBalance(address, assetId);
                if (result.success && result.data) {
                    results[assetId] = result.data;
                }
            });

            await Promise.all(promises);

            return {
                success: true,
                data: results,
                timestamp: Date.now()
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'MULTIPLE_BALANCES_SERVICE_ERROR',
                    message: error.message || 'Failed to get multiple balances',
                    details: error
                },
                timestamp: Date.now()
            };
        }
    }

    /**
     * Get multiple prices at once
     */
    async getMultiplePrices(assetIds: string[], currency: string = 'usd'): Promise<ApiResponse<Record<string, PriceResponse>>> {
        try {
            return await this.coingeckoProvider.getMultiplePrices(assetIds, currency);
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'MULTIPLE_PRICES_SERVICE_ERROR',
                    message: error.message || 'Failed to get multiple prices',
                    details: error
                },
                timestamp: Date.now()
            };
        }
    }

    /**
     * Get portfolio summary
     */
    async getPortfolioSummary(address: string, assetIds: string[], currency: string = 'usd'): Promise<ApiResponse<any>> {
        try {
            const [balancesResult, pricesResult] = await Promise.all([
                this.getMultipleBalances(address, assetIds),
                this.getMultiplePrices(assetIds, currency)
            ]);

            if (!balancesResult.success || !pricesResult.success) {
                throw new Error('Failed to fetch portfolio data');
            }

            const balances = balancesResult.data!;
            const prices = pricesResult.data!;

            let totalValue = 0;
            const portfolio = [];

            for (const assetId of assetIds) {
                const balance = balances[assetId];
                const price = prices[assetId];

                if (balance && price) {
                    const value = parseFloat(balance.balanceFormatted) * price.price;
                    totalValue += value;

                    portfolio.push({
                        assetId,
                        balance: balance.balanceFormatted,
                        price: price.price,
                        value,
                        priceChange24h: price.priceChangePercentage24h
                    });
                }
            }

            return {
                success: true,
                data: {
                    totalValue,
                    currency,
                    portfolio,
                    timestamp: Date.now()
                },
                timestamp: Date.now()
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'PORTFOLIO_SUMMARY_SERVICE_ERROR',
                    message: error.message || 'Failed to get portfolio summary',
                    details: error
                },
                timestamp: Date.now()
            };
        }
    }
}