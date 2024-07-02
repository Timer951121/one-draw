import React, {useContext} from "react";
import {BiReset} from 'react-icons/bi';
import {Accordion, Button, ColorPicker} from '../../../components';
import {FiTrash2} from 'react-icons/fi';
import {UserContext} from "../../../contexts/UserContext";

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


const data = [
    {
        id: 1,
        img: wallTexture1,
        alt: 'Wall Siding Image'
    },
    {
        id: 2,
        img: wallTexture2,
        alt: 'Wall Siding Image'
    },
    {
        id: 3,
        img: wallTexture3,
        alt: 'Wall Siding Image'
    }
    ,
    {
        id: 4,
        img: wallTexture4,
        alt: 'Wall Siding Image'
    }
    ,
    {
        id: 5,
        img: wallTexture5,
        alt: 'Wall Siding Image'
    }
    ,
    {
        id: 6,
        img: wallTexture6,
        alt: 'Wall Siding Image'
    }
    ,
    {
        id: 7,
        img: wallTexture7,
        alt: 'Wall Siding Image'
    }
    ,
    {
        id: 8,
        img: wallTexture8,
        alt: 'Wall Siding Image'
    }
    ,
    {
        id: 9,
        img: wallTexture9,
        alt: 'Wall Siding Image'
    }
    ,
    {
        id: 10,
        img: wallTexture10,
        alt: 'Wall Siding Image'
    }
    ,
    {
        id: 11,
        img: wallTexture11,
        alt: 'Wall Siding Image'
    }
    ,
    {
        id: 12,
        img: wallTexture12,
        alt: 'Wall Siding Image'
    }
    ,
    {
        id: 13,
        img: wallTexture13,
        alt: 'Wall Siding Image'
    }
    ,
    {
        id: 14,
        img: wallTexture14,
        alt: 'Wall Siding Image'
    }
    ,
    {
        id: 15,
        img: wallTexture15,
        alt: 'Wall Siding Image'
    }
    ,
    {
        id: 16,
        img: wallTexture16,
        alt: 'Wall Siding Image'
    }
    ,
    {
        id: 17,
        img: wallTexture17,
        alt: 'Wall Siding Image'
    }
    ,
    {
        id: 18,
        img: wallTexture18,
        alt: 'Wall Siding Image'
    }

];



const WallSiding = () => {

    const {SceneViewer} = useContext(ViewerContext);


    const changeWallTextureHandler = (e) => {

        //remove active class from all li
        const li = document.querySelectorAll('.pattern__img');
        li.forEach((item) => {
                item.classList.remove('active');
            }
        );
        e.target.parentNode.classList.add('active');

        SceneViewer.setMeshTexture(SceneViewer.wallMeshArr, e.target.src, "wall", e.target.attributes['data-texture-id'].value);

    }

    const resetWallTextureHandler = () => {
        SceneViewer.resetWallToDefault();
    }

    return (
        <>
            <div className="tab__inner">
                <div className="tab__title">
                    <span className="tab__title--text">Wall Siding</span>
                    <div className="tab__title--btns">
                        <Button
                            style={{
                                display: 'none',
                            }}
                            onClick={resetWallTextureHandler}
                            variant='btn-clear' size='btn-resize'>
                            <BiReset/>
                        </Button>
                    </div>
                </div>

                <div className="tab__column">
                    <Accordion title='Select Wall Style' active={true}>
                        <ul className='pattern'>
                            {data.map((item, index) => (
                                <li className='pattern__item' key={index}>
                                    <Button
                                        variant='btn-clear'
                                        size='btn-resize'
                                        className='pattern__img'
                                        title={item.alt}
                                    >
                                        <img style={{}} onClick={changeWallTextureHandler} src={item.img} alt={item.alt}
                                             data-texture-id={item.id}/>
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </Accordion>
                </div>

                <div className="tab__column">
                    <div className="tab__flex justify-between mb-2">
                        <span className="tab__column--subtitle">Wall Color</span>
                        <ColorPicker colorChangeObject={"wall"}/>
                    </div>
                </div>
            </div>
        </>
    );
};

export default WallSiding;
