import React, {useContext, useState} from 'react';
import {ColorPicker as Picker, useColor} from "react-color-palette";
import "react-color-palette/lib/css/styles.css";
import OutsideClickHandler from "react-outside-click-handler";
import Button from "../Button/Button";
import {ViewerContext} from "../../contexts/ViewerContext";
import {hexifyRGBAString} from "../../helpers/colorHelper";

const ColorPicker = ({colorChangeObject, className, onClickHandler}) => {

    const {SceneViewer} = useContext(ViewerContext);
    const [color, setColor] = useColor("hex", "#ff0000");
    const [showPicker, setShowPicker] = useState(false);
    const handlePicker = () => setShowPicker((prev) => !prev);


    const changeWallColorHandler = () => {
        if (color.rgb.a === undefined) {
            color.rgb.a = 1;
        }

        let rgbString = `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})`;

        let hexString = hexifyRGBAString(rgbString);

        switch (colorChangeObject) {
            case "wall":
                SceneViewer.setMeshMaterialColor(SceneViewer.wallMeshArr, hexString);
                break;
            case "roof":
                SceneViewer.setMeshMaterialColor(SceneViewer.roofMeshArr, hexString);
                break;
            case "obstruction":
                SceneViewer.setMeshMaterialColor(SceneViewer.obstMeshArr, hexString);
                break;
        }
    }


    return (
        <div className='color'>
            {showPicker && (
                <OutsideClickHandler
                    onOutsideClick={() => {
                        setShowPicker(false);
                    }}
                >
                    <div className={`color__picker  ${className}`}>
                        <Picker
                            width={250}
                            height={100}
                            color={color}
                            onChange={setColor}
                            hideHSV
                            dark
                            alpha
                        />
                        <Button
                            variant='btn-primary'
                            size='btn-md'
                            onClick={changeWallColorHandler}
                        >
                            Select
                        </Button>

                    </div>
                </OutsideClickHandler>
            )}
            <div
                className='color__block'
                style={{
                    backgroundColor: `${color.hex}`
                }}
                onClick={handlePicker}
            ></div>
        </div>
    );
}

export default ColorPicker;
