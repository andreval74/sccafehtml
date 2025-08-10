
// Web3 Integration para SCCafé CREATE2
class Web3Manager {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.account = null;
        this.chainId = null;
        this.isConnected = false;
        
        // BSC Testnet Configuration
        this.targetChainId = '0x61'; // 97 em hex
        this.chainConfig = {
            chainId: '0x61',
            chainName: 'BSC Testnet',
            nativeCurrency: {
                name: 'BNB',
                symbol: 'tBNB',
                decimals: 18
            },
            rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
            blockExplorerUrls: ['https://testnet.bscscan.com']
        };
        
        // Token Factory Contract (CREATE2)
        this.factoryAddress = '0x...'; // Será definido quando deployado
        this.factoryABI = [
            "function createToken(string memory name, string memory symbol, uint256 totalSupply, bytes32 salt) external returns (address)",
            "function computeAddress(bytes32 salt, bytes memory bytecode) external view returns (address)",
            "function getCreationCode(string memory name, string memory symbol, uint256 totalSupply) external pure returns (bytes memory)",
            "event TokenCreated(address indexed token, address indexed creator, bytes32 salt)"
        ];
        
        this.init();
    }
    
    async init() {
        // Verificar se MetaMask está instalado
        if (typeof window.ethereum !== 'undefined') {
            this.provider = window.ethereum;
            
            // Verificar se já está conectado
            const accounts = await this.provider.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                await this.handleAccountsChanged(accounts);
            }
            
            // Event listeners
            this.provider.on('accountsChanged', this.handleAccountsChanged.bind(this));
            this.provider.on('chainChanged', this.handleChainChanged.bind(this));
            this.provider.on('disconnect', this.handleDisconnect.bind(this));
        }
        
        this.updateUI();
    }
    
    async connectWallet() {
        if (!this.provider) {
            this.showToast('error', window.translationManager.translate('wallet_not_found'));
            return false;
        }
        
        try {
            this.showLoading(true);
            
            const accounts = await this.provider.request({
                method: 'eth_requestAccounts'
            });
            
            await this.handleAccountsChanged(accounts);
            
            // Verificar rede
            await this.checkNetwork();
            
            this.showToast('success', window.translationManager.translate('wallet_connected'));
            return true;
            
        } catch (error) {
            console.error('Erro ao conectar carteira:', error);
            this.showToast('error', error.message);
            return false;
        } finally {
            this.showLoading(false);
        }
    }
    
    async disconnectWallet() {
        this.account = null;
        this.signer = null;
        this.isConnected = false;
        this.updateUI();
        this.showToast('warning', window.translationManager.translate('wallet_disconnected'));
    }
    
    async handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            await this.disconnectWallet();
        } else {
            this.account = accounts[0];
            this.isConnected = true;
            
            // Criar signer se ethers estiver disponível
            if (window.ethers) {
                const provider = new ethers.providers.Web3Provider(this.provider);
                this.signer = provider.getSigner();
            }
            
            this.updateUI();
        }
    }
    
    async handleChainChanged(chainId) {
        this.chainId = chainId;
        await this.checkNetwork();
        this.updateUI();
    }
    
    handleDisconnect() {
        this.disconnectWallet();
    }
    
    async checkNetwork() {
        const chainId = await this.provider.request({ method: 'eth_chainId' });
        this.chainId = chainId;
        
        if (chainId !== this.targetChainId) {
            try {
                await this.switchNetwork();
            } catch (error) {
                this.showToast('error', window.translationManager.translate('wrong_network'));
            }
        }
    }
    
    async switchNetwork() {
        try {
            await this.provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: this.targetChainId }]
            });
        } catch (switchError) {
            if (switchError.code === 4902) {
                try {
                    await this.provider.request({
                        method: 'wallet_addEthereumChain',
                        params: [this.chainConfig]
                    });
                } catch (addError) {
                    throw addError;
                }
            } else {
                throw switchError;
            }
        }
    }
    
    async createToken(tokenData) {
        if (!this.isConnected) {
            this.showToast('error', 'Carteira não conectada');
            return null;
        }
        
        try {
            this.showLoading(true);
            
            // Gerar salt se não fornecido
            if (!tokenData.salt) {
                tokenData.salt = this.generateSalt();
            }
            
            // Calcular endereço previsto
            const predictedAddress = await this.computeTokenAddress(tokenData);
            
            // Mostrar confirmação
            const confirmed = confirm(`
                Token: ${tokenData.name} (${tokenData.symbol})
                Supply: ${tokenData.totalSupply}
                Endereço Previsto: ${predictedAddress}
                
                Confirmar criação?
            `);
            
            if (!confirmed) {
                return null;
            }
            
            // Simular criação do token (substituir por contrato real)
            const txHash = await this.simulateTokenCreation(tokenData);
            
            this.showToast('success', window.translationManager.translate('transaction_confirmed'));
            
            // Salvar token no localStorage
            this.saveTokenToHistory({
                ...tokenData,
                address: predictedAddress,
                txHash: txHash,
                createdAt: new Date().toISOString(),
                creator: this.account
            });
            
            return {
                address: predictedAddress,
                txHash: txHash
            };
            
        } catch (error) {
            console.error('Erro ao criar token:', error);
            this.showToast('error', error.message || 'Erro ao criar token');
            return null;
        } finally {
            this.showLoading(false);
        }
    }
    
    async simulateTokenCreation(tokenData) {
        // Simular transação (substituir por contrato real)
        return new Promise((resolve) => {
            setTimeout(() => {
                const txHash = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
                resolve(txHash);
            }, 2000);
        });
    }
    
    async computeTokenAddress(tokenData) {
        // Simular cálculo de endereço CREATE2 (substituir por contrato real)
        const salt = tokenData.salt || this.generateSalt();
        const hash = this.keccak256(tokenData.name + tokenData.symbol + salt);
        return '0x' + hash.slice(-40);
    }
    
    generateSalt() {
        return '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    }
    
    keccak256(input) {
        // Simular hash keccak256 (usar biblioteca real em produção)
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).padStart(64, '0');
    }
    
    saveTokenToHistory(tokenData) {
        const tokens = JSON.parse(localStorage.getItem('userTokens') || '[]');
        tokens.push(tokenData);
        localStorage.setItem('userTokens', JSON.stringify(tokens));
    }
    
    getUserTokens() {
        return JSON.parse(localStorage.getItem('userTokens') || '[]');
    }
    
    updateUI() {
        const connectBtn = document.getElementById('connectWallet');
        const walletInfo = document.getElementById('walletInfo');
        
        if (this.isConnected && this.account) {
            if (connectBtn) connectBtn.style.display = 'none';
            if (walletInfo) {
                walletInfo.style.display = 'flex';
                const addressElement = walletInfo.querySelector('.wallet-address');
                const networkElement = walletInfo.querySelector('.wallet-network');
                
                if (addressElement) {
                    addressElement.textContent = this.formatAddress(this.account);
                }
                
                if (networkElement) {
                    const networkName = this.chainId === this.targetChainId ? 'BSC Testnet' : 'Wrong Network';
                    networkElement.textContent = networkName;
                    networkElement.style.color = this.chainId === this.targetChainId ? 'var(--success)' : 'var(--error)';
                }
            }
            
            // Mostrar seções admin se for admin
            if (this.isAdmin()) {
                document.querySelectorAll('.admin-only').forEach(el => {
                    el.classList.add('show-admin');
                });
            }
        } else {
            if (connectBtn) connectBtn.style.display = 'flex';
            if (walletInfo) walletInfo.style.display = 'none';
            
            // Esconder seções admin
            document.querySelectorAll('.admin-only').forEach(el => {
                el.classList.remove('show-admin');
            });
        }
    }
    
    formatAddress(address) {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    
    isAdmin() {
        // Lista de endereços admin (pode ser carregada de um contrato)
        const adminAddresses = [
            '0x742d35Cc6629C58b26F8d7a1E5b3E7d9D2A6C7d8', // exemplo
        ];
        return this.account && adminAddresses.includes(this.account);
    }
    
    showToast(type, message) {
        if (window.showToast) {
            window.showToast(type, message);
        }
    }
    
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }
}

// Inicializar Web3Manager
window.web3Manager = new Web3Manager();
