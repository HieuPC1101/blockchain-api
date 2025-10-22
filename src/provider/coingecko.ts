require('dotenv').config();
import axios, { AxiosInstance } from 'axios';
import { PriceResponse, ApiResponse } from '../data/types';
import { COINGECKO_COIN_IDS } from '../data/networks';

export class CoinGeckoProvider {
    private client: AxiosInstance;
    private apiKey: string;

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.COINGECKO_API_KEY || '';
        this.client = axios.create({
            baseURL: process.env.COINGECKO_BASE_URL ||
                'https://api.coingecko.com/api/v3',
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
                ...(this.apiKey && { 'x-cg-demo-api-key': this.apiKey })
            }
        });
    }

    /** 
     * Get current price of a cryptocurrency 
     */
    async getPrice(assetId: string, currency: string = 'usd'):
        Promise<ApiResponse<PriceResponse>> {
        try {
            const coinId = this.getCoinGeckoId(assetId);

            const response = await this.client.get('/simple/price', {
                params: {
                    ids: coinId,
                    vs_currencies: currency,
                    include_24hr_change: true,
                    include_market_cap: true,
                    include_24hr_vol: true
                }
            });

            const data = response.data[coinId];
            if (!data) {
                // For ERC20 tokens, try to get price by contract address 
                if (assetId.includes('/erc20:')) {
                    return await this.getERC20PriceByContract(assetId, currency);
                }
                throw new Error(`Price data not found for ${assetId}`);
            }

            const priceData: PriceResponse = {
                price: data[currency] || 0,
                priceChange24h: data[`${currency}_24h_change`] || 0,
                priceChangePercentage24h: data[`${currency}_24h_change`] || 0,
                marketCap: data[`${currency}_market_cap`] || 0,
                volume24h: data[`${currency}_24h_vol`] || 0,
                assetId,
                currency,
                timestamp: Date.now()
            };

            return {
                success: true,
                data: priceData,
                timestamp: Date.now()
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'PRICE_FETCH_ERROR',
                    message: error.message || 'Failed to fetch price',
                    details: error.response?.data
                },
                timestamp: Date.now()
            };
        }
    }

    /** 
     * Get historical price data 
     */
    async getPriceHistory(
        assetId: string,
        days: number = 7,
        currency: string = 'usd'
    ): Promise<ApiResponse<any[]>> {
        try {
            const coinId = this.getCoinGeckoId(assetId);

            const response = await
                this.client.get(`/coins/${coinId}/market_chart`, {
                    params: {
                        vs_currency: currency,
                        days,
                        interval: days <= 1 ? 'hourly' : 'daily'
                    }
                });

            const { prices, market_caps, total_volumes } = response.data;

            const historyData = prices.map((price: [number, number], index:
                number) => ({
                    timestamp: price[0],
                    price: price[1],
                    marketCap: market_caps[index]?.[1] || 0,
                    volume: total_volumes[index]?.[1] || 0,
                    assetId,
                    currency
                }));

            return {
                success: true,
                data: historyData,
                timestamp: Date.now()
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'HISTORY_FETCH_ERROR',
                    message: error.message || 'Failed to fetch price history',
                    details: error.response?.data
                },
                timestamp: Date.now()
            };
        }
    }

    /** 
     * Get multiple prices at once 
     */
    async getMultiplePrices(
        assetIds: string[],
        currency: string = 'usd'
    ): Promise<ApiResponse<Record<string, PriceResponse>>> {
        try {
            const coinIds = assetIds.map(id =>
                this.getCoinGeckoId(id)).join(',');

            const response = await this.client.get('/simple/price', {
                params: {
                    ids: coinIds,
                    vs_currencies: currency,
                    include_24hr_change: true,
                    include_market_cap: true,
                    include_24hr_vol: true
                }
            });

            const result: Record<string, PriceResponse> = {};

            for (const assetId of assetIds) {
                const coinId = this.getCoinGeckoId(assetId);
                const data = response.data[coinId];

                if (data) {
                    result[assetId] = {
                        price: data[currency] || 0,
                        priceChange24h: data[`${currency}_24h_change`] || 0,
                        priceChangePercentage24h: data[`${currency}_24h_change`] ||
                            0,
                        marketCap: data[`${currency}_market_cap`] || 0,
                        volume24h: data[`${currency}_24h_vol`] || 0,
                        assetId,
                        currency,
                        timestamp: Date.now()
                    };
                }
            }

            return {
                success: true,
                data: result,
                timestamp: Date.now()
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'MULTIPLE_PRICES_FETCH_ERROR',
                    message: error.message || 'Failed to fetch multiple prices',
                    details: error.response?.data
                },
                timestamp: Date.now()
            };
        }
    }

    /** 
     * Get trending cryptocurrencies 
     */
    async getTrending(): Promise<ApiResponse<any[]>> {
        try {
            const response = await this.client.get('/search/trending');

            const trendingData = response.data.coins.map((coin: any) => ({
                id: coin.item.id,
                name: coin.item.name,
                symbol: coin.item.symbol,
                market_cap_rank: coin.item.market_cap_rank,
                thumb: coin.item.thumb,
                score: coin.item.score
            }));

            return {
                success: true,
                data: trendingData,
                timestamp: Date.now()
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'TRENDING_FETCH_ERROR',
                    message: error.message || 'Failed to fetch trending cryptocurrencies',
                    details: error.response?.data
                },
                timestamp: Date.now()
            };
        }
    }

    /** 
     * Get global market data 
     */
    async getGlobalMarketData(): Promise<ApiResponse<any>> {
        try {
            const response = await this.client.get('/global');

            const globalData = {
                active_cryptocurrencies:
                    response.data.data.active_cryptocurrencies,
                total_market_cap: response.data.data.total_market_cap,
                total_volume: response.data.data.total_volume,
                market_cap_percentage: response.data.data.market_cap_percentage,
                market_cap_change_percentage_24h_usd:
                    response.data.data.market_cap_change_percentage_24h_usd,
                timestamp: Date.now()
            };

            return {
                success: true,
                data: globalData,
                timestamp: Date.now()
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'GLOBAL_MARKET_FETCH_ERROR',
                    message: error.message || 'Failed to fetch global market data',
                    details: error.response?.data
                },
                timestamp: Date.now()
            };
        }
    }

    /** 
     * Get ERC20 price by contract address 
     */
    private async getERC20PriceByContract(assetId: string, currency:
        string): Promise<ApiResponse<PriceResponse>> {
        try {
            // Parse assetId to get contract address and network 
            const [chainPart, assetPart] = assetId.split('/');
            const [chainNamespace, chainReference] = chainPart.split(':');
            const [assetNamespace, contractAddress] = assetPart.split(':');

            // Map chain reference to CoinGecko platform ID 
            const platformMap: Record<string, string> = {
                '1': 'ethereum',
                '137': 'polygon-pos',
                '42161': 'arbitrum-one',
                '10': 'optimistic-ethereum',
                '8453': 'base'
            };

            const platform = platformMap[chainReference];
            if (!platform) {
                throw new Error(`Unsupported platform: ${chainReference}`);
            }

            const response = await this.client.get('/simple/token_price/' +
                platform, {
                params: {
                    contract_addresses: contractAddress,
                    vs_currencies: currency,
                    include_24hr_change: true,
                    include_market_cap: true,
                    include_24hr_vol: true
                }
            });

            const data = response.data[contractAddress.toLowerCase()];
            if (!data) {
                throw new Error(`Price data not found for ERC20 token 
${contractAddress} on ${platform}`);
            }

            const priceData: PriceResponse = {
                price: data[currency] || 0,
                priceChange24h: data[`${currency}_24h_change`] || 0,
                priceChangePercentage24h: data[`${currency}_24h_change`] || 0,
                marketCap: data[`${currency}_market_cap`] || 0,
                volume24h: data[`${currency}_24h_vol`] || 0,
                assetId,
                currency,
                timestamp: Date.now()
            };

            return {
                success: true,
                data: priceData,
                timestamp: Date.now()
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'ERC20_PRICE_FETCH_ERROR',
                    message: error.message || 'Failed to fetch ERC20 price',
                    details: error.response?.data
                },
                timestamp: Date.now()
            };
        }
    }

    /** 
     * Convert network ID to CoinGecko coin ID 
     */
    private getCoinGeckoId(assetId: string): string {
        // Handle CAIP format 
        if (assetId.includes('/')) {
            const [chainPart, assetPart] = assetId.split('/');
            const [chainNamespace, chainReference] = chainPart.split(':');
            const [assetNamespace] = assetPart.split(':');

            if (chainNamespace === 'bip122') {
                return 'bitcoin';
            } else if (chainNamespace === 'eip155' && assetNamespace ===
                'slip44') {
                // Map chain reference to CoinGecko ID 
                const chainIdMap: Record<string, string> = {
                    '1': 'ethereum',
                    '137': 'matic-network',
                    '42161': 'arbitrum',
                    '10': 'optimism',
                    '8453': 'base'
                };
                return chainIdMap[chainReference] || 'ethereum';
            }
        }

        // Handle Bitcoin 
        if (assetId === 'bitcoin') {
            return 'bitcoin';
        }

        // Handle native coins 
        if (COINGECKO_COIN_IDS[assetId]) {
            return COINGECKO_COIN_IDS[assetId];
        }

        // Handle contract addresses (for tokens) 
        if (assetId.includes(':')) {
            const [networkId] = assetId.split(':');
            return COINGECKO_COIN_IDS[networkId] || networkId;
        }

        return assetId;
    }

    /** 
     * Search for cryptocurrencies 
     */
    async searchCryptocurrencies(query: string):
        Promise<ApiResponse<any[]>> {
        try {
            const response = await this.client.get('/search', {
                params: { query }
            });

            const searchResults = response.data.coins.map((coin: any) => ({
                id: coin.id,
                name: coin.name,
                symbol: coin.symbol,
                market_cap_rank: coin.market_cap_rank,
                thumb: coin.thumb,
                large: coin.large
            }));

            return {
                success: true,
                data: searchResults,
                timestamp: Date.now()
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'SEARCH_ERROR',
                    message: error.message || 'Failed to search cryptocurrencies',
                    details: error.response?.data
                },
                timestamp: Date.now()
            };
        }
    }
}