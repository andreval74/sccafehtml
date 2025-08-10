
const Joi = require('joi');

// Validação para deploy de contrato
const deploySchema = Joi.object({
    network: Joi.string().valid('97', '56', '1', '137').required(),
    contractType: Joi.string().valid('standard', 'custom').default('standard'),
    name: Joi.string().min(1).max(50).required(),
    symbol: Joi.string().min(1).max(10).required(),
    totalSupply: Joi.number().positive().required(),
    decimals: Joi.number().integer().min(0).max(18).default(18),
    customSuffix: Joi.string().regex(/^[0-9a-fA-F]{1,4}$/).optional(),
    useCustomSuffix: Joi.boolean().default(false),
    deployerPrivateKey: Joi.string().optional()
});

// Validação para compilação de contrato
const compileSchema = Joi.object({
    sourceCode: Joi.string().min(1).required(),
    contractName: Joi.string().min(1).max(50).required(),
    compilerVersion: Joi.string().optional()
});

// Validação para verificação de contrato
const verifySchema = Joi.object({
    network: Joi.string().valid('97', '56', '1', '137').required(),
    address: Joi.string().regex(/^0x[a-fA-F0-9]{40}$/).required(),
    sourceCode: Joi.string().min(1).required(),
    contractName: Joi.string().min(1).max(50).default('Token'),
    compilerVersion: Joi.string().default('v0.8.19+commit.7dd6d404'),
    optimizationUsed: Joi.boolean().default(false),
    runs: Joi.number().integer().min(1).max(10000).default(200),
    constructorArguments: Joi.string().default('')
});

// Middleware de validação genérico
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                success: false,
                error: 'Dados de entrada inválidos',
                details: errors
            });
        }

        req.body = value;
        next();
    };
};

// Validação específica para endereço Ethereum
const validateAddress = (req, res, next) => {
    const { address } = req.params;
    
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return res.status(400).json({
            success: false,
            error: 'Endereço Ethereum inválido'
        });
    }
    
    next();
};

// Validação para network ID
const validateNetwork = (req, res, next) => {
    const { network } = req.params;
    const validNetworks = ['97', '56', '1', '137'];
    
    if (!validNetworks.includes(network)) {
        return res.status(400).json({
            success: false,
            error: 'Rede não suportada',
            supportedNetworks: validNetworks
        });
    }
    
    next();
};

// Validação para parâmetros de paginação
const validatePagination = (req, res, next) => {
    const { page = 1, limit = 20 } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    if (isNaN(pageNum) || pageNum < 1) {
        return res.status(400).json({
            success: false,
            error: 'Número da página deve ser um inteiro positivo'
        });
    }
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
            success: false,
            error: 'Limite deve ser um inteiro entre 1 e 100'
        });
    }
    
    req.pagination = { page: pageNum, limit: limitNum };
    next();
};

// Sanitização de dados
const sanitize = (req, res, next) => {
    // Remover campos potencialmente perigosos
    const dangerousFields = ['__proto__', 'constructor', 'prototype'];
    
    const sanitizeObject = (obj) => {
        if (typeof obj !== 'object' || obj === null) return obj;
        
        for (const key of dangerousFields) {
            delete obj[key];
        }
        
        Object.keys(obj).forEach(key => {
            if (typeof obj[key] === 'string') {
                // Remover caracteres potencialmente perigosos
                obj[key] = obj[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            } else if (typeof obj[key] === 'object') {
                sanitizeObject(obj[key]);
            }
        });
        
        return obj;
    };
    
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    
    next();
};

module.exports = {
    validateDeployRequest: validate(deploySchema),
    validateCompileRequest: validate(compileSchema),
    validateVerifyRequest: validate(verifySchema),
    validateAddress,
    validateNetwork,
    validatePagination,
    sanitize
};
