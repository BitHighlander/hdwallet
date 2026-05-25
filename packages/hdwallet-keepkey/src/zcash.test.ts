import * as Messages from "@keepkey/device-protocol/lib/messages_pb";
import * as ZcashMessages from "@keepkey/device-protocol/lib/messages-zcash_pb";

import { zcashSignPczt } from "./zcash";

function makeMockTransport(callImpl: jest.Mock) {
  return {
    debugLink: false,
    call: callImpl,
    lockDuring: <T>(fn: () => Promise<T>) => fn(),
  } as any;
}

const hex32 = (byte: string) => byte.repeat(32);

function action(index: number) {
  return {
    index,
    alpha: hex32("aa"),
    cv_net: hex32("bb"),
    nullifier: "",
    cmx: "",
    epk: "",
    enc_compact: "",
    enc_memo: "",
    enc_noncompact: "",
    rk: "",
    out_ciphertext: "",
    value: 0,
    is_spend: false,
  };
}

function makeTransparentInput(index: number) {
  return {
    index,
    addressNList: [0x80000000 + 44, 0x80000000 + 133, 0x80000000, 0, index],
    amount: 1000,
    prevout_txid: hex32("06"),
    prevout_index: 0,
    sequence: 0xffffffff,
    script_pubkey: "76a914" + "00".repeat(20) + "88ac",
  };
}

describe("zcashSignPczt", () => {
  it("streams transparent inputs and collects batch signatures (clear-signing protocol)", async () => {
    const calls: number[] = [];
    const call = jest.fn().mockImplementation((mtype: number, msg: any) => {
      calls.push(mtype);

      // Call 1: ZcashSignPCZT → TransparentAck (device ready to receive inputs)
      if (calls.length === 1) {
        expect(mtype).toBe(Messages.MessageType.MESSAGETYPE_ZCASHSIGNPCZT);
        const ack = new ZcashMessages.ZcashTransparentAck();
        return Promise.resolve({
          message_enum: Messages.MessageType.MESSAGETYPE_ZCASHTRANSPARENTACK,
          message_type: "ZcashTransparentAck",
          proto: ack,
        });
      }

      // Calls 2–4: ZcashTransparentInput[0,1] → TransparentAck; [2] → TransparentSigned
      if (calls.length >= 2 && calls.length <= 4) {
        expect(mtype).toBe(Messages.MessageType.MESSAGETYPE_ZCASHTRANSPARENTINPUT);
        const inputIndex = calls.length - 2;
        expect(msg.getIndex()).toBe(inputIndex);

        if (inputIndex < 2) {
          const ack = new ZcashMessages.ZcashTransparentAck();
          return Promise.resolve({
            message_enum: Messages.MessageType.MESSAGETYPE_ZCASHTRANSPARENTACK,
            message_type: "ZcashTransparentAck",
            proto: ack,
          });
        } else {
          // Last input → batch sigs for all 3 inputs
          const signed = new ZcashMessages.ZcashTransparentSigned();
          signed.addSignatures(new Uint8Array([0x30, 0x00]));
          signed.addSignatures(new Uint8Array([0x30, 0x01]));
          signed.addSignatures(new Uint8Array([0x30, 0x02]));
          return Promise.resolve({
            message_enum: Messages.MessageType.MESSAGETYPE_ZCASHTRANSPARENTSIGNED,
            message_type: "ZcashTransparentSigned",
            proto: signed,
          });
        }
      }

      // Call 5: ZcashPCZTAction[0] → ZcashSignedPCZT
      expect(mtype).toBe(Messages.MessageType.MESSAGETYPE_ZCASHPCZTACTION);
      expect(msg.getIndex()).toBe(0);
      const signed = new ZcashMessages.ZcashSignedPCZT();
      signed.addSignatures(new Uint8Array(64).fill(0x42));
      return Promise.resolve({
        message_enum: Messages.MessageType.MESSAGETYPE_ZCASHSIGNEDPCZT,
        message_type: "ZcashSignedPCZT",
        proto: signed,
      });
    });

    const result = (await zcashSignPczt(
      makeMockTransport(call),
      {
        n_actions: 1,
        digests: {
          header: hex32("01"),
          transparent: hex32("02"),
          orchard: hex32("04"),
        },
        bundle_meta: {
          flags: 3,
          value_balance: 0,
          anchor: hex32("05"),
        },
        actions: [action(0)],
        display: {
          amount: "0.001 ZEC",
          fee: "0.0001 ZEC",
          to: "Orchard",
        },
        transparent_inputs: [0, 1, 2].map(makeTransparentInput),
      },
      hex32("07")
    )) as any;

    expect(result).toHaveLength(1);
    expect(result._transparentSignatures).toEqual(["3000", "3001", "3002"]);
    expect(calls).toEqual([
      Messages.MessageType.MESSAGETYPE_ZCASHSIGNPCZT,
      Messages.MessageType.MESSAGETYPE_ZCASHTRANSPARENTINPUT,
      Messages.MessageType.MESSAGETYPE_ZCASHTRANSPARENTINPUT,
      Messages.MessageType.MESSAGETYPE_ZCASHTRANSPARENTINPUT,
      Messages.MessageType.MESSAGETYPE_ZCASHPCZTACTION,
    ]);
  });
});
