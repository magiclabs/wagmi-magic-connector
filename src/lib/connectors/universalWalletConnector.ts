import type { MagicSDKAdditionalConfiguration } from '@magic-sdk/provider'
import type { RPCProviderModule } from '@magic-sdk/provider/dist/types/modules/rpc-provider'
import type { EthNetworkConfiguration } from '@magic-sdk/types'
import { createConnector } from '@wagmi/core'
import { normalizeChainId } from '../utils'
import { magicConnector } from './magicConnector'
import { type Chain, getAddress } from 'viem'

export interface UniversalWalletOptions {
  apiKey: string
  magicSdkConfiguration?: MagicSDKAdditionalConfiguration
  networks?: EthNetworkConfiguration[]
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
  chains?: Chain[]
  options: UniversalWalletOptions
}

export function universalWalletConnector({
  chains,
  options,
}: UniversalWalletConnectorParams) {
  const {
    id,
    name,
    type,
    getAccount,
    getMagicSDK,
    getProvider,
    onAccountsChanged,
  } = magicConnector({
    chains,
    options: { ...options, connectorType: 'universal' },
  })

  const magic = getMagicSDK()

  const registerProviderEventListeners = (
    provider: RPCProviderModule,
    onChainChanged: (chain: string) => void,
    onDisconnect: () => void,
  ) => {
    if (provider.on) {
      provider.on('accountsChanged', onAccountsChanged)
      provider.on('chainChanged', (chain) => onChainChanged(chain))
      provider.on('disconnect', onDisconnect)
    }
  }

  return createConnector((config) => ({
    id,
    name,
    type,
    getProvider,
    connect: async function () {
      await magic?.wallet.connectWithUI()
      const provider = await getProvider()
      const chainId = await this.getChainId()
      provider &&
        registerProviderEventListeners(
          provider,
          (chain) => {
            const chainId = normalizeChainId(chain)
            config.emitter.emit('change', { chainId })
          },
          this.onDisconnect,
        )
      const account = await getAccount()
      return {
        accounts: [account],
        chainId,
      }
    },
    onAccountsChanged,
    getAccounts: async () => {
      const provider = await getProvider()
      const accounts = (await provider?.request({
        method: 'eth_accounts',
      })) as string[]
      return accounts.map((x) => getAddress(x))
    },

    onChainChanged: (chain) => {
      const chainId = normalizeChainId(chain)
      config.emitter.emit('change', { chainId })
    },
    async onConnect(connectInfo) {
      const chainId = normalizeChainId(connectInfo.chainId)
      const accounts = await this.getAccounts()
      config.emitter.emit('connect', { accounts, chainId })
    },
    disconnect: async () => {
      try {
        await magic?.wallet.disconnect()
        config.emitter.emit('disconnect')
      } catch (error) {
        console.error('Error disconnecting from Magic SDK:', error)
      }
    },
    isAuthorized: async () => {
      try {
        const walletInfo = await magic?.wallet.getInfo()
        return !!walletInfo
      } catch {
        return false
      }
    },
    getChainId: async (): Promise<number> => {
      const provider = await getProvider()
      if (provider) {
        const chainId = await provider.request({
          method: 'eth_chainId',
          params: [],
        })
        return normalizeChainId(chainId)
      }
      const networkOptions = options.magicSdkConfiguration?.network
      if (typeof networkOptions === 'object') {
        const chainID = networkOptions.chainId
        if (chainID) return normalizeChainId(chainID)
      }
      throw new Error('Chain ID is not defined')
    },

    onDisconnect: () => {
      config.emitter.emit('disconnect')
    },
  }))
}
