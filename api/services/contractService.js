
const { ethers } = require('ethers');
const NodeCache = require('node-cache');

// Cache para providers e contratos
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutos

// ABI do Factory Contract
const FACTORY_ABI = [
    "function deployStandardToken(string name, string symbol, uint256 totalSupply, uint8 decimals) external payable returns (address)",
    "function deployCustomToken(string name, string symbol, uint256 totalSupply, uint8 decimals, string customSuffix) external payable returns (address)",
    "function deployWithSalt(string name, string symbol, uint256 totalSupply, uint8 decimals, bytes32 salt) external payable returns (address)",
    "function findSaltForSuffix(string suffix) external view returns (bytes32)",
    "function predictTokenAddress(bytes32 salt) external view returns (address)",
    "function getUserTokens(address user) external view returns (address[])",
    "function STANDARD_FEE() external view returns (uint256)",
    "function CUSTOM_FEE() external view returns (uint256)",
    "event TokenDeployed(address indexed tokenAddress, string name, string symbol, uint256 totalSupply, address indexed creator, bytes32 salt, string customSuffix)"
];

// ABI padrão do token ERC-20
const TOKEN_ABI = [
    "function name() external view returns (string)",
    "function symbol() external view returns (string)",
    "function decimals() external view returns (uint8)",
    "function totalSupply() external view returns (uint256)",
    "function balanceOf(address owner) external view returns (uint256)",
    "function owner() external view returns (address)",
    "event Transfer(address indexed from, address indexed to, uint256 value)"
];

// Configurações das redes
const NETWORKS = {
    97: {
        name: 'BSC Testnet',
        rpc: process.env.BSC_TESTNET_RPC || 'https://data-seed-prebsc-1-s1.binance.org:8545/',
        factory: process.env.FACTORY_BSC_TESTNET,
        explorer: 'https://testnet.bscscan.com/',
        currency: 'BNB'
    },
    56: {
        name: 'BSC Mainnet',
        rpc: process.env.BSC_MAINNET_RPC || 'https://bsc-dataseed1.binance.org/',
        factory: process.env.FACTORY_BSC_MAINNET,
        explorer: 'https://bscscan.com/',
        currency: 'BNB'
    },
    1: {
        name: 'Ethereum',
        rpc: process.env.ETHEREUM_RPC,
        factory: process.env.FACTORY_ETHEREUM,
        explorer: 'https://etherscan.io/',
        currency: 'ETH'
    },
    137: {
        name: 'Polygon',
        rpc: process.env.POLYGON_RPC || 'https://polygon-rpc.com/',
        factory: process.env.FACTORY_POLYGON,
        explorer: 'https://polygonscan.com/',
        currency: 'MATIC'
    }
};

class ContractService {
    constructor() {
        this.providers = new Map();
        this.contracts = new Map();
    }

    // Obter provider para rede
    getProvider(network) {
        const cacheKey = `provider_${network}`;
        
        if (cache.has(cacheKey)) {
            return cache.get(cacheKey);
        }

        const networkConfig = NETWORKS[network];
        if (!networkConfig || !networkConfig.rpc) {
            throw new Error(`Rede ${network} não suportada ou não configurada`);
        }

        const provider = new ethers.providers.JsonRpcProvider(networkConfig.rpc);
        cache.set(cacheKey, provider);
        
        return provider;
    }

    // Obter contrato factory
    getFactoryContract(network) {
        const networkConfig = NETWORKS[network];
        if (!networkConfig || !networkConfig.factory) {
            throw new Error(`Factory não configurado para a rede ${network}`);
        }

        const provider = this.getProvider(network);
        return new ethers.Contract(networkConfig.factory, FACTORY_ABI, provider);
    }

    // Deploy de token
    async deployToken(params) {
        const {
            network,
            contractType = 'standard',
            name,
            symbol,
            totalSupply,
            decimals,
            customSuffix,
            useCustomSuffix,
            deployerPrivateKey
        } = params;

        if (!deployerPrivateKey) {
            throw new Error('Chave privada do deployer necessária');
        }

        const provider = this.getProvider(network);
        const wallet = new ethers.Wallet(deployerPrivateKey, provider);
        const factory = new ethers.Contract(NETWORKS[network].factory, FACTORY_ABI, wallet);

        // Converter totalSupply para Wei
        const totalSupplyWei = ethers.utils.parseUnits(totalSupply.toString(), decimals);

        let tx;
        let estimatedGas;

        if (useCustomSuffix && customSuffix) {
            // Deploy com sufixo personalizado
            estimatedGas = await factory.estimateGas.deployCustomToken(
                name,
                symbol,
                totalSupplyWei,
                decimals,
                customSuffix
            );

            tx = await factory.deployCustomToken(
                name,
                symbol,
                totalSupplyWei,
                decimals,
                customSuffix,
                {
                    gasLimit: estimatedGas.mul(120).div(100) // 20% buffer
                }
            );
        } else {
            // Deploy padrão
            estimatedGas = await factory.estimateGas.deployStandardToken(
                name,
                symbol,
                totalSupplyWei,
                decimals
            );

            tx = await factory.deployStandardToken(
                name,
                symbol,
                totalSupplyWei,
                decimals,
                {
                    gasLimit: estimatedGas.mul(120).div(100)
                }
            );
        }

        // Aguardar confirmação
        const receipt = await tx.wait();

        // Encontrar o evento TokenDeployed
        const deployEvent = receipt.events?.find(
            event => event.event === 'TokenDeployed'
        );

        if (!deployEvent) {
            throw new Error('Evento de deploy não encontrado');
        }

        const tokenAddress = deployEvent.args.tokenAddress;

        return {
            address: tokenAddress,
            transactionHash: tx.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            deploymentCost: ethers.utils.formatEther(
                receipt.gasUsed.mul(tx.gasPrice || receipt.effectiveGasPrice)
            ),
            networkName: NETWORKS[network].name
        };
    }

    // Prever endereço do token
    async predictTokenAddress(params) {
        const {
            network,
            name,
            symbol,
            totalSupply,
            decimals,
            customSuffix,
            useCustomSuffix
        } = params;

        const factory = this.getFactoryContract(network);

        let salt;
        
        if (useCustomSuffix && customSuffix) {
            salt = await factory.findSaltForSuffix(customSuffix);
        } else {
            // Gerar salt aleatório para demo
            const randomBytes = ethers.utils.randomBytes(32);
            salt = ethers.utils.hexlify(randomBytes);
        }

        const predictedAddress = await factory.predictTokenAddress(salt);
        
        return predictedAddress;
    }

    // Obter informações do contrato
    async getContractInfo(network, address) {
        const provider = this.getProvider(network);
        const contract = new ethers.Contract(address, TOKEN_ABI, provider);

        try {
            const [name, symbol, decimals, totalSupply] = await Promise.all([
                contract.name(),
                contract.symbol(),
                contract.decimals(),
                contract.totalSupply()
            ]);

            // Tentar obter owner se o contrato suportar
            let owner = null;
            try {
                owner = await contract.owner();
            } catch (error) {
                // Contrato pode não ter função owner
            }

            return {
                address,
                name,
                symbol,
                decimals,
                totalSupply: totalSupply.toString(),
                owner,
                network: NETWORKS[network].name
            };

        } catch (error) {
            throw new Error(`Erro ao obter informações do contrato: ${error.message}`);
        }
    }

    // Estimar gas para deploy
    async estimateDeploymentGas(params) {
        const {
            network,
            name,
            symbol,
            totalSupply,
            decimals,
            customSuffix,
            useCustomSuffix
        } = params;

        const factory = this.getFactoryContract(network);
        const totalSupplyWei = ethers.utils.parseUnits(totalSupply.toString(), decimals);

        let gasEstimate;

        if (useCustomSuffix && customSuffix) {
            gasEstimate = await factory.estimateGas.deployCustomToken(
                name,
                symbol,
                totalSupplyWei,
                decimals,
                customSuffix
            );
        } else {
            gasEstimate = await factory.estimateGas.deployStandardToken(
                name,
                symbol,
                totalSupplyWei,
                decimals
            );
        }

        const provider = this.getProvider(network);
        const gasPrice = await provider.getGasPrice();

        return {
            gasLimit: gasEstimate.toString(),
            gasPrice: gasPrice.toString(),
            estimatedCost: ethers.utils.formatEther(gasEstimate.mul(gasPrice)),
            currency: NETWORKS[network].currency
        };
    }

    // Obter ABI do contrato (via explorer API)
    async getContractABI(network, address) {
        const networkConfig = NETWORKS[network];
        let apiKey, baseUrl;

        switch (network) {
            case 97:
            case 56:
                apiKey = process.env.BSCSCAN_API_KEY;
                baseUrl = network === 97 ? 'https://api-testnet.bscscan.com' : 'https://api.bscscan.com';
                break;
            case 1:
                apiKey = process.env.ETHERSCAN_API_KEY;
                baseUrl = 'https://api.etherscan.io';
                break;
            case 137:
                apiKey = process.env.POLYGONSCAN_API_KEY;
                baseUrl = 'https://api.polygonscan.com';
                break;
            default:
                throw new Error(`Explorer API não suportado para a rede ${network}`);
        }

        if (!apiKey) {
            // Retornar ABI padrão se não tiver API key
            return TOKEN_ABI;
        }

        const axios = require('axios');
        
        try {
            const response = await axios.get(`${baseUrl}/api`, {
                params: {
                    module: 'contract',
                    action: 'getabi',
                    address: address,
                    apikey: apiKey
                }
            });

            if (response.data.status === '1') {
                return JSON.parse(response.data.result);
            } else {
                throw new Error(`Erro do explorer: ${response.data.message}`);
            }
        } catch (error) {
            console.error(`Erro ao obter ABI do explorer:`, error.message);
            return TOKEN_ABI; // Fallback para ABI padrão
        }
    }

    // Verificar se endereço é contrato
    async isContract(network, address) {
        const provider = this.getProvider(network);
        const code = await provider.getCode(address);
        return code !== '0x';
    }

    // Obter histórico de eventos do contrato
    async getContractEvents(network, address, eventName, fromBlock = 0, toBlock = 'latest') {
        const provider = this.getProvider(network);
        const contract = new ethers.Contract(address, TOKEN_ABI, provider);

        const filter = contract.filters[eventName]();
        const events = await contract.queryFilter(filter, fromBlock, toBlock);

        return events.map(event => ({
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            args: event.args,
            timestamp: null // Seria necessário buscar o timestamp do bloco
        }));
    }
}

module.exports = new ContractService();
