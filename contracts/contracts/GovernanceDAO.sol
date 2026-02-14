// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title GovernanceDAO
 * @notice DAO governance contract for proposal voting
 * @dev Uses USDC balance as voting power
 */
contract GovernanceDAO is Ownable {
    /// @notice USDC token contract reference
    IERC20 public immutable usdcToken;

    /// @notice Proposal types
    enum ProposalType { Journal, Reviewer, Treasury, Policy }

    /// @notice Proposal status
    enum ProposalStatus { Active, Passed, Rejected, Executed }

    /// @notice Proposal structure
    struct Proposal {
        uint256 id;
        string title;
        string description;
        ProposalType proposalType;
        ProposalStatus status;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 totalVotes;
        address proposer;
        uint256 startTime;
        uint256 endTime;
        uint256 requiredVotes; // Minimum quorum
        bool executed;
    }

    /// @notice Proposal counter
    uint256 private _proposalIdCounter;

    /// @notice Mapping from proposal ID to proposal
    mapping(uint256 => Proposal) public proposals;

    /// @notice Mapping from proposal ID to voter to whether they voted
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    /// @notice Minimum voting period (3 days)
    uint256 public constant MIN_VOTING_PERIOD = 3 days;

    /// @notice Maximum voting period (30 days)
    uint256 public constant MAX_VOTING_PERIOD = 30 days;

    /// @notice Minimum quorum percentage (basis points: 1000 = 10%)
    uint256 public minQuorumBps = 1000; // 10%

    /// @notice Emitted when a proposal is created
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        ProposalType proposalType
    );

    /// @notice Emitted when a vote is cast
    event Voted(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 weight
    );

    /// @notice Emitted when a proposal status changes
    event ProposalStatusChanged(uint256 indexed proposalId, ProposalStatus status);

    /// @notice Emitted when a proposal is executed
    event ProposalExecuted(uint256 indexed proposalId);

    /**
     * @notice Constructor
     * @param _usdcToken Address of the USDC token contract
     */
    constructor(address _usdcToken) Ownable(msg.sender) {
        require(_usdcToken != address(0), "Invalid token address");
        usdcToken = IERC20(_usdcToken);
    }

    /**
     * @notice Create a new proposal
     * @param title Proposal title
     * @param description Proposal description
     * @param proposalType Type of proposal
     * @param votingPeriod Duration of voting in seconds
     */
    function createProposal(
        string calldata title,
        string calldata description,
        ProposalType proposalType,
        uint256 votingPeriod
    ) external returns (uint256) {
        require(votingPeriod >= MIN_VOTING_PERIOD && votingPeriod <= MAX_VOTING_PERIOD, "Invalid voting period");
        require(bytes(title).length > 0, "Title cannot be empty");

        uint256 proposalId = _proposalIdCounter++;
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + votingPeriod;

        // Calculate required votes (10% of total supply)
        uint256 requiredVotes = (usdcToken.totalSupply() * minQuorumBps) / 10000;

        proposals[proposalId] = Proposal({
            id: proposalId,
            title: title,
            description: description,
            proposalType: proposalType,
            status: ProposalStatus.Active,
            votesFor: 0,
            votesAgainst: 0,
            totalVotes: 0,
            proposer: msg.sender,
            startTime: startTime,
            endTime: endTime,
            requiredVotes: requiredVotes,
            executed: false
        });

        emit ProposalCreated(proposalId, msg.sender, title, proposalType);

        return proposalId;
    }

    /**
     * @notice Vote on a proposal
     * @param proposalId ID of the proposal
     * @param support True to vote for, false to vote against
     */
    function vote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id == proposalId, "Proposal does not exist");
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.timestamp < proposal.endTime, "Voting period ended");
        require(!hasVoted[proposalId][msg.sender], "Already voted");

        uint256 weight = usdcToken.balanceOf(msg.sender);
        require(weight > 0, "No voting power");

        hasVoted[proposalId][msg.sender] = true;

        if (support) {
            proposal.votesFor += weight;
        } else {
            proposal.votesAgainst += weight;
        }

        proposal.totalVotes += weight;

        emit Voted(proposalId, msg.sender, support, weight);
    }

    /**
     * @notice Execute a passed proposal
     * @param proposalId ID of the proposal
     */
    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id == proposalId, "Proposal does not exist");
        require(!proposal.executed, "Already executed");
        require(block.timestamp >= proposal.endTime, "Voting period not ended");

        // Check if proposal passed (more for than against AND quorum reached)
        bool passed = proposal.votesFor > proposal.votesAgainst && proposal.totalVotes >= proposal.requiredVotes;

        proposal.status = passed ? ProposalStatus.Passed : ProposalStatus.Rejected;
        proposal.executed = true;

        emit ProposalStatusChanged(proposalId, proposal.status);
        emit ProposalExecuted(proposalId);
    }

    /**
     * @notice Get active proposals
     * @return Array of active proposal IDs
     */
    function getActiveProposals() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < _proposalIdCounter; i++) {
            if (proposals[i].status == ProposalStatus.Active && block.timestamp < proposals[i].endTime) {
                activeCount++;
            }
        }

        uint256[] memory activeIds = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < _proposalIdCounter; i++) {
            if (proposals[i].status == ProposalStatus.Active && block.timestamp < proposals[i].endTime) {
                activeIds[index++] = i;
            }
        }

        return activeIds;
    }

    /**
     * @notice Get proposal details
     * @param proposalId ID of the proposal
     */
    function getProposal(uint256 proposalId)
        external
        view
        returns (
            uint256 id,
            string memory title,
            string memory description,
            ProposalType proposalType,
            ProposalStatus status,
            uint256 votesFor,
            uint256 votesAgainst,
            uint256 totalVotes,
            address proposer,
            uint256 startTime,
            uint256 endTime,
            uint256 requiredVotes
        )
    {
        Proposal memory p = proposals[proposalId];
        return (
            p.id,
            p.title,
            p.description,
            p.proposalType,
            p.status,
            p.votesFor,
            p.votesAgainst,
            p.totalVotes,
            p.proposer,
            p.startTime,
            p.endTime,
            p.requiredVotes
        );
    }

    /**
     * @notice Get user's voting power
     * @param user Address to query
     * @return Voting power (USDC balance)
     */
    function getVotingPower(address user) external view returns (uint256) {
        return usdcToken.balanceOf(user);
    }

    /**
     * @notice Update minimum quorum (only owner)
     * @param newQuorumBps New quorum in basis points
     */
    function setMinQuorum(uint256 newQuorumBps) external onlyOwner {
        require(newQuorumBps >= 100 && newQuorumBps <= 5000, "Quorum must be 1%-50%");
        minQuorumBps = newQuorumBps;
    }
}
