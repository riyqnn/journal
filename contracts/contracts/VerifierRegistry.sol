// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./ResearchPaperNFT.sol";

/**
 * @title VerifierRegistry
 * @notice Registry for paper verifiers and reputation tracking
 * @dev Manages verification process and USDC reward distribution
 */
contract VerifierRegistry is Ownable {
    /// @notice USDC token for rewards (6 decimals)
    IERC20 public immutable usdcToken;

    /// @notice ResearchPaperNFT contract reference
    ResearchPaperNFT public immutable paperNFT;

    /// @notice Reward amount per verification (50 USDC, with 6 decimals = 50_000_000)
    uint256 public constant VERIFICATION_REWARD = 50 * 10**6;

    /// @notice Verifier reputation tier
    enum Tier { Bronze, Silver, Gold, Platinum }

    /// @notice Verifier information
    struct Verifier {
        bool registered;
        Tier tier;
        uint256 totalVerifications;
        uint256 correctVerifications; // Verified papers that remain verified
        uint256 rewardsEarned;
        uint256 joinedAt;
    }

    /// @notice Verification record
    struct Verification {
        address verifier;
        uint256 tokenId;
        bool approved; // true = verified, false = rejected
        string comment; // IPFS hash of comment/review
        uint256 timestamp;
        bool rewardClaimed;
    }

    /// @notice Registered verifiers
    mapping(address => Verifier) public verifiers;

    /// @notice All verifier addresses
    address[] public verifierList;

    /// @notice Token ID to verifications (can have multiple verifiers per paper)
    mapping(uint256 => Verification[]) public paperVerifications;

    /// @notice Maps token to whether verifier has verified it
    mapping(uint256 => mapping(address => bool)) public hasVerified;

    /// @notice Reputation requirements (correct / total ratio in basis points)
    uint256 public constant BRONZE_TIER_REQUIREMENT = 0;      // Anyone
    uint256 public constant SILVER_TIER_REQUIREMENT = 6000;   // 60%
    uint256 public constant GOLD_TIER_REQUIREMENT = 7500;     // 75%
    uint256 public constant PLATINUM_TIER_REQUIREMENT = 9000; // 90%

    /// @notice Emitted when a verifier registers
    event VerifierRegistered(address indexed verifier, uint256 timestamp);

    /// @notice Emitted when a paper is verified
    event PaperVerified(
        uint256 indexed tokenId,
        address indexed verifier,
        bool approved,
        string comment,
        uint256 timestamp
    );

    /// @notice Emitted when rewards are claimed
    event RewardsClaimed(address indexed verifier, uint256 amount);

    /**
     * @notice Constructor
     * @param _usdcToken Address of the USDC token contract
     * @param _paperNFT Address of the ResearchPaperNFT contract
     */
    constructor(address _usdcToken, address _paperNFT) Ownable(msg.sender) {
        require(_usdcToken != address(0), "Invalid token address");
        require(_paperNFT != address(0), "Invalid NFT address");

        usdcToken = IERC20(_usdcToken);
        paperNFT = ResearchPaperNFT(_paperNFT);
    }

    /**
     * @notice Register as a verifier
     */
    function registerVerifier() external {
        require(!verifiers[msg.sender].registered, "Already registered");

        verifiers[msg.sender] = Verifier({
            registered: true,
            tier: Tier.Bronze,
            totalVerifications: 0,
            correctVerifications: 0,
            rewardsEarned: 0,
            joinedAt: block.timestamp
        });

        verifierList.push(msg.sender);

        emit VerifierRegistered(msg.sender, block.timestamp);
    }

    /**
     * @notice Verify a paper
     * @param tokenId ID of the paper token
     * @param approved True to approve (verify), false to reject
     * @param comment IPFS hash of the review comment
     */
    function verifyPaper(uint256 tokenId, bool approved, string calldata comment) external {
        require(verifiers[msg.sender].registered, "Not registered as verifier");
        require(!hasVerified[tokenId][msg.sender], "Already verified this paper");

        // Create verification record
        paperVerifications[tokenId].push(Verification({
            verifier: msg.sender,
            tokenId: tokenId,
            approved: approved,
            comment: comment,
            timestamp: block.timestamp,
            rewardClaimed: false
        }));

        hasVerified[tokenId][msg.sender] = true;

        // Update verifier stats
        Verifier storage verifier = verifiers[msg.sender];
        verifier.totalVerifications++;

        emit PaperVerified(tokenId, msg.sender, approved, comment, block.timestamp);

        // Note: Status update is done by the contract owner based on consensus
        // This prevents malicious verifiers from changing status arbitrarily
    }

    /**
     * @notice Claim verification reward (50 USDC)
     * @param tokenId ID of the verified paper
     */
    function claimReward(uint256 tokenId) external {
        require(verifiers[msg.sender].registered, "Not registered");

        Verification[] storage verifications = paperVerifications[tokenId];
        bool found = false;
        uint256 rewardIndex = 0;

        for (uint256 i = 0; i < verifications.length; i++) {
            if (verifications[i].verifier == msg.sender && !verifications[i].rewardClaimed) {
                found = true;
                rewardIndex = i;
                break;
            }
        }

        require(found, "No unclaimed reward found");

        // Mark as claimed
        verifications[rewardIndex].rewardClaimed = true;

        // Update verifier stats (assuming correct for now, can be adjusted later)
        verifiers[msg.sender].correctVerifications++;

        // Update tier
        _updateTier(msg.sender);

        // Transfer 50 USDC reward
        require(usdcToken.transfer(msg.sender, VERIFICATION_REWARD), "Transfer failed");
        verifiers[msg.sender].rewardsEarned += VERIFICATION_REWARD;

        emit RewardsClaimed(msg.sender, VERIFICATION_REWARD);
    }

    /**
     * @notice Update verifier tier based on performance
     * @param verifier Address of the verifier
     */
    function _updateTier(address verifier) internal {
        Verifier storage v = verifiers[verifier];
        if (v.totalVerifications == 0) return;

        uint256 ratio = (v.correctVerifications * 10000) / v.totalVerifications;

        if (ratio >= PLATINUM_TIER_REQUIREMENT) {
            v.tier = Tier.Platinum;
        } else if (ratio >= GOLD_TIER_REQUIREMENT) {
            v.tier = Tier.Gold;
        } else if (ratio >= SILVER_TIER_REQUIREMENT) {
            v.tier = Tier.Silver;
        } else {
            v.tier = Tier.Bronze;
        }
    }

    /**
     * @notice Get verifier stats
     * @param verifier Address to query
     */
    function getVerifierStats(address verifier)
        external
        view
        returns (
            Tier tier,
            uint256 totalVerifications,
            uint256 correctVerifications,
            uint256 rewardsEarned
        )
    {
        Verifier memory v = verifiers[verifier];
        return (v.tier, v.totalVerifications, v.correctVerifications, v.rewardsEarned);
    }

    /**
     * @notice Get all verifications for a paper
     * @param tokenId Token ID
     * @return Array of verifications
     */
    function getPaperVerifications(uint256 tokenId) external view returns (Verification[] memory) {
        return paperVerifications[tokenId];
    }

    /**
     * @notice Get all registered verifiers
     * @return Array of verifier addresses
     */
    function getAllVerifiers() external view returns (address[] memory) {
        return verifierList;
    }

    /**
     * @notice Get number of verifications for a paper
     * @param tokenId Token ID
     * @return count Number of verifications
     */
    function getVerificationCount(uint256 tokenId) external view returns (uint256) {
        return paperVerifications[tokenId].length;
    }

    /**
     * @notice Check if address is a registered verifier
     * @param verifier Address to check
     * @return True if registered
     */
    function isVerifier(address verifier) external view returns (bool) {
        return verifiers[verifier].registered;
    }

    /**
     * @notice Fund the reward pool (owner can deposit USDC)
     */
    function fundRewardPool() external payable {
        // Accept USDC transfers
    }

    /**
     * @notice Withdraw unused USDC (owner only)
     * @param amount Amount to withdraw
     */
    function withdrawFunds(uint256 amount) external onlyOwner {
        require(usdcToken.transfer(msg.sender, amount), "Transfer failed");
    }
}
