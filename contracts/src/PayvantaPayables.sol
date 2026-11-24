// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {PayeeRegistry} from "./PayeeRegistry.sol";

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @title PayvantaPayables
/// @notice Lets an owner delegate invoice payments to an agent under strict limits.
///         Every payment requires a verified payee whose name matches the invoice.
contract PayvantaPayables {
    struct Policy {
        address agent;
        uint256 perTxCap;
        uint256 dailyCap;
        uint64 expiry;
        bool active;
    }

    IERC20 public immutable token;
    PayeeRegistry public immutable registry;

    mapping(address => Policy) public policies;
    mapping(address => mapping(uint256 => uint256)) public spentOnDay;
    mapping(bytes32 => bool) public invoicePaid;

    event PolicySet(address indexed owner, address indexed agent, uint256 perTxCap, uint256 dailyCap, uint64 expiry);
    event PolicyRevoked(address indexed owner);
    event InvoicePaid(
        bytes32 indexed invoiceId, address indexed owner, address indexed payee, uint256 amount, bool paidByAgent
    );

    error InvalidPolicy();
    error PolicyInactive();
    error NotAgent();
    error PolicyExpired();
    error ZeroAmount();
    error OverPerTxCap();
    error OverDailyCap();
    error PayeeNameMismatch();
    error PayeeNotVerified();
    error InvoiceAlreadyPaid();
    error TransferFailed();

    constructor(IERC20 _token, PayeeRegistry _registry) {
        token = _token;
        registry = _registry;
    }

    /// @notice Owner sets or replaces the agent's spending policy.
    function setPolicy(address agent, uint256 perTxCap, uint256 dailyCap, uint64 expiry) external {
        if (agent == address(0) || perTxCap == 0 || perTxCap > dailyCap || expiry <= block.timestamp) {
            revert InvalidPolicy();
        }
        policies[msg.sender] = Policy(agent, perTxCap, dailyCap, expiry, true);
        emit PolicySet(msg.sender, agent, perTxCap, dailyCap, expiry);
    }

    /// @notice Owner revokes the agent instantly.
    function revokeAgent() external {
        policies[msg.sender].active = false;
        emit PolicyRevoked(msg.sender);
    }

    /// @notice Agent pays an invoice from `owner`, within the owner's policy.
    function payInvoice(address owner, address payee, string calldata payeeName, uint256 amount, bytes32 invoiceId)
        external
    {
        _checkAndRecordSpend(owner, amount);
        _execute(owner, payee, payeeName, amount, invoiceId, true);
    }

    /// @notice Owner approves and pays an invoice directly, for example one the agent blocked.
    function payAsOwner(address payee, string calldata payeeName, uint256 amount, bytes32 invoiceId) external {
        if (amount == 0) revert ZeroAmount();
        _execute(msg.sender, payee, payeeName, amount, invoiceId, false);
    }

    function _checkAndRecordSpend(address owner, uint256 amount) internal {
        Policy storage p = policies[owner];
        if (!p.active) revert PolicyInactive();
        if (msg.sender != p.agent) revert NotAgent();
        if (block.timestamp > p.expiry) revert PolicyExpired();
        if (amount == 0) revert ZeroAmount();
        if (amount > p.perTxCap) revert OverPerTxCap();

        uint256 day = block.timestamp / 1 days;
        uint256 newTotal = spentOnDay[owner][day] + amount;
        if (newTotal > p.dailyCap) revert OverDailyCap();
        spentOnDay[owner][day] = newTotal;
    }

    function _execute(
        address owner,
        address payee,
        string calldata payeeName,
        uint256 amount,
        bytes32 invoiceId,
        bool paidByAgent
    ) internal {
        (bool nameMatches, bool verified) = registry.confirmPayee(payee, payeeName);
        if (!nameMatches) revert PayeeNameMismatch();
        if (!verified) revert PayeeNotVerified();
        if (invoicePaid[invoiceId]) revert InvoiceAlreadyPaid();

        invoicePaid[invoiceId] = true;
        if (!token.transferFrom(owner, payee, amount)) revert TransferFailed();
        emit InvoicePaid(invoiceId, owner, payee, amount, paidByAgent);
    }
}
