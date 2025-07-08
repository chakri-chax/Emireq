// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.0;

interface IERC20 {
    function transfer(
        address recipient,
        uint256 amount
    ) external returns (bool);

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    function balanceOf(address account) external view returns (uint256);
}

contract SecureEscrow {
    address public immutable usdtToken;
    address public immutable gnosisSafe;

    mapping(address => uint256) public ethBalances;
    mapping(address => uint256) public usdtBalances;

    event Deposited(address indexed user, uint256 amount, string currency);
    event Withdrawn(address indexed user, uint256 amount, string currency);

    modifier onlySafe() {
        require(
            msg.sender == gnosisSafe,
            'Not authorized: Only Safe can approve'
        );
        _;
    }

    constructor(address _usdtToken, address _gnosisSafe) {
        usdtToken = _usdtToken;
        gnosisSafe = _gnosisSafe;
    }

    // Deposit ETH or XDC  into escrow
    function depositETH() external payable {
        require(msg.value > 0, 'Must send ETH');
        ethBalances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value, 'ETH');
    }

    // Deposit USDT into escrow
    function depositUSDT(uint256 amount) external {
        require(amount > 0, 'Must send USDT');
        require(
            IERC20(usdtToken).transferFrom(msg.sender, address(this), amount),
            'USDT Transfer failed'
        );
        usdtBalances[msg.sender] += amount;
        emit Deposited(msg.sender, amount, 'USDT');
    }

    // Withdraw ETH (requires Gnosis Safe approval)
    function withdrawETH(address recipient, uint256 amount) external onlySafe {
        require(ethBalances[recipient] >= amount, 'Insufficient ETH balance');
        ethBalances[recipient] -= amount;
        payable(recipient).transfer(amount);
        emit Withdrawn(recipient, amount, 'ETH');
    }

    // Withdraw USDT (requires Gnosis Safe approval)
    function withdrawUSDT(address recipient, uint256 amount) external onlySafe {
        require(usdtBalances[recipient] >= amount, 'Insufficient USDT balance');
        usdtBalances[recipient] -= amount;
        require(
            IERC20(usdtToken).transfer(recipient, amount),
            'USDT Transfer failed'
        );
        emit Withdrawn(recipient, amount, 'USDT');
    }

    // Get total contract balance (ETH & USDT)
    function getEscrowBalance()
        external
        view
        returns (uint256 ethBalance, uint256 usdtBalance)
    {
        ethBalance = address(this).balance;
        usdtBalance = IERC20(usdtToken).balanceOf(address(this));
    }

    // Get user balance (ETH & USDT)
    function getUserBalance(
        address user
    ) external view returns (uint256 ethBalance, uint256 usdtBalance) {
        ethBalance = ethBalances[user];
        usdtBalance = usdtBalances[user];
    }
}
