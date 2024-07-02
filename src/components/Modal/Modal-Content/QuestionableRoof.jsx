import React, {useContext, useState} from "react";
import {Button} from "../../index";
import {ViewerContext} from "../../../contexts/ViewerContext";
import {useViewerStore} from "../../../store/store";
import {Input, Select} from "antd";

const QuestionableRoof = () => {

    const {SceneViewer} = useContext(ViewerContext);

    const [selectQuestionableRoofOption, setSelectQuestionableRoofOption] = useState('Low/High Pitch')

    const [otherReasonInput, setOtherReasonInput] = useState('')

    const options = [
        { value: "Select Reason", disabled: true, children: 'Select Reason' },
        { value: "Low/High Pitch", children: 'Low/High Pitch' },
        { value: "Detached Structure", children: 'Detached Structure' },
        { value: "Roof Material", children: 'Roof Material' },
        { value: "Structure Stability", children: 'Structure Stability' },
        { value: "Questionable Setbacks", children: 'Questionable Setbacks' },
        { value: "Unclear Obstructions", children: 'Unclear Obstructions' },
        { value: "Other (See Notes)", children: 'Other (See Notes)' },
    ];

    const submitQuestionableRoof = () => {


        if (selectQuestionableRoofOption === 'unselected') {
            alert('Please select a reason');
            return
        }

        if (selectQuestionableRoofOption === 'Other (See Notes)' && otherReasonInput === '') {
            alert('Please input a reason');
            return
        }

        let selectedReason = selectQuestionableRoofOption

        if (selectQuestionableRoofOption === 'Other (See Notes)') {
            selectedReason = otherReasonInput
        }


        const roof = useViewerStore.getState().pointerDownSelectedObject

        roof.userData["questionableRoof"] = selectedReason

        console.log(roof.userData)


        SceneViewer.removeViewerAlert()

    }

    const handleChangeQuestionableRoofOption = (value) => {
        setSelectQuestionableRoofOption(value)
    }

    return (
        <>
            <div className={'treeForm'}>
                <label htmlFor="moveSelectedModuleByMeasurementSelectDir">Select Reason : </label>
                <br/>
                <Select
                    id="questionableRoofOptions"
                    onChange={handleChangeQuestionableRoofOption}
                    options={options}
                    defaultValue="unselected"
                />

                <br/>


                {

                    selectQuestionableRoofOption === "Other (See Notes)" &&

                    <Input
                        id={"otherReasonInput"}
                        type="text"
                        value={otherReasonInput}
                        onChange={(e) => setOtherReasonInput(e.target.value)}
                        placeholder={"Input Reason Here"}
                        addonBefore={'Enter Notes'}
                        name="otherReason"
                    />

                }


                <br/>
                <Button
                    id={"submitQuestionableRoofBtn"}
                    fluid
                    variant="btn-primary"
                    size="btn-md"
                    className="editor__control--finalize"
                    onClick={submitQuestionableRoof}
                >
                    Submit
                </Button>

            </div>

        </>
    )
}

export default QuestionableRoof