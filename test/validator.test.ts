import { asciiToHex, padRight } from 'web3-utils';
import { MockBridgeInstance, ValidatorInstance } from '../types';
import { expectRevert} from '@openzeppelin/test-helpers';

const Validator = artifacts.require("Validator");
const Bridge = artifacts.require("MockBridge");

function addressToBytes32(address: string): string {
  return padRight(address.toLowerCase(), 64, '0')
}

function sign(privateKey, lockId, recipient, amount, lockSource, tokenSource, tokenSourceAddress, destination) {
  const hash = web3.utils.soliditySha3(
    {t: 'uint256', v: lockId},
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

  let bridge: MockBridgeInstance;
  let validator: ValidatorInstance;

  before(async () => {
    bridge = await Bridge.new();
    validator = await Validator.new(bridge.address, oracle.address, A_NETWORK_HEX);
  })

  it('success: create lock', async () => {
    const sender = web3.eth.accounts.create();
    const recipient = web3.eth.accounts.create();
    const token = web3.eth.accounts.create();
    const amount = 1000;
    const lockId = (await validator.lockLength()).toString();
    await validator.createLock(sender.address, recipient.address, amount, B_NETWORK_HEX, A_NETWORK_HEX, token.address);

    const lock = await validator.locks(lockId);
    expect(lock).deep.include({
      sender: sender.address,
      recipient: addressToBytes32(recipient.address),
      destination: B_NETWORK_HEX,
      tokenSourceAddress: addressToBytes32(token.address),
      tokenSource: A_NETWORK_HEX
    });
  });

  it('success: create unlock', async () => {
    const recipient = web3.eth.accounts.create();
    const token = web3.eth.accounts.create();
    const amount = 1000;
    const lockId = 7;
    const lockSource = B_NETWORK_HEX;
    const tokenSource = A_NETWORK_HEX;
    const destination = A_NETWORK_HEX;
    const signature = sign(oracle.privateKey, lockId, recipient.address, amount, lockSource, tokenSource, token.address, destination)
    await validator.createUnlock(lockId, recipient.address, amount, lockSource, tokenSource, token.address, signature);

    expect(await validator.unlocks(lockSource, lockId)).eq(true);
  });

  it('fail: already exists', async () => {
    const recipient = web3.eth.accounts.create();
    const token = web3.eth.accounts.create();
    const amount = 1000;
    const lockId = 7;
    const lockSource = B_NETWORK_HEX;
    const tokenSource = A_NETWORK_HEX;
    const destination = A_NETWORK_HEX;
    const signature = sign(oracle.privateKey, lockId, recipient.address, amount, lockSource, tokenSource, token.address, destination)
    await expectRevert(validator.createUnlock(lockId, recipient.address, amount, lockSource, tokenSource, token.address, signature), "Validator: funds already received");
  });

  it('fail: invalid signature', async () => {
    const recipient = web3.eth.accounts.create();
    const token = web3.eth.accounts.create();
    const wrongRecipient = web3.eth.accounts.create();
    const amount = 1000;
    const lockId = 8;
    const lockSource = B_NETWORK_HEX;
    const tokenSource = A_NETWORK_HEX;
    const destination = A_NETWORK_HEX;
    const signature = sign(oracle.privateKey, lockId, wrongRecipient.address, amount, lockSource, tokenSource, token.address, destination)
    await expectRevert(validator.createUnlock(lockId, recipient.address, amount, lockSource, tokenSource, token.address, signature), "Validator: invalid signature");

    expect(await validator.unlocks(lockSource, lockId)).eq(false);
  });
});
