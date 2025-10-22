import { Router } from 'express';
import { BlockchainController } from
    '../controller/blockchain.controller';

const router = Router();
const blockchainController = new BlockchainController();

// Balance routes 
router.get('/balance/:address/:assetId', (req, res) => {
    blockchainController.getBalance(req, res);
});

// Gas routes 
router.get('/gas/:networkId', (req, res) => {
    blockchainController.getGas(req, res);
});

// Price routes 
router.get('/price/:assetId', (req, res) => {
    blockchainController.getPrice(req, res);
});

router.get('/price/:assetId/history', (req, res) => {
    blockchainController.getPriceHistory(req, res);
});

// History routes 
router.get('/history/:address/:assetId', (req, res) => {
    blockchainController.getHistory(req, res);
});

// NFT routes 
router.get('/nft/owners/:contractAddress/:networkId', (req, res) => {
    blockchainController.getNftOwners(req, res);
});

router.get('/nft/metadata/:assetId', (req, res) => {
    blockchainController.getNftMetadata(req, res);
});

// NFTs owned by address 
router.get('/nft/owned/:owner/:networkId', (req, res) => {
    blockchainController.getNftsForOwner(req, res);
});

// Token metadata routes 
router.get('/token/metadata/:assetId', (req, res) => {
    blockchainController.getTokenMetadata(req, res);
});

// Multiple data routes (TODO: Implement these in controller)
// router.post('/balances', (req, res) => {
//     blockchainController.getMultipleBalances(req, res);
// });

// router.post('/prices', (req, res) => {
//     blockchainController.getMultiplePrices(req, res);
// });

// Portfolio route (TODO: Implement this in controller)
// router.post('/portfolio', (req, res) => {
//     blockchainController.getPortfolioSummary(req, res);
// });

export default router;