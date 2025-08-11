#!/bin/bash

# 🚀 Script de Preparação - SCCafé para Servidor HTTPS
# Execute este script para preparar os arquivos para upload

echo "🚀 Preparando SCCafé para deploy no servidor..."

# Criar pasta de deploy
mkdir -p deploy_ready

# Copiar arquivos essenciais
echo "📁 Copiando arquivos principais..."
cp index.html deploy_ready/
cp admin.html deploy_ready/
cp config.json deploy_ready/

# Copiar estrutura de assets
echo "📁 Copiando assets..."
cp -r assets deploy_ready/

# Copiar contratos
echo "📁 Copiando contratos..."
cp -r contracts deploy_ready/

# Copiar includes
echo "📁 Copiando includes..."
cp -r includes deploy_ready/

# Copiar js (versão alternativa)
echo "📁 Copiando scripts JS..."
cp -r js deploy_ready/

# Criar arquivo .htaccess para Apache
echo "📝 Criando .htaccess..."
cat > deploy_ready/.htaccess << 'EOF'
# SCCafé - Configurações Apache
RewriteEngine On

# HTTPS Redirect
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache Control
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>

# Security Headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
</IfModule>
EOF

# Criar nginx.conf de exemplo
echo "📝 Criando configuração Nginx..."
cat > deploy_ready/nginx_example.conf << 'EOF'
# SCCafé - Configuração Nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name seudominio.com www.seudominio.com;

    # SSL Configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Root directory
    root /var/www/sccafe;
    index index.html;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Static files
    location ~* \.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Main location
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Admin section (opcional - proteger com auth)
    location /admin.html {
        # auth_basic "Admin Area";
        # auth_basic_user_file /etc/nginx/.htpasswd;
        try_files $uri =404;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name seudominio.com www.seudominio.com;
    return 301 https://$server_name$request_uri;
}
EOF

# Criar checklist de instalação
echo "📝 Criando checklist..."
cat > deploy_ready/CHECKLIST_INSTALACAO.md << 'EOF'
# ✅ Checklist de Instalação - SCCafé

## Antes do Upload:
- [ ] Servidor HTTPS funcionando
- [ ] Certificado SSL válido
- [ ] Acesso FTP/SSH ao servidor
- [ ] Node.js instalado (se usar API)

## Upload dos Arquivos:
- [ ] Fazer upload da pasta deploy_ready/ para o servidor
- [ ] Verificar se todas as pastas foram copiadas corretamente
- [ ] Configurar permissões (755 para pastas, 644 para arquivos)

## Configuração Web3:
- [ ] Deploy do contrato TokenFactory.sol na BSC Testnet
- [ ] Anotar endereço do contrato
- [ ] Editar assets/js/web3.js com o endereço correto
- [ ] Testar conexão Web3

## Configuração do Servidor:
- [ ] Configurar Apache (.htaccess) ou Nginx
- [ ] Ativar compressão Gzip
- [ ] Configurar headers de segurança
- [ ] Configurar cache para assets estáticos

## Testes:
- [ ] Acessar https://seudominio.com
- [ ] Verificar se CSS/JS carregam corretamente
- [ ] Testar conexão de carteira (MetaMask)
- [ ] Testar criação de token (BSC Testnet)
- [ ] Verificar responsividade mobile

## Opcional (Versão Completa):
- [ ] Instalar dependências Node.js
- [ ] Configurar variáveis de ambiente
- [ ] Iniciar API com PM2
- [ ] Configurar proxy reverso
- [ ] Testar endpoints da API

## Pós-Instalação:
- [ ] Configurar monitoramento
- [ ] Backup dos arquivos
- [ ] Documentar credenciais
- [ ] Testar em diferentes navegadores
EOF

# Criar arquivo de configuração simplificada
echo "📝 Criando configuração Web3..."
cat > deploy_ready/CONFIG_WEB3.js << 'EOF'
// 🔧 Configuração Web3 - SCCafé
// Cole este código no arquivo assets/js/web3.js

// ========================================
// CONFIGURAÇÕES PRINCIPAIS
// ========================================

// Endereço do contrato TokenFactory (ALTERE AQUI!)
const FACTORY_ADDRESS = 'COLE_SEU_ENDERECO_AQUI';

// Configurações de rede
const NETWORK_CONFIGS = {
    97: { // BSC Testnet
        name: 'BSC Testnet',
        rpc: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
        explorer: 'https://testnet.bscscan.com',
        currency: 'tBNB'
    },
    56: { // BSC Mainnet  
        name: 'BSC Mainnet',
        rpc: 'https://bsc-dataseed1.binance.org/',
        explorer: 'https://bscscan.com',
        currency: 'BNB'
    }
};

// ========================================
// PASSOS PARA CONFIGURAR:
// ========================================

/*
1. Faça deploy do TokenFactory.sol:
   - Acesse https://remix.ethereum.org/
   - Cole o código do arquivo contracts/TokenFactory.sol
   - Compile com Solidity 0.8.19+
   - Deploy na BSC Testnet
   - Copie o endereço do contrato

2. Substitua 'COLE_SEU_ENDERECO_AQUI' pelo endereço real

3. Teste a conexão:
   - Abra o console do navegador (F12)
   - Digite: Web3Manager.checkFactoryContract()
   - Deve retornar true se configurado corretamente

4. Para produção:
   - Altere para BSC Mainnet (chainId: 56)
   - Use RPC confiável
   - Teste com pequenas quantias primeiro
*/
EOF

echo ""
echo "✅ Preparação concluída!"
echo ""
echo "📁 Pasta 'deploy_ready' criada com todos os arquivos necessários"
echo ""
echo "🔧 Próximos passos:"
echo "1. Faça upload da pasta 'deploy_ready' para seu servidor"
echo "2. Configure o contrato Web3 (veja CONFIG_WEB3.js)"
echo "3. Siga o CHECKLIST_INSTALACAO.md"
echo ""
echo "📖 Documentação completa em INSTALL_GUIDE.md"
echo ""
