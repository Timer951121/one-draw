import axios from '../helpers/bearerAxios';
import { logger } from './loggingService';

const baseURL = process.env.REACT_APP_BASE_URL;

const getModuleList = async () => {

    const requestBody = {
        "tableNames": [
            {
                "tableName": "Product",
                "aliasName": "P",
                "joinFields": [
                    "string"
                ]
            }
        ],
        "filterRequest": [
            {
                "fieldName": "Is_Active",
                "isInculded": true,
                "fieldValue": "1",
                "dataType": "bool"
            }
        ],
        "fieldRequest": [
            {
                "fieldName": "Product_Code",
                "isInculded": true
            },
            {
                "fieldName": "Product_Name",
                "isInculded": true
            },
            {
                "fieldName": "Sales_Force_Id",
                "isInculded": true
            },
            {
                "fieldName": "Wattage",
                "isInculded": true
            },
            {
                "fieldName": "Product_Manufacturer",
                "isInculded": true
            },
            {
                "fieldName": "Height_Thickness_mm",
                "isInculded": true
            },
            {
                "fieldName": "Length_mm",
                "isInculded": true
            },
            {
                "fieldName": "Width_mm",
                "isInculded": true
            },
            {
                "fieldName": "Height_Thickness_Inches",
                "isInculded": true
            },
            {
                "fieldName": "Length_inches",
                "isInculded": true
            },
            {
                "fieldName": "Width_Inches",
                "isInculded": true
            },
            {
                "fieldName": "Sunnova_Module_Model_Id",
                "isInculded": true
            },
            {
                "fieldName": "Is_Active",
                "isInculded": true
            }
        ]
    }

    try {
        const response = await axios.post(
            baseURL + process.env.REACT_APP_MODULE_LIST_API_URL,
            requestBody,
        );
        return response.data;

    } catch (error) {

        logger.error(error);

    }
};


const getDefaultModule = async (stateCode) => {
    try {
        const response = await axios.get(
            baseURL +`${process.env.REACT_APP_DEFAULT_MODULE_API_URL}?StateCode=${stateCode}`,
        );
        return response.data[0]['Module List'];

    } catch (error) {
        logger.error(error);
        return error;
    }
}

const moduleServices = {
    getModuleList,
    getDefaultModule
}


export default moduleServices;
