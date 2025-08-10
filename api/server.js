
/* ===================================
   SERVIDOR API - SCCAFÉ
   Express.js API para compilação e deploy
   =================================== */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const solc = require('solc');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Configurações
const NETWORKS = {
  'bsc-testnet': {
    chainId: 97,
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    explorer: 'https://testnet.bscscan.com',
    apiKey: process.env.BSC_TESTNET_API_KEY
  },
  'bsc-mainnet': {
    chainId: 56,
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    explorer: 'https://bscscan.com',
    apiKey: process.env.BSC_MAINNET_API_KEY
  }
};

// Utilitários
const Utils = {
  
  // Log com timestamp
  log(...args) {
    console.log(`[${new Date().toISOString()}] API:`, ...args);
  },
  
  // Gerar template do contrato ERC20
  generateTokenContract(name, symbol, totalSupply) {
    return `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ${name}
 * @dev Token ERC20 criado via SCCafé CREATE2 Factory
 * @author SCCafé Team
 */

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract ${symbol}Token is IERC20 {
    
    // === ESTADO ===
    
    string public constant name = "${name}";
    string public constant symbol = "${symbol}";
    uint8 public constant decimals = 18;
    uint256 private _totalSupply = ${totalSupply} * 10**decimals;
    
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    
    address public owner;
    bool public paused = false;
    
    // === EVENTOS ===
    
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Paused(address account);
    event Unpaused(address account);
    
    // === MODIFICADORES ===
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Apenas o proprietario pode executar");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contrato pausado");
        _;
    }
    
    // === CONSTRUTOR ===
    
    constructor() {
        owner = msg.sender;
        _balances[msg.sender] = _totalSupply;
        emit Transfer(address(0), msg.sender, _totalSupply);
        emit OwnershipTransferred(address(0), msg.sender);
    }
    
    // === FUNCOES ERC20 ===
    
    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }
    
    function balanceOf(address account) external view override returns (uint256) {
        return _balances[account];
    }
    
    function transfer(address recipient, uint256 amount) external override whenNotPaused returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }
    
    function allowance(address tokenOwner, address spender) external view override returns (uint256) {
        return _allowances[tokenOwner][spender];
    }
    
    function approve(address spender, uint256 amount) external override whenNotPaused returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address sender, address recipient, uint256 amount) external override whenNotPaused returns (bool) {
        uint256 currentAllowance = _allowances[sender][msg.sender];
        require(currentAllowance >= amount, "Allowance insuficiente");
        
        _transfer(sender, recipient, amount);
        _approve(sender, msg.sender, currentAllowance - amount);
        
        return true;
    }
    
    // === FUNCOES INTERNAS ===
    
    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(sender != address(0), "Transfer do endereco zero");
        require(recipient != address(0), "Transfer para endereco zero");
        require(_balances[sender] >= amount, "Saldo insuficiente");
        
        _balances[sender] -= amount;
        _balances[recipient] += amount;
        
        emit Transfer(sender, recipient, amount);
    }
    
    function _approve(address tokenOwner, address spender, uint256 amount) internal {
        require(tokenOwner != address(0), "Approve do endereco zero");
        require(spender != address(0), "Approve para endereco zero");
        
        _allowances[tokenOwner][spender] = amount;
        emit Approval(tokenOwner, spender, amount);
    }
    
    // === FUNCOES ADMINISTRATIVAS ===
    
    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }
    
    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Novo proprietario nao pode ser endereco zero");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
    
    function renounceOwnership() external onlyOwner {
        emit OwnershipTransferred(owner, address(0));
        owner = address(0);
    }
}`;
  },
  
  // Compilar contrato Solidity
  async compileContract(sourceCode, contractName) {
    try {
      const input = {
        language: 'Solidity',
        sources: {
          [`${contractName}.sol`]: {
            content: sourceCode
          }
        },
        settings: {
          outputSelection: {
            '*': {
              '*': ['*']
            }
          },
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      };
      
      const output = JSON.parse(solc.compile(JSON.stringify(input)));
      
      if (output.errors) {
        const hasErrors = output.errors.some(error => error.severity === 'error');
        if (hasErrors) {
          throw new Error('Erros de compilação: ' + output.errors.map(e => e.message).join(', '));
        }
      }
      
      const contract = output.contracts[`${contractName}.sol`][`${contractName}Token`];
      
      return {
        success: true,
        bytecode: contract.evm.bytecode.object,
        abi: contract.abi,
        metadata: contract.metadata
      };
      
    } catch (error) {
      Utils.log('❌ Erro na compilação:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // Calcular endereço CREATE2
  calculateCreate2Address(deployerAddress, salt, bytecode) {
    try {
      const create2Prefix = '0xff';
      const saltHash = crypto.createHash('sha256').update(salt).digest('hex');
      const initCodeHash = crypto.createHash('sha256').update(Buffer.from(bytecode, 'hex')).digest('hex');
      
      const concatenated = create2Prefix + 
                          deployerAddress.slice(2) + 
                          saltHash + 
                          initCodeHash;
      
      const addressHash = crypto.createHash('sha256').update(Buffer.from(concatenated, 'hex')).digest('hex');
      const address = '0x' + addressHash.slice(-40);
      
      return address;
    } catch (error) {
      throw new Error('Erro ao calcular endereço CREATE2: ' + error.message);
    }
  },
  
  // Verificar contrato no explorer
  async verifyContract(address, sourceCode, contractName, network) {
    try {
      const networkConfig = NETWORKS[network];
      if (!networkConfig || !networkConfig.apiKey) {
        return { success: false, error: 'Rede não suportada ou API key não configurada' };
      }
      
      const apiUrl = networkConfig.explorer + '/api';
      const response = await axios.post(apiUrl, {
        module: 'contract',
        action: 'verifysourcecode',
        addressHash: address,
        name: contractName,
        compilerVersion: 'v0.8.19+commit.7dd6d404',
        optimization: true,
        sourceCode: sourceCode,
        apikey: networkConfig.apiKey
      });
      
      if (response.data.status === '1') {
        return { success: true, guid: response.data.result };
      } else {
        return { success: false, error: response.data.result };
      }
      
    } catch (error) {
      Utils.log('❌ Erro na verificação:', error.message);
      return { success: false, error: error.message };
    }
  }
};

// === ROTAS DA API ===

// Rota de status
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    service: 'SCCafé API',
    version: '2.1.0',
    timestamp: new Date().toISOString(),
    networks: Object.keys(NETWORKS)
  });
});

// Rota de compilação
app.post('/api/compile', async (req, res) => {
  try {
    const { name, symbol, totalSupply, customPrefix } = req.body;
    
    // Validações
    if (!name || !symbol || !totalSupply) {
      return res.status(400).json({
        success: false,
        error: 'Nome, símbolo e supply são obrigatórios'
      });
    }
    
    if (!/^[A-Z]{2,10}$/.test(symbol)) {
      return res.status(400).json({
        success: false,
        error: 'Símbolo deve ter 2-10 caracteres maiúsculos'
      });
    }
    
    if (isNaN(totalSupply) || totalSupply <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Supply deve ser um número positivo'
      });
    }
    
    Utils.log('📝 Compilando contrato:', { name, symbol, totalSupply });
    
    // Gerar código do contrato
    const sourceCode = Utils.generateTokenContract(name, symbol, totalSupply);
    
    // Compilar
    const compilation = await Utils.compileContract(sourceCode, symbol);
    
    if (compilation.success) {
      Utils.log('✅ Compilação concluída com sucesso');
      res.json({
        ...compilation,
        sourceCode,
        contractName: symbol + 'Token'
      });
    } else {
      Utils.log('❌ Erro na compilação:', compilation.error);
      res.status(500).json(compilation);
    }
    
  } catch (error) {
    Utils.log('❌ Erro na rota de compilação:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Rota de cálculo de endereço CREATE2
app.post('/api/calculate-address', async (req, res) => {
  try {
    const { bytecode, customPrefix, deployer } = req.body;
    
    if (!bytecode || !deployer) {
      return res.status(400).json({
        success: false,
        error: 'Bytecode e deployer são obrigatórios'
      });
    }
    
    Utils.log('🧮 Calculando endereço CREATE2:', { customPrefix, deployer });
    
    // Gerar salt baseado no prefixo customizado
    let salt = customPrefix || '';
    let attempts = 0;
    let targetAddress = null;
    
    // Se tem prefixo personalizado, tentar encontrar endereço que comece com ele
    if (customPrefix && customPrefix.length > 0) {
      const target = customPrefix.toLowerCase();
      
      for (let i = 0; i < 10000; i++) {
        const testSalt = salt + i.toString().padStart(8, '0');
        const address = Utils.calculateCreate2Address(deployer, testSalt, bytecode);
        
        if (address.toLowerCase().slice(2, 2 + target.length) === target) {
          targetAddress = address;
          salt = testSalt;
          attempts = i + 1;
          break;
        }
      }
    }
    
    // Se não encontrou com prefixo ou não tem prefixo, usar salt simples
    if (!targetAddress) {
      salt = customPrefix + Date.now().toString();
      targetAddress = Utils.calculateCreate2Address(deployer, salt, bytecode);
    }
    
    Utils.log('✅ Endereço calculado:', targetAddress, 'após', attempts, 'tentativas');
    
    res.json({
      success: true,
      address: targetAddress,
      salt,
      attempts,
      hasCustomPrefix: !!customPrefix
    });
    
  } catch (error) {
    Utils.log('❌ Erro no cálculo de endereço:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erro ao calcular endereço CREATE2'
    });
  }
});

// Rota de verificação
app.post('/api/verify', async (req, res) => {
  try {
    const { address, network, sourceCode, contractName } = req.body;
    
    if (!address || !network) {
      return res.status(400).json({
        success: false,
        error: 'Endereço e rede são obrigatórios'
      });
    }
    
    Utils.log('🔍 Verificando contrato:', { address, network });
    
    const result = await Utils.verifyContract(address, sourceCode, contractName, network);
    
    if (result.success) {
      Utils.log('✅ Contrato verificado com sucesso');
    } else {
      Utils.log('❌ Erro na verificação:', result.error);
    }
    
    res.json(result);
    
  } catch (error) {
    Utils.log('❌ Erro na rota de verificação:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Middleware de erro
app.use((error, req, res, next) => {
  Utils.log('❌ Erro não tratado:', error.message);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor'
  });
});

// Rota 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint não encontrado'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  Utils.log('🚀 Servidor iniciado na porta', PORT);
  Utils.log('📋 Endpoints disponíveis:');
  Utils.log('  GET  /api/status');
  Utils.log('  POST /api/compile');
  Utils.log('  POST /api/calculate-address'); 
  Utils.log('  POST /api/verify');
});

module.exports = app;
