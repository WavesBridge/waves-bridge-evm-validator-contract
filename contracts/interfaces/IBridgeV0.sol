// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IBridgeV0 {
    function unlocks(bytes4 source, uint256 lockId) external returns (bool);
}
