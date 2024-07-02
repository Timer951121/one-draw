import * as THREE from "three";
import {PCDLoader} from 'three/examples/jsm/loaders/PCDLoader';
import {mapSize} from "./TerrainControl";

export function LoadPCDModel(self) {
    // const testPCD = 'https://app.enerq.ch/pcd/output_1_1.pcd';
    const modelPath = 'https://app.enerq.ch/pcd/output_';
    const pcdInfoArr = [
        {label: '0_0', x: -1, z: -1, color: 0xFF0000},
        {label: '0_1', x: -1, z: 1, color: 0x0000FF},
        {label: '1_0', x: 1, z: -1, color: 0x00FF00},
        {label: '1_1', x: 1, z: 1, color: 0xFFFFFF},
    ];

    const pcdIn = new THREE.Group(), pcdOut = new THREE.Group(), vSize = {x: 0, y: 0, z: 0};

    pcdInfoArr.forEach((item, idx) => {
        const loader = new PCDLoader();
        loader.load(modelPath + item.label + '.pcd', (points) => { // testPCD
            points.material.color.setHex(item.color);
            pcdIn.add(points);
            if (pcdIn.children.length === pcdInfoArr.length) {
                const vPos = new THREE.Box3().setFromObject(pcdIn);
                if (!vPos) return;
                ['x', 'y', 'z'].forEach(axis => {
                    vSize[axis] = vPos.max[axis] - vPos.min[axis];
                    const delta = axis === 'a' ? 0 : vSize[axis] / 2;
                    pcdIn.children.forEach(child => {
                        child.position[axis] -= (vPos.min[axis] + delta);
                    });
                });
                // -238.28500366210938
                console.log(vPos);
                console.log(vSize);
                const scl = mapSize / vSize.x;
                pcdIn.rotation.set(Math.PI / -2, 0, 0);
                pcdOut.scale.set(scl, scl, scl);

                pcdOut.add(pcdIn);
                self.totalGroup.add(pcdOut);
                pcdOut.position.y = 6;

                console.log(pcdIn);
                console.log(pcdOut);
            }
        }, (xhr) => {
            pcdInfoArr[idx].total = xhr.total;
            pcdInfoArr[idx].loaded = xhr.loaded;
            var totalSize = 0, totalLoad = 0;
            pcdInfoArr.forEach(model => {
                totalSize += model.total || 0;
                totalLoad += model.loaded || 0;
            });
            const loadPro = Math.round(totalLoad / totalSize * 100);
            console.log(loadPro + '% loaded');
        }, (error) => {
            console.log(error);
        });
    });
}