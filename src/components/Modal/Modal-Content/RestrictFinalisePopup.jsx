import { Button } from "../../index";
import React, { useContext } from "react";
import { ViewerContext } from "../../../contexts/ViewerContext";

const RestrictFinalisePopup = (props) => {
    const { SceneViewer } = useContext(ViewerContext);




    const cancelFinalize = () => {
        //Close Alert
        SceneViewer.viewerAlert({ show: false })
    }


    return (
        <>
            <p>This design has been {props.certification_status}. <br/>Therefore, the design is locked, and your changes cannot be saved.</p>
           <br/>
            <div className={"spinAllAlertBtnContainer"}>

                <Button
                    id={"spinAllConfirmBtn"}
                    fluid
                    variant="btn-primary"
                    size="btn-md"
                    className="editor__control--finalize"
                    onClick={cancelFinalize}
                >
                    Confirm
                </Button>
            </div>
        </>
    )
}

export default RestrictFinalisePopup;