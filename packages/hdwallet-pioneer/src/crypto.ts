/*
    Pioneer
        * A multi-coin multi-purpose concurrency lib

 */

const TAG = " | Pioneer | ";

const bip39 = require(`bip39`);
const bip32 = require(`bip32`);
const bech32 = require(`bech32`);
const secp256k1 = require(`secp256k1`);
const sha256 = require("crypto-js/sha256");
const ripemd160 = require("crypto-js/ripemd160");
const CryptoJS = require("crypto-js");
const HDKey = require("hdkey");
const bitcoin = require("bitcoinjs-lib");
const b58 = require("bs58check");
const BIP84 = require("bip84");
const ethUtils = require("ethereumjs-util");
let {PrivateKey:eosPrivateKey} = require('eosjs-ecc')
//imports
// import * as Cardano from "cardano-wallet";

/**********************************
 // Module
 //**********************************/

enum COIN_SUPPORT_ENUM {
  ETH,
  BTC,
  BCH,
  DASH,
  DGB,
  DOGE,
  LTC,
  RDD,
  ATOM,
}

const COIN_SUPPORT = ["ETH", "BTC", "BCH", "DASH", "DGB", "DOGE", "LTC", "RDD", "ATOM", "BNB", "EOS"];

const supportedCoins = [
  "Bitcoin",
  "Testnet",
  "BitcoinCash",
  "BitcoinGold",
  "Litecoin",
  "Dash",
  "DigiByte",
  "Dogecoin",
];

const segwitCoins = ["Bitcoin", "Testnet", "BitcoinGold", "Litecoin"];

let prefurredScripts:any = {
  BTC:"p2pkh",
  LTC:"p2pkh",
  ETH:"eth",
  EOS:"eos",
  BNB:"binance",
  ATOM:"cosmos"
}

const ASSET_MAP = {
  BTC: "Bitcoin",
  BTCT: "Testnet",
  ETH: "Ethereum",
  BCH: "BitcoinCash",
  LTC: "Litecoin",
  DASH: "Dash",
  DGB: "DigiByte",
  DOGE: "Dogecoin",
  ATOM: "Cosmos",
  BNB: "Binance",
  EOS: "Eos",
  XRP: "Ripple",
};

const SLIP_44: any = {
  ETH: 60,
  ATOM: 118,
  BNB: 714,
  EOS: 194,
  TRX: 195,
  BTC: 0,
  BCH: 145,
  LTC: 2,
  DOGE: 3,
  RDD: 4,
  DASH: 5,
  DGB: 20,
};

const NETWORKS: any = {
  btc: {
    messagePrefix: "\x18Bitcoin Signed Message:\n",
    bech32: "bc",
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4,
    },
    pubKeyHash: 0x00,
    scriptHash: 0x05,
    wif: 0x80,
  },
  bch: {
    messagePrefix: "\x18Bitcoin Cash Signed Message:\n",
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4,
    },
    pubKeyHash: 0x00,
    scriptHash: 0x05,
    wif: 0x80,
  },
  test: {
    messagePrefix: "\x18Bitcoin Signed Message:\n",
    bech32: "tb",
    bip32: {
      public: 0x043587cf,
      private: 0x04358394,
    },
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef,
  },
  ltc: {
    messagePrefix: "\x19Litecoin Signed Message:\n",
    bip32: {
      public: 0x019da462,
      private: 0x019d9cfe,
    },
    pubKeyHash: 0x30,
    scriptHash: 0x32,
    wif: 0xb0,
  },
  doge: {
    messagePrefix: "\x19Dogecoin Signed Message:\n",
    bip32: {
      public: 0x02fd3929,
      private: 0x02fd3955,
    },
    pubKeyHash: 0x1e,
    scriptHash: 0x16,
    wif: 0x9e,
  },
  dash: {
    messagePrefix: "unused",
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4,
    },
    pubKeyHash: 0x4c,
    scriptHash: 0x10,
    wif: 0xcc,
  },
  dgb: {
    messagePrefix: "\x18DigiByte Signed Message:\n",
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4,
    },
    pubKeyHash: 0x1e,
    scriptHash: 0x3f,
    wif: 0x80,
  },
  rdd: {
    messagePrefix: "\x18Reddcoin Signed Message:\n",
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4,
    },
    pubKeyHash: 0x3d,
    scriptHash: 0x05,
    wif: 0xbd,
  },
};


//export interface PubkeyTypes  address | xpub

/*
  Citadel Wallet Format

 */

// TYPES
export interface AssetInfo {
  asset: string;
  note?: string;
  script_type:string;
  available_scripts_types?:[string]
  long?: string;
  path:string
  master: string;
  network:string;
  pubkey: string;
  curve?: string,
  xpub?: string;
  zpub?: string;
  type?:string
}

export interface AssetInfoPriv {
  asset: string;
  long?: string;
  path: string
  master?:string
  masterPrivkey: string;
  pubkey?:string,
  privkey:string,
  xpriv?: string;
  type?:string
}

interface Wallet {
  walletPrivate:{
    assets: {
    [index: string]: AssetInfoPriv;
    }
  },
  walletPublic:{
    assets: {
      [index: string]: AssetInfo;
    }
  }
}

// All known xyx... pub formats
const prefixes: any = new Map([
  ["xpub", "0488b21e"],
  ["ypub", "049d7cb2"],
  ["Ypub", "0295b43f"],
  ["zpub", "04b24746"],
  ["Zpub", "02aa7ed3"],
  ["tpub", "043587cf"],
  ["upub", "044a5262"],
  ["Upub", "024289ef"],
  ["vpub", "045f1cf6"],
  ["Vpub", "02575483"],
]);

enum AddressTypes {
  "bech32",
  "legacy",
}

//innit
export async function xpubConvert(xpub: string, target: string) {
  let tag = TAG + " | importConfig | ";
  try {
    //
    if (!prefixes.has(target)) {
      return "Invalid target version";
    }

    // trim whitespace
    xpub = xpub.trim();

    var data = b58.decode(xpub);
    data = data.slice(4);
    data = Buffer.concat([Buffer.from(prefixes.get(target), "hex"), data]);
    return b58.encode(data);
  } catch (e) {
    console.error(tag, "e: ", e);
    throw e;
  }
}

/**
 *
 * Generate a wallet for keypairs
 *
 *
 * @param mnemonic
 * @param paths
 */

export async function generateWalletFromSeed(mnemonic: string,paths:[any]) {
  let tag = TAG + " | importConfig | ";
  try {
    console.log(tag,"paths: ",paths)
    //TODO use paths instead of defaults

    //
    let output: any = {
      walletPublic:{},
      walletPrivate:{}
    }

    //for each asset
    for (let i = 0; i < COIN_SUPPORT.length; i++) {
      let asset = COIN_SUPPORT[i];

      let path = "m/44'/" + SLIP_44[asset] + "'/0'";
      const { xpub, xpriv } = await deriveMasterKey(mnemonic, path);

      //get master address at account 0 index 0

      let publicKey = bitcoin.bip32.fromBase58(xpub).derive(0).derive(0).publicKey
      let privateKey = bitcoin.bip32.fromBase58(xpriv).derive(0).derive(0).privateKey

      // let master = bitcoin.bip32.fromBase58(xpub).derive(0).derive(0)
      let addressMaster: string = "";
      let network
      let script_type = prefurredScripts[asset]

      //key off assets
      let type
      if (asset === "BTC") {
        type = "xpub"
        let { address: address } = bitcoin.payments.p2wpkh({
          pubkey: publicKey,
          network: NETWORKS[asset.toLowerCase()],
        });
        script_type = 'p2wpkh'
        addressMaster = address;
        network = 'BTC'
      } else if (asset === "ETH") {
        type = "xpub"
        var address;
        address = ethUtils.bufferToHex(ethUtils.pubToAddress(publicKey, true));
        addressMaster = address;
        network = 'ETH'
      } else if (asset === "ATOM") {
        type = "xpub"
        var address;
        address = createCosmosAddress(publicKey)
        addressMaster = address;
        network = 'COSMOS'
      } else if (asset === "BNB") {
        type = "xpub"
        var address;
        address = createBNBAddress(publicKey)
        addressMaster = address;
        network = 'BNB'
      }else if (asset === "XRP") {
        type = "xpub"
        network = 'XRP'
      }else if (asset === "EOS") {
        type = "address"
        var address;
        address = createEOSAddress(privateKey)
        addressMaster = address;
        network = 'EOS'
      }else if (asset === "ADA") {
        //TODO
      }else {
        network = asset
        type = "xpub"
        let { address: address } = bitcoin.payments.p2pkh({
          pubkey: publicKey,
          network: NETWORKS[asset.toLowerCase()],
        });
        addressMaster = address;
      }


      let pubkey
      let privkey
      //if xpriv
      if(type === 'address'){
        pubkey = addressMaster
        privkey = privateKey.toString('hex')
      } else {
        pubkey = xpub
        privkey = xpriv
      }

      let assetInfoPriv: AssetInfoPriv = {
        asset,
        path,
        master: addressMaster,
        masterPrivkey: privateKey.toString('hex'),
        privkey,
        pubkey:xpub,
        xpriv,
      };

      //console.log("MASTER: ",addressMaster);
      let assetInfo: AssetInfo = {
        asset,
        script_type,
        network,
        path,
        long: ASSET_MAP[asset],
        master: addressMaster,
        pubkey,
        xpub,
        type
      };


     // console.log({ assetInfo });
      output.walletPublic[asset] = assetInfo;
      output.walletPrivate[asset] = assetInfoPriv;
    }

    return output;
  } catch (e) {
    console.error(tag, "e: ", e);
    throw e;
  }
}

// NOTE: this only works with a compressed public key (33 bytes)
function createCosmosAddress(publicKey) {
  const message = CryptoJS.enc.Hex.parse(publicKey.toString(`hex`))
  const hash = ripemd160(sha256(message)).toString()
  const address = Buffer.from(hash, `hex`)
  const cosmosAddress = bech32ify(address, `cosmos`)
  return cosmosAddress
}


// NOTE: this only works with a compressed public key (33 bytes)
function createEOSAddress(privateKey) {
  try{
    privateKey = eosPrivateKey.fromBuffer(privateKey)
    privateKey = privateKey.toWif()
    let pubkey = eosPrivateKey.fromString(privateKey).toPublic().toString()
    return pubkey
  }catch(e){
    throw Error(e)
  }
}

// NOTE: this only works with a compressed public key (33 bytes)
function createBNBAddress(publicKey) {
  const message = CryptoJS.enc.Hex.parse(publicKey.toString(`hex`))
  const hash = ripemd160(sha256(message)).toString()
  const address = Buffer.from(hash, `hex`)
  const bnbAddress = bech32ify(address, `bnb`)
  return bnbAddress
}



export async function generatePubkey(asset: string, xpub: string, path: string) {
  let tag = TAG + " | importConfig | ";
  try {
    let publicKey;
    if (asset === "BTC") {
      //TODO we need flexable paths!
      //publicKey = bitcoin.bip32.fromBase58(xpub).derivePath(path).publicKey

      //notice assumes index wtf
      publicKey = bitcoin.bip32.fromBase58(xpub).derive(0).publicKey;
    } else if (asset === "ETH") {
      publicKey = bitcoin.bip32.fromBase58(xpub).derive(0).publicKey;
    } else {
      //assume bitcoinish?
      //TODO fixme
      //publicKey = bitcoin.bip32.fromBase58(xpub).derivePath(path).publicKey

      publicKey = bitcoin.bip32.fromBase58(xpub).derive(0).publicKey;
    }

    //console.log("publicKey: ",publicKey)
    return publicKey.toString(`hex`);
  } catch (e) {
    console.error(tag, "e: ", e);
    throw e;
  }
}

export async function generateAddress(asset: string, pubkey: any, type: any) {
  let tag = TAG + " | importConfig | ";
  try {
    let output: any;
    switch (asset) {
      case "BTC":
        //if no type default to bech32
        if (!type) type = "bech32";

        if (type === "bech32") {
          const { address } = bitcoin.payments.p2wpkh({
            pubkey: Buffer.from(pubkey, "hex"),
          });
          output = address;
        } else if (type === "legacy") {
          const { address } = bitcoin.payments.p2pkh({
            pubkey: Buffer.from(pubkey, "hex"),
          });
          output = address;
        }

        break;
      case "ETH":
        //
        let addressETH = ethUtils.bufferToHex(
          ethUtils.pubToAddress(Buffer.from(pubkey, "hex"), true)
        );
        output = addressETH;
        break;
      case "ATOM":
        //
        const message = CryptoJS.enc.Hex.parse(pubkey.toString(`hex`));
        const hash = ripemd160(sha256(message)).toString();
        const addressCosmos = Buffer.from(hash, `hex`);
        const cosmosAddress = bech32ify(addressCosmos, `cosmos`);
        output = cosmosAddress;
        break;
      default:
        if (!NETWORKS[asset.toLowerCase()])
          throw Error("103: unknown asset, no network found! asset: " + asset);
        const { address } = bitcoin.payments.p2pkh({
          pubkey: Buffer.from(pubkey, "hex"),
          network: NETWORKS[asset.toLowerCase()],
        });

        output = address;
        break;
    }
    return output;
  } catch (e) {
    console.error(tag, "e: ", e);
    throw e;
  }
}
//get Xpub

function bech32ify(address, prefix) {
  const words = bech32.toWords(address);
  return bech32.encode(prefix, words);
}

//Build Seed
function standardRandomBytesFunc(size: any) {
  /* istanbul ignore if: not testable on node */

  return CryptoJS.lib.WordArray.random(size).toString();
}

async function deriveMasterKey(mnemonic: string, path: string) {
  // throws if mnemonic is invalid
  bip39.validateMnemonic(mnemonic);

  const seed = await bip39.mnemonicToSeed(mnemonic);
  let mk = new HDKey.fromMasterSeed(Buffer.from(seed, "hex"));
  //console.log(mk.publicExtendedKey)

  //get key
  mk = mk.derive(path);
  //console.log(mk.publicExtendedKey)

  //get extended keys
  let xpub = mk.publicExtendedKey;
  let xpriv = mk.privateExtendedKey;

  const masterKey = bip32.fromSeed(seed);

  return { masterKey, xpub, xpriv, path };
}

function deriveKeypair(masterKey: any, path: string) {
  const master = masterKey.derivePath(path);
  const privateKey = master.privateKey;
  const publicKey = secp256k1.publicKeyCreate(privateKey, true);

  return {
    privateKey,
    publicKey,
  };
}
