import axios from "axios";
import { logger } from "./loggingService";

const baseURL = process.env.REACT_APP_BASE_URL;
const getList = () => {
    try {
        return axios.get(baseURL + process.env.REACT_APP_AZURE_CRUD_LIST_FILES).then((response) => {
            return JSON.parse(response.data.List)
        });
    } catch (e) {
        logger.error(e);
    }
};

const downloadFile = (filename) => {
    try {
        return axios
            .get(baseURL + process.env.REACT_APP_AZURE_CRUD_DOWNLOAD_FILE + filename)
            .then((response) => {
                return response.data
            });
    } catch (e) {
        logger.error(e);
    }
};

const deleteFile = (fileName) => {
    try {
        return axios
            .get(baseURL + process.env.REACT_APP_AZURE_CRUD_DELETE_FILE + fileName)
            .then((response) => {
                return response;
            });
    } catch (e) {
        logger.error(e);
    }
};

const fileUpload = (data) => {
    const formData = new FormData();

    formData.append('asset', data);

    try {
        return axios
            .post(baseURL + process.env.REACT_APP_AZURE_CRUD_INSERT_FILE, formData)
            .then((response) => response);
    } catch (e) {
        logger.error(e);
    }
};

const azureBLOBStorageService = {
    getList,
    fileUpload,
    downloadFile,
    deleteFile,
};

export default azureBLOBStorageService;
