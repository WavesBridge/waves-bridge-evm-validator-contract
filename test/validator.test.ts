import { asciiToHex, padRight } from 'web3-utils';
import { MockBridgeInstance, ValidatorInstance } from '../types';
import { expectRevert, expectEvent} from '@openzeppelin/test-helpers';
import BN from 'bn.js';
import * as crypto from 'crypto';

const Validator = artifacts.require("Validator");

function addressToBytes32(address: string): string {
  return padRight(address.toLowerCase(), 64, '0')
}

function getRandomLockId(version: number): BN {
  const buffer = crypto.randomBytes(16);
  buffer[0] = version
  return new BN(buffer);
}

function sign(privateKey, lockId, recipient, amount, lockSource, tokenSource, tokenSourceAddress, destination) {
  const hash = web3.utils.soliditySha3(
    {t: 'uint128', v: lockId},
    {t: 'address', v: recipient},
    {t: 'uint256', v: amount},
    {t: 'bytes4', v: lockSource},
    {t: 'bytes4', v: tokenSource},
    {t: 'bytes32', v: tokenSourceAddress},
    {t: 'bytes4', v: destination},
    {t: 'string', v: "unlock"},
  );
  if (!hash) {
    throw new Error('Cannot get a hash');
  }
  const sign = web3.eth.accounts.sign(hash, privateKey);
  return sign.signature;
}

contract('Validator', (accounts) => {
  const A_NETWORK = 'GRL';
  const A_NETWORK_HEX = padRight(asciiToHex(A_NETWORK), 8);
  const B_NETWORK = 'RPS';
  const B_NETWORK_HEX = padRight(asciiToHex(B_NETWORK), 8);
  const oracle = web3.eth.accounts.create();
  const version = 1;
  const theLockId = getRandomLockId(version);

  let bridge = accounts[0];
  let validator: ValidatorInstance;

  before(async () => {
    validator = await Validator.new(oracle.address, A_NETWORK_HEX, bridge, version);
  })

  it('success: create lock', async () => {
    const sender = web3.eth.accounts.create();
    const recipient = web3.eth.accounts.create();
    const token = web3.eth.accounts.create();
    const amount = 1000;
    const lockId = theLockId;
    await validator.createLock(lockId, sender.address, recipient.address, amount, B_NETWORK_HEX, A_NETWORK_HEX, token.address);
    const lock = await validator.locks(lockId);
    expect(lock).deep.include({
      sender: sender.address,
      recipient: addressToBytes32(recipient.address),
      destination: B_NETWORK_HEX,
      tokenSourceAddress: addressToBytes32(token.address),
      tokenSource: A_NETWORK_HEX
    });
  });

  it('fail: lock source chain', async () => {
    const sender = web3.eth.accounts.create();
    const recipient = web3.eth.accounts.create();
    const token = web3.eth.accounts.create();
    const amount = 1000;
    const lockId = theLockId;
    await expectRevert(validator.createLock(lockId, sender.address, recipient.address, amount, A_NETWORK_HEX, A_NETWORK_HEX, token.address), "Validator: source chain");
  });

  it('fail: lock source chain', async () => {
    const sender = web3.eth.accounts.create();
    const recipient = web3.eth.accounts.create();
    const token = web3.eth.accounts.create();
    const amount = 1000;
    const lockId = theLockId;
    await expectRevert(validator.createLock(lockId, sender.address, recipient.address, amount, B_NETWORK_HEX, A_NETWORK_HEX, token.address), "Validator: lock id already exists");
  });

  it('fail: wrong version', async () => {
    const sender = web3.eth.accounts.create();
    const recipient = web3.eth.accounts.create();
    const token = web3.eth.accounts.create();
    const amount = 1000;
    const lockId = getRandomLockId(2);
    await expectRevert(validator.createLock(lockId, sender.address, recipient.address, amount, B_NETWORK_HEX, A_NETWORK_HEX, token.address), "Validator: wrong lock version");
  });

  it('success: set oracle', async () => {
    const newOracle = web3.eth.accounts.create().address;
    await validator.setOracle(newOracle);

    const recipient = web3.eth.accounts.create();
    const token = web3.eth.accounts.create();
    const amount = 1000;
    const lockId = theLockId;
    const lockSource = B_NETWORK_HEX;
    const tokenSource = A_NETWORK_HEX;
    const destination = A_NETWORK_HEX;
    const signature = sign(oracle.privateKey, lockId, recipient.address, amount, lockSource, tokenSource, token.address, destination)
    await expectRevert(validator.createUnlock(lockId, recipient.address, amount, lockSource, tokenSource, token.address, signature), "Validator: invalid signature");
  });

  it('fail: set oracle invalid owner', async () => {
    const newOracle = web3.eth.accounts.create().address;
    await expectRevert(validator.setOracle(newOracle, {from: accounts[3]}), "Ownable: caller is not the owner");
  });

  it('success: set oracle back', async () => {
    await validator.setOracle(oracle.address);
  });

  it('success: create unlock', async () => {
    const recipient = web3.eth.accounts.create();
    const token = web3.eth.accounts.create();
    const amount = 1000;
    const lockId = theLockId;
    const lockSource = B_NETWORK_HEX;
    const tokenSource = A_NETWORK_HEX;
    const destination = A_NETWORK_HEX;
    const signature = sign(oracle.privateKey, lockId, recipient.address, amount, lockSource, tokenSource, token.address, destination)
    await validator.createUnlock(lockId, recipient.address, amount, lockSource, tokenSource, token.address, signature);

    expect(await validator.unlocks(lockSource, lockId)).eq(true);
  });

  it('fail: unlock already exists', async () => {
    const recipient = web3.eth.accounts.create();
    const token = web3.eth.accounts.create();
    const amount = 1000;
    const lockId = theLockId;
    const lockSource = B_NETWORK_HEX;
    const tokenSource = A_NETWORK_HEX;
    const destination = A_NETWORK_HEX;
    const signature = sign(oracle.privateKey, lockId, recipient.address, amount, lockSource, tokenSource, token.address, destination)
    await expectRevert(validator.createUnlock(lockId, recipient.address, amount, lockSource, tokenSource, token.address, signature), "Validator: funds already received");
  });


  it('fail: unlock wrong version', async () => {
    const recipient = web3.eth.accounts.create();
    const token = web3.eth.accounts.create();
    const amount = 1000;
    const lockId = getRandomLockId(2);
    const lockSource = B_NETWORK_HEX;
    const tokenSource = A_NETWORK_HEX;
    const destination = A_NETWORK_HEX;
    const signature = sign(oracle.privateKey, lockId, recipient.address, amount, lockSource, tokenSource, token.address, destination)
    await expectRevert(validator.createUnlock(lockId, recipient.address, amount, lockSource, tokenSource, token.address, signature), "Validator: wrong lock version");
  });

  it('fail: unlock invalid signature', async () => {
    const recipient = web3.eth.accounts.create();
    const token = web3.eth.accounts.create();
    const wrongRecipient = web3.eth.accounts.create();
    const amount = 1000;
    const lockId = getRandomLockId(version);
    const lockSource = B_NETWORK_HEX;
    const tokenSource = A_NETWORK_HEX;
    const destination = A_NETWORK_HEX;
    const signature = sign(oracle.privateKey, lockId, wrongRecipient.address, amount, lockSource, tokenSource, token.address, destination)
    await expectRevert(validator.createUnlock(lockId, recipient.address, amount, lockSource, tokenSource, token.address, signature), "Validator: invalid signature");

    expect(await validator.unlocks(lockSource, lockId)).eq(false);
  });
});
