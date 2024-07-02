import React, { useEffect, useState, useContext } from "react";
import { RiDownload2Line } from "react-icons/ri";
import { RiArrowGoForwardFill } from "react-icons/ri";
import { FiInbox } from "react-icons/fi";
import { useLocation } from "react-router-dom";
import EngineeringLetter from "./EngineeringLetter";
import EngineeringAffidavit from "./EngineeringAffidavit";
import Helptext from "./HelpText";
import { message } from "antd";
import EngineeringConfirm from "../../../components/Modal/Modal-Content/EngineeringConfirm";
import EngineeringLoader from "../../../components/Modal/Modal-Content/EngineeringLoader";
import { ViewerContext } from "../../../contexts/ViewerContext";
import {
  getEngineeringData,
  downloadEngineeringData,
} from "../../../services/engineeringService";
import { useViewerStore } from "../../../store/store";
import { ThemeContext } from "../../../contexts/ThemeContext";
import { MessageAlert } from "../../../components";
import { logger } from "../../../services/loggingService";
import updateImage from '../../../assets/img/icons/update-icon.png';

const EngineeringSection = () => {
  const { pathname } = useLocation();
  const {
    isRoofChange,
    isEngineeringFieldsChange,
    isRefreshDone,
    buildingListData,
    masterDataList,
    siteBuildingData,
    siteDesignDetails
  } = useViewerStore((state) => state);
  const [messageApi, contextHolder] = message.useMessage();
  const [type, setType] = useState("");
  const { theme } = useContext(ThemeContext);
  const { SceneViewer } = useContext(ViewerContext);
  const [engData, setEngData] = useState(undefined);
  const [dataloader, setDataloader] = useState(true);
  const [errorMessages, setErrorMessages] = useState([]);
  const [isErrorMessage, setIsErrorMessage] = useState(false);
  const setEngineeringLoader = useViewerStore(
    (state) => state.setEngineeringLoader
  );
  const alertMessage = (type, content) => {
    messageApi.open({
      //type:type,
      content: content,
      className:
        type === "error"
          ? "alertError"
          : type === "success"
          ? "alertSuccess"
          : "",
    });
  };

  const getLabelForValue = (value) => {
    for (let i = 0; i < masterDataList.RafterSpace.length; i++) {
      if (masterDataList.RafterSpace[i].value === value) {
        return masterDataList.RafterSpace[i].label;
      }
    }
    return null; // If value is not found
  };

const getRoofList = () =>{
  let newRoofListArray = []
  siteBuildingData.forEach((building) => {
    building.Roofs.forEach((roof) => {
      if (roof.Number_of_Modules > 0) {
        const mappedRoof = {
          Include_In_Letter: roof.Include_In_Letter,
          Id: roof.Id,
          building_Name: "",
          name: "",
          structure_Type_Name: "",
          rafter_Size: "",
          rafter_Space: 0,
          max_Span: 0,
          psf: 0,
          dead_Load: 0,
        };
        newRoofListArray.push(mappedRoof);
      }
    });
  });

  return newRoofListArray
}
  const opId = sessionStorage.getItem("SalesForceId");
  const payLoad = {
    opportunity_ID: opId,
    account_ID: "",
    township_Account_ID: "",
    opportunity_Product_Category: "Solar",
    system_Size: 0,
    snow_Load: 0,
    snow_Load_Per: "",
    structure_Type: "",
    exposure_Category: "",
    wind_Criteria: 0,
    state_Code: "",
    modifications_Needed: "N",
    code_Override: "N",
    mounting_Bracket_Override: "",
    opportunity_Territory: "",
    installation_Type: "",
    roof_Loading_Override: "Y",
    title_Name: "",
    account_Billing_Street: "",
    account_Billing_City: "",
    account_Billing_State: "",
    account_Billing_PostalCode: "",
    customer_No: "",
    oneDRAW_Button: type === "engineering-letter" ? "EL" : "FEA",
    roof_List: getRoofList(),
    code: "",
    special_Structural_Notes: "",
    roof_Framing_Preview: "",
    roof_Loading_Preview: "",
    modifications_Preview: "",
    file_Name: "",
    code_Preview: "",
    mounting_Brackets_Preview: "",
    feA_Preview: "",
    code_Dropdown_Values: [],
    mounting_Bracket_Dropdown_Values: [],
    structure_Type_Dropdown_Values: [],
    dead_Load_Dropdown_Values: [],
    psF_Dropdown_Values: [],
    snow_Load_Per_Dropdown_Values: [],
    snow_Load_Dropdown_Values: [],
    wind_Criteria_Dropdown_Values: [],
    exposure_Category_Dropdown_Values: [],
    pdfOutputData: [
      {
        townshipName: "",
        townshipStreet: "",
        townshipAddress: "",
        titleName: "",
        billingStreet: "",
        billingAddress: "",
        content: "",
        stamp: "",
        footerContent: "",
        currentDate: "",
        customerNo: "",
        licenseNo: "",
        FileName: "",
      },
    ],
  };

  useEffect(() => {
    setDataloader(true);
    setEngData(undefined);
    useViewerStore.setState({
      isEngineeringFieldsChange: false,
      isRefreshDone: false,
      isRoofChange: false,
    });
    if (pathname.includes("engineering-letter")) {
      setType("engineering-letter");
    } else if (pathname.includes("engineering-affidavit")) {
      setType("engineering-affidavit");
    }
  }, [pathname]);

  useEffect(() => {
    if (type !== "") {
      setDataloader(true);
      getEngineeringDataHandler();
    }
  }, [type,siteDesignDetails]);

  const getEngineeringDataHandler = async () => {
    try {
      await getEngineeringData(payLoad, "Initial")
        .then((data) => {
          if (data.hasOwnProperty("Opportunity_ID")) {
            setEngData(data);
          } else {
            setIsErrorMessage(true);
          }
          setDataloader(false);
        })
        .catch((error) => {
          logger.error(error, "err");
          setDataloader(false);
        });
    } catch (error) {
      logger.error(error);
      setDataloader(false);
      // setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isErrorMessage) {
      SceneViewer.viewerAlert({
        show: true,
      })
    }
  }, [isErrorMessage]);

  const handlePayload = () => {
    let modified_payload = {
      opportunity_ID: opId,
      account_ID: engData?.Account_ID,
      township_Account_ID: engData?.Township_Account_ID,
      opportunity_Product_Category: "Solar",
      system_Size: engData?.System_Size,
      snow_Load: engData?.Snow_Load,
      snow_Load_Per: engData?.Snow_Load_Per,
      structure_Type: engData?.Structure_Type,
      exposure_Category: engData?.Exposure_Category,
      wind_Criteria: engData?.Wind_Criteria,
      state_Code: engData?.State_Code,
      modifications_Needed: engData?.Modifications_Needed,
      code_Override: engData?.Code_Override,
      mounting_Bracket_Override: engData?.Mounting_Bracket_Override,
      opportunity_Territory: engData?.Opportunity_Territory,
      installation_Type: engData?.Installation_Type,
      roof_Loading_Override: engData?.Roof_Loading_Override,
      title_Name: engData?.Title_Name,
      account_Billing_Street: engData?.Account_Billing_Street,
      account_Billing_City: engData?.Account_Billing_City,
      account_Billing_State: engData?.Account_Billing_State,
      account_Billing_PostalCode: engData?.Account_Billing_PostalCode,
      customer_No: engData?.Customer_No,
      oneDRAW_Button: type === "engineering-letter" ? "EL" : "FEA",
      roof_List: engData?.Roof_List,
      code: engData?.Code,
      special_Structural_Notes: engData?.Special_Structural_Notes,
      roof_Framing_Preview: engData?.Roof_Framing_Preview,
      roof_Loading_Preview: engData?.Roof_Loading_Preview,
      modifications_Preview: engData?.Modifications_Preview,
      file_Name: engData?.File_Name,
      code_Preview: engData?.Code_Preview,
      mounting_Brackets_Preview: engData?.Mounting_Brackets_Preview,
      feA_Preview: engData?.FEA_Preview,
      code_Dropdown_Values: engData?.Code_Dropdown_Values,
      mounting_Bracket_Dropdown_Values:
        engData?.Mounting_Bracket_Dropdown_Values,
      structure_Type_Dropdown_Values: engData?.Structure_Type_Dropdown_Values,
      dead_Load_Dropdown_Values: engData?.Dead_Load_Dropdown_Values,
      psF_Dropdown_Values: engData?.PSF_Dropdown_Values,
      snow_Load_Per_Dropdown_Values: engData?.Snow_Load_Per_Dropdown_Values,
      snow_Load_Dropdown_Values: engData?.Snow_Load_Dropdown_Values,
      wind_Criteria_Dropdown_Values: engData?.Wind_Criteria_Dropdown_Values,
      exposure_Category_Dropdown_Values:
        engData?.Exposure_Category_Dropdown_Values,
      pdfOutputData: engData?.PDFOutputData,
    };

    return modified_payload;
  };

  const handleEngineeringActions = async (type, action) => {
    let error = false;
    const newRoofListArray = [];
    if (action === "Refresh" || action === "Download") {
      if (type === "engineering-letter") {
        if (
          engData?.Exposure_Category === "" ||
          engData?.Exposure_Category === "0"
        ) {
          error = true;
          errorMessages.push("Exposure Category");
        }
        if (engData?.Wind_Criteria === 0) {
          error = true;
          errorMessages.push("Wind Criteria");
        }

        if (engData?.Snow_Load === 0) {
          error = true;
          errorMessages.push("Snow Load");
        }
        if (engData?.Snow_Load_Per === "") {
          error = true;
          errorMessages.push("Snow Load Per");
        }
        if (engData?.Code === "") {
          error = true;
          errorMessages.push("Code");
        }
        if (engData?.Mounting_Bracket_Override === "") {
          error = true;
          errorMessages.push("Mounting Bracket Override");
        }
      } else {
        if (engData?.Code === "") {
          error = true;
          errorMessages.push("Code");
        }
      }
    }
    if (error) {
      handleRequiredError(action);
    } else {
      if (action === "Refresh" || action === "Download") {
        buildingListData.forEach((building) => {
          building.Roofs.forEach((roof) => {
            if (roof.Number_of_Modules > 0) {
              const mappedRoof = {
                Include_In_Letter: roof.Include_In_Letter,
                Id: roof.Id,
                Building_Name: building.Building_Name,
                Name: roof.Name,
                Structure_Type_Name: roof.Structure_Type_Id
                  ? roof.Structure_Type_Id === 4
                    ? "Other"
                    : engData.Structure_Type_Dropdown_Values[
                        roof.Structure_Type_Id - 1
                      ]
                  : "",
                Rafter_Size: roof.Rafter_Size ? roof.Rafter_Size : "0",
                Rafter_Space: roof.Rafter_Space_Id
                  ? Number(getLabelForValue(roof.Rafter_Space_Id))
                  : 0,
                Max_Span: roof.Max_Span,
                PSF: roof.PSF_Id
                  ? Number(engData.PSF_Dropdown_Values[roof.PSF_Id - 1])
                  : null,
                Dead_Load: roof.Dead_Load_Id
                  ? Number(
                      engData.Dead_Load_Dropdown_Values[roof.Dead_Load_Id - 1]
                    )
                  : null,
              };
              newRoofListArray.push(mappedRoof);
            }
          });
        });
        engData.Roof_List = newRoofListArray;
      }
      /***** Added when we dont require confirmation prompt***** */

      setEngineeringLoader(true);
      let confirmTitle =
        action === "Refresh"
          ? "Updating the "
          : action === "Reset"
          ? "Reset the "
          : "Download the ";
      confirmTitle +=
        type === "engineering-letter"
          ? "Engineering letter"
          : "Final Engineering Affidavit";

      if (
        action === "Download" &&
        (isRoofChange || (!isRefreshDone && isEngineeringFieldsChange))
      ) {
        SceneViewer.viewerAlert({
          show: true,
          title: confirmTitle,
          message: (
            <EngineeringConfirm
              title={confirmTitle}
              type={type}
              action={action}
              actionHandler={actionHandler}
            />
          ),
          messageType: "success",
          isModal: true,
        });
      } else {
        let errormessage = "";
        if (action === "Refresh" || action === "Download") {
          let otherStructureArr = newRoofListArray.filter(
            (rf) => rf.Structure_Type_Name === "Other"
          );
          if (otherStructureArr.length > 0) {
            errormessage =
              'Please update the Structure Type on the Roofs, excluding the "Other" option';
          }
        }
        if (errormessage !== "") {
          alertMessage("error", errormessage);
        } else {
          useViewerStore.setState({ isSavingInProgress: true });
          SceneViewer.viewerAlert({
            show: true,
            title: confirmTitle,
            message: <EngineeringLoader title={confirmTitle} action={action} />,
            messageType: "success",
            isModal: true,
          });
          await actionHandler(action);
        }
      }
    }
  };

  const handleRequiredError = (action) => {
    alertMessage(
      "error",
      `Please select ${errorMessages.join(
        errorMessages.length > 2 ? ", " : " and "
      )} before ${action}`
    );
    setErrorMessages([]);
  };

  const actionHandler = async (action) => {
    if (action === "Download") {
      //Filestream
      let modified_payload = handlePayload();
      modified_payload.pdfOutputData = [];
      await downloadEngineeringData(modified_payload, action)
        .then((response) => {
          if (response.status === 200) {
            /***********Download the file ***********/
            useViewerStore.setState({
              isEngineeringFieldsChange: false,
              isRoofChange: false,
              isRefreshDone: false,
            });

            const fileName = modified_payload["file_Name"] + ".pdf";
            const blob = new Blob([response.data], {
              type: response.headers["content-type"],
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            setEngineeringLoader(false);
            SceneViewer.viewerAlert({ show: false });
            useViewerStore.setState({ isSavingInProgress: false });
          } else {
            SceneViewer.viewerAlert({ show: false });
            useViewerStore.setState({ isSavingInProgress: false });
            alertMessage("error", "Error while downloading the file");
          }
        })
        .catch((error) => {
          logger.error(error);
          SceneViewer.viewerAlert({ show: false });
          useViewerStore.setState({ isSavingInProgress: false });
          alertMessage("error", "Error while downloading the file");
        });
    } else {
      let modified_payload = action === "Reset" ? payLoad : handlePayload();
      await getEngineeringData(modified_payload, action)
        .then((response) => {
          setEngineeringLoader(false);
          SceneViewer.viewerAlert({ show: false });
          useViewerStore.setState({ isSavingInProgress: false });
          if (response.hasOwnProperty("Opportunity_ID")) {
            setEngData(response);

            let actionText = action === "Reset" ? "resetted" : "updated";

            let content = `The ${
              type === "engineering-letter"
                ? "Engineering Letter data has been"
                : "Final Engineering Affidavit data has been"
            } ${actionText} successfully`;
            alertMessage("success", content);
            if (!isRefreshDone && action === "Refresh") {
              useViewerStore.setState({
                isRefreshDone: true,
                isEngineeringFieldsChange: false,
              });
            }
            if (action === "Reset") {
              useViewerStore.setState({
                isRefreshDone: false,
                isEngineeringFieldsChange: false,
                isResetEdata: true,
              });
            }
          } else {
            alertMessage("error", "Something went wrong. Please try later.");
          }
        })
        .catch((error) => {
          logger.error(error);
          alertMessage("error", "Something went wrong. Please try later.");
        });
    }
  };

  return (
    <>
      {contextHolder}
      {!dataloader && engData ? (
        <div className="tab__inner">
          <div className="tab__title">
            <span className="tab__title--text multi_tab_title">
              <Helptext
                tooltipkey={
                  type === "engineering-letter" ? "engl-title" : "enga-title"
                }
              />
              <span>
                {type === "engineering-letter"
                  ? "Engineering Letter"
                  : "Final Engineering Affidavit"}
              </span>
              <RiDownload2Line
                onClick={() => handleEngineeringActions(type, "Download")}
                size={20}
                color="#69b1ff"
                title="Download"
              />
              {(isEngineeringFieldsChange || isRoofChange) &&
                !isRefreshDone && (

                    <img title="Update"  onClick={() => handleEngineeringActions(type, "Refresh")} src={updateImage}  className='updateIcon'  id='updateEle' alt={"Updating"} />

                )}

              {isRefreshDone && (
                <span style={{ transform: "rotate(180deg)" }}>
                  {" "}
                  <RiArrowGoForwardFill
                    size={20}
                    color="red"
                    onClick={() => handleEngineeringActions(type, "Reset")}
                    title="Reset"
                  />{" "}
                </span>
              )}
            </span>
          </div>
          {type === "engineering-letter" ? (
            <EngineeringLetter data={engData} setData={setEngData} />
          ) : (
            <EngineeringAffidavit data={engData} setData={setEngData} />
          )}
        </div>
      ) : (
        <>
          {dataloader ? (
            <div className="tab_loader">
              <span className="loader-icon-spinner"></span>{" "}
              <p className={"theme-based-text-color"}>
                {`Fetching ${
                  type === "engineering-letter"
                    ? "Engineering Letter"
                    : "Final Engineering Affidavit"
                } Data.....`}
              </p>
            </div>
          ) : (
            <>
              {isErrorMessage && (
                <MessageAlert
                  message="The Roof and Building Data isn't available for this customer. Please reach out to the Structural Team to complete their review."
                  messageType="error"
                  setState={setIsErrorMessage}
                />
              )}
              <div className="empty_tab">
                <FiInbox
                  size={50}
                  color={theme === "dark" ? "#ffffff" : "#000000"}
                />
                <br />
                <p className={"theme-based-text-color"}>
                  The Roof and Building Data isn't available for this customer.
                  Please reach out to the Structural Team to complete their
                  review.
                </p>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
};

export default EngineeringSection;
