import React, {useContext, useEffect} from 'react';
import {Alert} from "antd";
import {ViewerContext} from "../../../contexts/ViewerContext";

const ShadePointProperties = () => {

    const {SceneViewer} = useContext(ViewerContext);

    const [roofWiseShadePoints, setRoofWiseShadePoints] = React.useState([])

    useEffect(() => {
        //split shadepoints based on roof
        SceneViewer.roofMeshArr.forEach((roof)=>{
            const roofChildren = roof.children
            let shadePoints = []
            roofChildren.forEach((child,index)=> {
                if (child.name === 'shadePoint') {
                    shadePoints.push({
                        shadePointName: (index+1),
                        ptHashValue: child.ptHashVal
                    })
                }
            })
            setRoofWiseShadePoints((prevRoofWiseShadePoints) => [
                ...prevRoofWiseShadePoints,
                {
                    roofName: "Roof ID-"+roof.userData.roof_tag_id,
                    shadePoints: shadePoints
                }
            ]
            )
        })
    },[SceneViewer])


    return (
        <>
            <div className='tab__inner'>
                <div className='tab__title'>
                    <span className='tab__title--text tab__title--flex'>Shade Point Properties</span>
                </div>

                <div className='tab__column'>
                    <Alert
                        style={{
                            color: "black"
                        }}
                        message="Blue Spheres indicate the Shade points on the Roof" type="info" showIcon />
                </div>

                <div

                    className='tab__column theme-based-text-color'>
                    <span className='tab__column--subtitle mb-0'>Shade Point Values</span>
                    <br/>

                    <Alert
                        style={{
                            color: "black"
                        }}
                        message="Shade Point Index starts from bottom left" type="info" showIcon />

                    {roofWiseShadePoints.map((roof,index) => {
                        return (
                            <div
                                key={index}>
                                <br/>
                                <span className='tab__column--subtitle'>{roof.roofName}</span>
                                <div
                                    style={
                                        {
                                            height: '200px',
                                            overflow: 'auto'
                                        }
                                    }>



                                <table
                                    className={"tab__table"}

                                    key={index}>
                                    <thead>
                                    <tr
                                        style={{
                                            position: 'sticky',
                                            top: '0',
                                        }}
                                    >
                                        <th>Shade Point</th>
                                        <th>Shade Weight Hash</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {
                                        roof.shadePoints.map((shadePoint) => {
                                            return (

                                                <tr>
                                                    <td>{shadePoint.shadePointName}</td>
                                                    <td>{shadePoint.ptHashValue}</td>
                                                </tr>

                                            )
                                        })}
                                    </tbody>
                                </table>
                                </div>
                                <br/>
                            </div>
                        )
                    })}

                </div>

            </div>
        </>
    );
}

export default ShadePointProperties;