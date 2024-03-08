export function dedicatedWalletConnector({
  chains,
  options,
}: DedicatedWalletOptions) {
  let magicSDK: InstanceWithExtensions<SDKBase, OAuthExtension[]> | null = null

  const getDedicatedMagicSdk = () => {
    if (!magicSDK) {
      magicSDK = new Magic(options.apiKey, {
        ...options.magicSdkConfiguration,
        extensions: [new OAuthExtension()],
      }) as InstanceWithExtensions<SDKBase, OAuthExtension[]>
    }
    return magicSDK
  }

  let {
    id,
    name,
    type
    isModalOpen,
    isReady,
    getAccount,
    getMagicSDK,
    getProvider,
    getWalletClient,
    onAccountsChanged,
  } = magicConnector({ chains, options })

  getMagicSDK = getDedicatedMagicSdk

  return createConnector((config) => ({
    id,
    type,
    name,
    getProvider,
    connect: async function() {
    if (!options.apiKey) {
      throw new Error('Magic API Key is not provided.');
    }

    const provider = await getProvider();

    if (provider?.on) {
      provider.on('accountsChanged', this.onAccountsChanged.bind(this));
      provider.on('chainChanged', this.onChainChanged.bind(this));
      provider.on('disconnect', this.onDisconnect.bind(this));
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

    return {
      accounts: ['0x...'], 
      chainId, 
    };
  },

    disconnect: async () => {
    console.log('Disconnecting...')
    // Implement disconnect logic here
  },

  getAccounts: async () => {
    console.log('Getting accounts...')
    // Implement logic to retrieve accounts. Example:
    return ['0x...'] // Replace with actual accounts
  },

  getChainId: async () => {
    console.log('Getting chain ID...')
    // Implement logic to retrieve chain ID. Example:
    return 1 // Replace with actual chain ID
  },

  isAuthorized: async () => {
    try {
      const magic = getDedicatedMagicSdk()

      if(!magic) {
        return false
      }

      const isLoggedIn = await magic.user.isLoggedIn()
      if (isLoggedIn) return true

      const result = await magic.oauth.getRedirectResult()
      return result !== null
    } catch {}
    return false
  },

  onAccountsChanged: (accounts) => {
    console.log('Accounts changed:', accounts)
    // Implement your logic to handle account changes
  },

  onChainChanged: (chainId) => {
    console.log('Chain changed:', chainId)
    // Implement your logic to handle chain changes
  },

  onConnect: (connectInfo) => {
    console.log('Connected:', connectInfo)
    // Implement your logic for when a connection is established
  },

  onDisconnect: (error) => {
    console.log('Disconnected:', error)
    // Implement your logic for handling disconnection
  },

  onMessage: (message) => {
    console.log('Message:', message)
    // Implement your logic for handling messages
  },
  }))
}
