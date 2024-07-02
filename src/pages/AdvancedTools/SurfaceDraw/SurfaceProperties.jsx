import React, {useContext, useState} from 'react';
import {FiCopy, FiTrash2} from 'react-icons/fi';
import {Button, RangeSlider, Toggle} from '../../../components';
import {ViewerContext} from "../../../contexts/ViewerContext";

const SurfaceProperties = () => {

    const {SceneViewer} = useContext(ViewerContext);

    const [isCarport, setIsCarport] = useState(false);

    const settingsRoofHeight = {min: 0.1, max: 20, step: 0.1,},
        settingsAzimuth = {min: 0, max: 360, step: 1,},
        settingsPitch = {min: 0, max: 45, step: 1,},
        settingsPosition = {min: -300, max: 300, step: 1},
        settingsScale = {min: 1, max: 80, step: 1},
        settingsParapetHeight = {min: 0, max: 3, step: 0.1,},
        settingsParapetWidth = {min: 0.1, max: 1, step: 0.05,};

    const setCreateRoofMode = () => {
        const {createRoofMode} = SceneViewer;
        if (!createRoofMode) {
            SceneViewer.viewerAlert({
                show: true,
                isModal: false,
                title: 'Add Flat Roof',
                message: `Drag line on the Map to Add Roof`,
            })
        }
        SceneViewer.setCreateRoofMode(!createRoofMode);
    }

    const setCreatePlaneMode = () => {
        const {createPlaneMode} = SceneViewer;
        if (!createPlaneMode) {
            SceneViewer.viewerAlert({
                show: true,
                isModal: false,
                title: 'Add Flat Roof',
                message: `Click on Point on the Map to Add Roof`,
            })
        }
        SceneViewer.setCreatePlaneMode(!createPlaneMode);
    }

    const deleteFlatRoof = () => {
        SceneViewer.setFlatRoofProperty('delete');
    }

    const onChangeCarport = () => {
        setIsCarport(!isCarport);
        SceneViewer.hideObject('carport', !isCarport);
    }

    return (
        <>
            <div className='tab__inner'>
                <div className='tab__title'>
                    <span className='tab__title--text'>Flat Roof Properties</span>
                    <div className='tab__title--btns'>
                        <FiCopy/>
                        <FiTrash2 onClick={deleteFlatRoof}/>
                    </div>
                </div>
                <div className='tab__column'>
                    <div className='tab__flex'>
                        <Button onClick={setCreatePlaneMode} property={'CreatePlaneMode'} variant='btn-primary-outline'
                                size='btn-md'>Add</Button>
                        <Button onClick={setCreateRoofMode} property={'CreateRoofMode'} variant='btn-primary-outline'
                                size='btn-md'>Draw Roof</Button>
                    </div>
                </div>

                <div className="tab__column" id='settingFlatRoof'>
                    <span className="tab__column--subtitle">Edit Roof to Base Height</span>
                    <RangeSlider label='ft' property={'HeightFlatRoof'} settings={settingsRoofHeight}/>

                    <span className="tab__column--subtitle">Azimuth</span>
                    <RangeSlider label='°' property={'AzimuthFlatRoof'} settings={settingsAzimuth}/>
                    <span className="tab__column--subtitle">Pitch</span>
                    <RangeSlider label='°' property={'PitchFlatRoof'} settings={settingsPitch}/>

                    <div className='range-group-sapce'></div>

                    <span className="tab__column--subtitle">Parapet Wall</span>
                    <RangeSlider label='ft' property={'HeightParapet'} settings={settingsParapetHeight}
                                 preLabel={'Height'}/>
                    <RangeSlider label='ft' property={'WidthParapet'} settings={settingsParapetWidth}
                                 preLabel={'Width'}/>

                    <div id='settingPlaneFlatRoof'>
                        <div className='range-group-sapce'></div>
                        <span className="tab__column--subtitle">Move the Flat Roof</span>
                        <RangeSlider label='ft' property={'PosXFlatRoof'} settings={settingsPosition} preLabel={'X'}/>
                        <RangeSlider label='ft' property={'PosYFlatRoof'} settings={settingsPosition} preLabel={'Y'}/>

                        <div className='range-group-sapce'></div>
                        <span className="tab__column--subtitle">Scale</span>
                        <RangeSlider label='ft' property={'SclXFlatRoof'} settings={settingsScale} preLabel={'X'}/>
                        <RangeSlider label='ft' property={'SclYFlatRoof'} settings={settingsScale} preLabel={'Y'}/>
                    </div>
                </div>
                <div className='tab__column'>
                    <div className='tab__flex justify-start tab__carport'>
                        <span className='tab__column--subtitle mb-0'>Carport Type</span>
                        <Toggle
                            onChange={onChangeCarport}
                            on={isCarport}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

export default SurfaceProperties;
