// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./interfaces/IValidator.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

uint128 constant pow120 = 2 ** 120;

contract Validator is IValidator, Ownable {
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
    mapping(uint128 => Lock) public locks;

    // Map for received transactions
    // source => lockId => true
    mapping(bytes4 => mapping(uint128 => bool)) public unlocks;

    address private oracle;
    bytes4 public blockchainId;
    address public bridge;
    uint8 public version;

    modifier onlyBridge() {
        require(msg.sender == bridge, "Validator: caller is not the bridge");
        _;
    }

    modifier checkLockVersion(uint128 lockId) {
        require(uint8(lockId / pow120) == version, "Validator: wrong lock version");
        _;
    }

    constructor(address _oracle, bytes4 _blockchainId, address _bridge, uint8 _version) {
        oracle = _oracle;
        blockchainId = _blockchainId;
        bridge = _bridge;
        version = _version;
    }

    function createLock(
        uint128 lockId,
        address sender,
        bytes32 recipient,
        uint256 amount,
        bytes4 destination,
        bytes4 tokenSource,
        bytes32 tokenSourceAddress
    ) external override onlyBridge checkLockVersion(lockId) returns (uint128)  {
        require(destination != blockchainId, "Validator: source chain");
        require(locks[lockId].sender == address(0), "Validator: lock id already exists");


        // Create and add lock structure to the locks list
        locks[lockId] = Lock({
            sender: sender,
            recipient: recipient,
            amount: amount,
            destination: destination,
            tokenSource: tokenSource,
            tokenSourceAddress: tokenSourceAddress
        });

        return lockId;
    }

    function createUnlock(
        uint128 lockId,
        address recipient,
        uint256 amount,
        bytes4 lockSource,
        bytes4 tokenSource,
        bytes32 tokenSourceAddress,
        bytes calldata signature
    ) external override onlyBridge checkLockVersion(lockId) returns (bool) {
        bytes32 hash = keccak256(abi.encodePacked(lockId, recipient, amount, lockSource, tokenSource, tokenSourceAddress, blockchainId, "unlock"));
        require(recoverSigner(prefixed(hash), signature) == oracle, "Validator: invalid signature");

        require(!unlocks[lockSource][lockId], "Validator: funds already received");

        // Mark lock as received
        unlocks[lockSource][lockId] = true;
        return true;
    }

    function setOracle(address _oracle) public onlyOwner {
        oracle = _oracle;
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
