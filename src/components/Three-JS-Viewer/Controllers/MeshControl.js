import * as THREE from "three";
import {SetupObstUI} from "./TransControl";
import {AddStep} from "./StepControl";
import { OBB } from 'three/examples/jsm/math/OBB';

export function SetWallMeshArr(self, interObj) {
    const {tabInfo} = self;
    if (interObj && tabInfo === 'Wall Sliding' && interObj.object.name.includes('wallMesh')) {
        const {select} = interObj.object;
        interObj.object.select = !select;
        SetSelWallMeshArr(self);
    }
}

function SetSelWallMeshArr(self) {
    const {wallMeshArr} = self, selWallArr = [];
    wallMeshArr.forEach(wallMesh => {
        const frameMesh = wallMesh.parent.children[1];
        frameMesh.visible = wallMesh.select;
        if (wallMesh.select) {
            selWallArr.push(wallMesh);
        }
    });
    self.selWallArr = selWallArr.length ? selWallArr : wallMeshArr;
}

export function ResetWallMeshArr(self) {
    self.wallMeshArr.forEach(wallMesh => {
        wallMesh.select = false;
        wallMesh.parent.children[1].visible = false;
    });
    self.obstGroup.children.forEach(group => {
        const inGroup = group.children[0].children[0];
        inGroup.children[0].select = false;
        inGroup.children[1].visible = false;
    });
    SetSelWallMeshArr(self);
    SetupObstUI(self);
}


const updateMeshTexture = (meshArr, map, color, type, self) => {
    const uuidArr = [], olderArr = [], newerArr = [];
    meshArr.forEach(mesh => {
        const oldMat = mesh.material, oldMap = oldMat.map, oldColor = oldMat.color.getHex();
        uuidArr.push(mesh.uuid);
        olderArr.push({map: oldMap, color: oldColor});
        newerArr.push({map, color});
        // mesh.material.dispose();
        var material;
        if (type === 'map') material = new THREE.MeshStandardMaterial({map});
        else if (type === 'color') material = new THREE.MeshStandardMaterial({color});
        mesh.material = material;
        mesh.oriMap = material.map;
        mesh.oriColor = material.color.getHex();
    })
    AddStep(self, 'material', uuidArr, olderArr, newerArr);
};

export function ChangeMeshMaterial(meshArr, value, type, self, meshName, textureId) {
    if (meshArr.length === 0) return;

    if (type === 'map') {
        new THREE.TextureLoader().load(value, (map) => {
            if (meshName === 'wall') {
                //rotate texture 90 degrees
                map.rotation = Math.PI / 2;
            }
            map.wrapS = map.wrapT = THREE.RepeatWrapping;

            updateMeshTexture(meshArr, map, null, type, self)

            for (const mesh of meshArr) {
                mesh.userData.textureId = textureId;
                mesh.userData.color = undefined;
            }
        });

    } else if (type === 'color') {
        const color = new THREE.Color(value);
        updateMeshTexture(meshArr, null, color, type, self)

        for (const mesh of meshArr) {
            mesh.userData.textureId = undefined;
            mesh.userData.color = color;
        }
    }
}

export function SetMeshOBB(mesh) {
    mesh.geometry.computeBoundingBox();
    mesh.geometry.userData.obb = new OBB().fromBox3(mesh.geometry.boundingBox);
    mesh.userData.obb = new OBB();
}

export function SetWallMeshOBB(wall, center, firstPos) {
    SetMeshOBB(wall);
    wall.geometry.userData.obb.center = center.clone().sub(firstPos);

    wall.userData.center = center.clone();
    wall.userData.firstPos = {...firstPos};
}

export function UpdateMeshOBB(mesh, spacing) {
    mesh.userData.obb.copy(mesh.geometry.userData.obb);
    mesh.userData.obb.applyMatrix4(mesh.matrixWorld);

    if (spacing) {
        mesh.userData.obb.halfSize.addScalar(spacing / 2);
    }
}

export function UpdateWallMeshOBB(wall, spacing) {
    wall.updateWorldMatrix(true, false);
    UpdateMeshOBB(wall, spacing);
    wall.userData.obb.center = wall.userData.center;
}

export function DoesIntersectOBB(mesh1, mesh2) {
    return mesh1.userData.obb.intersectsOBB(mesh2.userData.obb);
}
