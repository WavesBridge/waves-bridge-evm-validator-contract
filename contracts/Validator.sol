// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./interfaces/IValidator.sol";
import "./interfaces/IBridgeV0.sol";

contract Validator is IValidator {
    // Structure for lock info
    struct Lock {
        address sender;
        bytes32 recipient;
        bytes4 destination;
        uint256 amount;
        bytes4 tokenSource;
        bytes32 tokenSourceAddress;
    }

    // List of locks
    Lock[] public locks;

    // Map for received transactions
    // source => lockId => true
    mapping(bytes4 => mapping(uint256 => bool)) public unlocks;

    //TODO: Remove bridgeV0;
    IBridgeV0 private bridgeV0;
    //TODO: Change oracle?
    address private oracle;
    bytes4 public blockchainId;

    // TODO: add init lock id
    // TODO: add map of min lock id per chain
    constructor(IBridgeV0 _bridgeV0, address _oracle, bytes4 _blockchainId) {
        bridgeV0 = _bridgeV0;
        oracle = _oracle;
        blockchainId = _blockchainId;
    }

    // Method to get amount of locks
    function lockLength() external view returns (uint256) {
        return locks.length;
    }

    // TODO: Validate only bridge
    function createLock(
        address sender,
        bytes32 recipient,
        uint256 amount,
        bytes4 destination,
        bytes4 tokenSource,
        bytes32 tokenSourceAddress
    ) external override returns (uint256) {
        require(destination != blockchainId, "Validator: source chain");

        // Create and add lock structure to the locks list
        uint256 lockId = locks.length;
        locks.push(Lock({
            sender: sender,
            recipient: recipient,
            amount: amount,
            destination: destination,
            tokenSource: tokenSource,
            tokenSourceAddress: tokenSourceAddress
        }));

        return lockId;
    }

    // TODO: Validate only bridge
    function createUnlock(
        uint256 lockId,
        address recipient,
        uint256 amount,
        bytes4 lockSource,
        bytes4 tokenSource,
        bytes32 tokenSourceAddress,
        bytes calldata signature
    ) external override returns (bool) {
        bytes32 hash = keccak256(abi.encodePacked(lockId, recipient, amount, lockSource, tokenSource, tokenSourceAddress, blockchainId, "unlock"));
        require(recoverSigner(prefixed(hash), signature) == oracle, "Validator: invalid signature");

        require(!unlocks[lockSource][lockId] && !bridgeV0.unlocks(lockSource, lockId), "Validator: funds already received");

        // Mark lock as received
        unlocks[lockSource][lockId] = true;
        return true;
    }


    function splitSignature(bytes memory sig) internal pure returns (uint8 v, bytes32 r, bytes32 s)
    {
        require(sig.length == 65);

        assembly {
        // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
        // second 32 bytes
            s := mload(add(sig, 64))
        // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }

        return (v, r, s);
    }

    function recoverSigner(bytes32 message, bytes memory sig) internal pure returns (address)
    {
        (uint8 v, bytes32 r, bytes32 s) = splitSignature(sig);

        return ecrecover(message, v, r, s);
    }

    /// builds a prefixed hash to mimic the behavior of eth_sign.
    function prefixed(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }
}
