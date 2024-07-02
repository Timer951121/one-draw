import React, {createContext, useEffect, useState} from "react";
import userCapabilityService from "../services/userCapabilityService";
import azureLoginValidation from "../services/azureLoginValidation";
import {useViewerStore} from "../store/store";
import { logger } from "../services/loggingService";

const UserContext = createContext("");


const UserProvider = ({children}) => {
    const [user, setUser] = useState([]);

    const isAzureAuthenticated = azureLoginValidation()

    const isUserRedirectedToSiteAfterLogin = useViewerStore(state => state.isUserRedirectedToSiteAfterLogin);

        useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await userCapabilityService.validationTest();

                if (response?.status === 200) {
                    setUser(response.data);
                }
            } catch (error) {
                logger.error(error, "Error occurred while fetching data");
            }
        };

        if (isAzureAuthenticated ) {
            fetchData()
        }


    }, [isUserRedirectedToSiteAfterLogin]);

    const hasCapability = (name) => {
        const capability = user?.capabilities?.AppPage?.find(obj => obj.capability_name === name);
        if (!capability) {
            return false;
        }

        return capability.capability_value === 'Yes';
    };

    return (
        <UserContext.Provider value={{user, setUser, hasCapability}}>{children}</UserContext.Provider>
    );
};

export {UserProvider, UserContext};
