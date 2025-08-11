/* ===================================
   PRICING MANAGER - SCCAFÉ
   Sistema de preços dinâmico
   =================================== */

const PricingManager = {
  
  currentPrices: null,
  paymentToken: 'USDT', // Configurável via admin
  
  // Estrutura de preços base
  basePricing: {
    // Preços por tipo de sufixo
    suffixTypes: {
      'none': 0.00,        // Sem sufixo personalizado
      'cafe': 5.00,        // Sufixo "cafe" 
      'custom': 10.00      // Sufixo personalizado (A-F, 0-9)
    },
    
    // Preços por features do contrato
    contractFeatures: {
      'basic': 0.00,           // Contrato básico ERC-20
      'mintable': 2.00,        // Função mint
      'burnable': 1.00,        // Função burn
      'pausable': 1.50,        // Função pause
      'taxable': 3.00,         // Sistema de taxas
      'antibot': 2.50,         // Proteção anti-bot
      'maxwallet': 1.00,       // Limite por carteira
      'blacklist': 2.00        // Sistema de blacklist
    },
    
    // Preços por rede
    networkMultiplier: {
      1: 1.5,      // Ethereum Mainnet (gas alto)
      56: 1.0,     // BSC Mainnet (padrão)
      137: 1.2,    // Polygon Mainnet
      97: 0.0      // BSC Testnet (grátis)
    },
    
    // Verificação de contrato
    verification: {
      'automatic': 0.00,   // Verificação automática incluída
      'manual': 2.00,      // Verificação manual
      'custom': 5.00       // Verificação com label customizado
    }
  },

  // Inicializar sistema de preços
  async init() {
    try {
      await this.loadPricingFromServer();
      this.setupPriceCalculator();
      DebugUtils.log('✅ Pricing Manager inicializado');
    } catch (error) {
      DebugUtils.error('❌ Erro ao inicializar Pricing Manager:', error);
      this.currentPrices = this.basePricing; // Fallback
    }
  },

  // Carregar preços do servidor/admin
  async loadPricingFromServer() {
    try {
      const response = await fetch('/api/admin/pricing');
      const data = await response.json();
      
      if (data.success) {
        this.currentPrices = data.pricing;
        this.paymentToken = data.paymentToken || 'USDT';
        DebugUtils.log('✅ Preços carregados do servidor');
      } else {
        throw new Error('Erro ao carregar preços do servidor');
      }
    } catch (error) {
      DebugUtils.warn('⚠️ Usando preços locais:', error);
      this.currentPrices = this.basePricing;
    }
  },

  // Calcular preço total baseado nas configurações
  calculatePrice(tokenConfig) {
    if (!this.currentPrices) return 0;

    let totalPrice = 0;
    const prices = this.currentPrices;

    // 1. Preço base do sufixo
    const suffixType = this.determineSuffixType(tokenConfig.customSuffix);
    totalPrice += prices.suffixTypes[suffixType] || 0;

    // 2. Features do contrato
    if (tokenConfig.features && Array.isArray(tokenConfig.features)) {
      tokenConfig.features.forEach(feature => {
        totalPrice += prices.contractFeatures[feature] || 0;
      });
    }

    // 3. Multiplicador da rede
    const networkId = tokenConfig.networkId || 56;
    const multiplier = prices.networkMultiplier[networkId] || 1.0;
    totalPrice *= multiplier;

    // 4. Verificação de contrato
    if (tokenConfig.verification) {
      totalPrice += prices.verification[tokenConfig.verification] || 0;
    }

    return Number(totalPrice.toFixed(2));
  },

  // Determinar tipo de sufixo
  determineSuffixType(suffix) {
    if (!suffix || suffix === '') return 'none';
    if (suffix.toLowerCase() === 'cafe') return 'cafe';
    
    // Verificar se é sufixo válido (A-F, 0-9, 4 caracteres)
    const validSuffixRegex = /^[A-Fa-f0-9]{4}$/;
    if (validSuffixRegex.test(suffix)) return 'custom';
    
    throw new Error('Sufixo inválido. Use apenas A-F e 0-9, 4 caracteres');
  },

  // Configurar calculadora de preços em tempo real
  setupPriceCalculator() {
    // Event listeners para inputs do formulário
    document.addEventListener('input', (e) => {
      if (e.target.classList.contains('price-trigger')) {
        this.updatePriceDisplay();
      }
    });

    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('price-trigger')) {
        this.updatePriceDisplay();
      }
    });
  },

  // Atualizar display de preço em tempo real
  updatePriceDisplay() {
    try {
      const tokenConfig = this.getTokenConfigFromForm();
      const price = this.calculatePrice(tokenConfig);
      
      // Atualizar elementos de preço na UI
      const priceElements = document.querySelectorAll('.price-display');
      priceElements.forEach(element => {
        element.textContent = `${price} ${this.paymentToken}`;
      });

      // Atualizar preço detalhado se existir
      this.updateDetailedPriceBreakdown(tokenConfig, price);
      
    } catch (error) {
      DebugUtils.error('❌ Erro ao calcular preço:', error);
    }
  },

  // Obter configuração do token do formulário
  getTokenConfigFromForm() {
    return {
      customSuffix: document.getElementById('custom-suffix')?.value || '',
      networkId: parseInt(document.getElementById('network-select')?.value) || 56,
      features: this.getSelectedFeatures(),
      verification: document.querySelector('input[name="verification"]:checked')?.value || 'automatic'
    };
  },

  // Obter features selecionadas
  getSelectedFeatures() {
    const features = [];
    const checkboxes = document.querySelectorAll('input[name="contract-features"]:checked');
    checkboxes.forEach(checkbox => {
      features.push(checkbox.value);
    });
    return features;
  },

  // Atualizar breakdown detalhado de preços
  updateDetailedPriceBreakdown(tokenConfig, totalPrice) {
    const breakdownContainer = document.getElementById('price-breakdown');
    if (!breakdownContainer) return;

    const prices = this.currentPrices;
    let breakdown = [];

    // Sufixo
    const suffixType = this.determineSuffixType(tokenConfig.customSuffix);
    const suffixPrice = prices.suffixTypes[suffixType];
    if (suffixPrice > 0) {
      breakdown.push({
        item: `Sufixo (${suffixType})`,
        price: suffixPrice
      });
    }

    // Features
    if (tokenConfig.features.length > 0) {
      tokenConfig.features.forEach(feature => {
        const featurePrice = prices.contractFeatures[feature];
        if (featurePrice > 0) {
          breakdown.push({
            item: `Feature: ${feature}`,
            price: featurePrice
          });
        }
      });
    }

    // Rede
    const networkMultiplier = prices.networkMultiplier[tokenConfig.networkId];
    if (networkMultiplier !== 1.0) {
      breakdown.push({
        item: `Multiplicador de rede (${networkMultiplier}x)`,
        price: 0,
        isMultiplier: true
      });
    }

    // Verificação
    const verificationPrice = prices.verification[tokenConfig.verification];
    if (verificationPrice > 0) {
      breakdown.push({
        item: `Verificação (${tokenConfig.verification})`,
        price: verificationPrice
      });
    }

    // Renderizar breakdown
    this.renderPriceBreakdown(breakdown, totalPrice);
  },

  // Renderizar breakdown de preços
  renderPriceBreakdown(breakdown, totalPrice) {
    const container = document.getElementById('price-breakdown');
    if (!container) return;

    let html = '<div class="price-breakdown-list">';
    
    breakdown.forEach(item => {
      html += `
        <div class="price-item">
          <span class="item-name">${item.item}</span>
          <span class="item-price">
            ${item.isMultiplier ? '' : '+'}${item.price} ${this.paymentToken}
          </span>
        </div>
      `;
    });

    html += `
      <div class="price-total">
        <strong>
          <span>Total:</span>
          <span>${totalPrice} ${this.paymentToken}</span>
        </strong>
      </div>
    </div>`;

    container.innerHTML = html;
  },

  // Validar se usuário pode pagar
  async validatePayment(tokenConfig) {
    const price = this.calculatePrice(tokenConfig);
    
    if (price === 0) {
      return { canPay: true, message: 'Gratuito!' };
    }

    // Verificar saldo do usuário (implementar integração com USDT)
    try {
      const userBalance = await this.getUserUSDTBalance();
      
      if (userBalance >= price) {
        return { 
          canPay: true, 
          message: `Saldo suficiente: ${userBalance} ${this.paymentToken}` 
        };
      } else {
        return { 
          canPay: false, 
          message: `Saldo insuficiente. Necessário: ${price} ${this.paymentToken}` 
        };
      }
    } catch (error) {
      return { 
        canPay: false, 
        message: 'Erro ao verificar saldo' 
      };
    }
  },

  // Obter saldo USDT do usuário
  async getUserUSDTBalance() {
    if (!Web3Manager.userAddress || !Web3Manager.currentNetwork) {
      throw new Error('Usuário não conectado');
    }

    // Endereços USDT por rede
    const usdtAddresses = {
      1: '0xdAC17F958D2ee523a2206206994597C13D831ec7',   // Ethereum
      56: '0x55d398326f99059fF775485246999027B3197955',  // BSC
      137: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // Polygon
      97: '0x7ef95a0FEE0Dd31b22626fA2e10Ee6A223F8a684'   // BSC Testnet
    };

    const usdtAddress = usdtAddresses[Web3Manager.currentNetwork.chainId];
    if (!usdtAddress) return 0;

    // ABI mínimo para balanceOf
    const usdtABI = [
      {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function"
      }
    ];

    const usdtContract = new window.web3.eth.Contract(usdtABI, usdtAddress);
    const balance = await usdtContract.methods.balanceOf(Web3Manager.userAddress).call();
    const decimals = await usdtContract.methods.decimals().call();
    
    return Number(balance) / Math.pow(10, decimals);
  },

  // Processar pagamento
  async processPayment(tokenConfig) {
    const price = this.calculatePrice(tokenConfig);
    
    if (price === 0) {
      return { success: true, message: 'Gratuito - Processando...' };
    }

    try {
      // Implementar transferência USDT
      const txHash = await this.transferUSDT(price);
      
      return {
        success: true,
        txHash: txHash,
        message: 'Pagamento confirmado!'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro no pagamento: ' + error.message
      };
    }
  },

  // Transferir USDT (implementação básica)
  async transferUSDT(amount) {
    // Implementar lógica de transferência USDT
    // Retornar hash da transação
    throw new Error('Implementar transferência USDT');
  }
};

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  PricingManager.init();
});

// Exportar para uso global
window.PricingManager = PricingManager;
