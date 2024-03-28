# WAGMI Magic Connector

[WAGMI](https://wagmi.sh/) Connector to connect with [Magic](https://magic.link/). Magic is a developer SDK that you can integrate into your application to enable passwordless authentication using magic links, OTPs, OAuth from third-party services, and more for your web3 App.

Special thanks to the [Everipedia](https://github.com/EveripediaNetwork) team for creating the connector and working with us for ongoing support and maintenance.

![Frame 184 (4)](https://user-images.githubusercontent.com/52039218/174133833-fc63f237-63bf-4134-a22b-ce77ae0f2a9b.png)

# Table of Contents

- [WAGMI Magic Connector](#wagmi-magic-connector)
- [Table of Contents](#table-of-contents)
- [⬇️ Install](#️-install)
- [🔎 Package TL;DR](#-package-tldr)
- [⭐ Usage](#-usage)
- [📖 API](#-api)
  - [`options`](#options)
  - [`options.OAuthOptions`](#optionsoauthoptions)
    - [Providers](#providers)
    - [Callback URL](#callback-url)
- [🍀 Supported Logins](#-supported-logins)
- [🔆 Examples](#-examples)
  - [🌟 Enable Login by Socials (OAuth)](#-enable-login-by-socials-oauth)
  - [📲 Enable SMS Authentication](#-enable-sms-authentication)
  - [📧 Disable Email Authentication](#-disable-email-authentication)
  - [🎨 Modal Customization](#-modal-customization)
- [📚 Additional Resources](#-additional-resources)
  - [Usage with RainbowKit](#usage-with-rainbowkit)
  - [**Example repositories:**](#example-repositories)

# ⬇️ Install
Two versions of the `wagmi-magic-connector` are available, each designed to support different WAGMI versions. 

Note: **It is crucial not to mix up these versions to ensure compatibility and functionality.**

**V1**
This version utilizes WAGMI version 1. To install, use the following command:

`npm install @magiclabs/wagmi-connector@1.1.5`
or
`yarn install @magiclabs/wagmi-connector@1.1.5`

**V2 (Beta)**
This version utilizes and includes the latest WAGMI v2 features.

To install, use the following command:

`npm install @magiclabs/wagmi-connector`
or
`yarn install @magiclabs/wagmi-connector`

We actively encourage the community to participate in testing the versions of `wagmi-magic-connector` and to report [any issues or suggestions](https://github.com/magiclabs/wagmi-magic-connector/issues/new/choose) for improvement. Your feedback is invaluable in helping us enhance the quality and stability of the connector.

# 🔎 Package TL;DR

The package contains two main connector classes: `DedicatedWalletConnector` & `UniversalWalletConnector`

`DedicatedWalletConnector` is a connector integrated to the [Dedicated Wallet](https://magic.link/docs/dedicated/overview)
product. It is useful if you need to assign an address to your user. 

`UniversalWalletConnector` is a connector integrated to the [Universal Wallet](https://magic.link/docs/universal/overview)
product. It can be used to assign a read-write wallet to your user.

DEPRECATED: `MagicAuthConnector` and `MagicConnectConnector` have been replaced by `DedicatedWalletConnector` and `UniversalWalletConnector` in order to line up with Magic's [product names changes](https://magic.link/docs/universal/resources/faqs#why-were-magic-product-names-changed-from-magic-connect-and-magic-auth). However, they are still usable and will function as they did before.

# ⭐ Usage

```javascript
import { DedicatedWalletConnector, UniversalWalletConnector } from '@magiclabs/wagmi-connector';

// Dedicated Wallet integration
const connector = new DedicatedWalletConnector({
  options: {
    apiKey: YOUR_MAGIC_PUBLISHABLE_API_KEY, //required
    //...Other options
  },
});

// Universal Wallet integration 
const connector = new UniversalWalletConnector({
  options: {
    apiKey: YOUR_MAGIC_PUBLISHABLE_API_KEY, //required
    //...Other options
  },
});
```

# 📖 API

## `options`

The following can be passed to connector options object:

| Key                   | Value                      | `DedicatedWalletConnector` support | `UniversalWalletConnector` support | Description                                                                                                                                                                    |
|-----------------------|----------------------------|------------------------------|---------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| accentColor           | css color (hex/rgb/etc...) | ✔️	                          | ✔️                              | 🎨 (Optional) Makes modal to use the custom accentColor instead of default purple                                                                                              |
| isDarkMode            | true / false               | ✔️	                          | ✔️                              | 🎨 (Optional) Makes modal dark mode if true. Default value is false                                                                                                            |
| customLogo            | path_to_logo / url         | ✔️	                          | ✔️                              | 🎨 (Optional) Makes modal to use the custom logo instead of default magic logo                                                                                                 |
| customHeaderText            | string                     | ✔️	                          | ✔️                              | 🎨 (Optional) Makes modal to use the custom header text instead of default text at the bottom of logo                                                                          |
| enableSMSLogin        | true / false               | ✔️	                          | ❌                               | 🌟 (Optional) Makes modal to enable SMS login if true. Default value is false                                                                                                  |
| enableEmailLogin      | true / false               | ✔️	                          | ❌                               | 🌟 (Optional) Makes modal to disable Email login if false. Default value is true                                                                                               |
| OAuthOptions          | object                     | ✔️	                          | ❌                               | 🌟 (Optional) Makes modal to enable OAuth login according to configuration passed.                                                                                             |
| magicSdkConfiguration | object                     | ✔️	                          | ✔️                              | 🛠️ (Optional) Pass additional options to Magic constructor (refer [Magic API documentation](https://magic.link/docs/api-reference/client-side-sdks/web#constructor) for more) |
| networks              | array of EthNetworkConfiguration | ❌                     | ✔️                              | 🛠️ (Optional) Pass the list of network compatible to switch networks |

## `options.OAuthOptions`

The following can be passed to options.OAuthOptions object to configure OAuth login:

| Key         | Value           | Description                                                                                               |
|-------------|------------------|-----------------------------------------------------------------------------------------------------------|
| providers   | array of strings | 🌟 (Required) List of providers to enable. check out all possible providers in OAuthOptions section above |
| callbackUrl | string           | 🌟 (Optional) Callback URL to redirect to after authentication. Default value is current URL.             |

### Providers

Here are all the possible providers:

- google
- facebook
- apple
- github
- bitbucket
- gitlab
- linkedin
- twitter
- discord
- twitch
- microsoft

### Callback URL

You can provide a callback URL to redirect the user to after authentication. the default callback URL is set to the current URL.

# 🍀 Supported Logins

| Key                        | `DedicatedWalletConnector` support | `UniversalWalletConnector` support |
|----------------------------|------------------------------|---------------------------------|
| Email                      | ✔️	                          | ✔️	                             |
| SMS                        | ✔️	                          | ❌                               |
| Social Logins              | ✔️	                          | ❌                               |
| WebAuthn                   | ❌                            | ❌                               |
| Multifactor Authentication | ❌                            | ❌                               |

# 🔆 Examples

## 🌟 Enable Login by Socials (OAuth)

You configure OAuth with magic by adding the following options to the connector:

```javascript
const connector = new DedicatedWalletConnector({
  options: {
    apiKey: YOUR_MAGIC_PUBLISHABLE_API_KEY, //required
    oauthOptions : {
      providers: ['facebook', 'google', 'twitter'],
      callbackUrl: 'https://your-callback-url.com', //optional
    }
  },
})
```


## 📲 Enable SMS Authentication

You can enable SMS authentication by adding the following options to the connector:

```javascript
const connector = new DedicatedWalletConnector({
  options: {
    apiKey: YOUR_MAGIC_PUBLISHABLE_API_KEY, //required
    enableSMSLogin: true, //optional (default: false)
    //...Other options
  },
});
```

You have to enable SMS authentication in your [Magic dashboard](https://dashboard.magic.link) first to make it work.

## 📧 Disable Email Authentication

By default Email is set to true as default. if you wish to remove Email OTP, pass `enableEmailLogin: false` in options object as follows :

```javascript
const connector = new DedicatedWalletConnector({
  options: {
    apiKey: YOUR_MAGIC_PUBLISHABLE_API_KEY, //required
    enableEmailLogin: false, //optional (default: true)
    //...Other options
  },
});
```
  

## 🎨 Modal Customization

You can customize the modal's theme, default accent color, logo and header text.

```javascript
import { DedicatedWalletConnector } from '@magiclabs/wagmi-connector';

const connector = new DedicatedWalletConnector({
  options: {
    apiKey: YOUR_MAGIC_PUBLISHABLE_API_KEY,
    accentColor: '#ff0000',
    customLogo: 'https://example.com/logo.png',
    headerText: 'Login to your account',
    isDarkMode: true,
  },
});
```

check out the [API Section](#-api) for more information.
for complete styling, you can override styles of the modal with ```! important```.

# 📚 Additional Resources

## Usage with RainbowKit

To use the connector with Rainbow kit, create a new file `RainbowMagicConnector.ts` with following contents:

```javascript
// RainbowMagicConnector.ts

// RainbowMagicConnector.ts

import { dedicatedWalletConnector } from '@magiclabs/wagmi-connector'
import { Wallet, WalletDetailsParams } from '@rainbow-me/rainbowkit'
import { CreateWalletFn } from '@rainbow-me/rainbowkit/dist/wallets/Wallet'
import { Chain } from 'wagmi/chains'
import { createConnector as createWagmiConnector } from 'wagmi'

export const getRainbowMagicWallet = (options): CreateWalletFn => {
  return () => rainbowMagicWallet(options)
}

export const rainbowMagicWallet = ({
  chains,
  apiKey
}: {
  chains: Chain[]
  apiKey: string
}): Wallet => ({
  id: 'magic',
  name: 'Magic',
  rdns: 'Magic',
  iconUrl: 'https://dashboard.magic.link/images/logo.svg',
  iconBackground: '#fff',
  installed: true,
  downloadUrls: {},
  createConnector: (walletDetails: WalletDetailsParams) =>
    createWagmiConnector((config) => ({
      ...dedicatedWalletConnector({
        chains: chains,
        options: {
          apiKey: apiKey,
          magicSdkConfiguration: {
            network: {
              rpcUrl: '<RPC_URL>',
              chainId: 1
            }
          }
          //...Other options (check out full API below)
        }
      })(config),
      ...walletDetails
    }))
})
```

> Note: `options.magicSdkConfiguration.network.chainId` is mandatory for the integration with RainbowKit
> to properly work.

Import the above file to your application root where you wrap your application with `WagmiConfig` component.
pass the ```client``` prop with ```createClient``` instance to the `WagmiConfig` component as shown below:

```javascript
// App.tsx

// ...
const { chains, publicClient, webSocketPublicClient } =
  configureChains(YOUR_CHAIN_CONFIG);
const connectors = connectorsForWallets([
  {
    groupName: 'Recommended',
    wallets: [
      //... other wallets connectors
      rainbowMagicConnector({ chains }),
    ],
  },
]);
const wagmiConfig = createConfig({
	autoConnect: false,
	connectors,
	publicClient,
	webSocketPublicClient
});
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        <Component {...pageProps} />
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
export default MyApp;
```

This procedure might change depending on the version of Rainbow kit you are using so please check the documentation of the Rainbow kit if it is not working.

## **Example repositories:** 
- https://github.com/Royal-lobster/vanilla-magic-example
- https://github.com/Royal-lobster/rainbow-magic-example (With Rainbowkit 🌈)
