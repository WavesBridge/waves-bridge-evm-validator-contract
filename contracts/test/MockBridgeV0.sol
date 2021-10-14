// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../interfaces/IBridgeV0.sol";

contract MockBridge is IBridgeV0 {
    mapping(bytes4 => mapping(uint256 => bool)) public override unlocks;

    function addUnlock(bytes4 lockSource, uint256 lockId) external {
        unlocks[lockSource][lockId] = true;
    }
}
