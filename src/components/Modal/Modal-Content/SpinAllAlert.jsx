import {Button} from "../../index";
import React, {useContext} from "react";
import {ViewerContext} from "../../../contexts/ViewerContext";

const SpinAllAlert = () => {
    const {SceneViewer} = useContext(ViewerContext);

    const confirmSpinAll = () => {
        SceneViewer.setSpinAllModules();
        SceneViewer.viewerAlert({show: false});
    }

    const cancelSpinAll = () => {
        //Close Alert
        SceneViewer.viewerAlert({show: false})
    }


    return (
        <>
            <p>Are you sure you want to spin all the modules on the roof ? This action will change orientation and
                layout of all roof faces. Click Confirm to proceed.</p>
            <div className={"spinAllAlertBtnContainer"}>


                <Button
                    id={"spinAllConfirmBtn"}
                    fluid
                    variant="btn-primary"
                    size="btn-md"
                    className="editor__control--finalize"
                    onClick={confirmSpinAll}
                >
                    Confirm
                </Button>

                <Button
                    id={"spinAllCancelBtn"}
                    fluid
                    variant="btn-primary"
                    size="btn-md"
                    className="editor__control--finalize"
                    onClick={cancelSpinAll}
                >
                    Cancel
                </Button>
            </div>
        </>
    )
}

export default SpinAllAlert;