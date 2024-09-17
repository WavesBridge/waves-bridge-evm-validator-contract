const {question, pressAnyKey} = require("./_utils");
const Validator = artifacts.require("Validator");

module.exports = async (callback) => {
  try {
    const validatorAddress = await question('What Validator contract address do you want to use?');
    const validator = await Validator.at(validatorAddress);
    const oracle = await question('Oracle address');

    console.log(`You are going to set oracle address to ${oracle} for validator ${validatorAddress}`)
    await pressAnyKey()
    console.log(`Sending...`);
    const tx = await validator.setOracle(oracle);
    console.log('Success', tx.receipt.transactionHash);
  } catch (e) {
    console.log(e);
  }
  callback()
};

