import {SetBtnObstActive} from './ObstructionControl';
import {GetRoofPos} from "./PushControls";
import {AddStep} from "./StepControl";
import {GetAlt} from "./TerrainControl";
import {useViewerStore} from "../../../store/store";
import { useSceneStore } from '../../../store/sceneStore';
import {getPathnameIncludes} from "../../../helpers/getPathname";
import { SHADE_CALCULATIONS, siteCalculationState } from '../../../services/siteCalculationState';


//Move Mesh Functions
export function TransDown(e, self) {
    self.controls.enabled = false;
    self.flagTransChange = true;
    self.selTreeArr.forEach(tree => {
        tree.oriPos = {...tree.position}
    });
    self.transform.object.oriPos = {...self.transform.object.position};
}

export function TransUp(e, self) {
    const {selectType, selTreeArr} = self;
    if (selectType === 'tree') {
        CheckTreeRoof(selTreeArr);
        const selObj = [], oriPosArr = [], newPosArr = [];
        selTreeArr.forEach(group => {
            selObj.push(group.obstId);
            oriPosArr.push({...group.oriPos});
            newPosArr.push({...group.position});
        });
        AddStep(self, 'treeMove', selObj, oriPosArr, newPosArr);
    }

    self.controls.enabled = true;
    self.flagTransChange = false;
}

function CheckTreeRoof(selTreeArr) {
    const flagRoof = selTreeArr.find(tree => {
        return tree.position.y > 0
    });
    if (flagRoof) SetTopAlert({title: 'Tree Position', content: 'Some trees are on roof'});
}

export function TransChange(e, self) {
    const {transform, treeGroup, terrainArr, buildingAlt, mapMesh, roofMeshArr, cSize} = self,
        transObj = transform.object;
    if (!transObj) return;

    const {meshType} = transObj;

    if (meshType === 'tree') {
        const {oriPos, position} = transObj,
            deltaDis = {x: position.x - oriPos.x, z: position.z - oriPos.z};

        treeGroup.children.forEach(group => {
            if (!group.select) return;
            const newPos = {x: group.oriPos.x + deltaDis.x, z: group.oriPos.z + deltaDis.z};
            const roofInter = GetRoofPos(newPos, [mapMesh, ...roofMeshArr], cSize);
            const roofY = roofInter ? roofInter.point.y : GetAlt(terrainArr, newPos, buildingAlt);
            group.position.set(newPos.x, roofY, newPos.z);
        });
        siteCalculationState.needsUpdate(SHADE_CALCULATIONS);
    }
}

export function SetupInputValue(idKey, value, intType) {
    const valueFT = Math.round(value * 32.8084) / 10;
    const inputEle = document.getElementById('input' + idKey),
        rangeEle = document.getElementById('range' + idKey);
    if (inputEle) {
        inputEle.value = intType ? value : valueFT;
    }

    const roofUnitOfMeasure = useViewerStore.getState().roofUnitOfMeasure;

    if (rangeEle) {

        if (idKey.includes("Wall")) {

            if (roofUnitOfMeasure === 'ft') {
                rangeEle.value = valueFT
                inputEle.value = valueFT
            } else if (roofUnitOfMeasure === 'in') {
                rangeEle.value = Math.round(value * 39.37);
                inputEle.value = Math.round(value * 39.37);
            } else {
                rangeEle.value = value.toFixed(2);
            }

            return

        }

        rangeEle.value = intType ? value : valueFT;
    }
}

export function SetupTreeGroup(self, treeId, isRightClick = false) {

    const treeGroup = self.treeGroup.children.find(item => item.obstId === treeId);

    if (getPathnameIncludes("tree") && !isRightClick) {
        if (treeGroup) {
            treeGroup.select = !treeGroup.select;
            useSceneStore.getState().toggleSelectedTree(treeGroup);
        }
    } else if (treeGroup && isRightClick) {
            treeGroup.select = true
            useSceneStore.getState().addSelectedTree(treeGroup);
    }

    SetTreeTransArr(self);

}


export function SetupInputTreeUI(treeTransMesh, treeGroup) {
    const cMesh = treeGroup.children[0], {crownScl, scale} = cMesh,
        cScl = {x: scale.x / crownScl.x, y: scale.y / crownScl.y, z: scale.z / crownScl.z};
    const tScl = treeGroup.children[1].scale, {position} = treeTransMesh;
    const treeSize = {
        TreeTotalHeight: cScl.y + tScl.y / 1.3,
        TreeCrownRadius: cScl.x,
        TreeCrownHeight: cScl.y,
        TreeTrunkRadius: tScl.x * 2,
        TreePosX: position.x,
        TreePosY: position.z
    };
    Object.keys(treeSize).forEach(key => {
        SetupInputValue(key, treeSize[key]);
    });
    SetDelIconUI('tree', treeGroup.delStatus);
}

export function SelectAllTrees(self) {
    var checkAll = true;
    self.treeGroup.children.forEach(tree => {
        if (!tree.select) checkAll = false;
    });
    self.treeGroup.children.forEach(tree => {
        tree.select = !checkAll;
        if (tree.select) {
            useSceneStore.getState().addSelectedTree(tree);
        } else {
            useSceneStore.getState().removeSelectedTree(tree);
        }
    });
    SetTreeTransArr(self);
}

export function SetTreeTransArr(self, clear) {
    self.transform.detach();
    self.selTreeArr = [];
    self.treeTransMesh.visible = false;
    const minPos = {x: Infinity, z: Infinity}, maxPos = {x: -Infinity, z: -Infinity};
    var checkAll = true, checkSelect = false;
    self.treeGroup.children.forEach(group => {
        const {x, z} = group.position;
        if (clear) {
            group.select = false;
            useSceneStore.getState().removeSelectedTree(group);
        }
        if (group.select) {
            group.oriPos = {x, z};
            self.selTreeArr.push(group);
            if (x < minPos.x) minPos.x = x;
            if (x > maxPos.x) maxPos.x = x;
            if (z < minPos.z) minPos.z = z;
            if (z > maxPos.z) maxPos.z = z;
            checkSelect = true;
        } else {
            checkAll = false;
        }

        if (group.select) {
            group.children[0].material.emissive.setHex(0x000ff);
        } else {
            group.children[0].material.emissive.setHex(0x000000);
        }

        // group.children[2].visible = group.select;
    });
    self.transform.detach();
    if (self.selTreeArr.length) {
        const centerX = (minPos.x + maxPos.x) / 2, centerZ = (minPos.z + maxPos.z) / 2;
        self.treeTransMesh.visible = true;
        self.treeTransMesh.position.set(centerX, 0, centerZ);
        self.treeTransMesh.oriPos = {x: centerX, z: centerZ};
        if (self.moveMode) self.transform.attach(self.treeTransMesh);
        SetupInputTreeUI(self.treeTransMesh, self.selTreeArr[0]);
    } else if (self.virTree.visible) {
        SetupInputTreeUI(self.treeTransMesh, self.virTree);
    }
    const btnSelectAllTrees = document.getElementsByClassName('btnSelectAllTrees')[0];
    // const btnTreeMove = document.getElementsByClassName('btnTreeMove')[0];
    // if (btnSelectAllTrees) btnSelectAllTrees.textContent = checkAll ? 'Unselect All' : 'Select All';
    // if (btnTreeMove) {
    //     if (checkSelect) btnTreeMove.classList.remove('disabled');
    //     else btnTreeMove.classList.add('disabled');
    // }
    const btnTreeCopy = document.getElementsByClassName('btnTreeCopy')[0],
        btnTreeDel = document.getElementsByClassName('btnTreeDel')[0];
    if (btnTreeCopy && btnTreeDel) {
        if (checkSelect) {
            btnTreeCopy.classList.remove('disabled');
            btnTreeDel.classList.remove('disabled');
        } else {
            btnTreeCopy.classList.add('disabled');
            btnTreeDel.classList.add('disabled');
        }
    }
}

function GetObstMeshArr(group, selId) {
    const obstMeshArr = [], selMeshArr = [];
    group.children.forEach(obst => {
        const obstMesh = obst.children[0].children[0].children[0];
        if (selId && obstMesh.obstId === selId) {
            obstMesh.select = !obstMesh.select;
            useSceneStore.getState().toggleSelectedObstruction(obstMesh);
        }
        if (obstMesh.select) selMeshArr.push(obstMesh);
        obstMeshArr.push(obstMesh);
    });
    return selMeshArr.length ? selMeshArr : obstMeshArr;
}

export function SetupObstUI(self, newObstId) {
    const {obstGroup, virObs, tabInfo} = self;
    if (tabInfo === 'Obstruction Properties') self.obstId = newObstId;
    else if (tabInfo === 'Obstruction Style') self.obstMeshArr = GetObstMeshArr(obstGroup, newObstId);
    var selObstMesh, selPos = {x: 0, y: 0};
    // const btnObstMove = document.getElementsByClassName('btnObstMove')[0];
    obstGroup.children.forEach(group => {
        const inGroup = group.children[0].children[0], obstMesh = inGroup.children[0], obstFrame = inGroup.children[1];
        if (tabInfo === 'Obstruction Properties') {
            obstFrame.visible = (self.obstId && group.obstId === self.obstId) ? true : false;
            if (self.obstId && group.obstId === self.obstId) {
                selObstMesh = obstMesh;
                selPos = group.position;
                SetupSwitchObstRot(obstMesh.verFloor);
                SetDelIconUI('obst', obstMesh.delStatus);
            }
        } else if (tabInfo === 'Obstruction Style') obstFrame.visible = obstMesh.select;
    });
    if (virObs.visible) {
        selObstMesh = virObs.children[0].children[0].children[0];
    }
    if (selObstMesh) {
        SetBtnObstActive(selObstMesh.shapeNum);
        // if (btnObstMove) btnObstMove.classList.remove('disabled');
    } else {
        SetupSwitchObstRot(false);
        // if (btnObstMove) btnObstMove.classList.add('disabled');
    }

    useSceneStore.getState().setSelectedObstruction(selObstMesh);
    SetupInputObstUI(selObstMesh, selPos);

    const btnObstCopy = document.getElementsByClassName('btnObstCopy')[0],
        btnObstDel = document.getElementsByClassName('btnObstDel')[0];
    if (btnObstCopy && btnObstDel) {
        if (selObstMesh) {
            btnObstCopy.classList.remove('disabled');
            btnObstDel.classList.remove('disabled');
        } else {
            btnObstCopy.classList.add('disabled');
            btnObstDel.classList.add('disabled');
        }
    }
}

export function SetupInputObstUI(selObstMesh, pos) {
    ['Height', 'Width', 'Length', 'Sides', 'Diameter', 'Radius', 'PosX', 'PosY'].forEach(label => {
        const key = label.toLocaleLowerCase();
        var val = key === 'sides' ? 3 : 0.3;
        if (key.includes('pos')) val = 0;
        if (selObstMesh) {
            val = selObstMesh[key];
            if (key === 'radius') val /= 2;
            else if (key === 'posx') val = pos.x;
            else if (key === 'posy') val = pos.y;
        }
        SetupInputValue('Obst' + label, val, label === 'Sides');
    });
}

export function SetupSwitchObstRot(verFloor) {
    const switchObstVer = document.getElementById('switchObstVer');
    if (!switchObstVer) return;
    if (verFloor) switchObstVer.classList.add('toggled');
    else switchObstVer.classList.remove('toggled');
}

export function SetDelIconUI(key, delStatus) {
    const delBtn = document.getElementsByClassName('btn' + key + 'Del')[0];
    if (!delBtn) return;
    if (delStatus) delBtn.classList.add('active');
    else delBtn.classList.remove('active');
}

export function SetTopAlert(info) {
    const alertDiv = document.getElementsByClassName('alert')[0];
    const alertTitle = document.getElementsByClassName('alert__title')[0];
    const alertContent = document.getElementsByClassName('alert__content')[0];
    if (!alertDiv || !alertTitle || !alertContent) return;
    alertTitle.textContent = info.title;
    alertContent.textContent = info.content;
    setTimeout(() => {
        alertDiv.classList.add('open');
    }, 10);
    setTimeout(() => {
        alertDiv.classList.remove('open');
        alertTitle.textContent = '';
        alertContent.textContent = '';
    }, 3000);
}