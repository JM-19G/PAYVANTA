// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {PayeeRegistry} from "../src/PayeeRegistry.sol";
import {PayvantaPayables, IERC20} from "../src/PayvantaPayables.sol";

contract MockUSD {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(allowance[from][msg.sender] >= amount, "allowance");
        require(balanceOf[from] >= amount, "balance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract PayvantaPayablesTest is Test {
    PayeeRegistry registry;
    MockUSD usd;
    PayvantaPayables payables;

    address owner;
    address agent;
    address acme;
    address mallory;

    bytes32 id1 = keccak256("invoice-1");
    bytes32 id2 = keccak256("invoice-2");

    function setUp() public {
        owner = makeAddr("owner");
        agent = makeAddr("agent");
        acme = makeAddr("acme");
        mallory = makeAddr("mallory");

        registry = new PayeeRegistry();
        usd = new MockUSD();
        payables = new PayvantaPayables(IERC20(address(usd)), registry);

        vm.prank(acme);
        registry.register("Acme Ltd");
        registry.verify(acme);

        usd.mint(owner, 1000e6);
        vm.startPrank(owner);
        usd.approve(address(payables), 1000e6);
        payables.setPolicy(agent, 200e6, 300e6, uint64(block.timestamp + 7 days));
        vm.stopPrank();
    }

    function test_agentPaysVerifiedPayee() public {
        vm.prank(agent);
        payables.payInvoice(owner, acme, "Acme Ltd", 120e6, id1);
        assertEq(usd.balanceOf(acme), 120e6);
        assertEq(usd.balanceOf(owner), 880e6);
        assertTrue(payables.invoicePaid(id1));
    }

    function test_revertPayeeNameMismatch() public {
        vm.prank(mallory);
        registry.register("Acme Limited");
        vm.prank(agent);
        vm.expectRevert(PayvantaPayables.PayeeNameMismatch.selector);
        payables.payInvoice(owner, mallory, "Acme Ltd", 100e6, id1);
    }

    function test_revertPayeeNotVerified() public {
        vm.prank(mallory);
        registry.register("Acme Limited");
        vm.prank(agent);
        vm.expectRevert(PayvantaPayables.PayeeNotVerified.selector);
        payables.payInvoice(owner, mallory, "Acme Limited", 100e6, id1);
    }

    function test_revertOverPerTxCap() public {
        vm.prank(agent);
        vm.expectRevert(PayvantaPayables.OverPerTxCap.selector);
        payables.payInvoice(owner, acme, "Acme Ltd", 250e6, id1);
    }

    function test_revertOverDailyCap() public {
        vm.startPrank(agent);
        payables.payInvoice(owner, acme, "Acme Ltd", 200e6, id1);
        vm.expectRevert(PayvantaPayables.OverDailyCap.selector);
        payables.payInvoice(owner, acme, "Acme Ltd", 150e6, id2);
        vm.stopPrank();
    }

    function test_dailyCapResetsNextDay() public {
        vm.startPrank(agent);
        payables.payInvoice(owner, acme, "Acme Ltd", 200e6, id1);
        vm.warp(block.timestamp + 1 days);
        payables.payInvoice(owner, acme, "Acme Ltd", 200e6, id2);
        vm.stopPrank();
        assertEq(usd.balanceOf(acme), 400e6);
    }

    function test_revertReplayedInvoice() public {
        vm.startPrank(agent);
        payables.payInvoice(owner, acme, "Acme Ltd", 50e6, id1);
        vm.expectRevert(PayvantaPayables.InvoiceAlreadyPaid.selector);
        payables.payInvoice(owner, acme, "Acme Ltd", 50e6, id1);
        vm.stopPrank();
    }

    function test_revertAfterRevoke() public {
        vm.prank(owner);
        payables.revokeAgent();
        vm.prank(agent);
        vm.expectRevert(PayvantaPayables.PolicyInactive.selector);
        payables.payInvoice(owner, acme, "Acme Ltd", 50e6, id1);
    }

    function test_revertNonAgent() public {
        vm.prank(mallory);
        vm.expectRevert(PayvantaPayables.NotAgent.selector);
        payables.payInvoice(owner, acme, "Acme Ltd", 50e6, id1);
    }

    function test_revertAfterExpiry() public {
        vm.warp(block.timestamp + 8 days);
        vm.prank(agent);
        vm.expectRevert(PayvantaPayables.PolicyExpired.selector);
        payables.payInvoice(owner, acme, "Acme Ltd", 50e6, id1);
    }

    function test_ownerCanPayAboveCapDirectly() public {
        vm.prank(owner);
        payables.payAsOwner(acme, "Acme Ltd", 250e6, id1);
        assertEq(usd.balanceOf(acme), 250e6);
    }

    function test_revertInvalidPolicy() public {
        vm.prank(owner);
        vm.expectRevert(PayvantaPayables.InvalidPolicy.selector);
        payables.setPolicy(agent, 300e6, 200e6, uint64(block.timestamp + 1 days));
    }
}
