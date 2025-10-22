import { Request, Response } from 'express';
import { BlockchainService } from '../service/blockchain.service';

export class BlockchainController {
    private blockchainService: BlockchainService;

    constructor() {
        this.blockchainService = new BlockchainService();
    }

    /**
     * Get balance for an address and asset
     */
    async getBalance(req: Request, res: Response): Promise<void> {
        try {
            const { address, assetId } = req.params;

            if (!address || !assetId) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_PARAMS',
                        message: 'Address and assetId are required',
                        details: null
                    },
                    timestamp: Date.now()
                });
                return;
            }

            const result = await this.blockchainService.getBalance(address, assetId);
            res.status(result.success ? 200 : 400).json(result);
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: {
                    code: 'CONTROLLER_ERROR',
                    message: error.message || 'Failed to get balance',
                    details: error
                },
                timestamp: Date.now()
            });
        }
    }

    /**
     * Get gas price for a network
     */
    async getGas(req: Request, res: Response): Promise<void> {
        try {
            const { networkId } = req.params;
            const { type } = req.query;

            if (!networkId) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_PARAMS',
                        message: 'NetworkId is required',
                        details: null
                    },
                    timestamp: Date.now()
                });
                return;
            }

            const result = await this.blockchainService.getGas(
                networkId,
                (type as 'legacy' | 'eip1559') || 'eip1559'
            );
            res.status(result.success ? 200 : 400).json(result);
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: {
                    code: 'CONTROLLER_ERROR',
                    message: error.message || 'Failed to get gas price',
                    details: error
                },
                timestamp: Date.now()
            });
        }
    }

    /**
     * Get current price for an asset
     */
    async getPrice(req: Request, res: Response): Promise<void> {
        try {
            const { assetId } = req.params;
            const { currency } = req.query;

            if (!assetId) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_PARAMS',
                        message: 'AssetId is required',
                        details: null
                    },
                    timestamp: Date.now()
                });
                return;
            }

            const result = await this.blockchainService.getPrice(
                assetId,
                currency as string || 'usd'
            );
            res.status(result.success ? 200 : 400).json(result);
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: {
                    code: 'CONTROLLER_ERROR',
                    message: error.message || 'Failed to get price',
                    details: error
                },
                timestamp: Date.now()
            });
        }
    }

    /**
     * Get price history for an asset
     */
    async getPriceHistory(req: Request, res: Response): Promise<void> {
        try {
            const { assetId } = req.params;
            const { days, currency } = req.query;

            if (!assetId) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_PARAMS',
                        message: 'AssetId is required',
                        details: null
                    },
                    timestamp: Date.now()
                });
                return;
            }

            const result = await this.blockchainService.getPriceHistory(
                assetId,
                parseInt(days as string) || 7,
                currency as string || 'usd'
            );
            res.status(result.success ? 200 : 400).json(result);
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: {
                    code: 'CONTROLLER_ERROR',
                    message: error.message || 'Failed to get price history',
                    details: error
                },
                timestamp: Date.now()
            });
        }
    }

    /**
     * Get transaction history
     */
    async getHistory(req: Request, res: Response): Promise<void> {
        try {
            const { address, assetId } = req.params;
            const { page, limit } = req.query;

            if (!address || !assetId) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_PARAMS',
                        message: 'Address and assetId are required',
                        details: null
                    },
                    timestamp: Date.now()
                });
                return;
            }

            const result = await this.blockchainService.getHistory(
                address,
                assetId,
                parseInt(page as string) || 1,
                parseInt(limit as string) || 20
            );
            res.status(result.success ? 200 : 400).json(result);
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: {
                    code: 'CONTROLLER_ERROR',
                    message: error.message || 'Failed to get history',
                    details: error
                },
                timestamp: Date.now()
            });
        }
    }

    /**
     * Get NFT owners
     */
    async getNftOwners(req: Request, res: Response): Promise<void> {
        try {
            const { contractAddress, networkId } = req.params;
            const { tokenId } = req.query;

            if (!contractAddress || !networkId) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_PARAMS',
                        message: 'ContractAddress and networkId are required',
                        details: null
                    },
                    timestamp: Date.now()
                });
                return;
            }

            const result = await this.blockchainService.getNftOwners(
                contractAddress,
                networkId,
                tokenId as string
            );
            res.status(result.success ? 200 : 400).json(result);
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: {
                    code: 'CONTROLLER_ERROR',
                    message: error.message || 'Failed to get NFT owners',
                    details: error
                },
                timestamp: Date.now()
            });
        }
    }

    /**
     * Get NFT metadata
     */
    async getNftMetadata(req: Request, res: Response): Promise<void> {
        try {
            const { assetId } = req.params;

            if (!assetId) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_PARAMS',
                        message: 'AssetId is required',
                        details: null
                    },
                    timestamp: Date.now()
                });
                return;
            }

            const result = await this.blockchainService.getNftMetadata(assetId);
            res.status(result.success ? 200 : 400).json(result);
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: {
                    code: 'CONTROLLER_ERROR',
                    message: error.message || 'Failed to get NFT metadata',
                    details: error
                },
                timestamp: Date.now()
            });
        }
    }

    /**
     * Get NFTs owned by address
     */
    async getNftsForOwner(req: Request, res: Response): Promise<void> {
        try {
            const { owner, networkId } = req.params;

            if (!owner || !networkId) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_PARAMS',
                        message: 'Owner address and networkId are required',
                        details: null
                    },
                    timestamp: Date.now()
                });
                return;
            }

            const result = await this.blockchainService.getNftsForOwner(owner, networkId);
            res.status(result.success ? 200 : 400).json(result);
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: {
                    code: 'CONTROLLER_ERROR',
                    message: error.message || 'Failed to get NFTs for owner',
                    details: error
                },
                timestamp: Date.now()
            });
        }
    }

    /**
     * Get token metadata
     */
    async getTokenMetadata(req: Request, res: Response): Promise<void> {
        try {
            const { assetId } = req.params;

            if (!assetId) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_PARAMS',
                        message: 'AssetId is required',
                        details: null
                    },
                    timestamp: Date.now()
                });
                return;
            }

            const result = await this.blockchainService.getTokenMetadata(assetId);
            res.status(result.success ? 200 : 400).json(result);
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: {
                    code: 'CONTROLLER_ERROR',
                    message: error.message || 'Failed to get token metadata',
                    details: error
                },
                timestamp: Date.now()
            });
        }
    }
}