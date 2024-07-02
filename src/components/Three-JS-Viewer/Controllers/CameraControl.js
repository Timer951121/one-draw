import * as THREE from "three";

import {ResetLineMesh} from "./LineControl";
import {EmptyGroup} from "./Common";
import { radToDeg } from "three/src/math/MathUtils";

const transTime = 200;

export function SetCameraView(self, viewMode, home) {
    if (self.viewMode === '3d') self.camPos3D = {...self.camera.position};
    var newCamPos;
    if (viewMode === '2d') newCamPos = {x: self.camPos3D.x / 100, y: 100, z: self.camPos3D.z / 100};
    else newCamPos = {x: self.camPos3D.x, y: self.camPos3D.y, z: self.camPos3D.z};

    if (home===true) {
        newCamPos = (viewMode === '2d') ? {x: 0, y: 120, z: 0.1} : {x: 0, y: 90, z: 72};

        self.camera.zoom = 8;
        self.camera.updateProjectionMatrix()
        self.controls.update()

        setTimeout(() => {
            SetCompassDeg(self.camera, self);
        }, transTime + 10);
    }

    self.camera.position.set(newCamPos.x, newCamPos.y, newCamPos.z);
    self.controls.target.set(0, 0, 0);

    self.viewMode = viewMode;
    self.controls.enableRotate = true;
    const {disY, sclY,scale} = self.roofGroup.children[0];
    self.treeGroup.scale.y = viewMode==='2d'?0.1:1;
    self.roofGroup.children.forEach(house=>{
        house.scale.y = viewMode==='2d'?1/house.disY:house.sclY;
    })


    self.obstGroup.children.forEach(obst => {
        const inGroup = obst.children[0].children[0], obstMesh = inGroup.children[0], obstFrame = inGroup.children[1];
        if (viewMode === '2d') obst.position.y = 0.1 * sclY * disY;
        if (viewMode === '2d') obst.position.y = scale.y * obst.posY;
    })
    SetCompassDeg(self.camera, self);

    self.setMeasureMode(false);
    self.setDrawMode(false);
    self.setAutoAlignMode(false);
    ResetLineMesh(self, 'stop');
    EmptyGroup(self.lineGroup);
}

export function SetCameraAngle(self, rot) {
    const {camera, camDis, camPosY} = self;
    const posX = Math.sin(rot) * camDis, posZ = Math.cos(rot) * camDis;
    camera.position.set(posX, camPosY, posZ);
    camera.lookAt(0, 0, 0);
}

export function SetCompassDeg(camera, self) {
    const cameraForward = camera.getWorldDirection(new THREE.Vector3());
    cameraForward.y = 0;

    const forward = new THREE.Vector3(0, 0, 1);
    let angle = cameraForward.angleTo(forward) + Math.PI;

    if (cameraForward.x < 0) {
        angle = 2 * Math.PI - angle;
    }

    const angleDeg = radToDeg(angle);
    self.cameraHeading = angleDeg;

    if (document.getElementById('compassEle')) {
        document.getElementById('compassEle').style.transform = `rotate(${angleDeg}deg)`;
    }
}

export function SetInitCamRotVal(self) {
    const {autoRotate, compassDrag} = self;
    if (!autoRotate && !compassDrag) return;
    self.controls.target.set(0, 0, 0);
    const {camera} = self, {position} = camera, {x, y, z} = position, deltaRot = x < 0 ? Math.PI : 0;
    self.camDis = Math.sqrt(x * x + z * z);
    self.camPosY = y;
    self.camRot = Math.atan(z / x) + deltaRot;
}

const deltaAngle = 0.002;

export function RotateCamera(self) {
    const {camRot, camDis, camPosY, camera} = self;
    if (camera.position.y !== camPosY) {
        SetInitCamRotVal(self);
        return;
    }
    const posX = camDis * Math.cos(camRot), posZ = camDis * Math.sin(camRot);
    camera.position.set(posX, camPosY, posZ);
    camera.lookAt(0, 0, 0);
    SetCompassDeg(camera, self);
    self.camRot += deltaAngle;
}

export function SetTopView(self, val) {
    const {camera, controls} = self;
    if (val) {
        const {position} = camera, {x, y, z} = position
        self.camPos3D = {x, y, z};
        controls.maxPolarAngle = 0.05;
        self.camera.position.set(x / 100, 70, z / 100);
    } else {
        const {x, y, z} = self.camPos3D;
        controls.maxPolarAngle = Math.PI / 2 - 0.1;
        self.camera.position.set(x, y, z);
    }
    self.controls.target.set(0, 0, 0);
    SetCompassDeg(camera, self);
}
