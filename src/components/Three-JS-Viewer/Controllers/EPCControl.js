import * as THREE from 'three';
import {CSS2DObject} from 'three/addons/renderers/CSS2DRenderer.js';
import {GetRoundNum} from "./Common";
import ReactDOMServer from 'react-dom/server';
import { ImArrowDown, ImArrowUp } from "react-icons/im";

export function CalculateEPC(modelGroup) {
    const treeLabelGroup = modelGroup.children.find(group => group.name === 'treeLabelGroup');
    const treeArr = [];

    let totalShadeCount = 0;
    modelGroup.traverse(child => {
        if (child.meshType === 'roof' && child.roofFaceId) {
            const shadeArr = child.children.filter(item => item.shadePoint);
            totalShadeCount += shadeArr.length;
        } else if (child.meshType === 'tree') {
            treeArr.push(child);
        }
    })
    const totalCase = totalShadeCount * 12 * 2 * 24; // month * days * hours

    treeArr.forEach(tree => {
        const {incrossArr, parent} = tree, {position} = parent;
        const incrossVal = GetRoundNum((incrossArr?.length ?? 0) / totalCase, 4)
        const labelColor = getLabelCol(incrossVal);
        const treeLabelHeight = tree.parent.totalH + 0.5;
        const content = `${getMultiplierLabelPrefix(true, false, 12)}${incrossVal}`;
        const treeLabelObj = createLabel(content, labelColor, new THREE.Vector3(position.x, treeLabelHeight, position.z));
        treeLabelObj.name = Number(incrossVal);
        treeLabelObj.visible = false;
        tree.parent.userData.multiplier={};
        tree.parent.userData.multiplier.value = incrossVal || '0';
        tree.parent.userData.multiplier.color = labelColor;

        const existingChildIndex = treeLabelGroup.children.findIndex(child => {
            const childPosition = child.position;
            return childPosition.x === treeLabelObj.position.x && childPosition.y === treeLabelObj.position.y && childPosition.z === treeLabelObj.position.z;
        });

        if (existingChildIndex != -1) {
            treeLabelGroup.children[existingChildIndex].element.innerHTML = content;
            treeLabelGroup.children[existingChildIndex].element.style.color = labelColor;
        } else {
            treeLabelGroup.add(treeLabelObj);
        }
    });
}

export function getMultiplierLabelPrefix(upArrow, arrowColor, size) {
    const color = arrowColor ? (upArrow ? '#0f0' : '#f00') : undefined;
    const arrowUpHTML = ReactDOMServer.renderToString(upArrow ? <ImArrowUp size={size} color={color}/> : <ImArrowDown size={size} color={color}/>);
    return `M ${arrowUpHTML}`;
}

export function createLabel(contents, color, position) {
    const div = document.createElement('div');
    div.className = 'tree-epc-label';
    div.style.color = color;
    div.innerHTML = contents;

    const label = new CSS2DObject(div);
    label.labelColor = color;
    label.position.copy(position);
    return label;
}

function getLabelCol(value) {
    var r = 0, g = 0, b = 0;
    if (value <= 0) {
        r = 255;
    } else if (value > 0 && value <= 0.05) {
        var perc = value / 0.05
        g = 255;
        r = Math.round(510 - 5.10 * perc);
    } else if (value > 0.05) {
        g = 255;
    }
    const h = r * 0x10000 + g * 0x100 + b * 0x1;
    const hexStr = '#' + ('000000' + h.toString(16)).slice(-6)
    return hexStr;
}
