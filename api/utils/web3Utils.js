
const { ethers } = require('ethers');

class Web3Utils {
    // Validar endereço Ethereum
    static isValidAddress(address) {
        try {
            return ethers.utils.isAddress(address);
        } catch (error) {
            return false;
        }
    }

    // Formatar endereço para exibição
    static formatAddress(address, chars = 4) {
        if (!address || !this.isValidAddress(address)) {
            return '';
        }
        
        return `${address.substring(0, 6)}...${address.substring(address.length - chars)}`;
    }

    // Converter para Wei
    static toWei(value, decimals = 18) {
        try {
            return ethers.utils.parseUnits(value.toString(), decimals);
        } catch (error) {
            throw new Error(`Erro ao converter para Wei: ${error.message}`);
        }
    }

    // Converter de Wei
    static fromWei(value, decimals = 18) {
        try {
            return ethers.utils.formatUnits(value, decimals);
        } catch (error) {
            throw new Error(`Erro ao converter de Wei: ${error.message}`);
        }
    }

    // Gerar salt aleatório para CREATE2
    static generateRandomSalt() {
        return ethers.utils.hexlify(ethers.utils.randomBytes(32));
    }

    // Calcular endereço CREATE2
    static calculateCREATE2Address(factory, salt, bytecodeHash) {
        try {
            return ethers.utils.getCreate2Address(factory, salt, bytecodeHash);
        } catch (error) {
            throw new Error(`Erro ao calcular endereço CREATE2: ${error.message}`);
        }
    }

    // Validar sufixo hexadecimal
    static isValidHexSuffix(suffix) {
        return /^[0-9a-fA-F]{1,4}$/.test(suffix);
    }

    // Encontrar salt para sufixo específico (brute force - usar com cuidado)
    static async findSaltForSuffix(targetSuffix, factoryAddress, bytecodeHash, maxAttempts = 1000000) {
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            const salt = this.generateRandomSalt();
            const address = this.calculateCREATE2Address(factoryAddress, salt, bytecodeHash);
            
            if (address.toLowerCase().endsWith(targetSuffix.toLowerCase())) {
                return salt;
            }
            
            attempts++;
        }
        
        throw new Error(`Salt para sufixo '${targetSuffix}' não encontrado após ${maxAttempts} tentativas`);
    }

    // Validar hash de transação
    static isValidTxHash(hash) {
        return /^0x[a-fA-F0-9]{64}$/.test(hash);
    }

    // Calcular hash de função
    static getFunctionSelector(functionSignature) {
        return ethers.utils.id(functionSignature).slice(0, 10);
    }

    // Decodificar dados de transação
    static decodeFunctionData(abi, data) {
        try {
            const iface = new ethers.utils.Interface(abi);
            return iface.decodeFunctionData(data);
        } catch (error) {
            throw new Error(`Erro ao decodificar dados da função: ${error.message}`);
        }
    }

    // Codificar argumentos do construtor
    static encodeConstructorArgs(types, values) {
        try {
            const abiCoder = new ethers.utils.AbiCoder();
            return abiCoder.encode(types, values);
        } catch (error) {
            throw new Error(`Erro ao codificar argumentos do construtor: ${error.message}`);
        }
    }

    // Decodificar argumentos do construtor
    static decodeConstructorArgs(types, data) {
        try {
            const abiCoder = new ethers.utils.AbiCoder();
            return abiCoder.decode(types, data);
        } catch (error) {
            throw new Error(`Erro ao decodificar argumentos do construtor: ${error.message}`);
        }
    }

    // Calcular gas price recomendado
    static async getRecommendedGasPrice(provider, speed = 'standard') {
        try {
            const gasPrice = await provider.getGasPrice();
            
            switch (speed) {
                case 'slow':
                    return gasPrice.mul(90).div(100); // -10%
                case 'standard':
                    return gasPrice;
                case 'fast':
                    return gasPrice.mul(110).div(100); // +10%
                case 'instant':
                    return gasPrice.mul(120).div(100); // +20%
                default:
                    return gasPrice;
            }
        } catch (error) {
            throw new Error(`Erro ao obter gas price: ${error.message}`);
        }
    }

    // Validar bytecode
    static isValidBytecode(bytecode) {
        return /^0x[a-fA-F0-9]*$/.test(bytecode) && bytecode.length > 2;
    }

    // Extrair eventos de receipt
    static parseEvents(receipt, contractInterface) {
        try {
            const events = [];
            
            for (const log of receipt.logs) {
                try {
                    const parsed = contractInterface.parseLog(log);
                    events.push({
                        name: parsed.name,
                        args: parsed.args,
                        signature: parsed.signature,
                        address: log.address,
                        blockNumber: log.blockNumber,
                        transactionHash: log.transactionHash,
                        logIndex: log.logIndex
                    });
                } catch (error) {
                    // Log não pertence a este contrato
                    continue;
                }
            }
            
            return events;
        } catch (error) {
            throw new Error(`Erro ao parsear eventos: ${error.message}`);
        }
    }

    // Calcular custo de transação
    static calculateTransactionCost(gasUsed, gasPrice) {
        try {
            return ethers.utils.formatEther(gasUsed.mul(gasPrice));
        } catch (error) {
            throw new Error(`Erro ao calcular custo da transação: ${error.message}`);
        }
    }

    // Verificar se endereço é contrato
    static async isContract(provider, address) {
        try {
            const code = await provider.getCode(address);
            return code !== '0x';
        } catch (error) {
            return false;
        }
    }

    // Obter balance de ETH/BNB
    static async getBalance(provider, address) {
        try {
            const balance = await provider.getBalance(address);
            return ethers.utils.formatEther(balance);
        } catch (error) {
            throw new Error(`Erro ao obter saldo: ${error.message}`);
        }
    }

    // Aguardar confirmações de transação
    static async waitForConfirmations(provider, txHash, confirmations = 1, timeout = 60000) {
        try {
            const tx = await provider.getTransaction(txHash);
            if (!tx) {
                throw new Error('Transação não encontrada');
            }
            
            const receipt = await tx.wait(confirmations, timeout);
            return receipt;
        } catch (error) {
            if (error.code === 'TIMEOUT') {
                throw new Error('Timeout aguardando confirmações');
            }
            throw error;
        }
    }

    // Estimar gas com buffer
    static async estimateGasWithBuffer(contract, method, args, bufferPercent = 20) {
        try {
            const estimatedGas = await contract.estimateGas[method](...args);
            const buffer = estimatedGas.mul(bufferPercent).div(100);
            return estimatedGas.add(buffer);
        } catch (error) {
            throw new Error(`Erro ao estimar gas: ${error.message}`);
        }
    }

    // Criar provider com retry
    static createProviderWithRetry(rpcUrl, retries = 3) {
        const provider = new ethers.providers.JsonRpcProvider({
            url: rpcUrl,
            timeout: 10000
        });

        // Configurar retry automático
        provider.on('error', (error) => {
            console.error('Erro no provider:', error);
        });

        return provider;
    }

    // Validar ABI
    static isValidABI(abi) {
        try {
            new ethers.utils.Interface(abi);
            return true;
        } catch (error) {
            return false;
        }
    }
}

module.exports = Web3Utils;
