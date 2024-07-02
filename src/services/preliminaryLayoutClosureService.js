import axios from "../helpers/bearerAxios";
import { logger } from "./loggingService";
const baseURL = process.env.REACT_APP_BASE_URL;

export const  preliminaryLayoutClosure = async (sfid) => {
  try {
    const response = await axios.post(
      baseURL + process.env.REACT_APP_PRELIMINARY_LAYOUT_CLOSURE + sfid
    );
    return response.data;
  } catch (error) {
    logger.error(error);
  }
};