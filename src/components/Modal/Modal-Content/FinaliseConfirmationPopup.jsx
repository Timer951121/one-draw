import { Button } from "../../index";
import React, { useContext } from "react";
import { ViewerContext } from "../../../contexts/ViewerContext";

const FinaliseConfirmationPopup = (props) => {
    const { SceneViewer } = useContext(ViewerContext);




    const cancelFinalize = () => {
        //Close Alert
        SceneViewer.viewerAlert({ show: false })
    }


    return (
        <>
           
            <p>This design has been {props.certification_status.slice(0, props.certification_status.lastIndexOf(" "))} certified. Changes to this<br/> made will disable the 
                 {" " +props.certification_status.slice(0, props.certification_status.lastIndexOf(" "))} certification from this design 
                <br/>and will flag this as a "Certified Design Override".
                <br/>
            </p>
            <p>
                Press "Confirm" to continue finalizing this design or "Cancel"<br/> to go back.
            </p>
           <br/>
            <div className={"spinAllAlertBtnContainer"}>

                <Button
                    id={"spinAllConfirmBtn"}
                    fluid
                    variant="btn-primary"
                    size="btn-md"
                    className="editor__control--finalize"
                    onClick={props.confirm}
                >
                    Confirm
                </Button>
                <Button
                    id={"spinAllCancelBtn"}
                    fluid
                    variant="btn-primary"
                    size="btn-md"
                    className="editor__control--finalize"
                    onClick={cancelFinalize}
                >
                    Cancel
                </Button>

            </div>
        </>
    )
}

export default FinaliseConfirmationPopup;