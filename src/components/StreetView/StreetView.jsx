import {MdClose} from "react-icons/md";
import React, {useContext} from "react";
import {useViewerStore} from "../../store/store";
import {ViewerContext} from "../../contexts/ViewerContext";

const StreetView = () => {

    const {SceneViewer} = useContext(ViewerContext);

    const closeStreetView = () => {
        const streetViewContainer = document.getElementById("google-street-view-container")
        streetViewContainer.style.display = "none";
        let canvasContainer = document.getElementById('canvasContainer')
        canvasContainer.classList.remove('canvas-street-view-split');
        SceneViewer.isViewerInSplitMode = false;
        setTimeout(() => {
            SceneViewer?.resizeCanvas();
        }, 500);
        useViewerStore.setState({isStreetViewVisible: false, isRightSidebarOpen: true});

    };

    return (
        <div className={"street-view no-pointer-events"} id={"google-street-view-container"}>
            <button onClick={closeStreetView} className={"street-view--close"}>
                <MdClose size={24}/>
            </button>
            <iframe loading={"lazy"} className={"street-view-iframe"}></iframe>
        </div>

    )
}

export default StreetView;