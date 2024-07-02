import React from "react";

const SolarPallet = ({className}) => {

    const colors = [
            "#B3B3B3",
            "#FF3300",
            "#FF4700",
            "#FF5C00",
            "#FF7000",
            "#FF8F00",
            "#FFA300",
            "#FFC200",
            "#FFD600",
            "#FFFF00"
    ];




    return (
        <>
            <div id="solarAccessLegend" className={`pallet ${className}`}>
                <div className="pallet__values">
                    <span>50%</span>
                    <span>100%</span>
                </div>
                <div className="pallet__wrapper">
                    {colors.map((item, i) => (
                        <div
                            className="pallet__item"
                            style={{backgroundColor: colors[i]}}
                            key={i}
                            title={colors[i]}
                        ></div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default SolarPallet;
