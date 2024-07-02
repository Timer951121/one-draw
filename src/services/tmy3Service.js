import axios from "../helpers/bearerAxios";
import { logger } from "./loggingService";

export const getTMY3WeatherCSVFile = async (filename) => {
    return await axios.get(`${process.env.REACT_APP_BASE_URL}${process.env.REACT_APP_FETCH_TMY3_CSV_URL}?filename=${filename}`)
        .then(response => {
            return response.data
        })
        .catch(error => {
            logger.error(error);
            return error;
        })
}

