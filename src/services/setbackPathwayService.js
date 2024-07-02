import axios from '../helpers/bearerAxios';
import { logger } from './loggingService';


const getSetbackPathway = (oppId) => {
    return axios.get(`${process.env.REACT_APP_BASE_URL}${process.env.REACT_APP_SETBACK_PATHWAY_API_URL}?OpportunityId=${oppId}`)
        .then(response => {
            return response;
        })
        .catch(error => {
            logger.error(error);
            return error;
        })
}

const setbackPathwayService = {
    getSetbackPathway
}

export default setbackPathwayService;
