
// SCCafé - API Client
class APIClient {
    constructor() {
        this.baseURL = SCCafe.config.apiUrl;
        this.timeout = 30000; // 30 segundos
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: this.timeout
        };

        const finalOptions = { ...defaultOptions, ...options };

        // Adicionar timeout manual
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                ...finalOptions,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Timeout na requisição');
            }
            
            throw error;
        }
    }

    // Verificar status da API
    async healthCheck() {
        try {
            return await this.request('/health');
        } catch (error) {
            console.error('API health check failed:', error);
            return { status: 'error', message: error.message };
        }
    }

    // Deploy de contrato
    async deployContract(contractData) {
        return await this.request('/deploy-contract', {
            method: 'POST',
            body: JSON.stringify(contractData)
        });
    }

    // Verificar contrato
    async verifyContract(verificationData) {
        return await this.request('/verify-contract', {
            method: 'POST',
            body: JSON.stringify(verificationData)
        });
    }

    // Obter informações do token
    async getTokenInfo(address, network) {
        return await this.request(`/token-info/${network}/${address}`);
    }

    // Obter tokens do usuário
    async getUserTokens(userAddress, network) {
        return await this.request(`/user-tokens/${network}/${userAddress}`);
    }

    // Prever endereço do token
    async predictTokenAddress(tokenData) {
        return await this.request('/predict-address', {
            method: 'POST',
            body: JSON.stringify(tokenData)
        });
    }

    // Calcular taxa de gas
    async estimateGas(transactionData) {
        return await this.request('/estimate-gas', {
            method: 'POST',
            body: JSON.stringify(transactionData)
        });
    }

    // Obter preço do token
    async getTokenPrice(symbol) {
        return await this.request(`/token-price/${symbol}`);
    }

    // Criar pool de liquidez
    async createLiquidityPool(poolData) {
        return await this.request('/create-liquidity-pool', {
            method: 'POST',
            body: JSON.stringify(poolData)
        });
    }

    // Obter estatísticas
    async getStatistics() {
        return await this.request('/statistics');
    }

    // Salvar configurações do admin
    async saveAdminConfig(config) {
        return await this.request('/admin/config', {
            method: 'POST',
            body: JSON.stringify(config)
        });
    }

    // Carregar configurações do admin
    async loadAdminConfig() {
        return await this.request('/admin/config');
    }

    // Compilar contrato Solidity
    async compileContract(sourceCode, contractName) {
        return await this.request('/compile-contract', {
            method: 'POST',
            body: JSON.stringify({
                sourceCode,
                contractName
            })
        });
    }

    // Obter ABIs de contratos
    async getContractABI(address, network) {
        return await this.request(`/contract-abi/${network}/${address}`);
    }

    // Monitorar transação
    async monitorTransaction(txHash, network) {
        return await this.request(`/monitor-transaction/${network}/${txHash}`);
    }
}

// Instância global da API
const apiClient = new APIClient();

// Funções utilitárias para chamadas da API
const API = {
    // Verificar se a API está online
    async checkHealth() {
        try {
            const result = await apiClient.healthCheck();
            return result.status === 'ok';
        } catch (error) {
            return false;
        }
    },

    // Deploy com retry automático
    async deployTokenWithRetry(tokenData, maxRetries = 3) {
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await web3Manager.deployToken(tokenData);
            } catch (error) {
                lastError = error;
                
                // Aguardar antes de tentar novamente
                if (i < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
                }
            }
        }
        
        throw lastError;
    },

    // Verificar contrato com retry
    async verifyContractWithRetry(address, sourceCode, maxRetries = 3) {
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await web3Manager.verifyContract(address, sourceCode);
            } catch (error) {
                lastError = error;
                
                if (i < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, 5000 * (i + 1)));
                }
            }
        }
        
        throw lastError;
    },

    // Cache para informações de tokens
    tokenInfoCache: new Map(),
    
    async getTokenInfoCached(address, network) {
        const cacheKey = `${network}-${address}`;
        
        if (this.tokenInfoCache.has(cacheKey)) {
            const cached = this.tokenInfoCache.get(cacheKey);
            
            // Cache válido por 5 minutos
            if (Date.now() - cached.timestamp < 300000) {
                return cached.data;
            }
        }

        try {
            const data = await apiClient.getTokenInfo(address, network);
            
            this.tokenInfoCache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            
            return data;
        } catch (error) {
            // Se falhar, tentar obter informações via Web3
            if (web3Manager.isConnected) {
                return await this.getTokenInfoFromWeb3(address);
            }
            throw error;
        }
    },

    async getTokenInfoFromWeb3(address) {
        const contract = new ethers.Contract(
            address,
            SCCafe.contracts.token.abi,
            web3Manager.provider
        );

        const [name, symbol, decimals, totalSupply] = await Promise.all([
            contract.name(),
            contract.symbol(),
            contract.decimals(),
            contract.totalSupply()
        ]);

        return {
            name,
            symbol,
            decimals,
            totalSupply: totalSupply.toString()
        };
    },

    // Monitorar transação até confirmação
    async waitForTransaction(txHash, network, maxWaitTime = 300000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWaitTime) {
            try {
                const result = await apiClient.monitorTransaction(txHash, network);
                
                if (result.confirmed) {
                    return result;
                }
                
                // Aguardar 5 segundos antes de verificar novamente
                await new Promise(resolve => setTimeout(resolve, 5000));
                
            } catch (error) {
                console.error('Erro ao monitorar transação:', error);
                
                // Se a API falhar, usar Web3 direto
                if (web3Manager.provider) {
                    try {
                        const receipt = await web3Manager.provider.getTransactionReceipt(txHash);
                        if (receipt) {
                            return { confirmed: true, receipt };
                        }
                    } catch (web3Error) {
                        console.error('Erro ao verificar transação via Web3:', web3Error);
                    }
                }
                
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
        
        throw new Error('Timeout ao aguardar confirmação da transação');
    }
};

// Interceptador para erros de rede
window.addEventListener('online', () => {
    showToast('Conexão restaurada', 'success');
});

window.addEventListener('offline', () => {
    showToast('Conexão perdida - Modo offline', 'warning');
});
