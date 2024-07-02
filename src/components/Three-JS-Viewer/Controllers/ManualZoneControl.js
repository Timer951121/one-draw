import * as THREE from "three";

import {AddIndividualMode, GetVerArr} from "./ModuleControl";
import {checkSamePos} from "./PathwayControl";
import {CheckInsidePos} from "./RefreshShade";
import {testMesh} from "./Loader";
import { getModuleMeshInfo, getRoofModuleMeshes } from "./Common";
import { useViewerStore } from "../../../store/store";


export function SetManualZoneModules(self, linePosArr) {
    const lineArr = [];
    for (let i = 0; i < linePosArr.length - 1; i++) {
        lineArr.push({...linePosArr[i]});
    }
    const pos0 = lineArr[0], {roofMeshArr, moduleMeshArr, meshArr} = self;
    let selRoof;
    roofMeshArr.forEach(roof => {
        if (CheckInsidePos(roof.posArr, pos0)) selRoof = roof;
    });
    if (!selRoof) return;

    const showLabel = useViewerStore.getState().isModuleMultiplierLabelVisible;

    const modules = getRoofModuleMeshes(selRoof);
    modules.forEach((item) => {
        const {dir, selSize, x, z} = getModuleMeshInfo(item), newVerInfo = GetVerArr({x, z}, selSize, dir);
        var flagExistModule = false;
        modules.forEach(mesh => {
            const {verArr} = mesh.verInfo;
            if (flagExistModule) return;
            let flagSameVer = true;
            for (let i = 0; i < 4; i++) {
                if (!checkSamePos(verArr[i], newVerInfo.verArr[i])) {
                    flagSameVer = false;
                    break;
                }
            }
            if (flagSameVer) flagExistModule = true;
        });
        if (flagExistModule) return;

        let flagInsideModule = true;
        const newWPosArr = [];
        newVerInfo.verArr.forEach(ver => {
            if (!flagInsideModule) return;
            const cloneTest = testMesh.clone();
            cloneTest.position.set(ver.x, ver.z, 0);
            selRoof.add(cloneTest);
            const worldPos = cloneTest.getWorldPosition(new THREE.Vector3());
            if (!CheckInsidePos(lineArr, worldPos)) flagInsideModule = false;
            selRoof.remove(cloneTest);
            newWPosArr.push(worldPos);
        });
        if (!flagInsideModule) return;

        let flagOverModule = false;
        modules.forEach(mesh => {
            const {x0, x1, z0, z1} = mesh;
            newVerInfo.verArr.forEach(newVer => {
                if ((newVer.x >= x0) && (newVer.x <= x1) && (newVer.z >= z0) && (newVer.z <= z1)) flagOverModule = true;
            });
        });
        if (flagOverModule) return;

        AddIndividualMode(selRoof, item, true, moduleMeshArr, meshArr, showLabel);
    });
}
