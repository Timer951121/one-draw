import {EventType} from "@azure/msal-browser";
import getMsalInstance from "./getMsalInstance";
import userCapabilityService from "../services/userCapabilityService";

const handleMicrosoftLogin = () => {

    // Get MSAL Instance
    const msalInstance = getMsalInstance();

    // Successful Login Event Callback
    msalInstance.addEventCallback((event) => {
        if (event.eventType === EventType.LOGIN_SUCCESS) {
            msalInstance.setActiveAccount(event.payload.account);
            localStorage.setItem("msalAccount", JSON.stringify(event.payload.account));
        }
    });


    // Handle Redirect From Microsoft Login
    msalInstance.handleRedirectPromise().then(async (tokenResponse) => {

        // Handle Redirects
        if (tokenResponse) {

            //Get Expiry Time of Token
            const tokenExpiryDateAndTime = tokenResponse.expiresOn.toISOString()


            //Set Token Value
            localStorage.setItem("token", JSON.stringify(tokenResponse.accessToken));

            // Store Expiry Time of Token
            localStorage.setItem('tokenExpiry', tokenExpiryDateAndTime);


            const doesUserHaveEntitlement = await userCapabilityService.validationTest().then((response) => {return response.data.HasEntitlement===true});


            if(doesUserHaveEntitlement){
                // Fire a redirect event to trigger a redirect to sites table
                const authenticatedCustomEvent = new CustomEvent('userLoginSuccess', {
                    detail: {
                        redirect: true,
                        validated: true
                    }
                });
                window.dispatchEvent(authenticatedCustomEvent);
            }
            else{
                const userHasNoEntitlementEvent = new CustomEvent('userHasNoEntitlement', null);

                window.dispatchEvent(userHasNoEntitlementEvent);

            }



        }
    });
}

export default handleMicrosoftLogin;