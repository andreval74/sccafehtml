
/* ===================================
   WEB3 MANAGER - SCCAFÉ
   =================================== */

// Gerenciador principal do Web3
const Web3Manager = {
  
  // Inicializar Web3
  async init() {
    try {
      await this.detectProvider();
      await this.checkConnection();
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
      DebugUtils.log('🦊 MetaMask detectado');
      return true;
    } else if (typeof window.web3 !== 'undefined') {
      window.web3 = new Web3(window.web3.currentProvider);
      DebugUtils.log('🌐 Web3 Provider detectado');
      return true;
    } else {
      DebugUtils.warn('⚠️ Nenhum provedor Web3 detectado');
      this.updateConnectionStatus(false, 'Instale MetaMask ou Trust Wallet');
      return false;
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
