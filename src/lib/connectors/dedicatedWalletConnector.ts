import type { OAuthExtension, OAuthProvider } from '@magic-ext/oauth2'
import type {
  InstanceWithExtensions,
  MagicSDKAdditionalConfiguration,
  SDKBase,
} from '@magic-sdk/provider'
import { createConnector } from '@wagmi/core'
import {
  type MagicConnectorParams,
  type MagicOptions,
  magicConnector,
} from './magicConnector'
import { UserRejectedRequestError, getAddress } from 'viem'
import { createModal } from '../modal/view'

interface UserDetails {
  email: string
  phoneNumber: string
  oauthProvider: OAuthProvider
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
  enableEmailLogin?: boolean
  enableSMSLogin?: boolean
  oauthOptions?: {
    providers: OAuthProvider[]
    callbackUrl?: string
  }
  magicSdkConfiguration?: MagicSDKAdditionalConfiguration<
    string,
    OAuthExtension[]
  >
}

export interface DedicatedWalletConnectorParams extends MagicConnectorParams {
  options: DedicatedWalletOptions
}

export function dedicatedWalletConnector({
  chains,
  options,
}: DedicatedWalletConnectorParams) {
  let {
    id,
    name,
    type,
    isModalOpen,
    getAccount,
    getMagicSDK,
    getProvider,
    onAccountsChanged,
  } = magicConnector({
    chains,
    options: { ...options, connectorType: 'dedicated' },
  })

  const oauthProviders = options.oauthOptions?.providers ?? []
  const oauthCallbackUrl = options.oauthOptions?.callbackUrl
  const enableSMSLogin = options.enableSMSLogin ?? false
  const enableEmailLogin = options.enableEmailLogin ?? true

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
    })) as UserDetails

    isModalOpen = false
    return output
  }

  return createConnector((config) => ({
    id,
    type,
    name,
    getProvider,
    connect: async function () {
      if (!options.apiKey) {
        throw new Error('Magic API Key is not provided.')
      }

      const provider = await getProvider()

      if (provider?.on) {
        provider.on('accountsChanged', this.onAccountsChanged.bind(this))
        provider.on('chainChanged', this.onChainChanged.bind(this))
        provider.on('disconnect', this.onDisconnect.bind(this))
      }

      let chainId: number
      try {
        chainId = await this.getChainId()
      } catch {
        chainId = 0
      }

      if (await this.isAuthorized()) {
        return {
          chainId,
          accounts: [await getAccount()],
        }
      }

      if (!isModalOpen) {
        const modalOutput = await getUserDetailsByForm(
          enableSMSLogin,
          enableEmailLogin,
          oauthProviders,
        )

        const magic = getMagicSDK() as InstanceWithExtensions<
          SDKBase,
          OAuthExtension[]
        >

        // LOGIN WITH MAGIC USING OAUTH PROVIDER
        if (modalOutput.oauthProvider)
          await magic.oauth2.loginWithRedirect({
            provider: modalOutput.oauthProvider,
            redirectURI: oauthCallbackUrl ?? window.location.href,
          })

        // LOGIN WITH MAGIC USING EMAIL
        if (modalOutput.email)
          await magic.auth.loginWithEmailOTP({
            email: modalOutput.email,
          })

        // LOGIN WITH MAGIC USING PHONE NUMBER
        if (modalOutput.phoneNumber)
          await magic.auth.loginWithSMS({
            phoneNumber: modalOutput.phoneNumber,
          })

        if (await magic.user.isLoggedIn())
          return {
            accounts: [await getAccount()],
            chainId,
          }
      }
      throw new UserRejectedRequestError(Error('User Rejected Request'))
    },

    disconnect: async () => {
      try {
        const magic = getMagicSDK()
        await magic?.wallet.disconnect()
        localStorage.removeItem('magicRedirectResult')
        config.emitter.emit('disconnect')
      } catch (error) {
        console.error('Error disconnecting from Magic SDK:', error)
      }
    },

    getAccounts: async () => {
      const provider = await getProvider()
      const accounts = (await provider?.request({
        method: 'eth_accounts',
      })) as string[]
      return accounts.map((x) => getAddress(x))
    },

    getChainId: async (): Promise<number> => {
      const provider = await getProvider()
      if (provider) {
        const chainId = await provider.request({
          method: 'eth_chainId',
          params: [],
        })
        return Number(chainId)
      }
      const networkOptions = options.magicSdkConfiguration?.network
      if (typeof networkOptions === 'object') {
        const chainID = networkOptions.chainId
        if (chainID) return Number(chainID)
      }
      throw new Error('Chain ID is not defined')
    },

    isAuthorized: async () => {
      try {
        const magic = getMagicSDK() as InstanceWithExtensions<
          SDKBase,
          OAuthExtension[]
        >

        if (!magic) {
          return false
        }

        const isLoggedIn = await magic.user.isLoggedIn()
        const result = await magic.oauth2.getRedirectResult()
        if (result) {
          localStorage.setItem('magicRedirectResult', JSON.stringify(result))
        }

        if (isLoggedIn) return true

        return result !== null
      } catch {}
      return false
    },

    onAccountsChanged,

    onChainChanged(chain) {
      const chainId = Number(chain)
      config.emitter.emit('change', { chainId })
    },

    async onConnect(connectInfo) {
      const chainId = Number(connectInfo.chainId)
      const accounts = await this.getAccounts()
      config.emitter.emit('connect', { accounts, chainId })
    },

    onDisconnect: () => {
      config.emitter.emit('disconnect')
    },
  }))
}
