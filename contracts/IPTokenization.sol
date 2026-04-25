// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IPTokenization
 * @dev ERC-20 token representing fractional ownership of intellectual property
 * Each IP asset gets its own token contract instance
 */
contract IPTokenization is ERC20, ERC20Burnable, Ownable {
    // IP metadata
    string public ipTitle;
    string public ipDescription;
    address public ipCreator;
    uint256 public launchTimestamp;
    
    // Trading parameters
    uint256 public constant LAUNCH_DURATION = 14 days;
    uint256 public constant MATURE_DURATION = 30 days;
    
    // Status tracking
    enum IPStatus { CREATED, LAUNCH_PHASE, PUBLIC_TRADING, MATURE }
    IPStatus public currentStatus;
    
    // Liquidity pool state
    uint256 public liquidityPoolBalance; // USD equivalent
    uint256 public totalTokensMinted;
    
    // Events
    event StatusChanged(IPStatus newStatus, uint256 timestamp);
    event LiquidityAdded(uint256 usdAmount, uint256 tokenAmount);
    event EmergencyBurn(uint256 tokenAmount, uint256 usdDistributed);
    
    constructor(
        string memory _ipTitle,
        string memory _ipDescription,
        address _ipCreator,
        uint256 _initialLiquidityUSD,
        uint256 _totalTokens
    ) ERC20(_ipTitle, "IP") Ownable() {
        ipTitle = _ipTitle;
        ipDescription = _ipDescription;
        ipCreator = _ipCreator;
        launchTimestamp = block.timestamp;
        currentStatus = IPStatus.CREATED;
        
        totalTokensMinted = _totalTokens;
        liquidityPoolBalance = _initialLiquidityUSD;
        
        // Mint initial tokens to marketplace/liquidity pool
        _mint(address(this), _totalTokens);
        
        emit LiquidityAdded(_initialLiquidityUSD, _totalTokens);
    }
    
    /**
     * @dev Update IP status based on elapsed time
     */
    function updateStatus() external {
        uint256 elapsed = block.timestamp - launchTimestamp;
        IPStatus newStatus = currentStatus;
        
        if (currentStatus == IPStatus.CREATED && elapsed >= 1 days) {
            newStatus = IPStatus.LAUNCH_PHASE;
        } else if (currentStatus == IPStatus.LAUNCH_PHASE && elapsed >= LAUNCH_DURATION) {
            newStatus = IPStatus.PUBLIC_TRADING;
        } else if (currentStatus == IPStatus.PUBLIC_TRADING && elapsed >= LAUNCH_DURATION + MATURE_DURATION) {
            newStatus = IPStatus.MATURE;
        }
        
        if (newStatus != currentStatus) {
            currentStatus = newStatus;
            emit StatusChanged(newStatus, block.timestamp);
        }
    }
    
    /**
     * @dev Get current token price based on liquidity pool
     */
    function getPricePerToken() external view returns (uint256) {
        if (totalTokensMinted == 0) return 0;
        return (liquidityPoolBalance * 1e18) / totalTokensMinted;
    }
    
    /**
     * @dev Add liquidity to the pool (emergency burn recovery)
     */
    function addLiquidity(uint256 usdAmount) external onlyOwner {
        liquidityPoolBalance += usdAmount;
        emit LiquidityAdded(usdAmount, 0);
    }
    
    /**
     * @dev Emergency burn: proportional distribution to token holders
     */
    function emergencyBurn(uint256 tokensToBurn) external onlyOwner {
        require(tokensToBurn > 0 && tokensToBurn <= totalTokensMinted, "Invalid burn amount");
        
        uint256 usdToDistribute = (liquidityPoolBalance * tokensToBurn) / totalTokensMinted;
        
        _burn(address(this), tokensToBurn);
        totalTokensMinted -= tokensToBurn;
        liquidityPoolBalance -= usdToDistribute;
        
        emit EmergencyBurn(tokensToBurn, usdToDistribute);
    }
}
