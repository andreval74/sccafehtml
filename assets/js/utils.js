
/* ===================================
   UTILITÁRIOS GERAIS - SCCAFÉ
   =================================== */

// Utilitários de formatação
const FormatUtils = {
  
  // Formatar endereço de carteira
  formatAddress(address, start = 6, end = 4) {
    if (!address) return '';
    if (address.length < start + end) return address;
    return `${address.slice(0, start)}...${address.slice(-end)}`;
  },
  
  // Formatar números com separadores
  formatNumber(num, decimals = 2) {
    if (!num) return '0';
    const number = parseFloat(num);
    if (isNaN(number)) return '0';
    return number.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    });
  },
  
  // Formatar data
  formatDate(date, includeTime = true) {
    const d = new Date(date);
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      ...(includeTime && {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    return d.toLocaleString('pt-BR', options);
  },
  
  // Validar endereço Ethereum
  isValidAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  },
  
  // Gerar ID único
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
};

// Utilitários de DOM
const DOMUtils = {
  
  // Seletor seguro
  $(selector) {
    return document.querySelector(selector);
  },
  
  // Seletor múltiplo
  $$(selector) {
    return document.querySelectorAll(selector);
  },
  
  // Criar elemento com atributos
  createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'innerHTML') {
        element.innerHTML = value;
      } else if (key === 'textContent') {
        element.textContent = value;
      } else {
        element.setAttribute(key, value);
      }
    });
    
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof Element) {
        element.appendChild(child);
      }
    });
    
    return element;
  },
  
  // Mostrar/ocultar elemento
  toggle(element, show = null) {
    if (!element) return;
    const isVisible = !element.classList.contains('hidden');
    const shouldShow = show !== null ? show : !isVisible;
    
    if (shouldShow) {
      element.classList.remove('hidden');
    } else {
      element.classList.add('hidden');
    }
  },
  
  // Adicionar classe com animação
  animateClass(element, className, duration = 300) {
    if (!element) return;
    element.classList.add(className);
    setTimeout(() => {
      element.classList.remove(className);
    }, duration);
  },
  
  // Fade in elemento
  fadeIn(element, duration = 300) {
    if (!element) return;
    element.style.opacity = '0';
    element.style.display = 'block';
    
    let start = null;
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = (timestamp - start) / duration;
      
      element.style.opacity = Math.min(progress, 1);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  },
  
  // Fade out elemento
  fadeOut(element, duration = 300) {
    if (!element) return;
    
    let start = null;
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = (timestamp - start) / duration;
      
      element.style.opacity = 1 - Math.min(progress, 1);
      
      if (progress >= 1) {
        element.style.display = 'none';
      } else {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }
};

// Utilitários de animação
const AnimationUtils = {
  
  // Animação de contador
  animateCounter(element, target, duration = 2000) {
    if (!element) return;
    
    const start = 0;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.floor(start + (target - start) * progress);
      
      element.textContent = current;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  },
  
  // Fade in elemento
  fadeIn(element, duration = 300) {
    if (!element) return;
    element.style.opacity = '0';
    element.style.display = 'block';
    
    let start = null;
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = (timestamp - start) / duration;
      
      element.style.opacity = Math.min(progress, 1);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  },
  
  // Fade out elemento
  fadeOut(element, duration = 300) {
    if (!element) return;
    
    let start = null;
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = (timestamp - start) / duration;
      
      element.style.opacity = 1 - Math.min(progress, 1);
      
      if (progress >= 1) {
        element.style.display = 'none';
      } else {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }
};

// Utilitários de validação
const ValidationUtils = {
  
  // Validar nome do token
  validateTokenName(name) {
    const errors = [];
    
    if (!name || name.trim().length === 0) {
      errors.push('Nome é obrigatório');
    } else if (name.length < 2) {
      errors.push('Nome deve ter pelo menos 2 caracteres');
    } else if (name.length > 50) {
      errors.push('Nome deve ter no máximo 50 caracteres');
    }
    
    return { valid: errors.length === 0, errors };
  },
  
  // Validar símbolo do token
  validateTokenSymbol(symbol) {
    const errors = [];
    
    if (!symbol || symbol.trim().length === 0) {
      errors.push('Símbolo é obrigatório');
    } else if (!/^[A-Z]{2,10}$/.test(symbol)) {
      errors.push('Símbolo deve ter 2-10 caracteres maiúsculos');
    }
    
    return { valid: errors.length === 0, errors };
  },
  
  // Validar supply do token
  validateTokenSupply(supply) {
    const errors = [];
    const num = parseFloat(supply);
    
    if (!supply || supply.trim().length === 0) {
      errors.push('Supply é obrigatório');
    } else if (isNaN(num) || num <= 0) {
      errors.push('Supply deve ser um número positivo');
    } else if (num > 1e18) {
      errors.push('Supply muito grande');
    }
    
    return { valid: errors.length === 0, errors };
  },
  
  // Validar endereço personalizado
  validateCustomAddress(address) {
    const errors = [];
    
    if (address && address.length > 0) {
      if (!/^[a-fA-F0-9]*$/.test(address)) {
        errors.push('Apenas caracteres hexadecimais (0-9, A-F)');
      } else if (address.length > 8) {
        errors.push('Máximo 8 caracteres');
      }
    }
    
    return { valid: errors.length === 0, errors };
  }
};

// Utilitários de notificação (Toast)
const NotificationUtils = {
  
  // Mostrar notificação
  show(message, type = 'info', duration = 5000) {
    const container = DOMUtils.$('#toastContainer');
    if (!container) return;
    
    const toast = this.createToast(message, type);
    container.appendChild(toast);
    
    // Mostrar toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remover toast automaticamente
    setTimeout(() => {
      this.remove(toast);
    }, duration);
  },
  
  // Criar elemento toast
  createToast(message, type) {
    const icons = {
      success: 'check-circle',
      error: 'x-circle',
      warning: 'alert-triangle',
      info: 'info'
    };
    
    const toast = DOMUtils.createElement('div', {
      className: `toast toast-${type}`
    });
    
    const icon = DOMUtils.createElement('i', {
      'data-lucide': icons[type],
      className: 'toast-icon'
    });
    
    const content = DOMUtils.createElement('div', {
      className: 'toast-content'
    });
    
    const messageEl = DOMUtils.createElement('div', {
      className: 'toast-message',
      textContent: message
    });
    
    const closeBtn = DOMUtils.createElement('button', {
      className: 'toast-close',
      innerHTML: '<i data-lucide="x"></i>'
    });
    
    closeBtn.addEventListener('click', () => this.remove(toast));
    
    content.appendChild(messageEl);
    toast.appendChild(icon);
    toast.appendChild(content);
    toast.appendChild(closeBtn);
    
    // Inicializar ícones Lucide
    setTimeout(() => lucide.createIcons(), 10);
    
    return toast;
  },
  
  // Remover toast
  remove(toast) {
    if (!toast) return;
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  },
  
  // Métodos de conveniência
  success(message, duration) {
    this.show(message, 'success', duration);
  },
  
  error(message, duration) {
    this.show(message, 'error', duration);
  },
  
  warning(message, duration) {
    this.show(message, 'warning', duration);
  },
  
  info(message, duration) {
    this.show(message, 'info', duration);
  }
};

// Utilitários de debounce e throttle
const TimingUtils = {
  
  // Debounce function
  debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func.apply(this, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(this, args);
    };
  },
  
  // Throttle function
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

// Debug utilities (apenas em desenvolvimento)
const DebugUtils = {
  
  // Log com timestamp
  log(...args) {
    if (APP_CONFIG.theme && console) {
      console.log(`[${new Date().toLocaleTimeString()}] SCCafé:`, ...args);
    }
  },
  
  // Warn com timestamp
  warn(...args) {
    if (APP_CONFIG.theme && console) {
      console.warn(`[${new Date().toLocaleTimeString()}] SCCafé:`, ...args);
    }
  },
  
  // Error com timestamp
  error(...args) {
    if (APP_CONFIG.theme && console) {
      console.error(`[${new Date().toLocaleTimeString()}] SCCafé:`, ...args);
    }
  }
};
