// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {PayeeRegistry} from "../src/PayeeRegistry.sol";

contract PayeeRegistryTest is Test {
    PayeeRegistry registry;
    address verifier = address(this);
    address acme = address(0xA11CE);
    address bob = address(0xB0B);

    function setUp() public {
        registry = new PayeeRegistry();
    }

    function test_registerStoresPayee() public {
        vm.prank(acme);
        registry.register("Acme Ltd");
        (string memory name, bool verified) = registry.getPayee(acme);
        assertEq(name, "Acme Ltd");
        assertFalse(verified);
    }

    function test_revertEmptyName() public {
        vm.prank(acme);
        vm.expectRevert(PayeeRegistry.EmptyName.selector);
        registry.register("");
    }

    function test_revertNameTaken() public {
        vm.prank(acme);
        registry.register("Acme Ltd");
        vm.prank(bob);
        vm.expectRevert(PayeeRegistry.NameTaken.selector);
        registry.register("Acme Ltd");
    }

    function test_revertAlreadyRegistered() public {
        vm.startPrank(acme);
        registry.register("Acme Ltd");
        vm.expectRevert(PayeeRegistry.AlreadyRegistered.selector);
        registry.register("Acme Two");
        vm.stopPrank();
    }

    function test_verifierCanVerifyAndRevoke() public {
        vm.prank(acme);
        registry.register("Acme Ltd");

        registry.verify(acme);
        (, bool verified) = registry.getPayee(acme);
        assertTrue(verified);

        registry.revoke(acme);
        (, verified) = registry.getPayee(acme);
        assertFalse(verified);
    }

    function test_revertVerifyByNonVerifier() public {
        vm.prank(acme);
        registry.register("Acme Ltd");
        vm.prank(bob);
        vm.expectRevert(PayeeRegistry.NotVerifier.selector);
        registry.verify(acme);
    }

    function test_revertVerifyUnregistered() public {
        vm.expectRevert(PayeeRegistry.NotRegistered.selector);
        registry.verify(acme);
    }

    function test_confirmPayeeMatchAndMismatch() public {
        vm.prank(acme);
        registry.register("Acme Ltd");
        registry.verify(acme);

        (bool match1, bool ok1) = registry.confirmPayee(acme, "Acme Ltd");
        assertTrue(match1);
        assertTrue(ok1);

        (bool match2,) = registry.confirmPayee(acme, "Wrong Name");
        assertFalse(match2);

        (bool match3, bool ok3) = registry.confirmPayee(bob, "Acme Ltd");
        assertFalse(match3);
        assertFalse(ok3);
    }
}
