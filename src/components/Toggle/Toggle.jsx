import React from 'react';
import {Switch} from "antd";

const Toggle = ({on, disabled, onChange = function () {}, size}) => {

    return (
        <Switch
            checked={on}
            disabled={disabled}
            onChange={onChange}
            size={size}
        />
    );
}

export default Toggle;
