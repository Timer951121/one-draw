import {Button} from "../../index";
import React, {useContext} from "react";
import {ViewerContext} from "../../../contexts/ViewerContext";

const TreeCartDiscardAlert = () => {
    const {SceneViewer} = useContext(ViewerContext);

    const confirmDiscard = () => {
      
    }

    const cancel = () => {
        //Close Alert
        SceneViewer.viewerAlert({show: false})
    }


    return (
        <>
            <p>Are you sure you want to discard all the changes in the tree cart form?</p>
            <div className={"spinAllAlertBtnContainer"}>

                <Button
                    id={"spinAllConfirmBtn"}
                    fluid
                    variant="btn-primary"
                    size="btn-md"
                    className="editor__control--finalize"
                    onClick={confirmDiscard}
                >
                    Discard
                </Button>

                <Button
                    id={"spinAllCancelBtn"}
                    fluid
                    variant="btn-primary"
                    size="btn-md"
                    className="editor__control--finalize"
                    onClick={cancel}
                >
                    Cancel
                </Button>
            </div>
        </>
    )
}

export default TreeCartDiscardAlert;