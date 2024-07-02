import React, { useState, useEffect, useContext } from "react";
import { useLocation } from "react-router-dom";
import { Flex, Button } from "antd";
import BuildingProperties from "./BuildingProperties";
import RoofsPropperties from "./RoofsProperties";
import { UserContext } from "../../../contexts/UserContext";
import { useViewerStore } from "../../../store/store";
import { FiInbox } from "react-icons/fi";
import siteService from "../../../services/siteService";
import { ThemeContext } from "../../../contexts/ThemeContext";
import { message } from "antd";
import { Scrollbars } from "react-custom-scrollbars-2";
import { logger } from "../../../services/loggingService";

const BuilderAtributesTab = () => {
  const { pathname } = useLocation();
  const { theme } = useContext(ThemeContext);
  const [messageApi, contextHolder] = message.useMessage();
  const { siteDesignDetails, buildingListData, isResetEdata } = useViewerStore(
    (state) => state
  );
  const [selectedBuilding, setSelectedBuilding] = useState(undefined);
  const [selectedBuildingIndex, setSelectedBuildingIndex] = useState(-1);
  const [designData, setDesignData] = useState([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const { user, hasCapability } = useContext(UserContext);
  const [readOnly, setReadonly] = useState(false);
  const [dataLoader, setDataLoader] = useState(true);
  const opId = sessionStorage.getItem("SalesForceId");

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

  const handleDesignGetApi = async () => {
    const response = await siteService.retrieveSiteDesignDetails(opId);
    if (response.length > 0 && response[0].hasOwnProperty("OpportunityID")) {
      setDesignData(response);
      setSelectedBuilding(response[0]?.Design[0].Buildings[0]);
      setSelectedBuildingIndex(0);
      useViewerStore.setState({
        buildingListData: response[0]?.Design[0].Buildings,
      });
    }
    setDataLoader(false);
  };

  useEffect(() => {
    setDataLoader(true);
    handleDesignGetApi();
  }, [pathname, siteDesignDetails]);

  useEffect(() => {
    if (isResetEdata) {
      setDataLoader(true);
      handleDesignGetApi();
      useViewerStore.setState({
        isResetEdata: false,
        isRoofChange: false,
      });
    }
  }, [isResetEdata]);

  useEffect(() => {
    if (user?.user_Id) {
      setReadonly(!hasCapability("Edit_Building_Attributes"));
    }
  }, [user]);

  const selectBuilding = (item, index) => {
    if (index !== selectedBuildingIndex) {
      let newDesignData = designData;
      newDesignData[0].Design[0].Buildings[selectedBuildingIndex] =
        selectedBuilding;
      setDesignData(newDesignData);
      setSelectedBuilding(item);
      setSelectedBuildingIndex(index);
    }
  };
  const saveBuildingData = () => {
    setSaveLoading(true);
    let newDesignData = designData;
    newDesignData[0].Design[0].Buildings[selectedBuildingIndex] =
      selectedBuilding;
    const mappedData = {
      site_Id: newDesignData[0].SiteID,
      design_Id: newDesignData[0].Design[0].DesignID,
      buildingDesign: [],
    };

    // Iterate through buildings
    newDesignData[0].Design[0].Buildings.forEach((building) => {
      const buildingInfo = {
        id: building.Id,
        attic_Access_Id: building.Attic_Access_Id,
        why_No_Attic_Access_Id: building.Why_No_Attic_Access_Id,
        attic_Access_Notes: building.Attic_Access_Notes,
        layers_of_Shingles_Id: building.Layers_of_Shingles_Id,
        all_Roof_The_Same: building.All_Roof_The_Same,
        roofDesign: [],
      };

      // Iterate through roofs
      building.Roofs.forEach((roof) => {
        const roofInfo = {
          id: roof.Id,
          rafter_Size: roof.Rafter_Size,
          roof_Type_Id: roof.Roof_Type_Id,
          max_Span: roof.Max_Span,
          notes: roof.Notes,
          rafter_Space_Id: roof.Rafter_Space_Id,
          structure_Type_Id: roof.Structure_Type_Id,
          roof_Condition_Id: roof.Roof_Condition_Id,
          active_Ind: roof.Active_Ind,
          questionable_Roof: roof.Questionable_Roof,
          questionable_Roof_Id: roof.Questionable_Roof_Id,
          include_In_Letter: roof.Include_In_Letter,
          psF_Id: roof.PSF_Id,
          dead_Load_Id: roof.Dead_Load_Id,
        };

        buildingInfo.roofDesign.push(roofInfo);
      });

      mappedData.buildingDesign.push(buildingInfo);
    });

    try {
      siteService
        .updateBuildingAttributes(mappedData)
        .then(async (response) => {
          //useViewerStore.setState({ siteDesignDetails: newDesignData });
          useViewerStore.setState({siteBuildingData:newDesignData[0].Design[0].Buildings})
          useViewerStore.setState({ isRoofChange: false });
          setSaveLoading(false);
          alertMessage("success", "The building data updated successfully");
        })
        .catch((error) => {
          setSaveLoading(false);
          alertMessage("error", "Error while updating building data");
          logger.error(error);
        });
    } catch (e) {
      setSaveLoading(false);
      alertMessage("error", "Error while updating building data");
    }
  };

  useEffect(() => {
    if (selectedBuildingIndex > -1) {
      let newBlData = buildingListData;
      newBlData[selectedBuildingIndex] = selectedBuilding;
      useViewerStore.setState({ buildingListData: newBlData });
    }
  }, [selectedBuilding]);

  return (
    <>
      {contextHolder}
      {designData.length > 0 && selectedBuilding ? (
        <div className="tab__inner">
          <div className="tab__title">
            <span className="tab__title--text">Building Attributes</span>
          </div>
          <div
            className="tab__column"
            style={{ paddingTop: "10px", paddingBottom: "0px" }}
          >
            <Scrollbars
              style={{ width: "100%", height: "50px" }}
              renderThumbHorizontal={(props) => (
                <div {...props} className="thumb-horizontal" />
              )}
              renderThumbVertical={(props) => (
                <div {...props} className="thumb-vertical" />
              )}
            >
              <Flex align="center" gap={15}>
                {designData.length > 0 &&
                  designData[0].Design[0].Buildings.map((item, index) => (
                    <Button
                      id="buildingSwitchBtn"
                      type={
                        selectedBuilding && selectedBuilding.Id === item.Id
                          ? "primary"
                          : "default"
                      }
                      size="middle"
                      // className="active"
                      onClick={() => selectBuilding(item, index)}
                      key={index}
                      // disabled={selectedBuilding.Id === item.Id}
                    >
                      Building {index + 1}
                    </Button>
                  ))}
              </Flex>
            </Scrollbars>
          </div>

          <BuildingProperties
            selectedBuilding={selectedBuilding}
            setSelectedBuilding={setSelectedBuilding}
            readOnly={readOnly}
          />
          <RoofsPropperties
            selectedBuilding={selectedBuilding}
            setSelectedBuilding={setSelectedBuilding}
            readOnly={readOnly}
          />
          {(hasCapability("Edit_Building_Attributes") ||
            hasCapability("Toggle_Engg_Letter")) && (
            <div className="tab__column obst-edit-mask">
              <Button
                id="buildingSwitchBtn"
                type="primary"
                size="middle"
                className="active"
                block
                onClick={() => saveBuildingData()}
                loading={saveLoading}
              >
                Save
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="empty_tab">
          {dataLoader ? (
            <>
              <span className="loader-icon-spinner"></span>
              <p className={"theme-based-text-color"}>
                Fetching Building data.....
              </p>
            </>
          ) : (
            <>
              <FiInbox
                size={50}
                color={theme === "dark" ? "#ffffff" : "#000000"}
              />
              <br />
              <p className={"theme-based-text-color"}>
                The Roof and Building Data isn't available for this customer.
                Please finalize the site to generate the data.
              </p>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default BuilderAtributesTab;
