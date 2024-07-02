import React, {useContext, useState} from 'react';
import {ColorPicker as Picker, useColor} from "react-color-palette";
import "react-color-palette/lib/css/styles.css";
import OutsideClickHandler from "react-outside-click-handler";
import {Button} from "../index";
import {ThemeColorContext} from '../../contexts/ThemeColorContext';

const PrimaryManager = ({className}) => {

    const {primary, setPrimary} = useContext(ThemeColorContext);
    const [color, setColor] = useColor("hex", "#ff0000");
    const [showPicker, setShowPicker] = useState(false);
    const handlePicker = () => setShowPicker((prev) => !prev);

    const changePrimaryColor = () => {
        setPrimary(color.hex);
        setShowPicker(false);
    }

    return (
        <div className='color'>
            {showPicker && (
                <OutsideClickHandler
                    onOutsideClick={() => {
                        setShowPicker(false);
                    }}
                >
                    <div className={`color__picker ${className}`}>
                        <Picker
                            width={250}
                            height={100}
                            color={color}
                            onChange={setColor}
                            hideHSV
                            hideRGB
                            dark
                            alpha
                        />
                        <Button
                            variant='btn-primary'
                            size='btn-md'
                            onClick={changePrimaryColor}
                        >Select</Button>

                    </div>
                </OutsideClickHandler>
            )}
            <div
                className='color__block'
                style={{
                    backgroundColor: `${primary}`
                }}
                onClick={handlePicker}
            ></div>
        </div>
    );
}

export default PrimaryManager;
