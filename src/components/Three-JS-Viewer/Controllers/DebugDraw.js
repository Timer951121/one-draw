import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

export function DebugDrawPoint(self, args) {
    const {position, radius, color, group, opacity} = args;
    const geometry = new THREE.SphereGeometry(radius ?? 0.2, 32, 32);
    const material = new THREE.MeshStandardMaterial({color: color ?? 0xff0000});

    if (opacity !== undefined && opacity < 1) {
        material.transparent = true;
        material.opacity = opacity;
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.userData.debugDraw = true;
    mesh.userData.group = group;
    self.scene.add(mesh);
}

export function DebugDrawLine(self, args) {
    const {start, end, radius, radiusStart, radiusEnd, color, group, opacity} = args;

    const endVector = toVector(end);

    const geometry = new THREE.CylinderGeometry(
        radiusEnd ?? radius ?? 0.025,
        radiusStart ?? radius ?? 0.025,
        toVector(start).sub(endVector).length()
    );
    const material = new THREE.MeshStandardMaterial({color: color ?? 0xff0000});

    if (opacity !== undefined && opacity < 1) {
        material.transparent = true;
        material.opacity = opacity;
    }

    const mesh = new THREE.Mesh(geometry, material);
    const pivot = new THREE.Group();
    pivot.userData.debugDraw = true;
    pivot.userData.group = group;
    pivot.add(mesh);

    pivot.position.copy(toVector(start).add(endVector).divideScalar(2));
    self.scene.add(pivot);

    pivot.lookAt(endVector);
    mesh.rotation.x = Math.PI / 2;
}

export function DebugDrawBox(self, args) {
    let {position, scale, rotation, start, end, box, color, group, opacity} = args;

    if (box) {
        start = box.min;
        end = box.max;
    }

    if (start && end) {
        position = new THREE.Vector3((start.x + end.x) / 2, (start.y + end.y) / 2, (start.z + end.z) / 2);
        scale = new THREE.Vector3(end.x - start.x, end.y - start.y, end.z - start.z);
    }

    const scaleX = scale?.x ?? 1;
    const scaleY = scale?.y ?? 1;
    const scaleZ = scale?.z ?? 1;

    const shape = new THREE.Shape();
    shape.moveTo(-scaleX / 2, -scaleZ / 2);
    shape.lineTo(scaleX / 2, -scaleZ / 2);
    shape.lineTo(scaleX / 2, scaleZ / 2);
    shape.lineTo(-scaleX / 2, scaleZ / 2);

    const geometry = new THREE.ExtrudeGeometry(shape, { depth: scaleY, bevelEnabled: false });
    const material = new THREE.MeshStandardMaterial({color: color ?? 0xff0000});

    if (opacity !== undefined && opacity < 1) {
        material.transparent = true;
        material.opacity = opacity;
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y, position.z);

    if (rotation) {
        mesh.rotation.set(rotation.x + Math.PI / 2, rotation.z, rotation.y);
    } else {
        mesh.rotation.x = Math.PI / 2;
    }

    mesh.userData.debugDraw = true;
    mesh.userData.group = group;
    self.scene.add(mesh);
}

export function DebugDrawPolygon(self, args) {
    const {points, radius, color, group, opacity} = args;

    for (let i = 1; i < points.length; i++) {
        DebugDrawLine(self, {
            start: points[i - 1],
            end: points[i],
            radius: radius,
            color: color,
            group: group,
            opacity: opacity,
        });
    }

    DebugDrawLine(self, {
        start: points[points.length - 1],
        end: points[0],
        radius: radius,
        color: color,
        group: group,
        opacity: opacity,
    });
}

export function DebugDrawLabel(self, args) {
    const {text, position, color, fontSize, group} = args;
    const element = document.createElement('pre');
    element.textContent = text;
    element.style.color = color;
    element.style.fontSize = fontSize;

    const label = new CSS2DObject(element);
    label.position.set(position.x, position.y, position.z);
    label.userData.debugDraw = true;
    label.userData.group = group;
    self.scene.add(label);
}

export function DebugDrawRelativeAxes(self, args) {
    const {object, scale, radius, group, opacity} = args;

    const test = new THREE.Group();
    object.add(test);

    const objPosition = object.getWorldPosition(new THREE.Vector3());

    test.position.set(scale ?? 1, 0, 0);
    const xCoord = test.getWorldPosition(new THREE.Vector3());

    test.position.set(0, scale ?? 1, 0);
    const yCoord = test.getWorldPosition(new THREE.Vector3());

    test.position.set(0, 0, scale ?? 1);
    const zCoord = test.getWorldPosition(new THREE.Vector3());

    object.remove(test);

    DebugDrawLine(self, {
        start: objPosition,
        end: xCoord,
        color: '#ff0000',
        radius: radius,
        group: group,
        opacity: opacity,
    });

    DebugDrawLine(self, {
        start: objPosition,
        end: yCoord,
        color: '#00ff00',
        radius: radius,
        group: group,
        opacity: opacity,
    });

    DebugDrawLine(self, {
        start: objPosition,
        end: zCoord,
        color: '#0000ff',
        radius: radius,
        group: group,
        opacity: opacity,
    });
}

export function DebugDrawOBB(self, args) {
    const {object, spacing, color, group, opacity, geometryObb} = args;

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({color: color ?? 0xff0000});

    if (opacity !== undefined && opacity < 1) {
        material.transparent = true;
        material.opacity = opacity;
    }

    const mesh = new THREE.Mesh(geometry, material);
    const obb = geometryObb
        ? object.geometry.userData.obb
        : object.userData.obb;

    object.updateWorldMatrix(true, false);
    mesh.applyMatrix4(object.matrixWorld);

    if (geometryObb) {
        mesh.position.add(obb.center);
    } else {
        mesh.position.copy(obb.center);
    }

    mesh.scale.set(obb.halfSize.x, obb.halfSize.y, obb.halfSize.z).multiplyScalar(2);

    if (spacing) {
        mesh.scale.addScalar(spacing);
    }

    mesh.userData.debugDraw = true;
    mesh.userData.group = group;
    self.scene.add(mesh);
}

export function ClearDebugDraw(self, group) {
    const toRemove = [];

    for (const child of self.scene.children) {
        if (!child.userData.debugDraw) {
            continue;
        }

        if (!group || child.userData.group === group) {
            toRemove.push(child);
        }
    }

    for (const item of toRemove) {
        self.scene.remove(item);
    }
}

function toVector(v) {
    return new THREE.Vector3(v.x, v.y, v.z);
}
