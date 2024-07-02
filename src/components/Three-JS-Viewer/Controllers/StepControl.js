import * as THREE from "three";

import {GetRangeKey} from "./Common";
import {SetTreeTransArr} from "./TransControl";
import {ChangeTreeSize, SetObstPosition, ChangeTreeDelete, ChangeObstDelete,ChangeSelectedTreeShape} from "./ObstructionControl";
import {SetModuleArr} from "./ModuleControl";
import { useSceneStore } from "../../../store/sceneStore";
import { useViewerStore } from "../../../store/store";
import { treeList } from "../Constants/TreeShape";
export function InitStep(self) {
    self.stepArr = [];
    self.stepMax = -1;
    self.stepNum = -1;
    SetStepButton(self.stepMax, self.stepNum);
}

export function AddStep(self, key, object, older, newer) {
    self.stepNum++;
    self.stepArr[self.stepNum] = {key, object, older, newer};
    self.stepMax = self.stepNum;
    SetStepButton(self.stepMax, self.stepNum);
}

export function SetStep(self, stepDir) {
    // const {stepArr, stepNum, stepMax} = self;
    if (self.stepNum === -1 && stepDir === -1) return;
    if (self.stepNum === self.stepMax && stepDir === 1) return;
    const {treeGroup, obstGroup, roofRotY} = self;
    var stepInfo;
    if (stepDir === -1) {
        stepInfo = self.stepArr[self.stepNum];
    } else {
        stepInfo = self.stepArr[self.stepNum + 1];
    }
    const {key, object, older, newer} = stepInfo;

    if (key === 'WallHeight') {
        const wallHeight = (stepDir === -1 ? older : newer);
        self.setWallSize(wallHeight);
        useViewerStore.setState({wallEditedHeight: wallHeight});
    } else if (key.includes('customImage')) {
        const realKey = GetRangeKey(key);
        const stepValue = stepDir === -1 ? older : newer;
        self.updateCustomImageProperty(realKey, stepValue);
    } else if(key === "GhostTree") {
        const treeSelection = (stepDir === -1 ? older : newer);
        self.selTreeArr.forEach( group =>{
            group.delStatus = !group.delStatus;
            ChangeTreeDelete(group, group.delStatus);
            
        })
        //ToggleSelectedTreeDelete(self)
    }
    else if( key === "GhostObstruction") {
        const obstSelection = (stepDir === -1 ? older : newer);
        ChangeObstDelete(self);

    }
    else if (key === 'TreeShape') {
        const treeType = (stepDir === -1 ? older : newer);
        object.forEach((treeId, idx) => {
            const selTree = treeGroup.children.find(tree => {
                return tree.obstId === treeId
            });
            if (!selTree) return;
            let currentType = treeType[idx] || "crown1"
            let newType = treeList.find(item => item.cM === currentType);
            ChangeSelectedTreeShape(self, newType )
        });
    }
    else if (key.includes('Obst')) {
        //self.obstId = undefined;
        const realKey = GetRangeKey(key);
        const stepValue = stepDir === -1 ? older : newer;
        self.obstId = object;
        self.setObstProperty(realKey, stepValue[0])
        useSceneStore.setState({ obstUpdated : !useSceneStore.getState().obstUpdated});
        //self.obstId = undefined;
    } else if (key.includes('Tree')) {
       // SetTreeTransArr(self, true);
        object.forEach(obstId => {
            const treeObj = treeGroup.children.find(tree => {
                return tree.obstId === obstId
            });
            treeObj.select = true;
            useSceneStore.getState().addSelectedTree(treeObj);
        });
        SetTreeTransArr(self);
        const stepValue = stepDir === -1 ? older : newer;
        const realKey = GetRangeKey(key);
        ChangeTreeSize(self, realKey, stepValue);

        // SetTreeTransArr(self, true);
    } else if (key === 'obstMove') {
        const obstObj = obstGroup.children.find(obst => {
            return obst.obstId === object
        });
        const stepValue = stepDir === -1 ? older : newer;
        if (!obstObj) return;
        SetObstPosition(obstObj, stepValue, roofRotY);
    } else if (key === 'treeMove') {
        object.forEach((treeId, idx) => {
            const selTree = treeGroup.children.find(tree => {
                return tree.obstId === treeId
            });
            if (!selTree) return;
            const oldPos = older[idx], newPos = newer[idx];
            const stepValue = stepDir === -1 ? oldPos : newPos;
            selTree.position.set(stepValue.x, stepValue.y, stepValue.z);
        });
    }
    else if (key === 'obstCreate') {
        const obstObj = obstGroup.children.find(obst => {
            return obst.obstId === object
        });
        const stepValue = stepDir === -1 ? false : true;
        obstObj.visible = stepValue;
    } else if (key === 'treeCreate') {
        const selTree = treeGroup.children.find(tree => {
            return tree.obstId === object
        });
        const stepValue = stepDir === -1 ? false : true;
        selTree.visible = stepValue;
    } else if (key === 'material') {
        const selMeshArr = [];
        object.forEach(uuid => {
            self.modelGroup.traverse(child => {
                if (child.uuid === uuid) selMeshArr.push(child);
            });
        });
        selMeshArr.forEach((mesh, idx) => {
            const stepValue = stepDir === -1 ? older[idx] : newer[idx];
            const {map, color} = stepValue;
            if (map && !color) mesh.material = new THREE.MeshStandardMaterial({map});
            else if (!map && color) mesh.material = new THREE.MeshStandardMaterial({color});
        });
    } else if (key === 'module') {
        const modeStr = (stepDir === -1) ? older : newer;
        useViewerStore.setState({localModeInfo: JSON.parse(modeStr)});
        SetModuleArr(self, 'oldMode');
    }
    
    self.stepNum += stepDir;
    SetStepButton(self.stepMax, self.stepNum);
}

export function SetStepButton(stepMax, stepNum) {
    const btnStepUndo = document.getElementsByClassName('btnStepUndo')[0],
        btnStepRedo = document.getElementsByClassName('btnStepRedo')[0];
    if (stepNum > -1) btnStepUndo?.classList.remove('disabled');
    else btnStepUndo?.classList.add('disabled');
    if (stepNum === stepMax) btnStepRedo?.classList.add('disabled');
    else btnStepRedo?.classList.remove('disabled');
}
