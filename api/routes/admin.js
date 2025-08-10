
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Middleware de autenticação admin
const authenticateAdmin = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: 'Token de acesso necessário' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
        req.admin = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
};

// Login admin (simples - implementar autenticação real)
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Credenciais padrão (substituir por sistema real)
        const adminCredentials = {
            username: process.env.ADMIN_USERNAME || 'admin',
            password: process.env.ADMIN_PASSWORD || 'admin123'
        };
        
        if (username === adminCredentials.username && password === adminCredentials.password) {
            const token = jwt.sign(
                { username, role: 'admin' },
                process.env.JWT_SECRET || 'default-secret',
                { expiresIn: '24h' }
            );
            
            res.json({
                success: true,
                token,
                user: { username, role: 'admin' }
            });
        } else {
            res.status(401).json({
                success: false,
                error: 'Credenciais inválidas'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obter configurações
router.get('/config', authenticateAdmin, (req, res) => {
    try {
        // Retornar configurações do sistema
        const config = {
            general: {
                platformName: process.env.PLATFORM_NAME || 'SCCafé',
                defaultLanguage: process.env.DEFAULT_LANGUAGE || 'pt',
                defaultNetwork: process.env.DEFAULT_NETWORK || '97',
                demoMode: process.env.DEMO_MODE === 'true',
                apiUrl: process.env.API_URL || 'http://localhost:3000'
            },
            networks: {
                97: {
                    enabled: true,
                    rpcUrl: process.env.BSC_TESTNET_RPC,
                    factoryContract: process.env.FACTORY_BSC_TESTNET
                },
                56: {
                    enabled: process.env.BSC_MAINNET_ENABLED === 'true',
                    rpcUrl: process.env.BSC_MAINNET_RPC,
                    factoryContract: process.env.FACTORY_BSC_MAINNET
                }
            },
            apiKeys: {
                etherscan: !!process.env.ETHERSCAN_API_KEY,
                bscscan: !!process.env.BSCSCAN_API_KEY
            }
        };
        
        res.json({
            success: true,
            data: config
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Salvar configurações
router.post('/config', authenticateAdmin, (req, res) => {
    try {
        const config = req.body;
        
        // Aqui você salvaria as configurações em um banco de dados
        // Por enquanto, apenas logamos
        console.log('Configurações recebidas:', config);
        
        res.json({
            success: true,
            message: 'Configurações salvas com sucesso'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obter logs do sistema
router.get('/logs', authenticateAdmin, (req, res) => {
    try {
        const { lines = 100 } = req.query;
        
        // Implementar leitura de logs reais
        const logs = [
            {
                timestamp: new Date().toISOString(),
                level: 'info',
                message: 'Sistema iniciado com sucesso'
            },
            {
                timestamp: new Date(Date.now() - 60000).toISOString(),
                level: 'info',
                message: 'Deploy de token realizado na BSC Testnet'
            }
        ];
        
        res.json({
            success: true,
            data: logs.slice(0, parseInt(lines))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Reiniciar sistema
router.post('/restart', authenticateAdmin, (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Sistema será reiniciado em 5 segundos'
        });
        
        // Reiniciar o processo (em produção, use PM2 ou similar)
        setTimeout(() => {
            process.exit(0);
        }, 5000);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obter status do sistema
router.get('/status', authenticateAdmin, (req, res) => {
    try {
        const status = {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            version: require('../package.json').version,
            environment: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString()
        };
        
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
