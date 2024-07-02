import axios from "axios";
import axiosInstance from "../helpers/bearerAxios";
import { logger } from "./loggingService";

const getExcelServiceToken = async () => {
    try {
        const res = await axios.get(`${process.env.REACT_APP_EXCELSERVICES_API_URL}/api/ExcelService/GetAuthorizationToken`)
        return res.data.token;
    } catch (err) {
        return err
    }
}

const getTreeEPC = async (token, installationState, utilityName, escalatorValue, systemSize, productionSize, predictType, predictValue) => {
    const inputcell = predictType === 'PPW' ? "I4" : "K4";

    return await axios({
        method: 'post',
        url: `${process.env.REACT_APP_EXCELSERVICES_API_URL}/api/CascadingDropdowns`,
        data: {
            ExcelFileName: "Price_Forecasting_Tool",
            SheetName: "PFS",
            InputValues: [
                {"CellNumber": "B4", "CellValue": installationState, "Type": "String"},
                {"CellNumber": "C4", "CellValue": utilityName, "Type": "String"},
                {"CellNumber": "D4", "CellValue": "Sunnova", "Type": "String"},
                {"CellNumber": "E4", "CellValue": "PPA", "Type": "String"},
                {"CellNumber": "F4", "CellValue": escalatorValue, "Type": "String"},
                {"CellNumber": "G4", "CellValue": systemSize, "Type": "String"},
                {"CellNumber": "H4", "CellValue": productionSize, "Type": "String"},
                {"CellNumber": inputcell, "CellValue": predictValue, "Type": "String"}
            ],
            OutputCells: ["J4", "L4"]
        },
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
        .then((res) => {

            const responseData = {
                ppw: res.data.OutputValues[0].CellValue,
                rate: res.data.OutputValues[1].CellValue,
            }

            return responseData
        })
        .catch((err) => {
            logger.error(err);
            return err
        })
}


const getOpportunityStatusForEPCPricing = async (salesforceid) => {

    return await axios({
        method: 'get',
        url: `${process.env.REACT_APP_ONEBUTTON_CONTRACT_API_URL}/GetOpportunityEPCStatus?salesforceId=${salesforceid}`,
        headers: {
            Authorization: `Bearer ${JSON.parse(localStorage.getItem("token"))}`
        }
    })
    .then((res) => {
       return res.data;
    })
    .catch((err) => {
        logger.error(err);
        return err
    })
}


const createEPCQuote = async (epcPricingObject) => {

    return await axios({
        method: 'post',
        url: `${process.env.REACT_APP_ONEBUTTON_CONTRACT_API_URL}/CreateEPCPricing`,
        data: epcPricingObject,
        headers: {
            Authorization: `Bearer ${JSON.parse(localStorage.getItem("token"))}`
        },

    })
    .then((res) => {
       return res.data;
    })
    .catch((err) => {
        logger.error(err);
        return err
    })
}

const priceBooking = async (state,utility,multiplier)=>{
    return await axios({
        method: 'get',
        url: `${process.env.REACT_APP_ONE_PRICE_BOOK_API_URL}${state}&utility=${encodeURIComponent(utility)}&multiplier=${multiplier}`,
    })
    .then((res) => {
        return res.data.Data;
    })
    .catch((err) => {
        logger.error(err);
        return err.response.data.Message
    })

}


const getEpcEstimation = async (salesforceid, designName) => {
    try {
      return axiosInstance
        .get(`${process.env.REACT_APP_BASE_URL}${process.env.REACT_APP_GET_EPC_ESTIMATION}?Salesforce_Id=${salesforceid}&design_Data=${designName}`        )
        .then((response) => {
          return response.data;
        });
    } catch (error) {
      logger.error(error);
      throw error;
    }
  };

const saveEpcEstimation = async (payload) => {
    try {
      const response = await axiosInstance.post(
        `${process.env.REACT_APP_BASE_URL}${process.env.REACT_APP_SAVE_EPC_ESTIMATION}`,
        payload,
        {
          headers: {
            "Content-Type": "application/json", // Set the content type as JSON
          },
        }
      );
      return response.data;
    } catch (error) {
      logger.error(error);
      throw error;
    }
  };

const treeEPCService = {
    getExcelServiceToken,
    getTreeEPC,
    getOpportunityStatusForEPCPricing,
    createEPCQuote,
    priceBooking,
    getEpcEstimation,
    saveEpcEstimation
}

export default treeEPCService;