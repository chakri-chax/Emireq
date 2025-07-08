// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (utils/Context.sol)
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import './registry/interface/IIdentityRegistry.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';

contract Governance is ERC20, AccessControl {
    string public constant CONTRACT_NAME = 'Governance';

    // Define the OWNER_ROLE identifier
    bytes32 public constant OWNER_ROLE = keccak256('OWNER_ROLE');

    address public digitizedContractAddress;
    IIdentityRegistry internal _tokenIdentityRegistry;
    mapping(address => uint256) public _tokenHolders;
    uint256 public TOKEN_PRICE;

    event IdentityRegistryAdded(address indexed _identityRegistry);
    event TokensMinted(
        address indexed buyer,
        uint256 amount
    );
    event EtherWithdrawn(address indexed owner, uint256 amount);
    event TokenPriceUpdated(uint256 newPrice);

    // Modified constructor to setup roles
    constructor(
        string memory _name,
        string memory _symbol,
        address _identityRegistry,
        address _digitizedContractAddress,
        uint256 _tokenUnitPrice
    ) ERC20(_name, _symbol) {
        require(
            _identityRegistry != address(0),
            'invalid argument - zero address'
        );
        require(
            _digitizedContractAddress != address(0),
            'invalid argument - zero address'
        );
        require(_tokenUnitPrice != 0, 'Token Price cannot be zero');

        _setupRole(OWNER_ROLE, msg.sender);
        _setRoleAdmin(OWNER_ROLE, OWNER_ROLE);

        setIdentityRegistry(_identityRegistry);
        TOKEN_PRICE = _tokenUnitPrice;
        digitizedContractAddress = _digitizedContractAddress;
    }

    // Modifier to restrict access to OWNER_ROLE
    modifier onlyOwner() {
        require(hasRole(OWNER_ROLE, msg.sender), 'Caller is not owner');
        _;
    }

    function setIdentityRegistry(address _identityRegistry) internal {
        _tokenIdentityRegistry = IIdentityRegistry(_identityRegistry);
        emit IdentityRegistryAdded(_identityRegistry);
    }

    function mint(address _caller,uint256 _amountToMint) external returns (bool) {
        require(_caller != address(0), 'Invalid sender address');
        require(
            _tokenIdentityRegistry.isVerified(_caller),
            'Identity is not verified'
        );

        // uint256 requiredEther = _amountToMint * TOKEN_PRICE;
        // require(msg.value >= requiredEther, 'Insufficient Ether sent');

        _tokenHolders[_caller] += _amountToMint;
        _mint(_caller, _amountToMint);

        emit TokensMinted(_caller, _amountToMint);

        // if (msg.value > requiredEther) {
        //     payable(msg.sender).transfer(msg.value - requiredEther);
        // }

        return true;
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, 'No Ether to withdraw');

        payable(msg.sender).transfer(balance);
        emit EtherWithdrawn(msg.sender, balance);
    }

    function setTokenPrice(uint256 _newPrice) external onlyOwner {
        require(_newPrice != 0, 'Token Price cannot be zero');
        TOKEN_PRICE = _newPrice;
        emit TokenPriceUpdated(_newPrice);
    }

    function transfer(
        address _to,
        uint256 _amount
    ) public override returns (bool) {
        if (_tokenIdentityRegistry.isVerified(_to)) {
            _transfer(msg.sender, _to, _amount);
            _tokenHolders[msg.sender] -= _amount;
            _tokenHolders[_to] += _amount;
            return true;
        }
        revert('Transfer not possible');
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _amount
    ) public override returns (bool) {
        if (_tokenIdentityRegistry.isVerified(_to)) {
            _transfer(_from, _to, _amount);
            _tokenHolders[_from] -= _amount;
            _tokenHolders[_to] += _amount;
            return true;
        }
        revert('Transfer not possible');
    }

    receive() external payable {}
}
