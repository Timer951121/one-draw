import React from 'react';
import {InputNumber, Slider} from 'antd';

const SliderInput = ({settings, onChange, value, unit, onChangeComplete, sliderMarks, hideInput}) => {
    return (
        <div className={"slider-input-container"}>
            <div className={"slider-input-range"}style={hideInput&&{width:"100%"}}>
            <Slider
                min={settings.min}
                max={settings.max}
                step={settings.step}
                onChange={onChange}
                onChangeComplete={onChangeComplete}
                tooltip={{
                    formatter : null
                }}
                value={value}
                marks={sliderMarks}
                style={hideInput&&{marginBottom:"20px"}}
            />
            </div>
            {!hideInput&&(
                <div className={"slider-input-value"}>
                <InputNumber
                    min={settings.min}
                    max={settings.max}
                    step={settings.step}
                    readOnly={true}
                    value={value}
                />
                <label className={"theme-based-text-color"}>{unit}</label>
                </div>
            )}
        </div>
    );
};

export default SliderInput;