import React, { useContext, useEffect, useState } from 'react';
import { ViewerContext } from "../../contexts/ViewerContext";
import { mapSize } from '../Three-JS-Viewer/Controllers/TerrainControl';
import { FOOT, METER, UnitContext } from '../../contexts/UnitContext';

const STYLES = [
    "range-input",
    "range-slider"
];

const RangeSlider = ({className, label, variant, readOnly, property, settings, preLabel, value, onValueChange}) => {
    const {SceneViewer} = useContext(ViewerContext);
    const {convertQuantityToUnit} = useContext(UnitContext);

    const [sliderValue, setSliderValue] = useState(0)
    const [dragFinished, setDragFinished] =  useState(false)

    useEffect(() => {
        setSliderValue(value)
    },[value]);


    var initVal = 0;

    if (!property) {

    } else if (property === 'SunDate') {
        const dateToday = new Date(), year = dateToday.getFullYear();
        const dateFirst = new Date("01/01/" + year);
        const timeDiffer = dateToday.getTime() - dateFirst.getTime();
        const dayDiffer = timeDiffer / (1000 * 3600 * 24);
        initVal = Math.floor(dayDiffer);
    } else if (property === 'SunTime') {
        const dateToday = new Date(), hour = dateToday.getHours();
        initVal = hour;
    } else if (property.includes('customImage') && SceneViewer?.mapCustom) {
        const {scale, rotation} = SceneViewer?.mapCustom;
        if (property === 'customImageWidth') {
            initVal = Math.round(mapSize * scale.x);
            initVal = Math.round(mapSize * scale.y);
        } else if (property === 'customImageHeight') initVal = Math.round(mapSize * scale.y);
        else if (property === 'customImageOpacity') initVal = 1;
        else if (property === 'customImageScale') initVal = scale.y;
        else if (property === 'customImageRotation') initVal =  Math.round(rotation.z * 180 / Math.PI);
    }


    // // let setValue;
    //  const valueInternal = useState(initVal);

    // if (onValueChange) {
    //  //   setValue = onValueChange;
    // }
    // else {
    //     console.log("value--", value)
    //    // value = valueInternal[0];
    // }

    const [older, setOlder] = useState(initVal);
    const setRangeStyle = STYLES.includes(variant) ? variant : STYLES[0];


    useEffect(()=>{
        if(dragFinished && onValueChange){
            onValueChange(sliderValue)
        }
    },[dragFinished])


    const handleValueChange = (e) => {
        setDragFinished(false)
        const {value, type} = e.target;
        const meterValue = convertQuantityToUnit(parseFloat(value), FOOT, METER);
        const intValue = parseInt(value);
        const floatValue = parseFloat(value);
        if (isNaN(meterValue) || isNaN(intValue) || isNaN(floatValue)) return;

        let val = null;
        //Check value user is trying to change
        switch (property) {
            case "SunDate":
                val = intValue;
                SceneViewer.updateSunPath('date', intValue);
                break;
            case "SunTime":
                val = floatValue;
                SceneViewer.updateSunPos('time', floatValue);
                break;
            case "customImageHeight":
                val = floatValue;
                SceneViewer.updateCustomImageProperty('height', floatValue);
                break;
            case "customImageWidth":
                val = floatValue;
                SceneViewer.updateCustomImageProperty('width', floatValue);
                break;
            case "customImageScale":
                val = floatValue;
                SceneViewer.updateCustomImageProperty('scale', floatValue);
                break;
            case "customImageRotation":
                val = intValue;
                SceneViewer.updateCustomImageProperty('rotation', intValue);
                break;
            default:
                break
        }

        if (type === 'text') {
            switch (property) {
                case "HeightFlatRoof":
                    SceneViewer.setFlatRoofProperty('height', meterValue);
                    break;
                case "AzimuthFlatRoof":
                    SceneViewer.setFlatRoofProperty('azimuth', parseInt(intValue));
                    break;
                case "PitchFlatRoof":
                    SceneViewer.setFlatRoofProperty('pitch', parseInt(intValue));
                    break;
                case "PosXFlatRoof":
                    SceneViewer.setFlatRoofProperty('posX', meterValue);
                    break;
                case "PosYFlatRoof":
                    SceneViewer.setFlatRoofProperty('posY', meterValue);
                    break;
                case "SclXFlatRoof":
                    SceneViewer.setFlatRoofProperty('sclX', meterValue);
                    break;
                case "SclYFlatRoof":
                    SceneViewer.setFlatRoofProperty('sclY', meterValue);
                    break;
                case "HeightParapet":
                    SceneViewer.setFlatRoofProperty('ppHeight', meterValue);
                    break;
                case "WidthParapet":
                    SceneViewer.setFlatRoofProperty('ppWidth', meterValue);
                    break;
                case "DisLineSnap":
                    SceneViewer.setDisLineSnap(meterValue);
                    break;
                default:
                    break
            }
        }
        setSliderValue(floatValue.toFixed(2));
        //onValueChange?.(floatValue.toFixed(2));
    };



    const onMouseUp = (e) => {
        setDragFinished(true)
        if (!property || !SceneViewer.roofs) return;
        const newer = e.target.value;
        const meterOld = parseFloat(older) * 0.3048, intOld = parseInt(older), floatOld = parseFloat(older);
        const meterNew = parseFloat(newer) * 0.3048, intNew = parseInt(newer), floatNew = parseFloat(newer);
        if (isNaN(meterNew) || isNaN(intNew) || isNaN(floatNew)) return;
        var oldVal = meterOld, newVal = meterNew;

        switch (property) {
            case "SunDate":
                oldVal = intOld;
                newVal = intNew;
                break;
            case "SunTime":
                oldVal = floatOld;
                newVal = floatNew;
                break;
            case "customImageHeight":
                oldVal = floatOld;
                newVal = floatNew;
                break;
            case "customImageWidth":
                oldVal = floatOld;
                newVal = floatNew;
                break;
            case "customImageRotation":
                oldVal = intOld;
                newVal = intNew;
                break;
            case "HeightFlatRoof":
                SceneViewer.setFlatRoofProperty('height', meterNew);
                break;
            case "AzimuthFlatRoof":
                SceneViewer.setFlatRoofProperty('azimuth', parseInt(newer));
                break;
            case "PitchFlatRoof":
                SceneViewer.setFlatRoofProperty('pitch', parseInt(newer));
                break;
            case "PosXFlatRoof":
                SceneViewer.setFlatRoofProperty('posX', meterNew);
                break;
            case "PosYFlatRoof":
                SceneViewer.setFlatRoofProperty('posY', meterNew);
                break;
            case "SclXFlatRoof":
                SceneViewer.setFlatRoofProperty('sclX', meterNew);
                break;
            case "SclYFlatRoof":
                SceneViewer.setFlatRoofProperty('sclY', meterNew);
                break;
            case "HeightParapet":
                SceneViewer.setFlatRoofProperty('ppHeight', meterNew);
                break;
            case "WidthParapet":
                SceneViewer.setFlatRoofProperty('ppWidth', meterNew);
                break;
            case "DisLineSnap":
                SceneViewer.setDisLineSnap(meterNew);
                break;
            default:
                break
        }
        var selObj, skipAdd, flagZero = false;
        if (property.includes('Obst')) {
            if (SceneViewer.obstId) selObj = SceneViewer.obstId;
            else skipAdd = true;
            flagZero = true;
        } else if (property.includes('Sun') || property.includes('FlatRoof') || property.includes('Parapet')) {
            skipAdd = true;
        } else if (property.includes('Tree')) {
            selObj = [];
            SceneViewer.selTreeArr.forEach(group => {
                selObj.push(group.obstId)
            });
            if (selObj.length === 0) skipAdd = true;
            flagZero = true;
        } else if (property.includes('FlatRoof')) {
            skipAdd = true;
        }
        if (flagZero) {
            if (oldVal === 0) oldVal = 1;
            if (newVal === 0) newVal = 1;
        }

        if (!skipAdd) SceneViewer.addStep(property, selObj, oldVal, newVal);
    }

    return (
        <>
            <div className={`range range-wrapper range-wrapper-${property}`}>
                <div className={`range__slider ${setRangeStyle}`}>
                    {preLabel &&
                        <div
                            className={`range__preLabel ${preLabel.length > 3 ? 'long_preLabel' : ''}`}>{preLabel}</div>
                    }
                    <div className={`range__input ${className}`}>
                        <input
                            type='range'
                            id={`range${property}`}
                            min={settings ? settings.min : 0}
                            max={settings ? settings.max : 20}
                            step={settings ? settings.step : 0.5}
                            value={sliderValue || 0}
                            onInput={handleValueChange}
                            onMouseUp={onMouseUp}
                        />
                    </div>
                    <div className='range__wrapper'>
                        <input
                            id={`input${property}`}
                            type='text'
                            value={sliderValue || 0}
                            className='range__value'
                            readOnly={readOnly}
                            onChange={e=>{}} // handleValueChange
                        />
                        <span className='range__label'>{label}</span>
                    </div>
                </div>
            </div>
        </>
    );
}

export default RangeSlider;
