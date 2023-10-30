import { Events, Keyring } from "@shapeshiftoss/hdwallet-core";
import { EthereumProvider } from "@walletconnect/ethereum-provider";
import { EthereumProviderOptions } from "@walletconnect/ethereum-provider/dist/types/EthereumProvider";
import { createWeb3Modal, defaultConfig } from "@web3modal/ethers5";

import { WalletConnectV2HDWallet } from "./walletconnectV2";

export class WalletConnectV2Adapter {
  keyring: Keyring;
  private readonly providerConfig: EthereumProviderOptions;

  private constructor(keyring: Keyring, config: EthereumProviderOptions) {
    this.keyring = keyring;
    this.providerConfig = config;
  }

  public static useKeyring(keyring: Keyring, config: EthereumProviderOptions) {
    return new WalletConnectV2Adapter(keyring, config);
  }

  public async initialize(): Promise<number> {
    return Object.keys(this.keyring.wallets).length;
  }

  public async pairDevice(): Promise<WalletConnectV2HDWallet> {
    try {
      if (!this.providerConfig) {
        throw new Error("WalletConnectV2 provider configuration not set.");
      }

      // 1. Get projectId
      const projectId = "YOUR_PROJECT_ID";

      // 2. Set chains
      const mainnet = {
        chainId: 1,
        name: "Ethereum",
        currency: "ETH",
        explorerUrl: "https://etherscan.io",
        rpcUrl: "https://cloudflare-eth.com",
      };

      // 3. Create modal
      const metadata = {
        name: "My Website",
        description: "My Website description",
        url: "https://mywebsite.com",
        icons: ["https://avatars.mywebsite.com/"],
      };

      const modal = createWeb3Modal({
        ethersConfig: defaultConfig({ metadata }),
        chains: [mainnet],
        projectId,
      });

      const provider = await EthereumProvider.init(this.providerConfig);
      const provider2 = await modal.getWalletProvider();

      if (!provider2) {
        throw new Error("WalletConnectV2: missing provider.");
      }

      const wallet = new WalletConnectV2HDWallet(provider);

      //  Enable session (triggers QR Code modal)
      // await wallet.initialize();
      const deviceID = await wallet.getDeviceID();
      this.keyring.add(wallet, deviceID);
      this.keyring.emit(["WalletConnectV2", deviceID, Events.CONNECT], deviceID);
      return wallet;
    } catch (error) {
      console.error("Could not pair WalletConnectV2");
      throw error;
    }
  }
}
