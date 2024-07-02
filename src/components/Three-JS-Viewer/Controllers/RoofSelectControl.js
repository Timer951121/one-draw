import * as THREE from "three";
import {useViewerStore} from "../../../store/store";
import {getCenterPoint, SortArray} from "./Common";


export function ShowSelectRoof(self, selInfo) {
    const isTapeMeasureActive = useViewerStore.getState().isTapeMeasureActive;

    if (isTapeMeasureActive) return;

    const {roofMeshArr, camera} = self, selectArr = [];
    var minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    var oldSelectInfo = '', newSelectInfo = '';
    roofMeshArr.forEach(mesh => {
        oldSelectInfo += mesh.selectRoofFace ? mesh.roofFaceId : ''
    });
    roofMeshArr.forEach(mesh => {
        const {oriMap, oriColor, roofFaceId} = mesh;
        if (selInfo) {
            if (selInfo.object.roofFaceId === roofFaceId) {
                // if (mesh.selectRoofFace) mesh.selectRoofFace = false;
                // else mesh.selectRoofFace = Date.now();
                mesh.selectRoofFace = Date.now();
            } else {
                mesh.selectRoofFace = false;
            }
        } else {
            mesh.selectRoofFace = false;
        }
        newSelectInfo += mesh.selectRoofFace ? mesh.roofFaceId : '';

        if (mesh.selectRoofFace) {
            mesh.material.map = undefined;
            mesh.material.color.setHex(0x8AC7DB);

            mesh.moduleCount = mesh.children.filter(item => {
                return item.module
            }).length;
            selectArr.push(mesh);
            mesh.posArr.forEach(pos => {
                const {x, z} = pos;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (z < minZ) minZ = z;
                if (z > maxZ) maxZ = z;
            });
        } else {
            mesh.material.color.setHex(oriColor);
            mesh.material.map = oriMap;
        }
    });


    if (oldSelectInfo !== newSelectInfo) {
        var newCamPos = {x: 0, y: camera.position.y, z: 72}, conPos = {x: 0, y: 0, z: 0}, zoomTar = 10,
            center = {x: 0, y: 0, z: 0};
        if (selectArr.length) {
            const deltaDis = 40;
            const roofRot = selectArr[0].oriAng.azimuth * Math.PI / 180;
            const targetRot = Math.PI - roofRot;
            center = getCenterPoint(selectArr[0]);
            conPos.x = (minX + maxX) / 2;
            conPos.z = (minZ + maxZ) / 2;
            zoomTar = 1000 / Math.max(maxX - minX, maxZ - minZ);
            const dir = {x: Math.sin(targetRot), z: Math.cos(targetRot)}
            newCamPos.x = conPos.x + deltaDis * dir.x;
            newCamPos.z = conPos.z + deltaDis * dir.z;
        }
        self.camera.zoom = zoomTar;
        self.camera.position.set(newCamPos.x, newCamPos.y, newCamPos.z);
        self.controls.target.set(center.x, center.y, center.z);
        self.camera.lookAt(new THREE.Vector3(center.x, center.y, center.z));
        self.camera.updateProjectionMatrix();
    }

    const selRoofFaceArr = SortArray(selectArr, 'selectRoofFace');

    useViewerStore.setState({selRoofFaceArr});

    const wholeRoofInfo = document.getElementById('wholeRoofInfo');
    const selectRoofInfo = document.getElementById('selectRoofInfo');
    if (!wholeRoofInfo || !selectRoofInfo) return;
    wholeRoofInfo.style.display = selRoofFaceArr.length ? 'none' : 'block';
    selectRoofInfo.style.display = selRoofFaceArr.length ? 'block' : 'none';
}



