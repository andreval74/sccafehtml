# 🚀 Guia de Instalação - SCCafé

## 📋 Versão Simplificada (Frontend Only)

### Arquivos Necessários:
```
├── index.html
├── admin.html  
├── config.json
├── assets/
│   ├── css/
│   │   ├── variables.css
│   │   ├── base.css
│   │   ├── components.css
│   │   ├── pages.css
│   │   ├── animations.css
│   │   ├── style.css
│   │   └── admin.css
│   └── js/
│       ├── app.js
│       ├── web3.js
│       ├── components.js
│       ├── utils.js
│       ├── config.js
│       ├── i18n.js
│       └── admin.js
├── contracts/
│   ├── TokenFactory.sol
│   └── Token.sol
├── includes/
│   ├── header.html
│   └── footer.html
└── js/
    ├── app.js
    ├── web3.js
    └── translations.js
```

## 🌐 Passos para Instalação no Servidor HTTPS:

### 1. Upload dos Arquivos
- Faça upload de todos os arquivos listados acima para o diretório público do seu servidor
- Mantenha a estrutura de pastas exatamente como está

### 2. Configurar Permissões
```bash
# No servidor Linux
chmod -R 755 /caminho/para/sccafe/
chmod -R 644 /caminho/para/sccafe/*.html
chmod -R 644 /caminho/para/sccafe/assets/
```

### 3. Configurar Web3 (IMPORTANTE)
Edite o arquivo `assets/js/web3.js` e configure:

```javascript
// Configurar endereço do contrato TokenFactory
const FACTORY_ADDRESS = 'SEU_ENDERECO_DO_CONTRATO_AQUI';

// Configurar RPC da rede
const BSC_TESTNET_RPC = 'https://data-seed-prebsc-1-s1.binance.org:8545/';
```

### 4. Deploy do Contrato Smart Contract
Você precisa fazer deploy do contrato `TokenFactory.sol` primeiro:

1. Use Remix IDE (https://remix.ethereum.org/)
2. Cole o código do arquivo `contracts/TokenFactory.sol`
3. Compile e faça deploy na BSC Testnet
4. Anote o endereço do contrato
5. Atualize o endereço no arquivo `assets/js/web3.js`

### 5. Configurar Domínio
- Aponte seu domínio para o diretório onde estão os arquivos
- Certifique-se que o HTTPS está funcionando
- Teste acessando: `https://seudominio.com`

## 🔧 Configurações Opcionais:

### Personalizar Cores (config.json):
```json
{
  "theme": {
    "colors": {
      "primary": "#D4A574",
      "background": "#0a0a0a"
    }
  }
}
```

### Configurar Redes Suportadas:
```json
{
  "networks": {
    "supported": [
      {
        "id": "bsc-testnet",
        "name": "BSC Testnet",
        "chainId": 97
      }
    ]
  }
}
```

## ⚡ Versão Completa (Frontend + Backend API)

### Requisitos do Servidor:
- Node.js 16+ 
- PM2 (opcional)
- Nginx (proxy reverso)

### Passos Adicionais:
1. Instale dependências da API:
```bash
cd api/
npm install
```

2. Configure variáveis de ambiente:
```bash
# Crie arquivo .env na pasta api/
echo "PORT=3001" > .env
echo "BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545/" >> .env
```

3. Inicie a API:
```bash
npm start
# ou com PM2
pm2 start server.js --name "sccafe-api"
```

4. Configure Nginx:
```nginx
server {
    listen 443 ssl;
    server_name seudominio.com;
    
    location / {
        root /caminho/para/sccafe;
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🎯 Teste da Instalação:

1. Acesse `https://seudominio.com`
2. Conecte uma carteira (MetaMask)
3. Teste criar um token
4. Verifique se o deploy funciona

## 🆘 Resolução de Problemas:

- **Web3 não conecta**: Verifique se o HTTPS está funcionando
- **Contrato não encontrado**: Verifique o endereço no web3.js
- **Erro de rede**: Confirme se está na BSC Testnet
- **CSS não carrega**: Verifique permissões dos arquivos

## 📞 Suporte:
- Verifique logs do browser (F12 → Console)
- Teste primeiro em localhost
- Use BSC Testnet para testes
