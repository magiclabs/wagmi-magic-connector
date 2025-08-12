import type { OAuthProvider } from '@magic-ext/oauth2';
import { createConnector } from '@wagmi/core';
import { type Address, UserRejectedRequestError, getAddress } from 'viem';
import { createModal } from '../modal/view';
import { normalizeChainId } from '../utils';
import { IS_SERVER, type MagicConnectorParams, type MagicOptions, magicConnector } from './magicConnector';

interface UserDetails {
  email: string;
  phoneNumber: string;
  oauthProvider: OAuthProvider;
}

/**
 * Dedicated Wallet Connector class used to connect to wallet using Dedicated Wallet.
 * It uses modal UI defined in our package which also takes in various styling options
 * for custom experience.
 *
 * @example
 * ```typescript
 * import { DedicatedWalletConnector } from '@magiclabs/wagmi-connector';
 * const connector = new DedicatedWalletConnector({
 *  options: {
 *     apiKey: YOUR_MAGIC_LINK_API_KEY, //required
 *    //...Other options
 *  },
 * });
 * ```
 * @see https://github.com/magiclabs/wagmi-magic-connector#-usage
 * @see https://magic.link/docs/dedicated/overview
 */

interface DedicatedWalletOptions extends MagicOptions {
  enableEmailLogin?: boolean;
  enableSMSLogin?: boolean;
  oauthOptions?: {
    providers: OAuthProvider[];
    callbackUrl?: string;
  };
  magicSdkConfiguration?: any;
}

export interface DedicatedWalletConnectorParams extends MagicConnectorParams {
  options: DedicatedWalletOptions;
}

export function dedicatedWalletConnector({ chains, options }: DedicatedWalletConnectorParams) {
  let { id, name, type, isModalOpen, getAccount, getMagicSDK, getProvider, onAccountsChanged } = magicConnector({
    chains,
    options: { ...options, connectorType: 'dedicated' },
  });

  const magic = getMagicSDK();

  const registerProviderEventListeners = (
    provider: any,
    onChainChanged: (chain: string) => void,
    onDisconnect: () => void,
  ) => {
    if (provider.on) {
      provider.on('accountsChanged', onAccountsChanged);
      provider.on('chainChanged', (chain: string) => onChainChanged(chain));
      provider.on('disconnect', onDisconnect);
    }
  };

  const oauthProviders = options.oauthOptions?.providers ?? [];
  const oauthCallbackUrl = options.oauthOptions?.callbackUrl;
  const enableSMSLogin = options.enableSMSLogin ?? false;
  const enableEmailLogin = options.enableEmailLogin ?? true;

  /**
   * This method is used to get user details from the modal UI
   * It first creates the modal UI and then waits for the user to
   * fill in the details and submit the form.
   */
  const getUserDetailsByForm = async (
    enableSMSLogin: boolean,
    enableEmailLogin: boolean,
    oauthProviders: OAuthProvider[],
  ): Promise<UserDetails> => {
    const output: UserDetails = (await createModal({
      accentColor: options.accentColor,
      isDarkMode: options.isDarkMode,
      customLogo: options.customLogo,
      customHeaderText: options.customHeaderText,
      enableSMSLogin: enableSMSLogin,
      enableEmailLogin: enableEmailLogin,
      oauthProviders,
    })) as UserDetails;

    isModalOpen = false;
    return output;
  };

  return createConnector(config => ({
    id,
    type,
    name,
    magic,
    getProvider,
    getAccount,
    onAccountsChanged,
    async connect() {
      if (!options.apiKey) {
        throw new Error('Magic API Key is not provided.');
      }

      const provider = await getProvider();

      if (provider?.on) {
        provider.on('accountsChanged', this.onAccountsChanged.bind(this));
        provider.on('chainChanged', this.onChainChanged.bind(this));
        provider.on('disconnect', this.onDisconnect.bind(this));
      }

      let chainId: number;
      try {
        chainId = await this.getChainId();
      } catch {
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
          await magic.oauth2.loginWithRedirect({
            provider: modalOutput.oauthProvider,
            redirectURI: oauthCallbackUrl && IS_SERVER ? window.location.href : '',
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

    async disconnect() {
      try {
        const magic = getMagicSDK();
        await magic?.user.logout();
        localStorage.removeItem('magicRedirectResult');
        config.emitter.emit('disconnect');
      } catch (error) {
        console.error('Error disconnecting from Magic SDK:', error);
      }
    },

    async getAccounts() {
      const provider = await getProvider();
      const accounts = (await provider?.send('eth_accounts', [])) as string[];
      return accounts.map(x => getAddress(x));
    },

    getChainId: async (): Promise<number> => {
      const provider = await getProvider();
      if (provider) {
        const chainId = await provider.send('eth_chainId', []);
        return normalizeChainId(chainId);
      }
      const networkOptions = options.magicSdkConfiguration?.network;
      if (typeof networkOptions === 'object') {
        const chainID = networkOptions.chainId;
        if (chainID) return normalizeChainId(chainID);
      }
      throw new Error('Chain ID is not defined');
    },

    switchChain: async function ({ chainId }: { chainId: number }) {
      if (!options.networks) {
        throw new Error('Switch chain not supported: please provide networks in options');
      }

      const normalizedChainId = normalizeChainId(chainId);
      const chain = chains.find(x => x.id === normalizedChainId);

      if (!chain) {
        throw new Error(`Unsupported chainId: ${chainId}`);
      }

      const network = options.networks.find(x => {
        if (typeof x === 'object' && x.chainId) {
          return normalizeChainId(x.chainId) === normalizedChainId;
        }

        if (typeof x === 'string') {
          const networkMap: Record<string, number> = {
            mainnet: 1,
            sepolia: 11155111,
            goerli: 5,
          };

          const networkId = networkMap[x.toLowerCase()] ?? null;

          return networkId !== null && normalizeChainId(networkId) === normalizedChainId;
        }

        return normalizeChainId(x as unknown as bigint | number | string) === normalizedChainId;
      });

      const provider = (await this.getProvider()) as any;

      if (provider?.off) {
        provider.off('accountsChanged', this.onAccountsChanged);
        provider.off('chainChanged', this.onChainChanged);
        provider.off('disconnect', this.onDisconnect);
      }

      const newOptions: MagicOptions = {
        ...options,
        connectorType: 'dedicated',
        magicSdkConfiguration: {
          ...options.magicSdkConfiguration,
          network,
        },
      };

      const { getAccount, getMagicSDK, getProvider, onAccountsChanged } = magicConnector({
        chains,
        options: newOptions,
      });

      this.getAccount = getAccount;
      this.magic = getMagicSDK();
      this.getProvider = getProvider;
      this.onAccountsChanged = onAccountsChanged;

      const metadata = await this.magic?.user.getInfo();
      const account = metadata?.publicAddress as Address;

      registerProviderEventListeners(this.magic!.rpcProvider, this.onChainChanged, this.onDisconnect);
      this.onChainChanged(chain.id.toString());
      config.emitter.emit('change', { accounts: [account] });
      this.onAccountsChanged([account]);
      return chain;
    },

    isAuthorized: async () => {
      try {
        const magic = getMagicSDK();

        if (!magic) {
          return false;
        }

        const isLoggedIn = await magic.user.isLoggedIn();
        if (isLoggedIn) return true;

        const result = await magic.oauth2.getRedirectResult();
        if (result) {
          localStorage.setItem('magicRedirectResult', JSON.stringify(result));
        }
        return result !== null;
      } catch {}
      return false;
    },

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
