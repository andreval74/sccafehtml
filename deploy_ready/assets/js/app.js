
/* ===================================
   APLICAÇÃO PRINCIPAL - SCCAFÉ
   Inicialização e coordenação geral
   =================================== */

// Gerenciador principal da aplicação
const App = {
  
  // Estado de inicialização
  initialized: false,
  startTime: Date.now(),
  
  // Inicializar aplicação
  async init() {
    try {
      DebugUtils.log('🚀 Iniciando SCCafé v' + APP_CONFIG.version);
      
      // Mostrar loading
      LoadingManager.show('Inicializando aplicação...');
      
      // Carregar componentes sequencialmente
      await this.loadComponents();
      
      // Inicializar sistemas
      await this.initializeSystems();
      
      // Aplicar configurações
      this.applyConfigurations();
      
      // Marcar como inicializado
      this.initialized = true;
      
      // Esconder loading
      setTimeout(() => {
        LoadingManager.hide();
        this.showWelcomeMessage();
      }, 1500);
      
      DebugUtils.log('✅ SCCafé inicializado com sucesso em', Date.now() - this.startTime + 'ms');
      
    } catch (error) {
      DebugUtils.error('❌ Erro ao inicializar aplicação:', error);
      this.handleInitError(error);
    }
  },
  
  // Carregar componentes
  async loadComponents() {
    DebugUtils.log('📦 Carregando componentes...');
    
    // Carregar includes (header, footer)
    await loadIncludes();
    
    // Inicializar componentes interativos
    initializeComponents();
    
    DebugUtils.log('✅ Componentes carregados');
  },
  
  // Inicializar sistemas
  async initializeSystems() {
    DebugUtils.log('⚙️ Inicializando sistemas...');
    
    // Web3 já é inicializado automaticamente
    // Outros sistemas podem ser adicionados aqui
    
    DebugUtils.log('✅ Sistemas inicializados');
  },
  
  // Aplicar configurações
  applyConfigurations() {
    DebugUtils.log('🎨 Aplicando configurações...');
    
    // Aplicar tema
    this.applyTheme();
    
    // Configurar comportamentos globais
    this.setupGlobalBehaviors();
    
    DebugUtils.log('✅ Configurações aplicadas');
  },
  
  // Aplicar tema
  applyTheme() {
    const root = document.documentElement;
    const colors = APP_CONFIG.theme.colors;
    
    // Aplicar variáveis CSS
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value);
    });
    
    // Adicionar classe do tema
    document.body.classList.add('sccafe-theme');
  },
  
  // Configurar comportamentos globais
  setupGlobalBehaviors() {
    
    // Capturar erros globais
    window.addEventListener('error', (event) => {
      DebugUtils.error('Erro global capturado:', event.error);
      NotificationUtils.error('Ocorreu um erro inesperado');
    });
    
    // Capturar erros de promise não tratadas
    window.addEventListener('unhandledrejection', (event) => {
      DebugUtils.error('Promise rejeitada:', event.reason);
      NotificationUtils.error('Erro de conexão ou processamento');
      event.preventDefault();
    });
    
    // Listener para mudanças de visibilidade da página
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // Página voltou a ficar visível
        this.onPageVisible();
      } else {
        // Página ficou oculta
        this.onPageHidden();
      }
    });
    
    // Listener para redimensionamento da janela
    window.addEventListener('resize', TimingUtils.debounce(() => {
      this.onWindowResize();
    }, 250));
    
    // Listener para scroll (para animações)
    window.addEventListener('scroll', TimingUtils.throttle(() => {
      this.onScroll();
    }, 16)); // ~60fps
  },
  
  // Página ficou visível
  onPageVisible() {
    DebugUtils.log('👁️ Página visível');
    
    // Verificar conexão Web3 se conectada
    if (APP_STATE.connected) {
      Web3Manager.checkConnection();
    }
  },
  
  // Página ficou oculta
  onPageHidden() {
    DebugUtils.log('🙈 Página oculta');
  },
  
  // Janela redimensionada
  onWindowResize() {
    // Reajustar componentes se necessário
    const width = window.innerWidth;
    
    if (width < 768) {
      document.body.classList.add('mobile');
    } else {
      document.body.classList.remove('mobile');
    }
  },
  
  // Evento de scroll
  onScroll() {
    const scrollY = window.scrollY;
    
    // Efeito parallax no hero
    const heroParticles = DOMUtils.$('.hero-particles');
    if (heroParticles) {
      heroParticles.style.transform = `translateY(${scrollY * 0.5}px)`;
    }
    
    // Header transparente/sólido
    const header = DOMUtils.$('.header');
    if (header) {
      if (scrollY > 100) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
  },
  
  // Mostrar mensagem de boas-vindas
  showWelcomeMessage() {
    // Verificar se é primeira visita
    const isFirstVisit = !ConfigUtils.loadConfig('visited');
    
    if (isFirstVisit) {
      ConfigUtils.saveConfig('visited', true);
      
      setTimeout(() => {
        NotificationUtils.info(
          '🎉 Bem-vindo ao SCCafé! Crie tokens com endereços personalizados usando CREATE2.',
          8000
        );
      }, 2000);
    }
  },
  
  // Lidar com erro de inicialização
  handleInitError(error) {
    LoadingManager.hide();
    
    // Mostrar erro na tela
    const errorHtml = `
      <div class="error-screen">
        <div class="error-content">
          <div class="error-icon">
            <i data-lucide="alert-triangle"></i>
          </div>
          <h2>Erro na Inicialização</h2>
          <p>Ocorreu um erro ao carregar a aplicação:</p>
          <pre>${error.message}</pre>
          <button onclick="location.reload()" class="btn btn-primary">
            <i data-lucide="refresh-cw"></i>
            Tentar Novamente
          </button>
        </div>
      </div>
    `;
    
    document.body.innerHTML = errorHtml;
    lucide.createIcons();
  },
  
  // Informações de depuração
  getDebugInfo() {
    return {
      version: APP_CONFIG.version,
      initialized: this.initialized,
      startTime: this.startTime,
      loadTime: Date.now() - this.startTime,
      state: APP_STATE,
      userAgent: navigator.userAgent,
      screen: {
        width: window.screen.width,
        height: window.screen.height
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  }
};

// Utilitários de desenvolvimento
const DevTools = {
  
  // Ativar modo debug
  enableDebug() {
    window.SCCAFE_DEBUG = true;
    DebugUtils.log('🐛 Modo debug ativado');
    
    // Adicionar informações no console
    console.table(App.getDebugInfo());
    
    // Adicionar atalhos globais
    window.sccafe = {
      app: App,
      config: APP_CONFIG,
      state: APP_STATE,
      web3: Web3Manager,
      utils: {
        format: FormatUtils,
        dom: DOMUtils,
        validation: ValidationUtils,
        notification: NotificationUtils
      }
    };
    
    DebugUtils.log('💡 Utilitários disponíveis em window.sccafe');
  },
  
  // Simular estado conectado
  simulateConnected() {
    APP_STATE.connected = true;
    APP_STATE.account = '0x1234567890123456789012345678901234567890';
    APP_STATE.balance = '2.5';
    
    Web3Manager.updateConnectionUI();
    Web3Manager.updateConnectionStatus(true, 'BSC Testnet (Simulado)');
    
    DebugUtils.log('🎭 Estado conectado simulado');
  },
  
  // Reset aplicação
  reset() {
    localStorage.clear();
    location.reload();
  }
};

// Função principal de inicialização
function initializeApp() {
  DebugUtils.log('🎬 Iniciando inicialização da aplicação...');
  
  // Verificar se já foi inicializado
  if (App.initialized) {
    DebugUtils.warn('⚠️ Aplicação já inicializada');
    return;
  }
  
  // Inicializar
  App.init();
  
  // Ativar debug em desenvolvimento
  const isDev = window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.search.includes('debug=1');
  
  if (isDev) {
    DevTools.enableDebug();
    
    // Simular conexão após 3 segundos em desenvolvimento
    setTimeout(() => {
      DevTools.simulateConnected();
    }, 3000);
  }
}

// Atalhos de teclado para desenvolvimento
document.addEventListener('keydown', (e) => {
  // Ctrl+Shift+D para debug
  if (e.ctrlKey && e.shiftKey && e.key === 'D') {
    e.preventDefault();
    DevTools.enableDebug();
  }
  
  // Ctrl+Shift+R para reset
  if (e.ctrlKey && e.shiftKey && e.key === 'R') {
    e.preventDefault();
    DevTools.reset();
  }
  
  // Ctrl+Shift+C para simular conexão
  if (e.ctrlKey && e.shiftKey && e.key === 'C') {
    e.preventDefault();
    DevTools.simulateConnected();
  }
});

// Auto-inicialização quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM já carregado
  initializeApp();
}

// Exportar para uso global (se necessário)
window.SCCafeApp = App;

DebugUtils.log('📝 app.js carregado com sucesso');
