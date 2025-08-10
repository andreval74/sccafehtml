
const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');

// Health check simples
router.get('/', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: require('../package.json').version
    });
});

// Health check detalhado
router.get('/detailed', async (req, res) => {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {}
    };

    // Verificar conectividade com redes blockchain
    const networks = {
        bsc_testnet: process.env.BSC_TESTNET_RPC,
        bsc_mainnet: process.env.BSC_MAINNET_RPC,
        ethereum: process.env.ETHEREUM_RPC,
        polygon: process.env.POLYGON_RPC
    };

    for (const [name, rpc] of Object.entries(networks)) {
        if (rpc) {
            try {
                const provider = new ethers.providers.JsonRpcProvider(rpc);
                const blockNumber = await provider.getBlockNumber();
                health.services[name] = {
                    status: 'ok',
                    blockNumber,
                    latency: Date.now()
                };
            } catch (error) {
                health.services[name] = {
                    status: 'error',
                    error: error.message
                };
                health.status = 'partial';
            }
        } else {
            health.services[name] = {
                status: 'not_configured'
            };
        }
    }

    res.json(health);
});

module.exports = router;
