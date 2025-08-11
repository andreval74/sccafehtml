# SCCafé - Script de Preparação para Deploy
Write-Host "Preparando SCCafé para deploy no servidor..." -ForegroundColor Green

# Criar pasta de deploy
New-Item -ItemType Directory -Force -Path "deploy_ready" | Out-Null
Write-Host "Pasta deploy_ready criada" -ForegroundColor Yellow

# Copiar arquivos essenciais
Copy-Item "index.html" "deploy_ready/" -Force
Copy-Item "admin.html" "deploy_ready/" -Force  
Copy-Item "config.json" "deploy_ready/" -Force
Write-Host "Arquivos principais copiados" -ForegroundColor Yellow

# Copiar estrutura de assets
Copy-Item "assets" "deploy_ready/" -Recurse -Force
Write-Host "Assets copiados" -ForegroundColor Yellow

# Copiar contratos
Copy-Item "contracts" "deploy_ready/" -Recurse -Force
Write-Host "Contratos copiados" -ForegroundColor Yellow

# Copiar includes
Copy-Item "includes" "deploy_ready/" -Recurse -Force
Write-Host "Includes copiados" -ForegroundColor Yellow

# Copiar js
Copy-Item "js" "deploy_ready/" -Recurse -Force
Write-Host "Scripts JS copiados" -ForegroundColor Yellow

# Criar arquivo de instruções
$instructions = @"
===============================================
SCCafé - INSTRUÇÕES DE INSTALAÇÃO
===============================================

PASSO 1: UPLOAD
- Faça upload de TODOS os arquivos desta pasta para seu servidor
- Mantenha a estrutura de pastas

PASSO 2: CONFIGURAR WEB3 (OBRIGATÓRIO)
- Acesse https://remix.ethereum.org/
- Abra contracts/TokenFactory.sol
- Compile e faça deploy na BSC Testnet
- Anote o endereço do contrato
- Edite assets/js/web3.js
- Substitua 'SEU_ENDERECO_AQUI' pelo endereço real

PASSO 3: TESTAR
- Acesse https://seudominio.com
- Conecte MetaMask (BSC Testnet)
- Teste criar um token

PROBLEMAS COMUNS:
- CSS não carrega: verifique permissões
- Web3 erro: configure endereço do contrato
- Gas error: tenha tBNB na carteira

ARQUIVOS IMPORTANTES:
- index.html (página principal)
- admin.html (painel admin)
- assets/ (CSS, JS, imagens)
- contracts/ (smart contracts)

SUPORTE:
- Use F12 > Console para debug
- Teste sempre em BSC Testnet primeiro
- Verifique se está usando HTTPS
"@

$instructions | Out-File -FilePath "deploy_ready/LEIA_PRIMEIRO.txt" -Encoding UTF8

# Criar checklist simples
$checklist = @"
CHECKLIST DE INSTALAÇÃO:

[ ] Servidor HTTPS funcionando
[ ] Upload de todos os arquivos
[ ] Deploy do contrato TokenFactory.sol
[ ] Configurar endereço em assets/js/web3.js
[ ] Testar conexão MetaMask
[ ] Criar token de teste
[ ] Verificar se funcionou

Se tudo funcionar, está pronto para usar!
"@

$checklist | Out-File -FilePath "deploy_ready/CHECKLIST.txt" -Encoding UTF8

Write-Host ""
Write-Host "Preparação concluída!" -ForegroundColor Green
Write-Host "Pasta 'deploy_ready' criada com todos os arquivos necessários" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Faça upload da pasta 'deploy_ready' para seu servidor" -ForegroundColor White
Write-Host "2. Leia o arquivo LEIA_PRIMEIRO.txt" -ForegroundColor White
Write-Host "3. Configure o contrato Web3" -ForegroundColor White
Write-Host "4. Siga o CHECKLIST.txt" -ForegroundColor White
