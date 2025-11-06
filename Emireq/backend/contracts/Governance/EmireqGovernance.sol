// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {EminarToken} from "../EMN/EMN.sol";

contract EmireqMultisigGovernance is AccessControl, Pausable {
    using Counters for Counters.Counter;

    // Roles
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Custom Errors
    error ZeroAddress();
    error ZeroAmount();
    error InvalidProposal();
    error ProposalNotActive();
    error AlreadyVoted();
    error VotingNotEnded();
    error QuorumNotReached();
    error ProposalAlreadyExecuted();
    error InvalidVoter();
    error InsufficientApprovals();
    error InvalidParameter();
    error ExecutionFailed();

    // Proposal Types
    enum ProposalType {
        TOKEN_MINTING,
        FEE_ADJUSTMENT,
        ORACLE_PRICE_FEED,
        ASSET_POLICY,
        TREASURY_SPENDING,
        POOL_CREATION,
        ADDRESS_UPDATE
    }

    // Proposal Status
    enum ProposalStatus {
        PENDING,
        ACTIVE,
        APPROVED,
        REJECTED,
        EXECUTED,
        EXPIRED
    }

    // Proposal Structure
    struct Proposal {
        uint256 id;
        ProposalType proposalType;
        string title;
        string description;
        address proposer;
        uint256 createdAt;
        uint256 votingEnd;
        uint256 approvalCount;
        ProposalStatus status;
        bool executed;
        bytes callData;
        address targetContract;
        mapping(address => bool) approvals;
    }

    // Governance Parameters
    uint256 public constant MIN_VOTING_PERIOD = 3 days;
    uint256 public constant MAX_VOTING_PERIOD = 30 days;
    uint256 public constant REQUIRED_APPROVALS = 3; // 3/5 votes
    uint256 public constant TOTAL_VOTERS = 5;

    // State Variables
    Counters.Counter private _proposalIds;
    EminarToken public emnToken;
    
    // Multisig Voters (5 parties)
    address public publicAddress;
    address public reserveAddress;
    address public developmentAddress;
    address public shariaTrustAddress;
    address public strategicPartnersAddress;
    
    mapping(uint256 => Proposal) public proposals;
    mapping(address => uint256) public lastProposalTimestamp;

    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        ProposalType proposalType,
        address indexed proposer,
        uint256 votingEnd,
        string title
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool approved
    );
    
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalApproved(uint256 indexed proposalId);
    event VoterUpdated(string indexed voterType, address newAddress);

    constructor(address _emnToken) {
        if (_emnToken == address(0)) {
            revert ZeroAddress();
        }

        emnToken = EminarToken(_emnToken);
        
        // Set voter addresses from the token contract
        publicAddress = emnToken.publicAddress();
        reserveAddress = emnToken.reserveAddress();
        developmentAddress = emnToken.developmentAddress();
        shariaTrustAddress = emnToken.shariaTrustAddress();
        strategicPartnersAddress = emnToken.strategicPartnersAddress();

        // Grant roles to all voters
        _grantRole(PROPOSER_ROLE, publicAddress);
        _grantRole(PROPOSER_ROLE, reserveAddress);
        _grantRole(PROPOSER_ROLE, developmentAddress);
        _grantRole(PROPOSER_ROLE, shariaTrustAddress);
        _grantRole(PROPOSER_ROLE, strategicPartnersAddress);

        _grantRole(EXECUTOR_ROLE, publicAddress);
        _grantRole(EXECUTOR_ROLE, reserveAddress);
        _grantRole(EXECUTOR_ROLE, developmentAddress);
        _grantRole(EXECUTOR_ROLE, shariaTrustAddress);
        _grantRole(EXECUTOR_ROLE, strategicPartnersAddress);

        _grantRole(PAUSER_ROLE, publicAddress);
        _grantRole(PAUSER_ROLE, reserveAddress);
        _grantRole(PAUSER_ROLE, developmentAddress);
        _grantRole(PAUSER_ROLE, shariaTrustAddress);
        _grantRole(PAUSER_ROLE, strategicPartnersAddress);
    }

    /**
     * @notice Check if address is a valid voter
     */
    modifier onlyVoter() {
        if (!_isVoter(msg.sender)) revert InvalidVoter();
        _;
    }

    /**
     * @notice Check if an address is one of the 5 voters
     */
    function _isVoter(address _address) internal view returns (bool) {
        return _address == publicAddress ||
               _address == reserveAddress ||
               _address == developmentAddress ||
               _address == shariaTrustAddress ||
               _address == strategicPartnersAddress;
    }

    /**
     * @notice Create a new proposal
     */
    function propose(
        ProposalType _proposalType,
        string memory _title,
        string memory _description,
        bytes memory _callData,
        address _targetContract,
        uint256 _votingPeriod
    ) public onlyVoter onlyRole(PROPOSER_ROLE) returns (uint256) {
        if (bytes(_title).length == 0 || bytes(_description).length == 0) {
            revert InvalidProposal();
        }
        if (_targetContract == address(0)) {
            revert ZeroAddress();
        }
        if (_votingPeriod < MIN_VOTING_PERIOD || _votingPeriod > MAX_VOTING_PERIOD) {
            revert InvalidParameter();
        }

        _proposalIds.increment();
        uint256 proposalId = _proposalIds.current();
        
        uint256 votingEnd = block.timestamp + _votingPeriod;

        Proposal storage newProposal = proposals[proposalId];
        newProposal.id = proposalId;
        newProposal.proposalType = _proposalType;
        newProposal.title = _title;
        newProposal.description = _description;
        newProposal.proposer = msg.sender;
        newProposal.createdAt = block.timestamp;
        newProposal.votingEnd = votingEnd;
        newProposal.approvalCount = 0;
        newProposal.status = ProposalStatus.ACTIVE;
        newProposal.executed = false;
        newProposal.callData = _callData;
        newProposal.targetContract = _targetContract;

        // Auto-approve by proposer
        newProposal.approvals[msg.sender] = true;
        newProposal.approvalCount = 1;

        lastProposalTimestamp[msg.sender] = block.timestamp;

        emit ProposalCreated(
            proposalId,
            _proposalType,
            msg.sender,
            votingEnd,
            _title
        );

        emit VoteCast(proposalId, msg.sender, true);

        return proposalId;
    }

    /**
     * @notice Vote on a proposal
     */
    function vote(uint256 _proposalId, bool _approve) external onlyVoter whenNotPaused {
        Proposal storage proposal = proposals[_proposalId];
        
        if (proposal.id == 0) revert InvalidProposal();
        if (proposal.status != ProposalStatus.ACTIVE) revert ProposalNotActive();
        if (block.timestamp > proposal.votingEnd) revert VotingNotEnded();
        if (proposal.approvals[msg.sender]) revert AlreadyVoted();

        proposal.approvals[msg.sender] = true;
        
        if (_approve) {
            proposal.approvalCount++;
        }

        emit VoteCast(_proposalId, msg.sender, _approve);

        // Check if proposal reached required approvals
        if (proposal.approvalCount >= REQUIRED_APPROVALS) {
            proposal.status = ProposalStatus.APPROVED;
            emit ProposalApproved(_proposalId);
        }
    }

   
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @notice Get required approvals count
     */
    function getRequiredApprovals() external pure returns (uint256) {
        return REQUIRED_APPROVALS;
    }

    /**
     * @notice Get total voters count
     */
    function getTotalVoters() external pure returns (uint256) {
        return TOTAL_VOTERS;
    }

    // The following functions are overrides required by Solidity
    function supportsInterface(bytes4 interfaceId) public view override(AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}