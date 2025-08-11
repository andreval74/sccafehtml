/* ===================================
   TOKEN CREATION FACTORY - VERSÃO SIMPLIFICADA
   =================================== */

class TokenCreationFactory {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 3;
        this.formData = {
            name: '',
            symbol: '',
            decimals: 18,
            totalSupply: '',
            ownerAddress: '',
            logoURI: '',
            
            // Simplificado - apenas endereço padrão
            addressType: 'standard',
            
            // Preço fixo
            totalPrice: 0
        };
        
        this.isDeploying = false;
        this.deploymentProgress = {
            step: 0,
            total: 4,
            currentAction: ''
        };
        
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
                    </div>
                </div>
                
                <div class="factory-footer">
                    <div class="factory-actions">
                        <button class="btn btn-outline" id="prevStep" ${this.currentStep === 1 ? 'disabled' : ''}>
                            <i data-lucide="arrow-left"></i>
                            Anterior
                        </button>
                        
                        <div class="actions-right">
                            <button class="btn btn-primary" id="nextStep" ${this.currentStep === this.totalSteps ? 'style="display: none;"' : ''}>
                                Próximo
                                <i data-lucide="arrow-right"></i>
                            </button>
                            
                            <button class="btn btn-success" id="deployToken" ${this.currentStep !== this.totalSteps ? 'style="display: none;"' : ''}>
                                <i data-lucide="rocket"></i>
                                Criar Token
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Deployment Progress -->
            <div id="deploymentProgress" class="deployment-progress" style="display: none;">
                <div class="progress-container">
                    <div class="progress-header">
                        <h3>Criando seu token...</h3>
                        <p id="progressDescription">Iniciando processo...</p>
                    </div>
                    
                    <div class="progress-steps-deploy">
                        <div class="deploy-step" data-step="1">
                            <div class="step-icon">
                                <i data-lucide="file-text"></i>
                            </div>
                            <span>Preparando Contrato</span>
                        </div>
                        <div class="deploy-step" data-step="2">
                            <div class="step-icon">
                                <i data-lucide="settings"></i>
                            </div>
                            <span>Compilando</span>
                        </div>
                        <div class="deploy-step" data-step="3">
                            <div class="step-icon">
                                <i data-lucide="upload"></i>
                            </div>
                            <span>Fazendo Deploy</span>
                        </div>
                        <div class="deploy-step" data-step="4">
                            <div class="step-icon">
                                <i data-lucide="check-circle"></i>
                            </div>
                            <span>Verificando</span>
                        </div>
                    </div>
                    
                    <div class="progress-bar-deploy">
                        <div class="progress-fill-deploy" style="width: 0%"></div>
                    </div>
                    
                    <div class="progress-timer">
                        Tempo estimado: <span id="estimatedTime">2-3 minutos</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderStep1() {
        return `
            <div class="factory-step ${this.currentStep === 1 ? 'active' : ''}" data-step="1">
                <div class="step-header">
                    <h2>Informações Básicas</h2>
                    <p>Configure as informações principais do seu token</p>
                </div>
                
                <div class="step-content">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="tokenName">Nome do Token</label>
                            <input 
                                type="text" 
                                id="tokenName" 
                                placeholder="Ex: Meu Token Incrível"
                                value="${this.formData.name}"
                                required
                            >
                            <small>Nome completo que aparecerá nas carteiras</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="tokenSymbol">Símbolo</label>
                            <input 
                                type="text" 
                                id="tokenSymbol" 
                                placeholder="Ex: MTI"
                                value="${this.formData.symbol}"
                                maxlength="10"
                                style="text-transform: uppercase"
                                required
                            >
                            <small>3-10 caracteres (aparece nas exchanges)</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="tokenDecimals">Casas Decimais</label>
                            <select id="tokenDecimals">
                                <option value="18" ${this.formData.decimals === 18 ? 'selected' : ''}>18 (Padrão)</option>
                                <option value="9" ${this.formData.decimals === 9 ? 'selected' : ''}>9</option>
                                <option value="6" ${this.formData.decimals === 6 ? 'selected' : ''}>6</option>
                                <option value="0" ${this.formData.decimals === 0 ? 'selected' : ''}>0 (NFT)</option>
                            </select>
                            <small>Recomendado: 18 para tokens normais</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="tokenSupply">Supply Total</label>
                            <input 
                                type="number" 
                                id="tokenSupply" 
                                placeholder="Ex: 1000000"
                                value="${this.formData.totalSupply}"
                                min="1"
                                required
                            >
                            <small>Quantidade total de tokens que será criada</small>
                        </div>
                        
                        <div class="form-group full-width">
                            <label for="ownerAddress">Endereço do Proprietário</label>
                            <input 
                                type="text" 
                                id="ownerAddress" 
                                placeholder="0x..."
                                value="${this.formData.ownerAddress}"
                                required
                            >
                            <small>Endereço que receberá todos os tokens (use sua carteira conectada)</small>
                        </div>
                        
                        <div class="form-group full-width">
                            <label for="logoURI">Logo do Token (opcional)</label>
                            <input 
                                type="url" 
                                id="logoURI" 
                                placeholder="https://exemplo.com/logo.png"
                                value="${this.formData.logoURI}"
                            >
                            <small>URL da imagem do logo (PNG, JPG, SVG)</small>
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
                    <h2>Tipo de Endereço</h2>
                    <p>Escolha como será gerado o endereço do seu token</p>
                </div>
                
                <div class="step-content">
                    <div class="address-info-box">
                        <div class="info-icon">
                            <i data-lucide="info"></i>
                        </div>
                        <div class="info-content">
                            <h4>Endereço Padrão Selecionado</h4>
                            <p>Seu token terá um endereço gerado automaticamente de forma segura. O endereço será criado apenas no momento do deploy do contrato.</p>
                        </div>
                    </div>
                    
                    <div class="address-preview-simple">
                        <div class="preview-header">
                            <i data-lucide="shield-check"></i>
                            <span>Processo de Geração</span>
                        </div>
                        <div class="process-steps">
                            <div class="process-step">
                                <div class="step-number">1</div>
                                <div class="step-text">
                                    <strong>Compilação</strong>
                                    <small>Contrato é preparado com seus dados</small>
                                </div>
                            </div>
                            <div class="step-arrow">→</div>
                            <div class="process-step">
                                <div class="step-number">2</div>
                                <div class="step-text">
                                    <strong>Deploy</strong>
                                    <small>Contrato é enviado para a blockchain</small>
                                </div>
                            </div>
                            <div class="step-arrow">→</div>
                            <div class="process-step">
                                <div class="step-number">3</div>
                                <div class="step-text">
                                    <strong>Endereço Final</strong>
                                    <small>Endereço único é gerado automaticamente</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="pricing-info">
                        <div class="price-card">
                            <div class="price-header">
                                <h4>Custo Total</h4>
                                <div class="price-amount">GRATUITO</div>
                            </div>
                            <div class="price-details">
                                <div class="price-item">
                                    <span>Criação do Token</span>
                                    <span>$0.00</span>
                                </div>
                                <div class="price-item">
                                    <span>Endereço Padrão</span>
                                    <span>$0.00</span>
                                </div>
                                <div class="price-item">
                                    <span>Verificação Automática</span>
                                    <span>$0.00</span>
                                </div>
                                <hr>
                                <div class="price-item total">
                                    <span><strong>Total</strong></span>
                                    <span><strong>GRATUITO</strong></span>
                                </div>
                            </div>
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
                    <h2>Resumo e Confirmação</h2>
                    <p>Revise todas as informações antes de criar o token</p>
                </div>
                
                <div class="step-content">
                    <div class="summary-container">
                        <div class="summary-section">
                            <h4>Informações do Token</h4>
                            <div class="summary-grid">
                                <div class="summary-item">
                                    <label>Nome:</label>
                                    <span id="summaryName">${this.formData.name}</span>
                                </div>
                                <div class="summary-item">
                                    <label>Símbolo:</label>
                                    <span id="summarySymbol">${this.formData.symbol}</span>
                                </div>
                                <div class="summary-item">
                                    <label>Decimais:</label>
                                    <span id="summaryDecimals">${this.formData.decimals}</span>
                                </div>
                                <div class="summary-item">
                                    <label>Supply Total:</label>
                                    <span id="summarySupply">${this.formatNumber(this.formData.totalSupply)}</span>
                                </div>
                                <div class="summary-item">
                                    <label>Proprietário:</label>
                                    <span id="summaryOwner">${this.formData.ownerAddress}</span>
                                </div>
                                <div class="summary-item">
                                    <label>Logo:</label>
                                    <span id="summaryLogo">${this.formData.logoURI || 'Não informado'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="summary-section">
                            <h4>Configurações</h4>
                            <div class="summary-grid">
                                <div class="summary-item">
                                    <label>Tipo de Endereço:</label>
                                    <span>Padrão (Gerado automaticamente)</span>
                                </div>
                                <div class="summary-item">
                                    <label>Features:</label>
                                    <span>Contrato ERC-20 Padrão</span>
                                </div>
                                <div class="summary-item">
                                    <label>Verificação:</label>
                                    <span>Automática</span>
                                </div>
                                <div class="summary-item">
                                    <label>Custo Total:</label>
                                    <span class="highlight">GRATUITO</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="summary-section">
                            <h4>Informações Importantes</h4>
                            <div class="info-cards">
                                <div class="info-card">
                                    <i data-lucide="clock"></i>
                                    <div>
                                        <strong>Tempo de Criação</strong>
                                        <small>2-3 minutos em média</small>
                                    </div>
                                </div>
                                <div class="info-card">
                                    <i data-lucide="shield-check"></i>
                                    <div>
                                        <strong>Segurança</strong>
                                        <small>Contrato auditado e verificado</small>
                                    </div>
                                </div>
                                <div class="info-card">
                                    <i data-lucide="link"></i>
                                    <div>
                                        <strong>Padrão ERC-20</strong>
                                        <small>Compatível com todas as carteiras</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    getStepLabel(step) {
        const labels = {
            1: 'Informações',
            2: 'Endereço',
            3: 'Confirmação'
        };
        return labels[step] || '';
    }
    
    setupEventListeners() {
        // Navegação entre steps
        document.getElementById('nextStep')?.addEventListener('click', () => {
            this.nextStep();
        });
        
        document.getElementById('prevStep')?.addEventListener('click', () => {
            this.prevStep();
        });
        
        // Deploy do token
        document.getElementById('deployToken')?.addEventListener('click', () => {
            this.deployToken();
        });
        
        // Inputs do formulário
        this.setupFormListeners();
    }
    
    setupFormListeners() {
        // Step 1 - Informações básicas
        document.getElementById('tokenName')?.addEventListener('input', (e) => {
            this.formData.name = e.target.value;
            this.updateSummary();
        });
        
        document.getElementById('tokenSymbol')?.addEventListener('input', (e) => {
            this.formData.symbol = e.target.value.toUpperCase();
            e.target.value = this.formData.symbol;
            this.updateSummary();
        });
        
        document.getElementById('tokenDecimals')?.addEventListener('change', (e) => {
            this.formData.decimals = parseInt(e.target.value);
            this.updateSummary();
        });
        
        document.getElementById('tokenSupply')?.addEventListener('input', (e) => {
            this.formData.totalSupply = e.target.value;
            this.updateSummary();
        });
        
        document.getElementById('ownerAddress')?.addEventListener('input', (e) => {
            this.formData.ownerAddress = e.target.value;
            this.updateSummary();
        });
        
        document.getElementById('logoURI')?.addEventListener('input', (e) => {
            this.formData.logoURI = e.target.value;
            this.updateSummary();
        });
    }
    
    nextStep() {
        if (this.currentStep < this.totalSteps && this.validateCurrentStep()) {
            this.currentStep++;
            this.updateStep();
        }
    }
    
    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStep();
        }
    }
    
    updateStep() {
        // Atualizar progress bar
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = `${(this.currentStep / this.totalSteps) * 100}%`;
        }
        
        // Atualizar steps ativos
        document.querySelectorAll('.progress-step').forEach((step, index) => {
            if (index + 1 <= this.currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
        
        // Mostrar/ocultar steps
        document.querySelectorAll('.factory-step').forEach((step, index) => {
            if (index + 1 === this.currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
        
        // Atualizar botões
        const prevBtn = document.getElementById('prevStep');
        const nextBtn = document.getElementById('nextStep');
        const deployBtn = document.getElementById('deployToken');
        
        if (prevBtn) prevBtn.disabled = this.currentStep === 1;
        
        if (nextBtn && deployBtn) {
            if (this.currentStep === this.totalSteps) {
                nextBtn.style.display = 'none';
                deployBtn.style.display = 'inline-flex';
            } else {
                nextBtn.style.display = 'inline-flex';
                deployBtn.style.display = 'none';
            }
        }
        
        // Atualizar resumo se estiver no step 3
        if (this.currentStep === 3) {
            this.updateSummary();
        }
        
        // Auto-fill owner address com carteira conectada
        if (this.currentStep === 1 && window.userAddress && !this.formData.ownerAddress) {
            this.formData.ownerAddress = window.userAddress;
            const ownerInput = document.getElementById('ownerAddress');
            if (ownerInput) ownerInput.value = this.formData.ownerAddress;
        }
        
        // Re-render icons
        setTimeout(() => {
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }, 100);
    }
    
    validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                if (!this.formData.name || !this.formData.symbol || !this.formData.totalSupply || !this.formData.ownerAddress) {
                    this.showToast('Preencha todos os campos obrigatórios', 'error');
                    return false;
                }
                
                if (!/^0x[a-fA-F0-9]{40}$/.test(this.formData.ownerAddress)) {
                    this.showToast('Endereço do proprietário inválido', 'error');
                    return false;
                }
                
                return true;
                
            case 2:
                return true;
                
            case 3:
                return true;
                
            default:
                return true;
        }
    }
    
    updateSummary() {
        // Atualizar elementos do resumo
        const updates = {
            'summaryName': this.formData.name,
            'summarySymbol': this.formData.symbol,
            'summaryDecimals': this.formData.decimals,
            'summarySupply': this.formatNumber(this.formData.totalSupply),
            'summaryOwner': this.formData.ownerAddress,
            'summaryLogo': this.formData.logoURI || 'Não informado'
        };
        
        Object.entries(updates).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }
    
    async deployToken() {
        if (this.isDeploying) return;
        
        try {
            this.isDeploying = true;
            this.showDeploymentProgress();
            
            // Simular processo de deploy
            await this.simulateDeployment();
            
        } catch (error) {
            console.error('Erro no deploy:', error);
            this.showToast('Erro ao criar token: ' + error.message, 'error');
            this.hideDeploymentProgress();
        } finally {
            this.isDeploying = false;
        }
    }
    
    async simulateDeployment() {
        const steps = [
            { action: 'Preparando contrato base...', duration: 2000 },
            { action: 'Compilando contrato...', duration: 3000 },
            { action: 'Fazendo deploy na blockchain...', duration: 4000 },
            { action: 'Verificando contrato...', duration: 2000 }
        ];
        
        for (let i = 0; i < steps.length; i++) {
            this.updateDeploymentProgress(i + 1, steps[i].action);
            await this.delay(steps[i].duration);
        }
        
        // Simular endereço gerado
        const mockAddress = '0x' + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('');
        
        this.showSuccessResult(mockAddress);
    }
    
    showDeploymentProgress() {
        document.querySelector('.factory-container').style.display = 'none';
        document.getElementById('deploymentProgress').style.display = 'block';
    }
    
    hideDeploymentProgress() {
        document.querySelector('.factory-container').style.display = 'block';
        document.getElementById('deploymentProgress').style.display = 'none';
    }
    
    updateDeploymentProgress(step, action) {
        // Atualizar progress bar
        const progress = (step / 4) * 100;
        const progressFill = document.querySelector('.progress-fill-deploy');
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
        
        // Atualizar descrição
        const description = document.getElementById('progressDescription');
        if (description) {
            description.textContent = action;
        }
        
        // Atualizar steps visuais
        document.querySelectorAll('.deploy-step').forEach((stepEl, index) => {
            if (index + 1 <= step) {
                stepEl.classList.add('active');
            }
            if (index + 1 === step) {
                stepEl.classList.add('current');
            } else {
                stepEl.classList.remove('current');
            }
        });
    }
    
    showSuccessResult(contractAddress) {
        const container = document.getElementById('deploymentProgress');
        container.innerHTML = `
            <div class="success-container">
                <div class="success-header">
                    <div class="success-icon">
                        <i data-lucide="check-circle"></i>
                    </div>
                    <h2>Token Criado com Sucesso!</h2>
                    <p>Seu token foi criado e está disponível na blockchain</p>
                </div>
                
                <div class="success-details">
                    <div class="token-info">
                        <h3>${this.formData.name} (${this.formData.symbol})</h3>
                        <div class="token-stats">
                            <div class="stat">
                                <label>Supply:</label>
                                <span>${this.formatNumber(this.formData.totalSupply)}</span>
                            </div>
                            <div class="stat">
                                <label>Decimais:</label>
                                <span>${this.formData.decimals}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="contract-info">
                        <div class="contract-address">
                            <label>Endereço do Contrato:</label>
                            <div class="address-display">
                                <code id="contractAddress">${contractAddress}</code>
                                <button class="btn btn-sm btn-outline" onclick="navigator.clipboard.writeText('${contractAddress}')">
                                    <i data-lucide="copy"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="success-actions">
                        <button class="btn btn-primary" onclick="window.open('https://testnet.bscscan.com/address/${contractAddress}', '_blank')">
                            <i data-lucide="external-link"></i>
                            Ver no BSCScan
                        </button>
                        <button class="btn btn-success" onclick="window.tokenFactory?.addToWallet?.('${contractAddress}')">
                            <i data-lucide="plus"></i>
                            Adicionar à Carteira
                        </button>
                        <button class="btn btn-outline" onclick="window.location.href='dashboard.html'">
                            <i data-lucide="bar-chart-3"></i>
                            Ir para Dashboard
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        setTimeout(() => {
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }, 100);
    }
    
    // Método para adicionar token à carteira
    async addToWallet(contractAddress) {
        try {
            if (!window.ethereum) {
                this.showToast('MetaMask não encontrado', 'error');
                return;
            }
            
            await window.ethereum.request({
                method: 'wallet_watchAsset',
                params: {
                    type: 'ERC20',
                    options: {
                        address: contractAddress,
                        symbol: this.formData.symbol,
                        decimals: this.formData.decimals,
                        image: this.formData.logoURI || ''
                    }
                }
            });
            
            this.showToast('Token adicionado à carteira!', 'success');
        } catch (error) {
            console.error('Erro ao adicionar token:', error);
            this.showToast('Erro ao adicionar token à carteira', 'error');
        }
    }
    
    formatNumber(num) {
        if (!num) return '0';
        return parseInt(num).toLocaleString();
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    showToast(message, type = 'info') {
        // Implementar sistema de toast
        console.log(`Toast [${type}]:`, message);
        
        // Toast simples
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
            color: white;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Disponibilizar globalmente
window.TokenCreationFactory = TokenCreationFactory;
