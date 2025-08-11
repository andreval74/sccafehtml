/* ===================================
   MOCK API - SCCAFÉ
   Simulação das APIs necessárias
   Em produção, implementar no backend
   =================================== */

const MockAPI = {
  
  // Configurações mockadas do admin
  adminConfig: {
    networks: {
      56: {
        factoryAddress: '0x1234567890123456789012345678901234567890',
        pricing: {
          suffixTypes: {
            'none': 0.00,
            'cafe': 5.00,
            'custom': 10.00
          },
          contractFeatures: {
            'basic': 0.00,
            'mintable': 2.00,
            'burnable': 1.00,
            'pausable': 1.50,
            'taxable': 3.00
          },
          networkMultiplier: 1.0
        }
      },
      97: {
        factoryAddress: '0x9876543210987654321098765432109876543210',
        pricing: {
          suffixTypes: {
            'none': 0.00,
            'cafe': 0.00,
            'custom': 0.00
          },
          contractFeatures: {
            'basic': 0.00,
            'mintable': 0.00,
            'burnable': 0.00,
            'pausable': 0.00,
            'taxable': 0.00
          },
          networkMultiplier: 0.0
        }
      }
    },
    paymentToken: 'USDT'
  },

  // Simular endpoints da API
  async fetch(endpoint, options = {}) {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));
    
    const { method = 'GET', body } = options;
    
    switch (endpoint) {
      case '/api/admin/network-config':
        return this.getNetworkConfig();
        
      case '/api/admin/pricing':
        return this.getPricing();
        
      case '/api/contracts/factory-abi':
        return this.getFactoryABI();
        
      case '/api/user/tokens':
        return this.getUserTokens(options.params?.address);
        
      case '/api/deploy/token':
        return this.deployToken(JSON.parse(body));
        
      case '/api/verify/contract':
        return this.verifyContract(JSON.parse(body));
        
      default:
        return { success: false, error: 'Endpoint não encontrado' };
    }
  },

  // Obter configurações de rede
  getNetworkConfig() {
    return {
      success: true,
      networks: this.adminConfig.networks
    };
  },

  // Obter configurações de preços
  getPricing() {
    return {
      success: true,
      pricing: {
        suffixTypes: {
          'none': 0.00,
          'cafe': 5.00,
          'custom': 10.00
        },
        contractFeatures: {
          'basic': 0.00,
          'mintable': 2.00,
          'burnable': 1.00,
          'pausable': 1.50,
          'taxable': 3.00,
          'antibot': 2.50,
          'maxwallet': 1.00,
          'blacklist': 2.00
        },
        networkMultiplier: {
          1: 1.5,
          56: 1.0,
          137: 1.2,
          97: 0.0
        },
        verification: {
          'automatic': 0.00,
          'manual': 2.00,
          'custom': 5.00
        }
      },
      paymentToken: this.adminConfig.paymentToken
    };
  },

  // Obter ABI do factory
  getFactoryABI() {
    return {
      success: true,
      abi: [
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
          "inputs": [
            {"name": "name", "type": "string"},
            {"name": "symbol", "type": "string"},
            {"name": "totalSupply", "type": "uint256"},
            {"name": "salt", "type": "bytes32"}
          ],
          "name": "predictAddress",
          "outputs": [{"name": "", "type": "address"}],
          "type": "function"
        },
        {
          "anonymous": false,
          "inputs": [
            {"indexed": true, "name": "token", "type": "address"},
            {"indexed": true, "name": "creator", "type": "address"},
            {"name": "name", "type": "string"},
            {"name": "symbol", "type": "string"},
            {"name": "totalSupply", "type": "uint256"},
            {"name": "salt", "type": "bytes32"}
          ],
          "name": "TokenCreated",
          "type": "event"
        }
      ]
    };
  },

  // Obter tokens do usuário
  getUserTokens(userAddress) {
    // Simular dados de tokens do usuário
    const mockTokens = [
      {
        address: '0x1111111111111111111111111111111111111111',
        name: 'Test Token 1',
        symbol: 'TEST1',
        decimals: 18,
        totalSupply: '1000000',
        customSuffix: 'CAFE',
        createdAt: '2024-01-15T10:30:00Z',
        network: 'BSC Testnet',
        verified: true
      },
      {
        address: '0x2222222222222222222222222222222222222222',
        name: 'My Custom Token',
        symbol: 'MCT',
        decimals: 18,
        totalSupply: '500000',
        customSuffix: 'ABCD',
        createdAt: '2024-01-10T15:45:00Z',
        network: 'BSC Testnet',
        verified: false
      }
    ];

    return {
      success: true,
      tokens: mockTokens
    };
  },

  // Simular deploy de token
  deployToken(tokenData) {
    // Simular sucesso ou falha
    const success = Math.random() > 0.1; // 90% de sucesso
    
    if (success) {
      return {
        success: true,
        address: '0x' + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        transactionHash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        blockNumber: Math.floor(Math.random() * 1000000) + 25000000,
        gasUsed: Math.floor(Math.random() * 200000) + 800000
      };
    } else {
      return {
        success: false,
        error: 'Erro simulado no deploy'
      };
    }
  },

  // Simular verificação de contrato
  verifyContract(contractData) {
    const success = Math.random() > 0.2; // 80% de sucesso
    
    if (success) {
      return {
        success: true,
        verified: true,
        explorerUrl: `https://testnet.bscscan.com/address/${contractData.address}#code`
      };
    } else {
      return {
        success: false,
        error: 'Erro na verificação do contrato'
      };
    }
  },

  // Simular estatísticas globais
  getStats() {
    return {
      success: true,
      stats: {
        totalTokens: Math.floor(Math.random() * 1000) + 500,
        totalUsers: Math.floor(Math.random() * 500) + 200,
        successRate: 98 + Math.random() * 2,
        totalVolume: Math.floor(Math.random() * 50000) + 10000
      }
    };
  }
};

// Override do fetch global para interceptar chamadas de API
const originalFetch = window.fetch;
window.fetch = async function(url, options = {}) {
  // Se for uma chamada para nossa API mockada
  if (url.startsWith('/api/')) {
    console.log('🔧 Mock API call:', url, options);
    
    try {
      const result = await MockAPI.fetch(url, options);
      console.log('✅ Mock API response:', result);
      
      // Simular Response object
      return {
        ok: result.success !== false,
        status: result.success !== false ? 200 : 400,
        json: async () => result
      };
    } catch (error) {
      console.error('❌ Mock API error:', error);
      return {
        ok: false,
        status: 500,
        json: async () => ({ success: false, error: error.message })
      };
    }
  }
  
  // Para outras URLs, usar fetch original
  return originalFetch(url, options);
};

// Exportar para uso global
window.MockAPI = MockAPI;

console.log('🔧 Mock API inicializada - Simulando backend do SCCafé');
