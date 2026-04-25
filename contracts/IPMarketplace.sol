// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title IPMarketplace
 * @dev Automated Market Maker (AMM) for trading IP tokens
 * Uses constant product formula: x * y = k
 * Handles buy/sell operations and fee distribution
 */
contract IPMarketplace is Ownable, ReentrancyGuard {
    
    // Trading state for each IP token
    struct TradingPool {
        address ipTokenAddress;
        uint256 tokenReserve;      // Amount of IP tokens in pool
        uint256 usdReserve;        // Amount of USD (USDC/USDT equivalent) in pool
        uint256 createdAt;
        bool isActive;
        address creator;
    }
    
    // Transaction record for on-chain history
    struct Transaction {
        address trader;
        address ipToken;
        bool isBuy;                // true for buy, false for sell
        uint256 tokenAmount;
        uint256 usdAmount;
        uint256 feeAmount;
        uint256 timestamp;
    }
    
    // State variables
    mapping(address => TradingPool) public pools;
    mapping(address => Transaction[]) public transactionHistory;
    Transaction[] public allTransactions;
    
    uint256 public constant FEE_PERCENTAGE = 30; // 0.3% = 30/10000
    uint256 public constant FEE_DIVISOR = 10000;
    
    address public feeCollector;
    
    // Events
    event PoolCreated(address indexed ipToken, address indexed creator, uint256 initialTokens, uint256 initialUSD);
    event TokensBought(address indexed buyer, address indexed ipToken, uint256 tokenAmount, uint256 usdPaid, uint256 fee);
    event TokensSold(address indexed seller, address indexed ipToken, uint256 tokenAmount, uint256 usdReceived, uint256 fee);
    event TransactionRecorded(address indexed trader, address indexed ipToken, bool isBuy, uint256 timestamp);
    
    constructor(address _feeCollector) Ownable(msg.sender) {
        require(_feeCollector != address(0), "Invalid fee collector");
        feeCollector = _feeCollector;
    }
    
    /**
     * @dev Create a new trading pool for an IP token
     * Initial liquidity is added during pool creation
     */
    function createPool(
        address _ipTokenAddress,
        address _creator,
        uint256 _initialTokenAmount,
        uint256 _initialUSDAmount
    ) external onlyOwner returns (bool) {
        require(_ipTokenAddress != address(0), "Invalid token address");
        require(_creator != address(0), "Invalid creator address");
        require(_initialTokenAmount > 0 && _initialUSDAmount > 0, "Invalid amounts");
        require(!pools[_ipTokenAddress].isActive, "Pool already exists");
        
        pools[_ipTokenAddress] = TradingPool({
            ipTokenAddress: _ipTokenAddress,
            tokenReserve: _initialTokenAmount,
            usdReserve: _initialUSDAmount,
            createdAt: block.timestamp,
            isActive: true,
            creator: _creator
        });
        
        emit PoolCreated(_ipTokenAddress, _creator, _initialTokenAmount, _initialUSDAmount);
        return true;
    }
    
    /**
     * @dev Calculate output amount using constant product formula
     * (x + dx) * (y - dy) = x * y
     * dy = y * dx / (x + dx)
     */
    function calculateOutputAmount(
        uint256 inputAmount,
        uint256 inputReserve,
        uint256 outputReserve
    ) public pure returns (uint256) {
        require(inputAmount > 0 && inputReserve > 0 && outputReserve > 0, "Invalid amounts");
        
        uint256 inputWithFee = inputAmount * (FEE_DIVISOR - FEE_PERCENTAGE) / FEE_DIVISOR;
        uint256 numerator = inputWithFee * outputReserve;
        uint256 denominator = inputReserve + inputWithFee;
        
        return numerator / denominator;
    }
    
    /**
     * @dev Buy IP tokens with USD
     */
    function buyTokens(
        address _ipToken,
        uint256 _usdAmount
    ) external nonReentrant returns (uint256 tokensReceived) {
        require(pools[_ipToken].isActive, "Pool not active");
        require(_usdAmount > 0, "Invalid USD amount");
        
        TradingPool storage pool = pools[_ipToken];
        
        // Calculate tokens to receive (after 0.3% fee)
        tokensReceived = calculateOutputAmount(
            _usdAmount,
            pool.usdReserve,
            pool.tokenReserve
        );
        
        require(tokensReceived > 0, "Insufficient output");
        
        // Calculate fee
        uint256 fee = (_usdAmount * FEE_PERCENTAGE) / FEE_DIVISOR;
        
        // Update pool reserves
        pool.usdReserve += _usdAmount;
        pool.tokenReserve -= tokensReceived;
        
        // Record transaction on-chain
        Transaction memory txRecord = Transaction({
            trader: msg.sender,
            ipToken: _ipToken,
            isBuy: true,
            tokenAmount: tokensReceived,
            usdAmount: _usdAmount,
            feeAmount: fee,
            timestamp: block.timestamp
        });
        
        transactionHistory[msg.sender].push(txRecord);
        allTransactions.push(txRecord);
        
        emit TokensBought(msg.sender, _ipToken, tokensReceived, _usdAmount, fee);
        emit TransactionRecorded(msg.sender, _ipToken, true, block.timestamp);
        
        // TODO: In production, use IERC20 to transfer USD and tokens
        // Requires: msg.sender approves USDC/USDT to this contract
        // IERC20(usdToken).transferFrom(msg.sender, address(this), _usdAmount);
        // IERC20(_ipToken).transfer(msg.sender, tokensReceived);
        
        return tokensReceived;
    }
    
    /**
     * @dev Sell IP tokens for USD
     */
    function sellTokens(
        address _ipToken,
        uint256 _tokenAmount
    ) external nonReentrant returns (uint256 usdReceived) {
        require(pools[_ipToken].isActive, "Pool not active");
        require(_tokenAmount > 0, "Invalid token amount");
        
        TradingPool storage pool = pools[_ipToken];
        
        // Calculate USD to receive (after 0.3% fee)
        usdReceived = calculateOutputAmount(
            _tokenAmount,
            pool.tokenReserve,
            pool.usdReserve
        );
        
        require(usdReceived > 0, "Insufficient output");
        
        // Calculate fee
        uint256 fee = (usdReceived * FEE_PERCENTAGE) / FEE_DIVISOR;
        uint256 netUsdAmount = usdReceived - fee;
        
        // Update pool reserves
        pool.tokenReserve += _tokenAmount;
        pool.usdReserve -= usdReceived;
        
        // Record transaction on-chain
        Transaction memory txRecord = Transaction({
            trader: msg.sender,
            ipToken: _ipToken,
            isBuy: false,
            tokenAmount: _tokenAmount,
            usdAmount: netUsdAmount,
            feeAmount: fee,
            timestamp: block.timestamp
        });
        
        transactionHistory[msg.sender].push(txRecord);
        allTransactions.push(txRecord);
        
        emit TokensSold(msg.sender, _ipToken, _tokenAmount, netUsdAmount, fee);
        emit TransactionRecorded(msg.sender, _ipToken, false, block.timestamp);
        
        // TODO: In production, use IERC20 to transfer tokens
        // IERC20(_ipToken).transferFrom(msg.sender, address(this), _tokenAmount);
        // IERC20(usdToken).transfer(msg.sender, netUsdAmount);
        // IERC20(usdToken).transfer(feeCollector, fee);
        
        return netUsdAmount;
    }
    
    /**
     * @dev Get all transactions for a user (on-chain history)
     */
    function getUserTransactions(address _user) external view returns (Transaction[] memory) {
        return transactionHistory[_user];
    }
    
    /**
     * @dev Get transaction count
     */
    function getTransactionCount(address _user) external view returns (uint256) {
        return transactionHistory[_user].length;
    }
    
    /**
     * @dev Get all transactions across platform
     */
    function getAllTransactions() external view returns (Transaction[] memory) {
        return allTransactions;
    }
    
    /**
     * @dev Get pool info
     */
    function getPoolInfo(address _ipToken) external view returns (TradingPool memory) {
        require(pools[_ipToken].isActive, "Pool not found");
        return pools[_ipToken];
    }
}
