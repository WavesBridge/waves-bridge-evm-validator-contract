import Web3 from 'web3';

module.exports = (artifacts: Truffle.Artifacts) => {
  return async function (deployer: Truffle.Deployer, network: string, addresses: string[]) {
    if (network === 'test') {
      return;
    }
    if (network === 'polygon-fork') {
      network = 'polygon';
    }
    if (network === 'mainnet-fork') {
      network = 'mainnet';
    }
    if (network === 'heco-fork') {
      network = 'heco';
    }
    if (network === 'bsc-fork') {
      network = 'bsc';
    }
    const isDev = ['ganache', 'test', 'develop', 'goerli', 'ropsten', 'kovan'].includes(network);
    const chainIdMap = {
      ganache: 'GNCH',
      test: 'TST',
      develop: 'DEV',
      goerli: 'GRL',
      ropsten: 'RPS',
      kovan: 'KVN',
      mainnet: process.env.BLOCKCHAIN_ID_ETH,
      bsc: process.env.BLOCKCHAIN_ID_BSC,
      heco: process.env.BLOCKCHAIN_ID_HECO,
      polygon: process.env.BLOCKCHAIN_ID_POL
    }
    let oracleAddress: string | undefined;
    let bridgeV0: string | undefined;
    if (isDev) {
      oracleAddress = '0xC709Eb04f69442B4Cb6A9b472F810aA705E3FaA2';
    }
    switch (network) {
      case 'mainnet':
        oracleAddress = process.env.ORACLE_ADDRESS_ETH;
        bridgeV0 = process.env.BRIDGE_V0_ETH;
        break;
      case 'bsc':
        oracleAddress = process.env.ORACLE_ADDRESS_BSC;
        bridgeV0 = process.env.BRIDGE_V0_BSC;
        break;
      case 'heco':
        oracleAddress = process.env.ORACLE_ADDRESS_HECO;
        bridgeV0 = process.env.BRIDGE_V0_HECO;
        break;
      case 'polygon':
        oracleAddress = process.env.ORACLE_ADDRESS_POL;
        bridgeV0 = process.env.BRIDGE_V0_POL;
        break;
    }

    if (!oracleAddress) {
      throw new Error('Oracle address not specified');
    }

    if (!bridgeV0) {
      throw new Error('Bridge v0 address not specified');
    }

    if (!chainIdMap[network]) {
      throw new Error('Chain id is not specified');
    }

    console.log(oracleAddress);
    console.log(bridgeV0);

    const validator = artifacts.require('Validator');

    await deployer.deploy(validator, bridgeV0, oracleAddress, Web3.utils.padRight(Web3.utils.asciiToHex(chainIdMap[network]), 8, '0'));
  } as Truffle.Migration;
};
