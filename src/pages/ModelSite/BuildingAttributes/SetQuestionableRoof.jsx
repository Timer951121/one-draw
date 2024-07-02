import React, { useState } from "react";
import { Select } from "antd";
import { CaretDown } from "@phosphor-icons/react";
import { Button } from "../../../components/index";
import { useViewerStore } from "../../../store/store";

const SetQuestionableRoof = ({ handleReasonSubmit, selectedRoofIndex }) => {
  const masterDataList = useViewerStore.getState().masterDataList;
  const [reson, setReason] = useState(masterDataList.QuestionableRoof[0]);
  const handleReasonChange = (value) => {
    setReason(value);
  };

  return (
    <>
      <div className={"treeForm"}>
        <div>
          <span className="tab__input--label ">Select Reason:</span>
        </div>
        <Select
          id="qroofReasonSelect"
          options={masterDataList.QuestionableRoof}
          defaultValue={reson}
          onChange={(e) => handleReasonChange(e)}
          size="medium"
          suffixIcon={<CaretDown size={18} />}
          style={{ width: "100%", marginBottom: "10px" }}
        />

        <Button
          variant="btn-primary"
          size="btn-md"
          className="editor__control--finalize"
          onClick={() => handleReasonSubmit(reson, selectedRoofIndex)}
        >
          Submit
        </Button>
      </div>
    </>
  );
};

export default SetQuestionableRoof;
