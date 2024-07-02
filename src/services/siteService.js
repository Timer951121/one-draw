import axios from "../helpers/bearerAxios";
import { logger } from "./loggingService";

const baseURL = process.env.REACT_APP_BASE_URL;
const postSitesSearch = async (
  searchValue,
  page,
  stageSelectedFilter = [],
  dateSelectedFilter = {},
  isDateFilterApplied,
  isStageFilterApplied
) => {
  let dateFrom = null;
  let dateTo = null;
  let searchParam = searchValue;
  let isAssignToMe = false;
  let sortField = "CreatedDate";
  let sortOrder = "DESC";
  let filter = { pagenumber: page, pageSize: 20 };
  let filterRequest = [];

  //Date Filter
  if (isDateFilterApplied) {
    dateFrom = dateSelectedFilter.dateFrom;
    dateTo = dateSelectedFilter.dateTo;

    //dateFrom should be 1 day lesser than dateFrom to get the data for the selected date
    const dateFromObj = new Date(dateFrom);
    dateFromObj.setDate(dateFromObj.getDate() - 1);
    dateFrom = dateFromObj.toISOString();

    //dateTo should be 1 day greater than dateTo to get the data for the selected date
    const dateToObj = new Date(dateTo);
    dateToObj.setDate(dateToObj.getDate() + 1);
    dateTo = dateToObj.toISOString();

    filterRequest.push(
      {
        field_Name: "CreatedDate",
        field_Value: dateFrom,
        filter_Condition: "GREATER THAN",
        field_Type: "DATE",
      },
      {
        field_Name: "CreatedDate",
        field_Value: dateTo,
        filter_Condition: "LESS THAN",
        field_Type: "DATE",
      }
    );
  }

  //Stage Filter
  if (isStageFilterApplied) {
    stageSelectedFilter.forEach((item) => {
      filterRequest.push({
        field_Name: "Stage",
        field_Value: item,
        filter_Condition: "CONTAINS",
        field_Type: "STRING",
      });
    });
  }

  //check if searchValue contains "," then split the string
  if (searchValue.includes(",")) {
    searchParam = searchValue.split(",");
    searchParam = searchParam[0].trim();
  }

  try {
    return axios
      .post(baseURL + process.env.REACT_APP_SITES_TABLE_SEARCH_API_URL, {
        searchParam,
        dateFrom,
        dateTo,
        isAssignToMe,
        sortField,
        sortOrder,
        filter,
        filterRequest,
      })
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        throw error; // Re-throw the error to be caught by the caller
      });
  } catch (e) {
    logger.error(e);
    throw e; // Re-throw the error to be caught by the caller
  }
};

const postSiteById = (ID, token) => {
  try {
    return axios
      .get(`${process.env.REACT_APP_SITES_BY_ID}?accountId=${ID}`,{
        headers: {
            'Authorization': `Bearer ${token}`
        }
      })
      .then((response) => {
        return response?.data?.siteJson;
      });
  } catch (e) {
    logger.error(e);
    return e;
  }
};

export const getEagleViewToken = async () => {
  try {
    return axios
      .post(baseURL + `${process.env.REACT_APP_EAGLE_VIEW_XML_TOKEN_API_URL}`)
      .then((response) => {
        return response.data.access_token;
      });
  } catch (err) {
    return err;
  }
};

const getAuroraSiteJsonFile = (ID) => {
  try {
    return axios
      .get(process.env.REACT_APP_GET_AURORA_JSON_FILE_API_URL + ID)
      .then((response) => {
        return response.data.sitejson;
      });
  } catch (e) {
    logger.error(e);
  }
};

const retrieveSiteDesignDetails = async (opId) => {
  try {
    return axios
      .get(
        baseURL +
          process.env.REACT_APP_RETRIEVE_SITE_DESIGN_DETAILS +
          `?OpportunityId=${opId}`
      )
      .then((response) => {
        return response.data;
      });
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

const retrieveSiteDesignDetailsWithDesignData = async (
  opportunityId,
  designNo,
  versionNo
) => {
  try {
    const response = await axios.post(
      baseURL +
        process.env.REACT_APP_RETRIEVE_SITE_DESIGN_DETAILS_WITH_DESIGN_DATA,
      {
        opportunityId: opportunityId,
        designNo: designNo,
        versionNo: versionNo,
      }
    );
    return response.data[0];
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

const retrieveSiteDesignVersionDetails = async (payload) => {
  try {
    return axios
      .post(
        baseURL + process.env.REACT_APP_RETRIEVE_DESIGN_VERSION_DETAILS,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then((response) => {
        return response.data[0];
      });
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

const saveSiteDetails = async (payload) => {
  try {
    const response = await axios.post(
      baseURL + process.env.REACT_APP_SAVE_SITE_DETAILS,
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

const updateBuildingAttributes = async (payload) => {
  try {
    const response = await axios.post(
      baseURL + process.env.REACT_APP_UPDATE_SITE_DETAILS,
      payload
      // {
      //   headers: {
      //     "Content-Type": "application/json", // Set the content type as JSON
      //   },
      // }
    );

    return response.data;
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

const retrieveSiteList = async (payload) => {
  try {
    const response = await axios.post(
      baseURL + process.env.REACT_APP_RETRIEVE_SITE_LIST,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response;
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

const saveDesignCertification = async (designid, certification) => {
  try {
    return axios
      .post(
        baseURL +
        process.env.REACT_APP_UPDATE_DESIGN_CERTIFICATION_STATUS +
        `${designid}&Design_Certification_Status_Id=${certification}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then((response) => {
        return response.data;
      });
  } catch (error) {
    logger.error(error);
    throw error;
  }
}
const siteService = {
  postSiteById,
  postSitesSearch,
  retrieveSiteDesignDetails,
  saveSiteDetails,
  retrieveSiteList,
  retrieveSiteDesignVersionDetails,
  retrieveSiteDesignDetailsWithDesignData,
  getAuroraSiteJsonFile,
  updateBuildingAttributes,
  saveDesignCertification
};

export default siteService;
