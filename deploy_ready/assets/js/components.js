
/* ===================================
   COMPONENTES INTERATIVOS - SCCAFÉ
   =================================== */

// Gerenciador de includes para componentes reutilizáveis
const IncludeManager = {
  
  // Carregar arquivo HTML
  async loadHTML(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      return await response.text();
    } catch (error) {
      DebugUtils.error('Erro ao carregar HTML:', url, error);
      return '';
    }
  },
  
  // Carregar header
  async loadHeader() {
    const headerHtml = await this.loadHTML('includes/header.html');
    const container = DOMUtils.$('#headerContainer');
    if (container) {
      container.innerHTML = headerHtml;
      lucide.createIcons();
    }
  },
  
  // Carregar footer
  async loadFooter() {
    const footerHtml = await this.loadHTML('includes/footer.html');
    const container = DOMUtils.$('#footerContainer');
    if (container) {
      container.innerHTML = footerHtml;
      
      // Atualizar versão no footer
      const versionEl = DOMUtils.$('#footerVersion');
      if (versionEl) {
        versionEl.textContent = APP_CONFIG.version;
      }
      
      lucide.createIcons();
    }
  }
};

// Componente de Loading
const LoadingManager = {
  
  // Mostrar loading global
  show(message = 'Carregando...') {
    const loadingScreen = DOMUtils.$('#loadingScreen');
    const loadingText = DOMUtils.$('#loadingText');
    
    if (loadingText) {
      loadingText.textContent = message;
    }
    
    if (loadingScreen) {
      loadingScreen.classList.remove('hidden');
      DOMUtils.fadeIn(loadingScreen, 300);
    }
    
    APP_STATE.loading = true;
  },
  
  // Ocultar loading global
  hide() {
    const loadingScreen = DOMUtils.$('#loadingScreen');
    
    if (loadingScreen) {
      DOMUtils.fadeOut(loadingScreen, 300);
      setTimeout(() => {
        loadingScreen.classList.add('hidden');
      }, 300);
    }
    
    APP_STATE.loading = false;
  },
  
  // Toggle loading
  toggle(show, message) {
    if (show) {
      this.show(message);
    } else {
      this.hide();
    }
  }
};

// Componente de Navegação
const NavigationManager = {
  
  // Inicializar navegação
  init() {
    const navLinks = DOMUtils.$$('.nav-link');
    
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        if (page) {
          this.navigateTo(page);
        }
      });
    });
    
    // Navegação inicial baseada na URL
    this.handleInitialNavigation();
  },
  
  // Navegar para página
  navigateTo(page) {
    // Atualizar links ativos
    DOMUtils.$$('.nav-link').forEach(link => {
      link.classList.remove('active');
    });
    
    const activeLink = DOMUtils.$(`[data-page="${page}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }
    
    // Mostrar/ocultar seções
    this.showPage(page);
    
    // Atualizar URL sem recarregar
    window.history.pushState({ page }, '', `#${page}`);
  },
  
  // Mostrar página específica
  showPage(page) {
    // Por enquanto, apenas scroll para seção
    const section = DOMUtils.$(`#${page}`);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  },
  
  // Lidar com navegação inicial
  handleInitialNavigation() {
    const hash = window.location.hash.slice(1);
    if (hash) {
      this.navigateTo(hash);
    }
  }
};

// Componente de Idioma
const LanguageManager = {
  
  // Inicializar sistema de idiomas
  init() {
    const langBtn = DOMUtils.$('#languageToggle');
    const langDropdown = DOMUtils.$('#languageDropdown');
    const langOptions = DOMUtils.$$('.lang-option');
    
    if (langBtn) {
      langBtn.addEventListener('click', () => {
        langDropdown?.classList.toggle('active');
      });
    }
    
    langOptions.forEach(option => {
      option.addEventListener('click', () => {
        const lang = option.dataset.lang;
        if (lang) {
          this.setLanguage(lang);
          langDropdown?.classList.remove('active');
        }
      });
    });
    
    // Fechar dropdown ao clicar fora
    document.addEventListener('click', (e) => {
      if (!langBtn?.contains(e.target)) {
        langDropdown?.classList.remove('active');
      }
    });
    
    // Aplicar idioma salvo
    this.applyLanguage(APP_STATE.language);
  },
  
  // Definir idioma
  setLanguage(lang) {
    APP_STATE.language = lang;
    ConfigUtils.saveConfig('language', lang);
    this.applyLanguage(lang);
    
    // Atualizar indicador no botão
    const currentLang = DOMUtils.$('#currentLang');
    if (currentLang) {
      currentLang.textContent = lang.toUpperCase();
    }
    
    DebugUtils.log('Idioma alterado para:', lang);
  },
  
  // Aplicar idioma na interface
  applyLanguage(lang) {
    // Por enquanto, apenas log
    // TODO: Implementar sistema completo de i18n
    DebugUtils.log('Aplicando idioma:', lang);
  }
};

// Componente de Versão
const VersionManager = {
  
  // Inicializar indicador de versão
  init() {
    const versionIndicator = DOMUtils.$('#versionIndicator');
    const chevron = versionIndicator?.querySelector('.chevron');
    const buildDate = DOMUtils.$('#buildDate');
    
    // Atualizar data de build
    if (buildDate) {
      const now = new Date();
      buildDate.textContent = FormatUtils.formatDate(now);
    }
    
    // Funcionalidade de expandir/recolher
    if (versionIndicator) {
      versionIndicator.addEventListener('click', () => {
        versionIndicator.classList.toggle('expanded');
        const isExpanded = versionIndicator.classList.contains('expanded');
        
        if (chevron) {
          chevron.setAttribute('data-lucide', isExpanded ? 'chevron-up' : 'chevron-down');
          lucide.createIcons();
        }
      });
    }
    
    // Atualizar versões em todos os locais
    this.updateVersionDisplay();
  },
  
  // Atualizar display da versão
  updateVersionDisplay() {
    const versionElements = DOMUtils.$$('[id*="Version"]');
    versionElements.forEach(el => {
      if (el.id === 'headerVersion' || el.id === 'footerVersion') {
        el.textContent = `v${APP_CONFIG.version}`;
      }
    });
  }
};

// Componente de Estatísticas (Hero)
const StatsManager = {
  
  // Inicializar animação de estatísticas
  init() {
    const statsNumbers = DOMUtils.$$('[data-counter]');
    
    // Observar quando as estatísticas entram na tela
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = parseInt(entry.target.dataset.counter);
          AnimationUtils.animateCounter(entry.target, target);
          observer.unobserve(entry.target);
        }
      });
    });
    
    statsNumbers.forEach(stat => {
      observer.observe(stat);
    });
  }
};

// Componente de Demo (Hero Visual)
const DemoManager = {
  
  // Inicializar demo interativo
  init() {
    this.startDemoAnimation();
  },
  
  // Animação do demo
  startDemoAnimation() {
    const demoAddress = DOMUtils.$('#demoAddress');
    const demoName = DOMUtils.$('#demoName');
    const demoSymbol = DOMUtils.$('#demoSymbol');
    const demoSupply = DOMUtils.$('#demoSupply');
    
    const addresses = ['CAFE123', 'TOKEN42', 'DEFI999', 'NFT2024', 'WEB3ABC'];
    const names = ['CafeToken', 'MyToken', 'DefiCoin', 'NFTCoin', 'Web3Token'];
    const symbols = ['CAFE', 'MTK', 'DEFI', 'NFT', 'WEB3'];
    const supplies = ['1,000,000', '500,000', '2,000,000', '10,000,000', '100,000'];
    
    let currentIndex = 0;
    
    setInterval(() => {
      const nextIndex = (currentIndex + 1) % addresses.length;
      
      // Fade out
      [demoAddress, demoName, demoSymbol, demoSupply].forEach(el => {
        if (el) el.style.opacity = '0.5';
      });
      
      setTimeout(() => {
        if (demoAddress) demoAddress.textContent = addresses[nextIndex];
        if (demoName) demoName.textContent = names[nextIndex];
        if (demoSymbol) demoSymbol.textContent = symbols[nextIndex];
        if (demoSupply) demoSupply.textContent = supplies[nextIndex];
        
        // Fade in
        [demoAddress, demoName, demoSymbol, demoSupply].forEach(el => {
          if (el) el.style.opacity = '1';
        });
        
        currentIndex = nextIndex;
      }, 300);
    }, 3000);
  }
};

// Componente de Botões de Ação
const ActionManager = {
  
  // Inicializar botões de ação
  init() {
    // Botões principais
    const startCreating = DOMUtils.$('#startCreating');
    const learnMore = DOMUtils.$('#learnMore');
    const ctaStart = DOMUtils.$('#ctaStart');
    
    if (startCreating) {
      startCreating.addEventListener('click', () => {
        this.handleStartCreating();
      });
    }
    
    if (learnMore) {
      learnMore.addEventListener('click', () => {
        this.handleLearnMore();
      });
    }
    
    if (ctaStart) {
      ctaStart.addEventListener('click', () => {
        this.handleStartCreating();
      });
    }
  },
  
  // Lidar com "Criar Token"
  handleStartCreating() {
    NotificationUtils.info('Funcionalidade de criação de token em desenvolvimento...');
    
    // TODO: Navegar para página de criação
    // NavigationManager.navigateTo('create');
  },
  
  // Lidar com "Ver Como Funciona"
  handleLearnMore() {
    const howItWorksSection = DOMUtils.$('.how-it-works-section');
    if (howItWorksSection) {
      howItWorksSection.scrollIntoView({ behavior: 'smooth' });
    }
  }
};

// Função principal para carregar todos os includes
async function loadIncludes() {
  try {
    LoadingManager.show('Carregando componentes...');
    
    await Promise.all([
      IncludeManager.loadHeader(),
      IncludeManager.loadFooter()
    ]);
    
    DebugUtils.log('✅ Includes carregados com sucesso');
  } catch (error) {
    DebugUtils.error('❌ Erro ao carregar includes:', error);
    NotificationUtils.error('Erro ao carregar componentes da página');
  } finally {
    LoadingManager.hide();
  }
}

// Função principal para inicializar todos os componentes
function initializeComponents() {
  try {
    // Inicializar componentes na ordem correta
    NavigationManager.init();
    LanguageManager.init();
    VersionManager.init();
    StatsManager.init();
    DemoManager.init();
    ActionManager.init();
    
    DebugUtils.log('✅ Componentes inicializados com sucesso');
  } catch (error) {
    DebugUtils.error('❌ Erro ao inicializar componentes:', error);
    NotificationUtils.error('Erro ao inicializar componentes');
  }
}
