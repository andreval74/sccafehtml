/* ===================================
   TOKEN CREATION FACTORY COMPONENT
   Inspirado no 20lab.app
   =================================== */

class TokenCreationFactory {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.formData = {
            // Dados básicos do token
            name: '',
            symbol: '',
            decimals: 18,
            totalSupply: '',
            
            // Configurações do endereço
            addressType: 'none', // 'none', 'cafe', 'custom'
            customPattern: '',
            
            // Features do contrato
            features: {
                mintable: false,
                burnable: false,
                pausable: false,
                taxable: false,
                antibot: false,
                maxwallet: false,
                blacklist: false
            },
            
            // Configurações de taxa (se taxable = true)
            taxConfig: {
                buyTax: 0,
                sellTax: 0,
                marketingWallet: '',
                devWallet: ''
            },
            
            // Configuração de max wallet (se maxwallet = true)
            maxWalletConfig: {
                percentage: 2 // % do supply total
            },
            
            // Verificação
            verification: 'automatic', // 'automatic', 'manual', 'custom'
            
            // Pagamento
            paymentMethod: 'usdt',
            totalPrice: 0
        };
        
        this.predictedAddress = null;
        this.salt = null;
        
        this.init();
    }
    
    init() {
        this.renderFactory();
        this.setupEventListeners();
        this.updateStep();
    }
    
    renderFactory() {
        const container = document.getElementById('tokenFactory');
        if (!container) return;
        
        container.innerHTML = `
            <div class="factory-container">
                <div class="factory-header">
                    <div class="factory-progress">
                        <div class="progress-steps">
                            ${Array.from({length: this.totalSteps}, (_, i) => `
                                <div class="progress-step ${i + 1 <= this.currentStep ? 'active' : ''}" data-step="${i + 1}">
                                    <div class="step-number">${i + 1}</div>
                                    <div class="step-label">${this.getStepLabel(i + 1)}</div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(this.currentStep / this.totalSteps) * 100}%"></div>
                        </div>
                    </div>
                </div>
                
                <div class="factory-content">
                    <div class="factory-steps">
                        ${this.renderStep1()}
                        ${this.renderStep2()}
                        ${this.renderStep3()}
                        ${this.renderStep4()}
                    </div>
                </div>
                
                <div class="factory-footer">
                    <div class="factory-actions">
                        <button class="btn btn-outline" id="prevStep" ${this.currentStep === 1 ? 'disabled' : ''}>
                            <i data-lucide="arrow-left"></i>
                            Anterior
                        </button>
                        
                        <div class="step-info">
                            <span>Passo ${this.currentStep} de ${this.totalSteps}</span>
                        </div>
                        
                        <button class="btn btn-primary" id="nextStep">
                            ${this.currentStep === this.totalSteps ? 'Criar Token' : 'Próximo'}
                            <i data-lucide="${this.currentStep === this.totalSteps ? 'rocket' : 'arrow-right'}"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    getStepLabel(step) {
        const labels = ['Básico', 'Endereço', 'Features', 'Finalizar'];
        return labels[step - 1];
    }
    
    renderStep1() {
        return `
            <div class="factory-step ${this.currentStep === 1 ? 'active' : ''}" data-step="1">
                <div class="step-header">
                    <h2>Informações Básicas</h2>
                    <p>Configure os dados fundamentais do seu token</p>
                </div>
                
                <div class="step-content">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="tokenName">Nome do Token*</label>
                            <input 
                                type="text" 
                                id="tokenName" 
                                placeholder="Ex: Meu Token Incrível"
                                value="${this.formData.name}"
                                maxlength="50"
                                required
                            >
                            <small>Nome completo que aparecerá nas carteiras</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="tokenSymbol">Símbolo*</label>
                            <input 
                                type="text" 
                                id="tokenSymbol" 
                                placeholder="Ex: MTI"
                                value="${this.formData.symbol}"
                                maxlength="10"
                                style="text-transform: uppercase"
                                required
                            >
                            <small>Abreviação de 3-5 caracteres</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="tokenDecimals">Decimais</label>
                            <select id="tokenDecimals">
                                <option value="18" ${this.formData.decimals === 18 ? 'selected' : ''}>18 (Padrão)</option>
                                <option value="9" ${this.formData.decimals === 9 ? 'selected' : ''}>9</option>
                                <option value="6" ${this.formData.decimals === 6 ? 'selected' : ''}>6</option>
                                <option value="0" ${this.formData.decimals === 0 ? 'selected' : ''}>0 (NFT)</option>
                            </select>
                            <small>Casas decimais do token</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="tokenSupply">Supply Total*</label>
                            <input 
                                type="text" 
                                id="tokenSupply" 
                                placeholder="Ex: 1000000"
                                value="${this.formData.totalSupply}"
                                required
                            >
                            <small>Quantidade total de tokens a serem criados</small>
                        </div>
                    </div>
                    
                    <div class="preview-card">
                        <div class="preview-header">
                            <i data-lucide="eye"></i>
                            <span>Preview do Token</span>
                        </div>
                        <div class="preview-content">
                            <div class="token-preview">
                                <div class="token-icon-preview">
                                    <span id="tokenPreviewIcon">${this.formData.symbol.substring(0, 2) || 'MT'}</span>
                                </div>
                                <div class="token-info-preview">
                                    <h4 id="tokenPreviewName">${this.formData.name || 'Nome do Token'}</h4>
                                    <p id="tokenPreviewSymbol">${this.formData.symbol || 'SYMBOL'}</p>
                                    <small id="tokenPreviewSupply">${this.formatSupply(this.formData.totalSupply) || '1,000,000'} tokens</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderStep2() {
        return `
            <div class="factory-step ${this.currentStep === 2 ? 'active' : ''}" data-step="2">
                <div class="step-header">
                    <h2>Endereço Personalizado</h2>
                    <p>Escolha como será o endereço do seu token</p>
                </div>
                
                <div class="step-content">
                    <div class="address-options">
                        <div class="address-option ${this.formData.addressType === 'none' ? 'selected' : ''}" data-type="none">
                            <div class="option-header">
                                <div class="option-radio">
                                    <input type="radio" name="addressType" value="none" ${this.formData.addressType === 'none' ? 'checked' : ''}>
                                </div>
                                <div class="option-info">
                                    <h4>Endereço Padrão</h4>
                                    <p>Endereço aleatório gerado automaticamente</p>
                                    <div class="option-price">GRATUITO</div>
                                </div>
                            </div>
                            <div class="option-example">
                                <code>0x742d35Cc6634C0532925a3b8d8c</code>
                            </div>
                        </div>
                        
                        <div class="address-option ${this.formData.addressType === 'cafe' ? 'selected' : ''}" data-type="cafe">
                            <div class="option-header">
                                <div class="option-radio">
                                    <input type="radio" name="addressType" value="cafe" ${this.formData.addressType === 'cafe' ? 'checked' : ''}>
                                </div>
                                <div class="option-info">
                                    <h4>Endereço "CAFE"</h4>
                                    <p>Endereço terminado com "CAFE"</p>
                                    <div class="option-price">$5.00 USDT</div>
                                </div>
                            </div>
                            <div class="option-example">
                                <code>0x742d35Cc6634C0532925a3bcafe</code>
                            </div>
                        </div>
                        
                        <div class="address-option ${this.formData.addressType === 'custom' ? 'selected' : ''}" data-type="custom">
                            <div class="option-header">
                                <div class="option-radio">
                                    <input type="radio" name="addressType" value="custom" ${this.formData.addressType === 'custom' ? 'checked' : ''}>
                                </div>
                                <div class="option-info">
                                    <h4>Endereço Customizado</h4>
                                    <p>Defina seu próprio padrão (A-F, 0-9)</p>
                                    <div class="option-price">$10.00 USDT</div>
                                </div>
                            </div>
                            <div class="option-custom">
                                <input 
                                    type="text" 
                                    id="customPattern" 
                                    placeholder="Ex: ABCD"
                                    value="${this.formData.customPattern}"
                                    maxlength="8"
                                    style="text-transform: uppercase"
                                    ${this.formData.addressType !== 'custom' ? 'disabled' : ''}
                                >
                                <small>4-8 caracteres (A-F, 0-9)</small>
                            </div>
                        </div>
                    </div>
                    
                    <div class="address-preview">
                        <div class="preview-header">
                            <i data-lucide="target"></i>
                            <span>Preview do Endereço</span>
                        </div>
                        <div class="predicted-address">
                            <code id="predictedAddress">Selecione uma opção acima</code>
                            <button class="btn btn-sm btn-outline" id="regenerateAddress" style="display: none;">
                                <i data-lucide="refresh-cw"></i>
                                Gerar Novo
                            </button>
                        </div>
                        <div class="address-info">
                            <small id="addressInfo">O endereço será gerado quando você configurar as opções</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderStep3() {
        return `
            <div class="factory-step ${this.currentStep === 3 ? 'active' : ''}" data-step="3">
                <div class="step-header">
                    <h2>Features do Contrato</h2>
                    <p>Escolha as funcionalidades avançadas do seu token</p>
                </div>
                
                <div class="step-content">
                    <div class="features-grid">
                        <div class="feature-card ${this.formData.features.mintable ? 'selected' : ''}" data-feature="mintable">
                            <div class="feature-header">
                                <input type="checkbox" id="mintable" ${this.formData.features.mintable ? 'checked' : ''}>
                                <label for="mintable">
                                    <h4>Mintable</h4>
                                    <div class="feature-price">+$2.00</div>
                                </label>
                            </div>
                            <p>Permite criar novos tokens após o deploy</p>
                            <div class="feature-icon">
                                <i data-lucide="plus-circle"></i>
                            </div>
                        </div>
                        
                        <div class="feature-card ${this.formData.features.burnable ? 'selected' : ''}" data-feature="burnable">
                            <div class="feature-header">
                                <input type="checkbox" id="burnable" ${this.formData.features.burnable ? 'checked' : ''}>
                                <label for="burnable">
                                    <h4>Burnable</h4>
                                    <div class="feature-price">+$1.00</div>
                                </label>
                            </div>
                            <p>Permite queimar tokens permanentemente</p>
                            <div class="feature-icon">
                                <i data-lucide="flame"></i>
                            </div>
                        </div>
                        
                        <div class="feature-card ${this.formData.features.pausable ? 'selected' : ''}" data-feature="pausable">
                            <div class="feature-header">
                                <input type="checkbox" id="pausable" ${this.formData.features.pausable ? 'checked' : ''}>
                                <label for="pausable">
                                    <h4>Pausable</h4>
                                    <div class="feature-price">+$1.50</div>
                                </label>
                            </div>
                            <p>Permite pausar todas as transferências</p>
                            <div class="feature-icon">
                                <i data-lucide="pause-circle"></i>
                            </div>
                        </div>
                        
                        <div class="feature-card ${this.formData.features.taxable ? 'selected' : ''}" data-feature="taxable">
                            <div class="feature-header">
                                <input type="checkbox" id="taxable" ${this.formData.features.taxable ? 'checked' : ''}>
                                <label for="taxable">
                                    <h4>Taxable</h4>
                                    <div class="feature-price">+$3.00</div>
                                </label>
                            </div>
                            <p>Taxa automática em compra/venda</p>
                            <div class="feature-icon">
                                <i data-lucide="percent"></i>
                            </div>
                        </div>
                        
                        <div class="feature-card ${this.formData.features.antibot ? 'selected' : ''}" data-feature="antibot">
                            <div class="feature-header">
                                <input type="checkbox" id="antibot" ${this.formData.features.antibot ? 'checked' : ''}>
                                <label for="antibot">
                                    <h4>Anti-Bot</h4>
                                    <div class="feature-price">+$2.50</div>
                                </label>
                            </div>
                            <p>Proteção contra bots e snipers</p>
                            <div class="feature-icon">
                                <i data-lucide="shield"></i>
                            </div>
                        </div>
                        
                        <div class="feature-card ${this.formData.features.maxwallet ? 'selected' : ''}" data-feature="maxwallet">
                            <div class="feature-header">
                                <input type="checkbox" id="maxwallet" ${this.formData.features.maxwallet ? 'checked' : ''}>
                                <label for="maxwallet">
                                    <h4>Max Wallet</h4>
                                    <div class="feature-price">+$1.00</div>
                                </label>
                            </div>
                            <p>Limite máximo por carteira</p>
                            <div class="feature-icon">
                                <i data-lucide="wallet"></i>
                            </div>
                        </div>
                        
                        <div class="feature-card ${this.formData.features.blacklist ? 'selected' : ''}" data-feature="blacklist">
                            <div class="feature-header">
                                <input type="checkbox" id="blacklist" ${this.formData.features.blacklist ? 'checked' : ''}>
                                <label for="blacklist">
                                    <h4>Blacklist</h4>
                                    <div class="feature-price">+$2.00</div>
                                </label>
                            </div>
                            <p>Bloquear endereços específicos</p>
                            <div class="feature-icon">
                                <i data-lucide="user-x"></i>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Configurações condicionais -->
                    <div class="conditional-configs">
                        <div class="config-section ${this.formData.features.taxable ? 'visible' : 'hidden'}" id="taxConfig">
                            <h4>Configuração de Taxas</h4>
                            <div class="config-grid">
                                <div class="form-group">
                                    <label>Taxa de Compra (%)</label>
                                    <input type="number" id="buyTax" min="0" max="25" value="${this.formData.taxConfig.buyTax}">
                                </div>
                                <div class="form-group">
                                    <label>Taxa de Venda (%)</label>
                                    <input type="number" id="sellTax" min="0" max="25" value="${this.formData.taxConfig.sellTax}">
                                </div>
                                <div class="form-group">
                                    <label>Carteira Marketing</label>
                                    <input type="text" id="marketingWallet" placeholder="0x..." value="${this.formData.taxConfig.marketingWallet}">
                                </div>
                                <div class="form-group">
                                    <label>Carteira Dev</label>
                                    <input type="text" id="devWallet" placeholder="0x..." value="${this.formData.taxConfig.devWallet}">
                                </div>
                            </div>
                        </div>
                        
                        <div class="config-section ${this.formData.features.maxwallet ? 'visible' : 'hidden'}" id="maxWalletConfig">
                            <h4>Configuração Max Wallet</h4>
                            <div class="form-group">
                                <label>Percentual do Supply (%)</label>
                                <input type="number" id="maxWalletPercentage" min="0.1" max="100" step="0.1" value="${this.formData.maxWalletConfig.percentage}">
                                <small>% do supply total que cada carteira pode possuir</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderStep4() {
        return `
            <div class="factory-step ${this.currentStep === 4 ? 'active' : ''}" data-step="4">
                <div class="step-header">
                    <h2>Finalizar e Pagar</h2>
                    <p>Revise os dados e efetue o pagamento</p>
                </div>
                
                <div class="step-content">
                    <div class="summary-container">
                        <div class="summary-section">
                            <h4>Resumo do Token</h4>
                            <div class="summary-grid">
                                <div class="summary-item">
                                    <span>Nome:</span>
                                    <strong id="summaryName">${this.formData.name}</strong>
                                </div>
                                <div class="summary-item">
                                    <span>Símbolo:</span>
                                    <strong id="summarySymbol">${this.formData.symbol}</strong>
                                </div>
                                <div class="summary-item">
                                    <span>Supply:</span>
                                    <strong id="summarySupply">${this.formatSupply(this.formData.totalSupply)}</strong>
                                </div>
                                <div class="summary-item">
                                    <span>Endereço:</span>
                                    <strong id="summaryAddress">${this.getAddressTypeLabel()}</strong>
                                </div>
                            </div>
                        </div>
                        
                        <div class="summary-section">
                            <h4>Features Selecionadas</h4>
                            <div class="selected-features" id="selectedFeatures">
                                ${this.renderSelectedFeatures()}
                            </div>
                        </div>
                        
                        <div class="summary-section">
                            <h4>Cálculo do Preço</h4>
                            <div class="price-breakdown">
                                <div class="price-item">
                                    <span>Token Base:</span>
                                    <span>$0.00</span>
                                </div>
                                <div class="price-item">
                                    <span>Endereço Personalizado:</span>
                                    <span id="addressPrice">$${this.getAddressPrice()}</span>
                                </div>
                                <div class="price-item">
                                    <span>Features:</span>
                                    <span id="featuresPrice">$${this.getFeaturesPrice()}</span>
                                </div>
                                <div class="price-item">
                                    <span>Verificação:</span>
                                    <span>$0.00</span>
                                </div>
                                <div class="price-total">
                                    <span>Total:</span>
                                    <strong id="totalPrice">$${this.calculateTotalPrice()}</strong>
                                </div>
                            </div>
                        </div>
                        
                        <div class="payment-section">
                            <h4>Pagamento</h4>
                            <div class="payment-method">
                                <div class="payment-option selected">
                                    <i data-lucide="circle-dollar-sign"></i>
                                    <span>USDT (BSC)</span>
                                </div>
                            </div>
                            
                            <div class="payment-info">
                                <p>O pagamento será processado automaticamente quando você clicar em "Criar Token".</p>
                                <p>Certifique-se de ter USDT suficiente em sua carteira.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    setupEventListeners() {
        // Navegação entre steps
        document.addEventListener('click', (e) => {
            if (e.target.closest('#nextStep')) {
                this.nextStep();
            } else if (e.target.closest('#prevStep')) {
                this.prevStep();
            }
        });
        
        // Inputs do step 1
        document.addEventListener('input', (e) => {
            if (e.target.id === 'tokenName') {
                this.formData.name = e.target.value;
                this.updatePreview();
            } else if (e.target.id === 'tokenSymbol') {
                this.formData.symbol = e.target.value.toUpperCase();
                e.target.value = this.formData.symbol;
                this.updatePreview();
            } else if (e.target.id === 'tokenSupply') {
                this.formData.totalSupply = e.target.value;
                this.updatePreview();
            } else if (e.target.id === 'tokenDecimals') {
                this.formData.decimals = parseInt(e.target.value);
            }
        });
        
        // Opções de endereço
        document.addEventListener('change', (e) => {
            if (e.target.name === 'addressType') {
                this.formData.addressType = e.target.value;
                this.updateAddressOptions();
                this.generateAddress();
            }
        });
        
        // Pattern customizado
        document.addEventListener('input', (e) => {
            if (e.target.id === 'customPattern') {
                this.formData.customPattern = e.target.value.toUpperCase();
                e.target.value = this.formData.customPattern;
                this.generateAddress();
            }
        });
        
        // Features checkboxes
        document.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox' && this.formData.features.hasOwnProperty(e.target.id)) {
                this.formData.features[e.target.id] = e.target.checked;
                this.updateFeatureConfigs();
                this.updatePricing();
            }
        });
    }
    
    updateStep() {
        // Atualizar visualização dos steps
        document.querySelectorAll('.factory-step').forEach((step, index) => {
            step.classList.toggle('active', index + 1 === this.currentStep);
        });
        
        document.querySelectorAll('.progress-step').forEach((step, index) => {
            step.classList.toggle('active', index + 1 <= this.currentStep);
        });
        
        // Atualizar progress bar
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = `${(this.currentStep / this.totalSteps) * 100}%`;
        }
        
        // Atualizar botões
        const prevBtn = document.getElementById('prevStep');
        const nextBtn = document.getElementById('nextStep');
        
        if (prevBtn) prevBtn.disabled = this.currentStep === 1;
        if (nextBtn) {
            nextBtn.textContent = this.currentStep === this.totalSteps ? 'Criar Token' : 'Próximo';
            nextBtn.innerHTML = `
                ${this.currentStep === this.totalSteps ? 'Criar Token' : 'Próximo'}
                <i data-lucide="${this.currentStep === this.totalSteps ? 'rocket' : 'arrow-right'}"></i>
            `;
        }
        
        // Recriar ícones
        lucide.createIcons();
    }
    
    nextStep() {
        if (this.validateCurrentStep()) {
            if (this.currentStep < this.totalSteps) {
                this.currentStep++;
                this.updateStep();
            } else {
                this.createToken();
            }
        }
    }
    
    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStep();
        }
    }
    
    validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                return this.validateStep1();
            case 2:
                return this.validateStep2();
            case 3:
                return this.validateStep3();
            case 4:
                return this.validateStep4();
            default:
                return true;
        }
    }
    
    validateStep1() {
        if (!this.formData.name.trim()) {
            alert('Nome do token é obrigatório');
            return false;
        }
        if (!this.formData.symbol.trim()) {
            alert('Símbolo do token é obrigatório');
            return false;
        }
        if (!this.formData.totalSupply.trim()) {
            alert('Supply total é obrigatório');
            return false;
        }
        return true;
    }
    
    validateStep2() {
        if (this.formData.addressType === 'custom' && !this.formData.customPattern.trim()) {
            alert('Padrão customizado é obrigatório');
            return false;
        }
        return true;
    }
    
    validateStep3() {
        return true; // Features são opcionais
    }
    
    validateStep4() {
        return true; // Validação final será feita no deploy
    }
    
    async createToken() {
        // Implementar criação do token
        console.log('Criando token com dados:', this.formData);
        // Aqui seria chamada a API real
    }
    
    updatePreview() {
        const nameEl = document.getElementById('tokenPreviewName');
        const symbolEl = document.getElementById('tokenPreviewSymbol');
        const supplyEl = document.getElementById('tokenPreviewSupply');
        const iconEl = document.getElementById('tokenPreviewIcon');
        
        if (nameEl) nameEl.textContent = this.formData.name || 'Nome do Token';
        if (symbolEl) symbolEl.textContent = this.formData.symbol || 'SYMBOL';
        if (supplyEl) supplyEl.textContent = `${this.formatSupply(this.formData.totalSupply) || '1,000,000'} tokens`;
        if (iconEl) iconEl.textContent = this.formData.symbol.substring(0, 2) || 'MT';
    }
    
    updateAddressOptions() {
        // Implementar atualização das opções de endereço
        const customInput = document.getElementById('customPattern');
        if (customInput) {
            customInput.disabled = this.formData.addressType !== 'custom';
        }
    }
    
    generateAddress() {
        // Implementar geração do endereço baseado no tipo
        // Esta seria integração com o CREATE2Manager
    }
    
    updateFeatureConfigs() {
        // Mostrar/ocultar configurações condicionais
        const taxConfig = document.getElementById('taxConfig');
        const maxWalletConfig = document.getElementById('maxWalletConfig');
        
        if (taxConfig) {
            taxConfig.classList.toggle('visible', this.formData.features.taxable);
            taxConfig.classList.toggle('hidden', !this.formData.features.taxable);
        }
        
        if (maxWalletConfig) {
            maxWalletConfig.classList.toggle('visible', this.formData.features.maxwallet);
            maxWalletConfig.classList.toggle('hidden', !this.formData.features.maxwallet);
        }
    }
    
    updatePricing() {
        // Atualizar preços em tempo real
        this.formData.totalPrice = this.calculateTotalPrice();
    }
    
    calculateTotalPrice() {
        let total = 0;
        
        // Preço do endereço
        total += this.getAddressPrice();
        
        // Preço das features
        total += this.getFeaturesPrice();
        
        return total.toFixed(2);
    }
    
    getAddressPrice() {
        switch (this.formData.addressType) {
            case 'cafe': return 5.00;
            case 'custom': return 10.00;
            default: return 0.00;
        }
    }
    
    getFeaturesPrice() {
        const prices = {
            mintable: 2.00,
            burnable: 1.00,
            pausable: 1.50,
            taxable: 3.00,
            antibot: 2.50,
            maxwallet: 1.00,
            blacklist: 2.00
        };
        
        return Object.keys(this.formData.features)
            .filter(feature => this.formData.features[feature])
            .reduce((total, feature) => total + (prices[feature] || 0), 0);
    }
    
    getAddressTypeLabel() {
        switch (this.formData.addressType) {
            case 'cafe': return 'Terminado em CAFE';
            case 'custom': return `Terminado em ${this.formData.customPattern}`;
            default: return 'Padrão';
        }
    }
    
    renderSelectedFeatures() {
        const selected = Object.keys(this.formData.features)
            .filter(feature => this.formData.features[feature]);
        
        if (selected.length === 0) {
            return '<p>Nenhuma feature selecionada</p>';
        }
        
        return selected.map(feature => `
            <div class="selected-feature">
                <i data-lucide="check"></i>
                <span>${this.getFeatureLabel(feature)}</span>
            </div>
        `).join('');
    }
    
    getFeatureLabel(feature) {
        const labels = {
            mintable: 'Mintable',
            burnable: 'Burnable',
            pausable: 'Pausable',
            taxable: 'Taxable',
            antibot: 'Anti-Bot',
            maxwallet: 'Max Wallet',
            blacklist: 'Blacklist'
        };
        return labels[feature] || feature;
    }
    
    formatSupply(supply) {
        if (!supply) return '';
        return new Intl.NumberFormat('pt-BR').format(supply);
    }
}

// Exportar para uso global
window.TokenCreationFactory = TokenCreationFactory;
