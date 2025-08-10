
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Token.sol";

/**
 * @title TokenFactory
 * @dev Factory contract for deploying tokens with CREATE2
 */
contract TokenFactory {
    using Create2 for bytes32;
    
    address public owner;
    uint256 public standardFee = 0.01 ether;
    uint256 public customFee = 0.02 ether;
    
    // Mapping para rastrear tokens criados por usuário
    mapping(address => address[]) public userTokens;
    
    // Array com todos os tokens criados
    address[] public allTokens;
    
    // Mapping para verificar se um endereço é um token criado por esta factory
    mapping(address => bool) public isTokenFromFactory;
    
    event TokenDeployed(
        address indexed tokenAddress,
        string name,
        string symbol,
        uint256 totalSupply,
        address indexed creator,
        bytes32 salt,
        string customSuffix
    );
    
    event FeesUpdated(uint256 standardFee, uint256 customFee);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Deploy token padrão com sufixo "cafe"
     */
    function deployStandardToken(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        uint8 decimals
    ) external payable returns (address) {
        require(msg.value >= standardFee, "Insufficient fee");
        
        // Usar salt baseado no sufixo padrão "cafe"
        bytes32 salt = findSaltForSuffix("cafe");
        
        address tokenAddress = _deployToken(
            name,
            symbol,
            totalSupply,
            decimals,
            salt
        );
        
        emit TokenDeployed(
            tokenAddress,
            name,
            symbol,
            totalSupply,
            msg.sender,
            salt,
            "cafe"
        );
        
        return tokenAddress;
    }
    
    /**
     * @dev Deploy token com sufixo personalizado
     */
    function deployCustomToken(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        uint8 decimals,
        string memory customSuffix
    ) external payable returns (address) {
        require(msg.value >= customFee, "Insufficient fee");
        require(bytes(customSuffix).length <= 4, "Suffix too long");
        require(_isValidHexSuffix(customSuffix), "Invalid hex suffix");
        
        bytes32 salt = findSaltForSuffix(customSuffix);
        
        address tokenAddress = _deployToken(
            name,
            symbol,
            totalSupply,
            decimals,
            salt
        );
        
        emit TokenDeployed(
            tokenAddress,
            name,
            symbol,
            totalSupply,
            msg.sender,
            salt,
            customSuffix
        );
        
        return tokenAddress;
    }
    
    /**
     * @dev Deploy token com salt específico
     */
    function deployWithSalt(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        uint8 decimals,
        bytes32 salt
    ) external payable returns (address) {
        require(msg.value >= standardFee, "Insufficient fee");
        
        address tokenAddress = _deployToken(
            name,
            symbol,
            totalSupply,
            decimals,
            salt
        );
        
        emit TokenDeployed(
            tokenAddress,
            name,
            symbol,
            totalSupply,
            msg.sender,
            salt,
            ""
        );
        
        return tokenAddress;
    }
    
    /**
     * @dev Função interna para deploy do token
     */
    function _deployToken(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        uint8 decimals,
        bytes32 salt
    ) internal returns (address) {
        bytes memory bytecode = abi.encodePacked(
            type(Token).creationCode,
            abi.encode(name, symbol, totalSupply, decimals)
        );
        
        address tokenAddress = Create2.deploy(0, salt, bytecode);
        require(tokenAddress != address(0), "Token deployment failed");
        
        // Registrar token
        userTokens[msg.sender].push(tokenAddress);
        allTokens.push(tokenAddress);
        isTokenFromFactory[tokenAddress] = true;
        
        return tokenAddress;
    }
    
    /**
     * @dev Encontrar salt para um sufixo específico
     */
    function findSaltForSuffix(string memory suffix) public view returns (bytes32) {
        bytes memory suffixBytes = bytes(suffix);
        require(suffixBytes.length <= 4, "Suffix too long");
        
        // Para demo, usar hash do sufixo como base
        // Em produção, implementar busca por brute force off-chain
        bytes32 baseSalt = keccak256(abi.encodePacked(suffix, block.timestamp, msg.sender));
        
        return baseSalt;
    }
    
    /**
     * @dev Prever endereço do token antes do deploy
     */
    function predictTokenAddress(bytes32 salt) external view returns (address) {
        bytes memory bytecode = abi.encodePacked(
            type(Token).creationCode,
            abi.encode("", "", 0, 18) // Valores dummy para cálculo
        );
        
        bytes32 bytecodeHash = keccak256(bytecode);
        return Create2.computeAddress(salt, bytecodeHash, address(this));
    }
    
    /**
     * @dev Obter tokens criados por um usuário
     */
    function getUserTokens(address user) external view returns (address[] memory) {
        return userTokens[user];
    }
    
    /**
     * @dev Obter total de tokens criados
     */
    function getTotalTokens() external view returns (uint256) {
        return allTokens.length;
    }
    
    /**
     * @dev Obter token por índice
     */
    function getTokenAtIndex(uint256 index) external view returns (address) {
        require(index < allTokens.length, "Index out of bounds");
        return allTokens[index];
    }
    
    /**
     * @dev Validar sufixo hexadecimal
     */
    function _isValidHexSuffix(string memory suffix) internal pure returns (bool) {
        bytes memory suffixBytes = bytes(suffix);
        
        for (uint i = 0; i < suffixBytes.length; i++) {
            bytes1 char = suffixBytes[i];
            if (!(char >= 0x30 && char <= 0x39) && // 0-9
                !(char >= 0x41 && char <= 0x46) && // A-F
                !(char >= 0x61 && char <= 0x66)) { // a-f
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * @dev Atualizar taxas (apenas owner)
     */
    function updateFees(uint256 _standardFee, uint256 _customFee) external onlyOwner {
        standardFee = _standardFee;
        customFee = _customFee;
        emit FeesUpdated(_standardFee, _customFee);
    }
    
    /**
     * @dev Sacar fundos (apenas owner)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @dev Transferir propriedade (apenas owner)
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
    
    // Getters para as taxas
    function STANDARD_FEE() external view returns (uint256) {
        return standardFee;
    }
    
    function CUSTOM_FEE() external view returns (uint256) {
        return customFee;
    }
}

/**
 * @dev Library para operações CREATE2
 */
library Create2 {
    function deploy(
        uint256 amount,
        bytes32 salt,
        bytes memory bytecode
    ) internal returns (address) {
        address addr;
        require(address(this).balance >= amount, "Create2: insufficient balance");
        require(bytecode.length != 0, "Create2: bytecode length is zero");
        assembly {
            addr := create2(amount, add(bytecode, 0x20), mload(bytecode), salt)
        }
        require(addr != address(0), "Create2: Failed on deploy");
        return addr;
    }

    function computeAddress(
        bytes32 salt,
        bytes32 bytecodeHash,
        address deployer
    ) internal pure returns (address) {
        return address(uint160(uint(keccak256(abi.encodePacked(
            bytes1(0xff),
            deployer,
            salt,
            bytecodeHash
        )))));
    }
}
