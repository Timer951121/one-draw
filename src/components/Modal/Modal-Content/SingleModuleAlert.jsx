import { Button } from "../../index";
import React, { useContext } from "react";
import { ViewerContext } from "../../../contexts/ViewerContext";
import FinaliseConfirm from "./FinaliseConfirm";

const SingleModuleAlert = (props) => {
    const { SceneViewer } = useContext(ViewerContext);

    const confirmFinalize = () => {
        SceneViewer.viewerAlert({
            show: true,
            title: "Save Design",
            message: <FinaliseConfirm />,
            messageType: "success",
            isModal: true
        })
    }


    const cancelFinalize = () => {
        //Close Alert
        SceneViewer.viewerAlert({ show: false })
    }


    return (
        <>
            <p>There is a single module on Roof {props.roofs.join(' ,Roof ')}.
                <br/>
                <br/>
                If you wish to continue finalizing the design, click 'Confirm' below. </p>
           <br/>
            <div className={"spinAllAlertBtnContainer"}>

                <Button
                    id={"spinAllConfirmBtn"}
                    fluid
                    variant="btn-primary"
                    size="btn-md"
                    className="editor__control--finalize"
                    onClick={confirmFinalize}
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

export default SingleModuleAlert;