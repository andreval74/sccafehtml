
/* ===================================
   CONFIGURAÇÕES GLOBAIS - SCCAFÉ
   =================================== */

// Configuração principal da aplicação
const APP_CONFIG = {
  name: 'SCCafé',
  version: '2.1.0',
  description: 'CREATE2 Token Factory',
  website: 'https://sccafe.com',
  
  // Redes suportadas
  networks: {
    'bsc-testnet': {
      chainId: 97,
      name: 'BSC Testnet',
      rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
      explorer: 'https://testnet.bscscan.com',
      currency: 'tBNB',
      isTestnet: true,
      contracts: {
        factory: '0x...' // Endereço do contrato factory
      }
    },
    'bsc-mainnet': {
      chainId: 56,
      name: 'BSC Mainnet',
      rpcUrl: 'https://bsc-dataseed.binance.org/',
      explorer: 'https://bscscan.com',
      currency: 'BNB',
      isTestnet: false,
      contracts: {
        factory: '0x...' // Endereço do contrato factory
      }
    }
  },
  
  // Carteiras suportadas
  wallets: {
    supported: ['metamask', 'trustwallet'],
    popular: ['metamask', 'trustwallet', 'binance', 'coinbase']
  },
  
  // APIs
  apis: {
    compile: '/api/compile',
    deploy: '/api/deploy',
    verify: '/api/verify',
    status: '/api/status'
  },
  
  // Configurações do tema
  theme: {
    colors: {
      primary: '#D4A574',
      primaryDark: '#B8935F',
      secondary: '#1a1a1a',
      background: '#0a0a0a',
      text: '#ffffff',
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b'
    }
  }
};

// Estado global da aplicação
const APP_STATE = {
  currentNetwork: 'bsc-testnet',
  connected: false,
  account: null,
  balance: '0',
  loading: false,
  language: 'pt'
};

// Utilitários de configuração
const ConfigUtils = {
  
  // Obter configuração da rede atual
  getCurrentNetwork() {
    return APP_CONFIG.networks[APP_STATE.currentNetwork];
  },
  
  // Verificar se é rede de teste
  isTestnet() {
    return this.getCurrentNetwork().isTestnet;
  },
  
  // Obter URL do explorer
  getExplorerUrl(type, hash) {
    const explorer = this.getCurrentNetwork().explorer;
    const routes = {
      tx: 'tx',
      address: 'address',
      token: 'token'
    };
    return `${explorer}/${routes[type]}/${hash}`;
  },
  
  // Salvar configuração local
  saveConfig(key, value) {
    try {
      localStorage.setItem(`sccafe_${key}`, JSON.stringify(value));
    } catch (error) {
      console.warn('Erro ao salvar configuração:', error);
    }
  },
  
  // Carregar configuração local
  loadConfig(key, defaultValue = null) {
    try {
      const saved = localStorage.getItem(`sccafe_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (error) {
      console.warn('Erro ao carregar configuração:', error);
      return defaultValue;
    }
  },
  
  // Inicializar configurações
  init() {
    // Carregar idioma salvo
    const savedLang = this.loadConfig('language');
    if (savedLang && ['pt', 'en', 'zh'].includes(savedLang)) {
      APP_STATE.language = savedLang;
    }
    
    // Carregar rede salva
    const savedNetwork = this.loadConfig('network');
    if (savedNetwork && APP_CONFIG.networks[savedNetwork]) {
      APP_STATE.currentNetwork = savedNetwork;
    }
    
    console.log('📋 Configurações carregadas:', {
      language: APP_STATE.language,
      network: APP_STATE.currentNetwork,
      version: APP_CONFIG.version
    });
  }
};

// Inicializar configurações ao carregar
document.addEventListener('DOMContentLoaded', () => {
  ConfigUtils.init();
});
