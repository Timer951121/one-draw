import {Frustum, Matrix4, Quaternion, Vector3,} from 'three';
import { logger } from '../../../services/loggingService';

/**
 * This is a class to check whether objects are in a selection area in 3D space
 */

const _frustum = new Frustum();
const _center = new Vector3();

const _tmpPoint = new Vector3();

const _vecNear = new Vector3();
const _vecTopLeft = new Vector3();
const _vecTopRight = new Vector3();
const _vecDownRight = new Vector3();
const _vecDownLeft = new Vector3();

const _vecFarTopLeft = new Vector3();
const _vecFarTopRight = new Vector3();
const _vecFarDownRight = new Vector3();
const _vecFarDownLeft = new Vector3();

const _vectemp1 = new Vector3();
const _vectemp2 = new Vector3();
const _vectemp3 = new Vector3();

const _matrix = new Matrix4();
const _quaternion = new Quaternion();
const _scale = new Vector3();

export default class SelectionBox {

    constructor(camera, scene, deep = Number.MAX_VALUE) {

        this.camera = camera;
        this.scene = scene;
        this.startPoint = new Vector3();
        this.endPoint = new Vector3();
        this.collection = [];
        this.instances = {};
        this.deep = deep;

    }

    select(startPoint, endPoint) {

        this.startPoint = startPoint || this.startPoint;
        this.endPoint = endPoint || this.endPoint;
        this.collection = [];

        this.updateFrustum(this.startPoint, this.endPoint);
        this.searchChildInFrustum(_frustum, this.scene);

        return this.collection;

    }

    updateFrustum(startPoint, endPoint) {

        startPoint = startPoint || this.startPoint;
        endPoint = endPoint || this.endPoint;

        // Avoid invalid frustum

        if (startPoint.x === endPoint.x) {

            endPoint.x += Number.EPSILON;

        }

        if (startPoint.y === endPoint.y) {

            endPoint.y += Number.EPSILON;

        }

        this.camera.updateProjectionMatrix();
        this.camera.updateMatrixWorld();

        if (this.camera.isPerspectiveCamera) {

            _tmpPoint.copy(startPoint);
            _tmpPoint.x = Math.min(startPoint.x, endPoint.x);
            _tmpPoint.y = Math.max(startPoint.y, endPoint.y);
            endPoint.x = Math.max(startPoint.x, endPoint.x);
            endPoint.y = Math.min(startPoint.y, endPoint.y);

            _vecNear.setFromMatrixPosition(this.camera.matrixWorld);
            _vecTopLeft.copy(_tmpPoint);
            _vecTopRight.set(endPoint.x, _tmpPoint.y, 0);
            _vecDownRight.copy(endPoint);
            _vecDownLeft.set(_tmpPoint.x, endPoint.y, 0);

            _vecTopLeft.unproject(this.camera);
            _vecTopRight.unproject(this.camera);
            _vecDownRight.unproject(this.camera);
            _vecDownLeft.unproject(this.camera);

            _vectemp1.copy(_vecTopLeft).sub(_vecNear);
            _vectemp2.copy(_vecTopRight).sub(_vecNear);
            _vectemp3.copy(_vecDownRight).sub(_vecNear);
            _vectemp1.normalize();
            _vectemp2.normalize();
            _vectemp3.normalize();

            _vectemp1.multiplyScalar(this.deep);
            _vectemp2.multiplyScalar(this.deep);
            _vectemp3.multiplyScalar(this.deep);
            _vectemp1.add(_vecNear);
            _vectemp2.add(_vecNear);
            _vectemp3.add(_vecNear);

            const planes = _frustum.planes;

            planes[0].setFromCoplanarPoints(_vecNear, _vecTopLeft, _vecTopRight);
            planes[1].setFromCoplanarPoints(_vecNear, _vecTopRight, _vecDownRight);
            planes[2].setFromCoplanarPoints(_vecDownRight, _vecDownLeft, _vecNear);
            planes[3].setFromCoplanarPoints(_vecDownLeft, _vecTopLeft, _vecNear);
            planes[4].setFromCoplanarPoints(_vecTopRight, _vecDownRight, _vecDownLeft);
            planes[5].setFromCoplanarPoints(_vectemp3, _vectemp2, _vectemp1);
            planes[5].normal.multiplyScalar(-1);

        } else if (this.camera.isOrthographicCamera) {

            const left = Math.min(startPoint.x, endPoint.x);
            const top = Math.max(startPoint.y, endPoint.y);
            const right = Math.max(startPoint.x, endPoint.x);
            const down = Math.min(startPoint.y, endPoint.y);

            _vecTopLeft.set(left, top, -1);
            _vecTopRight.set(right, top, -1);
            _vecDownRight.set(right, down, -1);
            _vecDownLeft.set(left, down, -1);

            _vecFarTopLeft.set(left, top, 1);
            _vecFarTopRight.set(right, top, 1);
            _vecFarDownRight.set(right, down, 1);
            _vecFarDownLeft.set(left, down, 1);

            _vecTopLeft.unproject(this.camera);
            _vecTopRight.unproject(this.camera);
            _vecDownRight.unproject(this.camera);
            _vecDownLeft.unproject(this.camera);

            _vecFarTopLeft.unproject(this.camera);
            _vecFarTopRight.unproject(this.camera);
            _vecFarDownRight.unproject(this.camera);
            _vecFarDownLeft.unproject(this.camera);

            const planes = _frustum.planes;

            planes[0].setFromCoplanarPoints(_vecTopLeft, _vecFarTopLeft, _vecFarTopRight);
            planes[1].setFromCoplanarPoints(_vecTopRight, _vecFarTopRight, _vecFarDownRight);
            planes[2].setFromCoplanarPoints(_vecFarDownRight, _vecFarDownLeft, _vecDownLeft);
            planes[3].setFromCoplanarPoints(_vecFarDownLeft, _vecFarTopLeft, _vecTopLeft);
            planes[4].setFromCoplanarPoints(_vecTopRight, _vecDownRight, _vecDownLeft);
            planes[5].setFromCoplanarPoints(_vecFarDownRight, _vecFarTopRight, _vecFarTopLeft);
            planes[5].normal.multiplyScalar(-1);

        } else {
            logger.error('THREE.SelectionBox: Unsupported camera type.');
        }

    }

    getPointsOnEdges(planeGeometry, segmentCount = 10) {
        let pointsOnEdges = [];

        // Assuming the plane is a grid, calculate points between vertices
        for (let i = 0; i < planeGeometry.vertices.length; i++) {
            // Calculate adjacent vertices indices (right and bottom neighbors in a grid)
            let rightNeighborIndex = i + 1;
            let bottomNeighborIndex = i + planeGeometry.parameters.widthSegments + 1;

            // Check if right neighbor exists in the same row
            if (Math.floor(rightNeighborIndex / (planeGeometry.parameters.widthSegments + 1)) === Math.floor(i / (planeGeometry.parameters.widthSegments + 1))) {
                for (let j = 0; j <= segmentCount; j++) {
                    let interpolatedPoint = planeGeometry.vertices[i].clone().lerp(planeGeometry.vertices[rightNeighborIndex], j / segmentCount);
                    pointsOnEdges.push(interpolatedPoint);
                }
            }

            // Check if bottom neighbor exists
            if (bottomNeighborIndex < planeGeometry.vertices.length) {
                for (let j = 0; j <= segmentCount; j++) {
                    let interpolatedPoint = planeGeometry.vertices[i].clone().lerp(planeGeometry.vertices[bottomNeighborIndex], j / segmentCount);
                    pointsOnEdges.push(interpolatedPoint);
                }
            }
        }

        return pointsOnEdges;
    }

// Usage example

    searchChildInFrustum(frustum, object) {

        if (object.isMesh || object.isLine || object.isPoints) {

            if (object.isInstancedMesh) {

                this.instances[object.uuid] = [];

                for (let instanceId = 0; instanceId < object.count; instanceId++) {

                    object.getMatrixAt(instanceId, _matrix);
                    _matrix.decompose(_center, _quaternion, _scale);
                    _center.applyMatrix4(object.matrixWorld);

                    if (frustum.containsPoint(_center)) {

                        this.instances[object.uuid].push(instanceId);

                    }

                }

            } else {

                if (object.geometry.boundingSphere === null) object.geometry.computeBoundingSphere();

                _center.copy(object.geometry.boundingSphere.center);


                _center.applyMatrix4(object.matrixWorld);

                //Check here if we can select object if part of it is inside Box Select frustum


                if (frustum.containsPoint(_center)) {

                    this.collection.push(object);

                }

            }

        }

        if (object.children.length > 0) {

            for (let x = 0; x < object.children.length; x++) {

                this.searchChildInFrustum(frustum, object.children[x]);

            }

        }

    }

}

export {SelectionBox};