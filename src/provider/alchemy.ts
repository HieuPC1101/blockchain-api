require('dotenv').config();
import axios, { AxiosInstance } from 'axios';
import { ethers } from 'ethers';
import {
    BalanceResponse,
    GasPriceResponse,
    HistoryResponse,
    NftOwnerResponse,
    TokenMetadataResponse,
    NftMetadataResponse,
    ApiResponse,
    Transaction,
    NftOwner
} from '../data/types';
import { NETWORKS, ALCHEMY_NETWORKS } from '../data/networks';
import { parseAssetId, weiToEther } from '../data/parser';

export class AlchemyProvider {
    private client: AxiosInstance;
    private apiKey: string;
    private providers: Map<string, ethers.JsonRpcProvider> = new Map();

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.ALCHEMY_API_KEY || '';
        this.client = axios.create({
            baseURL: process.env.ALCHEMY_BASE_URL || 'https://eth-mainnet.g.alchemy.com/v2',
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /** 
     * Get provider for specific network 
     */
    private getProvider(networkId: string): ethers.JsonRpcProvider {
        if (!this.providers.has(networkId)) {
            const network = NETWORKS[networkId];
            if (!network) {
                throw new Error(`Unsupported network: ${networkId}`);
            }

            // Build RPC URL with API key 
            const alchemyNetwork = ALCHEMY_NETWORKS[networkId];
            if (!alchemyNetwork) {
                throw new Error(`Alchemy not supported for network: ${networkId}`);
            }

            const rpcUrl = `https://${alchemyNetwork}.g.alchemy.com/v2/${this.apiKey}`;
            const provider = new ethers.JsonRpcProvider(rpcUrl);
            this.providers.set(networkId, provider);
        }

        return this.providers.get(networkId)!;
    }

    /** 
     * Get balance of native token or ERC20 token 
     */
    async getBalance(address: string, assetId: string): Promise<ApiResponse<BalanceResponse>> {
        try {
            if (!this.apiKey) {
                return {
                    success: false,
                    error: {
                        code: 'MISSING_API_KEY',
                        message: 'Alchemy API key is required. Please set ALCHEMY_API_KEY environment variable.',
                        details: null
                    },
                    timestamp: Date.now()
                };
            }

            const assetInfo = parseAssetId(assetId);
            const provider = this.getProvider(assetInfo.networkId);

            let balance: string;
            let balanceFormatted: string;

            if (assetInfo.type === 'native') {
                // Native token balance 
                const balanceWei = await provider.getBalance(address);
                balance = balanceWei.toString();
                balanceFormatted = weiToEther(balance);
            } else if (assetInfo.type === 'erc20' && assetInfo.contractAddress) {
                // ERC20 token balance 
                const contract = new ethers.Contract(
                    assetInfo.contractAddress,
                    ['function balanceOf(address) view returns (uint256)',
                        'function decimals() view returns (uint8)'],
                    provider
                );

                const [balanceWei, decimals] = await Promise.all([
                    contract.balanceOf(address),
                    contract.decimals()
                ]);

                balance = balanceWei.toString();
                balanceFormatted = ethers.formatUnits(balanceWei, decimals);
            } else {
                throw new Error(`Unsupported asset type: ${assetInfo.type}`);
            }

            const response: BalanceResponse = {
                balance,
                balanceFormatted,
                assetId,
                networkId: assetInfo.networkId,
                timestamp: Date.now()
            };

            return {
                success: true,
                data: response,
                timestamp: Date.now()
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'BALANCE_FETCH_ERROR',
                    message: error.message || 'Failed to fetch balance',
                    details: error.response?.data
                },
                timestamp: Date.now()
            };
        }
    }

    /**
     * Get gas price (legacy or EIP-1559)
     */
    async getGas(networkId: string, type: 'legacy' | 'eip1559' = 'eip1559'): Promise<ApiResponse<GasPriceResponse>> {
        try {
            if (!this.apiKey) {
                return {
                    success: false,
                    error: {
                        code: 'MISSING_API_KEY',
                        message: 'Alchemy API key is required. Please set ALCHEMY_API_KEY environment variable.',
                        details: null
                    },
                    timestamp: Date.now()
                };
            }

            const provider = this.getProvider(networkId);

            if (type === 'legacy') {
                const gasPrice = await provider.getFeeData();
                const gasPriceGwei = ethers.formatUnits(gasPrice.gasPrice || 0,
                    'gwei');

                const response: GasPriceResponse = {
                    gasPrice: gasPrice.gasPrice?.toString() || '0',
                    gasPriceGwei,
                    networkId,
                    type: 'legacy',
                    timestamp: Date.now()
                };

                return {
                    success: true,
                    data: response,
                    timestamp: Date.now()
                };
            } else {
                // EIP-1559 
                const feeData = await provider.getFeeData();

                const response: GasPriceResponse = {
                    gasPrice: feeData.gasPrice?.toString() || '0',
                    gasPriceGwei: ethers.formatUnits(feeData.gasPrice || 0,
                        'gwei'),
                    maxFeePerGas: feeData.maxFeePerGas?.toString(),
                    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
                    networkId,
                    type: 'eip1559',
                    timestamp: Date.now()
                };

                return {
                    success: true,
                    data: response,
                    timestamp: Date.now()
                };
            }
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'GAS_FETCH_ERROR',
                    message: error.message || 'Failed to fetch gas price',
                    details: error.response?.data
                },
                timestamp: Date.now()
            };
        }
    }

    /** 
     * Get transaction history 
     */
    async getHistory(address: string, assetId: string, page: number = 1,
        limit: number = 50): Promise<ApiResponse<HistoryResponse>> {
        try {
            const assetInfo = parseAssetId(assetId);
            const provider = this.getProvider(assetInfo.networkId);

            // Get transaction history using Alchemy API 
            const alchemyNetwork = ALCHEMY_NETWORKS[assetInfo.networkId];
            if (!alchemyNetwork) {
                throw new Error(`Alchemy not supported for network: 
${assetInfo.networkId}`);
            }

            const alchemyUrl =
                `https://${alchemyNetwork}.g.alchemy.com/v2/${this.apiKey}`;

            const response = await axios.post(alchemyUrl, {
                jsonrpc: '2.0',
                method: 'alchemy_getAssetTransfers',
                params: [{
                    fromBlock: '0x0',
                    toBlock: 'latest',
                    fromAddress: address,
                    category: ['external', 'erc20', 'erc721', 'erc1155'],
                    withMetadata: true,
                    excludeZeroValue: false,
                    maxCount: limit,
                    pageKey: page > 1 ? `page_${page}` : undefined
                }],
                id: 1
            });

            const transfers = response.data.result?.transfers || [];

            const transactions: Transaction[] = transfers.map((transfer: any) => ({
                hash: transfer.hash,
                from: transfer.from,
                to: transfer.to,
                value: transfer.value?.toString() || '0',
                valueFormatted: transfer.value ? weiToEther(transfer.value.toString()) : '0',
                timestamp: new Date(transfer.metadata?.blockTimestamp).getTime(),
                blockNumber: parseInt(transfer.blockNum, 16),
                gasUsed: transfer.gas?.toString() || '0',
                gasPrice: transfer.gasPrice?.toString() || '0',
                status: transfer.metadata?.isError ? 'failed' : 'success',
                type: transfer.from.toLowerCase() === address.toLowerCase() ?
                    'send' : 'receive'
            }));

            const historyResponse: HistoryResponse = {
                assetId,
                networkId: assetInfo.networkId,
                transactions,
                total: response.data.result?.totalCount || transactions.length,
                page,
                limit
            };

            return {
                success: true,
                data: historyResponse,
                timestamp: Date.now()
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'HISTORY_FETCH_ERROR',
                    message: error.message || 'Failed to fetch transaction history',
                    details: error.response?.data
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
            const alchemyNetwork = ALCHEMY_NETWORKS[networkId];
            if (!alchemyNetwork) {
                throw new Error(`Alchemy not supported for network: 
${networkId}`);
            }

            // If tokenId provided → use JSON-RPC alchemy_getOwnersForToken 
            if (tokenId) {
                const rpcUrl =
                    `https://${alchemyNetwork}.g.alchemy.com/v2/${this.apiKey}`;
                const rpcResponse = await axios.post(rpcUrl, {
                    jsonrpc: '2.0',
                    method: 'alchemy_getOwnersForToken',
                    params: [contractAddress, tokenId],
                    id: 1
                });

                const owners: string[] = rpcResponse.data?.result?.owners || [];
                const nftOwners: NftOwner[] = owners.map((ownerAddress: string) => ({
                    owner: ownerAddress,
                    tokenId: tokenId,
                    balance: '1'
                }));

                const ownerResponse: NftOwnerResponse = {
                    owners: nftOwners,
                    total: nftOwners.length,
                    contractAddress,
                    tokenId,
                    networkId
                };

                return {
                    success: true,
                    data: ownerResponse,
                    timestamp: Date.now()
                };
            }

            // Else → use REST v3 getOwnersForCollection 
            const restUrl =
                `https://${alchemyNetwork}.g.alchemy.com/nft/v3/${this.apiKey}/getOwnersF
 orCollection`;
            const restResponse = await axios.get(restUrl, {
                params: {
                    contractAddress,
                    withTokenBalances: true
                }
            });

            const ownerAddresses = restResponse.data?.ownerAddresses || [];
            const nftOwners: NftOwner[] = [];
            for (const item of ownerAddresses) {
                const ownerAddress: string = item.ownerAddress || item.owner ||
                    item.address;
                const balances = item.tokenBalances || [];
                if (Array.isArray(balances) && balances.length > 0) {
                    for (const bal of balances) {
                        const ownedTokenId = bal.tokenId || bal.tokenIdHex || bal.id
                            || '';
                        const ownedBalance = String(bal.balance || bal.tokenBalance
                            || '1');
                        nftOwners.push({
                            owner: ownerAddress, tokenId: ownedTokenId,
                            balance: ownedBalance
                        });
                    }
                } else {
                    nftOwners.push({
                        owner: ownerAddress, tokenId: '', balance: '1'
                    });
                }
            }

            const ownerResponse: NftOwnerResponse = {
                owners: nftOwners,
                total: nftOwners.length,
                contractAddress,
                networkId
            };

            return {
                success: true,
                data: ownerResponse,
                timestamp: Date.now()
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'NFT_OWNERS_FETCH_ERROR',
                    message: error.message || 'Failed to fetch NFT owners',
                    details: error.response?.data
                },
                timestamp: Date.now()
            };
        }
    }

    /** 
     * Get NFTs owned by an address (optionally filter by contract) 
     * Uses Alchemy REST NFT API v3 getNFTsForOwner 
     */
    async getNftsForOwner(ownerAddress: string, networkId: string,
        contractAddress?: string): Promise<ApiResponse<any>> {
        try {
            const alchemyNetwork = ALCHEMY_NETWORKS[networkId];
            if (!alchemyNetwork) {
                throw new Error(`Alchemy not supported for network: 
${networkId}`);
            }

            const restUrl =
                `https://${alchemyNetwork}.g.alchemy.com/nft/v3/${this.apiKey}/getNFTsFor
 Owner`;
            const params: Record<string, string | string[]> = {
                owner:
                    ownerAddress
            };
            if (contractAddress) {
                (params as any)['contractAddresses[]'] = contractAddress;
            }

            const response = await axios.get(restUrl, { params });

            return {
                success: true,
                data: response.data,
                timestamp: Date.now()
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'NFTS_FOR_OWNER_FETCH_ERROR',
                    message: error.message || 'Failed to fetch NFTs for owner',
                    details: error.response?.data
                },
                timestamp: Date.now()
            };
        }
    }

    /** 
     * Get token metadata (ERC20 or native) 
     */
    async getTokenMetadata(assetId: string):
        Promise<ApiResponse<TokenMetadataResponse>> {
        try {
            const assetInfo = parseAssetId(assetId);

            if (assetInfo.type === 'native') {
                const network = NETWORKS[assetInfo.networkId];
                if (!network) {
                    throw new Error(`Unsupported network: ${assetInfo.networkId}`);
                }

                const metadata: TokenMetadataResponse = {
                    name: network.nativeCurrency.name,
                    symbol: network.nativeCurrency.symbol,
                    decimals: network.nativeCurrency.decimals,
                    assetId,
                    networkId: assetInfo.networkId,
                    type: 'native'
                };

                return {
                    success: true,
                    data: metadata,
                    timestamp: Date.now()
                };
            } else if (assetInfo.type === 'erc20' && assetInfo.contractAddress) {
                const provider = this.getProvider(assetInfo.networkId);

                const contract = new ethers.Contract(
                    assetInfo.contractAddress,
                    [
                        'function name() view returns (string)',
                        'function symbol() view returns (string)',
                        'function decimals() view returns (uint8)',
                        'function totalSupply() view returns (uint256)'
                    ],
                    provider
                );

                const [name, symbol, decimals, totalSupply] = await Promise.all([
                    contract.name(),
                    contract.symbol(),
                    contract.decimals(),
                    contract.totalSupply()
                ]);

                const metadata: TokenMetadataResponse = {
                    name,
                    symbol,
                    decimals: Number(decimals),
                    totalSupply: totalSupply.toString(),
                    contractAddress: assetInfo.contractAddress,
                    assetId,
                    networkId: assetInfo.networkId,
                    type: 'erc20'
                };

                return {
                    success: true,
                    data: metadata,
                    timestamp: Date.now()
                };
            } else {
                throw new Error(`Unsupported asset type: ${assetInfo.type}`);
            }
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'TOKEN_METADATA_FETCH_ERROR',
                    message: error.message || 'Failed to fetch token metadata',
                    details: error.response?.data
                },
                timestamp: Date.now()
            };
        }
    }

    /** 
     * Get NFT metadata (ERC721 or ERC1155) 
     */
    async getNftMetadata(assetId: string):
        Promise<ApiResponse<NftMetadataResponse>> {
        try {
            const assetInfo = parseAssetId(assetId);

            if (assetInfo.type !== 'erc721' && assetInfo.type !== 'erc1155') {
                throw new Error(`Invalid NFT asset type: ${assetInfo.type}`);
            }

            if (!assetInfo.contractAddress || !assetInfo.tokenId) {
                throw new Error('Contract address and token ID are required for NFT metadata');
            }

            const alchemyNetwork = ALCHEMY_NETWORKS[assetInfo.networkId];
            if (!alchemyNetwork) {
                throw new Error(`Alchemy not supported for network: ${assetInfo.networkId}`);
            }

            const alchemyUrl = `https://${alchemyNetwork}.g.alchemy.com/v2/${this.apiKey}`;

            const response = await axios.post(alchemyUrl, {
                jsonrpc: '2.0',
                method: 'alchemy_getNFTMetadata',
                params: [{
                    contractAddress: assetInfo.contractAddress,
                    tokenId: assetInfo.tokenId
                }],
                id: 1
            });

            const nftData = response.data.result;

            const metadata: NftMetadataResponse = {
                name: nftData.name || '',
                description: nftData.description || '',
                image: nftData.image || '',
                attributes: nftData.attributes || [],
                contractAddress: assetInfo.contractAddress,
                tokenId: assetInfo.tokenId,
                networkId: assetInfo.networkId,
                type: assetInfo.type,
                tokenUri: nftData.tokenUri
            };

            return {
                success: true,
                data: metadata,
                timestamp: Date.now()
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'NFT_METADATA_FETCH_ERROR',
                    message: error.message || 'Failed to fetch NFT metadata',
                    details: error.response?.data
                },
                timestamp: Date.now()
            };
        }
    }

    /** 
     * Get NFT collection metadata 
     */
    async getNftCollectionMetadata(contractAddress: string, networkId:
        string): Promise<ApiResponse<any>> {
        try {
            const alchemyNetwork = ALCHEMY_NETWORKS[networkId];
            if (!alchemyNetwork) {
                throw new Error(`Alchemy not supported for network: 
${networkId}`);
            }

            const alchemyUrl =
                `https://${alchemyNetwork}.g.alchemy.com/v2/${this.apiKey}`;

            const response = await axios.post(alchemyUrl, {
                jsonrpc: '2.0',
                method: 'alchemy_getContractMetadata',
                params: [contractAddress],
                id: 1
            });

            const collectionData = response.data.result;

            return {
                success: true,
                data: {
                    name: collectionData.name,
                    symbol: collectionData.symbol,
                    totalSupply: collectionData.totalSupply,
                    contractAddress,
                    networkId,
                    tokenType: collectionData.tokenType
                },
                timestamp: Date.now()
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'NFT_COLLECTION_METADATA_FETCH_ERROR',
                    message: error.message || 'Failed to fetch NFT collection metadata',
                    details: error.response?.data
                },
                timestamp: Date.now()
            };
        }
    }
}