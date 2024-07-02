import React, {useContext, useEffect} from 'react';
import {BsPlay} from 'react-icons/bs';
import {Button, RangeSlider, SolarPallet, Toggle} from '../../../components';
import {ViewerContext} from '../../../contexts/ViewerContext';
import {useViewerStore} from "../../../store/store";

const rangeDate = {min: 1, max: 365, step: 1};
const rangeTime = {min: 0, max: 24, step: 1 / 60};

const onClickPlay = () => {
    const btnSunTimePlay = document.getElementsByClassName('btn-sun-time-play')[0];
    if (!btnSunTimePlay) return;
    const active = btnSunTimePlay.classList.contains('active');
    if (active) btnSunTimePlay.classList.remove('active');
    else btnSunTimePlay.classList.add('active');
}

const IrradianceProperties = () => {
    const sunPathControlsContainerRef = React.useRef(null);

    const {SceneViewer} = useContext(ViewerContext);

    useEffect(() => {
        SceneViewer?.hideObject('ModuleTexture', true);

        return () => {
            SceneViewer?.hideObject('ModuleTexture', false);
        };
    }, [SceneViewer]);

    const isSunSimulationRunning = useViewerStore((state) => state.isSunSimulationRunning);

    const showSunPathLine = useViewerStore((state) => state.showSunPathLine);


    useEffect(() => {
        useViewerStore.setState({
            isSunSimulationRunning: false,
            showSunPathLine: false
        });
    },[]);

    const onChangeSunSimulation = () => {
        useViewerStore.setState({isSunSimulationRunning: !isSunSimulationRunning});

        sunPathControlsContainerRef.current.classList.toggle('disabled-area');


        SceneViewer.hideObject('SunVector', !isSunSimulationRunning)

        // const hideSunVector = document.getElementById('hideSunVector');
        //
        // const settingSunSimulation = document.getElementById('settingSunSimulation');
        //
        // if (settingSunSimulation) {
        //     const toggle = hideSunVector.classList.contains('active');
        //     if (toggle) settingSunSimulation.classList.add('hide');
        //     else settingSunSimulation.classList.remove('hide');
        // }
    }

    const onChangeSunPathLine = () => {
        useViewerStore.setState({showSunPathLine: !showSunPathLine});
        SceneViewer.showSunPathLine(!showSunPathLine);
    }

    return (
        <>
            <div className='tab__inner'>
                <div className='tab__title'>
                    <span className='tab__title--text tab__title--flex'>Irradiance</span>
                </div>
                <div className='tab__column'>
                    <div className='tab__flex justify-between mb-2'>
                        <SolarPallet/>
                    </div>
                </div>

                <div className='tab__column'>

                    <div className="tab__flex justify-between">
                        <span className='tab__column--subtitle mb-0'>Sun Path Simulation</span>
                        <Toggle
                            on={isSunSimulationRunning}
                            onChange={onChangeSunSimulation}
                        />
                    </div>

                    <br/>


                    <div
                        ref={sunPathControlsContainerRef}
                        className='tab__data disabled-area' id='settingSunSimulation' >
                        <div className="tab__flex justify-between">
                            <span className='tab__column--subtitle mb-0'>Display Sun Path Line</span>
                            <Toggle
                                on={showSunPathLine}
                                onChange={onChangeSunPathLine}
                                property='SunPathLine'
                            />
                        </div>

                        <span id='sunDate' className="tab__column--subtitle">Select Date</span>

                        <RangeSlider variant='range-slider' label='day' property={"SunDate"} settings={rangeDate}/>
                        <span id='labelSunTime' className="tab__column--subtitle">Select Time</span>
                        <RangeSlider variant='range-slider' label='hour' property={"SunTime"} settings={rangeTime}/>
                        <Button title={"Play Simulation"} variant='btn-clear' size='btn-resize'
                                className='tab__play btn-sun-time-play' onClick={onClickPlay}><BsPlay/></Button>
                    </div>


                </div>
            </div>
        </>
    );
}

export default IrradianceProperties;