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

This is a fork of `@magiclabs/wagmi-connector` with the following changes:
- Upgraded to Magic SDK v33 with `@magic-ext/evm` for native EVM chain switching
- Lazy-loaded Magic SDK imports for smaller initial bundle
- Moved `@wagmi/core` to peer dependencies
- Added `customLoginText` option for modal button text
- Removed unused dependencies

Requires WAGMI v2 and viem v2.

```sh
npm install @likecoin/wagmi-magic-connector
```

# 🔎 Package TL;DR

This package provides `dedicatedWalletConnector`, a [WAGMI](https://wagmi.sh/) connector integrated with Magic's [Dedicated Wallet](https://magic.link/docs/dedicated/overview). It supports email OTP, SMS, and OAuth login, as well as EVM chain switching via `@magic-ext/evm`.

# ⭐ Usage

```javascript
import { dedicatedWalletConnector } from '@likecoin/wagmi-magic-connector';

const connector = dedicatedWalletConnector({
  chains,
  options: {
    apiKey: YOUR_MAGIC_PUBLISHABLE_API_KEY, //required
    networks: [
      { rpcUrl: 'https://mainnet.infura.io/v3/...', chainId: 1 },
      { rpcUrl: 'https://polygon-rpc.com/', chainId: 137 },
    ],
    //...Other options
  },
});
```

# 📖 API

## `options`

The following can be passed to connector options object:

| Key                   | Value                      | Description                                                                                                                                                                    |
|-----------------------|----------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| apiKey                | string                     | 🔑 (Required) Your Magic publishable API key                                                                                                                                  |
| accentColor           | css color (hex/rgb/etc...) | 🎨 (Optional) Custom accent color for the modal. Default is purple                                                                                                            |
| isDarkMode            | true / false               | 🎨 (Optional) Enable dark mode for the modal. Default is false                                                                                                                |
| customLogo            | path_to_logo / url         | 🎨 (Optional) Custom logo for the modal instead of the default Magic logo                                                                                                     |
| customHeaderText      | string                     | 🎨 (Optional) Custom header text for the modal. Default is "Magic"                                                                                                            |
| customLoginText       | string                     | 🎨 (Optional) Custom login button text. Default is "Log in / Sign up"                                                                                                         |
| enableSMSLogin        | true / false               | 🌟 (Optional) Enable SMS login. Default is false                                                                                                                              |
| enableEmailLogin      | true / false               | 🌟 (Optional) Enable Email login. Default is true                                                                                                                             |
| oauthOptions          | object                     | 🌟 (Optional) OAuth login configuration. See below                                                                                                                            |
| magicSdkConfiguration | object                     | 🛠️ (Optional) Additional options for the Magic constructor ([docs](https://magic.link/docs/api-reference/client-side-sdks/web#constructor))                                  |
| networks              | array                      | 🛠️ (Optional) List of `{ rpcUrl, chainId }` objects for EVM chain switching via `@magic-ext/evm`                                                                             |

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

| Method                     | Supported |
|----------------------------|-----------|
| Email OTP                  | ✔️        |
| SMS                        | ✔️        |
| Social Logins (OAuth)      | ✔️        |
| WebAuthn                   | ❌        |
| Multifactor Authentication | ❌        |

# 🔆 Examples

## 🌟 Enable Login by Socials (OAuth)

You configure OAuth with magic by adding the following options to the connector:

```javascript
const connector = dedicatedWalletConnector({
  options: {
    apiKey: YOUR_MAGIC_PUBLISHABLE_API_KEY, //required
    oauthOptions : {
      providers: ['facebook', 'google', 'twitter'],
      callbackUrl: 'https://your-callback-url.com', //optional
    }
  },
})
```

To retrieve the Magic redirect result when a user is authenticated and logged in, use `JSON.parse(localStorage.getItem("magicRedirectResult"))`. This will give you access to the redirect result object. The object will be removed from localStorage once the user disconnects.


## 📲 Enable SMS Authentication

You can enable SMS authentication by adding the following options to the connector:

```javascript
const connector = dedicatedWalletConnector({
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
const connector = dedicatedWalletConnector({
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
import { dedicatedWalletConnector } from '@likecoin/wagmi-magic-connector';

const connector = dedicatedWalletConnector({
  options: {
    apiKey: YOUR_MAGIC_PUBLISHABLE_API_KEY,
    accentColor: '#ff0000',
    customLogo: 'https://example.com/logo.png',
    customHeaderText: 'Login to your account',
    customLoginText: 'Sign in',
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

import { dedicatedWalletConnector } from '@likecoin/wagmi-magic-connector'
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

const magicApiKey = process.env.NEXT_PUBLIC_MAGIC_API_KEY
const magicWallet = getRainbowMagicWallet({
  chains: wagmiChains,
  apiKey: magicApiKey
})

const connectors = connectorsForWallets([
  {
    groupName: 'Recommended',
    wallets: [
      //... other wallets connectors
      magicWallet,
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
