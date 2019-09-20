import {
  HDWallet,
  Constructor,
  GetPublicKey,
  PublicKey,
  RecoverDevice,
  ResetDevice,
  Coin,
  Ping,
  Pong,
  BTCWallet,
  ETHWallet,
  Event,
  Events,
  fromHexString,
  toHexString,
  arrayify,
  bip32ToAddressNList,
  LoadDevice,
  LONG_TIMEOUT,
  DEFAULT_TIMEOUT,
  BTCInputScriptType,
  BTCGetAddress,
  BTCSignTx,
  BTCSignedTx,
  BTCSignMessage,
  BTCVerifyMessage,
  BTCAccountPath,
  BTCSignedMessage,
  BTCGetAccountPaths,
  ETHSignTx,
  ETHSignedTx,
  ETHGetAddress,
  ETHSignMessage,
  ETHSignedMessage,
  ETHVerifyMessage,
  ETHGetAccountPath,
  ETHAccountPath,
  DebugLinkWallet,
  HDWalletInfo,
  BTCWalletInfo,
  ETHWalletInfo,
  BIP32Path,
  slip44ByCoin,
  DescribePath,
  PathDescription,
  addressNListToBIP32
} from "@shapeshiftoss/hdwallet-core";
import * as Messages from "@keepkey/device-protocol/lib/messages_pb";
import * as Types from "@keepkey/device-protocol/lib/types_pb";

import { messageTypeRegistry } from "./typeRegistry";
import {
  protoFieldToSetMethod,
  translateInputScriptType,
} from './utils'

import * as Btc from "./bitcoin";
import * as Eth from "./ethereum"
import { KeepKeyTransport } from "./transport";

export function isKeepKey(wallet: any): wallet is KeepKeyHDWallet {
  return typeof wallet === 'object' && wallet._isKeepKey === true
}

function describeETHPath (path: BIP32Path): PathDescription {
  let pathStr = addressNListToBIP32(path)
  let unknown: PathDescription = {
    verbose: pathStr,
    coin: 'Ethereum',
    isKnown: false
  }

  if (path.length != 5)
    return unknown

  if (path[0] != 0x80000000 + 44)
    return unknown

  if (path[1] != 0x80000000 + slip44ByCoin('Ethereum'))
    return unknown

  if ((path[2] & 0x80000000) >>> 0 !== 0x80000000)
    return unknown

  if (path[3] != 0)
    return unknown

  if (path[4] != 0)
    return unknown

  let index = path[2] & 0x7fffffff
  return {
    verbose: `Ethereum Account #${index}`,
    accountIdx: index,
    wholeAccount: true,
    coin: 'Ethereum',
    isKnown: true
  }
}

function describeUTXOPath (path: BIP32Path, coin: Coin, scriptType: BTCInputScriptType): PathDescription {
  let pathStr = addressNListToBIP32(path)
  let unknown: PathDescription = {
    verbose: pathStr,
    coin,
    scriptType,
    isKnown: false
  }

  if (!Btc.btcSupportsCoin(coin))
    return unknown

  if (!Btc.btcSupportsScriptType(coin, scriptType))
    return unknown

  if (path.length !== 3 && path.length !== 5)
    return unknown

  if ((path[0] & 0x80000000) >>> 0 !== 0x80000000)
    return unknown

  let purpose = path[0] & 0x7fffffff

  if (![44, 49, 84].includes(purpose))
    return unknown

  if (purpose === 44 && scriptType !== BTCInputScriptType.SpendAddress)
    return unknown

  if (purpose === 49 && scriptType !== BTCInputScriptType.SpendP2SHWitness)
    return unknown

  if (purpose === 84 && scriptType !== BTCInputScriptType.SpendWitness)
    return unknown

  if (path[1] !== 0x80000000 + slip44ByCoin(coin))
    return unknown

  let wholeAccount = path.length === 3

  let script = {
    [BTCInputScriptType.SpendAddress]: '',
    [BTCInputScriptType.SpendP2SHWitness]: 'Segwit ',
    [BTCInputScriptType.SpendWitness]: 'Segwit Native '
  }[scriptType]

  let accountIdx = path[2] & 0x7fffffff

  if (wholeAccount) {
    return {
      coin,
      verbose: `${coin} ${script}Account #${accountIdx}`,
      accountIdx,
      wholeAccount: true,
      isKnown: true
    }
  } else {
    let change = path[3] === 1 ? 'Change ' : ''
    let addressIdx = path[4]
    return {
      coin,
      verbose: `${script}${coin} Account #${accountIdx}, ${change}Address #${addressIdx}`,
      accountIdx,
      addressIdx,
      wholeAccount: false,
      isKnown: true,
      isChange: path[3] === 1,
      scriptType
    }
  }
}

export class KeepKeyHDWalletInfo implements HDWalletInfo, BTCWalletInfo, ETHWalletInfo {
  _supportsBTCInfo: boolean = true
  _supportsETHInfo: boolean = true

  public getVendor (): string {
    return "KeepKey"
  }

  public async btcSupportsCoin (coin: Coin): Promise<boolean> {
    return Btc.btcSupportsCoin(coin)
  }

  public async btcSupportsScriptType (coin: Coin, scriptType: BTCInputScriptType): Promise<boolean> { 
    return Btc.btcSupportsScriptType(coin, scriptType)
  }

  public async btcSupportsSecureTransfer (): Promise<boolean> {
    return Btc.btcSupportsSecureTransfer()
  }

  public async btcSupportsNativeShapeShift (): Promise<boolean> {
    return Btc.btcSupportsNativeShapeShift()
  }

  public btcGetAccountPaths (msg: BTCGetAccountPaths): Array<BTCAccountPath> {
    return Btc.btcGetAccountPaths(msg)
  }

  public btcIsSameAccount (msg: Array<BTCAccountPath>): boolean {
    return Btc.btcIsSameAccount(msg)
  }

  public async ethSupportsNetwork (chain_id: number): Promise<boolean> {
    return Eth.ethSupportsNetwork(chain_id)
  }

  public async ethSupportsSecureTransfer (): Promise<boolean> {
    return Eth.ethSupportsSecureTransfer()
  }

  public async ethSupportsNativeShapeShift (): Promise<boolean> {
    return Eth.ethSupportsNativeShapeShift()
  }

  public ethGetAccountPaths (msg: ETHGetAccountPath): Array<ETHAccountPath> {
    return Eth.ethGetAccountPaths(msg)
  }

  public async hasOnDevicePinEntry(): Promise<boolean> {
    return false;
  }

  public async hasOnDevicePassphrase(): Promise<boolean> {
    return false;
  }

  public async hasOnDeviceDisplay(): Promise<boolean> {
    return true;
  }

  public async hasOnDeviceRecovery(): Promise<boolean> {
    return false;
  }

  public async hasNativeShapeShift(
    srcCoin: Coin,
    dstCoin: Coin
  ): Promise<boolean> {
    return true;
  }

  describePath (msg: DescribePath): PathDescription {
    switch (msg.coin) {
    case 'Ethereum':
      return describeETHPath(msg.path)
    default:
      return describeUTXOPath(msg.path, msg.coin, msg.scriptType)
    }
  }
}

export class KeepKeyHDWallet implements HDWallet, BTCWallet, ETHWallet, DebugLinkWallet {
  _supportsETHInfo: boolean = true
  _supportsBTCInfo: boolean = true
  _supportsDebugLink: boolean
  _isKeepKey: boolean = true;
  _isLedger: boolean = false;
  _isTrezor: boolean = false;
  _supportsETH: boolean = true;
  _supportsBTC: boolean = true;

  transport: KeepKeyTransport;
  features?: Messages.Features.AsObject;
  info: KeepKeyHDWalletInfo & HDWalletInfo

  constructor(transport: KeepKeyTransport) {
    this.transport = transport;
    this._supportsDebugLink = transport.debugLink
    this.info = new KeepKeyHDWalletInfo()
  }

  public async getDeviceID(): Promise<string> {
    return (await this.getFeatures()).deviceId;
  }

  public getVendor(): string {
    return "KeepKey"
  }

  public async getModel(): Promise<string> {
    return (await this.getFeatures()).model;
  }

  public async getLabel(): Promise<string> {
    return (await this.getFeatures()).label;
  }

  public async isInitialized (): Promise<boolean> {
    return (await this.getFeatures()).initialized
  }

  public async isLocked(): Promise<boolean> {
    const features = await this.getFeatures()
    if (features.pinProtection && !features.pinProtection)
      return true;
    if (features.passphraseProtection && !features.passphraseCached)
      return true;
    return false;
  }

  public async getPublicKeys(
    getPublicKeys: Array<GetPublicKey>
  ): Promise<Array<PublicKey>> {
    const publicKeys = [];
    for (let i = 0; i < getPublicKeys.length; i++) {
      const { coin, addressNList, curve, showDisplay, scriptType } = getPublicKeys[i];
      const GPK = new Messages.GetPublicKey();
      if (coin) GPK.setCoinName(coin)
      GPK.setAddressNList(addressNList);
      GPK.setShowDisplay(showDisplay || false)
      GPK.setEcdsaCurveName(curve || "secp256k1")
      GPK.setScriptType(translateInputScriptType(scriptType || BTCInputScriptType.SpendAddress))

      const event = await this.transport.call(
        Messages.MessageType.MESSAGETYPE_GETPUBLICKEY,
        GPK,
        showDisplay ? LONG_TIMEOUT : DEFAULT_TIMEOUT
      ) as Event
      if (event.message_type === Events.FAILURE) throw event
      const publicKey = event.proto as Messages.PublicKey

      publicKeys.push({ xpub: publicKey.getXpub() })
    }
    return publicKeys;
  }

  public async ping(msg: Ping): Promise<Pong> {
    const ping = new Messages.Ping();
    ping.setMessage(msg.msg);
    ping.setButtonProtection(msg.button || false);
    ping.setPinProtection(msg.pin || false);
    ping.setPassphraseProtection(msg.passphrase || false);
    const event = await this.transport.call(
      Messages.MessageType.MESSAGETYPE_PING,
      ping,
      msg.button || msg.pin || msg.passphrase ? LONG_TIMEOUT : DEFAULT_TIMEOUT
    ) as Event
    if(event.message_type === Events.FAILURE) throw event
    const message = event.proto as Messages.Success
    return { msg: message.getMessage() }
  }

  public async reset (msg: ResetDevice): Promise<void> {
    const resetDevice = new Messages.ResetDevice()
    resetDevice.setStrength(msg.entropy || 128)
    resetDevice.setDisplayRandom(false)
    resetDevice.setPassphraseProtection(msg.passphrase || false)
    resetDevice.setPinProtection(msg.pin || false)
    resetDevice.setLabel(msg.label)
    if (msg.autoLockDelayMs) {
      resetDevice.setAutoLockDelayMs(msg.autoLockDelayMs);
    }
    resetDevice.setU2fCounter(msg.u2fCounter || Math.floor(+new Date() / 1000));
    // resetDevice.setWordsPerGape(wordsPerScreen) // Re-enable when patch gets in
    // Send
    await this.transport.call(
      Messages.MessageType.MESSAGETYPE_RESETDEVICE,
      resetDevice,
      LONG_TIMEOUT
    );
  }

  public async recover (r: RecoverDevice): Promise<void> {
    const msg = new Messages.RecoveryDevice()
    msg.setWordCount({128:12, 192:18, 256:24}[r.entropy])
    msg.setPassphraseProtection(r.passphrase)
    msg.setPinProtection(r.pin)
    msg.setLabel(r.label)
    msg.setLanguage(r.language || 'english')
    msg.setEnforceWordlist(true)
    msg.setUseCharacterCipher(true)
    if (r.autoLockDelayMs) {
      msg.setAutoLockDelayMs(r.autoLockDelayMs);
    }
    msg.setU2fCounter(r.u2fCounter || Math.floor(+new Date() / 1000));
    await this.transport.call(
      Messages.MessageType.MESSAGETYPE_RECOVERYDEVICE,
      msg,
      LONG_TIMEOUT
    );
  }

  public async pressYes (): Promise<void> {
    return this.press(true)
  }
  
  public async pressNo (): Promise<void> {
    return this.press(false)
  }
  
  public async press (isYes: boolean): Promise<void> {
    let decision = new Messages.DebugLinkDecision()
    decision.setYesNo(isYes)
  
    await this.transport.callDebugLink(
      Messages.MessageType.MESSAGETYPE_DEBUGLINKDECISION,
      decision,
      DEFAULT_TIMEOUT,
      /*omitLock=*/false,
      /*noWait=*/true
    )
  }

  public async hasOnDevicePinEntry(): Promise<boolean> {
    return false;
  }

  public async hasOnDevicePassphrase(): Promise<boolean> {
    return false;
  }

  public async hasOnDeviceDisplay(): Promise<boolean> {
    return true;
  }

  public async hasOnDeviceRecovery(): Promise<boolean> {
    return false;
  }

  public async hasNativeShapeShift(
    srcCoin: Coin,
    dstCoin: Coin
  ): Promise<boolean> {
    return true;
  }

  public async sendPin (pin: string): Promise<void> {
    const matrixAck = new Messages.PinMatrixAck()
    matrixAck.setPin(pin)
    console.assert(undefined === await this.transport.call(Messages.MessageType.MESSAGETYPE_PINMATRIXACK, matrixAck, DEFAULT_TIMEOUT, true, true))
  }

  public async sendPassphrase (passphrase: string): Promise<void> {
    const passphraseAck = new Messages.PassphraseAck()
    passphraseAck.setPassphrase(passphrase)
    console.assert(undefined === await this.transport.call(Messages.MessageType.MESSAGETYPE_PASSPHRASEACK, passphraseAck, DEFAULT_TIMEOUT, true, true))
  }

  public async sendCharacter(character: string): Promise<void> {
    await this.sendCharacterProto(character, false, false);
  }

  public async sendCharacterDelete(): Promise<void> {
    await this.sendCharacterProto("", true, false);
  }

  public async sendCharacterDone(): Promise<void> {
    await this.sendCharacterProto("", false, true);
  }

  public async sendWord(word: string): Promise<void> {
    throw new Error("Not Yet Implemented :(");
  }

  public async sendCharacterProto(
    character: string,
    _delete: boolean,
    _done: boolean
  ): Promise<any> {
    const characterAck = new Messages.CharacterAck();
    if (character !== "") {
      characterAck.setCharacter(character);
    } else if (_delete) {
      characterAck.setDelete(_delete);
    } else if (_done) {
      characterAck.setDone(_done);
    }
    console.assert(undefined === await this.transport.call(Messages.MessageType.MESSAGETYPE_CHARACTERACK, characterAck, DEFAULT_TIMEOUT, true, true))
  }

  // ApplyPolicy enables or disables a named policy such as "ShapeShift" on the device
  public async applyPolicy (p: Types.PolicyType.AsObject): Promise<void> {
    const policy = new Types.PolicyType()
    policy.setPolicyName(p.policyName)
    policy.setEnabled(p.enabled)
    const applyPolicies = new Messages.ApplyPolicies()
    applyPolicies.setPolicyList([policy])
    await this.transport.call(Messages.MessageType.MESSAGETYPE_APPLYPOLICIES, applyPolicies, LONG_TIMEOUT)
  }

  // ApplySettings changes the label, language, and enabling/disabling the passphrase
  // The default language is english
  public async applySettings(
    s: Messages.ApplySettings.AsObject
  ): Promise<void> {
    const applySettings = new Messages.ApplySettings();
    if (s.label) {
      applySettings.setLabel(s.label);
    }
    if (s.language) {
      applySettings.setLanguage(s.language);
    }
    if (s.usePassphrase !== undefined) {
      applySettings.setUsePassphrase(s.usePassphrase);
    }
    if (s.autoLockDelayMs) {
      applySettings.setAutoLockDelayMs(s.autoLockDelayMs);
    }
    if (s.u2fCounter) {
      applySettings.setU2fCounter(s.u2fCounter);
    }
    await this.transport.call(
      Messages.MessageType.MESSAGETYPE_APPLYSETTINGS,
      applySettings
    );
  }

  // Cancel aborts the last device action that required user interaction
  // It can follow a button request, passphrase request, or pin request
  public async cancel(): Promise<void> {
    await this.transport.cancel()
  }

  // ChangePin requests setting/changing the pin
  public async changePin(): Promise<void> {
    const changePin = new Messages.ChangePin();
    // User may be propmpted for button press up to 2 times
    await this.transport.call(Messages.MessageType.MESSAGETYPE_CHANGEPIN, changePin, LONG_TIMEOUT)
  }

  // CipherKeyValue encrypts or decrypts a value with a given key, nodepath, and initializationVector
  // This method encrypts if encrypt is true and decrypts if false, the confirm paramater determines wether
  // the user is prompted on the device. See EncryptKeyValue() and DecryptKeyValue() for convenience methods
  // NOTE: If the length of the value in bytes is not divisible by 16 it will be zero padded
  public async cipherKeyValue(
    v: Messages.CipherKeyValue.AsObject
  ): Promise<string | Uint8Array> {
    // if(val.length % 16 !== 0) val = val.concat() TODO THIS
    const cipherKeyValue = new Messages.CipherKeyValue()
    cipherKeyValue.setAddressNList(v.addressNList)
    cipherKeyValue.setKey(v.key)
    cipherKeyValue.setValue(v.value)
    cipherKeyValue.setEncrypt(v.encrypt)
    cipherKeyValue.setAskOnEncrypt(v.askOnEncrypt || false)
    cipherKeyValue.setAskOnDecrypt(v.askOnDecrypt || false)
    cipherKeyValue.setIv(v.iv || '')
    const response = await this.transport.call(Messages.MessageType.MESSAGETYPE_CIPHERKEYVALUE, cipherKeyValue) as Event
    if(response.message_type === Events.FAILURE) throw event
    const ckv = response.message as Messages.CipheredKeyValue
    return ckv.getValue()
  }

  // ClearSession clears cached session values such as the pin and passphrase
  public async clearSession(): Promise<void> {
    const clearSession = new Messages.ClearSession();
    await this.transport.call(
      Messages.MessageType.MESSAGETYPE_CLEARSESSION,
      clearSession
    );
  }

  // DecryptKeyValue is a convenience method around decrypting with CipherKeyValue().
  // For more granular control of the process use CipherKeyValue()
  public async decryptKeyValue(
    v: Messages.CipherKeyValue.AsObject
  ): Promise<string | Uint8Array> {
    return this.cipherKeyValue(v);
  }

  // FirmwareErase askes the device to erase its firmware
  public async firmwareErase(): Promise<void> {
    const firmwareErase = new Messages.FirmwareErase();
    // send
    await this.transport.call(
      Messages.MessageType.MESSAGETYPE_FIRMWAREERASE,
      firmwareErase
    );
  }

  public async firmwareUpload(firmware: Buffer): Promise<void> {
    const firmwareUpload = new Messages.FirmwareUpload();
    const hash = await this.transport.getFirmwareHash(firmware);
    firmwareUpload.setPayload(firmware);
    firmwareUpload.setPayloadHash(hash);
    await this.transport.call(
      Messages.MessageType.MESSAGETYPE_FIRMWAREUPLOAD,
      firmwareUpload
    );
  }

  // Initialize assigns a hid connection to this KeepKey and send initialize message to device
  public async initialize(): Promise<Messages.Features.AsObject> {
    const initialize = new Messages.Initialize();
    const event = await this.transport.call(
      Messages.MessageType.MESSAGETYPE_INITIALIZE,
      initialize
    ) as Event
    if(event.message_type === Events.FAILURE) throw event
    this.features = event.message

    // v6.1.0 firmware changed usb serial numbers to match STM32 desig_device_id
    // If the deviceId in the features table doesn't match, then we need to
    // add another k-v pair to the keyring so it can be looked up either way.
    if (this.transport.getDeviceID() !== this.features.deviceId) {
      this.transport.keyring.addAlias(this.transport.getDeviceID(),
                                      this.features.deviceId)
    }

    return event.message as Messages.Features.AsObject
  }

  // GetFeatures returns the features and other device information such as the version, label, and supported coins
  public async getFeatures(): Promise<Messages.Features.AsObject> {
    const features = new Messages.GetFeatures();
    const event = await this.transport.call(
      Messages.MessageType.MESSAGETYPE_GETFEATURES,
      features
    ) as Event
    if(event.message_type === Events.FAILURE) throw event
    return event.message as Messages.Features.AsObject
  }

  // GetEntropy requests sample data from the hardware RNG
  public async getEntropy(size: number): Promise<Uint8Array> {
    const getEntropy = new Messages.GetEntropy();
    getEntropy.setSize(size);
    // send
    const event = await this.transport.call(Messages.MessageType.MESSAGETYPE_GETENTROPY, getEntropy, LONG_TIMEOUT)
    if(event.message_type === Events.FAILURE) throw event
    return (event.proto as Messages.Entropy).getEntropy_asU8()
  }

  // GetNumCoins returns the number of coins supported by the device regardless of if the hanve funds.
  public async getNumCoins (): Promise<number> {
    const getCoinTable = new Messages.GetCoinTable()
    const response = await this.transport.call(Messages.MessageType.MESSAGETYPE_GETCOINTABLE, getCoinTable) as Event
    if(response.message_type === Events.FAILURE) throw event
    return (response.proto as Messages.CoinTable).getNumCoins()
  }

  // GetCoinTable returns an array of Types.CoinTypes, with start and end arguments for paging.
  // You cannot request more than 10 at a time.
  public async getCoinTable (start: number = 0, end: number = start + 10): Promise<Types.CoinType.AsObject[]> {
    const getCoinTable = new Messages.GetCoinTable()
    getCoinTable.setStart(start)
    getCoinTable.setEnd(end)
    const response = await this.transport.call(Messages.MessageType.MESSAGETYPE_GETCOINTABLE, getCoinTable) as Event
    if(response.message_type === Events.FAILURE) throw event
    const coinTable = response.message as Messages.CoinTable.AsObject
    return coinTable.tableList
  }

  // LoadDevice loads a provided seed onto the device and applies the provided settings
  // including setting a pin/device label, enabling/disabling the passphrase, and whether to
  // check the checksum of the provided mnemonic
  public async loadDevice(msg: LoadDevice): Promise<void> {
    const loadDevice = new Messages.LoadDevice();
    loadDevice.setMnemonic(msg.mnemonic);
    loadDevice.setPassphraseProtection(!!msg.passphrase);
    loadDevice.setSkipChecksum(!!msg.skipChecksum);
    if (msg.pin) loadDevice.setPin(msg.pin);
    if (msg.label) loadDevice.setLabel(msg.label);
    // send
    await this.transport.call(Messages.MessageType.MESSAGETYPE_LOADDEVICE, loadDevice, LONG_TIMEOUT)
  }

  // RemovePin disables pin protection for the device. If a pin is currently enabled
  // it will prompt the user to enter the current pin
  public async removePin(): Promise<void> {
    const changePin = new Messages.ChangePin();
    changePin.setRemove(true);
    // send
    await this.transport.call(
      Messages.MessageType.MESSAGETYPE_CHANGEPIN,
      changePin
    );
  }

  public async send(events: Event[]): Promise<void> {
    for (const event of events) {
      const MessageType = messageTypeRegistry[event.message_enum] as any;
      const msg = new MessageType();
      Object.entries(event.message).forEach(([key, value]) => {
        const setterMethod = protoFieldToSetMethod(key);
        if (msg[setterMethod]) {
          // Assume setter methods are always of the format: strength -> setStrength
          // until this exists https://github.com/protocolbuffers/protobuf/issues/1591
          msg[setterMethod](value);
        }
      });
      await this.transport.call(event.message_enum, msg);
    }
  }

  // SoftReset power cycles the device. The device only responds to
  // this message while in manufacturer mode
  public async softReset(): Promise<void> {
    const softReset = new Messages.SoftReset();
    // send
    await this.transport.call(
      Messages.MessageType.MESSAGETYPE_SOFTRESET,
      softReset
    );
  }

  // WipeDevice wipes all sensitive data and settings
  public async wipe(): Promise<void> {
    const wipeDevice = new Messages.WipeDevice();
    // send
    await this.transport.call(
      Messages.MessageType.MESSAGETYPE_WIPEDEVICE,
      wipeDevice
    );
  }

  public async btcSupportsCoin (coin: Coin): Promise<boolean> {
    return this.info.btcSupportsCoin(coin)
  }

  public async btcSupportsScriptType (coin: Coin, scriptType: BTCInputScriptType): Promise<boolean> { 
    return this.info.btcSupportsScriptType(coin, scriptType)
  }

  public async btcGetAddress (msg: BTCGetAddress): Promise<string> {
    return Btc.btcGetAddress(this, this.transport, msg)
  }

  public async btcSignTx (msg: BTCSignTx): Promise<BTCSignedTx> {
    return Btc.btcSignTx(this, this.transport, msg)
  }

  public async btcSupportsSecureTransfer (): Promise<boolean> {
    return this.info.btcSupportsSecureTransfer()
  }

  public async btcSupportsNativeShapeShift (): Promise<boolean> {
    return this.info.btcSupportsNativeShapeShift()
  }

  public async btcSignMessage (msg: BTCSignMessage): Promise<BTCSignedMessage> {
    return Btc.btcSignMessage(this, this.transport, msg)
  }

  public async btcVerifyMessage (msg: BTCVerifyMessage): Promise<boolean> {
    return Btc.btcVerifyMessage(this, this.transport, msg)
  }

  public btcGetAccountPaths (msg: BTCGetAccountPaths): Array<BTCAccountPath> {
    return this.info.btcGetAccountPaths(msg)
  }

  public btcIsSameAccount (msg: Array<BTCAccountPath>): boolean {
    // TODO: mixed-mode segwit was added in v6.0.2
    // https://github.com/keepkey/keepkey-firmware/pull/81
    // if (firmware_version.lt('6.0.2') && msg.length > 1)
    //  return false

    return this.info.btcIsSameAccount(msg)
  }


  public async ethSignTx (msg: ETHSignTx): Promise<ETHSignedTx> {
    return Eth.ethSignTx(this.transport, msg)
  }

  public async ethGetAddress (msg: ETHGetAddress): Promise<string> {
    return Eth.ethGetAddress(this.transport, msg)
  }

  public async ethSignMessage (msg: ETHSignMessage): Promise<ETHSignedMessage> {
    return Eth.ethSignMessage(this.transport, msg)
  }

  public async ethVerifyMessage (msg: ETHVerifyMessage): Promise<boolean> {
    return Eth.ethVerifyMessage(this.transport, msg)
  }

  public async ethSupportsNetwork (chain_id: number): Promise<boolean> {
    return this.info.ethSupportsNetwork(chain_id)
  }

  public async ethSupportsSecureTransfer (): Promise<boolean> {
    return this.info.ethSupportsSecureTransfer()
  }

  public async ethSupportsNativeShapeShift (): Promise<boolean> {
    return this.info.ethSupportsNativeShapeShift()
  }

  public ethGetAccountPaths (msg: ETHGetAccountPath): Array<ETHAccountPath> {
    return this.info.ethGetAccountPaths(msg)
  }

  public describePath (msg: DescribePath): PathDescription {
    return this.info.describePath(msg)
  }
}

export function info (): KeepKeyHDWalletInfo {
  return new KeepKeyHDWalletInfo()
}

export function create (transport: KeepKeyTransport): KeepKeyHDWallet {
  return new KeepKeyHDWallet(transport)
}