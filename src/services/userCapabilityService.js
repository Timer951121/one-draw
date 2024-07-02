import axios from "../helpers/bearerAxios";
import { logger } from "./loggingService";


const validationTest = async () => {
    try {
        return await axios.get(process.env.REACT_APP_GET_USER_CAPABILITY);
    } catch (e) {
        logger.error(e);
        return e;
    }
}

const userCapabilityService = {
    validationTest
}

export default userCapabilityService;
