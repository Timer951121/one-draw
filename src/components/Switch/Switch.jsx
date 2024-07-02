import React, {useContext, useState} from 'react';
import {ViewerContext} from "../../contexts/ViewerContext";

const Switch = ({className, onClick, labelOne, labelTwo, property}) => {

    const {SceneViewer} = useContext(ViewerContext);
    const [toggle, setToggle] = useState(false);
    const handleSwitch = () => {
        if (property === 'ObstVer') SceneViewer.setObstAngle();
        else setToggle(!toggle);
    }

    return (
        <>
            <div className='switch'>
                <button className={`switch__toggle ${className} ${toggle && 'toggled'}`} onClick={handleSwitch}
                        id={`switch${property}`}>
                    <span className='switch__labels'>{labelOne}</span>
                    <span className='switch__labels'>{labelTwo}</span>
                </button>
            </div>
        </>
    );
}

export default Switch;