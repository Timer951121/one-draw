import axios from "../helpers/bearerAxios";
import { logger } from "./loggingService";

export const getEngineeringData = async (payload, action) => {
  return await axios
    .post(
      `${process.env.REACT_APP_BASE_URL}${process.env.REACT_APP_ENGG_LETTER_URL}${action}`,payload
    )
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      logger.error(error);
      return error;
    });
};

export const downloadEngineeringData = async (payload) => {
  return await axios
    .post(
      `${process.env.REACT_APP_BASE_URL}${process.env.REACT_APP_ENGG_LETTER_DOWNLOAD_URL}`,payload,{responseType: 'blob'}
    )
    .then((response) => {
      return response;
    })
    .catch((error) => {
      logger.error(error);
      return error;
    });
};
