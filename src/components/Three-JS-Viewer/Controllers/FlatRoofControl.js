import * as THREE from "three";
import {m2ft} from "../Constants/Default";
import {CreateRoof, GetIdStr} from "./Loader";
import {GetRadVal, sortFacePosArr} from "./Common";
import { ACCESS_MULTIPLIERS, SHADE_CALCULATIONS, siteCalculationState } from "../../../services/siteCalculationState";

export const flatCol = 0xDDDDDD, selFlatCol = 0xFF0000;

export function SetupFlatRoof(self, interObj) {
    const flatRoofArr = self.roofMeshArr.filter(item => {
        return item.flatRoof === true
    });
    flatRoofArr.forEach(item => {
        item.material.color.setHex(item.oriColor);
        item.material.map = item.oriMap;
    });
    self.selFlatRoof = undefined;
    if (!interObj) return;
    SelectFlatRoof(self, interObj.object.roofFaceId)
}

export function SelectFlatRoof(self, selRoofId) {
    const divSettingFlatRoof = document.getElementById('settingFlatRoof');
    if (!self || !selRoofId) {
        if (divSettingFlatRoof) divSettingFlatRoof.style.visibility = 'hidden';
        return;
    }
    self.selFlatRoof = self.roofMeshArr.find(item => item.roofFaceId === selRoofId);
    const selRoofInfo = self.roofs[0].faces.find(item => item.roofFaceId === selRoofId);
    if (!self.selFlatRoof || !selRoofInfo) return;
    self.selFlatRoof.material.color.setHex(selFlatCol);
    self.selFlatRoof.material.map = undefined;

    const {height, oriAng, pos, scl, ppInfo} = selRoofInfo, {azimuth, tilt} = oriAng;
    self.selRoofInfo = selRoofInfo;

    divSettingFlatRoof.style.visibility = 'visible';
    const inputHeightFlatRoof = document.getElementById('inputHeightFlatRoof');
    const rangeHeightFlatRoof = document.getElementById('rangeHeightFlatRoof');
    const inputAzimuthFlatRoof = document.getElementById('inputAzimuthFlatRoof');
    const rangeAzimuthFlatRoof = document.getElementById('rangeAzimuthFlatRoof');
    const inputPitchFlatRoof = document.getElementById('inputPitchFlatRoof');
    const rangePitchFlatRoof = document.getElementById('rangePitchFlatRoof');
    const inputPosXFlatRoof = document.getElementById('inputPosXFlatRoof');
    const rangePosXFlatRoof = document.getElementById('rangePosXFlatRoof');
    const inputPosYFlatRoof = document.getElementById('inputPosYFlatRoof');
    const rangePosYFlatRoof = document.getElementById('rangePosYFlatRoof');
    const inputSclXFlatRoof = document.getElementById('inputSclXFlatRoof');
    const rangeSclXFlatRoof = document.getElementById('rangeSclXFlatRoof');
    const inputSclYFlatRoof = document.getElementById('inputSclYFlatRoof');
    const rangeSclYFlatRoof = document.getElementById('rangeSclYFlatRoof');
    const settingPlaneFlatRoof = document.getElementById('settingPlaneFlatRoof');
    const inputHeightParapet = document.getElementById('inputHeightParapet');
    const rangeHeightParapet = document.getElementById('rangeHeightParapet');
    const inputWidthParapet = document.getElementById('inputWidthParapet');
    const rangeWidthParapet = document.getElementById('rangeWidthParapet');
    if (!inputHeightFlatRoof || !rangeHeightFlatRoof || !inputAzimuthFlatRoof || !inputPitchFlatRoof) return;
    inputHeightFlatRoof.value = rangeHeightFlatRoof.value = Math.round(height * m2ft * 100) / 100;
    inputAzimuthFlatRoof.value = rangeAzimuthFlatRoof.value = Math.round(azimuth * 100) / 100;
    inputPitchFlatRoof.value = rangePitchFlatRoof.value = Math.round(tilt * 100) / 100;

    inputHeightParapet.value = rangeHeightParapet.value = Math.round(ppInfo.h * m2ft * 100) / 100;
    inputWidthParapet.value = rangeWidthParapet.value = Math.round(ppInfo.w * m2ft * 100) / 100;

    settingPlaneFlatRoof.style.visibility = selRoofInfo.plane ? 'visible' : 'hidden';
    if (!selRoofInfo.plane) return;
    inputPosXFlatRoof.value = rangePosXFlatRoof.value = Math.round(pos.x * m2ft * 100) / 100;
    inputPosYFlatRoof.value = rangePosYFlatRoof.value = Math.round(pos.y * m2ft * 100) / 100;
    inputSclXFlatRoof.value = rangeSclXFlatRoof.value = Math.round(scl.x * m2ft * 100) / 100;
    inputSclYFlatRoof.value = rangeSclYFlatRoof.value = Math.round(scl.y * m2ft * 100) / 100;

}

function RemoveObst(self, selRoofId) {
    const {obstGroup, meshArr} = self;
    for (let i = meshArr.length - 1; i >= 0; i--) {
        const mesh = meshArr[i];
        if (mesh.meshType === 'obst' && mesh.roofId === selRoofId) {
            delete meshArr[i]; // meshArr.splice(i, 1);
        }
    }
    for (let i = obstGroup.children.length - 1; i >= 0; i--) {
        const obst = obstGroup.children[i];
        if (obst.roofId === selRoofId) {
            obstGroup.remove(obst);
        }
    }
}

export function SetFlatRoofProperty(self, type, value) {
    const {selFlatRoof, virFlatPoints, virFlatPlane, virPlanePoints, roofGroup, roofs} = self;
    if (!selFlatRoof) return;
    const {roofFaceId} = selFlatRoof, faceIdx = roofs[0].faces.findIndex(face => {
        return face.roofFaceId === roofFaceId
    }), selRoofInfo = self.roofs[0].faces[faceIdx];
    RemoveObst(self, roofFaceId);
    if (type === 'delete') {
        const faces = self.roofs[0].faces.filter(item => {
            return item.roofFaceId !== roofFaceId
        });
        const edges = self.roofs[0].edges.filter(item => {
            return item.roofFaceId !== roofFaceId
        });
        self.roofs[0].faces = [...faces];
        self.roofs[0].edges = [...edges];

        CreateRoof(self);
    } else if (type === 'height') {
        var pos3DArr = [];
        const lines = [];
        self.roofs[0].faces.forEach(face => {
            if (face.roofFaceId !== roofFaceId) return;
            face.posArr.forEach(pos => {
                pos.y = pos.oldY = pos.zeroY + value;
            });
            face.height = value;
            pos3DArr = [...face.posArr];
        });
        const edges = self.roofs[0].edges.filter(item => {
            return item.roofFaceId !== roofFaceId
        });
        pos3DArr.forEach((pos3D, idx) => {
            const nextPos = idx === pos3DArr.length - 1 ? pos3DArr[0] : pos3DArr[idx + 1];
            const points = [pos3D, nextPos], lineId = GetIdStr();
            edges.push({posArr: points, type: 'rake', flat: true, roofFaceId});
            lines.push({points, lineId, pass: true, possiblePathway: true, type: 'RAKE', flatRoof: true});
        });
        const selFace = self.roofs[0].faces.find(item => {
            return item.roofFaceId === roofFaceId
        });
        selFace.lines = [...lines];
        self.roofs[0].edges = [...edges];
        // ReCreateRoof(self, roofFaceId);
        SetCarportRoof(self);
    } else if (type === 'ppHeight' || type === 'ppWidth') {
        self.roofs[0].faces.forEach(face => {
            if (face.roofFaceId !== roofFaceId) return;
            if (type === 'ppHeight') face.ppInfo.h = value;
            else if (type === 'ppWidth') face.ppInfo.w = value;
        });
        ReCreateRoof(self, roofFaceId);
    } else {
        var {pos, scl, oriAng} = selRoofInfo, pos3DArr, {azimuth, tilt} = oriAng, minY = Infinity;
        const {posFlatArr, height, plane} = selRoofInfo, prePosArr = [], lines = [];
        const acPos = roofGroup.children[0].position;

        if (type === 'azimuth') azimuth = value;
        else if (type === 'pitch') tilt = value;
        else if (type === 'posX') pos.x = value;
        else if (type === 'posY') pos.y = value;
        else if (type === 'sclX') scl.x = value;
        else if (type === 'sclY') scl.y = value;
        const rotX = GetRadVal(tilt), rotY = GetRadVal(180 - azimuth) * 1;

        selRoofInfo.oriAng = {azimuth, tilt};

        if (plane) {
            virPlanePoints.children[0].scale.set(scl.x, 1, scl.y);
            virPlanePoints.position.set(pos.x, 0, pos.y);
            virPlanePoints.children[0].rotation.set(rotX, 0, 0);
            virPlanePoints.rotation.set(0, rotY, 0);
            virPlanePoints.children[0].children.forEach(point => {
                const worldPos = point.getWorldPosition(new THREE.Vector3());
                prePosArr.push({x: worldPos.x - acPos.x, y: worldPos.y, z: worldPos.z - acPos.z});
                if (minY > worldPos.y) minY = worldPos.y;
            });
        } else {
            const worldPosArr = [] // , realAng = {azimuth:GetRadVal(azimuth), pitch:GetRadVal(tilt)};
            virFlatPoints.children[0].rotation.set(rotX, 0, 0);
            virFlatPoints.rotation.set(0, rotY, 0);

            virFlatPoints.children[0].children.forEach(point => {
                const worldPos = point.getWorldPosition(new THREE.Vector3());
                worldPosArr.push(worldPos);
            });
            virFlatPlane.setFromCoplanarPoints(worldPosArr[0], worldPosArr[1], worldPosArr[2]);

            posFlatArr.forEach(pos => {
                const line = new THREE.Line3(
                    new THREE.Vector3(pos.x - acPos.x, -100, pos.z - acPos.z),
                    new THREE.Vector3(pos.x - acPos.x, 100, pos.z - acPos.z)
                );
                const interInfo = virFlatPlane.intersectLine(line, new THREE.Vector3());
                if (interInfo) {
                    prePosArr.push(interInfo);
                    if (minY > interInfo.y) minY = interInfo.y;
                }
            });
        }
        pos3DArr = prePosArr; // sortFacePosArr(prePosArr, azimuth);
        pos3DArr.forEach(pos3D => {
            pos3D.zeroY = pos3D.y - minY;
            pos3D.y = pos3D.zeroY + height;
            pos3D.oldY = pos3D.zeroY + height;
        });
        selRoofInfo.pitch = tilt;
        selRoofInfo.azimuth = azimuth;
        selRoofInfo.posArr = [...pos3DArr];
        selRoofInfo.irrDir = {tilt: -tilt, azimuth: -azimuth};
   

        const edges = self.roofs[0].edges.filter(item => {
            return item.roofFaceId !== roofFaceId
        });
        pos3DArr.forEach((pos3D, idx) => {
            const nextPos = idx === pos3DArr.length - 1 ? pos3DArr[0] : pos3DArr[idx + 1];
            const points = [pos3D, nextPos], lineId = GetIdStr();
            edges.push({posArr: points, type: 'rake', flat: true, roofFaceId});
            lines.push({points, lineId, pass: true, possiblePathway: true, type: 'RAKE', flatRoof: true});
        });
        self.roofs[0].edges = [...edges];
        const selFace = self.roofs[0].faces.find(item => {
            return item.roofFaceId === roofFaceId
        });
        selFace.lines = [...lines];
        SetCarportRoof(self);

        if (type === 'azimuth' || type === 'pitch') {
            siteCalculationState.needsUpdate(ACCESS_MULTIPLIERS, faceIdx);
            siteCalculationState.useCalculations(ACCESS_MULTIPLIERS);
        }
    }

    siteCalculationState.needsUpdate(SHADE_CALCULATIONS);
    siteCalculationState.useCalculations(SHADE_CALCULATIONS);
}

export function SetCarportRoof(self) {
    const {selFlatRoof, flagCarport} = self;
    if (!selFlatRoof) return;
    const {roofFaceId} = selFlatRoof;
    self.roofs[0].edges.forEach(edge => {
        if (edge.roofFaceId !== roofFaceId) return;
        edge.carport = flagCarport;
    });
    self.roofs[0].faces.forEach(face => {
        if (face.roofFaceId !== roofFaceId) return;
        face.carport = flagCarport;
    });
    ReCreateRoof(self, roofFaceId);
}

function ReCreateRoof(self, roofFaceId) {
    CreateRoof(self);
    setTimeout(() => {
        SelectFlatRoof(self, roofFaceId);
    }, 100);
}

export function InitFlatRoof(self) {
    const {meshArr, selectType} = self;
    const flatRoofArr = meshArr.filter(item => {
        return item.flatRoof === true
    });
    flatRoofArr.forEach(mesh => {
        mesh.scale.z = selectType === 'surface' ? -0.2 : -mesh.height;
    });
}

export function CreateVirFlatPlane(self) {
    const posSize = 0.01, virFlatIn = new THREE.Group(), virPlaneIn = new THREE.Group();
    const posGeo = new THREE.BoxGeometry(posSize, posSize, posSize),
        posMat = new THREE.MeshStandardMaterial({color: 0x333333}),
        posMesh = new THREE.Mesh(posGeo, posMat);
    [{x: 1, z: 1}, {x: 1, z: -1}, {x: -1, z: -1}, {x: -1, z: 1}].forEach((pos, idx) => {
        const virFlatPos = posMesh.clone(), virPlanePos = posMesh.clone();
        virFlatPos.position.set(pos.x * 10, 0, pos.z * 10);
        virPlanePos.position.set(pos.x / 2, 0, pos.z / 2);
        virFlatIn.add(virFlatPos);
        virPlaneIn.add(virPlanePos);
    });
    self.virFlatPoints = new THREE.Group();
    self.virFlatPoints.add(virFlatIn);
    self.virPlanePoints = new THREE.Group();
    self.virPlanePoints.add(virPlaneIn);
    self.totalGroup.add(self.virFlatPoints, self.virPlanePoints);
    self.virFlatPlane = new THREE.Plane();
}

export function CreateFlatRoofMesh(self, areaValue) {
    const {linePosArr, roofGroup, roofs} = self, posFlatArr = [], lines = [];
    linePosArr.forEach((pos, idx) => {
        if (idx > 0) posFlatArr.push(pos);
    });

    const roofFaceId = GetIdStr(), pos3DArr = [], acPos = roofGroup.children[0].position;
    posFlatArr.forEach(pos => {
        pos3DArr.push({x: pos.x - acPos.x, y: 1, z: pos.z - acPos.z, oldY: 1, zeroY: 0});
    });
    pos3DArr.forEach((pos3D, idx) => {
        const nextPos = idx === pos3DArr.length - 1 ? pos3DArr[0] : pos3DArr[idx + 1];
        const points = [pos3D, nextPos], lineId = GetIdStr();
        roofs[0].edges.push({posArr: points, type: 'rake', flat: true, roofFaceId});
        lines.push({points, lineId, pass: true, possiblePathway: true, type: 'RAKE', flatRoof: true}); // VALLEY
    });

    const idx = roofs[0].faces.length;
    const idStr = idx.toString();
    roofs[0].faces.push({
        roofId: idStr,
        roofFaceId,
        posArr: pos3DArr,
        posFlatArr,
        pitch: 0,
        azimuth: 0,
        irrDir: {tilt: 0, azimuth: 0},
        lines,
        size: areaValue * m2ft * m2ft,
        oriAng: {azimuth: 0, tilt: 0},
        flat: true,
        height: 1,
        acPos,
        ppInfo: {h: 0, w: 0.1}
    });
    CreateRoof(self);

    siteCalculationState.needsUpdate(SHADE_CALCULATIONS);
    siteCalculationState.needsUpdate(ACCESS_MULTIPLIERS, idx);
    siteCalculationState.useCalculations(SHADE_CALCULATIONS, ACCESS_MULTIPLIERS);

    setTimeout(() => {
        SelectFlatRoof(self, roofFaceId);
    }, 100);
}
