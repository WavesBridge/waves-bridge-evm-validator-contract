require("ts-node").register({files: true,});
require('source-map-support').install({hookRequire: true});
require('dotenv').config();
const HDWalletProvider = require("@truffle/hdwallet-provider");
let LedgerWalletProvider;

const USE_LEDGER = false;
if (USE_LEDGER) {
  LedgerWalletProvider = require('truffle-ledger-provider');
}

const defaultLedgerOptions = {
  networkId: 1, // mainnet
  path: "44'/60'/0'/0", // ledger default derivation path
  askConfirm: false,
  accountsLength: 1,
  accountsOffset: 0
};

module.exports = {
  networks: {
    ganache: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*" // Match any network id
    },
    goerli: {
      provider: () => {
        return new HDWalletProvider({
          privateKeys: [process.env.GOERLI_PK],
          providerOrUrl: 'https://goerli.infura.io/v3/' + process.env.INFURA_KEY
        });
      },
      network_id: '5',
      gas: 8000000,
      gasPrice: 10e9,
    },
    ropsten: {
      provider: () => {
        return new HDWalletProvider({
          privateKeys: [process.env.ROPSTEN_PK],
          providerOrUrl: 'https://ropsten.infura.io/v3/' + process.env.INFURA_KEY
        });
      },
      network_id: '3',
      gas: 8000000,
      gasPrice: 10e9,
    },
    kovan: {
      provider: () => {
        return new HDWalletProvider({
          privateKeys: [process.env.KOVAN_PK],
          providerOrUrl: 'https://kovan.infura.io/v3/' + process.env.INFURA_KEY
        });
      },
      network_id: '42',
      gas: 8000000,
      gasPrice: 10e9,
    },
    mainnet: {
      provider: function() {
        const url = 'https://mainnet.infura.io/v3/' + process.env.INFURA_KEY;
        return USE_LEDGER ?
          new LedgerWalletProvider({...defaultLedgerOptions, networkId: 1}, url)
          : new HDWalletProvider({
          privateKeys: [process.env.MAINNET_PK],
          providerOrUrl: url
        });
      },
      gas: 5000000,
      gasPrice: 15e9,
      network_id: 1
    },
    bsc: {
      provider: function() {
        const url = 'https://bsc-dataseed.binance.org'
        return  USE_LEDGER ?
          new LedgerWalletProvider({...defaultLedgerOptions, networkId: 56}, url)
          : new HDWalletProvider({
          privateKeys: [process.env.BSC_PK],
          providerOrUrl: url
        });
      },
      gas: 5000000,
      gasPrice: 10e9,
      network_id: '56', // eslint-disable-line camelcase
    },
    heco: {
      provider: function() {
        const url = 'https://http-mainnet-node.huobichain.com';
        return USE_LEDGER ?
          new LedgerWalletProvider({...defaultLedgerOptions, networkId: 128}, url)
          : new HDWalletProvider({
          privateKeys: [process.env.HECO_PK],
          providerOrUrl: url
          });
      },
      gas: 5000000,
      gasPrice: 10e9,
      network_id: '128', // eslint-disable-line camelcase
    },
    polygon: {
      provider: function() {
        const url = 'https://rpc-mainnet.maticvigil.com/'
        return USE_LEDGER ?
          new LedgerWalletProvider({...defaultLedgerOptions, networkId: 137}, url)
          : new HDWalletProvider({
          privateKeys: [process.env.POLYGON_PK],
          providerOrUrl: url
        });
      },
      gas: 8000000,
      gasPrice: 50e9,
      network_id: '137', // eslint-disable-line camelcase
    }
  },
  compilers: {
    solc: {
      version: "^0.8",
    }
  }
};
