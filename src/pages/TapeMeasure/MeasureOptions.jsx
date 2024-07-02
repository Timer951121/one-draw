import React, {useContext} from "react";
import {FiTrash2} from "react-icons/fi";
import {RangeSlider, TabInput} from "../../components";
import {ViewerContext} from "../../contexts/ViewerContext";
import {SetLineSnap} from "../../components/Three-JS-Viewer/Controllers/LineControl";
import { INCH, FOOT, METER, UnitContext } from "../../contexts/UnitContext";
import {Alert} from "antd";

const MeasureOptions = () => {
    const {SceneViewer} = useContext(ViewerContext);
    const resetDraw = () => {
        SceneViewer.resetDraw(false);
    }

    const {unit, renderUnit, renderUnitSquare} = useContext(UnitContext);

    let settingsDisSnap;
    switch (unit) {
        case INCH:
            settingsDisSnap = {min: 12, max: 100, step: 1,};
            break;
        case FOOT:
            settingsDisSnap = {min: 1, max: 9, step: 0.1,};
            break;
        case METER:
            settingsDisSnap = {min: 0.3, max: 3, step: 0.01,};
            break;
    }

    return (
        <>
            <div className="tab__inner">
                <div className="tab__title">
                    <span className="tab__title--text">Measure</span>
                    <div className="tab__title--btns">
                        {/* <FiCopy /> */}
                        <FiTrash2 onClick={resetDraw}/>
                    </div>
                </div>


                <div className='tab__column'>
                    <div className='tab__flex justify-between mb-2'>
                        <span className='tab__column--subtitle mb-0'>Snapping</span>
                        <button className={`toggler`} onClick={() => {
                            SetLineSnap(SceneViewer, !SceneViewer.flagLineSnap);
                        }} id={`switchLineSnapping`}></button>
                    </div>
                    <div id="rangeLineSnap" className="">
                        <span className="tab__column--subtitle">Snap distance</span>
                        <RangeSlider label={renderUnit(unit)} property={'DisLineSnap'} settings={settingsDisSnap}/>
                    </div>
                    <br/>
                    <Alert
                        style={{
                            color: "black"
                        }}
                        message="Toggle this ON to snap the pointer the edges" type="info" showIcon />
                </div>

                <div className="tab__column">
                    <span className="tab__column--title">Length</span>
                    <div className="tab__flex justify-between">
                        <TabInput unit={renderUnit(unit)} readOnly={true} variant='input-lg' value='45.90'
                                  property='MeasureLineLength' className='min-none'/>
                    </div>
                </div>

                <div className="tab__column">
                    <span className="tab__column--title">Area</span>
                    <div className="tab__flex justify-between">
                        <TabInput unit={renderUnitSquare(unit)} readOnly={true} variant='input-lg' value='45.90'
                                  property='MeasureAreaSize' className='min-none'/>
                    </div>
                </div>

            </div>
        </>
    );
};

export default MeasureOptions;
