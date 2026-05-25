import * as Messages from "@keepkey/device-protocol/lib/messages_pb";
import * as ZcashMessages from "@keepkey/device-protocol/lib/messages-zcash_pb";
import * as core from "@keepkey/hdwallet-core";

import { Transport } from "./transport";

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Get the Orchard Full Viewing Key from the device.
 * The FVK (ak, nk, rivk) allows viewing transactions but cannot spend funds.
 */
export async function zcashGetOrchardFVK(
  transport: Transport,
  account: number = 0
): Promise<{ ak: Uint8Array; nk: Uint8Array; rivk: Uint8Array }> {
  const msg = new ZcashMessages.ZcashGetOrchardFVK();
  msg.setAddressNList([0x80000000 + 32, 0x80000000 + 133, 0x80000000 + account]);
  msg.setAccount(account);
  msg.setShowDisplay(false);

  const response = await transport.call(Messages.MessageType.MESSAGETYPE_ZCASHGETORCHARDFVK, msg, {
    msgTimeout: core.LONG_TIMEOUT,
  });

  if (response.message_enum !== Messages.MessageType.MESSAGETYPE_ZCASHORCHARDFVK) {
    throw new Error(`zcash: unexpected response ${response.message_type}`);
  }

  const fvk = response.proto as ZcashMessages.ZcashOrchardFVK;
  return {
    ak: fvk.getAk_asU8(),
    nk: fvk.getNk_asU8(),
    rivk: fvk.getRivk_asU8(),
  };
}

/**
 * Display the device-derived Orchard unified address on the device.
 */
export async function zcashDisplayAddress(
  transport: Transport,
  params: {
    addressNList?: number[];
    account?: number;
  } = {}
): Promise<{ address: string }> {
  const account = params.account ?? 0;
  const msg = new ZcashMessages.ZcashDisplayAddress();
  msg.setAddressNList(params.addressNList ?? [0x80000000 + 32, 0x80000000 + 133, 0x80000000 + account]);
  msg.setAccount(account);

  const response = await transport.call(Messages.MessageType.MESSAGETYPE_ZCASHDISPLAYADDRESS, msg, {
    msgTimeout: core.LONG_TIMEOUT,
  });

  if (response.message_enum !== Messages.MessageType.MESSAGETYPE_ZCASHADDRESS) {
    throw new Error(`zcash: unexpected response ${response.message_type}`);
  }

  const addressResp = response.proto as ZcashMessages.ZcashAddress;
  const confirmedAddress = addressResp.getAddress();
  if (!confirmedAddress) {
    throw new Error("zcash: device returned an empty address");
  }
  return { address: confirmedAddress };
}

/**
 * Transparent output descriptor for hybrid shielding transactions.
 */
export interface TransparentOutput {
  index: number;
  value: number;         // zatoshis
  script_pubkey: string; // hex scriptPubKey
}

/**
 * Transparent input descriptor for hybrid shielding transactions (clear-signing protocol).
 */
export interface TransparentInput {
  index: number;
  addressNList: number[]; // BIP44 path [44', 133', 0', 0, 0]
  amount: number;         // zatoshis
  prevout_txid: string;   // hex 32-byte txid (internal/LE order)
  prevout_index: number;
  sequence: number;
  script_pubkey: string;  // hex scriptPubKey of the UTXO being spent
}

/**
 * Sign a PCZT (Partially Constructed Zcash Transaction) on the device.
 *
 * Implements the clear-signing protocol (firmware >= 7.15 clear-signing):
 * 1. Send ZcashSignPCZT with plaintext header fields + counts
 * 2. If transparent outputs: stream ZcashTransparentOutput, get ZcashTransparentAck each
 * 3. Stream ZcashTransparentInput with plaintext fields, get ZcashTransparentAck each
 *    After last input: receive ZcashTransparentSigned with all DER ECDSA sigs
 * 4. For each Orchard action: send ZcashPCZTAction (with recipient+rseed for outputs),
 *    receive ZcashPCZTActionAck until final ZcashSignedPCZT
 */
export async function zcashSignPczt(
  transport: Transport,
  signingRequest: {
    n_actions: number;
    digests: { header: string; transparent: string; orchard: string };
    header_fields?: { tx_version: number; version_group_id: number; lock_time: number; expiry_height: number };
    bundle_meta: { flags: number; value_balance: number; anchor: string };
    actions: Array<{
      index: number;
      alpha: string;
      cv_net: string;
      nullifier: string;
      cmx: string;
      epk: string;
      enc_compact: string;
      enc_memo: string;
      enc_noncompact: string;
      rk: string;
      out_ciphertext: string;
      value: number;
      is_spend: boolean;
      recipient?: string;
      rseed?: string;
    }>;
    display: { amount: string; fee: string; to: string };
    transparent_outputs?: TransparentOutput[];
    transparent_inputs?: TransparentInput[];
  },
  sighash: string
): Promise<string[]> {
  const account = (signingRequest as any).account ?? 0;
  const transparentOutputs = signingRequest.transparent_outputs ?? [];
  const transparentInputs = signingRequest.transparent_inputs ?? [];
  const nTransparentOutputs = transparentOutputs.length;
  const nTransparentInputs = transparentInputs.length;

  return transport.lockDuring(async () => {
    // Step 1: Send ZcashSignPCZT with metadata
    const signMsg = new ZcashMessages.ZcashSignPCZT();
    signMsg.setNActions(signingRequest.n_actions);
    signMsg.setBranchId((signingRequest as any).branch_id ?? 0x37519621);

    signMsg.setAddressNList([0x80000000 + 32, 0x80000000 + 133, 0x80000000 + account]);
    signMsg.setAccount(account);

    const totalZat = Math.round(parseFloat(signingRequest.display.amount.replace(" ZEC", "")) * 1e8);
    const feeZat = Math.round(parseFloat(signingRequest.display.fee.replace(" ZEC", "")) * 1e8);
    signMsg.setTotalAmount(totalZat);
    signMsg.setFee(feeZat);

    // Sub-digests for on-device sighash computation (sapling omitted — firmware rejects it)
    if (signingRequest.digests) {
      signMsg.setHeaderDigest(hexToBytes(signingRequest.digests.header));
      signMsg.setTransparentDigest(hexToBytes(signingRequest.digests.transparent));
      signMsg.setOrchardDigest(hexToBytes(signingRequest.digests.orchard));
    }

    // Plaintext header fields for firmware to recompute + verify header digest
    if (signingRequest.header_fields) {
      signMsg.setTxVersion(signingRequest.header_fields.tx_version);
      signMsg.setVersionGroupId(signingRequest.header_fields.version_group_id);
      signMsg.setLockTime(signingRequest.header_fields.lock_time);
      signMsg.setExpiryHeight(signingRequest.header_fields.expiry_height);
    }

    // Bundle metadata for on-device orchard digest verification
    if (signingRequest.bundle_meta) {
      signMsg.setOrchardFlags(signingRequest.bundle_meta.flags);
      signMsg.setOrchardValueBalance(signingRequest.bundle_meta.value_balance);
      signMsg.setOrchardAnchor(hexToBytes(signingRequest.bundle_meta.anchor));
    }

    if (nTransparentOutputs > 0) {
      signMsg.setNTransparentOutputs(nTransparentOutputs);
    }
    if (nTransparentInputs > 0) {
      signMsg.setNTransparentInputs(nTransparentInputs);
    }

    let response = await transport.call(Messages.MessageType.MESSAGETYPE_ZCASHSIGNPCZT, signMsg, {
      msgTimeout: core.LONG_TIMEOUT,
      omitLock: true,
    });

    // Step 2: Stream transparent outputs (device reviews recipients before signing)
    if (nTransparentOutputs > 0) {
      if (response.message_enum !== Messages.MessageType.MESSAGETYPE_ZCASHTRANSPARENTACK) {
        throw new Error(`zcash: expected TransparentAck before outputs, got ${response.message_type}`);
      }

      for (let i = 0; i < nTransparentOutputs; i++) {
        const output = transparentOutputs[i];
        const outMsg = new ZcashMessages.ZcashTransparentOutput();
        outMsg.setIndex(output.index);
        outMsg.setAmount(output.value);
        outMsg.setScriptPubkey(hexToBytes(output.script_pubkey));

        response = await transport.call(Messages.MessageType.MESSAGETYPE_ZCASHTRANSPARENTOUTPUT, outMsg, {
          msgTimeout: core.LONG_TIMEOUT,
          omitLock: true,
        });

        if (i < nTransparentOutputs - 1) {
          if (response.message_enum !== Messages.MessageType.MESSAGETYPE_ZCASHTRANSPARENTACK) {
            throw new Error(`zcash: expected TransparentAck after output ${i}, got ${response.message_type}`);
          }
        }
      }
    }

    // Step 3: Stream transparent inputs; collect batch signatures
    const transparentSignatures: string[] = [];
    if (nTransparentInputs > 0) {
      // After outputs (or initial response if no outputs), expect TransparentAck before inputs
      if (response.message_enum !== Messages.MessageType.MESSAGETYPE_ZCASHTRANSPARENTACK) {
        throw new Error(`zcash: expected TransparentAck before inputs, got ${response.message_type}`);
      }

      for (let i = 0; i < nTransparentInputs; i++) {
        const input = transparentInputs[i];
        const inputMsg = new ZcashMessages.ZcashTransparentInput();
        inputMsg.setIndex(input.index);
        inputMsg.setAddressNList(input.addressNList);
        inputMsg.setAmount(input.amount);
        inputMsg.setPrevoutTxid(hexToBytes(input.prevout_txid));
        inputMsg.setPrevoutIndex(input.prevout_index);
        inputMsg.setSequence(input.sequence);
        inputMsg.setScriptPubkey(hexToBytes(input.script_pubkey));

        response = await transport.call(Messages.MessageType.MESSAGETYPE_ZCASHTRANSPARENTINPUT, inputMsg, {
          msgTimeout: core.LONG_TIMEOUT,
          omitLock: true,
        });

        if (i < nTransparentInputs - 1) {
          if (response.message_enum !== Messages.MessageType.MESSAGETYPE_ZCASHTRANSPARENTACK) {
            throw new Error(`zcash: expected TransparentAck after input ${i}, got ${response.message_type}`);
          }
        }
      }

      // After last input, expect ZcashTransparentSigned with all DER ECDSA sigs
      if (response.message_enum !== Messages.MessageType.MESSAGETYPE_ZCASHTRANSPARENTSIGNED) {
        throw new Error(`zcash: expected TransparentSigned after all inputs, got ${response.message_type}`);
      }

      const signedMsg = response.proto as ZcashMessages.ZcashTransparentSigned;
      for (const sig of signedMsg.getSignaturesList_asU8()) {
        transparentSignatures.push(bytesToHex(sig));
      }

      // response is now ZcashTransparentSigned; the Orchard loop will skip
      // the ActionAck check at i=0 when transparent inputs/outputs exist.
    }

    // Step 4: Stream Orchard actions to device
    const orchardSignatures: string[] = [];
    for (let i = 0; i < signingRequest.n_actions; i++) {
      if (i > 0 || (nTransparentInputs === 0 && nTransparentOutputs === 0)) {
        if (response.message_enum !== Messages.MessageType.MESSAGETYPE_ZCASHPCZTACTIONACK) {
          if (response.message_enum === Messages.MessageType.MESSAGETYPE_ZCASHSIGNEDPCZT) break;
          throw new Error(`zcash: unexpected response during Orchard signing: ${response.message_type}`);
        }
      }

      const action = signingRequest.actions[i];
      const actionMsg = new ZcashMessages.ZcashPCZTAction();
      actionMsg.setIndex(action.index);
      actionMsg.setAlpha(hexToBytes(action.alpha));
      actionMsg.setSighash(hexToBytes(sighash));
      actionMsg.setCvNet(hexToBytes(action.cv_net));
      actionMsg.setValue(action.value);
      actionMsg.setIsSpend(action.is_spend);

      if (action.nullifier) actionMsg.setNullifier(hexToBytes(action.nullifier));
      if (action.cmx) actionMsg.setCmx(hexToBytes(action.cmx));
      if (action.epk) actionMsg.setEpk(hexToBytes(action.epk));
      if (action.enc_compact) actionMsg.setEncCompact(hexToBytes(action.enc_compact));
      if (action.enc_memo) actionMsg.setEncMemo(hexToBytes(action.enc_memo));
      if (action.enc_noncompact) actionMsg.setEncNoncompact(hexToBytes(action.enc_noncompact));
      if (action.rk) actionMsg.setRk(hexToBytes(action.rk));
      if (action.out_ciphertext) actionMsg.setOutCiphertext(hexToBytes(action.out_ciphertext));
      if (action.recipient) actionMsg.setRecipient(hexToBytes(action.recipient));
      if (action.rseed) actionMsg.setRseed(hexToBytes(action.rseed));

      response = await transport.call(Messages.MessageType.MESSAGETYPE_ZCASHPCZTACTION, actionMsg, {
        msgTimeout: core.LONG_TIMEOUT,
        omitLock: true,
      });
    }

    // Step 5: Collect Orchard signatures
    if (response.message_enum !== Messages.MessageType.MESSAGETYPE_ZCASHSIGNEDPCZT) {
      throw new Error(`zcash: expected ZcashSignedPCZT, got ${response.message_type}`);
    }

    const signedPczt = response.proto as ZcashMessages.ZcashSignedPCZT;
    for (const sig of signedPczt.getSignaturesList_asU8()) {
      orchardSignatures.push(bytesToHex(sig));
    }

    if (nTransparentInputs === 0) {
      return orchardSignatures;
    }

    const result = orchardSignatures as any;
    result._transparentSignatures = transparentSignatures;
    return result;
  });
}
