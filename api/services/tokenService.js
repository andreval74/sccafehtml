
const { ethers } = require('ethers');
const axios = require('axios');
const NodeCache = require('node-cache');
const contractService = require('./contractService');

// Cache para dados de token
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutos

// ABI do token ERC-20
const TOKEN_ABI = [
    "function name() external view returns (string)",
    "function symbol() external view returns (string)",
    "function decimals() external view returns (uint8)",
    "function totalSupply() external view returns (uint256)",
    "function balanceOf(address owner) external view returns (uint256)",
    "function transfer(address to, uint256 value) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function owner() external view returns (address)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

// ABI do Factory para buscar tokens do usuário
const FACTORY_ABI = [
    "function getUserTokens(address user) external view returns (address[])",
    "event TokenDeployed(address indexed tokenAddress, string name, string symbol, uint256 totalSupply, address indexed creator, bytes32 salt, string customSuffix)"
];

// Redes suportadas
const NETWORKS = {
    97: {
        name: 'BSC Testnet',
        rpc: process.env.BSC_TESTNET_RPC || 'https://data-seed-prebsc-1-s1.binance.org:8545/',
        factory: process.env.FACTORY_BSC_TESTNET,
        explorer: 'https://testnet.bscscan.com/',
        explorerApi: 'https://api-testnet.bscscan.com',
        apiKey: process.env.BSCSCAN_API_KEY,
        currency: 'BNB',
        coingeckoId: 'binancecoin'
    },
    56: {
        name: 'BSC Mainnet',
        rpc: process.env.BSC_MAINNET_RPC || 'https://bsc-dataseed1.binance.org/',
        factory: process.env.FACTORY_BSC_MAINNET,
        explorer: 'https://bscscan.com/',
        explorerApi: 'https://api.bscscan.com',
        apiKey: process.env.BSCSCAN_API_KEY,
        currency: 'BNB',
        coingeckoId: 'binancecoin'
    },
    1: {
        name: 'Ethereum',
        rpc: process.env.ETHEREUM_RPC,
        factory: process.env.FACTORY_ETHEREUM,
        explorer: 'https://etherscan.io/',
        explorerApi: 'https://api.etherscan.io',
        apiKey: process.env.ETHERSCAN_API_KEY,
        currency: 'ETH',
        coingeckoId: 'ethereum'
    },
    137: {
        name: 'Polygon',
        rpc: process.env.POLYGON_RPC || 'https://polygon-rpc.com/',
        factory: process.env.FACTORY_POLYGON,
        explorer: 'https://polygonscan.com/',
        explorerApi: 'https://api.polygonscan.com',
        apiKey: process.env.POLYGONSCAN_API_KEY,
        currency: 'MATIC',
        coingeckoId: 'matic-network'
    }
};

class TokenService {
    constructor() {
        this.priceCache = new NodeCache({ stdTTL: 60 }); // Cache de preços por 1 minuto
    }

    // Obter informações do token
    async getTokenInfo(network, address) {
        const cacheKey = `token_info_${network}_${address}`;
        
        if (cache.has(cacheKey)) {
            return cache.get(cacheKey);
        }

        try {
            const provider = contractService.getProvider(network);
            const contract = new ethers.Contract(address, TOKEN_ABI, provider);

            const [name, symbol, decimals, totalSupply] = await Promise.all([
                contract.name(),
                contract.symbol(),
                contract.decimals(),
                contract.totalSupply()
            ]);

            // Tentar obter owner
            let owner = null;
            try {
                owner = await contract.owner();
            } catch (error) {
                // Contrato pode não ter owner
            }

            const tokenInfo = {
                address,
                name,
                symbol,
                decimals,
                totalSupply: totalSupply.toString(),
                totalSupplyFormatted: ethers.utils.formatUnits(totalSupply, decimals),
                owner,
                network: NETWORKS[network].name,
                networkId: network
            };

            cache.set(cacheKey, tokenInfo);
            return tokenInfo;

        } catch (error) {
            throw new Error(`Erro ao obter informações do token: ${error.message}`);
        }
    }

    // Obter tokens do usuário
    async getUserTokens(network, userAddress) {
        const cacheKey = `user_tokens_${network}_${userAddress}`;
        
        if (cache.has(cacheKey)) {
            return cache.get(cacheKey);
        }

        try {
            const networkConfig = NETWORKS[network];
            if (!networkConfig || !networkConfig.factory) {
                throw new Error(`Factory não configurado para a rede ${network}`);
            }

            const provider = contractService.getProvider(network);
            const factory = new ethers.Contract(networkConfig.factory, FACTORY_ABI, provider);

            const tokenAddresses = await factory.getUserTokens(userAddress);
            
            // Obter informações detalhadas de cada token
            const tokens = await Promise.allSettled(
                tokenAddresses.map(address => this.getTokenInfo(network, address))
            );

            const validTokens = tokens
                .filter(result => result.status === 'fulfilled')
                .map(result => result.value);

            cache.set(cacheKey, validTokens, 180); // Cache por 3 minutos
            return validTokens;

        } catch (error) {
            throw new Error(`Erro ao obter tokens do usuário: ${error.message}`);
        }
    }

    // Obter preço do token via CoinGecko
    async getTokenPrice(symbol) {
        const cacheKey = `price_${symbol.toLowerCase()}`;
        
        if (this.priceCache.has(cacheKey)) {
            return this.priceCache.get(cacheKey);
        }

        try {
            let coingeckoId = symbol.toLowerCase();
            
            // Mapear alguns símbolos para IDs do CoinGecko
            const symbolMap = {
                'bnb': 'binancecoin',
                'eth': 'ethereum',
                'btc': 'bitcoin',
                'matic': 'matic-network',
                'ada': 'cardano',
                'dot': 'polkadot',
                'link': 'chainlink',
                'uni': 'uniswap'
            };

            if (symbolMap[symbol.toLowerCase()]) {
                coingeckoId = symbolMap[symbol.toLowerCase()];
            }

            const response = await axios.get(
                `https://api.coingecko.com/api/v3/simple/price`,
                {
                    params: {
                        ids: coingeckoId,
                        vs_currencies: 'usd,brl',
                        include_24hr_change: true
                    },
                    timeout: 5000
                }
            );

            const priceData = response.data[coingeckoId];
            
            if (!priceData) {
                throw new Error(`Preço não encontrado para ${symbol}`);
            }

            const result = {
                symbol: symbol.toUpperCase(),
                usd: priceData.usd,
                brl: priceData.brl,
                change24h: priceData.usd_24h_change,
                timestamp: Date.now()
            };

            this.priceCache.set(cacheKey, result);
            return result;

        } catch (error) {
            // Retornar dados mockados se falhar
            console.error(`Erro ao obter preço de ${symbol}:`, error.message);
            return {
                symbol: symbol.toUpperCase(),
                usd: 0,
                brl: 0,
                change24h: 0,
                timestamp: Date.now(),
                error: 'Preço não disponível'
            };
        }
    }

    // Verificar se token existe
    async tokenExists(network, address) {
        try {
            const provider = contractService.getProvider(network);
            const code = await provider.getCode(address);
            
            if (code === '0x') {
                return false;
            }

            // Tentar chamar uma função básica do token
            const contract = new ethers.Contract(address, TOKEN_ABI, provider);
            await contract.symbol();
            
            return true;
        } catch (error) {
            return false;
        }
    }

    // Obter transações do token
    async getTokenTransactions(network, address, page = 1, limit = 20) {
        const networkConfig = NETWORKS[network];
        
        if (!networkConfig || !networkConfig.apiKey) {
            throw new Error(`API key não configurada para a rede ${network}`);
        }

        try {
            const offset = (page - 1) * limit;
            
            const response = await axios.get(`${networkConfig.explorerApi}/api`, {
                params: {
                    module: 'account',
                    action: 'tokentx',
                    contractaddress: address,
                    page: page,
                    offset: limit,
                    startblock: 0,
                    endblock: 99999999,
                    sort: 'desc',
                    apikey: networkConfig.apiKey
                },
                timeout: 10000
            });

            if (response.data.status !== '1') {
                throw new Error(response.data.message || 'Erro ao obter transações');
            }

            const transactions = response.data.result.map(tx => ({
                hash: tx.hash,
                from: tx.from,
                to: tx.to,
                value: tx.value,
                tokenSymbol: tx.tokenSymbol,
                tokenName: tx.tokenName,
                tokenDecimal: tx.tokenDecimal,
                blockNumber: tx.blockNumber,
                timeStamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
                gasUsed: tx.gasUsed,
                gasPrice: tx.gasPrice
            }));

            return transactions;

        } catch (error) {
            console.error(`Erro ao obter transações do token:`, error.message);
            return [];
        }
    }

    // Obter saldo do token para um endereço
    async getTokenBalance(network, tokenAddress, holderAddress) {
        try {
            const provider = contractService.getProvider(network);
            const contract = new ethers.Contract(tokenAddress, TOKEN_ABI, provider);

            const balance = await contract.balanceOf(holderAddress);
            const decimals = await contract.decimals();

            return {
                balance: balance.toString(),
                balanceFormatted: ethers.utils.formatUnits(balance, decimals),
                decimals
            };

        } catch (error) {
            throw new Error(`Erro ao obter saldo do token: ${error.message}`);
        }
    }

    // Criar pool de liquidez (integração com PancakeSwap/Uniswap)
    async createLiquidityPool(poolData) {
        const {
            network,
            tokenAddress,
            tokenAmount,
            ethAmount,
            slippage = 1,
            deadline = Math.floor(Date.now() / 1000) + 20 * 60 // 20 minutos
        } = poolData;

        // Esta é uma implementação simplificada
        // Na prática, seria necessário integrar com os contratos do router da DEX
        try {
            // Aqui integraria com PancakeSwap Router, Uniswap Router, etc.
            console.log('Criando pool de liquidez:', poolData);

            // Simulação por enquanto
            await new Promise(resolve => setTimeout(resolve, 3000));

            return {
                success: true,
                poolAddress: '0x' + Math.random().toString(16).substr(2, 40),
                transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
                lpTokens: '1000.0',
                message: 'Pool de liquidez criado com sucesso'
            };

        } catch (error) {
            throw new Error(`Erro ao criar pool de liquidez: ${error.message}`);
        }
    }

    // Obter estatísticas do token
    async getTokenStats(network, address) {
        try {
            const tokenInfo = await this.getTokenInfo(network, address);
            const transactions = await this.getTokenTransactions(network, address, 1, 100);

            // Calcular estatísticas básicas
            const stats = {
                ...tokenInfo,
                transactionCount: transactions.length,
                uniqueHolders: new Set([
                    ...transactions.map(tx => tx.from),
                    ...transactions.map(tx => tx.to)
                ]).size,
                last24hTransactions: transactions.filter(tx => {
                    const txTime = new Date(tx.timeStamp);
                    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    return txTime > yesterday;
                }).length
            };

            return stats;

        } catch (error) {
            throw new Error(`Erro ao obter estatísticas do token: ${error.message}`);
        }
    }

    // Validar endereço de token
    async validateTokenAddress(network, address) {
        if (!ethers.utils.isAddress(address)) {
            return { valid: false, error: 'Endereço inválido' };
        }

        try {
            const exists = await this.tokenExists(network, address);
            if (!exists) {
                return { valid: false, error: 'Contrato não existe ou não é um token ERC-20' };
            }

            const tokenInfo = await this.getTokenInfo(network, address);
            return { valid: true, tokenInfo };

        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    // Obter top holders de um token
    async getTokenHolders(network, address, limit = 50) {
        const networkConfig = NETWORKS[network];
        
        if (!networkConfig || !networkConfig.apiKey) {
            throw new Error(`API key não configurada para a rede ${network}`);
        }

        try {
            // Esta funcionalidade dependeria de APIs específicas dos explorers
            // Por enquanto, retorna dados simulados
            const holders = [];
            
            for (let i = 0; i < Math.min(limit, 20); i++) {
                holders.push({
                    address: '0x' + Math.random().toString(16).substr(2, 40),
                    balance: (Math.random() * 1000000).toFixed(2),
                    percentage: (Math.random() * 10).toFixed(2)
                });
            }

            return holders;

        } catch (error) {
            throw new Error(`Erro ao obter holders do token: ${error.message}`);
        }
    }
}

module.exports = new TokenService();
