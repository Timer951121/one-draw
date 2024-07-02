import {BrowserCacheLocation, PublicClientApplication} from "@azure/msal-browser";


const getRedirectUri = () => {
    //If running on localhost, return the default redirect URI
    if (window.location.hostname === "localhost") {
        return process.env.REACT_APP_AZURE_LOGIN_REDIRECT_LOCAL_URL;
    }
    //If the app is deployed, return the deployed URI
    else {
        return process.env.REACT_APP_AZURE_LOGIN_REDIRECT_PRODUCTION_URL;
    }
};

//Create MSAL Instance
const msalInstance = new PublicClientApplication({
    auth: {
        clientId: process.env.REACT_APP_AZURE_TOKEN_CLIENT_ID,
        authority: "https://login.microsoftonline.com/f1006ee5-f888-4308-92ea-fcaebe1c0b5e",
        redirectUri: getRedirectUri(),
        postLogoutRedirectUri: getRedirectUri(),
    },
    system : {
        iframeHashTimeout: 10000,
    },
    cache :{
        cacheLocation: BrowserCacheLocation.LocalStorage
    }
});

// Function to get the MSAL instance
const getMsalInstance = () => {
    return msalInstance;
}

export default getMsalInstance;