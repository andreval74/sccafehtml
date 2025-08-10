
const express = require('express');
const router = express.Router();
const tokenService = require('../services/tokenService');

// Obter informações do token
router.get('/token-info/:network/:address', async (req, res) => {
    try {
        const { network, address } = req.params;

        const tokenInfo = await tokenService.getTokenInfo(network, address);

        res.json({
            success: true,
            data: tokenInfo
        });

    } catch (error) {
        console.error('Erro ao obter informações do token:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obter tokens do usuário
router.get('/user-tokens/:network/:address', async (req, res) => {
    try {
        const { network, address } = req.params;

        const tokens = await tokenService.getUserTokens(network, address);

        res.json({
            success: true,
            data: { tokens }
        });

    } catch (error) {
        console.error('Erro ao obter tokens do usuário:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obter preço do token
router.get('/token-price/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;

        const price = await tokenService.getTokenPrice(symbol);

        res.json({
            success: true,
            data: { symbol, price }
        });

    } catch (error) {
        console.error('Erro ao obter preço do token:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Criar pool de liquidez
router.post('/create-liquidity-pool', async (req, res) => {
    try {
        const poolData = req.body;

        const result = await tokenService.createLiquidityPool(poolData);

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Erro ao criar pool de liquidez:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obter histórico de transações do token
router.get('/token-transactions/:network/:address', async (req, res) => {
    try {
        const { network, address } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const transactions = await tokenService.getTokenTransactions(
            network, 
            address, 
            parseInt(page), 
            parseInt(limit)
        );

        res.json({
            success: true,
            data: {
                transactions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: transactions.length
                }
            }
        });

    } catch (error) {
        console.error('Erro ao obter transações do token:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Verificar se token existe
router.get('/token-exists/:network/:address', async (req, res) => {
    try {
        const { network, address } = req.params;

        const exists = await tokenService.tokenExists(network, address);

        res.json({
            success: true,
            data: { exists }
        });

    } catch (error) {
        console.error('Erro ao verificar existência do token:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
