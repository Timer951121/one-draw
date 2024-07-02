import {CreateRoof, GetIdStr} from "./Loader";
import {m2ft} from "../Constants/Default";
import {SelectFlatRoof} from "./FlatRoofControl";
import { SwitchModuleIrrMat } from "./ModuleControl";
import sleep from "../../../helpers/sleep";
import { SHADE_CALCULATIONS, siteCalculationState } from "../../../services/siteCalculationState";

export function CreatePlaneRoof(self, interInfo) {
    if (!interInfo) return;
    const dis = 5, lines = [];
    const {roofs, roofGroup} = self,{edges, faces}=roofs[0], idStr = faces.length.toString(), roofFaceId = GetIdStr(),
        acPos = roofGroup.children[0].position;

    const interPos = interInfo.point, posFlatArr = [], pos3DArr = [];

    [{x: -1, z: -1}, {x: -1, z: 1}, {x: 1, z: 1}, {x: 1, z: -1}].forEach(dir => {
        posFlatArr.push({x: dis / 2 * dir.x + interPos.x, y: 0, z: dis / 2 * dir.z + interPos.z});
    });

    posFlatArr.forEach(pos => {
        pos3DArr.push({x: pos.x - acPos.x, y: 1, z: pos.z - acPos.z, oldY: 1, zeroY: 0});
    });
    pos3DArr.forEach((pos3D, idx) => {
        const nextPos = idx === pos3DArr.length - 1 ? pos3DArr[0] : pos3DArr[idx + 1];
        const points = [pos3D, nextPos], lineId = GetIdStr();
        edges.push({posArr: points, type: 'rake', flat: true, roofFaceId});
        lines.push({points, lineId, pass: true, possiblePathway: true, type: 'RAKE', flatRoof: true}); // VALLEY
    });

    faces.push({
        roofId: idStr,
        roofFaceId,
        surfaceMount: true,
        posArr: pos3DArr,
        posFlatArr,
        pitch: 0,
        azimuth: 0,
        irrDir: {tilt: 0, azimuth: 0},
        lines,
        size: 100 * m2ft * m2ft,
        oriAng: {azimuth: 0, tilt: 0},
        flat: true,
        plane: true,
        scl: {x: dis, y: dis},
        pos: {x: interPos.x, y: interPos.z},
        height: 1,
        acPos,
        ppInfo: {h: 0, w: 0.1}
    }); //Removed irradianceMonth from here
    CreateRoof(self);
    siteCalculationState.needsUpdate(SHADE_CALCULATIONS);
    SwitchModuleIrrMat(self, true);
    // setTimeout(() => {
        // SwitchModuleIrrMat(self, true);
        // self.modelGroup.irrType = 'module';
        // SetShadeDisplayEffect(self.modelGroup);
        // self.modelGroup.irrType = null;
        // SetShadeDisplayEffect(self.modelGroup);
    // }, 200);

    self.setCreatePlaneMode(false);

    sleep(500).then(() => {
        SelectFlatRoof(self, roofFaceId);
    });
}

// function generateLabel(text){
// 	const div = document.createElement( 'button' );
// 	div.className = 'btn-primary-outline';
// 	div.style.padding = '5px';
// 	div.textContent = text;
// 	div.style.marginTop = '-1em';
// 	return div;
// }

// function onPointerMove ( event, self ) {
// 	self.mouse = new THREE.Vector2();
// 	self.mouse.x = ( event.offsetX  / self.renderer.domElement.clientWidth ) * 2 - 1;
// 	self.mouse.y = - ( event.offsetY  / self.renderer.domElement.clientHeight ) * 2 + 1;


// 	//cast ray from camera to plane
// 	const raycaster = new THREE.Raycaster();
// 	raycaster.setFromCamera( self.mouse, self.camera );
// 	const intersects = raycaster.intersectObject( self.planeMesh , true);


// 	//if intersects with plane
// 	if ( intersects.length > 0 ) {
// 		//get point of intersection
// 		const point = intersects[ 0 ].point;

// 		//set position of plane to point of intersection
// 		self.newFlatRoofMesh.position.copy( point );
// 		self.newFlatRoofMesh.position.y += 2
// 		self.totalGroup.add( self.newFlatRoofMesh );
// 		self.scene.add( self.newFlatRoofMesh );
// 	}

// 	//remove self.flatRoofClickEvent event listener
// 	window.removeEventListener( 'pointerdown', onPointerMove );
// }

// export function OldCreatePlaneRoof(self) {
// 	//create a plane geometry
// 	const geometry = new THREE.PlaneGeometry( 10, 10, 32 );
// 	//create a material, colour or image texture
// 	const material = new THREE.MeshBasicMaterial( {color: 0xAA4A44, side: THREE.DoubleSide} );
// 	//create a mesh using geometry and material
// 	const plane = new THREE.Mesh( geometry, material );

// 	//rotate by 90 degrees
// 	plane.rotation.x = Math.PI / 2;

// 	plane.name = 'flatRoof'

// 	self.newFlatRoofMesh = plane


// 	window.addEventListener( 'pointerdown', e=> onPointerMove(e, self))


// 	//add a button to edge of the plane using css2d

// 	const moveEle = generateLabel('Move');
// 	const rotateEle = generateLabel('Rotate');
// 	const scaleEle = generateLabel('Scale');


// 	//rotate plane when rotate button is dragged

// 	//create a css object
// 	const rotateObj = new CSS2DObject( rotateEle );
// 	const moveObj = new CSS2DObject( moveEle );
// 	const scaleObj = new CSS2DObject( scaleEle );


// 	self.flatRoodEditLabel.push(moveObj)
// 	self.flatRoodEditLabel.push(rotateObj)


// 	//get plane bounding box
// 	const box = new THREE.Box3().setFromObject( plane );
// 	//get top left corner of the plane
// 	const topLeft = new THREE.Vector3();
// 	//top right corner
// 	const topRight = new THREE.Vector3();

// 	//top center
// 	const topCenter = new THREE.Vector3();

// 	//get center of the plane
// 	box.getCenter( topCenter );

// 	//set x and z coordinates of top Center
// 	topCenter.x = box.min.x + (box.max.x - box.min.x) / 2;
// 	topCenter.z = box.max.z;

// 	box.getCenter( topLeft );

// 	topLeft.x = box.min.x;
// 	topLeft.z = box.max.z;

// 	box.getCenter( topRight );

// 	topRight.x = box.max.x;
// 	topRight.z = box.max.z;


// 	//convert to world coordinates
// 	topLeft.applyMatrix4( plane.matrixWorld );
// 	topRight.applyMatrix4( plane.matrixWorld );
// 	topCenter.applyMatrix4( plane.matrixWorld );

// 	//set position of css object
// 	moveObj.position.copy( topLeft );
// 	rotateObj.position.copy( topRight );
// 	scaleObj.position.copy( topCenter );


// 	plane.add( rotateObj );
// 	plane.add( moveObj );
// 	plane.add( scaleObj );


// 	const controls = new TransformControls(self.camera, self.cssLabelrenderer.domElement)


// 	self.transControls = controls


// 	//move plane in x and z axis with mouse movement
// 	moveEle.addEventListener('mousedown', event => {
// 		if(!self.flatRoofMoveMode){
// 			self.flatRoofMoveMode = true;
// 			self.controls.enabled = false;
// 			controls.reset()
// 			controls.attach(plane);
// 			controls.showX = true;
// 			controls.showZ = true;
// 			controls.showY = false;
// 			controls.setMode( "translate" );

// 			self.scene.add(controls)


// 			moveEle.style.backgroundColor = '#3f76a8'

// 		}
// 		else{
// 			self.flatRoofMoveMode = false;
// 			self.controls.enabled = true;
// 			controls.detach();
// 			self.scene.remove(controls)
// 			moveEle.style.backgroundColor = 'transparent'

// 		}
// 		//disable orbit controls
// 	});

// 	rotateEle.addEventListener('mousedown', event => {
// 		if(!self.flatRoofRotateMode){
// 			self.flatRoofRotateMode = true;
// 			self.controls.enabled = false;
// 			controls.showX = true;
// 			controls.showZ = false;
// 			controls.showY = true;
// 			controls.attach(plane);
// 			controls.setMode( "rotate" );
// 			self.scene.add(controls)

// 			rotateEle.style.backgroundColor = '#3f76a8'

// 		}
// 		else{
// 			self.flatRoofRotateMode = false;
// 			self.controls.enabled = true;
// 			controls.detach();
// 			self.scene.remove(controls)
// 			rotateEle.style.backgroundColor = 'transparent'

// 		}
// 		//disable orbit controls
// 	})

// 	scaleEle.addEventListener('mousedown', event => {
// 		if(!self.flatRoofRotateMode){
// 			self.flatRoofRotateMode = true;
// 			self.controls.enabled = false;
// 			controls.attach(plane);
// 			controls.showX = true;
// 			controls.showY = true;
// 			controls.showZ = false;
// 			//set mode to scale
// 			controls.setMode( "scale" );
// 			self.scene.add(controls)

// 			scaleObj.style.backgroundColor = '#3f76a8'


// 		}
// 		else{
// 			self.flatRoofRotateMode = false;
// 			self.controls.enabled = true;
// 			controls.detach();
// 			self.scene.remove(controls)
// 			scaleObj.style.backgroundColor = 'transparent'
// 		}
// 		//disable orbit controls
// 	})
// }