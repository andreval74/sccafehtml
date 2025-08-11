# 🚀 SCCafé - Guia Rápido de Instalação no Servidor HTTPS

## ✅ **Resumo - O que você precisa fazer:**

### **1. Preparação (CONCLUÍDA ✅)**
- Script executado com sucesso
- Pasta `deploy_ready` criada com todos os arquivos
- Arquivos organizados e prontos para upload

### **2. Upload para o Servidor**
- Faça upload de **TODA** a pasta `deploy_ready` para o diretório público do seu servidor HTTPS
- Mantenha a estrutura de pastas **exatamente** como está

### **3. Configuração Obrigatória do Smart Contract**

**3.1. Deploy do Contrato:**
1. Acesse: https://remix.ethereum.org/
2. Crie novo arquivo chamado `TokenFactory.sol`
3. Cole o conteúdo do arquivo `contracts/TokenFactory.sol`
4. Compile com Solidity 0.8.19+
5. Faça deploy na **BSC Testnet** (Chain ID: 97)
6. **Anote o endereço do contrato** (ex: 0x1234...5678)

**3.2. Configurar no Código:**
1. Edite o arquivo: `assets/js/web3.js`
2. Procure por: `FACTORY_ADDRESS = 'SEU_ENDERECO_AQUI'`
3. Substitua pelo endereço real do contrato

### **4. Teste**
1. Acesse: `https://seudominio.com`
2. Conecte MetaMask na BSC Testnet
3. Tenha tBNB na carteira para gas
4. Teste criar um token

---

## 📁 **Estrutura de Arquivos Preparados:**

```
deploy_ready/
├── index.html          # Página principal
├── admin.html          # Painel administrativo
├── config.json         # Configurações
├── LEIA_PRIMEIRO.txt   # Instruções detalhadas
├── CHECKLIST.txt       # Lista de verificação
├── assets/             # CSS, JS, imagens
├── contracts/          # Smart contracts
├── includes/           # Componentes HTML
└── js/                 # Scripts alternativos
```

---

## ⚡ **Configuração do Servidor Web**

### **Apache (.htaccess)**
```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
</IfModule>
```

### **Nginx**
```nginx
server {
    listen 443 ssl;
    server_name seudominio.com;
    root /caminho/para/deploy_ready;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 🔧 **Configurações Importantes**

### **Web3 (assets/js/web3.js)**
```javascript
// ALTERE ESTA LINHA:
const FACTORY_ADDRESS = 'COLE_SEU_ENDERECO_AQUI';

// Para BSC Testnet:
const NETWORK = {
    chainId: 97,
    rpc: 'https://data-seed-prebsc-1-s1.binance.org:8545/'
};
```

### **MetaMask - Adicionar BSC Testnet**
- Network Name: BSC Testnet
- RPC URL: https://data-seed-prebsc-1-s1.binance.org:8545/
- Chain ID: 97
- Currency: tBNB
- Explorer: https://testnet.bscscan.com

---

## 🆘 **Resolução de Problemas**

| Problema | Solução |
|----------|---------|
| **Página em branco** | Verifique console (F12), paths dos arquivos |
| **CSS não carrega** | Verifique permissões, estrutura de pastas |
| **Web3 não conecta** | HTTPS obrigatório, configure MetaMask |
| **Erro ao criar token** | Verifique endereço do contrato, saldo tBNB |
| **Gas error** | Tenha tBNB na carteira, BSC Testnet |

---

## 🎯 **Checklist Final**

- [ ] ✅ Arquivos preparados (deploy_ready)
- [ ] 📤 Upload para servidor HTTPS
- [ ] 🔗 Deploy do contrato TokenFactory.sol
- [ ] ⚙️ Configurar endereço em web3.js
- [ ] 🦊 MetaMask configurado (BSC Testnet)
- [ ] 💰 tBNB na carteira
- [ ] 🌐 Teste: https://seudominio.com
- [ ] 🎲 Criar token de teste
- [ ] ✅ Verificar funcionamento

---

## 🎉 **Pronto!**

Se seguiu todos os passos, seu SCCafé está funcionando!

**Próximos passos:**
- Teste criar vários tokens
- Configure cores personalizadas (config.json)
- Acesse painel admin (admin.html)
- Para produção: mude para BSC Mainnet

**Suporte:**
- Console do navegador (F12) para debug
- Sempre teste em BSC Testnet primeiro
- Verifique se está usando HTTPS
