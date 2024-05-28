import { createConnector } from "@wagmi/core";
import { normalizeChainId } from "../utils.js";
import { magicConnector } from "./magicConnector.js";
import { getAddress } from "viem";
export function universalWalletConnector({ chains, options, }) {
    const { id, name, type, getAccount, getMagicSDK, getProvider, onAccountsChanged, } = magicConnector({
        chains,
        options: { ...options, connectorType: "universal" },
    });
    const magic = getMagicSDK();
    const registerProviderEventListeners = (provider, onChainChanged, onDisconnect) => {
        if (provider.on) {
            provider.on("accountsChanged", onAccountsChanged);
            provider.on("chainChanged", (chain) => onChainChanged(chain));
            provider.on("disconnect", onDisconnect);
        }
    };
    return createConnector((config) => ({
        id,
        name,
        type,
        magic,
        getProvider,
        getAccount,
        onAccountsChanged,
        async connect() {
            await this.magic?.wallet.connectWithUI();
            const provider = (await this.getProvider());
            const chainId = await this.getChainId();
            provider &&
                registerProviderEventListeners(provider, (chain) => {
                    const chainId = normalizeChainId(chain);
                    config.emitter.emit("change", { chainId });
                }, this.onDisconnect);
            const account = await this.getAccount();
            return {
                accounts: [account],
                chainId,
            };
        },
        async getAccounts() {
            const provider = await this.getProvider();
            const accounts = (await provider?.request({
                method: "eth_accounts",
            }));
            return accounts.map((x) => getAddress(x));
        },
        onChainChanged: (chain) => {
            const chainId = normalizeChainId(chain);
            config.emitter.emit("change", { chainId });
        },
        async onConnect(connectInfo) {
            const chainId = normalizeChainId(connectInfo.chainId);
            const accounts = await this.getAccounts();
            config.emitter.emit("connect", { accounts, chainId });
        },
        async disconnect() {
            try {
                await this.magic?.user.logout();
                config.emitter.emit("disconnect");
            }
            catch (error) {
                console.error("Error disconnecting from Magic SDK:", error);
            }
        },
        async isAuthorized() {
            try {
                const walletInfo = await this.magic?.user.getInfo();
                return !!walletInfo;
            }
            catch {
                return false;
            }
        },
        getChainId: async () => {
            const provider = await getProvider();
            if (provider) {
                const chainId = await provider.request({
                    method: "eth_chainId",
                    params: [],
                });
                return normalizeChainId(chainId);
            }
            const networkOptions = options.magicSdkConfiguration?.network;
            if (typeof networkOptions === "object") {
                const chainID = networkOptions.chainId;
                if (chainID)
                    return normalizeChainId(chainID);
            }
            throw new Error("Chain ID is not defined");
        },
        switchChain: async function ({ chainId }) {
            if (!options.networks) {
                throw new Error("switch chain not supported: please provide networks in options");
            }
            const normalizedChainId = normalizeChainId(chainId);
            const chain = chains.find((x) => x.id === normalizedChainId);
            if (!chain)
                throw new Error(`Unsupported chainId: ${chainId}`);
            const network = options.networks.find((x) => typeof x === "object" && x.chainId
                ? normalizeChainId(x.chainId) === normalizedChainId
                : normalizeChainId(x) ===
                    normalizedChainId);
            if (!network)
                throw new Error(`Unsupported chainId: ${chainId}`);
            const account = await this.getAccount();
            const provider = (await this.getProvider());
            if (provider?.off) {
                provider.off("accountsChanged", this.onAccountsChanged);
                provider.off("chainChanged", this.onChainChanged);
                provider.off("disconnect", this.onDisconnect);
            }
            const newOptions = {
                ...options,
                connectorType: "universal",
            };
            newOptions.magicSdkConfiguration.network = network;
            const { getAccount, getMagicSDK, getProvider, onAccountsChanged } = magicConnector({
                chains,
                options: newOptions,
            });
            this.getAccount = getAccount;
            this.magic = getMagicSDK();
            this.getProvider = getProvider;
            this.onAccountsChanged = onAccountsChanged;
            registerProviderEventListeners(this.magic.rpcProvider, this.onChainChanged, this.onDisconnect);
            this.onChainChanged(chain.id.toString());
            this.onAccountsChanged([account]);
            return chain;
        },
        onDisconnect: () => {
            config.emitter.emit("disconnect");
        },
    }));
}
