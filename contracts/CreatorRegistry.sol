// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title CreatorRegistry
 * @dev ERC-721 NFT representing verified creator status on the platform
 * Minted once per creator, serves as on-chain proof of creator account
 */
contract CreatorRegistry is ERC721, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private tokenIdCounter;
    
    // Creator metadata storage
    struct CreatorProfile {
        address walletAddress;
        string username;
        string bio;
        string profileImageURI;
        uint256 createdAt;
        uint256 ipLaunchCount;
        bool isActive;
    }
    
    mapping(address => uint256) public addressToTokenId;
    mapping(uint256 => CreatorProfile) public creatorProfiles;
    mapping(string => bool) public usernamesUsed;
    
    // Events
    event CreatorMinted(address indexed creator, uint256 tokenId, string username);
    event CreatorProfileUpdated(address indexed creator, string newUsername);
    event CreatorDeactivated(address indexed creator);
    event IPLaunched(address indexed creator, uint256 newCount);
    
    constructor() ERC721("Creator Registry", "CREATOR") Ownable(msg.sender) {
        tokenIdCounter.increment(); // Start from 1
    }
    
    /**
     * @dev Mint creator NFT (called when creator account is activated)
     */
    function mintCreator(
        address _creatorAddress,
        string calldata _username,
        string calldata _bio,
        string calldata _profileImageURI
    ) external onlyOwner returns (uint256) {
        require(_creatorAddress != address(0), "Invalid creator address");
        require(addressToTokenId[_creatorAddress] == 0, "Creator already registered");
        require(!usernamesUsed[_username], "Username taken");
        require(bytes(_username).length > 0 && bytes(_username).length <= 50, "Invalid username length");
        
        uint256 tokenId = tokenIdCounter.current();
        tokenIdCounter.increment();
        
        // Mark username as used
        usernamesUsed[_username] = true;
        addressToTokenId[_creatorAddress] = tokenId;
        
        // Store creator profile
        creatorProfiles[tokenId] = CreatorProfile({
            walletAddress: _creatorAddress,
            username: _username,
            bio: _bio,
            profileImageURI: _profileImageURI,
            createdAt: block.timestamp,
            ipLaunchCount: 0,
            isActive: true
        });
        
        // Mint NFT
        _safeMint(_creatorAddress, tokenId);
        
        emit CreatorMinted(_creatorAddress, tokenId, _username);
        return tokenId;
    }
    
    /**
     * @dev Update creator profile metadata
     */
    function updateProfile(
        address _creatorAddress,
        string calldata _newBio,
        string calldata _newProfileImageURI
    ) external {
        uint256 tokenId = addressToTokenId[_creatorAddress];
        require(tokenId != 0, "Creator not registered");
        require(ownerOf(tokenId) == msg.sender, "Not creator owner");
        
        CreatorProfile storage profile = creatorProfiles[tokenId];
        profile.bio = _newBio;
        profile.profileImageURI = _newProfileImageURI;
        
        emit CreatorProfileUpdated(_creatorAddress, profile.username);
    }
    
    /**
     * @dev Record IP launch (called by marketplace on new IP creation)
     */
    function recordIPLaunch(address _creatorAddress) external onlyOwner {
        uint256 tokenId = addressToTokenId[_creatorAddress];
        require(tokenId != 0, "Creator not registered");
        
        creatorProfiles[tokenId].ipLaunchCount += 1;
        emit IPLaunched(_creatorAddress, creatorProfiles[tokenId].ipLaunchCount);
    }
    
    /**
     * @dev Get creator profile by wallet address
     */
    function getCreator(address _creatorAddress) external view returns (CreatorProfile memory) {
        uint256 tokenId = addressToTokenId[_creatorAddress];
        require(tokenId != 0, "Creator not found");
        return creatorProfiles[tokenId];
    }
    
    /**
     * @dev Check if address is a registered creator
     */
    function isCreator(address _address) external view returns (bool) {
        uint256 tokenId = addressToTokenId[_address];
        if (tokenId == 0) return false;
        return creatorProfiles[tokenId].isActive;
    }
    
    /**
     * @dev Deactivate creator (but keep NFT for history)
     */
    function deactivateCreator(address _creatorAddress) external onlyOwner {
        uint256 tokenId = addressToTokenId[_creatorAddress];
        require(tokenId != 0, "Creator not registered");
        
        creatorProfiles[tokenId].isActive = false;
        emit CreatorDeactivated(_creatorAddress);
    }
}
