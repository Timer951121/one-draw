import axios from "axios";
import { logger } from "./loggingService";


export const getEagleViewXMLFile = async (account_id, token) => {
    return await axios.get(`${process.env.REACT_APP_GET_EAGLE_VIEW_XML_API_URL}?RefId=${account_id}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => {
            return response.data[0].body
        })
        .catch(error => {
            logger.error(error);
            return error;
        })
}

