import React, {useContext, useState} from 'react';
import {HiOutlineMinus, HiOutlinePlus} from 'react-icons/hi';
import {FiHome} from 'react-icons/fi';
import {CgMenuGridO} from 'react-icons/cg';
import {ViewerContext} from "../../contexts/ViewerContext";
import {UserContext} from '../../contexts/UserContext';

const Navigation = () => {
    const {hasCapability} = useContext(UserContext);
    const {SceneViewer} = useContext(ViewerContext);

    const [isXRayView, setIsXRayView] = useState(true);

    const zoomInHandler = () => {
        SceneViewer?.setCameraZoom(-10);
    }

    const zoomOutHandler = () => {
        SceneViewer?.setCameraZoom(10)
    }

    const homePositionHandler = () => {

        SceneViewer.setCameraView(SceneViewer.viewMode,true);

    }

    const xRayViewHandler = () => {
        SceneViewer?.setVisibleGroup('roof', !isXRayView);

        setIsXRayView((prev) => !prev);
    }

    return (
        <div className='navigation'>
            <button onClick={zoomInHandler} className='navigation__btn' title='Zoom In'><HiOutlinePlus/></button>
            <button id={"defaultPositionBtn"} onClick={homePositionHandler} className='navigation__btn' title='Site View'><FiHome/></button>
            {hasCapability('X-Ray_View') && <button id='btnXRay' onClick={xRayViewHandler} className='navigation__btn' title='X-Ray View'><CgMenuGridO/></button>}
            <button onClick={zoomOutHandler} className='navigation__btn' title='Zoom Out'><HiOutlineMinus/></button>
        </div>
    );
}

export default Navigation;
