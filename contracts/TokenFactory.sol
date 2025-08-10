
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Token padrão que será criado via CREATE2
contract StandardToken is ERC20 {
    constructor(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        address creator
    ) ERC20(name, symbol) {
        _mint(creator, totalSupply * 10**decimals());
    }
}

// Factory para criar tokens com CREATE2
contract TokenFactory is Ownable {
    event TokenCreated(
        address indexed token,
        address indexed creator,
        string name,
        string symbol,
        uint256 totalSupply,
        bytes32 salt
    );
    
    // Mapping para rastrear tokens criados
    mapping(address => address[]) public creatorTokens;
    address[] public allTokens;
    
    // Taxa de criação (em wei)
    uint256 public creationFee = 0.001 ether; // 0.001 BNB
    
    constructor() {}
    
    /**
     * @dev Cria um novo token usando CREATE2
     * @param name Nome do token
     * @param symbol Símbolo do token
     * @param totalSupply Supply total do token
     * @param salt Valor único para determinismo
     * @return tokenAddress Endereço do token criado
     */
    function createToken(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        bytes32 salt
    ) external payable returns (address tokenAddress) {
        require(msg.value >= creationFee, "Taxa insuficiente");
        require(totalSupply > 0, "Supply deve ser maior que zero");
        require(bytes(name).length > 0, "Nome nao pode estar vazio");
        require(bytes(symbol).length > 0, "Simbolo nao pode estar vazio");
        
        // Calcular endereço antes da criação
        bytes memory bytecode = getCreationCode(name, symbol, totalSupply, msg.sender);
        tokenAddress = computeAddress(salt, bytecode);
        
        // Verificar se token já existe
        require(tokenAddress.code.length == 0, "Token ja existe");
        
        // Criar token usando CREATE2
        assembly {
            tokenAddress := create2(
                0,
                add(bytecode, 0x20),
                mload(bytecode),
                salt
            )
        }
        
        require(tokenAddress != address(0), "Falha na criacao do token");
        
        // Registrar token
        creatorTokens[msg.sender].push(tokenAddress);
        allTokens.push(tokenAddress);
        
        emit TokenCreated(tokenAddress, msg.sender, name, symbol, totalSupply, salt);
    }
    
    /**
     * @dev Calcula o endereço que será gerado pelo CREATE2
     * @param salt Valor único
     * @param bytecode Bytecode do contrato
     * @return Endereço previsto
     */
    function computeAddress(bytes32 salt, bytes memory bytecode) 
        public 
        view 
        returns (address) 
    {
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                salt,
                keccak256(bytecode)
            )
        );
        return address(uint160(uint256(hash)));
    }
    
    /**
     * @dev Retorna o bytecode para criar um token
     * @param name Nome do token
     * @param symbol Símbolo do token
     * @param totalSupply Supply total
     * @param creator Endereço do criador
     * @return Bytecode do contrato
     */
    function getCreationCode(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        address creator
    ) public pure returns (bytes memory) {
        return abi.encodePacked(
            type(StandardToken).creationCode,
            abi.encode(name, symbol, totalSupply, creator)
        );
    }
    
    /**
     * @dev Retorna todos os tokens criados por um endereço
     * @param creator Endereço do criador
     * @return Array de endereços dos tokens
     */
    function getTokensByCreator(address creator) 
        external 
        view 
        returns (address[] memory) 
    {
        return creatorTokens[creator];
    }
    
    /**
     * @dev Retorna informações de um token
     * @param tokenAddress Endereço do token
     */
    function getTokenInfo(address tokenAddress) 
        external 
        view 
        returns (
            string memory name,
            string memory symbol,
            uint256 totalSupply,
            uint8 decimals
        ) 
    {
        StandardToken token = StandardToken(tokenAddress);
        return (
            token.name(),
            token.symbol(),
            token.totalSupply(),
            token.decimals()
        );
    }
    
    /**
     * @dev Retorna o número total de tokens criados
     */
    function getTotalTokensCreated() external view returns (uint256) {
        return allTokens.length;
    }
    
    /**
     * @dev Atualiza a taxa de criação (apenas owner)
     * @param newFee Nova taxa em wei
     */
    function setCreationFee(uint256 newFee) external onlyOwner {
        creationFee = newFee;
    }
    
    /**
     * @dev Retira fundos do contrato (apenas owner)
     */
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    /**
     * @dev Função para receber BNB
     */
    receive() external payable {}
}
