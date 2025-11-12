// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {EminarToken} from "../EMN/EMN.sol";
import "hardhat/console.sol";

contract EmireqGovernance is AccessControl, Pausable {
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
        bool earlyExecution;
        uint256 approvalCount;
        ProposalStatus status;
        bool executed;
        bytes callData;
        address targetContract;
        mapping(address => bool) approvals;
    }

    // Governance Parameters
    uint256 public constant MIN_VOTING_PERIOD = 1 days;
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
    address public multisiGovernanceAddress;

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
        return
            _address == publicAddress ||
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
        uint256 _votingPeriod,
        bool _earlyExecution
    ) public onlyVoter onlyRole(PROPOSER_ROLE) returns (uint256) {
        if (bytes(_title).length == 0 || bytes(_description).length == 0) {
            revert InvalidProposal();
        }
        if (_targetContract == address(0)) {
            revert ZeroAddress();
        }
        if (
            _votingPeriod < MIN_VOTING_PERIOD ||
            _votingPeriod > MAX_VOTING_PERIOD
        ) {
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
        newProposal.earlyExecution = _earlyExecution;
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
    function vote(
        uint256 _proposalId,
        bool _approve
    ) external onlyVoter whenNotPaused {
        Proposal storage proposal = proposals[_proposalId];

        if (proposal.id == 0) revert InvalidProposal();

        if (proposal.status != ProposalStatus.ACTIVE)
            revert ProposalNotActive();
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

    /**
     * @notice Execute an approved proposal
     */
    function executeProposal(
        uint256 _proposalId
    ) external whenNotPaused onlyRole(EXECUTOR_ROLE) {
        Proposal storage proposal = proposals[_proposalId];

        if (proposal.id == 0) revert InvalidProposal();
        if (proposal.executed) revert ProposalAlreadyExecuted();
        if (
            proposal.status != ProposalStatus.APPROVED &&
            block.timestamp <= proposal.votingEnd
        ) {
            revert InsufficientApprovals();
        }

        // If voting period ended, check if proposal has enough approvals
        if (
            block.timestamp > proposal.votingEnd ||
            proposal.earlyExecution == true
        ) {
            if (proposal.approvalCount < REQUIRED_APPROVALS) {
                proposal.status = ProposalStatus.REJECTED;
                revert InsufficientApprovals();
            }
            proposal.status = ProposalStatus.APPROVED;
        }

        proposal.executed = true;
        proposal.status = ProposalStatus.EXECUTED;
        console.log("proposal.targetContract", proposal.targetContract);
        // Execute the proposal through the token's governance function

        (bool success, bytes memory result) = proposal.targetContract.call(
            proposal.callData
        );
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
        emit ProposalExecuted(_proposalId);
    }

    /**
     * @notice Get proposal state
     */
    function state(uint256 _proposalId) public view returns (ProposalStatus) {
        Proposal storage proposal = proposals[_proposalId];

        if (proposal.id == 0) revert InvalidProposal();
        if (proposal.executed) return ProposalStatus.EXECUTED;
        if (proposal.status == ProposalStatus.APPROVED)
            return ProposalStatus.APPROVED;
        if (proposal.status == ProposalStatus.REJECTED)
            return ProposalStatus.REJECTED;

        if (block.timestamp > proposal.votingEnd) {
            if (proposal.approvalCount >= REQUIRED_APPROVALS) {
                return ProposalStatus.APPROVED;
            } else {
                return ProposalStatus.REJECTED;
            }
        }

        return ProposalStatus.ACTIVE;
    }

    /**
     * @notice Check if a voter has approved a proposal
     */
    function hasApproved(
        uint256 _proposalId,
        address _voter
    ) public view returns (bool) {
        return proposals[_proposalId].approvals[_voter];
    }

    /**
     * @notice Get proposal details
     */
    function getProposal(
        uint256 _proposalId
    )
        external
        view
        returns (
            uint256 id,
            ProposalType proposalType,
            string memory title,
            string memory description,
            address proposer,
            uint256 createdAt,
            uint256 votingEnd,
            uint256 approvalCount,
            ProposalStatus status,
            bool executed,
            bytes memory callData,
            address targetContract
        )
    {
        Proposal storage proposal = proposals[_proposalId];
        return (
            proposal.id,
            proposal.proposalType,
            proposal.title,
            proposal.description,
            proposal.proposer,
            proposal.createdAt,
            proposal.votingEnd,
            proposal.approvalCount,
            proposal.status,
            proposal.executed,
            proposal.callData,
            proposal.targetContract
        );
    }

    /**
     * @notice Get proposal count
     */
    function getProposalCount() external view returns (uint256) {
        return _proposalIds.current();
    }

    /**
     * @notice Get current voters
     */
    function getVoters() external view returns (address[5] memory) {
        return [
            publicAddress,
            reserveAddress,
            developmentAddress,
            shariaTrustAddress,
            strategicPartnersAddress
        ];
    }

    /**
     * @notice Check if address is a voter
     */
    function isVoter(address _address) external view returns (bool) {
        return _isVoter(_address);
    }

    // Proposal Creation Helper Functions

    /**
     * @notice Create token minting proposal
     */
    function createTokenMintingProposal(
        string memory _title,
        string memory _description,
        address _to,
        uint256 _amount,
        string memory _reason,
        uint256 _votingPeriod,
        bool _earlyExecution
    ) external onlyVoter onlyRole(PROPOSER_ROLE) returns (uint256) {
        bytes memory callData = abi.encodeWithSignature(
            "mint(address,uint256,string)",
            _to,
            _amount,
            _reason
        );

        return
            propose(
                ProposalType.TOKEN_MINTING,
                _title,
                _description,
                callData,
                address(emnToken),
                _votingPeriod,
                _earlyExecution
            );
    }

    /**
     * @notice Create treasury spending proposal
     */
    function createTreasurySpendingProposal(
        string memory _title,
        string memory _description,
        address _token,
        address _to,
        uint256 _amount,
        uint256 _votingPeriod,
        bool _earlyExecution
    ) external onlyVoter onlyRole(PROPOSER_ROLE) returns (uint256) {
        bytes memory callData = abi.encodeWithSignature(
            "transfer(address,uint256)",
            _to,
            _amount
        );

        return
            propose(
                ProposalType.TREASURY_SPENDING,
                _title,
                _description,
                callData,
                _token,
                _votingPeriod,
                _earlyExecution
            );
    }

    /**
     * @notice Create asset policy proposal (enable/disable asset)
     */
    function createAssetPolicyProposal(
        string memory _title,
        string memory _description,
        EminarToken.BackingAsset _asset,
        address _token,
        bool _register,
        uint256 _votingPeriod,
        bool _earlyExecution
    ) external onlyVoter onlyRole(PROPOSER_ROLE) returns (uint256) {
        bytes memory callData;

        if (_register) {
            callData = abi.encodeWithSignature(
                "registerBackingToken(uint8,address)",
                _asset,
                _token
            );
        } else {
            callData = abi.encodeWithSignature(
                "unregisterBackingToken(uint8)",
                _asset
            );
        }

        return
            propose(
                ProposalType.ASSET_POLICY,
                _title,
                _description,
                callData,
                address(emnToken),
                _votingPeriod,
                _earlyExecution
            );
    }

    /**
     * @notice Create oracle price feed update proposal
     */
    function createOraclePriceProposal(
        string memory _title,
        string memory _description,
        EminarToken.BackingAsset _asset,
        uint256 _priceUSD,
        uint256 _votingPeriod,
        bool _earlyExecution
    ) external onlyVoter onlyRole(PROPOSER_ROLE) returns (uint256) {
        bytes memory callData = abi.encodeWithSignature(
            "setAssetPriceUSD(uint8,uint256)",
            _asset,
            _priceUSD
        );

        return
            propose(
                ProposalType.ORACLE_PRICE_FEED,
                _title,
                _description,
                callData,
                address(emnToken),
                _votingPeriod,
                _earlyExecution
            );
    }

    /**
     * @notice Create address update proposal
     */
    function createAddressUpdateProposal(
        string memory _title,
        string memory _description,
        string memory _addressType,
        address _newAddress,
        uint256 _votingPeriod,
        bool _earlyExecution
    ) external onlyVoter onlyRole(PROPOSER_ROLE) returns (uint256) {
        bytes4 selector;

        if (
            keccak256(abi.encodePacked(_addressType)) ==
            keccak256(abi.encodePacked("PUBLIC"))
        ) {
            selector = bytes4(keccak256("updatePublicAddress(address)"));
        } else if (
            keccak256(abi.encodePacked(_addressType)) ==
            keccak256(abi.encodePacked("RESERVE"))
        ) {
            selector = bytes4(keccak256("updateReserveAddress(address)"));
        } else if (
            keccak256(abi.encodePacked(_addressType)) ==
            keccak256(abi.encodePacked("DEVELOPMENT"))
        ) {
            selector = bytes4(keccak256("updateDevelopmentAddress(address)"));
        } else {
            revert InvalidParameter();
        }

        bytes memory callData = abi.encodeWithSelector(selector, _newAddress);

        return
            propose(
                ProposalType.ADDRESS_UPDATE,
                _title,
                _description,
                callData,
                address(emnToken),
                _votingPeriod,
                _earlyExecution
            );
    }

    /**
     * @notice Create backing withdrawal proposal
     */
    function createBackingWithdrawalProposal(
        string memory _title,
        string memory _description,
        EminarToken.BackingAsset _asset,
        address _to,
        uint256 _amount,
        uint256 _votingPeriod,
        bool _earlyExecution
    ) external onlyVoter onlyRole(PROPOSER_ROLE) returns (uint256) {
        bytes memory callData = abi.encodeWithSignature(
            "withdrawBacking(uint8,address,uint256)",
            _asset,
            _to,
            _amount
        );

        return
            propose(
                ProposalType.TREASURY_SPENDING,
                _title,
                _description,
                callData,
                address(emnToken),
                _votingPeriod,
                _earlyExecution
            );
    }

    // Administrative Functions

    /**
     * @notice Update voter addresses (must be executed through governance)
     */
    function updateVoterAddress(
        string memory _voterType,
        address _newAddress
    ) external onlyRole(EXECUTOR_ROLE) {
        if (_newAddress == address(0)) revert ZeroAddress();

        address oldAddress;

        if (
            keccak256(abi.encodePacked(_voterType)) ==
            keccak256(abi.encodePacked("PUBLIC"))
        ) {
            oldAddress = publicAddress;
            publicAddress = _newAddress;
        } else if (
            keccak256(abi.encodePacked(_voterType)) ==
            keccak256(abi.encodePacked("RESERVE"))
        ) {
            oldAddress = reserveAddress;
            reserveAddress = _newAddress;
        } else if (
            keccak256(abi.encodePacked(_voterType)) ==
            keccak256(abi.encodePacked("DEVELOPMENT"))
        ) {
            oldAddress = developmentAddress;
            developmentAddress = _newAddress;
        } else if (
            keccak256(abi.encodePacked(_voterType)) ==
            keccak256(abi.encodePacked("SHARIA"))
        ) {
            oldAddress = shariaTrustAddress;
            shariaTrustAddress = _newAddress;
        } else if (
            keccak256(abi.encodePacked(_voterType)) ==
            keccak256(abi.encodePacked("STRATEGIC"))
        ) {
            oldAddress = strategicPartnersAddress;
            strategicPartnersAddress = _newAddress;
        } else {
            revert InvalidParameter();
        }

        // Update roles
        _revokeRole(PROPOSER_ROLE, oldAddress);
        _revokeRole(EXECUTOR_ROLE, oldAddress);
        _revokeRole(PAUSER_ROLE, oldAddress);

        _grantRole(PROPOSER_ROLE, _newAddress);
        _grantRole(EXECUTOR_ROLE, _newAddress);
        _grantRole(PAUSER_ROLE, _newAddress);

        emit VoterUpdated(_voterType, _newAddress);
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
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
