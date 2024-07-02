import React from 'react';
import {buildStyles, CircularProgressbar} from "react-circular-progressbar";

const CircularProgress = ({value, pathColor, label}) => {
    return (
        <>
            <div className='progress'>
                <span className='progress__label'>{label}</span>
                <CircularProgressbar
                    className='progress__circle'
                    value={value}
                    text={`${value}%`}
                    strokeWidth={15}
                    styles={buildStyles({
                        textColor: "#7c7c7c",
                        pathColor: pathColor,
                        trailColor: "#eaeaea",
                        strokeLinecap: "round",
                        textSize: '22px'
                    })}
                />
            </div>
        </>
    );
}

export default CircularProgress;