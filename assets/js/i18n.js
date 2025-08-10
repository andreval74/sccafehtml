
// SCCafé - Sistema de Internacionalização
const i18n = {
    currentLanguage: 'pt',
    
    translations: {
        pt: {
            // Header
            home: 'Início',
            services: 'Serviços',
            dashboard: 'Dashboard',
            admin: 'Admin',
            connectWallet: 'Conectar Carteira',
            
            // Hero Section
            heroTitle: 'Crie Tokens com Endereços Personalizados',
            heroDescription: 'Tecnologia CREATE2 revolucionária para criar tokens com endereços memoráveis e brandáveis',
            createToken: 'Criar Token',
            
            // Services
            servicesTitle: 'Nossos Serviços',
            servicesDescription: 'Escolha o serviço ideal para suas necessidades',
            tokenCreator: 'Criador de Tokens',
            tokenCreatorDesc: 'Crie tokens ERC-20 com endereços personalizados usando CREATE2',
            contractVerifier: 'Verificador de Contratos',
            contractVerifierDesc: 'Verifique contratos automaticamente no explorer da rede',
            liquidityPool: 'Pool de Liquidez',
            liquidityPoolDesc: 'Crie pools de liquidez automaticamente no PancakeSwap',
            selectService: 'Selecionar',
            
            // Token Creation
            createTokenTitle: 'Criar Novo Token',
            createTokenDesc: 'Preencha os dados do seu token',
            tokenName: 'Nome do Token',
            tokenSymbol: 'Símbolo',
            totalSupply: 'Supply Total',
            decimals: 'Decimais',
            customSuffix: 'Sufixo Personalizado',
            suffixNote: 'Apenas caracteres hexadecimais (0-9, A-F)',
            predictedAddress: 'Endereço Previsto:',
            estimatedCost: 'Custo Estimado:',
            cancel: 'Cancelar',
            deployToken: 'Deploy Token',
            
            // Dashboard
            dashboardTitle: 'Meus Tokens',
            refresh: 'Atualizar',
            noTokens: 'Nenhum token encontrado',
            createFirstToken: 'Criar Primeiro Token',
            
            // General
            loading: 'Carregando...',
            success: 'Sucesso!',
            error: 'Erro!',
            warning: 'Aviso!',
            info: 'Informação',
            
            // Networks
            networkBscTestnet: 'BSC Testnet',
            networkBscMainnet: 'BSC Mainnet',
            networkEthereum: 'Ethereum',
            networkPolygon: 'Polygon',
            
            // Messages
            walletConnected: 'Carteira conectada com sucesso!',
            walletDisconnected: 'Carteira desconectada',
            networkChanged: 'Rede alterada',
            tokenCreated: 'Token criado com sucesso!',
            contractVerified: 'Contrato verificado com sucesso!',
            invalidSuffix: 'Sufixo deve conter apenas caracteres hexadecimais (0-9, A-F)',
            connectWalletFirst: 'Conecte sua carteira primeiro',
            unsupportedNetwork: 'Rede não suportada',
            transactionFailed: 'Transação falhou',
            insufficientFunds: 'Saldo insuficiente'
        },
        
        en: {
            // Header
            home: 'Home',
            services: 'Services',
            dashboard: 'Dashboard',
            admin: 'Admin',
            connectWallet: 'Connect Wallet',
            
            // Hero Section
            heroTitle: 'Create Tokens with Custom Addresses',
            heroDescription: 'Revolutionary CREATE2 technology to create tokens with memorable and brandable addresses',
            createToken: 'Create Token',
            
            // Services
            servicesTitle: 'Our Services',
            servicesDescription: 'Choose the ideal service for your needs',
            tokenCreator: 'Token Creator',
            tokenCreatorDesc: 'Create ERC-20 tokens with custom addresses using CREATE2',
            contractVerifier: 'Contract Verifier',
            contractVerifierDesc: 'Automatically verify contracts on the network explorer',
            liquidityPool: 'Liquidity Pool',
            liquidityPoolDesc: 'Automatically create liquidity pools on PancakeSwap',
            selectService: 'Select',
            
            // Token Creation
            createTokenTitle: 'Create New Token',
            createTokenDesc: 'Fill in your token data',
            tokenName: 'Token Name',
            tokenSymbol: 'Symbol',
            totalSupply: 'Total Supply',
            decimals: 'Decimals',
            customSuffix: 'Custom Suffix',
            suffixNote: 'Only hexadecimal characters (0-9, A-F)',
            predictedAddress: 'Predicted Address:',
            estimatedCost: 'Estimated Cost:',
            cancel: 'Cancel',
            deployToken: 'Deploy Token',
            
            // Dashboard
            dashboardTitle: 'My Tokens',
            refresh: 'Refresh',
            noTokens: 'No tokens found',
            createFirstToken: 'Create First Token',
            
            // General
            loading: 'Loading...',
            success: 'Success!',
            error: 'Error!',
            warning: 'Warning!',
            info: 'Information',
            
            // Networks
            networkBscTestnet: 'BSC Testnet',
            networkBscMainnet: 'BSC Mainnet',
            networkEthereum: 'Ethereum',
            networkPolygon: 'Polygon',
            
            // Messages
            walletConnected: 'Wallet connected successfully!',
            walletDisconnected: 'Wallet disconnected',
            networkChanged: 'Network changed',
            tokenCreated: 'Token created successfully!',
            contractVerified: 'Contract verified successfully!',
            invalidSuffix: 'Suffix must contain only hexadecimal characters (0-9, A-F)',
            connectWalletFirst: 'Connect your wallet first',
            unsupportedNetwork: 'Unsupported network',
            transactionFailed: 'Transaction failed',
            insufficientFunds: 'Insufficient funds'
        },
        
        zh: {
            // Header
            home: '首页',
            services: '服务',
            dashboard: '控制台',
            admin: '管理员',
            connectWallet: '连接钱包',
            
            // Hero Section
            heroTitle: '创建自定义地址代币',
            heroDescription: '革命性的CREATE2技术，用于创建具有易记和品牌化地址的代币',
            createToken: '创建代币',
            
            // Services
            servicesTitle: '我们的服务',
            servicesDescription: '选择适合您需求的理想服务',
            tokenCreator: '代币创建器',
            tokenCreatorDesc: '使用CREATE2创建具有自定义地址的ERC-20代币',
            contractVerifier: '合约验证器',
            contractVerifierDesc: '在网络浏览器上自动验证合约',
            liquidityPool: '流动性池',
            liquidityPoolDesc: '在PancakeSwap上自动创建流动性池',
            selectService: '选择',
            
            // Token Creation
            createTokenTitle: '创建新代币',
            createTokenDesc: '填写您的代币数据',
            tokenName: '代币名称',
            tokenSymbol: '符号',
            totalSupply: '总供应量',
            decimals: '小数位',
            customSuffix: '自定义后缀',
            suffixNote: '仅支持十六进制字符(0-9, A-F)',
            predictedAddress: '预测地址:',
            estimatedCost: '预估费用:',
            cancel: '取消',
            deployToken: '部署代币',
            
            // Dashboard
            dashboardTitle: '我的代币',
            refresh: '刷新',
            noTokens: '未找到代币',
            createFirstToken: '创建第一个代币',
            
            // General
            loading: '加载中...',
            success: '成功!',
            error: '错误!',
            warning: '警告!',
            info: '信息',
            
            // Networks
            networkBscTestnet: 'BSC测试网',
            networkBscMainnet: 'BSC主网',
            networkEthereum: '以太坊',
            networkPolygon: 'Polygon',
            
            // Messages
            walletConnected: '钱包连接成功!',
            walletDisconnected: '钱包已断开',
            networkChanged: '网络已更改',
            tokenCreated: '代币创建成功!',
            contractVerified: '合约验证成功!',
            invalidSuffix: '后缀只能包含十六进制字符(0-9, A-F)',
            connectWalletFirst: '请先连接钱包',
            unsupportedNetwork: '不支持的网络',
            transactionFailed: '交易失败',
            insufficientFunds: '余额不足'
        }
    },
    
    // Obter tradução
    t(key, lang = null) {
        const language = lang || this.currentLanguage;
        return this.translations[language]?.[key] || key;
    },
    
    // Definir idioma
    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLanguage = lang;
            SCCafe.state.currentLanguage = lang;
            this.updateUI();
            
            // Salvar preferência
            localStorage.setItem('sccafe-language', lang);
        }
    },
    
    // Atualizar interface com traduções
    updateUI() {
        const elements = document.querySelectorAll('[data-lang]');
        elements.forEach(element => {
            const key = element.getAttribute('data-lang');
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });
        
        // Atualizar seletor de idioma
        const languageSelector = document.getElementById('languageSelector');
        if (languageSelector) {
            languageSelector.value = this.currentLanguage;
        }
    },
    
    // Inicializar sistema de i18n
    init() {
        // Carregar idioma salvo
        const savedLang = localStorage.getItem('sccafe-language');
        if (savedLang && this.translations[savedLang]) {
            this.currentLanguage = savedLang;
            SCCafe.state.currentLanguage = savedLang;
        }
        
        // Configurar event listeners
        document.addEventListener('DOMContentLoaded', () => {
            this.updateUI();
            
            // Listener para seletor de idioma
            const languageSelector = document.getElementById('languageSelector');
            if (languageSelector) {
                languageSelector.value = this.currentLanguage;
                languageSelector.addEventListener('change', (e) => {
                    this.setLanguage(e.target.value);
                });
            }
        });
    }
};

// Inicializar i18n
i18n.init();

// Função global para traduções
function t(key, lang = null) {
    return i18n.t(key, lang);
}
