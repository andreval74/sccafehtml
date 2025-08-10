
const express = require('express');
const router = express.Router();
const statisticsService = require('../services/statisticsService');

// Obter estatísticas gerais
router.get('/', async (req, res) => {
    try {
        const stats = await statisticsService.getGeneralStatistics();

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obter estatísticas por rede
router.get('/network/:chainId', async (req, res) => {
    try {
        const { chainId } = req.params;

        const stats = await statisticsService.getNetworkStatistics(chainId);

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Erro ao obter estatísticas da rede:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obter dados de uso ao longo do tempo
router.get('/usage-data', async (req, res) => {
    try {
        const { period = '30d' } = req.query;

        const usageData = await statisticsService.getUsageData(period);

        res.json({
            success: true,
            data: usageData
        });

    } catch (error) {
        console.error('Erro ao obter dados de uso:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obter top tokens
router.get('/top-tokens', async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const topTokens = await statisticsService.getTopTokens(parseInt(limit));

        res.json({
            success: true,
            data: topTokens
        });

    } catch (error) {
        console.error('Erro ao obter top tokens:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Registrar evento de deploy
router.post('/track-deploy', async (req, res) => {
    try {
        const { network, address, tokenName, tokenSymbol, creator, timestamp } = req.body;

        await statisticsService.trackDeploy({
            network,
            address,
            tokenName,
            tokenSymbol,
            creator,
            timestamp: timestamp || Date.now()
        });

        res.json({
            success: true,
            message: 'Deploy rastreado com sucesso'
        });

    } catch (error) {
        console.error('Erro ao rastrear deploy:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Registrar evento de verificação
router.post('/track-verification', async (req, res) => {
    try {
        const { network, address, status, timestamp } = req.body;

        await statisticsService.trackVerification({
            network,
            address,
            status,
            timestamp: timestamp || Date.now()
        });

        res.json({
            success: true,
            message: 'Verificação rastreada com sucesso'
        });

    } catch (error) {
        console.error('Erro ao rastrear verificação:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
