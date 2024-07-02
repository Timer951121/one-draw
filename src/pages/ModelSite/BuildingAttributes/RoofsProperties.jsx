import React, { useContext, useState, useEffect } from "react";
import { Flex, Input, Select } from "antd";
import { FaRegCheckCircle } from "react-icons/fa";
import { ViewerContext } from "../../../contexts/ViewerContext";
import { UserContext } from "../../../contexts/UserContext";
import SetQuestionableRoof from "./SetQuestionableRoof";
import { useViewerStore } from "../../../store/store";
import { Toggle } from "../../../components";

const { Option } = Select;

const RoofsPropperties = ({
  selectedBuilding,
  setSelectedBuilding,
  readOnly,
}) => {
  const { SceneViewer } = useContext(ViewerContext);
  const { user, hasCapability } = useContext(UserContext);
  const masterDataList = useViewerStore.getState().masterDataList;
  const { isRoofChange, isEngineeringFieldsChange, isRefreshDone } =
    useViewerStore((state) => state);
  const [msftoptions] = useState([
    5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  ]);
  const [msinoptions] = useState([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);

  const qfoptions = [
    { value: true, label: "Yes" },
    { value: false, label: "No" },
  ];

  const handleRafterSize = (value, index) => {
    let updateSelBuildingData = {
      ...selectedBuilding,
    };
    updateSelBuildingData.Roofs[index].Rafter_Size = String(value);
    setSelectedBuilding(updateSelBuildingData);
    useViewerStore.setState({
      isRoofChange: true,
      isEngineeringFieldsChange: true,
      isRefreshDone: false,
    });
  };
  function metersToFeetAndInches(meters) {
    const feet = meters * 3.28084;
    const wholeFeet = Math.floor(feet);
    const remainingInches = (feet - wholeFeet) * 12;
    let roundedInches = Math.round(remainingInches);
    let adjustedFeet = wholeFeet;
    if (roundedInches === 12) {
      adjustedFeet += 1;
      roundedInches = 0;
    }

    return {
      feet: adjustedFeet,
      inches: roundedInches,
    };
  }
  function feetAndInchesToMeters(feet, inches) {
    const metersFromFeet = feet / 3.28084;
    const metersFromInches = inches * 0.0254;
    const meters = metersFromFeet + metersFromInches;
    return meters;
  }

  const handleMaxSpan = (value, index, unit) => {
    let updateSelBuildingData = {
      ...selectedBuilding,
    };
    let ms_value;
    let { feet, inches } = metersToFeetAndInches(
      updateSelBuildingData.Roofs[index].Max_Span
    );
    if (unit === "ft") {
      ms_value = feetAndInchesToMeters(Number(value), inches);
    }
    if (unit === "in") {
      ms_value = feetAndInchesToMeters(feet, Number(value));
    }
    updateSelBuildingData.Roofs[index].Max_Span = ms_value
      ? Number(Math.round((ms_value + Number.EPSILON) * 100) / 100)
      : 0;
    setSelectedBuilding(updateSelBuildingData);
    useViewerStore.setState({
      isRoofChange: true,
      isEngineeringFieldsChange: true,
      isRefreshDone: false,
    });
  };
  const handleRoofType = (value, index) => {
    let updateSelBuildingData = {
      ...selectedBuilding,
    };
    updateSelBuildingData.Roofs[index].Roof_Type_Id = value;
    setSelectedBuilding(updateSelBuildingData);
  };

  const handleRafterSpacing = (value, index) => {
    let updateSelBuildingData = {
      ...selectedBuilding,
    };
    updateSelBuildingData.Roofs[index].Rafter_Space_Id = value;
    setSelectedBuilding(updateSelBuildingData);
    useViewerStore.setState({
      isRoofChange: true,
      isEngineeringFieldsChange: true,
      isRefreshDone: false,
    });
  };

  const handleStructureType = (value, index) => {
    let updateSelBuildingData = {
      ...selectedBuilding,
    };
    updateSelBuildingData.Roofs[index].Structure_Type_Id = value;
    setSelectedBuilding(updateSelBuildingData);
    useViewerStore.setState({
      isRoofChange: true,
      isEngineeringFieldsChange: true,
      isRefreshDone: false,
    });
  };

  const handleRoofCondition = (value, index) => {
    let updateSelBuildingData = {
      ...selectedBuilding,
    };
    updateSelBuildingData.Roofs[index].Roof_Condition_Id = value;
    setSelectedBuilding(updateSelBuildingData);
  };

  const handleNotes = (value, index) => {
    let updateSelBuildingData = {
      ...selectedBuilding,
    };
    updateSelBuildingData.Roofs[index].Notes = value;
    setSelectedBuilding(updateSelBuildingData);
  };

  const handleQuestionableRoof = (value, index) => {
    let updateSelBuildingData = {
      ...selectedBuilding,
    };
    updateSelBuildingData.Roofs[index].Questionable_Roof = value;
    setSelectedBuilding(updateSelBuildingData);
    if (value === true) {
      SceneViewer.viewerAlert({
        show: true,
        title: "Set Questionable Roof",
        message: (
          <SetQuestionableRoof
            handleReasonSubmit={handleReasonSubmit}
            selectedRoofIndex={index}
          />
        ),
        messageType: "info",
        isModal: true,
        closeCallback: () => {
          handleModalcallBack(index);
        },
      });
    } else {
      let updateSelBuildingData = {
        ...selectedBuilding,
      };
      updateSelBuildingData.Roofs[index].Questionable_Roof_Id = "";
      setSelectedBuilding(updateSelBuildingData);
    }
  };

  const handleModalcallBack = (index) => {
    if (selectedBuilding.Roofs[index].Questionable_Roof_Id === "") {
      let updateSelBuildingData = {
        ...selectedBuilding,
      };
      updateSelBuildingData.Roofs[index].Questionable_Roof = false;
      setSelectedBuilding(updateSelBuildingData);
    }
  };

  const handleReasonSubmit = (value, index) => {
    let updateSelBuildingData = {
      ...selectedBuilding,
    };
    updateSelBuildingData.Roofs[index].Questionable_Roof_Id = value;
    setSelectedBuilding(updateSelBuildingData);
    SceneViewer.removeViewerAlert()
  };

  const togglIncludeLetter = (value, index) => {
    let updateSelBuildingData = {
      ...selectedBuilding,
    };
    updateSelBuildingData.Roofs[index].Include_In_Letter = value;
    setSelectedBuilding(updateSelBuildingData);
    useViewerStore.setState({
      isRoofChange: true,
      isEngineeringFieldsChange: true,
      isRefreshDone: false,
    });
  };

  const handleDeadLoad = (value, index) => {
    let updateSelBuildingData = {
      ...selectedBuilding,
    };
    updateSelBuildingData.Roofs[index].Dead_Load_Id = value;
    setSelectedBuilding(updateSelBuildingData);
    useViewerStore.setState({
      isRoofChange: true,
      isEngineeringFieldsChange: true,
      isRefreshDone: false,
    });
  };

  const handlePsf = (value, index) => {
    let updateSelBuildingData = {
      ...selectedBuilding,
    };
    updateSelBuildingData.Roofs[index].PSF_Id = value;
    setSelectedBuilding(updateSelBuildingData);
    useViewerStore.setState({
      isRoofChange: true,
      isEngineeringFieldsChange: true,
      isRefreshDone: false,
    });
  };

  return (
    <>
      {selectedBuilding &&
        user &&
        selectedBuilding.Roofs.map((item, index) => (
          <>
            {item.Number_of_Modules > 0 && (
              <div className="tab__column obst-edit-mask" key={index}>
                <span className="tab__column--subtitle">
                  <Flex align="center">
                    {item.Name}
                    {item.Active_Ind && (
                      <FaRegCheckCircle
                        color="green"
                        style={{ marginLeft: 10 }}
                      />
                    )}
                  </Flex>
                </span>

                {hasCapability("Toggle_Engg_Letter") && (
                  <Flex
                    align="center"
                    justify="space-between"
                    className="small_input_flex"
                  >
                    <div>
                      <span className="tab__input--label small_input_label ">
                        Include in Letter:
                      </span>
                    </div>
                    <Toggle
                      on={item.Include_In_Letter}
                      onChange={(value) => togglIncludeLetter(value, index)}
                      size="small"
                      disabled={item.Number_of_Modules < 1}
                    />
                  </Flex>
                )}
                <Flex
                  align="center"
                  justify="space-between"
                  className="small_input_flex"
                >
                  <div>
                    <span className="tab__input--label small_input_label ">
                      Rafter Size(In):
                    </span>
                  </div>
                  <Select
                    value={item.Rafter_Size}
                    onChange={(value) => handleRafterSize(value, index)}
                    className="small-input-feild"
                    disabled={readOnly}
                  >
                    {masterDataList.RafterSize?.map((option) => (
                      <Option key={option.value} value={option.label}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Flex>
                <Flex
                  align="center"
                  justify="space-between"
                  className="small_input_flex"
                >
                  <div>
                    <span className="tab__input--label small_input_label">
                      Max Span (Ft/In):
                    </span>
                  </div>
                  <Flex
                    align="center"
                    justify="space-between"
                    style={{ width: "60%" }}
                    gap={5}
                  >
                    <Select
                      value={metersToFeetAndInches(item.Max_Span).feet}
                      onChange={(value) => handleMaxSpan(value, index, "ft")}
                      className="small-input-feild"
                      disabled={readOnly}
                    >
                      {msftoptions?.map((option) => (
                        <Option key={option} value={option}>
                          {option}
                        </Option>
                      ))}
                    </Select>

                    <span className="tab__input--label small_input_label">
                      Ft
                    </span>
                    <Select
                      value={metersToFeetAndInches(item.Max_Span).inches}
                      onChange={(value) => handleMaxSpan(value, index, "in")}
                      className="small-input-feild"
                      disabled={readOnly}
                    >
                      {msinoptions?.map((option) => (
                        <Option key={option} value={option}>
                          {option}
                        </Option>
                      ))}
                    </Select>
                    <span className="tab__input--label small_input_label">
                      In
                    </span>
                  </Flex>
                </Flex>

                <Flex
                  align="center"
                  justify="space-between"
                  className="small_input_flex"
                >
                  <div>
                    <span className="tab__input--label small_input_label">
                      Roof Type:
                    </span>
                  </div>
                  <Select
                    value={
                      item.Roof_Type_Id
                        ? item.Roof_Type_Id === 1
                          ? ""
                          : item.Roof_Type_Id
                        : ""
                    }
                    onChange={(value) => handleRoofType(value, index)}
                    className="small-input-feild"
                    disabled={readOnly}
                  >
                    {masterDataList.RoofType?.map((option) => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Flex>
                <Flex
                  align="center"
                  justify="space-between"
                  className="small_input_flex"
                >
                  <div>
                    <span className="tab__input--label small_input_label">
                      Rafter Spacing (In):
                    </span>
                  </div>
                  <Select
                    value={item.Rafter_Space_Id}
                    onChange={(value) => handleRafterSpacing(value, index)}
                    className="small-input-feild"
                    disabled={readOnly}
                  >
                    {masterDataList.RafterSpace?.map((option) => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Flex>
                <Flex
                  align="center"
                  justify="space-between"
                  className="small_input_flex"
                >
                  <div>
                    <span className="tab__input--label small_input_label">
                      Structure Type:{" "}
                    </span>
                  </div>
                  <Select
                    value={item.Structure_Type_Id}
                    onChange={(value) => handleStructureType(value, index)}
                    className="small-input-feild"
                    disabled={readOnly}
                  >
                    {masterDataList.StructureType?.map((option) => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Flex>
                <Flex
                  align="center"
                  justify="space-between"
                  className="small_input_flex"
                >
                  <div>
                    <span className="tab__input--label small_input_label">
                      Roof Condition:{" "}
                    </span>
                  </div>
                  <Select
                    value={item.Roof_Condition_Id}
                    onChange={(value) => handleRoofCondition(value, index)}
                    className="small-input-feild"
                    disabled={readOnly}
                  >
                    {masterDataList.RoofCondition?.map((option) => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Flex>
                {hasCapability("Toggle_Engg_Letter") && (
                  <Flex
                    align="center"
                    justify="space-between"
                    className="small_input_flex"
                  >
                    <div>
                      <span className="tab__input--label small_input_label">
                        PSF:
                      </span>
                    </div>
                    <Select
                      value={item.PSF_Id ? item.PSF_Id : ""}
                      onChange={(value) => handlePsf(value, index)}
                      className="small-input-feild"
                      disabled={readOnly}
                    >
                      {masterDataList.PSF?.map((option) => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </Flex>
                )}
                <Flex
                  align="center"
                  justify="space-between"
                  className="small_input_flex"
                >
                  <div>
                    <span className="tab__input--label small_input_label">
                      Notes:
                    </span>
                  </div>
                  <Input.TextArea
                    rows={1}
                    className="small_input_flex small_text_area"
                    value={item.Notes}
                    onChange={(e) => handleNotes(e.target.value, index)}
                    disabled={readOnly}
                    style={{ resize: "none" }}
                    onFocus={() =>
                      useViewerStore.setState({ isModalOpenInInterface: true })
                    }
                    onBlur={() =>
                      useViewerStore.setState({ isModalOpenInInterface: false })
                    }
                  />
                </Flex>
                <Flex
                  align="center"
                  justify="space-between"
                  className="small_input_flex"
                >
                  <div>
                    <span className="tab__input--label small_input_label">
                      Questionable Roof:
                    </span>
                  </div>
                  <Select
                    value={item.Questionable_Roof}
                    onChange={(value) => handleQuestionableRoof(value, index)}
                    className="small-input-feild"
                    disabled={readOnly}
                  >
                    {qfoptions.map((option) => (
                      <Option key={option.key} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Flex>
                {hasCapability("Toggle_Engg_Letter") && (
                  <Flex
                    align="center"
                    justify="space-between"
                    className="small_input_flex"
                  >
                    <div>
                      <span className="tab__input--label small_input_label">
                        Dead Load:
                      </span>
                    </div>
                    <Select
                      value={item.Dead_Load_Id ? item.Dead_Load_Id : ""}
                      onChange={(value) => handleDeadLoad(value, index)}
                      className="small-input-feild"
                      disabled={readOnly}
                    >
                      {masterDataList.DeadLoad?.map((option) => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </Flex>
                )}
              </div>
            )}
          </>
        ))}
    </>
  );
};

export default RoofsPropperties;
