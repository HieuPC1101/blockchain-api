require('dotenv').config();
import axios, { AxiosInstance } from 'axios';
import { BalanceResponse, HistoryResponse, ApiResponse, Transaction }
    from '../data/types';
import { satoshiToBitcoin } from '../data/parser';

export class BitcoinProvider {
    private client: AxiosInstance;
    private baseUrl: string;

    constructor(baseUrl?: string) {
        this.baseUrl = baseUrl || process.env.BITCOIN_API_URL ||
            'https://blockstream.info/api';
        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /** 
     * Get Bitcoin balance 
     */
    async getBalance(address: string):
        Promise<ApiResponse<BalanceResponse>> {
        try {
            const response = await this.client.get(`/address/${address}`);
            const addressData = response.data;

            const balance = addressData.chain_stats.funded_txo_sum -
                addressData.chain_stats.spent_txo_sum;
            const balanceFormatted = satoshiToBitcoin(balance.toString());

            const balanceResponse: BalanceResponse = {
                balance: balance.toString(),
                balanceFormatted,
                assetId: 'bitcoin',
                networkId: 'bitcoin',
                timestamp: Date.now()
            };

            return {
                success: true,
                data: balanceResponse,
                timestamp: Date.now()
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'BITCOIN_BALANCE_FETCH_ERROR',
                    message: error.message || 'Failed to fetch Bitcoin balance',
                    details: error.response?.data
                },
                timestamp: Date.now()
            };
        }
    }

    /** 
     * Get Bitcoin transaction history 
     */
    async getHistory(address: string, page: number = 1, limit: number =
        50): Promise<ApiResponse<HistoryResponse>> {
        try {
            const offset = (page - 1) * limit;
            const response = await this.client.get(`/address/${address}/txs`, {
                params: {
                    offset,
                    limit
                }
            });

            const transactions: Transaction[] = response.data.map((tx: any) => {
                // Find the relevant input/output for this address 
                const relevantInput = tx.vin.find((input: any) =>
                    input.prevout?.scriptpubkey_address === address
                );
                const relevantOutput = tx.vout.find((output: any) =>
                    output.scriptpubkey_address === address
                );

                const isSend = relevantInput && !relevantOutput;
                const isReceive = !relevantInput && relevantOutput;

                let value = '0';
                let type: 'send' | 'receive' = 'send';

                if (isSend) {
                    // Calculate total output value (amount sent) 
                    value = tx.vout.reduce((sum: number, output: any) => sum +
                        output.value, 0).toString();
                    type = 'send';
                } else if (isReceive) {
                    // Value received 
                    value = relevantOutput.value.toString();
                    type = 'receive';
                }

                return {
                    hash: tx.txid,
                    from: isSend ? address :
                        tx.vin[0]?.prevout?.scriptpubkey_address || '',
                    to: isReceive ? address : tx.vout[0]?.scriptpubkey_address ||
                        '',
                    value: value,
                    valueFormatted: satoshiToBitcoin(value),
                    timestamp: tx.status.block_time * 1000,
                    blockNumber: tx.status.block_height,
                    gasUsed: tx.fee?.toString() || '0',
                    gasPrice: '0', // Bitcoin doesn't have gas price 
                    status: tx.status.confirmed ? 'success' : 'pending',
                    type
                };
            });

            const historyResponse: HistoryResponse = {
                assetId: 'bitcoin',
                networkId: 'bitcoin',
                transactions,
                total: transactions.length,
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
                    code: 'BITCOIN_HISTORY_FETCH_ERROR',
                    message: error.message || 'Failed to fetch Bitcoin transaction history',
                    details: error.response?.data
                },
                timestamp: Date.now()
            };
        }
    }

    /** 
     * Get Bitcoin transaction details 
     */
    async getTransaction(txHash: string): Promise<ApiResponse<any>> {
        try {
            const response = await this.client.get(`/tx/${txHash}`);

            return {
                success: true,
                data: response.data,
                timestamp: Date.now()
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'BITCOIN_TX_FETCH_ERROR',
                    message: error.message || 'Failed to fetch Bitcoin transaction',
                    details: error.response?.data
                },
                timestamp: Date.now()
            };
        }
    }

    /** 
     * Get Bitcoin block information 
     */
    async getBlock(blockHash: string): Promise<ApiResponse<any>> {
        try {
            const response = await this.client.get(`/block/${blockHash}`);

            return {
                success: true,
                data: response.data,
                timestamp: Date.now()
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'BITCOIN_BLOCK_FETCH_ERROR',
                    message: error.message || 'Failed to fetch Bitcoin block',
                    details: error.response?.data
                },
                timestamp: Date.now()
            };
        }
    }

    /** 
     * Get Bitcoin network stats 
     */
    async getNetworkStats(): Promise<ApiResponse<any>> {
        try {
            const response = await this.client.get('/blocks/tip/height');
            const currentHeight = response.data;

            // Get block info 
            const blockResponse = await this.client.get(`/block
height/${currentHeight}`);
            const blockHash = blockResponse.data;
            const blockInfo = await this.getBlock(blockHash);

            return {
                success: true,
                data: {
                    currentHeight,
                    blockHash,
                    blockInfo: blockInfo.data
                },
                timestamp: Date.now()
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'BITCOIN_NETWORK_STATS_ERROR',
                    message: error.message || 'Failed to fetch Bitcoin network stats',
                    details: error.response?.data
                },
                timestamp: Date.now()
            };
        }
    }

    /** 
     * Get Bitcoin address info 
     */
    async getAddressInfo(address: string): Promise<ApiResponse<any>> {
        try {
            const response = await this.client.get(`/address/${address}`);

            return {
                success: true,
                data: response.data,
                timestamp: Date.now()
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'BITCOIN_ADDRESS_INFO_ERROR',
                    message: error.message || 'Failed to fetch Bitcoin address info',
                    details: error.response?.data
                },
                timestamp: Date.now()
            };
        }
    }
}