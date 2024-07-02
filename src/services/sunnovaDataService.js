import axios from "../helpers/bearerAxios";
import {useViewerStore} from "../store/store";
import { logger } from "./loggingService";

export const getSunnovaData = () => {

    const activeModule = useViewerStore.getState().activeModule;
    const roofInfoArr = useViewerStore.getState().roofInfoArr;
    const address = useViewerStore.getState().siteAddress;

    const wattage = activeModule?.power || 0;
    const [Street, City, StateCode] = address.split(',');

    const designArray = []


    roofInfoArr.forEach((roof) => {

        if (roof.modules === "" || roof.modules === 0) return

        designArray.push(
            {
                Design_Array_Ctr_Num: `R${roof.roofNum}`,
                Module_Manufacturer_SF_ID: activeModule.text.split('-')[0].trim(),
                Module_Model_TS_SF_Id: activeModule.text.substring(activeModule.text.indexOf('-') + 1).trim(),
                Module_Wattage: wattage,
                Module_Qty: roof.modules,
                Array_Size: Number(roof.arraySize),
                Tilt: roof.pitch,
                Azimuth: roof.azimuth,
                Shading_coefficient: Number(roof.solarAccess)
            })

    })



    return {
        User_Key: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        Opportunity_SalesForce_ID: sessionStorage.getItem('SalesForceId'),
        Latitude: JSON.parse(sessionStorage.getItem('sitejson'))?.origin?.latitude,
        Longitude: JSON.parse(sessionStorage.getItem('sitejson'))?.origin?.longitude,
        Installation_Street: City ? Street : Street.replace(" "+sessionStorage.getItem('city'), "").replace(" "+sessionStorage.getItem('stateCode'), ""),
        Installation_City: City ? City : sessionStorage.getItem('city'),
        Installation_State: StateCode ? StateCode : sessionStorage.getItem('stateCode'),
        Installation_Zip: sessionStorage.getItem('postalCode'),
        Design_Array: designArray,
    };
};

export const getSunnovaEstimate = () => {
    const payload = getSunnovaData();
    console.log('Sunnova Data: ', payload);

    try {
        return axios
          .post(process.env.REACT_APP_SUNNOVA_PRODN_ESTIMATE_API, payload)
          .then((response) => {
            console.log('Sunnova response:', response.data);
            return response.data;
          })
          .catch((error) => {
            throw error;
          });
      } catch (e) {
        logger.error(e);
        throw e;
      }
}
