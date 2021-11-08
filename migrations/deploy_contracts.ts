import Web3 from 'web3';

module.exports = (artifacts: Truffle.Artifacts) => {
  return async function (deployer: Truffle.Deployer, network: string, addresses: string[]) {
    if (network === 'test') {
      return;
    }

    network = network.replace('-fork', '');
    const isDev = ['ganache', 'test', 'develop', 'goerli', 'ropsten', 'kovan'].includes(network);

    let oracleAddress: string | undefined;
    let bridge: string | undefined;
    let chainId: string | undefined;
    if (isDev) {
      oracleAddress = '0xC709Eb04f69442B4Cb6A9b472F810aA705E3FaA2';
    }
    switch (network) {
      case 'mainnet':
        oracleAddress = process.env.ORACLE_ADDRESS_ETH;
        bridge = process.env.BRIDGE_ETH;
        chainId = process.env.BLOCKCHAIN_ID_ETH;
        break;
      case 'bsc':
        oracleAddress = process.env.ORACLE_ADDRESS_BSC;
        bridge = process.env.BRIDGE_BSC;
        chainId = process.env.BLOCKCHAIN_ID_BSC;
        break;
      case 'heco':
        oracleAddress = process.env.ORACLE_ADDRESS_HECO;
        bridge = process.env.BRIDGE_HECO;
        chainId = process.env.BLOCKCHAIN_ID_HECO;
        break;
      case 'polygon':
        oracleAddress = process.env.ORACLE_ADDRESS_POL;
        bridge = process.env.BRIDGE_POL;
        chainId = process.env.BLOCKCHAIN_ID_POL;
        break;
      case 'avalanche':
        oracleAddress = process.env.ORACLE_ADDRESS_AVA;
        bridge = process.env.BRIDGE_AVA;
        chainId = process.env.BLOCKCHAIN_ID_AVA;
        break;
      case 'celo':
        oracleAddress = process.env.ORACLE_ADDRESS_CELO;
        bridge = process.env.BRIDGE_CELO;
        chainId = process.env.BLOCKCHAIN_ID_CELO;
        break;
      case 'kovan':
        oracleAddress = process.env.ORACLE_ADDRESS_KVN;
        bridge = process.env.BRIDGE_KVN;
        chainId = process.env.BLOCKCHAIN_ID_KVN;
        break;
    }

    const version = process.env.VERSION == null ? null : +process.env.VERSION;

    if (!oracleAddress) {
      throw new Error('Oracle address not specified');
    }

    if (!bridge) {
      throw new Error('Bridge address not specified');
    }

    if (!chainId) {
      throw new Error('Chain id is not specified');
    }

    if (version == null) {
      throw new Error('Version is not specified');
    }

    console.log('oracleAddress', oracleAddress);
    console.log('bridge', bridge);
    console.log('chainId', chainId);

    const validator = artifacts.require('Validator');

    await deployer.deploy(validator, oracleAddress, Web3.utils.padRight(Web3.utils.asciiToHex(chainId), 8, '0'), bridge, version);
  } as Truffle.Migration;
};
