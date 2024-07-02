import axios from "../helpers/bearerAxios";
import { logger } from "./loggingService";

// const baseURL = process.env.REACT_APP_BASE_URL;
const getRoofSelectedStatus = async (bdId) => {
  try {
    const opId = sessionStorage.getItem('SalesForceId');
    return axios
      .get(
          process.env.REACT_APP_GET_ROOF_STATUS_URL + `?OpportunityId=${opId}&buildingId=${bdId}`
      )
      .then((response) => {
        return response.data;
      });
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

const updateRoofSelectedStatus = async (bdId,status) => {
  try {
    const opId = sessionStorage.getItem('SalesForceId');
    return axios
      .post(
          process.env.REACT_APP_UPDATE_ROOF_STATUS_URL +
          `?OpportunityId=${opId}&buildingId=${bdId}&isSelected=${status}`
      )
      .then((response) => {
        return response.data;
      });
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

const roofStatusService = {
  getRoofSelectedStatus,
  updateRoofSelectedStatus
};

export default roofStatusService;
