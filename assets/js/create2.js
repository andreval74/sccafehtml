/* ===================================
   CREATE2 ADDRESS GENERATOR - SCCAFÉ
   Sistema de endereços personalizados
   =================================== */

const CREATE2Manager = {
  
  factoryAddress: null,
  currentSalt: null,
  predictedAddress: null,
  
  // Inicializar sistema CREATE2
  async init() {
    try {
      this.setupAddressPreview();
      this.setupSuffixValidation();
      DebugUtils.log('✅ CREATE2 Manager inicializado');
    } catch (error) {
      DebugUtils.error('❌ Erro ao inicializar CREATE2 Manager:', error);
    }
  },

  // Configurar preview de endereço em tempo real
  setupAddressPreview() {
    const suffixInput = document.getElementById('custom-suffix');
    const nameInput = document.getElementById('token-name');
    const symbolInput = document.getElementById('token-symbol');
    
    if (suffixInput) {
      suffixInput.addEventListener('input', () => this.updateAddressPreview());
    }
    if (nameInput) {
      nameInput.addEventListener('input', () => this.updateAddressPreview());
    }
    if (symbolInput) {
      symbolInput.addEventListener('input', () => this.updateAddressPreview());
    }
  },

  // Configurar validação de sufixo
  setupSuffixValidation() {
    const suffixInput = document.getElementById('custom-suffix');
    if (!suffixInput) return;

    suffixInput.addEventListener('input', (e) => {
      const value = e.target.value.toUpperCase();
      
      // Permitir apenas A-F e 0-9
      const cleanValue = value.replace(/[^A-F0-9]/g, '');
      
      // Limitar a 4 caracteres
      const limitedValue = cleanValue.substring(0, 4);
      
      e.target.value = limitedValue;
      
      // Validação visual
      this.validateSuffixInput(e.target, limitedValue);
      
      // Atualizar preview
      this.updateAddressPreview();
    });
  },

  // Validar input de sufixo visualmente
  validateSuffixInput(input, value) {
    const isValid = this.isValidSuffix(value);
    
    if (value === '') {
      // Sem sufixo é válido
      input.classList.remove('is-invalid', 'is-valid');
      this.updateSuffixMessage('', 'info');
    } else if (value.toLowerCase() === 'cafe') {
      // Sufixo especial "cafe"
      input.classList.remove('is-invalid');
      input.classList.add('is-valid');
      this.updateSuffixMessage('✅ Sufixo especial "CAFE"', 'success');
    } else if (isValid && value.length === 4) {
      // Sufixo personalizado válido
      input.classList.remove('is-invalid');
      input.classList.add('is-valid');
      this.updateSuffixMessage('✅ Sufixo personalizado válido', 'success');
    } else if (value.length > 0) {
      // Sufixo inválido
      input.classList.remove('is-valid');
      input.classList.add('is-invalid');
      this.updateSuffixMessage('❌ Use apenas A-F e 0-9, 4 caracteres', 'danger');
    }
  },

  // Atualizar mensagem de sufixo
  updateSuffixMessage(message, type) {
    const messageElement = document.getElementById('suffix-message');
    if (!messageElement) return;

    messageElement.textContent = message;
    messageElement.className = `form-text text-${type}`;
  },

  // Validar sufixo
  isValidSuffix(suffix) {
    if (!suffix) return true; // Sem sufixo é válido
    if (suffix.toLowerCase() === 'cafe') return true; // Sufixo especial
    
    // Sufixo personalizado: A-F, 0-9, exatamente 4 caracteres
    const validSuffixRegex = /^[A-Fa-f0-9]{4}$/;
    return validSuffixRegex.test(suffix);
  },

  // Atualizar preview do endereço
  async updateAddressPreview() {
    try {
      const tokenConfig = this.getTokenConfigFromForm();
      
      if (!tokenConfig.name || !tokenConfig.symbol) {
        this.updateAddressDisplay('Configure nome e símbolo primeiro', false);
        return;
      }

      // Verificar se temos factory address para a rede atual
      if (!Web3Manager.currentNetwork?.factoryAddress) {
        this.updateAddressDisplay('Factory não configurada para esta rede', false);
        return;
      }

      // Gerar salt baseado na configuração
      const salt = await this.generateSalt(tokenConfig);
      this.currentSalt = salt;

      // Prever endereço usando CREATE2
      const predictedAddress = await this.predictAddress(tokenConfig, salt);
      this.predictedAddress = predictedAddress;

      // Verificar se o endereço tem o sufixo desejado
      const hasDesiredSuffix = this.checkAddressSuffix(predictedAddress, tokenConfig.customSuffix);
      
      if (hasDesiredSuffix || !tokenConfig.customSuffix) {
        this.updateAddressDisplay(predictedAddress, true);
      } else {
        // Tentar encontrar um salt que gere o sufixo desejado
        await this.findSaltForSuffix(tokenConfig);
      }

    } catch (error) {
      this.updateAddressDisplay('Erro ao gerar endereço: ' + error.message, false);
      DebugUtils.error('❌ Erro ao prever endereço:', error);
    }
  },

  // Obter configuração do token do formulário
  getTokenConfigFromForm() {
    return {
      name: document.getElementById('token-name')?.value || '',
      symbol: document.getElementById('token-symbol')?.value || '',
      totalSupply: document.getElementById('total-supply')?.value || '1000000',
      decimals: document.getElementById('decimals')?.value || '18',
      customSuffix: document.getElementById('custom-suffix')?.value || '',
      owner: Web3Manager.userAddress || '0x0000000000000000000000000000000000000000'
    };
  },

  // Gerar salt baseado na configuração
  async generateSalt(tokenConfig) {
    // Criar string única baseada nos dados do token
    const dataString = `${tokenConfig.name}-${tokenConfig.symbol}-${tokenConfig.owner}-${Date.now()}`;
    
    // Hash da string para criar salt
    const encoder = new TextEncoder();
    const data = encoder.encode(dataString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return '0x' + hashHex;
  },

  // Prever endereço usando CREATE2
  async predictAddress(tokenConfig, salt) {
    try {
      if (!Web3Manager.factoryContract) {
        throw new Error('Factory contract não carregado');
      }

      // Chamar função predictAddress do factory contract
      const predictedAddress = await Web3Manager.factoryContract.methods.predictAddress(
        tokenConfig.name,
        tokenConfig.symbol,
        window.web3.utils.toWei(tokenConfig.totalSupply, 'ether').slice(0, -18 + parseInt(tokenConfig.decimals)),
        salt
      ).call();

      return predictedAddress;
    } catch (error) {
      // Fallback: calcular localmente se possível
      return this.calculateAddressLocally(tokenConfig, salt);
    }
  },

  // Calcular endereço localmente (fallback)
  calculateAddressLocally(tokenConfig, salt) {
    // Implementação simplificada do CREATE2
    // Em produção, usar a mesma lógica do smart contract
    
    const factoryAddress = Web3Manager.currentNetwork.factoryAddress;
    const initCodeHash = this.getInitCodeHash(tokenConfig);
    
    // CREATE2 formula: keccak256(0xff ++ factory ++ salt ++ keccak256(initCode))
    const packed = window.web3.utils.encodePacked(
      '0xff',
      factoryAddress,
      salt,
      initCodeHash
    );
    
    const hash = window.web3.utils.keccak256(packed);
    return '0x' + hash.slice(-40); // Últimos 20 bytes (40 chars hex)
  },

  // Obter hash do init code (simplificado)
  getInitCodeHash(tokenConfig) {
    // Em produção, isso deveria ser o hash real do bytecode + constructor params
    // Por agora, usar um hash fixo baseado nos parâmetros
    const paramsString = `${tokenConfig.name}${tokenConfig.symbol}${tokenConfig.totalSupply}${tokenConfig.decimals}`;
    return window.web3.utils.keccak256(paramsString);
  },

  // Verificar se endereço tem o sufixo desejado
  checkAddressSuffix(address, desiredSuffix) {
    if (!desiredSuffix) return true;
    
    const addressSuffix = address.slice(-desiredSuffix.length).toLowerCase();
    return addressSuffix === desiredSuffix.toLowerCase();
  },

  // Encontrar salt que gere o sufixo desejado
  async findSaltForSuffix(tokenConfig) {
    if (!tokenConfig.customSuffix) return;

    this.updateAddressDisplay('🔍 Procurando endereço com sufixo...', false);

    let attempts = 0;
    const maxAttempts = 1000; // Limitar tentativas

    while (attempts < maxAttempts) {
      try {
        // Gerar novo salt
        const salt = await this.generateSalt({
          ...tokenConfig,
          timestamp: Date.now() + attempts
        });

        // Prever endereço
        const address = await this.predictAddress(tokenConfig, salt);

        // Verificar sufixo
        if (this.checkAddressSuffix(address, tokenConfig.customSuffix)) {
          this.currentSalt = salt;
          this.predictedAddress = address;
          this.updateAddressDisplay(address, true);
          
          DebugUtils.log(`✅ Endereço encontrado após ${attempts + 1} tentativas`);
          return;
        }

        attempts++;
        
        // Atualizar progresso a cada 100 tentativas
        if (attempts % 100 === 0) {
          this.updateAddressDisplay(`🔍 Tentativa ${attempts}/${maxAttempts}...`, false);
        }

      } catch (error) {
        DebugUtils.error('❌ Erro ao procurar sufixo:', error);
        break;
      }
    }

    // Se chegou aqui, não encontrou
    this.updateAddressDisplay(`❌ Sufixo não encontrado após ${maxAttempts} tentativas`, false);
  },

  // Atualizar display do endereço
  updateAddressDisplay(address, isValid) {
    const addressDisplay = document.getElementById('predicted-address');
    const addressStatus = document.getElementById('address-status');
    
    if (addressDisplay) {
      addressDisplay.value = address;
      
      if (isValid) {
        addressDisplay.classList.remove('is-invalid');
        addressDisplay.classList.add('is-valid');
      } else {
        addressDisplay.classList.remove('is-valid');
        addressDisplay.classList.add('is-invalid');
      }
    }

    if (addressStatus) {
      if (isValid) {
        addressStatus.innerHTML = '<i class="bi bi-check-circle text-success"></i> Endereço previsto';
        addressStatus.className = 'form-text text-success';
      } else {
        addressStatus.innerHTML = '<i class="bi bi-exclamation-triangle text-warning"></i> ' + address;
        addressStatus.className = 'form-text text-warning';
      }
    }

    // Atualizar preço quando endereço muda
    if (window.PricingManager) {
      window.PricingManager.updatePriceDisplay();
    }
  },

  // Validar configuração antes do deploy
  validateConfig(tokenConfig) {
    const errors = [];

    // Validar nome
    if (!tokenConfig.name || tokenConfig.name.length < 3) {
      errors.push('Nome do token deve ter pelo menos 3 caracteres');
    }

    // Validar símbolo
    if (!tokenConfig.symbol || tokenConfig.symbol.length < 2) {
      errors.push('Símbolo do token deve ter pelo menos 2 caracteres');
    }

    // Validar sufixo
    if (tokenConfig.customSuffix && !this.isValidSuffix(tokenConfig.customSuffix)) {
      errors.push('Sufixo inválido. Use apenas A-F e 0-9, 4 caracteres');
    }

    // Validar supply
    if (!tokenConfig.totalSupply || parseFloat(tokenConfig.totalSupply) <= 0) {
      errors.push('Supply total deve ser maior que zero');
    }

    // Validar endereço previsto
    if (!this.predictedAddress) {
      errors.push('Endereço não foi gerado. Verifique os dados');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  },

  // Obter dados para deploy
  getDeployData() {
    const tokenConfig = this.getTokenConfigFromForm();
    const validation = this.validateConfig(tokenConfig);

    if (!validation.isValid) {
      throw new Error('Configuração inválida: ' + validation.errors.join(', '));
    }

    return {
      tokenConfig: tokenConfig,
      salt: this.currentSalt,
      predictedAddress: this.predictedAddress,
      factoryAddress: Web3Manager.currentNetwork.factoryAddress
    };
  }
};

// Inicializar quando Web3Manager estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  CREATE2Manager.init();
});

// Exportar para uso global
window.CREATE2Manager = CREATE2Manager;
