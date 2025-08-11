
// SCCafé Application Main Script
class SCCafeApp {
    constructor() {
        this.currentSection = 'home';
        this.tokenData = {
            name: '',
            symbol: '',
            totalSupply: 0,
            salt: '',
            desiredPrefix: ''
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadDashboardData();
        this.generateSalt(); // Gerar salt inicial
        
        // Mostrar loading inicialmente
        setTimeout(() => {
            document.getElementById('loadingOverlay').style.display = 'none';
        }, 1000);
    }
    
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('href').replace('#', '');
                this.showSection(section);
            });
        });
        
        // Connect/Disconnect Wallet
        const connectBtn = document.getElementById('connectWallet');
        const disconnectBtn = document.getElementById('disconnectWallet');
        
        if (connectBtn) {
            connectBtn.addEventListener('click', () => {
                window.web3Manager.connectWallet();
            });
        }
        
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', () => {
                window.web3Manager.disconnectWallet();
            });
        }
        
        // Create Token Form
        const createForm = document.getElementById('createTokenForm');
        if (createForm) {
            createForm.addEventListener('submit', this.handleCreateToken.bind(this));
            
            // Real-time form validation
            createForm.addEventListener('input', this.validateForm.bind(this));
        }
        
        // Generate Salt Button
        const generateSaltBtn = document.querySelector('.btn-generate');
        if (generateSaltBtn) {
            generateSaltBtn.addEventListener('click', this.generateSalt.bind(this));
        }
        
        // Calculate Address Button
        const calculateBtn = document.querySelector('[onclick="calculateAddress()"]');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', this.calculateAddress.bind(this));
        }
        
        // Copy buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-copy') || e.target.closest('.btn-copy')) {
                const button = e.target.classList.contains('btn-copy') ? e.target : e.target.closest('.btn-copy');
                const targetId = button.getAttribute('onclick')?.match(/copyToClipboard\('(.+?)'\)/)?.[1];
                if (targetId) {
                    this.copyToClipboard(targetId);
                }
            }
        });
        
        // Refresh tokens
        const refreshBtn = document.querySelector('.btn-refresh');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', this.refreshTokens.bind(this));
        }
    }
    
    showSection(sectionName) {
        // Esconder todas as seções
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Remover active dos links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Mostrar seção ativa
        const targetSection = document.getElementById(sectionName);
        const targetLink = document.querySelector(`[href="#${sectionName}"]`);
        
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionName;
        }
        
        if (targetLink) {
            targetLink.classList.add('active');
        }
        
        // Carregar dados específicos da seção
        if (sectionName === 'dashboard') {
            this.loadDashboardData();
        } else if (sectionName === 'admin') {
            this.loadAdminData();
        }
    }
    
    async handleCreateToken(e) {
        e.preventDefault();
        
        if (!window.web3Manager.isConnected) {
            this.showToast('error', 'Por favor, conecte sua carteira primeiro');
            return;
        }
        
        // Coletar dados do formulário
        const formData = new FormData(e.target);
        const tokenData = {
            name: document.getElementById('tokenName').value,
            symbol: document.getElementById('tokenSymbol').value,
            totalSupply: parseInt(document.getElementById('tokenSupply').value),
            salt: document.getElementById('saltValue').value,
            desiredPrefix: document.getElementById('desiredPrefix').value
        };
        
        // Validar dados
        if (!this.validateTokenData(tokenData)) {
            return;
        }
        
        try {
            // Criar token via Web3Manager
            const result = await window.web3Manager.createToken(tokenData);
            
            if (result) {
                this.showToast('success', 'Token criado com sucesso!');
                
                // Limpar formulário
                e.target.reset();
                this.generateSalt();
                
                // Ir para dashboard
                setTimeout(() => {
                    this.showSection('dashboard');
                }, 2000);
            }
        } catch (error) {
            console.error('Erro ao criar token:', error);
            this.showToast('error', 'Erro ao criar token: ' + error.message);
        }
    }
    
    validateTokenData(tokenData) {
        if (!tokenData.name || tokenData.name.length < 3) {
            this.showToast('error', 'Nome do token deve ter pelo menos 3 caracteres');
            return false;
        }
        
        if (!tokenData.symbol || tokenData.symbol.length < 2 || tokenData.symbol.length > 5) {
            this.showToast('error', 'Símbolo deve ter entre 2 e 5 caracteres');
            return false;
        }
        
        if (!tokenData.totalSupply || tokenData.totalSupply < 1) {
            this.showToast('error', 'Supply total deve ser maior que 0');
            return false;
        }
        
        if (!tokenData.salt) {
            this.showToast('error', 'Salt é obrigatório');
            return false;
        }
        
        return true;
    }
    
    validateForm() {
        const name = document.getElementById('tokenName').value;
        const symbol = document.getElementById('tokenSymbol').value;
        const supply = document.getElementById('tokenSupply').value;
        
        // Atualizar prévia em tempo real
        if (name && symbol && supply) {
            this.updatePreview();
        }
    }
    
    async updatePreview() {
        const tokenData = {
            name: document.getElementById('tokenName').value,
            symbol: document.getElementById('tokenSymbol').value,
            totalSupply: parseInt(document.getElementById('tokenSupply').value),
            salt: document.getElementById('saltValue').value
        };
        
        if (tokenData.salt && tokenData.name && tokenData.symbol) {
            const predictedAddress = await window.web3Manager.computeTokenAddress(tokenData);
            document.getElementById('predictedAddress').textContent = predictedAddress;
        }
    }
    
    generateSalt() {
        const salt = window.web3Manager.generateSalt();
        document.getElementById('saltValue').value = salt;
        this.showToast('success', window.translationManager.translate('salt_generated'));
        
        // Atualizar prévia se outros campos estão preenchidos
        this.updatePreview();
    }
    
    async calculateAddress() {
        const name = document.getElementById('tokenName').value;
        const symbol = document.getElementById('tokenSymbol').value;
        const supply = document.getElementById('tokenSupply').value;
        const salt = document.getElementById('saltValue').value;
        
        if (!name || !symbol || !supply || !salt) {
            this.showToast('error', 'Preencha todos os campos obrigatórios');
            return;
        }
        
        const tokenData = {
            name: name,
            symbol: symbol,
            totalSupply: parseInt(supply),
            salt: salt
        };
        
        try {
            const predictedAddress = await window.web3Manager.computeTokenAddress(tokenData);
            document.getElementById('predictedAddress').textContent = predictedAddress;
            this.showToast('success', window.translationManager.translate('address_calculated'));
        } catch (error) {
            console.error('Erro ao calcular endereço:', error);
            this.showToast('error', 'Erro ao calcular endereço');
        }
    }
    
    copyToClipboard(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            const text = element.textContent;
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('success', window.translationManager.translate('copied_to_clipboard'));
            }).catch(err => {
                console.error('Erro ao copiar:', err);
            });
        }
    }
    
    loadDashboardData() {
        const tokens = window.web3Manager.getUserTokens();
        
        // Atualizar estatísticas
        document.getElementById('totalTokens').textContent = tokens.length;
        document.getElementById('totalValue').textContent = '$' + (tokens.length * 100).toLocaleString();
        document.getElementById('activeContracts').textContent = tokens.filter(t => t.address).length;
        
        // Renderizar lista de tokens
        this.renderTokensList(tokens);
    }
    
    renderTokensList(tokens) {
        const container = document.getElementById('tokensList');
        if (!container) return;
        
        if (tokens.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <i class="fas fa-coins" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p>Nenhum token criado ainda</p>
                    <button class="btn-primary" onclick="window.scCafeApp.showSection('create')" style="margin-top: 1rem;">
                        <i class="fas fa-plus"></i>
                        Criar Primeiro Token
                    </button>
                </div>
            `;
            return;
        }
        
        const tokensHTML = tokens.map(token => `
            <div class="token-card">
                <div class="token-header">
                    <div class="token-info">
                        <h4>${token.name}</h4>
                        <span class="token-symbol">${token.symbol}</span>
                    </div>
                    <div class="token-status">
                        <span class="status-active">Ativo</span>
                    </div>
                </div>
                
                <div class="token-details">
                    <div class="detail-item">
                        <span>Supply:</span>
                        <span>${token.totalSupply.toLocaleString()}</span>
                    </div>
                    <div class="detail-item">
                        <span>Endereço:</span>
                        <span class="address">${this.formatAddress(token.address)}</span>
                    </div>
                    <div class="detail-item">
                        <span>Criado:</span>
                        <span>${new Date(token.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
                
                <div class="token-actions">
                    <button class="btn-view" onclick="window.open('https://testnet.bscscan.com/address/${token.address}', '_blank')">
                        <i class="fas fa-external-link-alt"></i>
                        Ver no Explorer
                    </button>
                    <button class="btn-copy" onclick="window.scCafeApp.copyToClipboard('${token.address}')">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = tokensHTML;
        
        // Adicionar estilos para token cards
        if (!document.getElementById('tokenCardStyles')) {
            const styles = document.createElement('style');
            styles.id = 'tokenCardStyles';
            styles.textContent = `
                .token-card {
                    background: var(--bg-tertiary);
                    border: 1px solid var(--border-primary);
                    border-radius: 0.75rem;
                    padding: 1.5rem;
                    transition: var(--transition);
                }
                
                .token-card:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-md);
                    border-color: var(--accent-primary);
                }
                
                .token-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1rem;
                }
                
                .token-info h4 {
                    margin-bottom: 0.25rem;
                    color: var(--text-primary);
                }
                
                .token-symbol {
                    background: var(--accent-primary);
                    color: var(--bg-primary);
                    padding: 0.25rem 0.5rem;
                    border-radius: 0.25rem;
                    font-size: 0.75rem;
                    font-weight: bold;
                }
                
                .status-active {
                    background: var(--success);
                    color: white;
                    padding: 0.25rem 0.5rem;
                    border-radius: 0.25rem;
                    font-size: 0.75rem;
                }
                
                .token-details {
                    margin-bottom: 1rem;
                }
                
                .detail-item {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.5rem;
                    font-size: 0.875rem;
                }
                
                .detail-item span:first-child {
                    color: var(--text-secondary);
                }
                
                .address {
                    font-family: 'Courier New', monospace;
                    color: var(--accent-primary);
                }
                
                .token-actions {
                    display: flex;
                    gap: 0.5rem;
                }
                
                .btn-view {
                    flex: 1;
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-primary);
                    color: var(--text-primary);
                    padding: 0.5rem 1rem;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.875rem;
                    transition: var(--transition);
                }
                
                .btn-view:hover {
                    border-color: var(--accent-primary);
                    color: var(--accent-primary);
                }
            `;
            document.head.appendChild(styles);
        }
    }
    
    refreshTokens() {
        this.loadDashboardData();
        this.showToast('success', 'Tokens atualizados');
    }
    
    loadAdminData() {
        // Simular dados administrativos
        document.getElementById('totalUsers').textContent = '127';
        document.getElementById('totalDeployments').textContent = '1,234';
        
        const recentActivity = document.getElementById('recentActivity');
        if (recentActivity) {
            recentActivity.innerHTML = `
                <div class="activity-item">
                    <span>Token criado por 0x742d...C7d8</span>
                    <span class="activity-time">2 min atrás</span>
                </div>
                <div class="activity-item">
                    <span>Novo usuário registrado</span>
                    <span class="activity-time">5 min atrás</span>
                </div>
                <div class="activity-item">
                    <span>Deploy realizado com sucesso</span>
                    <span class="activity-time">10 min atrás</span>
                </div>
            `;
            
            // Adicionar estilos para atividades
            if (!document.getElementById('activityStyles')) {
                const styles = document.createElement('style');
                styles.id = 'activityStyles';
                styles.textContent = `
                    .activity-item {
                        display: flex;
                        justify-content: space-between;
                        padding: 0.75rem;
                        background: var(--bg-secondary);
                        border-radius: 0.5rem;
                        margin-bottom: 0.5rem;
                    }
                    
                    .activity-time {
                        color: var(--text-secondary);
                        font-size: 0.75rem;
                    }
                `;
                document.head.appendChild(styles);
            }
        }
    }
    
    formatAddress(address) {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    
    showToast(type, message) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const iconMap = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="toast-icon ${iconMap[type] || iconMap.info}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        // Mostrar toast
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Remover toast após 5 segundos
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 5000);
    }
}

// Funções globais para compatibilidade
window.showSection = (section) => {
    window.scCafeApp.showSection(section);
};

window.generateSalt = () => {
    window.scCafeApp.generateSalt();
};

window.calculateAddress = () => {
    window.scCafeApp.calculateAddress();
};

window.copyToClipboard = (elementId) => {
    window.scCafeApp.copyToClipboard(elementId);
};

window.refreshTokens = () => {
    window.scCafeApp.refreshTokens();
};

window.showToast = (type, message) => {
    window.scCafeApp.showToast(type, message);
};

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', () => {
    window.scCafeApp = new SCCafeApp();
});
