
const express = require('express');
const router = express.Router();
const verificationService = require('../services/verificationService');

// Verificar contrato
router.post('/verify-contract', async (req, res) => {
    try {
        const {
            network,
            address,
            sourceCode,
            contractName,
            compilerVersion,
            optimizationUsed,
            runs,
            constructorArguments
        } = req.body;

        console.log(`Iniciando verificação do contrato ${address} na rede ${network}`);

        const result = await verificationService.verifyContract({
            network,
            address,
            sourceCode,
            contractName: contractName || 'Token',
            compilerVersion: compilerVersion || 'v0.8.19+commit.7dd6d404',
            optimizationUsed: optimizationUsed || false,
            runs: runs || 200,
            constructorArguments: constructorArguments || ''
        });

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Erro na verificação:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Verificar status da verificação
router.get('/verification-status/:network/:address', async (req, res) => {
    try {
        const { network, address } = req.params;

        const status = await verificationService.getVerificationStatus(network, address);

        res.json({
            success: true,
            data: status
        });

    } catch (error) {
        console.error('Erro ao obter status da verificação:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obter código fonte verificado
router.get('/source-code/:network/:address', async (req, res) => {
    try {
        const { network, address } = req.params;

        const sourceCode = await verificationService.getSourceCode(network, address);

        res.json({
            success: true,
            data: { sourceCode }
        });

    } catch (error) {
        console.error('Erro ao obter código fonte:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Auto-verificar contrato (usando dados padrão)
router.post('/auto-verify/:network/:address', async (req, res) => {
    try {
        const { network, address } = req.params;
        const { tokenName, tokenSymbol, totalSupply, decimals } = req.body;

        console.log(`Auto-verificando contrato ${address} na rede ${network}`);

        const result = await verificationService.autoVerifyToken({
            network,
            address,
            tokenName,
            tokenSymbol,
            totalSupply,
            decimals
        });

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Erro na auto-verificação:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
