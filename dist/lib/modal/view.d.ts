import type { OAuthProvider } from '@magic-ext/oauth';
export declare const createModal: (props: {
    accentColor?: string;
    isDarkMode?: boolean;
    customLogo?: string;
    customHeaderText?: string;
    enableSMSLogin?: boolean;
    enableEmailLogin?: boolean;
    oauthProviders?: OAuthProvider[];
}) => Promise<unknown>;
