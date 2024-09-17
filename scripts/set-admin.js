const {question, pressAnyKey} = require("./_utils");
const Validator = artifacts.require("Validator");

module.exports = async (callback) => {
  try {
    const sender = (await web3.eth.getAccounts())[0];
    const validatorAddress = await question('What Validator contract address do you want to use?');
    const validator = await Validator.at(validatorAddress);
    const address = await question('Authority user address', sender);

    console.log(`You are going to set admin authority to ${address} for validator ${validatorAddress}`)
    await pressAnyKey()
    console.log(`Sending...`);
    const tx = await validator.transferOwnership(address);
    console.log('Success', tx.receipt.transactionHash);
  } catch (e) {
    console.log(e);
  }
  callback()
};

