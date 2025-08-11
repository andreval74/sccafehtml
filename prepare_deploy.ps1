# 🚀 Script de Preparação - SCCafé para Servidor HTTPS
# Execute no PowerShell: .\prepare_deploy.ps1

Write-Host "🚀 Preparando SCCafé para deploy no servidor..." -ForegroundColor Green

# Criar pasta de deploy
Write-Host "📁 Criando pasta deploy_ready..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "deploy_ready" | Out-Null

# Copiar arquivos essenciais
Write-Host "📁 Copiando arquivos principais..." -ForegroundColor Yellow
Copy-Item "index.html" "deploy_ready/" -Force
Copy-Item "admin.html" "deploy_ready/" -Force  
Copy-Item "config.json" "deploy_ready/" -Force

# Copiar estrutura de assets
Write-Host "📁 Copiando assets..." -ForegroundColor Yellow
Copy-Item "assets" "deploy_ready/" -Recurse -Force

# Copiar contratos
Write-Host "📁 Copiando contratos..." -ForegroundColor Yellow
Copy-Item "contracts" "deploy_ready/" -Recurse -Force

# Copiar includes
Write-Host "📁 Copiando includes..." -ForegroundColor Yellow
Copy-Item "includes" "deploy_ready/" -Recurse -Force

# Copiar js (versão alternativa)
Write-Host "📁 Copiando scripts JS..." -ForegroundColor Yellow
Copy-Item "js" "deploy_ready/" -Recurse -Force

# Criar README de instalação
Write-Host "📝 Criando guia de instalação..." -ForegroundColor Yellow
$readmeContent = @"
SCCafé - Guia de Instalação Rápida

O que você tem aqui:
Todos os arquivos necessários para instalar o SCCafé no seu servidor HTTPS.

Como instalar:

1. Upload dos Arquivos
   - Faça upload de TODA esta pasta para o diretório público do seu servidor
   - Mantenha a estrutura de pastas

2. Configurar Web3 (OBRIGATÓRIO)
   Antes de usar, você precisa:

   Deploy do Smart Contract:
   - Acesse https://remix.ethereum.org/
   - Abra o arquivo contracts/TokenFactory.sol
   - Compile e faça deploy na BSC Testnet
   - Anote o endereço do contrato

   Configurar o endereço:
   - Edite assets/js/web3.js
   - Procure por: FACTORY_ADDRESS = 'SEU_ENDERECO_AQUI'
   - Substitua pelo endereço real do contrato

3. Testar
   - Acesse https://seudominio.com
   - Conecte MetaMask na BSC Testnet
   - Teste criar um token

Arquivos Importantes:
- index.html - Página principal
- admin.html - Painel administrativo  
- assets/ - CSS, JS, imagens
- contracts/ - Smart contracts
- config.json - Configurações

Problemas Comuns:

Carteira não conecta:
- Verifique se está usando HTTPS
- Teste com MetaMask

Erro ao criar token:
- Verifique endereço do contrato
- Confirme que está na BSC Testnet
- Verifique se tem tBNB para gas

CSS não carrega:
- Verifique permissões dos arquivos
- Confirme estrutura de pastas

Suporte:
- Abra F12 → Console para ver erros
- Teste primeiro em localhost
- Use sempre BSC Testnet para testes

Versão Simplificada:
Esta é a versão mais fácil de instalar. Funciona apenas com frontend.
Para versão completa com API, consulte INSTALL_GUIDE.md
"@
$readmeContent | Out-File -FilePath "deploy_ready/README_INSTALACAO.txt" -Encoding utf8

# Criar arquivo de configuração Web3
Write-Host "📝 Criando template de configuração Web3..." -ForegroundColor Yellow
$web3Config = @"
CONFIGURAÇÃO OBRIGATÓRIA - WEB3

Edite o arquivo: assets/js/web3.js

Procure pela linha:
const FACTORY_ADDRESS = 'SEU_ENDERECO_AQUI';

E substitua 'SEU_ENDERECO_AQUI' pelo endereço do seu contrato TokenFactory.

PASSOS PARA OBTER O ENDEREÇO:

1. Acesse https://remix.ethereum.org/
2. Crie novo arquivo e cole o conteúdo de contracts/TokenFactory.sol
3. Compile com Solidity 0.8.19+
4. Deploy na BSC Testnet
5. Copie o endereço do contrato
6. Cole no arquivo web3.js

EXEMPLO:
const FACTORY_ADDRESS = '0x1234567890123456789012345678901234567890';

Redes Suportadas:
- BSC Testnet (ChainID: 97) - Para testes
- BSC Mainnet (ChainID: 56) - Para produção

IMPORTANTE: 
- Use SEMPRE BSC Testnet primeiro para testes
- Tenha tBNB na carteira para pagar gas
- Teste com pequenas quantias
"@
$web3Config | Out-File -FilePath "deploy_ready/CONFIGURAR_WEB3.txt" -Encoding utf8

# Criar checklist
Write-Host "📝 Criando checklist..." -ForegroundColor Yellow
$checklist = @"
CHECKLIST DE INSTALAÇÃO - SCCafé

PRÉ-REQUISITOS:
[ ] Servidor com HTTPS funcionando
[ ] Certificado SSL válido
[ ] Acesso FTP/cPanel/SSH ao servidor
[ ] MetaMask instalado no navegador

UPLOAD:
[ ] Fazer upload de TODOS os arquivos desta pasta
[ ] Manter estrutura de pastas intacta
[ ] Verificar se arquivos CSS/JS carregaram

CONFIGURAÇÃO OBRIGATÓRIA:
[ ] Deploy do contrato TokenFactory.sol
[ ] Anotar endereço do contrato  
[ ] Editar assets/js/web3.js
[ ] Configurar FACTORY_ADDRESS

TESTES:
[ ] Acessar https://seudominio.com
[ ] Verificar se página carrega sem erros
[ ] Conectar MetaMask (BSC Testnet)
[ ] Criar token de teste
[ ] Verificar se token foi criado

OPCIONAL:
[ ] Configurar painel admin (admin.html)
[ ] Personalizar cores (config.json)
[ ] Configurar analytics
[ ] Backup dos arquivos

PROBLEMAS COMUNS:
- Página em branco: verificar console (F12)
- CSS não carrega: verificar paths dos arquivos
- Web3 erro: verificar configuração do contrato
- Gas error: verificar saldo tBNB na carteira

SUPORTE:
- Teste sempre em BSC Testnet primeiro
- Use console do navegador para debug
- Verifique network na MetaMask
"@
$checklist | Out-File -FilePath "deploy_ready/CHECKLIST.txt" -Encoding utf8

# Criar arquivo ZIP para facilitar upload
Write-Host "📦 Criando arquivo ZIP..." -ForegroundColor Yellow
if (Get-Command Compress-Archive -ErrorAction SilentlyContinue) {
    Compress-Archive -Path "deploy_ready/*" -DestinationPath "SCCafe_Deploy_Ready.zip" -Force
    Write-Host "✅ Arquivo SCCafe_Deploy_Ready.zip criado!" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Preparação concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Pasta 'deploy_ready' criada com todos os arquivos" -ForegroundColor Cyan
Write-Host "📦 Arquivo 'SCCafe_Deploy_Ready.zip' criado para upload fácil" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔧 Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Faça upload da pasta 'deploy_ready' OU do arquivo ZIP" -ForegroundColor White
Write-Host "2. Configure o contrato Web3 (veja CONFIGURAR_WEB3.txt)" -ForegroundColor White  
Write-Host "3. Siga o CHECKLIST.txt" -ForegroundColor White
Write-Host ""
Write-Host "📖 Leia README_INSTALACAO.txt para detalhes completos" -ForegroundColor Magenta
Write-Host ""

# Mostrar resumo dos arquivos
Write-Host "📋 Arquivos preparados:" -ForegroundColor Yellow
Get-ChildItem "deploy_ready" -Recurse | Select-Object Name, Length | Format-Table -AutoSize
