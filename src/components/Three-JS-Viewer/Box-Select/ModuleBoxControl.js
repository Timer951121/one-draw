import * as THREE from "three";
import {testMesh} from "../Controllers/Loader";
import { getRoofModuleMeshes } from "../Controllers/Common";

const intCount = 10;

function Get2DPos(obj, cWidth, cHeight, camera) {
    var vector = new THREE.Vector3();
    var widthHalf = 0.5 * cWidth;
    var heightHalf = 0.5 * cHeight;
    obj.updateMatrixWorld();
    vector.setFromMatrixPosition(obj.matrixWorld);
    vector.project(camera);
    vector.x = (vector.x * widthHalf) + widthHalf;
    vector.y = -(vector.y * heightHalf) + heightHalf;
    return {x: vector.x, y: vector.y};
}

export function SetBoxModulesPos(self, mainModule) {
    const {renderer, camera, roofMeshArr} = self;
    const {roofId} = mainModule;
    const selRoof = roofMeshArr.find(item => item.roofFaceId === roofId);
    const moduleArr = getRoofModuleMeshes(selRoof);
    const cSize = renderer.getSize(new THREE.Vector2());

    const cloneMesh = testMesh.clone();
    selRoof.add(cloneMesh);
    moduleArr.forEach((module) => {
        module.grid2DArr = [];
        const {x0, x1, z0, z1, dX, dZ} = module.verInfo, intX = dX / intCount, intZ = dZ / intCount;
        for (let x = x0; x <= x1; x += intX) {
            for (let z = z0; z <= z1; z += intZ) {
                cloneMesh.position.set(x, z, 0);
                const posTest = Get2DPos(cloneMesh, cSize.x, cSize.y, camera);
                module.grid2DArr.push(posTest);
            }
        }
    });
    selRoof.remove(cloneMesh);
}

export function SelectBoxModule(self, mainModule) {
    const {boxPos2D, roofMeshArr} = self;
    const {roofId} = mainModule;
    const {s, e} = boxPos2D;
    const selRoof = roofMeshArr.find(item => item.roofFaceId === roofId);
    const moduleArr = getRoofModuleMeshes(selRoof);
    const x0 = Math.min(s.x, e.x), x1 = Math.max(s.x, e.x),
        y0 = Math.min(s.y, e.y), y1 = Math.max(s.y, e.y);
    moduleArr.forEach(module => {
        const {grid2DArr} = module;
        var cross = false;
        grid2DArr.forEach(gridPos => {
            if (cross) return;
            const {x, y} = gridPos;
            if (x >= x0 && x <= x1 && y >= y0 && y <= y1) cross = true;
        });
        module.select = cross;
        module.material.emissive.set(cross ? 0x00FF00 : 0x000000);
        if(cross){
            module.material.color.setHex(0x00FF00);
        }
    });
}

export function ClearModuleEmissive(moduleArr) {
    moduleArr.forEach(module => {
        module.material.emissive.set(0x000000);
    });
}
