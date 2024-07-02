import React, { useEffect, useState } from "react";
import { Flex, Checkbox, Input, Select } from "antd";
// import { CaretDown } from "@phosphor-icons/react";
import { useViewerStore } from "../../../store/store";
const BuildingProperties = ({
  selectedBuilding,
  setSelectedBuilding,
  readOnly,
}) => {
  const masterDataList = useViewerStore.getState().masterDataList;
  const [aaoption, setAaoption] = useState([]);
  const [nacoptions, setNacoptions] = useState([]);
  const [lsoptions, setLsoptions] = useState([]);

  const handeleAtticAccess = (e, value) => {
    let updateSelBuildingData = {
      ...selectedBuilding,
    };
    updateSelBuildingData.Attic_Access_Id = value;
    setSelectedBuilding(updateSelBuildingData);
  };

  const handleWhyAtticAccess = (e, value) => {
    let updateSelBuildingData = {
      ...selectedBuilding,
    };
    updateSelBuildingData.Why_No_Attic_Access_Id = value;
    setSelectedBuilding(updateSelBuildingData);
  };
  const handleAtticAccessNotes = (value) => {
    let updateSelBuildingData = {
      ...selectedBuilding,
    };
    updateSelBuildingData.Attic_Access_Notes = value;
    setSelectedBuilding(updateSelBuildingData);
  };

  const handleLayersShingles = (e, value) => {
    let updateSelBuildingData = {
      ...selectedBuilding,
    };
    updateSelBuildingData.Layers_of_Shingles_Id = value;
    setSelectedBuilding(updateSelBuildingData);
  };
  const handleAllRoofsTheSame = (value) => {
    let updateSelBuildingData = {
      ...selectedBuilding,
    };
    updateSelBuildingData.All_Roof_The_Same = value;
    setSelectedBuilding(updateSelBuildingData);
  };
  useEffect(() => {
    setAaoption(
      masterDataList.AtticAccessList?.map((item, index_value) => {
        return {
          key: String(index_value + 1),
          label: item.label,
          value: Number(item.value),
        };
      })
    );
    setNacoptions(
      masterDataList.NoAtticAccessReasons?.map((item, index_value) => {
        return {
          key: String(index_value + 1),
          label: item.label,
          value: Number(item.value),
        };
      })
    );
    setLsoptions(
      masterDataList.LayersofShingles?.map((item, index_value) => {
        return {
          key: String(index_value + 1),
          label: item.label,
          value: Number(item.value),
        };
      })
    );
  }, [masterDataList]);
  // const handleSpecialRequirements = (value) => {
  //   let updateSelBuildingData = {
  //     ...selectedBuilding,
  //   };
  //   updateSelBuildingData.Special_Requirements = value;
  //   setSelectedBuilding(updateSelBuildingData);
  // };
  // const handleSpecialRequirementsNotes = (value) => {
  //   let updateSelBuildingData = {
  //     ...selectedBuilding,
  //   };
  //   updateSelBuildingData.Special_Requirements_Notes = value;
  //   setSelectedBuilding(updateSelBuildingData);
  // };
  return (
    <div id="buildingTab" className="tab__column obst-edit-mask tab_gap">
      <Flex align="center" justify="space-between" className="small_input_flex">
        <div>
          <span className="tab__input--label small_input_label">
            Attic Access:
          </span>
        </div>
        <Select
          id="atticAccessSelect"
          options={aaoption}
          value={selectedBuilding.Attic_Access_Id}
          onChange={(e, data) => handeleAtticAccess(e, data.value)}
          className="small-input-feild"
          disabled={readOnly}
        />
      </Flex>
      <Flex align="center" justify="space-between" className="small_input_flex">
        <div style={{ width: 95 }}>
          <span className="tab__input--label small_input_label">
            Why No Attic Access:
          </span>
        </div>
        <Select
          id="roofTypeSelect"
          options={nacoptions}
          value={selectedBuilding.Why_No_Attic_Access_Id}
          onChange={(e, data) => handleWhyAtticAccess(e, data.value)}
          className="small-input-feild"
          disabled={readOnly}
        />
      </Flex>
      <Flex
        //   align="center"
        justify="space-between"
        className="small_input_flex"
      >
        <div>
          <span className="tab__input--label small_input_label">
            Attic Access Notes:
          </span>
        </div>
        <Input.TextArea
          rows={1}
          className="small_input_flex small_text_area"
          value={selectedBuilding.Attic_Access_Notes}
          onChange={(e) => handleAtticAccessNotes(e.target.value)}
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
      <Flex align="center" justify="space-between" className="small_input_flex">
        <div>
          <span className="tab__input--label small_input_label ">
            Layers of Shingles:
          </span>
        </div>

        <Select
          id="layersofShinglesSelect"
          options={lsoptions}
          value={selectedBuilding.Layers_of_Shingles_Id}
          onChange={(e, data) => handleLayersShingles(e, data.value)}
          className="small-input-feild"
          disabled={readOnly}
        />

        {/* <Input
          id="inputLayersofShingles"
          type="number"
          className={`tab__input--field `}
          value={selectedBuilding.Layers_of_Shingles}
          onChange={(e) => handleLayersShingles(e.target.value)}
          placeholder="1"
          style={{ width: "185px", height: "32px" }}
          disabled={readOnly}
        /> */}
      </Flex>
      <Flex align="center" justify="space-between" className="small_input_flex">
        <div>
          <span className="tab__input--label small_input_label ">
            Number of Roofs:
          </span>
        </div>
        <Input
          id="inputNumberofRoofs"
          type="text"
          className="small-input-feild"
          value={
            selectedBuilding.Number_of_Roofs
              ? selectedBuilding.Number_of_Roofs
              : "No data found"
          }
          disabled={true}
        />
      </Flex>
      <Flex align="center" justify="space-between" className="small_input_flex">
        <div>
          <span className="tab__input--label small_input_label ">
            Peak to Ground (In):
          </span>
        </div>
        <Input
          id="inputPeaktoGround"
          type="text"
          className="small-input-feild"
          value={
            selectedBuilding.Peak_to_Ground_Inches
              ? selectedBuilding.Peak_to_Ground_Inches
              : "No data found"
          }
          disabled={true}
        />
      </Flex>
      <Flex align="center" justify="space-between" className="small_input_flex">
        <div>
          <span className="tab__input--label small_input_label ">
            Township:
          </span>
        </div>
        <Input
          id="inputTownship"
          type="text"
          className="small-input-feild"
          value={
            selectedBuilding.Township
              ? selectedBuilding.Township
              : "No data found"
          }
          disabled={true}
        />
      </Flex>
      <Flex align="center" justify="space-between" className="small_input_flex">
        <div>
          <span className="tab__input--label small_input_label ">
            All Roofs The Same?
          </span>
        </div>
        <Checkbox
          checked={selectedBuilding.All_Roof_The_Same}
          onChange={(e) => handleAllRoofsTheSame(e.target.checked)}
          value={selectedBuilding.All_Roof_The_Same}
          disabled={readOnly}
        />
      </Flex>
      <Flex align="center" justify="space-between" className="small_input_flex">
        <div style={{ width: 95 }}>
          <span className="tab__input--label small_input_label">
            Special Requirements:
          </span>
        </div>

        <Input
          id="inputSpecialRequirements"
          type="text"
          className="small-input-feild"
          value={
            selectedBuilding.Special_Requirements
              ? selectedBuilding.Special_Requirements
              : "No data found"
          }
          disabled={true}
        />
        {/* <Select
          id="atticAccessSelect"
          placeholder="Attic Access"
          options={aaoptions}
          defaultValue={selectedBuilding.Special_Requirements}
          onChange={(e) => handleSpecialRequirements(e)}
          size="medium"
          suffixIcon={<CaretDown size={18} />}
          // className="small-select-tab"
          style={{ width: "185px" }}
          disabled={readOnly}
        /> */}
      </Flex>
      <Flex
        //   align="center"
        justify="space-between"
        className="small_input_flex"
      >
        <div style={{ width: 95 }}>
          <span className="tab__input--label small_input_label">
            Special Requirements Notes:
          </span>
        </div>

        <Input.TextArea
          rows={4}
          className="small_input_flex small_text_area"
          value={
            selectedBuilding.Special_Requirements_Notes
              ? selectedBuilding.Special_Requirements_Notes
              : "No data found"
          }
          disabled={true}
          style={{ resize: "none" }}
        />
      </Flex>
    </div>
  );
};

export default BuildingProperties;
