import { createConnector, normalizeChainId } from '@wagmi/core';
import { magicConnector, } from './magicConnector.js';
import { UserRejectedRequestError, getAddress } from 'viem';
import { createModal } from '../modal/view.js';
export function dedicatedWalletConnector({ chains, options, }) {
    let { id, name, type, isModalOpen, getAccount, getMagicSDK, getProvider, onAccountsChanged, } = magicConnector({
        chains,
        options: { ...options, connectorType: 'dedicated' },
    });
    const oauthProviders = options.oauthOptions?.providers ?? [];
    const oauthCallbackUrl = options.oauthOptions?.callbackUrl;
    const enableSMSLogin = options.enableSMSLogin ?? false;
    const enableEmailLogin = options.enableEmailLogin ?? true;
    /**
     * This method is used to get user details from the modal UI
     * It first creates the modal UI and then waits for the user to
     * fill in the details and submit the form.
     */
    const getUserDetailsByForm = async (enableSMSLogin, enableEmailLogin, oauthProviders) => {
        const output = (await createModal({
            accentColor: options.accentColor,
            isDarkMode: options.isDarkMode,
            customLogo: options.customLogo,
            customHeaderText: options.customHeaderText,
            enableSMSLogin: enableSMSLogin,
            enableEmailLogin: enableEmailLogin,
            oauthProviders,
        }));
        isModalOpen = false;
        return output;
    };
    return createConnector((config) => ({
        id,
        type,
        name,
        getProvider,
        connect: async function () {
            if (!options.apiKey) {
                throw new Error('Magic API Key is not provided.');
            }
            const provider = await getProvider();
            if (provider?.on) {
                provider.on('accountsChanged', this.onAccountsChanged.bind(this));
                provider.on('chainChanged', this.onChainChanged.bind(this));
                provider.on('disconnect', this.onDisconnect.bind(this));
            }
            let chainId;
            try {
                chainId = await this.getChainId();
            }
            catch {
                chainId = 0;
            }
            if (await this.isAuthorized()) {
                return {
                    chainId,
                    accounts: [await getAccount()],
                };
            }
            if (!isModalOpen) {
                const modalOutput = await getUserDetailsByForm(enableSMSLogin, enableEmailLogin, oauthProviders);
                const magic = getMagicSDK();
                // LOGIN WITH MAGIC USING OAUTH PROVIDER
                if (modalOutput.oauthProvider)
                    await magic.oauth.loginWithRedirect({
                        provider: modalOutput.oauthProvider,
                        redirectURI: oauthCallbackUrl ?? window.location.href,
                    });
                // LOGIN WITH MAGIC USING EMAIL
                if (modalOutput.email)
                    await magic.auth.loginWithEmailOTP({
                        email: modalOutput.email,
                    });
                // LOGIN WITH MAGIC USING PHONE NUMBER
                if (modalOutput.phoneNumber)
                    await magic.auth.loginWithSMS({
                        phoneNumber: modalOutput.phoneNumber,
                    });
                if (await magic.user.isLoggedIn())
                    return {
                        accounts: [await getAccount()],
                        chainId,
                    };
            }
            throw new UserRejectedRequestError(Error('User Rejected Request'));
        },
        disconnect: async () => {
            try {
                const magic = getMagicSDK();
                await magic?.wallet.disconnect();
                config.emitter.emit('disconnect');
            }
            catch (error) {
                console.error('Error disconnecting from Magic SDK:', error);
            }
        },
        getAccounts: async () => {
            const provider = await getProvider();
            const accounts = (await provider?.request({
                method: 'eth_accounts',
            }));
            return accounts.map((x) => getAddress(x));
        },
        getChainId: async () => {
            const provider = await getProvider();
            if (provider) {
                const chainId = await provider.request({
                    method: 'eth_chainId',
                    params: [],
                });
                return normalizeChainId(chainId);
            }
            const networkOptions = options.magicSdkConfiguration?.network;
            if (typeof networkOptions === 'object') {
                const chainID = networkOptions.chainId;
                if (chainID)
                    return normalizeChainId(chainID);
            }
            throw new Error('Chain ID is not defined');
        },
        isAuthorized: async () => {
            try {
                const magic = getMagicSDK();
                if (!magic) {
                    return false;
                }
                const isLoggedIn = await magic.user.isLoggedIn();
                if (isLoggedIn)
                    return true;
                const result = await magic.oauth.getRedirectResult();
                return result !== null;
            }
            catch { }
            return false;
        },
        onAccountsChanged,
        onChainChanged(chain) {
            const chainId = normalizeChainId(chain);
            config.emitter.emit('change', { chainId });
        },
        async onConnect(connectInfo) {
            const chainId = normalizeChainId(connectInfo.chainId);
            const accounts = await this.getAccounts();
            config.emitter.emit('connect', { accounts, chainId });
        },
        onDisconnect: () => {
            config.emitter.emit('disconnect');
        },
    }));
}
