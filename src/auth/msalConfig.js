// ============================================================
// MSAL CONFIG - src/auth/msalConfig.js
// ============================================================

import { PublicClientApplication, LogLevel } from "@azure/msal-browser";

const msalConfig = {
  auth: {
    clientId: "0aabfa41-3fc6-4287-ad6a-dcf56ef066d9",
    authority: "https://login.microsoftonline.com/3465b0fc-1b20-4784-9848-0db964aeeb82",
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      logLevel: LogLevel.Warning,
    },
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

// Handle redirect response on page load
await msalInstance.initialize();
const response = await msalInstance.handleRedirectPromise();
if (response) {
  msalInstance.setActiveAccount(response.account);
} else {
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0]);
  }
}

export const loginRequest = {
  scopes: ["User.Read"],
};

export const mapUserToRole = (account) => {
  if (!account) return null;
  const email = account.username?.toLowerCase() || "";
  const name = account.name || email.split("@")[0];

  return {
    email,
    name,
    nameAr: name,
    role: "epmo",
    title: "EPMO User",
    titleAr: "مستخدم المكتب",
    dept: "All",
    isAzureAD: true,
  };
};
