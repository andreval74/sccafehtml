
// Sistema de Tradução Multi-idioma
class TranslationManager {
    constructor() {
        this.currentLanguage = localStorage.getItem('language') || 'pt';
        this.translations = {
            pt: {
                // Navigation
                connect_wallet: 'Conectar Carteira',
                
                // Hero Section
                hero_title: 'Crie Tokens com Endereços',
                hero_subtitle: 'Use a tecnologia CREATE2 para gerar contratos inteligentes com endereços previsíveis e seguros',
                create_token: 'Criar Token',
                view_dashboard: 'Ver Dashboard',
                
                // Features
                security_title: 'Segurança Máxima',
                security_desc: 'Contratos auditados e tecnologia CREATE2 comprovada',
                speed_title: 'Deployment Rápido',
                speed_desc: 'Crie e implemente tokens em segundos',
                custom_title: 'Totalmente Customizável',
                custom_desc: 'Defina nome, símbolo, supply e endereço desejado',
                
                // Dashboard
                dashboard_title: 'Dashboard',
                dashboard_subtitle: 'Visualize e gerencie seus tokens criados',
                total_tokens: 'Tokens Criados',
                total_value: 'Valor Total',
                active_contracts: 'Contratos Ativos',
                my_tokens: 'Meus Tokens',
                
                // Create Token
                create_token_title: 'Criar Novo Token',
                create_token_subtitle: 'Configure seu token personalizado com endereço determinístico',
                token_name: 'Nome do Token:',
                token_symbol: 'Símbolo:',
                token_supply: 'Supply Total:',
                desired_prefix: 'Prefixo Desejado (opcional):',
                prefix_help: 'Deixe vazio para gerar automaticamente',
                salt_value: 'Salt (Valor único):',
                generate: 'Gerar',
                preview: 'Prévia:',
                predicted_address: 'Endereço Previsto:',
                gas_estimate: 'Gas Estimado:',
                calculate_address: 'Calcular Endereço',
                create_deploy: 'Criar & Deploy',
                
                // Admin
                admin_panel: 'Painel Administrativo',
                admin_subtitle: 'Gerenciar sistema e usuários',
                system_stats: 'Estatísticas do Sistema',
                total_users: 'Total de Usuários:',
                total_deployments: 'Total de Deployments:',
                recent_activity: 'Atividade Recente',
                
                // Messages
                wallet_connected: 'Carteira conectada com sucesso!',
                wallet_disconnected: 'Carteira desconectada',
                wallet_not_found: 'MetaMask não encontrado. Por favor, instale a extensão.',
                wrong_network: 'Rede incorreta. Conecte-se à BSC Testnet.',
                transaction_pending: 'Transação pendente...',
                transaction_confirmed: 'Transação confirmada!',
                transaction_failed: 'Transação falhou',
                copied_to_clipboard: 'Copiado para a área de transferência!',
                salt_generated: 'Salt gerado com sucesso',
                address_calculated: 'Endereço calculado'
            },
            
            en: {
                // Navigation
                connect_wallet: 'Connect Wallet',
                
                // Hero Section
                hero_title: 'Create Tokens with',
                hero_subtitle: 'Use CREATE2 technology to generate smart contracts with predictable and secure addresses',
                create_token: 'Create Token',
                view_dashboard: 'View Dashboard',
                
                // Features
                security_title: 'Maximum Security',
                security_desc: 'Audited contracts and proven CREATE2 technology',
                speed_title: 'Fast Deployment',
                speed_desc: 'Create and deploy tokens in seconds',
                custom_title: 'Fully Customizable',
                custom_desc: 'Define name, symbol, supply and desired address',
                
                // Dashboard
                dashboard_title: 'Dashboard',
                dashboard_subtitle: 'View and manage your created tokens',
                total_tokens: 'Tokens Created',
                total_value: 'Total Value',
                active_contracts: 'Active Contracts',
                my_tokens: 'My Tokens',
                
                // Create Token
                create_token_title: 'Create New Token',
                create_token_subtitle: 'Configure your custom token with deterministic address',
                token_name: 'Token Name:',
                token_symbol: 'Symbol:',
                token_supply: 'Total Supply:',
                desired_prefix: 'Desired Prefix (optional):',
                prefix_help: 'Leave empty to generate automatically',
                salt_value: 'Salt (Unique value):',
                generate: 'Generate',
                preview: 'Preview:',
                predicted_address: 'Predicted Address:',
                gas_estimate: 'Gas Estimate:',
                calculate_address: 'Calculate Address',
                create_deploy: 'Create & Deploy',
                
                // Admin
                admin_panel: 'Admin Panel',
                admin_subtitle: 'Manage system and users',
                system_stats: 'System Statistics',
                total_users: 'Total Users:',
                total_deployments: 'Total Deployments:',
                recent_activity: 'Recent Activity',
                
                // Messages
                wallet_connected: 'Wallet connected successfully!',
                wallet_disconnected: 'Wallet disconnected',
                wallet_not_found: 'MetaMask not found. Please install the extension.',
                wrong_network: 'Wrong network. Please connect to BSC Testnet.',
                transaction_pending: 'Transaction pending...',
                transaction_confirmed: 'Transaction confirmed!',
                transaction_failed: 'Transaction failed',
                copied_to_clipboard: 'Copied to clipboard!',
                salt_generated: 'Salt generated successfully',
                address_calculated: 'Address calculated'
            },
            
            zh: {
                // Navigation
                connect_wallet: '连接钱包',
                
                // Hero Section
                hero_title: '创建带有',
                hero_subtitle: '使用 CREATE2 技术生成具有可预测和安全地址的智能合约',
                create_token: '创建代币',
                view_dashboard: '查看仪表板',
                
                // Features
                security_title: '最高安全性',
                security_desc: '经过审计的合约和经过验证的 CREATE2 技术',
                speed_title: '快速部署',
                speed_desc: '在几秒钟内创建和部署代币',
                custom_title: '完全可定制',
                custom_desc: '定义名称、符号、供应量和所需地址',
                
                // Dashboard
                dashboard_title: '仪表板',
                dashboard_subtitle: '查看和管理您创建的代币',
                total_tokens: '已创建代币',
                total_value: '总价值',
                active_contracts: '活跃合约',
                my_tokens: '我的代币',
                
                // Create Token
                create_token_title: '创建新代币',
                create_token_subtitle: '配置具有确定性地址的自定义代币',
                token_name: '代币名称：',
                token_symbol: '符号：',
                token_supply: '总供应量：',
                desired_prefix: '所需前缀（可选）：',
                prefix_help: '留空以自动生成',
                salt_value: 'Salt（唯一值）：',
                generate: '生成',
                preview: '预览：',
                predicted_address: '预测地址：',
                gas_estimate: 'Gas 估算：',
                calculate_address: '计算地址',
                create_deploy: '创建并部署',
                
                // Admin
                admin_panel: '管理面板',
                admin_subtitle: '管理系统和用户',
                system_stats: '系统统计',
                total_users: '总用户数：',
                total_deployments: '总部署数：',
                recent_activity: '最近活动',
                
                // Messages
                wallet_connected: '钱包连接成功！',
                wallet_disconnected: '钱包已断开连接',
                wallet_not_found: '未找到 MetaMask。请安装扩展。',
                wrong_network: '网络错误。请连接到 BSC 测试网。',
                transaction_pending: '交易待处理...',
                transaction_confirmed: '交易已确认！',
                transaction_failed: '交易失败',
                copied_to_clipboard: '已复制到剪贴板！',
                salt_generated: 'Salt 生成成功',
                address_calculated: '地址已计算'
            }
        };
        
        this.init();
    }
    
    init() {
        // Aplicar idioma salvo
        this.applyTranslations();
        
        // Configurar seletor de idioma
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.value = this.currentLanguage;
            languageSelect.addEventListener('change', (e) => {
                this.changeLanguage(e.target.value);
            });
        }
    }
    
    changeLanguage(language) {
        if (this.translations[language]) {
            this.currentLanguage = language;
            localStorage.setItem('language', language);
            this.applyTranslations();
            this.showToast('success', this.translate('language_changed') || 'Language changed successfully!');
        }
    }
    
    translate(key, fallback = null) {
        const translation = this.translations[this.currentLanguage][key];
        return translation || fallback || key;
    }
    
    applyTranslations() {
        const elements = document.querySelectorAll('[data-translate]');
        elements.forEach(element => {
            const key = element.getAttribute('data-translate');
            const translation = this.translate(key);
            element.textContent = translation;
        });
        
        // Atualizar title da página
        if (this.currentLanguage === 'en') {
            document.title = 'SCCafé - Smart Contract Factory';
        } else if (this.currentLanguage === 'zh') {
            document.title = 'SCCafé - 智能合约工厂';
        } else {
            document.title = 'SCCafé - Fábrica de Contratos Inteligentes';
        }
    }
    
    showToast(type, message) {
        // Implementação será feita no app.js
        if (window.showToast) {
            window.showToast(type, message);
        }
    }
}

// Inicializar sistema de tradução
window.translationManager = new TranslationManager();
