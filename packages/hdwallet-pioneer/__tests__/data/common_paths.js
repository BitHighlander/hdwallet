let paths = [
    {
        note:"",
        type:"xpub",
        addressNList: [0x80000000 + 44, 0x80000000 + 0, 0x80000000 + 0],
        curve: 'secp256k1',
        showDisplay: true, // Not supported by TrezorConnect or Ledger, but KeepKey should do it
        coin: 'Bitcoin',
        symbol: 'BTC'
    },
    {
        coin: 'Bitcoin',
        symbol: 'BTC',
        note:"",
        type:"xpub",
        addressNList: [0x80000000 + 44, 0x80000000 + 0, 0x80000000 + 1],
        curve: 'secp256k1',
        showDisplay: true // Not supported by TrezorConnect or Ledger, but KeepKey should do it
    },
    {
        coin: 'Bitcoin',
        symbol: 'BTC',
        note:"",
        type:"xpub",
        addressNList: [0x80000000 + 49, 0x80000000 + 0, 0x80000000 + 0],
        curve: 'secp256k1',
        showDisplay: true, // Not supported by TrezorConnect or Ledger, but KeepKey should do it
        scriptType: 'p2sh'
    },
    {
        coin: 'Litecoin',
        symbol: 'LTC',
        note:"",
        type:"xpub",
        addressNList: [0x80000000 + 44, 0x80000000 + 2, 0x80000000 + 0],
        curve: 'secp256k1',
        showDisplay: true, // Not supported by TrezorConnect or Ledger, but KeepKey should do it
    },
    {
        note:"",
        type:"address",
        addressNList: [0x80000000 + 44, 0x80000000 + 118, 0x80000000 + 0, 0x80000000 + 0],
        curve: 'secp256k1',
        showDisplay: true, // Not supported by TrezorConnect or Ledger, but KeepKey should do it
        coin: 'Ethereum'
    },
    {
        note:"",
        type:"address",
        addressNList: [0x80000000 + 44, 0x80000000 + 194, 0x80000000 + 0],
        curve: 'secp256k1',
        showDisplay: true, // Not supported by TrezorConnect or Ledger, but KeepKey should do it
        coin: 'Eos',
        symbol: 'EOS'
    },
    {
        note:"",
        type:"address",
        addressNList: [0x80000000 + 44, 0x80000000 + 714, 0x80000000 + 0],
        curve: 'secp256k1',
        showDisplay: true, // Not supported by TrezorConnect or Ledger, but KeepKey should do it
        coin: 'Binance',
        symbol: 'BNB',
    },
    {
        note:"",
        type:"address",
        addressNList: [0x80000000 + 44, 0x80000000 + 118, 0x80000000 + 0, 0x80000000 + 0],
        curve: 'secp256k1',
        showDisplay: true, // Not supported by TrezorConnect or Ledger, but KeepKey should do it
        coin: 'Cosmos',
        symbol: 'ATOM'
    },
    {
        note:"",
        type:"address",
        addressNList: [0x80000000 + 44, 0x80000000 + 118, 0x80000000 + 0, 0x80000000 + 0],
        curve: 'secp256k1',
        showDisplay: true, // Not supported by TrezorConnect or Ledger, but KeepKey should do it
        coin: 'Cardano',
        symbol: 'ADA'
    }

]



module.exports = {
    paths
}
