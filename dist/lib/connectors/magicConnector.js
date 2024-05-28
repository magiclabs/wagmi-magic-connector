import { OAuthExtension } from '@magic-ext/oauth';
import { Magic } from 'magic-sdk';
import { createWalletClient, custom, getAddress } from 'viem';
const IS_SERVER = typeof window === 'undefined';
export function magicConnector({ chains = [], options }) {
    if (!options.apiKey) {
        throw new Error('Magic API Key is required. Get one at https://dashboard.magic.link/');
    }
    const getMagicSDK = () => {
        if (options.connectorType === 'dedicated') {
            return new Magic(options.apiKey, {
                ...options.magicSdkConfiguration,
                extensions: [new OAuthExtension()],
            });
        }
        if (options.connectorType === 'universal') {
            return new Magic(options.apiKey, {
                ...options.magicSdkConfiguration,
                network: options.magicSdkConfiguration?.network ?? options?.networks?.[0],
            });
        }
        return null;
    };
    const getProvider = async () => {
        const magic = getMagicSDK();
        if (!magic)
            return null;
        return magic.rpcProvider;
    };
    const getAccount = async () => {
        const provider = await getProvider();
        const accounts = await provider?.request({
            method: 'eth_accounts',
        });
        const account = getAddress(accounts[0]);
        return account;
    };
    const getWalletClient = async ({ chainId } = {}) => {
        const provider = await getProvider();
        const account = await getAccount();
        const chain = chains.find((x) => x.id === chainId) ?? chains[0];
        if (!provider)
            throw new Error('provider is required.');
        return createWalletClient({
            account,
            chain,
            transport: custom(provider),
        });
    };
    const onAccountsChanged = async (accounts) => {
        const provider = await getProvider();
        if (accounts.length === 0 || !accounts[0])
            provider?.emit('disconnect');
        else
            provider?.emit('change', { account: getAddress(accounts[0]) });
    };
    return {
        id: 'magic',
        name: 'Magic',
        type: 'Magic',
        isModalOpen: false,
        isReady: IS_SERVER,
        getProvider,
        getMagicSDK,
        getAccount,
        getWalletClient,
        onAccountsChanged,
    };
}
