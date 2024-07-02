import React, {useContext, useEffect} from 'react';
import {ViewerContext} from "../../contexts/ViewerContext";
import {SetCompassDeg} from "../Three-JS-Viewer/Controllers/CameraControl";

import compassImage from '../../assets/img/compass/compass.png';

const Compass = () => {

    const {SceneViewer} = useContext(ViewerContext);

    useEffect(() => {

        if (SceneViewer === null) return;

        const compass = document.getElementById('compassEle');

        var active = false,
            angle = 0,
            rotation = 0,
            startAngle = 0,
            center = {
                x: 0,
                y: 0
            },
            R2D = 180 / Math.PI;

        function start(e) {
            e.preventDefault();
            if (!SceneViewer.viewMode || SceneViewer.viewMode === '2d') return;
            if (SceneViewer.autoRotate) {
                SceneViewer.setAutoRotate(false);
            }
            SceneViewer.setCompassDrag(true);
            angle = (SceneViewer.camRot * R2D - 90) * -1;
            var bb = e.target.getBoundingClientRect(),
                t = bb.top,
                l = bb.left,
                h = bb.height,
                w = bb.width,
                x,
                y;
            center = {
                x: l + w / 2,
                y: t + h / 2
            };
            x = e.clientX - center.x;
            y = e.clientY - center.y;
            startAngle = R2D * Math.atan2(y, x);
            active = true;
        }

        const rotate = (e) => {
            if (!SceneViewer.viewMode || SceneViewer.viewMode === '2d') return;
            e.preventDefault();
            var x = e.clientX - center.x,
                y = e.clientY - center.y,
                d = R2D * Math.atan2(y, x);
            rotation = d - startAngle;
            SceneViewer.setCameraAngle((angle + rotation) / R2D);

            SetCompassDeg(SceneViewer.camera, SceneViewer)


            compass.style.webkitTransform = "rotate(" + (angle + rotation) + "deg)";
        }

        const stop = (e) => {
            if (SceneViewer.camera && active) {
                SceneViewer.setCompassDrag(false);
            }
            active = false;
        }


        compass.addEventListener('mousedown', start, false);

        window.addEventListener('mousemove', (e) => {
            if (active === true) {
                e.preventDefault();
                rotate(e);
                //rotate the camera
            }
        });

        window.addEventListener('mouseup', (e) => {
            //prevent default will cause firefox range slider to not work
            // e.preventDefault();
            stop(e);
        });

    }, [SceneViewer]);

    return (
        <>
            <img src={compassImage} className='compass' id='compassEle' alt={"Compass"}>
            </img>
        </>
    );
}

export default Compass;
