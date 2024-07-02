import React from "react";
import { Col, Row, Input, Select } from "antd";
import HelpText from "./HelpText";
import { useViewerStore } from "../../../store/store";

const EngineeringAffidavit = ({ data, setData }) => {
  const { isEngineeringFieldsChange } = useViewerStore((state) => state);

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
  const { Option } = Select;
  const affidavitCodes = data?.Code_Dropdown_Values
    ? data?.Code_Dropdown_Values
    : [];

  return (
    <>
      <div className="tab__column">
        <Row gutter={[8, 8]}>
          <Col span={16}>
            <span className="tab__input--label ">
              <HelpText tooltipkey={"affid-structural-notes"} /> Special
              Structural Notes
            </span>

            <Input.TextArea
              rows={6}
              value={data?.Special_Structural_Notes}
              disabled={true}
              style={{ resize: "none", fontSize: "12px" }}
            />
          </Col>
          <Col span={8}>
            <span className="tab__input--label ">
              <HelpText tooltipkey={"affid-installation-type"} /> Installation
              Type
            </span>

            <Input
              id="installationtype"
              type="text"
              value={data?.Installation_Type}
              disabled={true}
              style={{ fontSize: "12px" }}
            />
          </Col>
        </Row>
      </div>

      <div className="tab__column" style={{ border: "none" }}>
        <Row gutter={[8, 8]}>
          <Col span={24}>
            <span className="tab__input--label ">Code</span>

            <Select
              id="code"
              placeholder="Code"
              value={data?.Code}
              onChange={(value) => handleCode(value)}
            >
              {affidavitCodes.map((option) => (
                <Option key={option} value={option}>
                  {option}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </div>

      <div className="tab__column">
        <Row gutter={[8, 8]}>
          <Col span={24}>
            <span className="tab__input--label ">
              <HelpText tooltipkey={"affid-preview"} /> Preview
            </span>

            <Input.TextArea
              rows={20}
              value={data?.FEA_Preview}
              disabled={true}
              style={{ resize: "none", fontSize: "12px" }}
            />
          </Col>
        </Row>
      </div>
    </>
  );
};

export default EngineeringAffidavit;
