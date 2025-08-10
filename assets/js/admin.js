
// SCCafé - Admin Panel
class AdminPanel {
    constructor() {
        this.currentSection = 'general';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadAdminConfig();
        this.updateUI();
    }

    setupEventListeners() {
        // Menu de navegação
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('href').substring(1);
                this.showSection(section);
            });
        });

        // Color pickers
        document.querySelectorAll('input[type="color"]').forEach(input => {
            input.addEventListener('change', (e) => {
                const hexInput = document.getElementById(e.target.id + 'Hex');
                if (hexInput) {
                    hexInput.value = e.target.value;
                }
                this.updateThemePreview();
            });
        });

        // Hex color inputs
        document.querySelectorAll('input[type="text"][id$="Hex"]').forEach(input => {
            input.addEventListener('input', (e) => {
                const colorInput = document.getElementById(e.target.id.replace('Hex', ''));
                if (colorInput && this.isValidHex(e.target.value)) {
                    colorInput.value = e.target.value;
                    this.updateThemePreview();
                }
            });
        });

        // Service pricing type changes
        document.querySelectorAll('input[name$="Pricing"]').forEach(input => {
            input.addEventListener('change', this.updatePricingDisplay);
        });

        // Network toggles
        document.querySelectorAll('input[id^="network_"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const chainId = e.target.id.replace('network_', '');
                this.toggleNetwork(chainId, e.target.checked);
            });
        });

        // Save buttons
        document.getElementById('saveAllBtn')?.addEventListener('click', () => {
            this.saveAllSettings();
        });

        document.getElementById('resetBtn')?.addEventListener('click', () => {
            this.resetToDefaults();
        });

        // Responsive menu toggle
        const menuToggle = document.querySelector('.mobile-menu-toggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                document.querySelector('.admin-sidebar').classList.toggle('open');
            });
        }
    }

    showSection(sectionId) {
        // Ocultar todas as seções
        document.querySelectorAll('.admin-section').forEach(section => {
            section.style.display = 'none';
        });

        // Mostrar seção atual
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
        }

        // Atualizar menu ativo
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[href="#${sectionId}"]`)?.classList.add('active');

        // Atualizar título
        const titles = {
            general: 'Configurações Gerais',
            theme: 'Tema & Cores',
            services: 'Serviços & Preços',
            networks: 'Redes',
            contracts: 'Contratos',
            stats: 'Estatísticas'
        };
        
        document.getElementById('sectionTitle').textContent = titles[sectionId] || sectionId;
        this.currentSection = sectionId;

        // Ações específicas por seção
        switch (sectionId) {
            case 'theme':
                this.updateThemePreview();
                break;
            case 'stats':
                this.loadStatistics();
                break;
            case 'contracts':
                this.loadDeployedContracts();
                break;
        }
    }

    async loadAdminConfig() {
        try {
            // Carregar do localStorage primeiro
            const localConfig = localStorage.getItem('sccafe-admin-config');
            if (localConfig) {
                const config = JSON.parse(localConfig);
                this.applyConfig(config);
            }

            // Tentar carregar da API
            const serverConfig = await apiClient.loadAdminConfig();
            if (serverConfig) {
                this.applyConfig(serverConfig);
            }
        } catch (error) {
            console.error('Erro ao carregar configuração do admin:', error);
        }
    }

    applyConfig(config) {
        // Configurações gerais
        if (config.general) {
            Object.keys(config.general).forEach(key => {
                const input = document.getElementById(key);
                if (input) {
                    if (input.type === 'checkbox') {
                        input.checked = config.general[key];
                    } else {
                        input.value = config.general[key];
                    }
                }
            });
        }

        // Cores
        if (config.theme) {
            Object.keys(config.theme).forEach(key => {
                const colorInput = document.getElementById(key);
                const hexInput = document.getElementById(key + 'Hex');
                
                if (colorInput) {
                    colorInput.value = config.theme[key];
                }
                if (hexInput) {
                    hexInput.value = config.theme[key];
                }
            });
            this.updateThemePreview();
        }

        // Serviços
        if (config.services) {
            Object.keys(config.services).forEach(serviceId => {
                const service = config.services[serviceId];
                const enabledInput = document.getElementById(serviceId + 'Enabled');
                const priceInput = document.getElementById(serviceId + 'Price');
                const currencyInput = document.getElementById(serviceId + 'Currency');
                const pricingRadios = document.querySelectorAll(`input[name="${serviceId}Pricing"]`);

                if (enabledInput) enabledInput.checked = service.enabled;
                if (priceInput) priceInput.value = service.price;
                if (currencyInput) currencyInput.value = service.currency;
                
                pricingRadios.forEach(radio => {
                    if (radio.value === service.pricingType) {
                        radio.checked = true;
                    }
                });
            });
        }

        // Redes
        if (config.networks) {
            Object.keys(config.networks).forEach(chainId => {
                const network = config.networks[chainId];
                const enabledInput = document.getElementById(`network_${chainId}`);
                const rpcInput = document.getElementById(`rpc_${chainId}`);
                const explorerInput = document.getElementById(`explorer_${chainId}`);
                const factoryInput = document.getElementById(`factory_${chainId}`);

                if (enabledInput) enabledInput.checked = network.enabled;
                if (rpcInput) rpcInput.value = network.rpcUrl;
                if (explorerInput) explorerInput.value = network.explorerUrl;
                if (factoryInput) factoryInput.value = network.factoryContract;
            });
        }
    }

    updateThemePreview() {
        const colors = {
            primary: document.getElementById('primaryColor')?.value || '#D4A574',
            background: document.getElementById('backgroundColor')?.value || '#0A0A0A',
            text: document.getElementById('textColor')?.value || '#FFFFFF',
            textMuted: document.getElementById('mutedTextColor')?.value || '#888888'
        };

        const preview = document.querySelector('.theme-preview');
        if (preview) {
            preview.style.setProperty('--preview-primary', colors.primary);
            preview.style.setProperty('--preview-background', colors.background);
            preview.style.setProperty('--preview-text', colors.text);
            preview.style.setProperty('--preview-text-muted', colors.textMuted);
        }

        // Aplicar no site principal também
        const root = document.documentElement;
        root.style.setProperty('--color-primary', colors.primary);
        root.style.setProperty('--color-background', colors.background);
        root.style.setProperty('--color-text', colors.text);
        root.style.setProperty('--color-text-muted', colors.textMuted);
    }

    updatePricingDisplay() {
        // Atualizar displays de preços baseado no tipo selecionado
        document.querySelectorAll('.service-config').forEach(serviceConfig => {
            const serviceName = serviceConfig.querySelector('h4').textContent;
            const pricingType = serviceConfig.querySelector('input[type="radio"]:checked')?.value;
            const priceInput = serviceConfig.querySelector('input[type="number"]');
            const currencySelect = serviceConfig.querySelector('select');

            if (pricingType === 'percentage') {
                if (priceInput) priceInput.step = '0.01';
                if (currencySelect) currencySelect.style.display = 'none';
            } else {
                if (priceInput) priceInput.step = '0.001';
                if (currencySelect) currencySelect.style.display = 'block';
            }
        });
    }

    toggleNetwork(chainId, enabled) {
        const networkConfig = SCCafe.networks[chainId];
        if (networkConfig) {
            networkConfig.enabled = enabled;
        }
        
        // Atualizar seletor de rede no site principal
        this.updateNetworkSelector();
    }

    updateNetworkSelector() {
        // Esta função seria chamada para atualizar o seletor de rede no site principal
        // quando executando no mesmo contexto
    }

    async saveAllSettings() {
        const config = this.gatherAllSettings();
        
        try {
            // Salvar localmente
            localStorage.setItem('sccafe-admin-config', JSON.stringify(config));
            
            // Aplicar no SCCafe
            this.applyToSCCafe(config);
            
            // Tentar salvar no servidor
            await apiClient.saveAdminConfig(config);
            
            this.showToast('Configurações salvas com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            this.showToast('Erro ao salvar no servidor, mas salvo localmente', 'warning');
        }
    }

    gatherAllSettings() {
        const config = {
            general: {},
            theme: {},
            services: {},
            networks: {}
        };

        // Configurações gerais
        ['platformName', 'defaultLanguage', 'defaultNetwork', 'demoMode', 'apiUrl', 'etherscanKey', 'bscscanKey'].forEach(key => {
            const input = document.getElementById(key);
            if (input) {
                config.general[key] = input.type === 'checkbox' ? input.checked : input.value;
            }
        });

        // Cores
        ['primaryColor', 'backgroundColor', 'textColor', 'mutedTextColor', 'successColor', 'errorColor', 'warningColor', 'infoColor'].forEach(key => {
            const input = document.getElementById(key);
            if (input) {
                config.theme[key] = input.value;
            }
        });

        // Serviços
        ['tokenCreator', 'contractVerifier', 'liquidityPool'].forEach(serviceId => {
            const enabledInput = document.getElementById(serviceId + 'Enabled');
            const priceInput = document.getElementById(serviceId + 'Price');
            const currencyInput = document.getElementById(serviceId + 'Currency');
            const pricingType = document.querySelector(`input[name="${serviceId}Pricing"]:checked`)?.value;

            config.services[serviceId] = {
                enabled: enabledInput?.checked || false,
                price: parseFloat(priceInput?.value || 0),
                currency: currencyInput?.value || 'BNB',
                pricingType: pricingType || 'fixed'
            };
        });

        // Redes
        ['97', '56', '1', '137'].forEach(chainId => {
            const enabledInput = document.getElementById(`network_${chainId}`);
            const rpcInput = document.getElementById(`rpc_${chainId}`);
            const explorerInput = document.getElementById(`explorer_${chainId}`);
            const factoryInput = document.getElementById(`factory_${chainId}`);

            config.networks[chainId] = {
                enabled: enabledInput?.checked || false,
                rpcUrl: rpcInput?.value || '',
                explorerUrl: explorerInput?.value || '',
                factoryContract: factoryInput?.value || ''
            };
        });

        return config;
    }

    applyToSCCafe(config) {
        // Aplicar configurações ao objeto global SCCafe
        if (config.general) {
            Object.assign(SCCafe.config, config.general);
        }
        
        if (config.theme) {
            Object.assign(SCCafe.theme.colors, config.theme);
            SCCafe.utils.applyTheme();
        }
        
        if (config.services) {
            Object.keys(config.services).forEach(serviceId => {
                if (SCCafe.services[serviceId]) {
                    Object.assign(SCCafe.services[serviceId], config.services[serviceId]);
                }
            });
        }
        
        if (config.networks) {
            Object.keys(config.networks).forEach(chainId => {
                if (SCCafe.networks[chainId]) {
                    Object.assign(SCCafe.networks[chainId], config.networks[chainId]);
                }
            });
        }
        
        // Salvar no localStorage do SCCafe
        SCCafe.utils.saveConfig();
    }

    resetToDefaults() {
        if (confirm('Tem certeza que deseja restaurar todas as configurações para os valores padrão?')) {
            localStorage.removeItem('sccafe-admin-config');
            localStorage.removeItem('sccafe-config');
            
            this.showToast('Configurações restauradas para os padrões', 'info');
            setTimeout(() => {
                location.reload();
            }, 1000);
        }
    }

    async loadStatistics() {
        try {
            const stats = await apiClient.getStatistics();
            
            document.getElementById('totalTokens').textContent = stats.totalTokens || '0';
            document.getElementById('totalUsers').textContent = stats.totalUsers || '0';
            document.getElementById('totalRevenue').textContent = (stats.totalRevenue || '0') + ' BNB';
            document.getElementById('totalVerifications').textContent = stats.totalVerifications || '0';
            
            // Atualizar gráfico se necessário
            this.updateUsageChart(stats.usageData);
            
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
            this.showToast('Erro ao carregar estatísticas', 'error');
        }
    }

    updateUsageChart(data) {
        const canvas = document.getElementById('chartCanvas');
        if (!canvas || !data) return;

        const ctx = canvas.getContext('2d');
        
        // Limpar canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Desenhar gráfico simples (substituir por biblioteca de gráficos se necessário)
        ctx.fillStyle = '#D4A574';
        ctx.fillText('Gráfico de uso - Em desenvolvimento', 50, 50);
    }

    async loadDeployedContracts() {
        const container = document.getElementById('deployedContracts');
        if (!container) return;

        try {
            // Carregar contratos do localStorage por enquanto
            const contracts = JSON.parse(localStorage.getItem('deployed-contracts') || '[]');
            
            if (contracts.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i data-lucide="file-code"></i>
                        <p>Nenhum contrato implantado ainda</p>
                    </div>
                `;
                lucide.createIcons();
                return;
            }

            const contractsHtml = contracts.map(contract => `
                <div class="contract-deployment">
                    <div class="contract-info">
                        <h5>${contract.name}</h5>
                        <p>${contract.address}</p>
                        <small>Rede: ${contract.network} | Deploy: ${new Date(contract.timestamp).toLocaleString()}</small>
                    </div>
                    <div class="contract-actions">
                        <button class="btn-outline" onclick="viewOnExplorer('${contract.address}')">
                            <i data-lucide="external-link"></i>
                        </button>
                        <button class="btn-outline" onclick="this.removeContract('${contract.address}')">
                            <i data-lucide="trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');

            container.innerHTML = contractsHtml;
            lucide.createIcons();
            
        } catch (error) {
            console.error('Erro ao carregar contratos:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <p>Erro ao carregar contratos</p>
                </div>
            `;
        }
    }

    async deployContract(type) {
        const sourceCode = document.getElementById(type + 'Contract')?.value;
        if (!sourceCode) {
            this.showToast('Cole o código do contrato primeiro', 'error');
            return;
        }

        try {
            this.showLoading('Fazendo deploy do contrato...');
            
            // Simular deploy (implementar integração real)
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const deployedContract = {
                name: type.charAt(0).toUpperCase() + type.slice(1) + ' Contract',
                address: '0x' + Math.random().toString(16).substr(2, 40),
                network: SCCafe.state.currentNetwork,
                timestamp: Date.now(),
                type: type
            };

            // Salvar contrato
            const contracts = JSON.parse(localStorage.getItem('deployed-contracts') || '[]');
            contracts.push(deployedContract);
            localStorage.setItem('deployed-contracts', JSON.stringify(contracts));

            this.hideLoading();
            this.showToast('Contrato implantado com sucesso!', 'success');
            this.loadDeployedContracts();
            
        } catch (error) {
            this.hideLoading();
            this.showToast('Erro ao fazer deploy do contrato: ' + error.message, 'error');
        }
    }

    async compileContract(type) {
        const sourceCode = document.getElementById(type + 'Contract')?.value;
        if (!sourceCode) {
            this.showToast('Cole o código do contrato primeiro', 'error');
            return;
        }

        try {
            this.showLoading('Compilando contrato...');
            
            const result = await apiClient.compileContract(sourceCode, type);
            
            this.hideLoading();
            
            if (result.success) {
                this.showToast('Contrato compilado com sucesso!', 'success');
                
                // Salvar bytecode compilado
                SCCafe.contracts[type].bytecode = result.bytecode;
                SCCafe.utils.saveConfig();
            } else {
                this.showToast('Erro na compilação: ' + result.error, 'error');
            }
            
        } catch (error) {
            this.hideLoading();
            this.showToast('Erro ao compilar contrato: ' + error.message, 'error');
        }
    }

    removeContract(address) {
        if (confirm('Tem certeza que deseja remover este contrato da lista?')) {
            const contracts = JSON.parse(localStorage.getItem('deployed-contracts') || '[]');
            const filtered = contracts.filter(c => c.address !== address);
            localStorage.setItem('deployed-contracts', JSON.stringify(filtered));
            
            this.loadDeployedContracts();
            this.showToast('Contrato removido da lista', 'info');
        }
    }

    addNewService() {
        const serviceName = prompt('Nome do novo serviço:');
        if (!serviceName) return;

        const serviceId = serviceName.toLowerCase().replace(/\s+/g, '-');
        
        // Adicionar ao SCCafe
        SCCafe.services[serviceId] = {
            name: serviceName,
            description: 'Novo serviço personalizado',
            enabled: true,
            pricingType: 'fixed',
            price: 0.01,
            currency: 'BNB',
            icon: 'star'
        };

        this.showToast('Novo serviço adicionado! Salve as configurações.', 'success');
        this.updateServicesUI();
    }

    addNewNetwork() {
        const networkName = prompt('Nome da nova rede:');
        if (!networkName) return;

        const chainId = prompt('Chain ID:');
        if (!chainId || isNaN(chainId)) return;

        const rpcUrl = prompt('RPC URL:');
        if (!rpcUrl) return;

        // Adicionar ao SCCafe
        SCCafe.networks[chainId] = {
            name: networkName,
            chainId: parseInt(chainId),
            rpcUrl: rpcUrl,
            explorerUrl: '',
            nativeCurrency: {
                name: 'Token',
                symbol: 'TKN',
                decimals: 18
            },
            factoryContract: '',
            enabled: false
        };

        this.showToast('Nova rede adicionada! Configure e salve.', 'success');
        this.updateNetworksUI();
    }

    updateServicesUI() {
        // Recriar interface de serviços
        location.reload(); // Temporário - implementar recriação dinâmica
    }

    updateNetworksUI() {
        // Recriar interface de redes
        location.reload(); // Temporário - implementar recriação dinâmica
    }

    // Métodos utilitários
    isValidHex(hex) {
        return /^#[0-9A-Fa-f]{6}$/.test(hex);
    }

    showLoading(message) {
        // Implementar loading overlay para admin
        console.log('Loading:', message);
    }

    hideLoading() {
        // Esconder loading overlay
        console.log('Loading hidden');
    }

    showToast(message, type) {
        // Criar toast notification
        const toast = document.createElement('div');
        toast.className = `admin-toast ${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            animation: slideIn 0.3s ease;
        `;

        const colors = {
            success: '#10B981',
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#3B82F6'
        };
        
        toast.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }
}

// Funções globais para uso no HTML
function showSection(sectionId) {
    adminPanel.showSection(sectionId);
}

function saveAllSettings() {
    adminPanel.saveAllSettings();
}

function resetToDefaults() {
    adminPanel.resetToDefaults();
}

function deployContract(type) {
    adminPanel.deployContract(type);
}

function compileContract(type) {
    adminPanel.compileContract(type);
}

function addNewService() {
    adminPanel.addNewService();
}

function addNewNetwork() {
    adminPanel.addNewNetwork();
}

// Inicializar Admin Panel
let adminPanel;
document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
});

// Estilo CSS para toast admin
const adminStyles = document.createElement('style');
adminStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .theme-preview {
        --preview-primary: var(--color-primary);
        --preview-background: var(--color-background);
        --preview-text: var(--color-text);
        --preview-text-muted: var(--color-text-muted);
    }
    
    .preview-header span {
        color: var(--preview-primary) !important;
    }
    
    .preview-title {
        color: var(--preview-text) !important;
    }
    
    .preview-text {
        color: var(--preview-text-muted) !important;
    }
    
    .preview-btn.primary {
        background: var(--preview-primary) !important;
        border-color: var(--preview-primary) !important;
    }
    
    .preview-btn.outline {
        color: var(--preview-primary) !important;
        border-color: var(--preview-primary) !important;
    }
`;
document.head.appendChild(adminStyles);

// Funções para Sistema de Cobrança
function exportRevenueReport() {
    const stats = {
        daily: document.getElementById('dailyRevenue')?.textContent || '0.0 BNB',
        weekly: document.getElementById('weeklyRevenue')?.textContent || '0.0 BNB', 
        monthly: document.getElementById('monthlyRevenue')?.textContent || '0.0 BNB',
        total: document.getElementById('totalRevenue')?.textContent || '0.0 BNB',
        contracts: document.getElementById('totalContracts')?.textContent || '0'
    };
    
    const reportContent = `
SCCafé - Relatório de Receitas
===============================
Data: ${new Date().toLocaleDateString('pt-BR')}
Hora: ${new Date().toLocaleTimeString('pt-BR')}

RESUMO FINANCEIRO:
- Receita Hoje: ${stats.daily}
- Receita Semanal: ${stats.weekly}
- Receita Mensal: ${stats.monthly}
- Total Arrecadado: ${stats.total}

ESTATÍSTICAS:
- Contratos Criados: ${stats.contracts}
- Taxa do Sistema: ${document.getElementById('globalFeePercent')?.value || '2.5'}%
- Carteira de Recebimento: ${document.getElementById('feeWalletAddress')?.value || 'Não configurada'}

BREAKDOWN POR SERVIÇO:
- Criação de Tokens: 0.0 BNB (0%)
- Verificação de Contratos: 0.0 BNB (0%)
- Pool de Liquidez: 0.0 BNB (0%)

===============================
Gerado pelo SCCafé Admin Panel
    `;
    
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sccafe-revenue-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showToast('Relatório exportado com sucesso!', 'success');
}

function refreshStats() {
    // Simular carregamento de estatísticas
    showToast('Atualizando estatísticas...', 'info');
    
    setTimeout(() => {
        // Aqui você faria uma chamada real para a API
        // Por agora, vamos simular alguns dados
        const mockData = {
            daily: (Math.random() * 0.1).toFixed(3),
            weekly: (Math.random() * 0.5).toFixed(3),
            monthly: (Math.random() * 2).toFixed(3),
            total: (Math.random() * 10).toFixed(3),
            contracts: Math.floor(Math.random() * 50)
        };
        
        document.getElementById('dailyRevenue').textContent = `${mockData.daily} BNB`;
        document.getElementById('weeklyRevenue').textContent = `${mockData.weekly} BNB`;
        document.getElementById('monthlyRevenue').textContent = `${mockData.monthly} BNB`;
        document.getElementById('totalRevenue').textContent = `${mockData.total} BNB`;
        document.getElementById('totalContracts').textContent = mockData.contracts;
        
        showToast('Estatísticas atualizadas!', 'success');
    }, 1500);
}

function viewTransactionHistory() {
    showToast('Carregando histórico de transações...', 'info');
    // Aqui você implementaria a visualização do histórico
}

// Funções para Verificação Manual de Contratos
function generateVerificationCode() {
    const contractAddress = document.getElementById('contractAddress').value;
    const contractName = document.getElementById('contractName').value;
    const sourceCode = document.getElementById('sourceCode').value;
    const compilerVersion = document.getElementById('compilerVersion').value;
    const optimization = document.getElementById('optimization').value;
    const optimizationRuns = document.getElementById('optimizationRuns').value;
    const constructorArgs = document.getElementById('constructorArgs').value;
    
    if (!contractAddress || !contractName || !sourceCode) {
        showToast('Preencha os campos obrigatórios!', 'error');
        return;
    }
    
    // Validar endereço do contrato
    if (!contractAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        showToast('Endereço do contrato inválido!', 'error');
        return;
    }
    
    // Gerar informações do contrato
    const contractInfo = `Contract Address: ${contractAddress}
Contract Name: ${contractName}
Compiler Version: v${compilerVersion}+commit.73d13a7a
Optimization: ${optimization === 'true' ? 'Yes' : 'No'}
${optimization === 'true' ? `Optimization Runs: ${optimizationRuns}` : ''}
EVM Version: Default
License: MIT`;
    
    // Formatar código fonte
    const formattedSource = sourceCode.trim();
    
    // Configurações do compilador
    const compilerSettings = `{
  "language": "Solidity",
  "sources": {
    "${contractName}.sol": {
      "content": "${sourceCode.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"
    }
  },
  "settings": {
    "optimizer": {
      "enabled": ${optimization},
      ${optimization === 'true' ? `"runs": ${optimizationRuns}` : ''}
    },
    "outputSelection": {
      "*": {
        "*": ["*"]
      }
    }
  }
}`;
    
    // Preencher outputs
    document.getElementById('contractInfo').textContent = contractInfo;
    document.getElementById('formattedSource').textContent = formattedSource;
    document.getElementById('compilerSettings').textContent = compilerSettings;
    
    // Atualizar links de verificação
    const bscLink = `https://testnet.bscscan.com/verifyContract?a=${contractAddress}`;
    const ethLink = `https://etherscan.io/verifyContract?a=${contractAddress}`;
    
    document.getElementById('bscVerifyLink').href = bscLink;
    document.getElementById('ethVerifyLink').href = ethLink;
    
    // Mostrar output
    document.getElementById('verificationOutput').style.display = 'block';
    
    showToast('Código de verificação gerado com sucesso!', 'success');
}

function autoFillFromContract() {
    const contractAddress = document.getElementById('contractAddress').value;
    
    if (!contractAddress) {
        showToast('Informe o endereço do contrato primeiro!', 'error');
        return;
    }
    
    showToast('Buscando informações do contrato...', 'info');
    
    // Simular busca de informações do contrato
    setTimeout(() => {
        // Aqui você faria uma chamada real para a API do BSCScan/Etherscan
        // Por agora, vamos preencher com dados de exemplo
        document.getElementById('contractName').value = 'MyToken';
        document.getElementById('sourceCode').value = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor(string memory name, string memory symbol, uint256 initialSupply) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply * 10**decimals());
    }
}`;
        
        showToast('Informações preenchidas automaticamente!', 'success');
    }, 2000);
}

function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copiado para a área de transferência!', 'success');
    }).catch(() => {
        // Fallback para navegadores antigos
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showToast('Copiado para a área de transferência!', 'success');
        } catch (err) {
            showToast('Erro ao copiar!', 'error');
        }
        document.body.removeChild(textArea);
    });
}

function downloadVerificationPackage() {
    const contractAddress = document.getElementById('contractAddress').value;
    const contractName = document.getElementById('contractName').value;
    
    if (!contractAddress || !contractName) {
        showToast('Gere o código de verificação primeiro!', 'error');
        return;
    }
    
    const packageData = {
        contractInfo: document.getElementById('contractInfo').textContent,
        sourceCode: document.getElementById('formattedSource').textContent,
        compilerSettings: document.getElementById('compilerSettings').textContent,
        links: {
            bsc: document.getElementById('bscVerifyLink').href,
            eth: document.getElementById('ethVerifyLink').href
        }
    };
    
    const blob = new Blob([JSON.stringify(packageData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contractName}-verification-package.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showToast('Pacote de verificação baixado!', 'success');
}

function saveTemplate() {
    const contractName = document.getElementById('contractName').value;
    const sourceCode = document.getElementById('sourceCode').value;
    const compilerVersion = document.getElementById('compilerVersion').value;
    
    if (!contractName || !sourceCode) {
        showToast('Preencha os campos obrigatórios para salvar o template!', 'error');
        return;
    }
    
    const template = {
        name: contractName,
        sourceCode,
        compilerVersion,
        optimization: document.getElementById('optimization').value,
        optimizationRuns: document.getElementById('optimizationRuns').value,
        saved: new Date().toISOString()
    };
    
    // Salvar no localStorage
    let savedTemplates = JSON.parse(localStorage.getItem('sccafe_verification_templates') || '[]');
    savedTemplates.push(template);
    localStorage.setItem('sccafe_verification_templates', JSON.stringify(savedTemplates));
    
    // Atualizar UI
    loadSavedTemplates();
    
    showToast(`Template "${contractName}" salvo com sucesso!`, 'success');
}

function loadSavedTemplates() {
    const templatesContainer = document.getElementById('savedTemplates');
    const savedTemplates = JSON.parse(localStorage.getItem('sccafe_verification_templates') || '[]');
    
    if (savedTemplates.length === 0) {
        templatesContainer.innerHTML = `
            <div class="empty-state">
                <i data-lucide="bookmark"></i>
                <p>Nenhum template salvo ainda</p>
            </div>
        `;
        return;
    }
    
    templatesContainer.innerHTML = savedTemplates.map((template, index) => `
        <div class="template-card">
            <div class="template-header">
                <h4>${template.name}</h4>
                <div class="template-actions">
                    <button class="btn-sm outline" onclick="loadTemplate(${index})">
                        <i data-lucide="upload"></i>
                        Carregar
                    </button>
                    <button class="btn-sm danger" onclick="deleteTemplate(${index})">
                        <i data-lucide="trash-2"></i>
                        Excluir
                    </button>
                </div>
            </div>
            <div class="template-info">
                <small>Compilador: v${template.compilerVersion}</small>
                <small>Salvo em: ${new Date(template.saved).toLocaleDateString('pt-BR')}</small>
            </div>
        </div>
    `).join('');
    
    // Recriar ícones
    lucide.createIcons();
}

function loadTemplate(index) {
    const savedTemplates = JSON.parse(localStorage.getItem('sccafe_verification_templates') || '[]');
    const template = savedTemplates[index];
    
    if (template) {
        document.getElementById('contractName').value = template.name;
        document.getElementById('sourceCode').value = template.sourceCode;
        document.getElementById('compilerVersion').value = template.compilerVersion;
        document.getElementById('optimization').value = template.optimization;
        document.getElementById('optimizationRuns').value = template.optimizationRuns;
        
        showToast(`Template "${template.name}" carregado!`, 'success');
    }
}

function deleteTemplate(index) {
    if (confirm('Tem certeza que deseja excluir este template?')) {
        let savedTemplates = JSON.parse(localStorage.getItem('sccafe_verification_templates') || '[]');
        const templateName = savedTemplates[index].name;
        savedTemplates.splice(index, 1);
        localStorage.setItem('sccafe_verification_templates', JSON.stringify(savedTemplates));
        
        loadSavedTemplates();
        showToast(`Template "${templateName}" excluído!`, 'success');
    }
}

// Carregar templates salvos ao inicializar
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        loadSavedTemplates();
    }, 500);
});
