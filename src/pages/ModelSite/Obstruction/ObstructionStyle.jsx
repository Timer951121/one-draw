import React, {useContext} from "react";
import {BiReset} from "react-icons/bi";
import {Accordion, Button, ColorPicker} from "../../../components";

import wallTexture1 from '../../../assets/img/wall-textures/siding_map/wall-siding-type-1.jpg';
import wallTexture2 from '../../../assets/img/wall-textures/siding_map/wall-siding-type-2.jpg';
import wallTexture3 from '../../../assets/img/wall-textures/siding_map/wall-siding-type-3.jpg';
import wallTexture4 from '../../../assets/img/wall-textures/siding_map/wall-siding-type-4.jpg';
import wallTexture5 from '../../../assets/img/wall-textures/siding_map/wall-siding-type-5.jpg';
import wallTexture6 from '../../../assets/img/wall-textures/siding_map/wall-siding-type-6.jpg';
import wallTexture7 from '../../../assets/img/wall-textures/siding_map/wall-siding-type-7.jpg';
import wallTexture8 from '../../../assets/img/wall-textures/siding_map/wall-siding-type-8.jpg';
import wallTexture9 from '../../../assets/img/wall-textures/siding_map/wall-siding-type-9.jpg';
import wallTexture10 from '../../../assets/img/wall-textures/siding_map/wall-siding-type-10.jpg';
import wallTexture11 from '../../../assets/img/wall-textures/siding_map/wall-siding-type-11.jpg';
import wallTexture12 from '../../../assets/img/wall-textures/siding_map/wall-siding-type-12.jpg';
import wallTexture13 from '../../../assets/img/wall-textures/siding_map/wall-siding-type-13.jpg';

import wallTexture14 from '../../../assets/img/wall-textures/brick-map/brick-map-type-1.png';
import wallTexture15 from '../../../assets/img/wall-textures/brick-map/brick-map-type-2.jpg';
import wallTexture16 from '../../../assets/img/wall-textures/brick-map/brick-map-type-3.jpg';
import wallTexture17 from '../../../assets/img/wall-textures/brick-map/brick-map-type-4.jpg';
import wallTexture18 from '../../../assets/img/wall-textures/brick-map/brick-map-type-5.jpg';


import {ViewerContext} from "../../../contexts/ViewerContext";
import {UserContext} from "../../../contexts/UserContext";

const data = [
    {
        id: 1,
        img: wallTexture1,
        alt: 'Wall Siding Image 1'
    },
    {
        id: 2,
        img: wallTexture2,
        alt: 'Wall Siding Image 2'
    },
    {
        id: 3,
        img: wallTexture3,
        alt: 'Wall Siding Image 3'
    }
    ,
    {
        id: 4,
        img: wallTexture4,
        alt: 'Wall Siding Image 4'
    }
    ,
    {
        id: 5,
        img: wallTexture5,
        alt: 'Wall Siding Image 5'
    }
    ,
    {
        id: 6,
        img: wallTexture6,
        alt: 'Wall Siding Image 6'
    }
    ,
    {
        id: 7,
        img: wallTexture7,
        alt: 'Wall Siding Image 7'
    }
    ,
    {
        id: 8,
        img: wallTexture8,
        alt: 'Wall Siding Image 8'
    }
    ,
    {
        id: 9,
        img: wallTexture9,
        alt: 'Wall Siding Image 9'
    }
    ,
    {
        id: 10,
        img: wallTexture10,
        alt: 'Wall Siding Image 10'
    }
    ,
    {
        id: 11,
        img: wallTexture11,
        alt: 'Wall Siding Image 11'
    }
    ,
    {
        id: 12,
        img: wallTexture12,
        alt: 'Wall Siding Image 12'
    }
    ,
    {
        id: 13,
        img: wallTexture13,
        alt: 'Wall Siding Image 13'
    }
    ,
    {
        id: 14,
        img: wallTexture14,
        alt: 'Wall Siding Image 14'
    }
    ,
    {
        id: 15,
        img: wallTexture15,
        alt: 'Wall Siding Image 15'
    }
    ,
    {
        id: 16,
        img: wallTexture16,
        alt: 'Wall Siding Image 16'
    }
    ,
    {
        id: 17,
        img: wallTexture17,
        alt: 'Wall Siding Image 17'
    }
    ,
    {
        id: 18,
        img: wallTexture18,
        alt: 'Wall Siding Image 18'
    }

];



const ObstructionStyle = () => {
    const {user, hasCapability} = useContext(UserContext);

    const {SceneViewer} = useContext(ViewerContext);


    const obstructionTextureChangeHandler = (e) => {
        const li = document.querySelectorAll('.pattern__img');
        li.forEach((item) => {
                item.classList.remove('active');
            }
        );
        e.target.parentNode.classList.add('active');
        SceneViewer.setMeshTexture(SceneViewer.obstMeshArr, e.target.src, "obst", e.target.parentNode.title);
    }

    return (
        <>
           { user ? 
            <div className="tab__inner">
                {
                    hasCapability('Toggle_Siding')  && (
                    <>
                        <div className="tab__title">
                            <span className="tab__title--text">Obstruction Style</span>
                            <div className="tab__title--btns">
                                <Button variant='btn-clear' size='btn-resize'>
                                    <BiReset/>
                                </Button>
                            </div>
                        </div>

                        <>
                            <div className="tab__column">
                                <Accordion title='Select Obstruction Style' active={true}>

                                    <ul className='pattern'>
                                        {data.map((item, index) => (
                                            <li className='pattern__item' key={index}>
                                                <Button
                                                    variant='btn-clear'
                                                    size='btn-resize'
                                                    className='pattern__img'
                                                    title={item.alt}
                                                >
                                                    <img onClick={obstructionTextureChangeHandler} src={item.img}
                                                         alt={item.alt}/>
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>

                                </Accordion>
                            </div>
                        </>

                        <>
                            <div className="tab__column">
                                <div className="tab__flex justify-between">
                                    <span className="tab__column--subtitle">Obstruction Color</span>
                                    <ColorPicker colorChangeObject={"obstruction"}/>
                                </div>
                                <span className='tab__spacer'></span>
                            </div>
                        </>
                    </>
                )
                }
            </div>
            :""
            }
        </>
    );
};

export default ObstructionStyle;
