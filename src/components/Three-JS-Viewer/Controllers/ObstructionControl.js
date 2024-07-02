import * as THREE from "three";
import {CheckOverObstArr, GetClickObj, GetDis, GetVerPosArr} from "./Common";
import {SetDelIconUI, SetupInputObstUI, SetupSwitchObstRot} from "./TransControl";
import {GetRoofPos} from "./PushControls";
import {AddStep} from './StepControl';
import {SetModuleArr, SwitchModuleIrrMat, UpdateMaxFillForRoof} from "./ModuleControl";
import {SetCarportRoof} from "./FlatRoofControl";
import { SHADE_CALCULATIONS, siteCalculationState } from "../../../services/siteCalculationState";
import { logger } from "../../../services/loggingService";

const delOpacity = 0.3;

export function ToggleSelectedTreeDelete(self) {
    const firstGroup = self.selTreeArr[0];
    if (!firstGroup) return;
    const allDelStatusTrue = self.selTreeArr.every(group => group.delStatus === true);
    const newStatus = !allDelStatusTrue;
    self.selTreeArr.forEach(group => {
        ChangeTreeDelete(group, newStatus);
    });

    SetDelIconUI('Tree', newStatus);
    siteCalculationState.needsUpdate(SHADE_CALCULATIONS);
    self.refreshShade(false);
}

export function ChangeTreeDelete(treeGroup, value) {
    treeGroup.delStatus = value;
    treeGroup.children.forEach(child => {
        if (!child.oriColor) return;
        child.material.color.setHex(value ? 0xFF0000 : child.oriColor);
        child.material.map = child.mapSrc;
        child.material.transparent = child.mapSrc ? true : value;
        child.material.opacity = 1;
        child.material.needsUpdate = true;
        child.castShadow = !value;
    });
}

export function ChangeSelectedTreeShape(self, value) {
    const {cM} = value, {selTreeArr, crownMapArr} = self,
        selCrownMap = crownMapArr.find(item => item.crownKey === cM);
    selTreeArr.forEach(group => {
        group.children[0].material = new THREE.MeshStandardMaterial({
            color: 0x90EE90,
            map: selCrownMap,
            transparent: true,
            depthWrite: true,
            side: 1
        });
        group.children[0].userData.crownKey = cM;
    });
    self.refreshShade(false);
}

export function ChangeTreeShape(self, tree, crownKey) {
    const selCrownMap = self.crownMapArr.find(item => item.crownKey === crownKey);

    tree.children[0].material = new THREE.MeshStandardMaterial({
        color: 0x90EE90,
        map: selCrownMap,
        transparent: true,
        depthWrite: true,
        side: 1
    });
    tree.children[0].userData.crownKey = crownKey;
}

export function ChangeTreePos(self, type, value) {
    const {treeTransMesh, treeGroup, roofMeshArr, cSize} = self, axis = type === 'posX' ? 'x' : 'z';
    treeTransMesh.position[axis] = value;
    const {position, oriPos} = treeTransMesh, deltaDis = {x: position.x - oriPos.x, z: position.z - oriPos.z};
    treeGroup.children.forEach(group => {
        if (!group.select) return;
        const newPos = {x: group.oriPos.x + deltaDis.x, z: group.oriPos.z + deltaDis.z};
        const roofInter = GetRoofPos(newPos, roofMeshArr, cSize);
        const roofY = roofInter ? roofInter.point.y : 0;
        group.position.set(newPos.x, roofY, newPos.z);
    });
    siteCalculationState.needsUpdate(SHADE_CALCULATIONS);
    self.refreshShade(false);
}

export function SetTreeSize(self, treeGroup, treeInfo) {
    const {height, crown_radius, crown_height, trunk_radius} = treeInfo;
    const trunk_height = height - crown_height, trunkH = trunk_height * 1.3;
    const crownMesh = treeGroup.children[0], trunkMesh = treeGroup.children[1], wrapperMesh = treeGroup.children[2];
    const {crownScl} = crownMesh;
    crownMesh.scale.set(crown_radius * crownScl.x, crown_height * crownScl.y, crown_radius * crownScl.z);
    crownMesh.position.y = trunk_height;
    trunkMesh.scale.set(trunk_radius, trunkH, trunk_radius);
    trunkMesh.position.y = trunkH / 2;
    wrapperMesh.scale.set(crown_radius / 2 * 1, height * 1, crown_radius / 2 * 1);
    wrapperMesh.position.y = height / 2;
    // wrapperMesh.visible = true;
    // wrapperMesh.material.color.setHex(0xFFFFFF);
    treeGroup.totalH = height;
    // treeGroup.treeInfo = {...treeInfo};
    treeGroup.userData = {...treeGroup.userData, height, crown_radius, crown_height, trunk_radius};
}

export function ChangeTreeSize(self, type, value) {
    const {selTreeArr, pushMode, virTree} = self, virFlag = (pushMode && virTree.visible);
    var selGroup = selTreeArr[0];
    if (virFlag) selGroup = virTree;
    if (!selGroup) return;
    const crownMesh = selGroup.children[0], {crownScl} = crownMesh, trunkMesh = selGroup.children[1];
    if (type === 'height') selGroup.totalH = value;
    const height = type === 'height' ? value : selGroup.totalH;
    const crown_radius = type === 'crown_radius' ? value : crownMesh.scale.x / crownScl.x;
    const crown_height = type === 'crown_height' ? value : crownMesh.scale.y / crownScl.y;
    const trunk_radius = type === 'trunk_radius' ? value : trunkMesh.scale.x;
    if (virFlag) {
        SetTreeSize(self, virTree, {height, crown_radius, crown_height, trunk_radius});
    } else if (!pushMode && selTreeArr.length) {
        selTreeArr.forEach(group => {
            SetTreeSize(self, group, {height, crown_radius, crown_height, trunk_radius});
        });
    }
}

export function GetObstTypeGeo(num, sides) {
    if (num === 1) return new THREE.BoxGeometry(1, 1, 1);
    else if (num === 2) return new THREE.CylinderGeometry(0.6, 0.6, 1, sides || 6);
    else if (num === 3) return new THREE.CylinderGeometry(0.6, 0.6, 1, 16);
}

export function SetBtnObstActive(shapeNum) {
    const btnObstTypeArr = document.getElementsByClassName('btn-obst-type');
    for (let i = 0; i < btnObstTypeArr.length; i++) {
        const element = btnObstTypeArr[i];
        element.classList.remove('active');
    }
    const selBtnObstType = document.getElementsByClassName('btnObstType' + shapeNum);
    if (!selBtnObstType || !selBtnObstType[0]) return;
    selBtnObstType[0].classList.add('active');
    document.getElementById('obstControlCube').style.display = shapeNum === 1 ? 'block' : 'none';
    document.getElementById('obstControlPolygon').style.display = shapeNum === 2 ? 'block' : 'none';
    document.getElementById('obstControlCyliner').style.display = shapeNum === 3 ? 'block' : 'none';
}

function GetObstSel(self) {
    const {obstGroup, obstId, pushMode, virObs} = self;
    let selGroup;
    if (obstId) {
        selGroup = obstGroup.children.find(item => item.obstId === obstId);
    } else if (pushMode && virObs.visible) {
        selGroup = virObs;
    } else {
        return {
            selGroup: null,
            obstMesh: null,
            obstFrame: null,
            inGroup: null,
        };
    }

    const inGroup = selGroup.children[0].children[0];

    return {
        selGroup,
        obstMesh: inGroup.children[0],
        obstFrame: inGroup.children[1],
        inGroup,
    }
}

function ObstUpdated(self, roofId) {
    siteCalculationState.needsUpdate(SHADE_CALCULATIONS, roofId);
}

export function ChangeObstAngle(self) {
    const {selGroup, obstMesh, inGroup} = GetObstSel(self);
    if (!selGroup) return;

    const switchObstVer = document.getElementById('switchObstVer');
    const verFloor = switchObstVer.classList.contains('toggled');
    inGroup.rotation.x = verFloor ? obstMesh.rotX : 0;
    obstMesh.verFloor = !verFloor;
    SetupSwitchObstRot(obstMesh.verFloor);

    ObstUpdated(self, obstMesh.roofId);
}

export function ChangeObstHeight(self, value) {
    const {selGroup, obstMesh, obstFrame} = GetObstSel(self);
    if (!selGroup) return;

    obstMesh.height = value;
    obstMesh.scale.y = obstFrame.scale.y = value;
    obstMesh.position.y = obstFrame.position.y = value / 2;

    ObstUpdated(self, obstMesh.roofId);
}

export function ChangeObstWidth(self, value) {
    const {selGroup, obstMesh, obstFrame} = GetObstSel(self);
    if (!selGroup) return;

    obstMesh.width = value;
    obstMesh.radius = (obstMesh.width + obstMesh.length) / 2;
    obstMesh.diameter = obstMesh.radius;
    if (obstMesh.shapeNum === 1) obstMesh.scale.x = obstFrame.scale.x = value;

    ObstUpdated(self, obstMesh.roofId);
}

export function ChangeObstLength(self, value) {
    const {selGroup, obstMesh, obstFrame} = GetObstSel(self);
    if (!selGroup) return;

    obstMesh.length = value;
    obstMesh.radius = (obstMesh.width + obstMesh.length) / 2;
    obstMesh.diameter = obstMesh.radius;
    if (obstMesh.shapeNum === 1) obstMesh.scale.z = obstFrame.scale.z = value;

    ObstUpdated(self, obstMesh.roofId);
}

export function ChangeObstSides(self, value) {
    const {selGroup, obstMesh, obstFrame} = GetObstSel(self);
    if (!selGroup) return;

    obstMesh.sides = value;
    if (obstMesh.shapeNum === 2) {
        obstMesh.geometry = obstFrame.geometry = GetObstTypeGeo(2, value);
        obstMesh.scale.x = obstFrame.scale.x = obstMesh.radius;
        obstMesh.scale.z = obstFrame.scale.z = obstMesh.radius;
    }

    ObstUpdated(self, obstMesh.roofId);
}

export function ChangeObstDiameter(self, value) {
    const {selGroup, obstMesh, obstFrame} = GetObstSel(self);
    if (!selGroup) return;

    obstMesh.diameter = value;
    obstMesh.width = value;
    obstMesh.length = value;
    obstMesh.radius = value;
    if (obstMesh.shapeNum === 2) {
        obstMesh.scale.x = obstFrame.scale.x = value;
        obstMesh.scale.z = obstFrame.scale.z = value;
    }

    ObstUpdated(self, obstMesh.roofId);
}

export function ChangeObstRadius(self, value, origin) {
    const {selGroup, obstMesh, obstFrame} = GetObstSel(self);
    if (!selGroup) return;

    obstMesh.radius = value;
    obstMesh.width = value;
    obstMesh.length = value;
    obstMesh.diameter = value;
    if (obstMesh.shapeNum === 3 || origin) {
        obstMesh.scale.x = obstFrame.scale.x = value;
        obstMesh.scale.z = obstFrame.scale.z = value;
    }

    ObstUpdated(self, obstMesh.roofId);
}

export function CreateObstBoxMesh(nodes) {
    const shape = new THREE.Shape();
    const center = { x: nodes[0].X, z: nodes[0].Z };
    const height = nodes[0].Y;

    for (let nodeIdx = 1; nodeIdx < nodes.length; nodeIdx++) {
        center.x += nodes[nodeIdx].X;
        center.z += nodes[nodeIdx].Z;
    }

    center.x /= nodes.length;
    center.z /= nodes.length;

    for (let nodeIdx = 0; nodeIdx < nodes.length; nodeIdx++) {
        const x = nodes[nodeIdx].X - center.x;
        const z = nodes[nodeIdx].Z - center.z;

        if (nodeIdx === 0) {
            shape.moveTo(x, z);
        } else {
            shape.lineTo(x, z);
        }
    }

    const mesh = new THREE.Mesh(
        new THREE.ExtrudeGeometry(shape, {
            depth: height,
            bevelEnabled: false,
        }),
        new THREE.MeshStandardMaterial({color: 0xD3D3D3}),
    );

    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(center.x, height, center.z);
    return mesh;
}

export function ChangeObstShape(self, value, nodes) {
    const {selGroup, obstMesh, obstFrame} = GetObstSel(self);

    if (!selGroup) {
        SetBtnObstActive(value);
        return;
    }

    switch (value) {
        case 1:
            obstMesh.geometry = obstFrame.geometry = GetObstTypeGeo(value, obstMesh.sides);
            obstMesh.width = obstMesh.diameter;
            obstMesh.length = obstMesh.diameter;
            obstMesh.scale.x = obstFrame.scale.x = obstMesh.width;
            obstMesh.scale.z = obstFrame.scale.z = obstMesh.length;
            break;
        case 2:
            obstMesh.geometry = obstFrame.geometry = GetObstTypeGeo(value, obstMesh.sides);
            obstMesh.width = obstMesh.diameter;
            obstMesh.length = obstMesh.diameter;
            obstMesh.scale.x = obstFrame.scale.x = obstMesh.width;
            obstMesh.scale.z = obstFrame.scale.z = obstMesh.length;
            break;
        case 3:
            obstMesh.geometry = obstFrame.geometry = GetObstTypeGeo(value, obstMesh.sides);
            obstMesh.width = obstMesh.diameter;
            obstMesh.length = obstMesh.diameter;
            obstMesh.scale.x = obstFrame.scale.x = obstMesh.width;
            obstMesh.scale.z = obstFrame.scale.z = obstMesh.length;
            break;
    }

    obstMesh.shapeNum = value;
    SetBtnObstActive(value);
    SetupInputObstUI(obstMesh, selGroup.position);

    ObstUpdated(self, obstMesh.roofId);
}

export function ChangeObstDelete(self) {
    const {selGroup} = GetObstSel(self);
    if (!selGroup) return;

    DeleteObst(selGroup, self.modelGroup,self);
}

export function DeleteObst(virObs, modelGroup,self) {
    const inGroup = virObs.children[0].children[0], obstMesh = inGroup.children[0];

    obstMesh.delStatus = !obstMesh.delStatus;
    obstMesh.material.transparent = obstMesh.delStatus;
    obstMesh.material.opacity = obstMesh.delStatus ? delOpacity : 1;
    obstMesh.material.needsUpdate = true;
    SetDelIconUI('Obst', obstMesh.delStatus);
    UpdateMaxFillForRoof(self, obstMesh.roofId);
    siteCalculationState.needsUpdate(SHADE_CALCULATIONS, obstMesh.roofId);
    self.refreshShade(false);

}

export function CheckDragableObst(e, self) {
    const {selTypeMeshArr, camera, cSize, obstGroup, obstId} = self;
    const downObst = GetClickObj(e, selTypeMeshArr, camera, cSize);
    if (downObst && downObst.object && downObst.object.obstId === obstId) {
        const dragObst = obstGroup.children.find(obst => obst.obstId === obstId),
            {rotX, rotY, roofId} = dragObst.children[0].children[0].children[0];
        dragObst.oldInfo = {object: {rotX, rotY, roofFaceId: roofId}, point: {...dragObst.position}};
        return dragObst;
    } else return null;
}

export function SetDragObst(e, self) {
    const {roofMeshArr, camera, cSize, dragObst, roofRotY, roofs, houseTransPos} = self;
    const interInfo = GetClickObj(e, roofMeshArr, camera, cSize);
    if (!interInfo) return;
    SetObstPosition(dragObst, interInfo, roofRotY, roofs[0].faces, houseTransPos);
}

export function PutDragObst(self) {
    const {obstGroup, dragObst, roofRotY, roofs, moduleMeshArr, houseTransPos} = self;
    const verPosArr = GetVerPosArr(dragObst);
    const overFlag = CheckOverObstArr(obstGroup, moduleMeshArr, dragObst.roofId, verPosArr);
    if (overFlag) {
        SetObstPosition(dragObst, dragObst.oldInfo, roofRotY, roofs[0].faces, houseTransPos);
    } else {
        dragObst.children[0].children[0].children[0].verPosArr = verPosArr;
        const {obstId, oldInfo, position, rotX, rotY, roofId} = dragObst;
        const newInfo = {point: {...position}, object: {rotX, rotY}}
        AddStep(self, 'obstMove', obstId, oldInfo, newInfo);
        siteCalculationState.needsUpdate(SHADE_CALCULATIONS, roofId);
    }
    self.dragObst = null;
}

export function SetObstPosition(obstObj, interInfo, roofRotY, faces, houseTransPos) {
    const {point, object} = interInfo, {rotX, rotY, roofFaceId} = object;
    const obstMesh = obstObj.children[0].children[0].children[0];
    obstMesh.rotX = rotX || 0;
    obstMesh.rotY = rotY || 0;
    obstMesh.roofId = obstObj.roofId = roofFaceId;
    obstMesh.roofPos = {x: point.x - houseTransPos?.x, y: point.y, z: point.z - houseTransPos?.z};// Encounters error when houseTransPos is undefined
    obstObj.rotation.y = roofRotY || 0;
    obstObj.children[0].rotation.y = rotY || 0;

    SetOutsideObstPos(obstObj, point, faces);
}

export function SetOutsideObstPos(obstObj, oriPos, faces) {
    const inGroup = obstObj.children[0].children[0], obstMesh = inGroup.children[0], obstFrame = inGroup.children[1];
    const {width, length, height, verFloor, rotX} = obstMesh;
    // obstMesh.outside = CheckOutsideFaces(faces, oriPos, width, length);
    if (obstMesh.outside) {
        const top = oriPos.y + height;
        inGroup.rotation.x = 0;
        obstMesh.scale.y = obstFrame.scale.y = top;
        obstMesh.position.y = obstFrame.position.y = top / 2;
        obstObj.position.set(oriPos.x, 0, oriPos.z);
    } else {
        inGroup.rotation.x = verFloor ? 0 : rotX || 0;
        obstMesh.scale.y = obstFrame.scale.y = height;
        obstMesh.position.y = obstFrame.position.y = height / 2;
        obstObj.position.set(oriPos.x, oriPos.y, oriPos.z);
    }
}

export function HideObject(self, type, value) {
    if (type === 'GhostObst') {
        self.obstGroup.children.forEach(group => {
            if (!group.children[0] || !group.children[0].children[0]) return;
            const obstMesh = group.children[0].children[0].children[0];
            if (obstMesh.delStatus) {
                group.visible = !value;
                siteCalculationState.needsUpdate(SHADE_CALCULATIONS, obstMesh.roofId);
            }
        });
    } else if (type === 'GhostTree') {
        var flagChangeTree = false;
        self.treeGroup.children.forEach(group => {
            if (group.delStatus) {
                group.visible = !value;
                flagChangeTree = true;
            }
        });
        if (flagChangeTree) siteCalculationState.needsUpdate(SHADE_CALCULATIONS);
    } else if (type === 'SelTree') {
        var flagChangeTree = false;
        self.treeGroup.children.forEach(group => {
            if (group.select) {
                group.visible = !value;
                flagChangeTree = true;
            }
        });
        if (flagChangeTree) siteCalculationState.needsUpdate(SHADE_CALCULATIONS);
    } else if (type === 'ModuleTexture') {
        SwitchModuleIrrMat(self, value);
    } else if (type === 'ModulePathway') {
        self.flagModulePathway = value;
        SetModuleArr(self);
    } else if (type === 'carport') {
        self.flagCarport = value;
        const rangeWrapperHeightParapet = document.getElementsByClassName('range-wrapper-HeightParapet')[0],
            rangeWrapperWidthParapet = document.getElementsByClassName('range-wrapper-WidthParapet')[0],
            inputHeightParapet = document.getElementById('inputHeightParapet'),
            inputWidthParapet = document.getElementById('inputWidthParapet'),
            rangeHeightParapet = document.getElementById('rangeHeightParapet'),
            rangeWidthParapet = document.getElementById('rangeWidthParapet');
        if (rangeWrapperHeightParapet && rangeWrapperWidthParapet) {
            if (value) {
                rangeWrapperHeightParapet.classList.add('disable');
                rangeWrapperWidthParapet.classList.add('disable');
            } else {
                rangeWrapperHeightParapet.classList.remove('disable');
                rangeWrapperWidthParapet.classList.remove('disable');
            }
            inputHeightParapet.disabled = value;
            inputWidthParapet.disabled = value;
            rangeHeightParapet.disabled = value;
            rangeWidthParapet.disabled = value;
        } else {
            logger.log('no element');
        }
        SetCarportRoof(self);
    }
}

export function SetObstVPos(obstGroup) {
    obstGroup.children.forEach(child => {
        child.vPos = new THREE.Box3().setFromObject(child);
    });
}

export function CheckDefaultObst(obstArr) {
    obstArr.forEach(obst => {
        const obstMesh = obst.children[0].children[0].children[0],
            frameMesh = obst.children[0].children[0].children[1],
            {shapeNum, verPosArr, nodes, width, length} = obstMesh;
        if (shapeNum !== 1) return;
        var disMin = Infinity;
        verPosArr.forEach(verPos => {
            const disNode = GetDis(nodes[0], verPos);
            if (disNode < disMin) {disMin = disNode};
        });
        if (disMin > (width + length) / 10) {
            obstMesh.width = length;
            obstMesh.length = width;
            obstMesh.scale.x = frameMesh.scale.x = length;
            obstMesh.scale.z = frameMesh.scale.z = width;
            obstMesh.verPosArr = GetVerPosArr(obst);
        }
    });
}

export function CustomObstAng(obst) {
    // see https://en.wikipedia.org/wiki/Curve_orientation
    const isClockwise = (points) => {
        const a = points[0];
        const b = points[1];
        const c = points[2];

        return (b.x * c.z + a.x * b.z + a.z * c.x) - (a.z * b.x + b.z * c.x + a.x * c.z) > 0;
    };

    const obstMesh = obst.children[0].children[0].children[0];
    const obstFrame = obst.children[0].children[0].children[1];
    const nodes = obstMesh.nodes?.map(n => new THREE.Vector3(n.X, 0, n.Z));

    if (nodes?.length === 4) {
        if (isClockwise(nodes)) {
            nodes.reverse();
        }

        const p0 = nodes[0];
        const p1 = nodes[1];
        const p2 = nodes[2];
        const p3 = nodes[3];
        const pMid = p0.clone().add(p1).add(p2).add(p3).divideScalar(4);

        const verPosArr = obstMesh.verPosArr.map(v => new THREE.Vector3(v.x, 0, v.z));

        if (isClockwise(verPosArr)) {
            verPosArr.reverse();
        }

        const q0 = verPosArr[0];
        const q1 = verPosArr[1];
        const q2 = verPosArr[2];
        const q3 = verPosArr[3];
        const qMid = q0.clone().add(q1).add(q2).add(q3).divideScalar(4);

        const toPolar = (origin, point) => {
            const dx = point.x - origin.x;
            const dz = point.z - origin.z;

            const atan = Math.atan2(dz, dx);

            return {
                r: Math.sqrt(dx * dx + dz * dz),
                theta: atan > 0 ? atan : atan + 2 * Math.PI,
            };
        };

        let u0, u1, v0, v1;

        if (p0.distanceTo(p1) < p1.distanceTo(p2)) {
            u0 = p1;
            u1 = p2;
        } else {
            u0 = p0;
            u1 = p1;
        }

        if (q0.distanceTo(q1) < q1.distanceTo(q2)) {
            v0 = q1;
            v1 = q2;
        } else {
            v0 = q0;
            v1 = q1;
        }

        const polarP = toPolar(pMid, u0.clone().add(u1).divideScalar(2));
        const polarV = toPolar(qMid, v0.clone().add(v1).divideScalar(2));
        const angle = polarV.theta - polarP.theta;

        obstMesh.rotation.y = angle;
        obstMesh.selfRot = angle;
        obstFrame.rotation.y = angle;
        obstMesh.verPosArr = GetVerPosArr(obst);
    }
}
