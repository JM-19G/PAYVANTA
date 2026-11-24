// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title PayeeRegistry
/// @notice Confirmation of Payee: maps a payee name to a wallet address
///         and lets a trusted verifier mark it as verified.
contract PayeeRegistry {
    struct Payee {
        string name;
        bool verified;
    }

    address public immutable verifier;
    mapping(address => Payee) private payees;
    mapping(bytes32 => address) public nameOwner;

    event PayeeRegistered(address indexed payee, string name);
    event PayeeVerified(address indexed payee);
    event PayeeRevoked(address indexed payee);

    error EmptyName();
    error NameTaken();
    error AlreadyRegistered();
    error NotRegistered();
    error NotVerifier();

    constructor() {
        verifier = msg.sender;
    }

    function register(string calldata name) external {
        if (bytes(name).length == 0) revert EmptyName();
        if (bytes(payees[msg.sender].name).length != 0) revert AlreadyRegistered();
        bytes32 nameHash = keccak256(bytes(name));
        if (nameOwner[nameHash] != address(0)) revert NameTaken();

        payees[msg.sender] = Payee(name, false);
        nameOwner[nameHash] = msg.sender;
        emit PayeeRegistered(msg.sender, name);
    }

    function verify(address payee) external {
        if (msg.sender != verifier) revert NotVerifier();
        if (bytes(payees[payee].name).length == 0) revert NotRegistered();
        payees[payee].verified = true;
        emit PayeeVerified(payee);
    }

    function revoke(address payee) external {
        if (msg.sender != verifier) revert NotVerifier();
        if (bytes(payees[payee].name).length == 0) revert NotRegistered();
        payees[payee].verified = false;
        emit PayeeRevoked(payee);
    }

    function getPayee(address payee) external view returns (string memory name, bool verified) {
        Payee storage p = payees[payee];
        return (p.name, p.verified);
    }

    /// @notice Checks that `payee` is registered under `expectedName` and verified.
    function confirmPayee(address payee, string calldata expectedName)
        external
        view
        returns (bool nameMatches, bool verified)
    {
        Payee storage p = payees[payee];
        nameMatches = bytes(p.name).length != 0
            && keccak256(bytes(p.name)) == keccak256(bytes(expectedName));
        verified = p.verified;
    }
}
