import React, {useEffect} from 'react';
import {Outlet} from 'react-router-dom';
import {Alert, Compass, ContextMenu, Navigation, Sidebar, ThreeDViewer} from '../components';
import Modal from "../components/Modal/Modal";
import SiteLoadLoader from "../components/Loader/SiteLoadLoader";
import Toolbar from "../components/Toolbar/Toolbar";
import Actionbar from "../components/Actionbar/Actionbar";
import StreetView from "../components/StreetView/StreetView";
import {useViewerStore} from '../store/store';

const EditLayout = () => {

    const siteAddress = useViewerStore(state => state.siteAddress);

    const viewerAlert = useViewerStore(state => state.viewerAlert);


    useEffect(() => {
        const isModalOpen = viewerAlert.show && viewerAlert.isModal;
        useViewerStore.setState({isModalOpenInInterface: isModalOpen});
    }, [viewerAlert]);

    return (
        <>
            <div id={"editMainContainer"} className='editor'>
                <Sidebar/>

                <ContextMenu/>

                <div id={"siteAddressLabel"}>{siteAddress}</div>

                <SiteLoadLoader/>

                <StreetView/>

                <ThreeDViewer/>

                {
                    viewerAlert.show && viewerAlert.isModal === true &&
                    <Modal
                        title={viewerAlert.title}
                        messageType={viewerAlert.messageType}
                        close={() => {

                            useViewerStore.setState({viewerAlert: {show: false}})

                            if (viewerAlert.closeCallback) viewerAlert.closeCallback()
                        }}

                    >
                        {viewerAlert.message}
                    </Modal>

                }

                {
                    viewerAlert.show && viewerAlert.isModal === false &&
                    <Alert
                        title={viewerAlert.title}
                        message={viewerAlert.message}
                        messageType={viewerAlert.messageType}
                        onClose={() => useViewerStore.setState({viewerAlert: {show: false}})}
                    />

                }

                <Toolbar/>

                <Actionbar/>

                <div className='app__controls'>

                    <Compass/>

                    <Navigation/>

                </div>

                <Outlet/>


            </div>
        </>
    );
}

export default EditLayout;
