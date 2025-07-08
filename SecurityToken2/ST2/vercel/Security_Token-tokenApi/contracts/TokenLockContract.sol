// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';

contract TokenLockContract is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256('ADMIN_ROLE');
    bool public paused;

    //Transfer Request Struct to track the request raised by Users in platform
    struct TransferRequest {
        address from;
        address to;
        uint256 amount;
        uint256 fee;
        bool approved;
        bool claimed;
    }

    mapping(string => address) public tokenMapping;
    mapping(uint256 => TransferRequest) public transferRequests;
    uint256 public requestCounter;
    uint256 public transferFee; // Fixed fee for transfers

    event TransferRequested(
        uint256 requestId,
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 fee
    );
    event TransferApproved(uint256 requestId);
    event TokensClaimed(uint256 requestId);
    event TransferFeeSetup(address indexed from);
    event WithdrawFee(address indexed from, uint256 amount);

    modifier whenNotPaused() {
        require(!paused, 'Withdrawals are paused');
        _;
    }

    function setPaused(bool _paused) external onlyRole(ADMIN_ROLE) {
        paused = _paused;
    }

    constructor(uint256 fee) {
        transferFee = fee;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
    }

    function setTokenMapping(
        string memory _prefix,
        address _to
    ) public onlyRole(ADMIN_ROLE) {
        tokenMapping[_prefix] = _to;
    }

    //Request Transfer
    function requestTransfer(
        address to,
        uint256 amount,
        string memory _prefix
    ) external {
        require(to != address(0), 'Invalid recipient');
        require(amount > 0, 'Amount must be greater than zero');
        address _token = tokenMapping[_prefix];
        require(
            IERC20(_token).balanceOf(msg.sender) >= amount,
            'Insufficient Balance'
        );

        // Transfer tokens to this contract
        require(
            IERC20(_token).transferFrom(msg.sender, address(this), amount),
            'Token transfer failed'
        );

        transferRequests[requestCounter] = TransferRequest({
            from: msg.sender,
            to: to,
            amount: amount,
            fee: 0,
            approved: false,
            claimed: false
        });

        emit TransferRequested(requestCounter, msg.sender, to, amount, 0);
        requestCounter++;
    }

    function approveTransfer(uint256 requestId) external onlyRole(ADMIN_ROLE) {
        TransferRequest storage request = transferRequests[requestId];
        require(!request.approved, 'Request already approved');
        require(!request.claimed, 'Tokens already claimed');
        request.approved = true;
        emit TransferApproved(requestId);
    }

    function claimTokens(uint256 requestId, string memory _prefix) external {
        TransferRequest storage request = transferRequests[requestId];
        require(request.approved, 'Request not approved');
        require(!request.claimed, 'Tokens already claimed');
        require(msg.sender == request.to, 'Not the recipient');
        address _token = tokenMapping[_prefix];

        request.claimed = true;
        // Transfer tokens to the recipient
        require(
            IERC20(_token).transfer(msg.sender, request.amount),
            'Token transfer failed'
        );
        emit TokensClaimed(requestId);
    }

    function withdrawFees(
        uint256 _amount
    ) external onlyRole(ADMIN_ROLE) whenNotPaused nonReentrant {
        require(_amount <= address(this).balance, 'Insufficient balance');
        payable(msg.sender).transfer(_amount);
        emit WithdrawFee(msg.sender, _amount);
    }

    function setTransferFee(uint256 fee) external onlyRole(ADMIN_ROLE) {
        transferFee = fee;
        emit TransferFeeSetup(msg.sender);
    }
}
