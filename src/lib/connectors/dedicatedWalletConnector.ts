import type { OAuthProvider } from '@magic-ext/oauth2';
import type { Magic } from 'magic-sdk';
import { createConnector } from '@wagmi/core';
import { UserRejectedRequestError, getAddress } from 'viem';
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
      customLoginText: options.customLoginText,
      enableSMSLogin: enableSMSLogin,
      enableEmailLogin: enableEmailLogin,
      oauthProviders,
    })) as UserDetails;

    isModalOpen = false;
    return output;
  };

  let magic: Magic | undefined;
  let magicPromise: Promise<Magic> | undefined;

  const connectorFn = createConnector(config => ({
    id,
    type,
    name,
    async getMagic(): Promise<Magic> {
      if (!magicPromise) {
        magicPromise = getMagicSDK()
          .then(m => (magic = m))
          .catch(error => {
            magicPromise = undefined;
            throw error;
          });
      }
      return magicPromise;
    },
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
        const magic = await this.getMagic();

        // LOGIN WITH MAGIC USING OAUTH PROVIDER
        if (modalOutput.oauthProvider)
          await (magic as any).oauth2.loginWithRedirect({
            provider: modalOutput.oauthProvider,
            redirectURI: oauthCallbackUrl && !IS_SERVER ? window.location.href : '',
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
        const magic = await this.getMagic();
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

      const magic = await this.getMagic();
      await (magic as any).evm.switchChain(normalizedChainId);

      const metadata = await magic.user.getInfo();
      const account = metadata?.wallets?.ethereum?.publicAddress;
      if (!account) throw new Error('Failed to get account after chain switch');

      const address = getAddress(account);
      this.onChainChanged(chain.id.toString());
      config.emitter.emit('change', { accounts: [address] });
      this.onAccountsChanged([address]);
      return chain;
    },

    async isAuthorized() {
      try {
        const magic: Magic = await this.getMagic();
        const isLoggedIn = await magic.user.isLoggedIn();
        if (isLoggedIn) return true;

        if (oauthProviders?.length > 0) {
          const result = await (magic as any).oauth2.getRedirectResult();
          if (result) {
            localStorage.setItem('magicRedirectResult', JSON.stringify(result));
          }
          return result !== null;
        }
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

  // Expose `magic` as non-enumerable so wagmi's deepEqual doesn't
  // traverse the Magic SDK's circular references and blow the stack.
  return ((...args: Parameters<typeof connectorFn>) => {
    const connector = connectorFn(...args);
    Object.defineProperty(connector, 'magic', {
      get: () => magic,
      enumerable: false,
      configurable: true,
    });
    return connector;
  }) as typeof connectorFn;
}
