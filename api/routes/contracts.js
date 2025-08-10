
const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const solc = require('solc');
const contractService = require('../services/contractService');
const { validateDeployRequest, validateCompileRequest } = require('../middleware/validation');

// Deploy de contrato
router.post('/deploy-contract', validateDeployRequest, async (req, res) => {
    try {
        const {
            network,
            contractType,
            name,
            symbol,
            totalSupply,
            decimals,
            customSuffix,
            useCustomSuffix
        } = req.body;

        console.log(`Iniciando deploy de contrato na rede ${network}`);

        const result = await contractService.deployToken({
            network,
            contractType: contractType || 'standard',
            name,
            symbol,
            totalSupply,
            decimals,
            customSuffix,
            useCustomSuffix
        });

        res.json({
            success: true,
            data: {
                address: result.address,
                transactionHash: result.transactionHash,
                blockNumber: result.blockNumber,
                gasUsed: result.gasUsed,
                deploymentCost: result.deploymentCost
            }
        });

    } catch (error) {
        console.error('Erro no deploy de contrato:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Compilar contrato Solidity
router.post('/compile-contract', validateCompileRequest, async (req, res) => {
    try {
        const { sourceCode, contractName } = req.body;

        console.log(`Compilando contrato: ${contractName}`);

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
                }
            }
        };

        const output = JSON.parse(solc.compile(JSON.stringify(input)));

        if (output.errors) {
            const errors = output.errors.filter(error => error.severity === 'error');
            if (errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Erros de compilação',
                    details: errors
                });
            }
        }

        const contract = output.contracts[`${contractName}.sol`][contractName];
        
        if (!contract) {
            return res.status(400).json({
                success: false,
                error: 'Contrato não encontrado na saída da compilação'
            });
        }

        res.json({
            success: true,
            data: {
                bytecode: contract.evm.bytecode.object,
                abi: contract.abi,
                metadata: contract.metadata,
                warnings: output.errors?.filter(error => error.severity === 'warning') || []
            }
        });

    } catch (error) {
        console.error('Erro na compilação:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obter informações do contrato
router.get('/contract-info/:network/:address', async (req, res) => {
    try {
        const { network, address } = req.params;

        const contractInfo = await contractService.getContractInfo(network, address);

        res.json({
            success: true,
            data: contractInfo
        });

    } catch (error) {
        console.error('Erro ao obter informações do contrato:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Prever endereço do token
router.post('/predict-address', async (req, res) => {
    try {
        const {
            network,
            name,
            symbol,
            totalSupply,
            decimals,
            customSuffix,
            useCustomSuffix
        } = req.body;

        const predictedAddress = await contractService.predictTokenAddress({
            network,
            name,
            symbol,
            totalSupply,
            decimals,
            customSuffix,
            useCustomSuffix
        });

        res.json({
            success: true,
            data: {
                predictedAddress,
                network,
                customSuffix: useCustomSuffix ? customSuffix : null
            }
        });

    } catch (error) {
        console.error('Erro ao prever endereço:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Estimar gas para deploy
router.post('/estimate-gas', async (req, res) => {
    try {
        const gasEstimate = await contractService.estimateDeploymentGas(req.body);

        res.json({
            success: true,
            data: gasEstimate
        });

    } catch (error) {
        console.error('Erro ao estimar gas:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obter ABI do contrato
router.get('/contract-abi/:network/:address', async (req, res) => {
    try {
        const { network, address } = req.params;

        const abi = await contractService.getContractABI(network, address);

        res.json({
            success: true,
            data: { abi }
        });

    } catch (error) {
        console.error('Erro ao obter ABI:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
