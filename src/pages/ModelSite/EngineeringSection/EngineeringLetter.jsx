import React from "react";
import { Flex, Input, Select, Col, Row } from "antd";
import { Toggle } from "../../../components";
import HelpText from "./HelpText";
import { useViewerStore } from "../../../store/store";

const { Option } = Select;
const EngineeringLetter = ({ data, setData }) => {
  const { isEngineeringFieldsChange } = useViewerStore((state) => state);

  const handleExposureCategory = (value) => {
    let updateEngData = {
      ...data,
    };
    updateEngData.Exposure_Category = String(value);
    setData(updateEngData);
    if (!isEngineeringFieldsChange) {
      useViewerStore.setState({ isEngineeringFieldsChange: true, isRefreshDone:false });
    }
  };
  const handleWindCriteria = (value) => {
    let updateEngData = {
      ...data,
    };
    updateEngData.Wind_Criteria = Number(value);
    setData(updateEngData);
    if (!isEngineeringFieldsChange) {
      useViewerStore.setState({ isEngineeringFieldsChange: true, isRefreshDone:false });
    }
  };
  const handleSnowLoad = (value) => {
    let updateEngData = {
      ...data,
    };
    updateEngData.Snow_Load = Number(value);
    setData(updateEngData);
    if (!isEngineeringFieldsChange) {
      useViewerStore.setState({ isEngineeringFieldsChange: true, isRefreshDone:false });
    }
  };
  const handleSnowLoadPer = (value) => {
    let updateEngData = {
      ...data,
    };
    updateEngData.Snow_Load_Per = String(value);
    setData(updateEngData);
    if (!isEngineeringFieldsChange) {
      useViewerStore.setState({ isEngineeringFieldsChange: true, isRefreshDone:false });
    }
  };
  const toggleOverride = (value) => {
    let updateEngData = {
      ...data,
    };
    updateEngData.Roof_Loading_Override = value?"Y":"N";
    setData(updateEngData);
    if (!isEngineeringFieldsChange) {
      useViewerStore.setState({ isEngineeringFieldsChange: true, isRefreshDone:false });
    }
  };
  const toggleModificationsNeeded = (value) => {
    let updateEngData = {
      ...data,
    };
    updateEngData.Modifications_Needed = value?"Y":"N";
    setData(updateEngData);
    if (!isEngineeringFieldsChange) {
      useViewerStore.setState({ isEngineeringFieldsChange: true, isRefreshDone:false });
    }
  };
  const handleCode = (value) => {
    let updateEngData = {
      ...data,
    };
    updateEngData.Code = String(value);
    setData(updateEngData);
    if (!isEngineeringFieldsChange) {
      useViewerStore.setState({ isEngineeringFieldsChange: true, isRefreshDone:false });
    }
  };
  const handleMountingBracketOverride = (value) => {
    let updateEngData = {
      ...data,
    };
    updateEngData.Mounting_Bracket_Override = String(value);
    setData(updateEngData);
    if (!isEngineeringFieldsChange) {
      useViewerStore.setState({ isEngineeringFieldsChange: true, isRefreshDone:false });
    }
  };
  return (
    <>
      <div className="tab__column">
        <Row gutter={[8, 8]}>
          <Col span={16}>
            <span className="tab__input--label ">
              <HelpText tooltipkey={"eng-structural-notes"} /> Special
              Structural Notes
            </span>

            <Input.TextArea
              id="specialStructuralNotes"
              rows={5}
              className="md-input-text-size"
              value={
                data.Special_Structural_Notes
                  ? data.Special_Structural_Notes
                  : ""
              }
              disabled={true}
              style={{ resize: "none" }}
            />
          </Col>
          <Col span={8}>
            <span className="tab__input--label ">
              <HelpText tooltipkey={"eng-installation-type"} /> Installation
              Type
            </span>

            <Input
              id="installationType"
              className="md-input-text-size"
              value={data.Installation_Type ? data.Installation_Type : ""}
              disabled={true}
            />
          </Col>
        </Row>
      </div>
      <div className="tab__column">
        <span className="tab__input--label ">Wind Criteria</span>
        <Row gutter={[8, 8]} className="mb-1">
          <Col span={6}>
            <span className="tab__input--label small_input_label">
              <HelpText tooltipkey={"eng-exposure-category"} /> Exposure
              Category:
            </span>
            <Select
              value={data?.Exposure_Category}
              onChange={(value) => handleExposureCategory(value)}
              className="md-input-text-size"
              // options={option}
            >
              {data.Exposure_Category_Dropdown_Values &&
                data.Exposure_Category_Dropdown_Values.map((option) => {
                  return (
                    <Option key={option} value={option}>
                      {option}
                    </Option>
                  );
                })}
            </Select>
          </Col>
          <Col span={4}>
            <span className="tab__input--label small_input_label">
              <HelpText tooltipkey={"eng-wind-criteria"} /> Wind Criteria:
            </span>
            <Select
              value={String(data?.Wind_Criteria)}
              onChange={(value) => handleWindCriteria(value)}
              className="md-input-text-size"
            >
              {data.Wind_Criteria_Dropdown_Values &&
                data.Wind_Criteria_Dropdown_Values.map((option) => {
                  return (
                    <Option key={option} value={option}>
                      {option}
                    </Option>
                  );
                })}
            </Select>
          </Col>
          <Col span={4}>
            <span className="tab__input--label small_input_label">
              <HelpText tooltipkey={"eng-snow-load"} /> Snow Load:
            </span>
            <Select
              value={String(data?.Snow_Load)}
              onChange={(value) => handleSnowLoad(value)}
              className="md-input-text-size"
            >
              {data.Snow_Load_Dropdown_Values &&
                data.Snow_Load_Dropdown_Values.map((option) => {
                  return (
                    <Option key={option} value={option}>
                      {option}
                    </Option>
                  );
                })}
            </Select>
          </Col>
          <Col span={10}>
            <span className="tab__input--label small_input_label">
              <HelpText tooltipkey={"eng-snow-load-per"} /> Snow Load Per:
            </span>
            <Select
              value={data.Snow_Load_Per ? data.Snow_Load_Per : ""}
              onChange={(value) => handleSnowLoadPer(value)}
              className="md-input-text-size"
            >
              {data.Snow_Load_Per_Dropdown_Values &&
                data.Snow_Load_Per_Dropdown_Values.map((option) => {
                  return (
                    <Option key={option} value={option}>
                      {option}
                    </Option>
                  );
                })}
            </Select>
          </Col>
        </Row>
        <span className="tab__input--label ">
          <HelpText tooltipkey={"eng-roof-framing"} /> Roof Framing
        </span>
        <Row gutter={[8, 8]} className="mb-1">
          <Col span={6}></Col>
          <Col span={18}>
            <span className="tab__input--label small_input_label">Preview</span>

            <Input.TextArea
              rows={5}
              className="md-input-text-size"
              value={data.Roof_Framing_Preview ? data.Roof_Framing_Preview : ""}
              disabled={true}
              style={{ resize: "none" }}
            />
          </Col>
        </Row>
        <span className="tab__input--label ">
          Roof Loading
        </span>
        <Row gutter={[8, 8]} className="mb-1">
          <Col span={6}>
            <Flex
              align="center"
              className="small_input_flex multi_tab_label_gap"
            >
              <div>
                <span className="tab__input--label small_input_label ">
                <HelpText tooltipkey={"eng-roof-loading-override"} /> Override:
                </span>
              </div>
              <Toggle
                on={data.Roof_Loading_Override==="Y"}
                onChange={(value) => toggleOverride(value)}
                size="small"
              />
            </Flex>
          </Col>
          <Col span={18}>
            <span className="tab__input--label small_input_label">Preview</span>

            <Input.TextArea
              rows={6}
              className="md-input-text-size"
              value={data.Roof_Loading_Preview ? data.Roof_Loading_Preview : ""}
              disabled={true}
              style={{ resize: "none" }}
            />
          </Col>
        </Row>
      </div>
      <div className="tab__column">
        <span className="tab__input--label ">
          Modifications
        </span>
        <Row gutter={[8, 8]} className="mb-1">
          <Col span={6}>
            <Flex
              align="center"
              className="small_input_flex multi_tab_label_gap"
            >
              <div>
                <span
                  className="tab__input--label small_input_label "
                  style={{ width: "80px" }}
                >
                 <HelpText tooltipkey={"eng-modifications-needed"} />  Modifications Needed?
                </span>
              </div>
              <Toggle
                on={data.Modifications_Needed==="Y"}
                onChange={(value) => toggleModificationsNeeded(value)}
                size="small"
              />
            </Flex>
          </Col>
          <Col span={18}>
            <span className="tab__input--label small_input_label">Preview</span>

            <Input.TextArea
              rows={6}
              className="md-input-text-size"
              value={
                data.Modifications_Preview ? data.Modifications_Preview : ""
              }
              disabled={true}
              style={{ resize: "none" }}
            />
          </Col>
        </Row>
      </div>
      <div className="tab__column">
        <span className="tab__input--label ">Building Code</span>
        <Row gutter={[8, 8]} className="mb-1">
          <Col span={6}>
            <div className="multi_tab_select_gap">
              <div>
                <span className="tab__input--label small_input_label ">
                  <HelpText tooltipkey={"eng-code"} /> Code:
                </span>
              </div>
              <Select
                value={data.Code ? data.Code : ""}
                onChange={(value) => handleCode(value)}
                className="md-input-text-size"
              >
                {data.Code_Dropdown_Values &&
                  data.Code_Dropdown_Values.map((option) => {
                    return (
                      <Option key={option} value={option}>
                        {option}
                      </Option>
                    );
                  })}
              </Select>
            </div>
          </Col>
          <Col span={18}>
            <span className="tab__input--label small_input_label">Preview</span>

            <Input.TextArea
              rows={6}
              className="md-input-text-size"
              value={data.Code_Preview ? data.Code_Preview : ""}
              disabled={true}
              style={{ resize: "none" }}
            />
          </Col>
        </Row>
      </div>
      <div className="tab__column">
        <span className="tab__input--label ">Mounting Brackets</span>
        <Row gutter={[8, 8]} className="mb-1">
          <Col span={6}>
            <div className="multi_tab_select_gap">
              <div>
                <span className="tab__input--label small_input_label ">
                  <HelpText tooltipkey={"eng-code"} /> Mounting Bracket
                  Override:
                </span>
              </div>
              <Select
                value={
                  data.Mounting_Bracket_Override
                    ? data.Mounting_Bracket_Override
                    : ""
                }
                onChange={(value) => handleMountingBracketOverride(value)}
                className="md-input-text-size"
              >
                {data.Mounting_Bracket_Dropdown_Values &&
                  data.Mounting_Bracket_Dropdown_Values.map((option) => {
                    return (
                      <Option key={option} value={option}>
                        {option}
                      </Option>
                    );
                  })}
              </Select>
            </div>
          </Col>
          <Col span={18}>
            <span className="tab__input--label small_input_label">Preview</span>

            <Input.TextArea
              rows={6}
              className="md-input-text-size"
              value={
                data.Mounting_Brackets_Preview
                  ? data.Mounting_Brackets_Preview
                  : ""
              }
              disabled={true}
              style={{ resize: "none" }}
            />
          </Col>
        </Row>
      </div>
    </>
  );
};

export default EngineeringLetter;
