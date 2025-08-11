/* ===================================
   TOKEN FACTORY MANAGER - SCCAFÉ
   Sistema principal de criação de tokens
   =================================== */

const TokenFactory = {
  
  // Estado atual
  currentStep: 1,
  tokenData: {},
  deploymentData: {},
  
  // Inicializar factory
  async init() {
    try {
      this.setupStepNavigation();
      this.setupFormHandlers();
      this.loadSavedData();
      
      DebugUtils.log('✅ Token Factory inicializado');
    } catch (error) {
      DebugUtils.error('❌ Erro ao inicializar Token Factory:', error);
    }
  },

  // Configurar navegação entre steps
  setupStepNavigation() {
    const nextButtons = document.querySelectorAll('.btn-next-step');
    const prevButtons = document.querySelectorAll('.btn-prev-step');
    
    nextButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const nextStep = parseInt(e.target.dataset.nextStep);
        this.goToStep(nextStep);
      });
    });

    prevButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const prevStep = parseInt(e.target.dataset.prevStep);
        this.goToStep(prevStep);
      });
    });
  },

  // Configurar handlers dos formulários
  setupFormHandlers() {
    // Step 1: Dados básicos do token
    this.setupStep1Handlers();
    
    // Step 2: Personalização CREATE2
    this.setupStep2Handlers();
    
    // Step 3: Features e Preços
    this.setupStep3Handlers();
    
    // Step 4: Deploy e Verificação
    this.setupStep4Handlers();
  },

  // Handlers do Step 1
  setupStep1Handlers() {
    const basicInputs = ['token-name', 'token-symbol', 'total-supply', 'decimals'];
    
    basicInputs.forEach(inputId => {
      const input = document.getElementById(inputId);
      if (input) {
        input.addEventListener('input', () => {
          this.updateTokenData();
          this.validateStep1();
          this.saveProgress();
        });
      }
    });
  },

  // Handlers do Step 2
  setupStep2Handlers() {
    const suffixInput = document.getElementById('custom-suffix');
    if (suffixInput) {
      suffixInput.addEventListener('input', () => {
        this.updateTokenData();
        CREATE2Manager.updateAddressPreview();
        PricingManager.updatePriceDisplay();
        this.saveProgress();
      });
    }

    // Opções de sufixo
    const suffixOptions = document.querySelectorAll('input[name="suffix-type"]');
    suffixOptions.forEach(option => {
      option.addEventListener('change', () => {
        this.handleSuffixTypeChange(option.value);
      });
    });
  },

  // Handlers do Step 3
  setupStep3Handlers() {
    const featureCheckboxes = document.querySelectorAll('input[name="contract-features"]');
    featureCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateTokenData();
        PricingManager.updatePriceDisplay();
        this.saveProgress();
      });
    });

    // Verificação
    const verificationOptions = document.querySelectorAll('input[name="verification-type"]');
    verificationOptions.forEach(option => {
      option.addEventListener('change', () => {
        this.updateTokenData();
        PricingManager.updatePriceDisplay();
        this.saveProgress();
      });
    });
  },

  // Handlers do Step 4
  setupStep4Handlers() {
    const deployBtn = document.getElementById('deploy-token-btn');
    if (deployBtn) {
      deployBtn.addEventListener('click', () => this.handleDeploy());
    }

    const verifyBtn = document.getElementById('verify-contract-btn');
    if (verifyBtn) {
      verifyBtn.addEventListener('click', () => this.handleVerification());
    }
  },

  // Navegar para step específico
  goToStep(stepNumber) {
    if (stepNumber < 1 || stepNumber > 4) return;

    // Validar se pode avançar
    if (stepNumber > this.currentStep && !this.validateCurrentStep()) {
      this.showError('Complete os dados obrigatórios antes de continuar');
      return;
    }

    // Esconder todos os steps
    document.querySelectorAll('.step-content').forEach(step => {
      step.classList.remove('active');
    });

    // Mostrar step alvo
    const targetStep = document.getElementById(`step-${stepNumber}`);
    if (targetStep) {
      targetStep.classList.add('active');
      this.currentStep = stepNumber;
      
      // Atualizar indicadores
      this.updateStepIndicators();
      
      // Executar ações do step
      this.executeStepActions(stepNumber);
    }
  },

  // Atualizar indicadores de progresso
  updateStepIndicators() {
    const indicators = document.querySelectorAll('.step-indicator');
    indicators.forEach((indicator, index) => {
      const stepNum = index + 1;
      
      if (stepNum < this.currentStep) {
        indicator.classList.add('completed');
        indicator.classList.remove('active', 'disabled');
      } else if (stepNum === this.currentStep) {
        indicator.classList.add('active');
        indicator.classList.remove('completed', 'disabled');
      } else {
        indicator.classList.add('disabled');
        indicator.classList.remove('active', 'completed');
      }
    });
  },

  // Executar ações específicas do step
  executeStepActions(stepNumber) {
    switch (stepNumber) {
      case 1:
        this.initStep1();
        break;
      case 2:
        this.initStep2();
        break;
      case 3:
        this.initStep3();
        break;
      case 4:
        this.initStep4();
        break;
    }
  },

  // Inicializar Step 1
  initStep1() {
    const nameInput = document.getElementById('token-name');
    if (nameInput) nameInput.focus();
    
    this.populateStep1FromSaved();
  },

  // Inicializar Step 2
  initStep2() {
    CREATE2Manager.updateAddressPreview();
    this.populateStep2FromSaved();
  },

  // Inicializar Step 3
  initStep3() {
    PricingManager.updatePriceDisplay();
    this.populateStep3FromSaved();
    this.showPricingBreakdown();
  },

  // Inicializar Step 4
  initStep4() {
    this.showDeploymentSummary();
    this.checkPaymentStatus();
  },

  // Atualizar dados do token
  updateTokenData() {
    this.tokenData = {
      name: document.getElementById('token-name')?.value || '',
      symbol: document.getElementById('token-symbol')?.value || '',
      totalSupply: document.getElementById('total-supply')?.value || '',
      decimals: parseInt(document.getElementById('decimals')?.value) || 18,
      customSuffix: document.getElementById('custom-suffix')?.value || '',
      suffixType: this.getSuffixType(),
      features: this.getSelectedFeatures(),
      verification: this.getVerificationType(),
      networkId: Web3Manager.currentNetwork?.chainId || null
    };
  },

  // Obter tipo de sufixo
  getSuffixType() {
    const selected = document.querySelector('input[name="suffix-type"]:checked');
    return selected ? selected.value : 'none';
  },

  // Obter features selecionadas
  getSelectedFeatures() {
    const features = [];
    const checkboxes = document.querySelectorAll('input[name="contract-features"]:checked');
    checkboxes.forEach(checkbox => features.push(checkbox.value));
    return features;
  },

  // Obter tipo de verificação
  getVerificationType() {
    const selected = document.querySelector('input[name="verification-type"]:checked');
    return selected ? selected.value : 'automatic';
  },

  // Validar step atual
  validateCurrentStep() {
    switch (this.currentStep) {
      case 1:
        return this.validateStep1();
      case 2:
        return this.validateStep2();
      case 3:
        return this.validateStep3();
      case 4:
        return true; // Step 4 é sempre válido
      default:
        return false;
    }
  },

  // Validar Step 1
  validateStep1() {
    const errors = [];
    
    if (!this.tokenData.name || this.tokenData.name.length < 3) {
      errors.push('Nome deve ter pelo menos 3 caracteres');
    }
    
    if (!this.tokenData.symbol || this.tokenData.symbol.length < 2) {
      errors.push('Símbolo deve ter pelo menos 2 caracteres');
    }
    
    if (!this.tokenData.totalSupply || parseFloat(this.tokenData.totalSupply) <= 0) {
      errors.push('Supply deve ser maior que zero');
    }

    this.showValidationErrors('step1-errors', errors);
    return errors.length === 0;
  },

  // Validar Step 2
  validateStep2() {
    const errors = [];
    
    if (this.tokenData.customSuffix && !CREATE2Manager.isValidSuffix(this.tokenData.customSuffix)) {
      errors.push('Sufixo inválido. Use apenas A-F e 0-9, 4 caracteres');
    }
    
    if (!CREATE2Manager.predictedAddress) {
      errors.push('Endereço não foi gerado');
    }

    this.showValidationErrors('step2-errors', errors);
    return errors.length === 0;
  },

  // Validar Step 3
  validateStep3() {
    const errors = [];
    
    // Validação será feita quando o usuário tentar prosseguir para pagamento
    
    this.showValidationErrors('step3-errors', errors);
    return errors.length === 0;
  },

  // Mostrar erros de validação
  showValidationErrors(containerId, errors) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (errors.length > 0) {
      container.innerHTML = errors.map(error => 
        `<div class="alert alert-danger alert-sm">${error}</div>`
      ).join('');
      container.style.display = 'block';
    } else {
      container.style.display = 'none';
    }
  },

  // Lidar com mudança de tipo de sufixo
  handleSuffixTypeChange(type) {
    const customSuffixGroup = document.getElementById('custom-suffix-group');
    const suffixInput = document.getElementById('custom-suffix');
    
    if (type === 'custom') {
      customSuffixGroup.style.display = 'block';
      suffixInput.focus();
    } else if (type === 'cafe') {
      customSuffixGroup.style.display = 'none';
      suffixInput.value = 'CAFE';
    } else {
      customSuffixGroup.style.display = 'none';
      suffixInput.value = '';
    }
    
    this.updateTokenData();
    CREATE2Manager.updateAddressPreview();
    PricingManager.updatePriceDisplay();
  },

  // Mostrar resumo de preços
  showPricingBreakdown() {
    const price = PricingManager.calculatePrice(this.tokenData);
    const breakdownContainer = document.getElementById('pricing-breakdown');
    
    if (breakdownContainer) {
      PricingManager.updateDetailedPriceBreakdown(this.tokenData, price);
    }
  },

  // Mostrar resumo do deployment
  showDeploymentSummary() {
    const summaryContainer = document.getElementById('deployment-summary');
    if (!summaryContainer) return;

    const price = PricingManager.calculatePrice(this.tokenData);
    
    summaryContainer.innerHTML = `
      <div class="deployment-summary-card">
        <h5>Resumo do Token</h5>
        
        <div class="summary-row">
          <span>Nome:</span>
          <span>${this.tokenData.name}</span>
        </div>
        
        <div class="summary-row">
          <span>Símbolo:</span>
          <span>${this.tokenData.symbol}</span>
        </div>
        
        <div class="summary-row">
          <span>Supply:</span>
          <span>${this.formatNumber(this.tokenData.totalSupply)}</span>
        </div>
        
        <div class="summary-row">
          <span>Endereço Previsto:</span>
          <span class="address">${CREATE2Manager.predictedAddress || 'Não gerado'}</span>
        </div>
        
        <div class="summary-row">
          <span>Rede:</span>
          <span>${Web3Manager.currentNetwork?.name || 'Não conectado'}</span>
        </div>
        
        <div class="summary-row total">
          <span><strong>Custo Total:</strong></span>
          <span><strong>${price} ${PricingManager.paymentToken}</strong></span>
        </div>
      </div>
    `;
  },

  // Verificar status do pagamento
  async checkPaymentStatus() {
    try {
      const validation = await PricingManager.validatePayment(this.tokenData);
      const statusContainer = document.getElementById('payment-status');
      
      if (statusContainer) {
        if (validation.canPay) {
          statusContainer.innerHTML = `
            <div class="alert alert-success">
              <i class="bi bi-check-circle"></i> ${validation.message}
            </div>
          `;
          this.enableDeployButton();
        } else {
          statusContainer.innerHTML = `
            <div class="alert alert-warning">
              <i class="bi bi-exclamation-triangle"></i> ${validation.message}
            </div>
          `;
          this.disableDeployButton();
        }
      }
    } catch (error) {
      DebugUtils.error('❌ Erro ao verificar pagamento:', error);
    }
  },

  // Habilitar botão de deploy
  enableDeployButton() {
    const deployBtn = document.getElementById('deploy-token-btn');
    if (deployBtn) {
      deployBtn.disabled = false;
      deployBtn.textContent = 'Criar Token';
    }
  },

  // Desabilitar botão de deploy
  disableDeployButton() {
    const deployBtn = document.getElementById('deploy-token-btn');
    if (deployBtn) {
      deployBtn.disabled = true;
      deployBtn.textContent = 'Saldo Insuficiente';
    }
  },

  // Processar deploy
  async handleDeploy() {
    try {
      if (!Web3Manager.userAddress) {
        throw new Error('Conecte sua carteira primeiro');
      }

      LoadingManager.show('Processando criação do token...');

      // 1. Processar pagamento
      const payment = await PricingManager.processPayment(this.tokenData);
      if (!payment.success) {
        throw new Error('Erro no pagamento: ' + payment.message);
      }

      // 2. Fazer deploy
      const deployData = CREATE2Manager.getDeployData();
      const result = await this.deployContract(deployData);

      if (result.success) {
        this.deploymentData = result;
        this.showDeploySuccess();
        this.saveTokenToHistory();
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      DebugUtils.error('❌ Erro no deploy:', error);
      this.showError('Erro no deploy: ' + error.message);
    } finally {
      LoadingManager.hide();
    }
  },

  // Deploy do contrato
  async deployContract(deployData) {
    try {
      // Usar factory contract para criar token
      const tx = await Web3Manager.factoryContract.methods.createToken(
        deployData.tokenConfig.name,
        deployData.tokenConfig.symbol,
        window.web3.utils.toWei(deployData.tokenConfig.totalSupply, 'ether'),
        deployData.salt
      ).send({
        from: Web3Manager.userAddress,
        gas: 2000000
      });

      return {
        success: true,
        address: tx.events.TokenCreated.returnValues.token,
        transactionHash: tx.transactionHash,
        blockNumber: tx.blockNumber
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Mostrar sucesso do deploy
  showDeploySuccess() {
    const successContainer = document.getElementById('deploy-success');
    if (!successContainer) return;

    successContainer.innerHTML = `
      <div class="alert alert-success">
        <h5><i class="bi bi-check-circle"></i> Token Criado com Sucesso!</h5>
        <p><strong>Endereço:</strong> ${this.deploymentData.address}</p>
        <p><strong>Transação:</strong> ${this.deploymentData.transactionHash}</p>
        
        <div class="mt-3">
          <button class="btn btn-primary me-2" onclick="TokenFactory.addToMetaMask()">
            <i class="bi bi-wallet2"></i> Adicionar ao MetaMask
          </button>
          <button class="btn btn-outline-primary" onclick="TokenFactory.viewInExplorer()">
            <i class="bi bi-box-arrow-up-right"></i> Ver no Explorer
          </button>
        </div>
      </div>
    `;

    successContainer.style.display = 'block';
  },

  // Adicionar token ao MetaMask
  async addToMetaMask() {
    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: this.deploymentData.address,
            symbol: this.tokenData.symbol,
            decimals: this.tokenData.decimals
          }
        }
      });
    } catch (error) {
      this.showError('Erro ao adicionar token: ' + error.message);
    }
  },

  // Ver token no explorer
  viewInExplorer() {
    const explorerUrl = `${Web3Manager.currentNetwork.explorer}/address/${this.deploymentData.address}`;
    window.open(explorerUrl, '_blank');
  },

  // Formatar números
  formatNumber(num) {
    return new Intl.NumberFormat().format(num);
  },

  // Salvar progresso
  saveProgress() {
    localStorage.setItem('tokenFactoryData', JSON.stringify({
      currentStep: this.currentStep,
      tokenData: this.tokenData,
      timestamp: Date.now()
    }));
  },

  // Carregar dados salvos
  loadSavedData() {
    try {
      const saved = localStorage.getItem('tokenFactoryData');
      if (saved) {
        const data = JSON.parse(saved);
        
        // Apenas carregar se for recente (menos de 1 hora)
        if (Date.now() - data.timestamp < 3600000) {
          this.tokenData = data.tokenData || {};
          this.currentStep = data.currentStep || 1;
          this.populateFormsFromSaved();
        }
      }
    } catch (error) {
      DebugUtils.error('❌ Erro ao carregar dados salvos:', error);
    }
  },

  // Preencher formulários com dados salvos
  populateFormsFromSaved() {
    if (!this.tokenData) return;

    const fields = {
      'token-name': this.tokenData.name,
      'token-symbol': this.tokenData.symbol,
      'total-supply': this.tokenData.totalSupply,
      'decimals': this.tokenData.decimals,
      'custom-suffix': this.tokenData.customSuffix
    };

    Object.entries(fields).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element && value) {
        element.value = value;
      }
    });
  },

  // Preencher Step 1 com dados salvos
  populateStep1FromSaved() {
    this.populateFormsFromSaved();
  },

  // Preencher Step 2 com dados salvos
  populateStep2FromSaved() {
    if (this.tokenData.suffixType) {
      const radio = document.querySelector(`input[name="suffix-type"][value="${this.tokenData.suffixType}"]`);
      if (radio) radio.checked = true;
    }
  },

  // Preencher Step 3 com dados salvos
  populateStep3FromSaved() {
    if (this.tokenData.features) {
      this.tokenData.features.forEach(feature => {
        const checkbox = document.querySelector(`input[name="contract-features"][value="${feature}"]`);
        if (checkbox) checkbox.checked = true;
      });
    }
    
    if (this.tokenData.verification) {
      const radio = document.querySelector(`input[name="verification-type"][value="${this.tokenData.verification}"]`);
      if (radio) radio.checked = true;
    }
  },

  // Salvar token no histórico
  saveTokenToHistory() {
    try {
      const history = JSON.parse(localStorage.getItem('tokenHistory') || '[]');
      
      history.push({
        ...this.tokenData,
        ...this.deploymentData,
        createdAt: new Date().toISOString(),
        network: Web3Manager.currentNetwork?.name
      });
      
      localStorage.setItem('tokenHistory', JSON.stringify(history));
    } catch (error) {
      DebugUtils.error('❌ Erro ao salvar histórico:', error);
    }
  },

  // Mostrar erro
  showError(message) {
    // Implementar sistema de notificações
    alert('Erro: ' + message);
  },

  // Mostrar sucesso
  showSuccess(message) {
    // Implementar sistema de notificações
    alert('Sucesso: ' + message);
  }
};

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  TokenFactory.init();
});

// Exportar para uso global
window.TokenFactory = TokenFactory;
