import React, {useContext, useEffect, useState} from 'react';
import { Flex, Button } from 'antd';
import {
    Pencil,
    PersonArmsSpread,
    Ruler,
    ArrowsClockwise,
    BoundingBox,
    ArrowsOut,
    Cube,
    Perspective,
    X
} from '@phosphor-icons/react';
import {useLocation, useNavigate} from 'react-router-dom';
import { UserContext } from '../../contexts/UserContext';
import { ViewerContext } from '../../contexts/ViewerContext';
import {useViewerStore} from "../../store/store";

const Toolbar = () => {

    const { pathname } = useLocation();

    const { SceneViewer } = useContext(ViewerContext)
    const {user, hasCapability } = useContext(UserContext);
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(true);
    const [rotateActive, setRotateActive] = useState(false);
    const isStreetViewVisible = useViewerStore((state) => state.isStreetViewVisible);
    const [topViewActive, setTopViewActive] = useState(false);

    const isTapeMeasureActive = useViewerStore((state) => state.isTapeMeasureActive);

    //Handlers

    const setViewTo2DHandler = (e) => {
        SceneViewer.viewMode = '2d';
        SceneViewer.setAutoRotate(false);
        SceneViewer.setCameraView('2d');
    }

    const setViewTo3DHandler = (e) => {
        SceneViewer.viewMode = '3d';
        SceneViewer.setCameraView('3d')
    }

    const autoRotate = () => {
        setRotateActive((rotateActive) => !rotateActive);
        SceneViewer.setAutoRotate(!rotateActive);
    }

    const fullScreenHandler = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            // document.body.classList.add('full-screen');
            useViewerStore.setState({
                isRightSidebarOpen: false,
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                // document.body.classList.remove('full-screen');
                useViewerStore.setState({
                    isRightSidebarOpen: true,
                });
            }
        }

    }

    const streetViewHandler = () => {
        SceneViewer.loadStreetView();
        useViewerStore.setState({isStreetViewVisible: true, isRightSidebarOpen: false});
    }
    const topViewHandler = () => {
        SceneViewer.setTopView(true);
    }

    const measurementRedirectHandler = () => { 
        if(!pathname.includes('tape-measure')) {
            useViewerStore.setState({isTapeMeasureActive: true})
            navigate('/configure/tape-measure')
        }
        else {
            useViewerStore.setState({isTapeMeasureActive: false})
            navigate('/configure/roof')
        }
    }


    useEffect(() => {
        if (user && !pathname.includes('tape-measure')) {
            useViewerStore.setState({isTapeMeasureActive: false})
        }
    }, [pathname, user]);

    return (
        <>
            <div className='toolbar'>
                <Flex gap={15}>
                    <Button
                        title={!isOpen?"Close Toolbar":"Open Toolbar"}
                        type='default'
                        size='large'
                        icon={isOpen ? <Pencil size={28} weight='fill' /> : <X size={28} weight='bold' />}
                        onClick={() => setIsOpen(!isOpen)}
                    /> 
                    <Flex gap={5} hidden={isOpen} id='CanvasToolbar'>
                        {(hasCapability('Google_Streetview')) && (
                            <Button
                                title={"Street View"}
                                type={isStreetViewVisible ? 'primary' : 'default'}
                                size='large'
                                icon={<PersonArmsSpread size={26} weight='fill' />}
                                onClick={streetViewHandler}
                                id='streetViewTool'
                            />
                        )}
                        {hasCapability('Tape_Measure') && (
                            <Button
                                title={"Tape Measure"}
                                type={isTapeMeasureActive ? 'primary' : 'default'}
                                id="btnMeasure"
                                size='large'
                                icon={<Ruler size={26} weight='fill' />}
                                onClick={measurementRedirectHandler}
                            />
                        )}
                        {hasCapability('360_View') && (
                            <Button
                                title={"360 View"}
                                type={rotateActive ? 'primary' : 'default'}
                                size='large'
                                icon={<ArrowsClockwise size={26} weight='fill' />}
                                id='btnAutoRotate'
                                onClick={autoRotate}
                            />
                        )}
                        {hasCapability('Top_View') && (
                            <Button
                                title={"Top View"}
                                type={'default'}
                                size='large'
                                icon={<BoundingBox size={26} weight='fill' />}
                                id='btnTopView'
                                onClick={topViewHandler}
                            />
                        )}

                        <Button
                            title={"Full Screen"}
                            type={'default'}
                            size='large'
                            icon={<ArrowsOut size={28} weight='fill' />}
                            id='fullScreen'
                            onClick={fullScreenHandler}
                        />
                        {hasCapability('2D_View') && (
                            <Button
                                title={"2D View"}
                                type={'default'}
                                size='large'
                                icon={<Perspective size={26} weight='fill' />}
                                id='2DViewBtn'
                                onClick={setViewTo2DHandler}
                            />
                        )}
                        {hasCapability('3D_View') && (
                            <Button
                                title={"3D View"}
                                type={ 'default'}
                                size='large'
                                icon={<Cube size={26} weight='fill' />}
                                id='3DViewBtn'
                                onClick={setViewTo3DHandler}
                            />
                        )}
                    </Flex>
                </Flex>
            </div>
        </>
    );
}

export default Toolbar;
