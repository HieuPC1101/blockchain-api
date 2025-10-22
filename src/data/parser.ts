import { AssetInfo } from './networks';

/** 
 * Parse assetId to extract network and asset information 
 * Supports both CAIP format and simple format: 
 *  
 * CAIP Format: 
 * - Bitcoin: bip122:000000000019d6689c085ae165831e93/slip44:0 
 * - Ethereum: eip155:1/slip44:60 
 * - ERC20: eip155:1/erc20:0x... 
 * - NFT: eip155:1/erc721:0x...:123 
 *  
 * Simple Format (legacy): 
 * - networkId:contractAddress:tokenId (for NFTs) 
 * - networkId:contractAddress (for ERC20) 
 * - networkId (for native coins) 
 * - bitcoin (for Bitcoin) 
 */
export function parseAssetId(assetId: string): AssetInfo {
    // Check if it's CAIP format 
    if (assetId.includes('/')) {
        return parseCAIPAssetId(assetId);
    }

    // Legacy format parsing 
    const parts = assetId.split(':');

    if (assetId === 'bitcoin') {
        return {
            assetId,
            networkId: 'bitcoin',
            type: 'bitcoin'
        };
    }

    if (parts.length === 1) {
        // Native coin: ethereum, polygon, etc. 
        return {
            assetId,
            networkId: parts[0],
            type: 'native'
        };
    }

    if (parts.length === 2) {
        // ERC20 token: ethereum:0x... 
        return {
            assetId,
            networkId: parts[0],
            contractAddress: parts[1],
            type: 'erc20'
        };
    }

    if (parts.length === 3) {
        // NFT: ethereum:0x...:123 
        return {
            assetId,
            networkId: parts[0],
            contractAddress: parts[1],
            tokenId: parts[2],
            type: 'erc721' // Default to ERC721, can be determined later 
        };
    }

    throw new Error(`Invalid assetId format: ${assetId}`);
}

/** 
 * Parse CAIP format assetId 
 */
function parseCAIPAssetId(assetId: string): AssetInfo {
    const [chainPart, assetPart] = assetId.split('/');

    // Parse chain part (e.g., "eip155:1" or "bip122:000000000019d6689c085ae165831e93")
    const [chainNamespace, chainReference] = chainPart.split(':');

    // Parse asset part (e.g., "slip44:60" or "erc20:0x..." or "erc721:0x...:123")
    const assetParts = assetPart.split(':');
    const assetNamespace = assetParts[0];
    const assetReference = assetParts.slice(1).join(':'); // Join remaining parts

    let networkId: string;
    let type: 'native' | 'erc20' | 'erc721' | 'erc1155' | 'bitcoin';
    let contractAddress: string | undefined;
    let tokenId: string | undefined;

    // Determine network 
    if (chainNamespace === 'bip122') {
        networkId = 'bitcoin';
        type = 'bitcoin';
    } else if (chainNamespace === 'eip155') {
        // Map chain reference to network ID 
        const chainIdMap: Record<string, string> = {
            '1': 'ethereum',
            '137': 'polygon',
            '42161': 'arbitrum',
            '10': 'optimism',
            '8453': 'base'
        };
        networkId = chainIdMap[chainReference] || `eip155:${chainReference}`;
    } else {
        throw new Error(`Unsupported chain namespace: ${chainNamespace}`);
    }

    // Determine asset type 
    if (assetNamespace === 'slip44') {
        // For Bitcoin, type should be 'bitcoin', for others 'native' 
        type = networkId === 'bitcoin' ? 'bitcoin' : 'native';
    } else if (assetNamespace === 'erc20') {
        type = 'erc20';
        contractAddress = assetReference;
    } else if (assetNamespace === 'erc721') {
        type = 'erc721';
        // assetReference format: "0x...:123" 
        const parts = assetReference.split(':');
        if (parts.length === 2) {
            contractAddress = parts[0];
            tokenId = parts[1];
        } else {
            contractAddress = assetReference;
        }
    } else if (assetNamespace === 'erc1155') {
        type = 'erc1155';
        // assetReference format: "0x...:123" 
        const parts = assetReference.split(':');
        if (parts.length === 2) {
            contractAddress = parts[0];
            tokenId = parts[1];
        } else {
            contractAddress = assetReference;
        }
    } else {
        throw new Error(`Unsupported asset namespace: ${assetNamespace}`);
    }

    return {
        assetId,
        networkId,
        contractAddress,
        tokenId,
        type
    };
}

/** 
 * Build assetId from components 
 */
export function buildAssetId(networkId: string, contractAddress?: string,
    tokenId?: string): string {
    if (networkId === 'bitcoin') {
        return 'bitcoin';
    }

    if (!contractAddress) {
        return networkId;
    }

    if (!tokenId) {
        return `${networkId}:${contractAddress}`;
    }

    return `${networkId}:${contractAddress}:${tokenId}`;
}

/** 
 * Validate Ethereum address 
 */
export function isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/** 
 * Validate Bitcoin address 
 */
export function isValidBitcoinAddress(address: string): boolean {
    // Basic validation for Bitcoin addresses 
    return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/.test(address);
}

/** 
 * Normalize address to checksum format 
 */
export function toChecksumAddress(address: string): string {
    if (!isValidEthereumAddress(address)) {
        throw new Error('Invalid Ethereum address');
    }

    // Simple checksum implementation 
    return address.toLowerCase();
}

/** 
 * Convert wei to ether 
 */
export function weiToEther(wei: string): string {
    const weiBigInt = BigInt(wei);
    const etherBigInt = weiBigInt / BigInt(10 ** 18);
    const remainder = weiBigInt % BigInt(10 ** 18);

    if (remainder === BigInt(0)) {
        return etherBigInt.toString();
    }

    const remainderStr = remainder.toString().padStart(18, '0');
    const decimalPart = remainderStr.replace(/0+$/, '');

    if (decimalPart === '') {
        return etherBigInt.toString();
    }

    return `${etherBigInt.toString()}.${decimalPart}`;
}

/** 
 * Convert ether to wei 
 */
export function etherToWei(ether: string): string {
    const [integerPart, decimalPart = ''] = ether.split('.');
    const paddedDecimal = decimalPart.padEnd(18, '0').slice(0, 18);
    return (BigInt(integerPart) * BigInt(10 ** 18) +
        BigInt(paddedDecimal)).toString();
}

/** 
 * Convert satoshi to bitcoin 
 */
export function satoshiToBitcoin(satoshi: string): string {
    const satoshiBigInt = BigInt(satoshi);
    const bitcoinBigInt = satoshiBigInt / BigInt(10 ** 8);
    const remainder = satoshiBigInt % BigInt(10 ** 8);

    if (remainder === BigInt(0)) {
        return bitcoinBigInt.toString();
    }

    const remainderStr = remainder.toString().padStart(8, '0');
    const decimalPart = remainderStr.replace(/0+$/, '');

    if (decimalPart === '') {
        return bitcoinBigInt.toString();
    }

    return `${bitcoinBigInt.toString()}.${decimalPart}`;
}

/** 
 * Convert bitcoin to satoshi 
 */
export function bitcoinToSatoshi(bitcoin: string): string {
    const [integerPart, decimalPart = ''] = bitcoin.split('.');
    const paddedDecimal = decimalPart.padEnd(8, '0').slice(0, 8);
    return (BigInt(integerPart) * BigInt(10 ** 8) +
        BigInt(paddedDecimal)).toString();
}