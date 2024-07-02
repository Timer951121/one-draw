import axios from "../helpers/bearerAxios";
import { isBoxUploadEnabled } from "../helpers/featureFlags";
import { logger } from "./loggingService";

export const getDocumentsList = async (docType) => {
    return await axios.get(`${process.env.REACT_APP_BASE_URL}${process.env.REACT_APP_FETCH_DOCS_URL}?document_Type=${docType}`)
        .then(response => {
            return response.data
        })
        .catch(error => {
            logger.error(error);
            return error;
        })
}


export const downloadEngineeringDocFile = async (payload, salesForceID) => {
    try {
        return await axios.post(`${process.env.REACT_APP_BASE_URL}${process.env.REACT_APP_DWN_ENGG_FILE_URL}?salesForceId=${salesForceID}`, payload, {
            responseType: 'blob'
        })
        .then((response) => {
            return response;
        })
        .catch((error) => {
            return error;
        });

    } catch (error) {
        logger.error(error, 'Error downloading file:');
    }
};


export const uploadToBox = async (oppId, file) => {
    if (!isBoxUploadEnabled()) {
        logger.error('Box Upload is not enabled');
        return;
    }

    try {

        let url = `${process.env.REACT_APP_BASE_URL}${process.env.REACT_APP_UPLOAD_TO_BOX_API}?opportunityId=${oppId}`
        var formData = new FormData();
        formData.append('file', file);
        const res = await axios.post(url,
            file,
            {
            headers: {
               "Content-Type": "application/json",
            },
          });

         logger.log('upload Complete: ',res);
         if (res.data.Message.includes("successfully")){
            return true;
         }
         return false;

    } catch (error) {
        logger.error(error, "Error Uploading files");
        return false;
    }

}
