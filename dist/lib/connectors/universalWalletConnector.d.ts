import type { MagicSDKAdditionalConfiguration } from "@magic-sdk/provider";
import type { RPCProviderModule } from "@magic-sdk/provider/dist/types/modules/rpc-provider";
import type { EthNetworkConfiguration } from "@magic-sdk/types";
import { type Chain } from "viem";
export interface UniversalWalletOptions {
    apiKey: string;
    magicSdkConfiguration?: MagicSDKAdditionalConfiguration;
    networks?: EthNetworkConfiguration[];
}
/**
 * Universal Wallet Connector class used to connect to wallet using Universal Wallet modal
 * This uses the modal UI from Magic itself and styles for it can be configured using
 * magic dashboard.
 *
 * @example
 * ```typescript
 * import { UniversalWalletConnector } from '@magiclabs/wagmi-connector';
 * const connector = new UniversalWalletConnector({
 *  options: {
 *     apiKey: YOUR_MAGIC_LINK_API_KEY, //required
 *    //...Other options
 *  },
 * });
 * ```
 * @see https://github.com/magiclabs/wagmi-magic-connector#-usage
 * @see https://magic.link/docs/universal/overview
 */
interface UniversalWalletConnectorParams {
    chains: readonly Chain[];
    options: UniversalWalletOptions;
}
export declare function universalWalletConnector({ chains, options, }: UniversalWalletConnectorParams): import("@wagmi/core").CreateConnectorFn<unknown, {
    id: string;
    name: string;
    type: string;
    magic: import("@magic-sdk/provider").InstanceWithExtensions<import("@magic-sdk/provider").SDKBase, import("@magic-ext/oauth").OAuthExtension[]> | import("@magic-sdk/provider").InstanceWithExtensions<import("@magic-sdk/provider").SDKBase, import("@magic-sdk/provider").MagicSDKExtensionsOption<string>> | null;
    getProvider: () => Promise<(RPCProviderModule & import("web3-core").AbstractProvider) | null>;
    getAccount: () => Promise<`0x${string}`>;
    onAccountsChanged: (accounts: string[]) => Promise<void>;
    connect: () => Promise<{
        accounts: any[];
        chainId: number;
    }>;
    getAccounts: () => Promise<`0x${string}`[]>;
    onChainChanged: (chain: string) => void;
    onConnect: (connectInfo: import("viem").ProviderConnectInfo) => Promise<void>;
    disconnect: () => Promise<void>;
    isAuthorized: () => Promise<boolean>;
    getChainId: () => Promise<number>;
    switchChain: ({ chainId }: {
        chainId: number;
    }) => Promise<Chain>;
    onDisconnect: () => void;
}, {}>;
export {};
