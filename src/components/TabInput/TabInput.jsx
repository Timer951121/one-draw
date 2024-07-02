import React from 'react';

const STYLES = [
    "input-sm",
    "input-md",
    "input-lg"
];

const ALIGN = [
    "input-block",
    "input-flex"
];

const TabInput = ({className, label, placeholder, initValue, variant, unit, align, readOnly, property}) => {
    const setInputStyle = STYLES.includes(variant) ? variant : STYLES[0];
    const setInputAlign = ALIGN.includes(align) ? align : ALIGN[0];

    return (
        <div className={`tab__input ${setInputAlign} ${className}`}>
            <span className='tab__input--label'>{label}</span>
            <div className={`tab__input--flex ${className}`}>
                <input
                    id={`input${property}`}
                    type='text'
                    className={`tab__input--field ${setInputStyle}`}
                    value={initValue || 0}
                    placeholder={placeholder}
                    readOnly={readOnly}
                />
                <span className='tab__input--unit'>{unit}</span>
            </div>
        </div>
    );
}

export default TabInput;