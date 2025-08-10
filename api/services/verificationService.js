
const axios = require('axios');
const NodeCache = require('node-cache');

// Cache para resultados de verificação
const cache = new NodeCache({ stdTTL: 3600 }); // 1 hora

// Template do código fonte do token padrão
const DEFAULT_TOKEN_SOURCE = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract Token is IERC20 {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    uint256 private _totalSupply;
    string public name;
    string public symbol;
    uint8 public decimals;
    address public owner;

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply,
        uint8 _decimals
    ) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        owner = msg.sender;
        
        _totalSupply = _totalSupply * 10**_decimals;
        _balances[owner] = _totalSupply;
        emit Transfer(address(0), owner, _totalSupply);
    }

    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }

    function transfer(address recipient, uint256 amount) public override returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }

    function allowance(address owner, address spender) public view override returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) public override returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        uint256 currentAllowance = _allowances[sender][msg.sender];
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");

        _transfer(sender, recipient, amount);
        _approve(sender, msg.sender, currentAllowance - amount);

        return true;
    }

    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");

        uint256 senderBalance = _balances[sender];
        require(senderBalance >= amount, "ERC20: transfer amount exceeds balance");
        
        _balances[sender] = senderBalance - amount;
        _balances[recipient] += amount;

        emit Transfer(sender, recipient, amount);
    }

    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }
}
`;

// Configurações das redes para verificação
const NETWORKS = {
    97: {
        name: 'BSC Testnet',
        apiUrl: 'https://api-testnet.bscscan.com/api',
        apiKey: process.env.BSCSCAN_API_KEY,
        explorerUrl: 'https://testnet.bscscan.com/'
    },
    56: {
        name: 'BSC Mainnet',
        apiUrl: 'https://api.bscscan.com/api',
        apiKey: process.env.BSCSCAN_API_KEY,
        explorerUrl: 'https://bscscan.com/'
    },
    1: {
        name: 'Ethereum',
        apiUrl: 'https://api.etherscan.io/api',
        apiKey: process.env.ETHERSCAN_API_KEY,
        explorerUrl: 'https://etherscan.io/'
    },
    137: {
        name: 'Polygon',
        apiUrl: 'https://api.polygonscan.com/api',
        apiKey: process.env.POLYGONSCAN_API_KEY,
        explorerUrl: 'https://polygonscan.com/'
    }
};

class VerificationService {
    constructor() {
        this.pendingVerifications = new Map();
    }

    // Verificar contrato
    async verifyContract(params) {
        const {
            network,
            address,
            sourceCode,
            contractName = 'Token',
            compilerVersion = 'v0.8.19+commit.7dd6d404',
            optimizationUsed = false,
            runs = 200,
            constructorArguments = ''
        } = params;

        const networkConfig = NETWORKS[network];
        if (!networkConfig) {
            throw new Error(`Rede ${network} não suportada para verificação`);
        }

        if (!networkConfig.apiKey) {
            throw new Error(`API key não configurada para ${networkConfig.name}`);
        }

        const cacheKey = `verify_${network}_${address}`;
        
        // Verificar se já está no cache
        if (cache.has(cacheKey)) {
            const cached = cache.get(cacheKey);
            if (cached.status === 'success') {
                return cached;
            }
        }

        try {
            console.log(`Iniciando verificação do contrato ${address} na rede ${network}`);

            // Preparar dados para verificação
            const verificationData = {
                module: 'contract',
                action: 'verifysourcecode',
                contractaddress: address,
                sourceCode: sourceCode,
                codeformat: 'solidity-single-file',
                contractname: contractName,
                compilerversion: compilerVersion,
                optimizationUsed: optimizationUsed ? '1' : '0',
                runs: runs.toString(),
                constructorArguements: constructorArguments,
                apikey: networkConfig.apiKey
            };

            // Enviar para verificação
            const response = await axios.post(networkConfig.apiUrl, verificationData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                timeout: 30000
            });

            if (response.data.status !== '1') {
                throw new Error(`Erro na verificação: ${response.data.result}`);
            }

            const guid = response.data.result;
            console.log(`GUID de verificação: ${guid}`);

            // Aguardar resultado da verificação
            const result = await this.waitForVerificationResult(network, guid);
            
            const verificationResult = {
                status: 'success',
                guid: guid,
                contractAddress: address,
                network: networkConfig.name,
                explorerUrl: `${networkConfig.explorerUrl}address/${address}#code`,
                message: 'Contrato verificado com sucesso',
                timestamp: new Date().toISOString()
            };

            // Salvar no cache
            cache.set(cacheKey, verificationResult);
            
            return verificationResult;

        } catch (error) {
            console.error(`Erro na verificação:`, error.message);
            
            const errorResult = {
                status: 'error',
                error: error.message,
                contractAddress: address,
                network: networkConfig.name,
                timestamp: new Date().toISOString()
            };

            return errorResult;
        }
    }

    // Aguardar resultado da verificação
    async waitForVerificationResult(network, guid, maxWaitTime = 60000) {
        const networkConfig = NETWORKS[network];
        const startTime = Date.now();

        while (Date.now() - startTime < maxWaitTime) {
            try {
                const response = await axios.get(networkConfig.apiUrl, {
                    params: {
                        module: 'contract',
                        action: 'checkverifystatus',
                        guid: guid,
                        apikey: networkConfig.apiKey
                    },
                    timeout: 10000
                });

                const result = response.data.result;
                
                if (result === 'Pass - Verified') {
                    return { success: true, message: result };
                } else if (result.includes('Fail')) {
                    throw new Error(result);
                }

                // Aguardar 3 segundos antes de verificar novamente
                await new Promise(resolve => setTimeout(resolve, 3000));

            } catch (error) {
                if (error.response?.data?.result?.includes('Pending')) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    continue;
                }
                throw error;
            }
        }

        throw new Error('Timeout na verificação - tente verificar manualmente');
    }

    // Auto-verificar token com template padrão
    async autoVerifyToken(params) {
        const {
            network,
            address,
            tokenName,
            tokenSymbol,
            totalSupply,
            decimals
        } = params;

        // Gerar argumentos do construtor
        const constructorArgs = this.encodeConstructorArguments({
            name: tokenName,
            symbol: tokenSymbol,
            totalSupply: totalSupply,
            decimals: decimals
        });

        // Usar template padrão de token
        const sourceCode = DEFAULT_TOKEN_SOURCE;

        return await this.verifyContract({
            network,
            address,
            sourceCode,
            contractName: 'Token',
            compilerVersion: 'v0.8.19+commit.7dd6d404',
            optimizationUsed: false,
            runs: 200,
            constructorArguments: constructorArgs
        });
    }

    // Obter status da verificação
    async getVerificationStatus(network, address) {
        const networkConfig = NETWORKS[network];
        if (!networkConfig || !networkConfig.apiKey) {
            throw new Error(`Configuração não encontrada para a rede ${network}`);
        }

        const cacheKey = `status_${network}_${address}`;
        
        if (cache.has(cacheKey)) {
            return cache.get(cacheKey);
        }

        try {
            const response = await axios.get(networkConfig.apiUrl, {
                params: {
                    module: 'contract',
                    action: 'getsourcecode',
                    address: address,
                    apikey: networkConfig.apiKey
                },
                timeout: 10000
            });

            if (response.data.status !== '1') {
                throw new Error(response.data.message || 'Erro ao obter status');
            }

            const result = response.data.result[0];
            const isVerified = result.SourceCode !== '';

            const status = {
                verified: isVerified,
                contractName: result.ContractName,
                compilerVersion: result.CompilerVersion,
                optimization: result.OptimizationUsed === '1',
                runs: result.Runs,
                abi: result.ABI,
                sourceCode: result.SourceCode,
                network: networkConfig.name
            };

            cache.set(cacheKey, status, 300); // Cache por 5 minutos
            return status;

        } catch (error) {
            throw new Error(`Erro ao obter status da verificação: ${error.message}`);
        }
    }

    // Obter código fonte verificado
    async getSourceCode(network, address) {
        const status = await this.getVerificationStatus(network, address);
        
        if (!status.verified) {
            throw new Error('Contrato não verificado');
        }

        return {
            sourceCode: status.sourceCode,
            contractName: status.contractName,
            compilerVersion: status.compilerVersion,
            abi: JSON.parse(status.abi || '[]')
        };
    }

    // Codificar argumentos do construtor
    encodeConstructorArguments(args) {
        const { ethers } = require('ethers');
        
        try {
            const abiCoder = new ethers.utils.AbiCoder();
            
            // Codificar os argumentos do construtor do token padrão
            const encoded = abiCoder.encode(
                ['string', 'string', 'uint256', 'uint8'],
                [args.name, args.symbol, args.totalSupply, args.decimals]
            );

            // Remover o prefixo '0x'
            return encoded.slice(2);

        } catch (error) {
            console.error('Erro ao codificar argumentos do construtor:', error);
            return '';
        }
    }

    // Validar código fonte
    validateSourceCode(sourceCode) {
        const validations = {
            hasLicense: /SPDX-License-Identifier/.test(sourceCode),
            hasPragma: /pragma solidity/.test(sourceCode),
            hasContract: /contract\s+\w+/.test(sourceCode),
            hasConstructor: /constructor\s*\(/.test(sourceCode),
            isERC20: /IERC20|ERC20/.test(sourceCode)
        };

        const warnings = [];
        
        if (!validations.hasLicense) {
            warnings.push('Licença SPDX não encontrada');
        }
        if (!validations.hasPragma) {
            warnings.push('Pragma Solidity não encontrado');
        }
        if (!validations.hasContract) {
            warnings.push('Definição de contrato não encontrada');
        }

        return {
            valid: Object.values(validations).filter(Boolean).length >= 3,
            validations,
            warnings
        };
    }

    // Obter lista de contratos verificados
    async getVerifiedContracts(network, page = 1, limit = 50) {
        // Esta funcionalidade dependeria de um banco de dados próprio
        // Por enquanto, retorna uma lista simulada
        const contracts = [];
        
        for (let i = 0; i < Math.min(limit, 20); i++) {
            contracts.push({
                address: '0x' + Math.random().toString(16).substr(2, 40),
                name: `Token ${i + 1}`,
                symbol: `TK${i + 1}`,
                verifiedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                network: NETWORKS[network]?.name || 'Unknown'
            });
        }

        return {
            contracts,
            pagination: {
                page,
                limit,
                total: contracts.length,
                hasNext: false
            }
        };
    }
}

module.exports = new VerificationService();
