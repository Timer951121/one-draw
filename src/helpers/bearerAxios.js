import axios from "axios";
import tokenValidationService from "../services/tokenValidationService";
import getMsalInstance from "./getMsalInstance";
import { logger } from "../services/loggingService";

const msalInstance = getMsalInstance();

// Function to acquire a token silently with retry logic
const acquireTokenSilentWithRetry = async (retryCount = 3) => {
    let attempt = 0;

    while (attempt < retryCount) {
        try {
            // Retrieve account object from cache
            const account = JSON.parse(localStorage.getItem("msalAccount"))

            // Build silent request
            const silentRequest = {
                account: account, // Account info retrieved from browser cache
                scopes: [process.env.REACT_APP_AZURE_TOKEN_SCOPE], // Scopes for which you need the token
            };

            logger.log("Making silent request to get new token");

            // Acquire token silently
            const response = await msalInstance.acquireTokenSilent(silentRequest);

            // Get the access token from the response
            const accessToken = response.accessToken;

            // Set the access token in local storage
            localStorage.setItem("token", JSON.stringify(accessToken));

            const tokenExpiryDateAndTime = response.expiresOn.toISOString();

            // Store expiry time in local storage
            localStorage.setItem('tokenExpiry', tokenExpiryDateAndTime);

            logger.log("Successfully set the new token");
            return accessToken;

        } catch (error) {
            if (error.errorCode === 'monitor_window_timeout') {
                logger.warn(`Token acquisition failed due to timeout. Retrying... (${attempt + 1}/${retryCount})`);
                attempt++;
            } else {
                logger.error(error, "Error acquiring token silently");
                throw error; // rethrow other errors
            }
        }
    }

    throw new Error(`Token acquisition failed after ${retryCount} attempts`);
};

const instance = axios.create({
    baseURL: "",
});

// Axios interceptor to set bearer token if it exists in local storage
instance.interceptors.request.use(
    async (req) => {
        // Check if token is expired
        const isTokenExpired = tokenValidationService();

        // TO test this, manually set the token to an expired token in local storage and refresh the page
        if (isTokenExpired) {
            try {
                // Get and set new token
                const newToken = await acquireTokenSilentWithRetry();
                logger.log("New Token Set");

                // Intercept request and set bearer token
                req.headers.authorization = `Bearer ${newToken}`;
            } catch (error) {
                logger.error(error, "Failed to set new token after retries");
                // Handle the error appropriately, e.g., redirect to login
            }
        } else {
            // Intercept request and set bearer token
            const token = JSON.parse(localStorage.getItem("token"));
            if (token !== null) {
                req.headers.authorization = `Bearer ${token}`;
            }
        }
        return req;
    },
    (err) => {
        logger.error(err, "Bearer Axios error");
        return Promise.reject(err);
    }
);

export default instance;
