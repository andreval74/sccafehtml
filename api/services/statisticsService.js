
const NodeCache = require('node-cache');
const fs = require('fs').promises;
const path = require('path');

// Cache para estatísticas
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutos

// Arquivo para persistir dados (em produção, usar banco de dados)
const STATS_FILE = path.join(__dirname, '../data/statistics.json');
const DEPLOYS_FILE = path.join(__dirname, '../data/deploys.json');
const VERIFICATIONS_FILE = path.join(__dirname, '../data/verifications.json');

class StatisticsService {
    constructor() {
        this.ensureDataDirectories();
    }

    // Garantir que diretórios existam
    async ensureDataDirectories() {
        const dataDir = path.join(__dirname, '../data');
        try {
            await fs.mkdir(dataDir, { recursive: true });
        } catch (error) {
            console.error('Erro ao criar diretório de dados:', error);
        }
    }

    // Obter estatísticas gerais
    async getGeneralStatistics() {
        const cacheKey = 'general_stats';
        
        if (cache.has(cacheKey)) {
            return cache.get(cacheKey);
        }

        try {
            const deploys = await this.loadDeploys();
            const verifications = await this.loadVerifications();

            const now = Date.now();
            const last24h = now - (24 * 60 * 60 * 1000);
            const last30d = now - (30 * 24 * 60 * 60 * 1000);

            const stats = {
                totalTokens: deploys.length,
                totalUsers: new Set(deploys.map(d => d.creator)).size,
                totalVerifications: verifications.length,
                
                // Estatísticas das últimas 24 horas
                last24h: {
                    tokens: deploys.filter(d => d.timestamp > last24h).length,
                    verifications: verifications.filter(v => v.timestamp > last24h).length,
                    uniqueUsers: new Set(deploys.filter(d => d.timestamp > last24h).map(d => d.creator)).size
                },
                
                // Estatísticas dos últimos 30 dias
                last30d: {
                    tokens: deploys.filter(d => d.timestamp > last30d).length,
                    verifications: verifications.filter(v => v.timestamp > last30d).length,
                    uniqueUsers: new Set(deploys.filter(d => d.timestamp > last30d).map(d => d.creator)).size
                },
                
                // Estatísticas por rede
                byNetwork: this.calculateNetworkStats(deploys),
                
                // Receita estimada (simulada)
                totalRevenue: (deploys.length * 0.01).toFixed(4), // 0.01 BNB por token
                
                // Top tokens por popularidade
                topTokens: this.getTopTokens(deploys, 10),
                
                timestamp: Date.now()
            };

            cache.set(cacheKey, stats);
            return stats;

        } catch (error) {
            console.error('Erro ao obter estatísticas gerais:', error);
            return this.getDefaultStats();
        }
    }

    // Obter estatísticas de uma rede específica
    async getNetworkStatistics(chainId) {
        const cacheKey = `network_stats_${chainId}`;
        
        if (cache.has(cacheKey)) {
            return cache.get(cacheKey);
        }

        try {
            const deploys = await this.loadDeploys();
            const verifications = await this.loadVerifications();

            const networkDeploys = deploys.filter(d => d.network === chainId);
            const networkVerifications = verifications.filter(v => v.network === chainId);

            const stats = {
                chainId,
                networkName: this.getNetworkName(chainId),
                totalTokens: networkDeploys.length,
                totalVerifications: networkVerifications.length,
                uniqueCreators: new Set(networkDeploys.map(d => d.creator)).size,
                
                // Histórico dos últimos 30 dias
                dailyStats: this.calculateDailyStats(networkDeploys, 30),
                
                // Top creators
                topCreators: this.getTopCreators(networkDeploys, 10),
                
                timestamp: Date.now()
            };

            cache.set(cacheKey, stats, 600); // Cache por 10 minutos
            return stats;

        } catch (error) {
            console.error(`Erro ao obter estatísticas da rede ${chainId}:`, error);
            return {
                chainId,
                networkName: this.getNetworkName(chainId),
                totalTokens: 0,
                totalVerifications: 0,
                uniqueCreators: 0,
                dailyStats: [],
                topCreators: [],
                timestamp: Date.now()
            };
        }
    }

    // Obter dados de uso ao longo do tempo
    async getUsageData(period = '30d') {
        const cacheKey = `usage_data_${period}`;
        
        if (cache.has(cacheKey)) {
            return cache.get(cacheKey);
        }

        try {
            const deploys = await this.loadDeploys();
            const verifications = await this.loadVerifications();

            let days;
            switch (period) {
                case '7d': days = 7; break;
                case '30d': days = 30; break;
                case '90d': days = 90; break;
                default: days = 30;
            }

            const usageData = this.calculateDailyUsage(deploys, verifications, days);

            cache.set(cacheKey, usageData, 600);
            return usageData;

        } catch (error) {
            console.error('Erro ao obter dados de uso:', error);
            return [];
        }
    }

    // Obter top tokens
    async getTopTokens(limit = 10) {
        try {
            const deploys = await this.loadDeploys();
            const verifications = await this.loadVerifications();

            // Combinar dados de deploys e verificações
            const tokens = deploys.map(deploy => {
                const verification = verifications.find(v => v.address === deploy.address);
                return {
                    ...deploy,
                    verified: !!verification,
                    verifiedAt: verification?.timestamp
                };
            });

            // Ordenar por data de criação (mais recentes primeiro)
            tokens.sort((a, b) => b.timestamp - a.timestamp);

            return tokens.slice(0, limit);

        } catch (error) {
            console.error('Erro ao obter top tokens:', error);
            return [];
        }
    }

    // Registrar deploy de token
    async trackDeploy(deployData) {
        try {
            const deploys = await this.loadDeploys();
            
            const newDeploy = {
                id: this.generateId(),
                network: deployData.network,
                address: deployData.address,
                tokenName: deployData.tokenName,
                tokenSymbol: deployData.tokenSymbol,
                creator: deployData.creator,
                timestamp: deployData.timestamp || Date.now(),
                blockNumber: deployData.blockNumber,
                transactionHash: deployData.transactionHash
            };

            deploys.push(newDeploy);
            await this.saveDeploys(deploys);

            // Limpar cache relacionado
            this.clearRelatedCache();

            console.log(`Deploy rastreado: ${deployData.tokenName} (${deployData.address})`);

        } catch (error) {
            console.error('Erro ao rastrear deploy:', error);
        }
    }

    // Registrar verificação de contrato
    async trackVerification(verificationData) {
        try {
            const verifications = await this.loadVerifications();
            
            const newVerification = {
                id: this.generateId(),
                network: verificationData.network,
                address: verificationData.address,
                status: verificationData.status,
                timestamp: verificationData.timestamp || Date.now(),
                guid: verificationData.guid
            };

            verifications.push(newVerification);
            await this.saveVerifications(verifications);

            // Limpar cache relacionado
            this.clearRelatedCache();

            console.log(`Verificação rastreada: ${verificationData.address} (${verificationData.status})`);

        } catch (error) {
            console.error('Erro ao rastrear verificação:', error);
        }
    }

    // Métodos auxiliares

    calculateNetworkStats(deploys) {
        const networks = {};
        
        deploys.forEach(deploy => {
            if (!networks[deploy.network]) {
                networks[deploy.network] = {
                    chainId: deploy.network,
                    name: this.getNetworkName(deploy.network),
                    count: 0,
                    percentage: 0
                };
            }
            networks[deploy.network].count++;
        });

        // Calcular percentuais
        const total = deploys.length;
        Object.values(networks).forEach(network => {
            network.percentage = total > 0 ? ((network.count / total) * 100).toFixed(2) : 0;
        });

        return Object.values(networks);
    }

    calculateDailyStats(deploys, days) {
        const stats = [];
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;

        for (let i = days - 1; i >= 0; i--) {
            const dayStart = now - (i * oneDayMs);
            const dayEnd = dayStart + oneDayMs;
            
            const dayDeploys = deploys.filter(d => 
                d.timestamp >= dayStart && d.timestamp < dayEnd
            );

            stats.push({
                date: new Date(dayStart).toISOString().split('T')[0],
                deploys: dayDeploys.length,
                uniqueUsers: new Set(dayDeploys.map(d => d.creator)).size
            });
        }

        return stats;
    }

    calculateDailyUsage(deploys, verifications, days) {
        const usage = [];
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;

        for (let i = days - 1; i >= 0; i--) {
            const dayStart = now - (i * oneDayMs);
            const dayEnd = dayStart + oneDayMs;
            
            const dayDeploys = deploys.filter(d => 
                d.timestamp >= dayStart && d.timestamp < dayEnd
            );
            
            const dayVerifications = verifications.filter(v => 
                v.timestamp >= dayStart && v.timestamp < dayEnd
            );

            usage.push({
                date: new Date(dayStart).toISOString().split('T')[0],
                deploys: dayDeploys.length,
                verifications: dayVerifications.length,
                totalTransactions: dayDeploys.length + dayVerifications.length
            });
        }

        return usage;
    }

    getTopCreators(deploys, limit) {
        const creators = {};
        
        deploys.forEach(deploy => {
            if (!creators[deploy.creator]) {
                creators[deploy.creator] = {
                    address: deploy.creator,
                    tokenCount: 0,
                    tokens: []
                };
            }
            creators[deploy.creator].tokenCount++;
            creators[deploy.creator].tokens.push({
                name: deploy.tokenName,
                symbol: deploy.tokenSymbol,
                address: deploy.address,
                timestamp: deploy.timestamp
            });
        });

        return Object.values(creators)
            .sort((a, b) => b.tokenCount - a.tokenCount)
            .slice(0, limit);
    }

    getNetworkName(chainId) {
        const networks = {
            '97': 'BSC Testnet',
            '56': 'BSC Mainnet',
            '1': 'Ethereum',
            '137': 'Polygon'
        };
        return networks[chainId] || `Network ${chainId}`;
    }

    // Métodos de persistência

    async loadDeploys() {
        try {
            const data = await fs.readFile(DEPLOYS_FILE, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // Arquivo não existe ou erro de leitura
            return [];
        }
    }

    async saveDeploys(deploys) {
        try {
            await fs.writeFile(DEPLOYS_FILE, JSON.stringify(deploys, null, 2));
        } catch (error) {
            console.error('Erro ao salvar deploys:', error);
        }
    }

    async loadVerifications() {
        try {
            const data = await fs.readFile(VERIFICATIONS_FILE, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    }

    async saveVerifications(verifications) {
        try {
            await fs.writeFile(VERIFICATIONS_FILE, JSON.stringify(verifications, null, 2));
        } catch (error) {
            console.error('Erro ao salvar verificações:', error);
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    clearRelatedCache() {
        const keys = cache.keys();
        keys.forEach(key => {
            if (key.includes('stats') || key.includes('usage')) {
                cache.del(key);
            }
        });
    }

    getDefaultStats() {
        return {
            totalTokens: 0,
            totalUsers: 0,
            totalVerifications: 0,
            last24h: { tokens: 0, verifications: 0, uniqueUsers: 0 },
            last30d: { tokens: 0, verifications: 0, uniqueUsers: 0 },
            byNetwork: [],
            totalRevenue: '0.0000',
            topTokens: [],
            timestamp: Date.now()
        };
    }
}

module.exports = new StatisticsService();
