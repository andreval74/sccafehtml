
/* ===================================
   WEB3 MANAGER - SCCAFÉ DINÂMICO
   Sistema baseado no 02sccafe repository
   =================================== */

// Configuração dinâmica das redes
const NETWORK_CONFIGS = {
  1: {
    name: 'Ethereum Mainnet',
    rpc: 'https://eth-mainnet.public.blastapi.io',
    explorer: 'https://etherscan.io',
    currency: 'ETH',
    isTestnet: false,
    factoryAddress: null // Será configurado dinamicamente
  },
  56: {
    name: 'BSC Mainnet', 
    rpc: 'https://bsc-dataseed1.binance.org/',
    explorer: 'https://bscscan.com',
    currency: 'BNB',
    isTestnet: false,
    factoryAddress: null
  },
  97: {
    name: 'BSC Testnet',
    rpc: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    explorer: 'https://testnet.bscscan.com',
    currency: 'tBNB', 
    isTestnet: true,
    factoryAddress: null
  },
  137: {
    name: 'Polygon Mainnet',
    rpc: 'https://polygon-rpc.com',
    explorer: 'https://polygonscan.com',
    currency: 'MATIC',
    isTestnet: false,
    factoryAddress: null
  }
};

// Gerenciador principal do Web3
const Web3Manager = {
  
  currentNetwork: null,
  currentProvider: null,
  userAddress: null,
  factoryContract: null,
  
  // Inicializar Web3
  async init() {
    try {
      await this.detectProvider();
      await this.checkConnection();
      await this.loadNetworkConfig();
      this.setupEventListeners();
      
      DebugUtils.log('✅ Web3 inicializado');
    } catch (error) {
      DebugUtils.error('❌ Erro ao inicializar Web3:', error);
    }
  },
  
  
  // Detectar provedor Web3
  async detectProvider() {
    if (typeof window.ethereum !== 'undefined') {
      window.web3 = new Web3(window.ethereum);
      this.currentProvider = window.ethereum;
      DebugUtils.log('🦊 MetaMask detectado');
      return true;
    } else if (typeof window.web3 !== 'undefined') {
      window.web3 = new Web3(window.web3.currentProvider);
      this.currentProvider = window.web3.currentProvider;
      DebugUtils.log('🌐 Web3 Provider detectado');
      return true;
    } else {
      DebugUtils.warn('⚠️ Nenhum provedor Web3 detectado');
      this.updateConnectionStatus(false, 'Instale MetaMask ou Trust Wallet');
      return false;
    }
  },

  // Carregar configurações da rede do servidor/admin
  async loadNetworkConfig() {
    try {
      // Carrega configurações dinâmicas do admin
      const response = await fetch('/api/admin/network-config');
      const config = await response.json();
      
      if (config.success) {
        // Atualiza endereços das factories dinamicamente
        Object.keys(config.networks).forEach(chainId => {
          if (NETWORK_CONFIGS[chainId]) {
            NETWORK_CONFIGS[chainId].factoryAddress = config.networks[chainId].factoryAddress;
            NETWORK_CONFIGS[chainId].pricing = config.networks[chainId].pricing;
          }
        });
        
        DebugUtils.log('✅ Configurações de rede carregadas dinamicamente');
      }
    } catch (error) {
      DebugUtils.warn('⚠️ Usando configuração local de rede:', error);
    }
  },

  // Conectar carteira
  async connectWallet() {
    try {
      if (!this.currentProvider) {
        throw new Error('Nenhum provedor Web3 encontrado');
      }

      // Solicitar conexão
      const accounts = await this.currentProvider.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length > 0) {
        this.userAddress = accounts[0];
        await this.detectNetwork();
        await this.updateConnectionStatus(true, this.userAddress);
        
        // Carregar factory contract da rede atual
        await this.loadFactoryContract();
        
        DebugUtils.log('✅ Carteira conectada:', this.userAddress);
        return {
          address: this.userAddress,
          network: this.currentNetwork
        };
      }
    } catch (error) {
      DebugUtils.error('❌ Erro ao conectar carteira:', error);
      throw error;
    }
  },

  // Detectar rede atual
  async detectNetwork() {
    try {
      const chainId = await this.currentProvider.request({
        method: 'eth_chainId'
      });
      
      const numChainId = parseInt(chainId, 16);
      this.currentNetwork = NETWORK_CONFIGS[numChainId];
      
      if (!this.currentNetwork) {
        throw new Error(`Rede não suportada: ${numChainId}`);
      }
      
      DebugUtils.log('🌐 Rede detectada:', this.currentNetwork.name);
      
      // Verificar se é testnet e avisar usuário
      if (this.currentNetwork.isTestnet) {
        this.showTestnetWarning();
      }
      
      return this.currentNetwork;
    } catch (error) {
      DebugUtils.error('❌ Erro ao detectar rede:', error);
      throw error;
    }
  },

  // Carregar contrato factory da rede atual
  async loadFactoryContract() {
    if (!this.currentNetwork || !this.currentNetwork.factoryAddress) {
      DebugUtils.warn('⚠️ Factory address não configurado para esta rede');
      return;
    }

    try {
      const factoryABI = await this.getFactoryABI();
      this.factoryContract = new window.web3.eth.Contract(
        factoryABI, 
        this.currentNetwork.factoryAddress
      );
      
      DebugUtils.log('✅ Factory contract carregado:', this.currentNetwork.factoryAddress);
    } catch (error) {
      DebugUtils.error('❌ Erro ao carregar factory contract:', error);
    }
  },

  // Obter ABI do factory (pode vir do servidor ou ser hardcoded)
  async getFactoryABI() {
    try {
      const response = await fetch('/api/contracts/factory-abi');
      const data = await response.json();
      return data.abi;
    } catch (error) {
      // Fallback para ABI básico
      return [
        {
          "inputs": [
            {"name": "name", "type": "string"},
            {"name": "symbol", "type": "string"}, 
            {"name": "totalSupply", "type": "uint256"},
            {"name": "salt", "type": "bytes32"}
          ],
          "name": "createToken",
          "outputs": [{"name": "", "type": "address"}],
          "type": "function"
        },
        {
          "inputs": [{"name": "salt", "type": "bytes32"}],
          "name": "predictAddress", 
          "outputs": [{"name": "", "type": "address"}],
          "type": "function"
        }
      ];
    }
  },
  
  // Verificar conexão existente
  async checkConnection() {
    try {
      if (window.ethereum && window.ethereum.selectedAddress) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await this.handleAccountConnection(accounts[0]);
        }
      }
    } catch (error) {
      DebugUtils.error('Erro ao verificar conexão:', error);
    }
  },
  
  // Configurar event listeners
  setupEventListeners() {
    if (window.ethereum) {
      // Mudança de conta
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          this.handleAccountConnection(accounts[0]);
        } else {
          this.handleDisconnection();
        }
      });
      
      // Mudança de rede
      window.ethereum.on('chainChanged', (chainId) => {
        this.handleNetworkChange(chainId);
      });
    }
    
    // Botão de conectar
    const connectBtn = DOMUtils.$('#connectWallet');
    if (connectBtn) {
      connectBtn.addEventListener('click', () => {
        this.connectWallet();
      });
    }
  },
  
  // Conectar carteira
  async connectWallet() {
    try {
      if (!window.ethereum) {
        NotificationUtils.error('MetaMask não encontrado. Por favor, instale a extensão.');
        return false;
      }
      
      LoadingManager.show('Conectando carteira...');
      
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      if (accounts.length > 0) {
        await this.handleAccountConnection(accounts[0]);
        NotificationUtils.success('Carteira conectada com sucesso!');
        return true;
      }
      
      return false;
    } catch (error) {
      DebugUtils.error('Erro ao conectar carteira:', error);
      
      if (error.code === 4001) {
        NotificationUtils.warning('Conexão rejeitada pelo usuário');
      } else {
        NotificationUtils.error('Erro ao conectar carteira');
      }
      
      return false;
    } finally {
      LoadingManager.hide();
    }
  },
  
  // Lidar com conexão da conta
  async handleAccountConnection(account) {
    APP_STATE.connected = true;
    APP_STATE.account = account;
    
    // Obter saldo
    await this.updateBalance();
    
    // Verificar rede
    await this.checkNetwork();
    
    // Atualizar interface
    this.updateConnectionUI();
    
    DebugUtils.log('👤 Conta conectada:', FormatUtils.formatAddress(account));
  },
  
  // Lidar com desconexão
  handleDisconnection() {
    APP_STATE.connected = false;
    APP_STATE.account = null;
    APP_STATE.balance = '0';
    
    this.updateConnectionUI();
    this.updateConnectionStatus(false, 'Desconectado');
    
    DebugUtils.log('🔌 Carteira desconectada');
  },
  
  // Atualizar saldo
  async updateBalance() {
    try {
      if (!APP_STATE.account) return;
      
      const balance = await window.web3.eth.getBalance(APP_STATE.account);
      APP_STATE.balance = window.web3.utils.fromWei(balance, 'ether');
      
      DebugUtils.log('💰 Saldo atualizado:', APP_STATE.balance);
    } catch (error) {
      DebugUtils.error('Erro ao obter saldo:', error);
    }
  },
  
  // Verificar rede
  async checkNetwork() {
    try {
      const chainId = await window.web3.eth.getChainId();
      const currentNetwork = ConfigUtils.getCurrentNetwork();
      
      if (chainId !== currentNetwork.chainId) {
        this.updateConnectionStatus(false, `Rede incorreta. Use ${currentNetwork.name}`);
        
        // Sugerir mudança de rede
        await this.switchNetwork(currentNetwork.chainId);
      } else {
        this.updateConnectionStatus(true, currentNetwork.name);
      }
    } catch (error) {
      DebugUtils.error('Erro ao verificar rede:', error);
    }
  },
  
  // Trocar rede
  async switchNetwork(chainId) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }]
      });
    } catch (error) {
      if (error.code === 4902) {
        // Rede não existe, adicionar
        await this.addNetwork(chainId);
      } else {
        DebugUtils.error('Erro ao trocar rede:', error);
      }
    }
  },
  
  // Adicionar rede
  async addNetwork(chainId) {
    const networks = APP_CONFIG.networks;
    const network = Object.values(networks).find(n => n.chainId === chainId);
    
    if (!network) return;
    
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${chainId.toString(16)}`,
          chainName: network.name,
          rpcUrls: [network.rpcUrl],
          nativeCurrency: {
            name: network.currency,
            symbol: network.currency,
            decimals: 18
          },
          blockExplorerUrls: [network.explorer]
        }]
      });
    } catch (error) {
      DebugUtils.error('Erro ao adicionar rede:', error);
    }
  },
  
  // Lidar com mudança de rede
  handleNetworkChange(chainId) {
    const decimalChainId = parseInt(chainId, 16);
    DebugUtils.log('🌐 Rede alterada para:', decimalChainId);
    
    // Atualizar estado se necessário
    this.checkNetwork();
  },
  
  // Atualizar interface de conexão
  updateConnectionUI() {
    const connectBtn = DOMUtils.$('#connectWallet');
    
    if (connectBtn) {
      if (APP_STATE.connected) {
        connectBtn.innerHTML = `
          <i data-lucide="user"></i>
          <span>${FormatUtils.formatAddress(APP_STATE.account)}</span>
        `;
        connectBtn.classList.add('connected');
      } else {
        connectBtn.innerHTML = `
          <i data-lucide="wallet"></i>
          <span data-lang="wallet.connect">Conectar Carteira</span>
        `;
        connectBtn.classList.remove('connected');
      }
      
      lucide.createIcons();
    }
  },
  
  // Atualizar status da conexão
  updateConnectionStatus(connected, message) {
    const networkStatus = DOMUtils.$('#networkStatus');
    const networkIndicator = networkStatus?.querySelector('.network-indicator');
    const statusText = networkIndicator?.querySelector('span');
    
    if (networkIndicator && statusText) {
      networkIndicator.className = `network-indicator ${connected ? 'online' : 'offline'}`;
      statusText.textContent = message;
    }
  }
};

// Gerenciador de Contratos
const ContractManager = {
  
  // Deploy de token
  async deployToken(tokenData) {
    try {
      if (!APP_STATE.connected) {
        throw new Error('Carteira não conectada');
      }
      
      LoadingManager.show('Compilando contrato...');
      
      // 1. Compilar contrato
      const compilation = await this.compileContract(tokenData);
      if (!compilation.success) {
        throw new Error('Erro na compilação: ' + compilation.error);
      }
      
      LoadingManager.show('Calculando endereço personalizado...');
      
      // 2. Calcular endereço CREATE2
      const create2Data = await this.calculateCreate2Address(tokenData, compilation);
      
      LoadingManager.show('Fazendo deploy do contrato...');
      
      // 3. Deploy do contrato
      const deployResult = await this.deployCompiledContract(compilation, create2Data);
      
      LoadingManager.show('Verificando contrato...');
      
      // 4. Verificar contrato
      const verificationResult = await this.verifyContract(deployResult);
      
      return {
        success: true,
        address: deployResult.address,
        txHash: deployResult.txHash,
        verified: verificationResult.success
      };
      
    } catch (error) {
      DebugUtils.error('Erro no deploy:', error);
      throw error;
    } finally {
      LoadingManager.hide();
    }
  },
  
  // Compilar contrato via API
  async compileContract(tokenData) {
    try {
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: tokenData.name,
          symbol: tokenData.symbol,
          totalSupply: tokenData.totalSupply,
          customPrefix: tokenData.customPrefix || ''
        })
      });
      
      return await response.json();
    } catch (error) {
      DebugUtils.error('Erro na compilação:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Calcular endereço CREATE2
  async calculateCreate2Address(tokenData, compilation) {
    try {
      const response = await fetch('/api/calculate-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bytecode: compilation.bytecode,
          customPrefix: tokenData.customPrefix || '',
          deployer: APP_STATE.account
        })
      });
      
      return await response.json();
    } catch (error) {
      DebugUtils.error('Erro no cálculo de endereço:', error);
      throw error;
    }
  },
  
  // Deploy do contrato compilado
  async deployCompiledContract(compilation, create2Data) {
    try {
      const contract = new window.web3.eth.Contract(compilation.abi);
      
      const deployTx = contract.deploy({
        data: compilation.bytecode,
        arguments: [] // Argumentos do construtor se necessário
      });
      
      const gasEstimate = await deployTx.estimateGas({
        from: APP_STATE.account
      });
      
      const result = await deployTx.send({
        from: APP_STATE.account,
        gas: Math.floor(gasEstimate * 1.2), // 20% de margem
        gasPrice: await window.web3.eth.getGasPrice()
      });
      
      return {
        address: result.options.address,
        txHash: result.transactionHash
      };
      
    } catch (error) {
      DebugUtils.error('Erro no deploy:', error);
      throw error;
    }
  },
  
  // Verificar contrato
  async verifyContract(deployResult) {
    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address: deployResult.address,
          network: APP_STATE.currentNetwork
        })
      });
      
      return await response.json();
    } catch (error) {
      DebugUtils.error('Erro na verificação:', error);
      return { success: false, error: error.message };
    }
  }
};

// Classe Web3 mock para desenvolvimento (caso MetaMask não esteja disponível)
class MockWeb3 {
  constructor() {
    this.eth = {
      getBalance: () => Promise.resolve('1000000000000000000'), // 1 ETH
      getChainId: () => Promise.resolve(97), // BSC Testnet
      Contract: class {
        constructor() {}
        deploy() {
          return {
            estimateGas: () => Promise.resolve(2000000),
            send: () => Promise.resolve({
              options: { address: '0x1234567890123456789012345678901234567890' },
              transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
            })
          };
        }
      }
    };
    this.utils = {
      fromWei: (value, unit) => (parseFloat(value) / 1e18).toString(),
      toWei: (value, unit) => (parseFloat(value) * 1e18).toString()
    };
  }
}

// Inicializar Web3 quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
  // Verificar se está em desenvolvimento
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (isDev && typeof window.ethereum === 'undefined') {
    // Mock Web3 para desenvolvimento
    window.web3 = new MockWeb3();
    window.ethereum = {
      selectedAddress: '0x1234567890123456789012345678901234567890',
      request: (params) => {
        switch (params.method) {
          case 'eth_accounts':
            return Promise.resolve(['0x1234567890123456789012345678901234567890']);
          case 'eth_requestAccounts':
            return Promise.resolve(['0x1234567890123456789012345678901234567890']);
          default:
            return Promise.resolve(null);
        }
      },
      on: () => {} // Mock event listener
    };
    
    DebugUtils.log('🚧 Modo desenvolvimento - Web3 simulado');
  }
  
  // Inicializar Web3 após um pequeno delay
  setTimeout(() => {
    Web3Manager.init();
  }, 1000);
});
