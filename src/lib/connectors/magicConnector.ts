import { OAuthExtension } from '@magic-ext/oauth'
import type {
  InstanceWithExtensions,
  MagicSDKExtensionsOption,
  SDKBase,
} from '@magic-sdk/provider'
import { Chain, createWalletClient, custom, getAddress } from 'viem'

const IS_SERVER = typeof window === 'undefined'

export interface MagicOptions {
  apiKey: string
  accentColor?: string
  isDarkMode?: boolean
  customLogo?: string
  customHeaderText?: string
}

/**
 * Magic Connector class is a base class for Dedicated Wallet and Universal Wallet Connectors
 * It implements the common functionality of both the connectors
 *
 * Dedicated Wallet Connector and Universal Wallet Connector are the two connectors provided by this library
 * And both of them extend this class.
 */

// export abstract class MagicConnector extends Connector {
//   ready = !IS_SERVER
//   readonly id = 'magic'
//   readonly name = 'Magic'
//   isModalOpen = false

//   protected constructor(config: { chains?: Chain[]; options: MagicOptions }) {
//     super(config)
//     if (!config.options.apiKey) {
//       throw new Error(
//         'Magic API Key is required. Get one at https://dashboard.magic.link/',
//       )
//     }
//   }

//   async getAccount() {
//     const provider = await this.getProvider()
//     const accounts = await provider?.request({
//       method: 'eth_accounts',
//     })
//     const account = getAddress(accounts[0] as string)
//     return account
//   }

//   async getWalletClient({ chainId }: { chainId?: number } = {}): Promise<any> {
//     const provider = await this.getProvider()
//     const account = await this.getAccount()
//     const chain = this.chains.find((x) => x.id === chainId) || this.chains[0]
//     if (!provider) throw new Error('provider is required.')
//     return createWalletClient({
//       account,
//       chain,
//       transport: custom(provider),
//     })
//   }

//   async getProvider() {
//     const magic = this.getMagicSDK()
//     return magic?.rpcProvider
//   }

//   protected onAccountsChanged(accounts: string[]): void {
//     if (accounts.length === 0 || !accounts[0]) this.emit('disconnect')
//     else this.emit('change', { account: getAddress(accounts[0]) })
//   }

//   protected onChainChanged(chainId: string | number): void {
//     const id = normalizeChainId(chainId)
//     const unsupported = this.isChainUnsupported(id)
//     this.emit('change', { chain: { id, unsupported } })
//   }

//   async getChainId(): Promise<number> {
//     const provider = await this.getProvider()
//     if (provider) {
//       const chainId = await provider.request({
//         method: 'eth_chainId',
//         params: [],
//       })
//       return normalizeChainId(chainId)
//     }
//     const networkOptions = this.options.magicSdkConfiguration?.network
//     if (typeof networkOptions === 'object') {
//       const chainID = networkOptions.chainId
//       if (chainID) return normalizeChainId(chainID)
//     }
//     throw new Error('Chain ID is not defined')
//   }

//   protected onDisconnect(): void {
//     this.emit('disconnect')
//   }

//   async disconnect(): Promise<void> {
//     try {
//       const magic = this.getMagicSDK()
//       await magic?.wallet.disconnect()
//       this.emit('disconnect')
//     } catch (error) {
//       console.error('Error disconnecting from Magic SDK:', error)
//     }
//   }

//   abstract getMagicSDK():
//     | InstanceWithExtensions<SDKBase, OAuthExtension[]>
//     | InstanceWithExtensions<SDKBase, MagicSDKExtensionsOption<string>>
//     | null
// }

export interface MagicConnectorParams {
  chains?: Chain[]
  options: MagicOptions
}

export function magicConnector({ chains = [], options }: MagicConnectorParams) {
  if (!options.apiKey) {
    throw new Error(
      'Magic API Key is required. Get one at https://dashboard.magic.link/',
    )
  }

  const getMagicSDK = ():
    | InstanceWithExtensions<SDKBase, OAuthExtension[]>
    | InstanceWithExtensions<SDKBase, MagicSDKExtensionsOption<string>>
    | null => {
    return null
  }

  const getProvider = async () => {
    const magic = getMagicSDK()
    if (!magic) return null
    return magic.rpcProvider
  }

  const getAccount = async () => {
    const provider = await getProvider()
    const accounts = await provider?.request({
      method: 'eth_accounts',
    })
    const account = getAddress(accounts[0] as string)
    return account
  }

  const getWalletClient = async ({ chainId }: { chainId?: number } = {}) => {
    const provider = await getProvider()
    const account = await getAccount()
    const chain = chains.find((x) => x.id === chainId) || chains[0]
    if (!provider) throw new Error('provider is required.')
    return createWalletClient({
      account,
      chain,
      transport: custom(provider),
    })
  }

  const onAccountsChanged = async (accounts: string[]) => {
    const provider = await getProvider()
    if (accounts.length === 0 || !accounts[0]) provider?.emit('disconnect')
    else provider?.emit('change', { account: getAddress(accounts[0]) })
  }

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
  }
}
