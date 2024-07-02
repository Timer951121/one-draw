import * as THREE from "three";
import {CheckOverObstArr, GetClickObj, GetVerPosArr} from "./Common";
import {GetIdStr} from "./Loader";
import {GetObstTypeGeo, SetOutsideObstPos, SetTreeSize} from "./ObstructionControl";
import {SetTopAlert} from "./TransControl";
import {AddStep} from "./StepControl";
import {CreateModule, SetVirModulePos} from "./ModuleControl";
import { useSceneStore } from "../../../store/sceneStore";
import { MODULE_GRAPH, SHADE_CALCULATIONS, siteCalculationState } from "../../../services/siteCalculationState";
import { SetMeshOBB } from "./MeshControl";

const topCamera = new THREE.PerspectiveCamera(75, 1.5, 0.01, 100);
const topMouse = new THREE.Vector2();
const topRaycaster = new THREE.Raycaster();
topCamera.position.set(0, 70, 0.4);

export function GetRoofPos(posOld, roofArr, cSize) {
    topCamera.aspect = cSize.w / cSize.h;
    topCamera.lookAt(0, 0, 0);
    const ch = 54.3, cw = ch * topCamera.aspect;
    topMouse.x = posOld.x / cw;
    topMouse.y = -posOld.z / ch;

    topRaycaster.setFromCamera(topMouse, topCamera);
    const interInfo = topRaycaster.intersectObjects(roofArr)[0];
    return interInfo;
}

export function SetVirMeshPos(self, e) {
    const {selectType, mapMesh, roofMeshArr, camera, cSize, virObs, virTree} = self;
    if (selectType === 'module') {
        SetVirModulePos(self, e);
        return;
    }
    const intMeshArr = selectType === 'tree' ? [mapMesh] : [...roofMeshArr];
    const interInfo = GetClickObj(e, intMeshArr, camera, cSize);
    if (!interInfo) return;
    const {point, object} = interInfo, {rotX, rotY, houseId, roofFaceId} = object;
    if (selectType === 'obst') {
        virObs.rotation.y = self.roofRotY || 0;
        virObs.children[0].rotation.y = rotY;
        virObs.children[0].children[0].rotation.x = rotX;
        virObs.position.set(point.x, point.y - 0.2, point.z);
        const virMesh = virObs.children[0].children[0].children[0];
        virMesh.rotX = rotX;
        virMesh.rotY = rotY;
        virMesh.roofId = virObs.roofId = roofFaceId;
        virMesh.roofPos = {...point};
    } else if (selectType === 'tree') {
        const roofInter = GetRoofPos(point, roofMeshArr, cSize);
        const roofY = roofInter ? roofInter.point.y : point.y;
        virTree.position.set(point.x, roofY, point.z);
    }
}

export function SetCloneVirObj(self, nodes, parallel) {
    const obstId = GetIdStr(), {
        virModule,
        virObs,
        obstGroup,
        meshArr,
        virTree,
        treeGroup,
        boundGroup,
        roofs,
        moduleMeshArr,
    } = self;
    if (virObs.visible) {
        const cloneObs = virObs.clone(), verPosArr = GetVerPosArr(cloneObs);
        if (!nodes) {
            const overFlag = CheckOverObstArr(obstGroup, moduleMeshArr, virObs.roofId, verPosArr);
            if (overFlag) return;
        }
        const outGroup = cloneObs.children[0], inGroup = outGroup.children[0],
            obsMesh = inGroup.children[0], obsFrame = inGroup.children[1];
        const virMesh = virObs.children[0].children[0].children[0], {rotX, rotY} = virMesh;
        obsFrame.position.y = obsMesh.position.y;
        obsMesh.name = 'obstMesh'
        obsMesh.material = new THREE.MeshStandardMaterial({color: 0xD3D3D3});

        //add edge geometry border to obstMesh
        const edgeGeo = new THREE.EdgesGeometry(obsMesh.geometry);
        const edgeMat = new THREE.LineBasicMaterial({color: 0x000000, linewidth: 2});
        const edgeMesh = new THREE.LineSegments(edgeGeo, edgeMat);
        obsMesh.add(edgeMesh);

        obsMesh.meshType = 'obst';
        obsMesh.castShadow = true;
        meshArr.push(obsMesh);
        cloneObs.obstId = obsMesh.obstId = obstId;
        cloneObs.roofId = obsMesh.roofId = virObs.roofId;
        const boundMesh = boundGroup.children[0];
        const boundOriPos = boundMesh.oriPos, boundNewPos = boundMesh.position, obsPos = cloneObs.position;
        const boundDelta = {x: boundNewPos.x - boundOriPos.x, z: boundNewPos.z - boundOriPos.z};
        cloneObs.oriPos = {
            x: obsPos.x - boundDelta.x,
            y: obsPos.y,
            z: obsPos.z - boundDelta.z
        };

        const verFloor = nodes && parallel;
        inGroup.rotation.set(verFloor ? 0 : rotX, 0, 0);
        outGroup.rotation.set(0, rotY, 0);
        //cloneObs.rotation.y = self.roofRotY || 0;
        obsMesh.verPosArr = GetVerPosArr(cloneObs);

        ['rotX', 'rotY', 'sides', 'radius', 'diameter', 'width', 'length', 'height', 'shapeNum', 'roofId', 'roofPos'].forEach(key => {
            obsMesh[key] = virMesh[key];
        });
        obsMesh.verFloor = verFloor;
        obsMesh.sclY = obsMesh.scale.y;

        SetMeshOBB(obsMesh);
        obstGroup.add(cloneObs);
        obsMesh.worldPos = {x: cloneObs.position.x, y:cloneObs.position.y, z: cloneObs.position.z};
        SetOutsideObstPos(cloneObs, cloneObs.position, roofs[0].faces);
        if (!nodes) AddStep(self, 'obstCreate', obstId);
        else if (obsMesh.shapeNum === 1) obsMesh.nodes = [...nodes];
        siteCalculationState.needsUpdate(SHADE_CALCULATIONS, virObs.roofId);
    } else if (virTree.visible) {
        const cloneTree = virTree.clone(), {crownScl} = virTree.children[0];
        cloneTree.obstId = obstId;
        cloneTree.totalH = virTree.totalH;
        cloneTree.children.forEach((child, idx) => {
            if (idx === 0) child.crownScl = crownScl;
            const {color, map, transparent} = child.material, hexCol = color.getHex();
            child.mapSrc = map;
            child.material = new THREE.MeshStandardMaterial({color: hexCol, map, transparent});
            if (idx === 2) {
                child.material.wireframe = true;
                child.material.transparent = true;
                child.visible = false;
                child.worldPos = {x: child.position.x, z: child.position.z};
            } else child.oriColor = hexCol;
            child.obstId = obstId;
            child.meshType = 'tree';
            child.castShadow = true;
            meshArr.push(child);
        });
        if (cloneTree.position.y > 0) SetTopAlert({title: 'Tree position', content: 'The tree is on roof'});
        cloneTree.select = false;
        useSceneStore.getState().removeSelectedTree(cloneTree)
        let treeArr = [...self.treeGroup.children];
        const treeId = treeArr.length === 0 ? 'A' : treeArr.length < 26 ? String.fromCharCode(65 + treeArr.length) : String.fromCharCode(65 + Math.floor(treeArr.length / 26) - 1) + String.fromCharCode(65 + treeArr.length % 26);
        cloneTree.userData.treeId = treeId;
        treeGroup.add(cloneTree);
        AddStep(self, 'treeCreate', obstId);
        siteCalculationState.needsUpdate(SHADE_CALCULATIONS);
    } else if (virModule.visible) {
        CreateModule(self);
        siteCalculationState.needsUpdate(MODULE_GRAPH);
    }
}

export function SetCopyVirObj(self) {
    const selTree = self.treeGroup.children.find(tree => tree.select === true);
    const selObst = self.obstGroup.children.find(obst => obst.obstId === self.obstId);
    if (selTree) {
        const crownMesh = selTree.children[0], {crownScl} = crownMesh, trunkMesh = selTree.children[1],
            wrapperMesh = selTree.children[2];
        const height = wrapperMesh.scale.y,
            crown_radius = crownMesh.scale.x / crownScl.x,
            crown_height = crownMesh.scale.y / crownScl.y,
            trunk_radius = trunkMesh.scale.x;
        SetTreeSize(self, self.virTree, {height, crown_radius, crown_height, trunk_radius});
    }
    if (selObst) {
        const selMesh = selObst.children[0].children[0].children[0], {shapeNum, sides, scale} = selMesh;
        const virMesh = self.virObs.children[0].children[0].children[0];
        virMesh.geometry = GetObstTypeGeo(shapeNum, sides);
        virMesh.scale.set(scale.x, scale.y, scale.z);
        virMesh.shapeNum = shapeNum;
        virMesh.sides = sides;
        virMesh.width = scale.x;
        virMesh.height = scale.y;
        virMesh.length = scale.z;
        virMesh.radius = scale.x;
        virMesh.diameter = scale.x;

        const virFrame = self.virObs.children[0].children[0].children[1];
        virFrame.geometry = GetObstTypeGeo(shapeNum, sides);
        virFrame.scale.set(scale.x, scale.y, scale.z);
    }
}
