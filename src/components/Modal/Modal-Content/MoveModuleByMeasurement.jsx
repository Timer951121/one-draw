import React, {useContext, useState} from "react";
import {Button} from "../../index";
import {ViewerContext} from "../../../contexts/ViewerContext";
import {Input, Select} from "antd";

const MoveModuleByMeasurement = () => {

    const {SceneViewer} = useContext(ViewerContext);

    const [selectedDirection, setSelectedDirection] = useState(null)
    const [selectedMeasurement, setSelectedMeasurement] = useState(0)

    const submitMeasurement = (e) => {

        //Check if user has selected a direction and measurement
        if (selectedDirection ===null  || selectedMeasurement === 0) {
            alert('Please select direction or input measurement');
            return
        }

        SceneViewer.moveModuleDistance(selectedDirection, selectedMeasurement);

        SceneViewer.removeViewerAlert()

    }

    const directionOptions = [
        {value: 'left', label: 'Left'},
        {value: 'right', label: 'Right'},
        {value: 'top', label: 'Up'},
        {value: 'bottom', label: 'Down'},
    ]


    const handleDirectionChange = (value) => {
        setSelectedDirection(value)
    }

    return (
        <>
            <div className={'treeForm'}>
                <br/>
                <label htmlFor="moveSelectedModuleByMeasurementSelectDir">Select Direction : </label>
                <Select
                    id={'moveSelectedModuleByMeasurementSelectDir'}
                    placeholder={"Select Direction"}
                    onChange={handleDirectionChange}
                    options={directionOptions}
                />

                <br/>
                <label htmlFor="inchModuleMoveMeasurementInput">Input Inch Value : </label>
                <Input
                    id={"inchModuleMoveMeasurementInput"}
                    type="number"
                    value={selectedMeasurement}
                    onChange={(e) => setSelectedMeasurement(e.target.value)}
                    placeholder={"Input Inch Value"}
                    // label={{children: 'Enter Inch Value', className: 'epc-form-label'}}
                    name="predictValue"
                />
                <br/>
                <Button
                    id={"submitModuleMoveMeasurementBtn"}
                    fluid
                    variant="btn-primary"
                    size="btn-md"
                    className="editor__control--finalize"
                    onClick={submitMeasurement}
                >
                    Submit
                </Button>

            </div>

        </>
    )
}

export default MoveModuleByMeasurement