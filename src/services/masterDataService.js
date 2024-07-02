import axios from "../helpers/bearerAxios";
import { logger } from "./loggingService";
const baseURL = process.env.REACT_APP_BASE_URL;

const getMasterDataList = async () => {
  try {
    const response = await axios.get(
      baseURL + process.env.REACT_APP_MASTER_DATA_API_URL
    );
    return response.data;
  } catch (error) {
    logger.error(error);
  }
};
const masterDataServices = {
  getMasterDataList,
};

export default masterDataServices;
