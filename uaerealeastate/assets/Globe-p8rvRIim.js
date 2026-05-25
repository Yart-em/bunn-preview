import{c as e,r as t,t as n}from"./jsx-runtime-BAoPQjWv.js";import{n as r,t as i}from"./index-CV8H30Lf.js";import{A as a,C as o,D as s,E as c,F as l,I as u,L as d,M as f,N as p,O as m,P as h,S as g,T as _,_ as v,a as y,b,c as x,d as S,f as C,g as w,h as T,i as E,j as D,k as O,l as k,m as A,n as j,o as M,p as N,r as P,s as F,t as I,u as L,v as ee,w as R,x as z,y as B}from"./react-three-fiber.esm-CKohmSX1.js";function te(){return te=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)({}).hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},te.apply(null,arguments)}var V=e(t()),ne=e(r()),H=new l,U=new l,re=new l,ie=new h;function ae(e,t,n){let r=H.setFromMatrixPosition(e.matrixWorld);r.project(t);let i=n.width/2,a=n.height/2;return[r.x*i+i,-(r.y*a)+a]}function oe(e,t){let n=H.setFromMatrixPosition(e.matrixWorld),r=U.setFromMatrixPosition(t.matrixWorld),i=n.sub(r),a=t.getWorldDirection(re);return i.angleTo(a)>Math.PI/2}function se(e,t,n,r){let i=H.setFromMatrixPosition(e.matrixWorld),a=i.clone();a.project(t),ie.set(a.x,a.y),n.setFromCamera(ie,t);let o=n.intersectObjects(r,!0);if(o.length){let e=o[0].distance;return i.distanceTo(n.ray.origin)<e}return!0}function ce(e,t){if(t instanceof z)return t.zoom;if(t instanceof g){let n=H.setFromMatrixPosition(e.matrixWorld),r=U.setFromMatrixPosition(t.matrixWorld),i=t.fov*Math.PI/180,a=n.distanceTo(r);return 1/(2*Math.tan(i/2)*a)}else return 1}function le(e,t,n){if(t instanceof g||t instanceof z){let r=H.setFromMatrixPosition(e.matrixWorld),i=U.setFromMatrixPosition(t.matrixWorld),a=r.distanceTo(i),o=(n[1]-n[0])/(t.far-t.near),s=n[1]-o*t.far;return Math.round(o*a+s)}}var ue=e=>Math.abs(e)<1e-10?0:e;function de(e,t,n=``){let r=`matrix3d(`;for(let n=0;n!==16;n++)r+=ue(t[n]*e.elements[n])+(n===15?`)`:`,`);return n+r}var fe=(e=>t=>de(t,e))([1,-1,1,1,1,-1,1,1,1,-1,1,1,1,-1,1,1]),pe=(e=>(t,n)=>de(t,e(n),`translate(-50%,-50%)`))(e=>[1/e,1/e,1/e,1,-1/e,-1/e,-1/e,-1,1/e,1/e,1/e,1,1,1,1,1]);function me(e){return e&&typeof e==`object`&&`current`in e}var W=V.forwardRef(({children:e,eps:t=.001,style:n,className:r,prepend:i,center:a,fullscreen:o,portal:s,distanceFactor:c,sprite:u=!1,transform:d=!1,occlude:f,onOcclude:p,castShadow:m,receiveShadow:h,material:g,geometry:_,zIndexRange:v=[16777271,0],calculatePosition:y=ae,as:b=`div`,wrapperClass:x,pointerEvents:S=`auto`,...C},w)=>{let{gl:T,camera:E,scene:D,size:O,raycaster:k,events:A,viewport:M}=P(),[N]=V.useState(()=>document.createElement(b)),F=V.useRef(null),I=V.useRef(null),L=V.useRef(0),ee=V.useRef([0,0]),R=V.useRef(null),z=V.useRef(null),B=s?.current||A.connected||T.domElement.parentNode,H=V.useRef(null),U=V.useRef(!1),re=V.useMemo(()=>f&&f!==`blending`||Array.isArray(f)&&f.length&&me(f[0]),[f]);V.useLayoutEffect(()=>{let e=T.domElement;f&&f===`blending`?(e.style.zIndex=`${Math.floor(v[0]/2)}`,e.style.position=`absolute`,e.style.pointerEvents=`none`):(e.style.zIndex=null,e.style.position=null,e.style.pointerEvents=null)},[f]),V.useLayoutEffect(()=>{if(I.current){let e=F.current=ne.createRoot(N);if(D.updateMatrixWorld(),d)N.style.cssText=`position:absolute;top:0;left:0;pointer-events:none;overflow:hidden;`;else{let e=y(I.current,E,O);N.style.cssText=`position:absolute;top:0;left:0;transform:translate3d(${e[0]}px,${e[1]}px,0);transform-origin:0 0;`}return B&&(i?B.prepend(N):B.appendChild(N)),()=>{B&&B.removeChild(N),e.unmount()}}},[B,d]),V.useLayoutEffect(()=>{x&&(N.className=x)},[x]);let ie=V.useMemo(()=>d?{position:`absolute`,top:0,left:0,width:O.width,height:O.height,transformStyle:`preserve-3d`,pointerEvents:`none`}:{position:`absolute`,transform:a?`translate3d(-50%,-50%,0)`:`none`,...o&&{top:-O.height/2,left:-O.width/2,width:O.width,height:O.height},...n},[n,a,o,O,d]),de=V.useMemo(()=>({position:`absolute`,pointerEvents:S}),[S]);V.useLayoutEffect(()=>{if(U.current=!1,d){var t;(t=F.current)==null||t.render(V.createElement(`div`,{ref:R,style:ie},V.createElement(`div`,{ref:z,style:de},V.createElement(`div`,{ref:w,className:r,style:n,children:e}))))}else{var i;(i=F.current)==null||i.render(V.createElement(`div`,{ref:w,style:ie,className:r,children:e}))}});let W=V.useRef(!0);j(e=>{if(I.current){E.updateMatrixWorld(),I.current.updateWorldMatrix(!0,!1);let e=d?ee.current:y(I.current,E,O);if(d||Math.abs(L.current-E.zoom)>t||Math.abs(ee.current[0]-e[0])>t||Math.abs(ee.current[1]-e[1])>t){let t=oe(I.current,E),n=!1;re&&(Array.isArray(f)?n=f.map(e=>e.current):f!==`blending`&&(n=[D]));let r=W.current;n?W.current=se(I.current,E,k,n)&&!t:W.current=!t,r!==W.current&&(p?p(!W.current):N.style.display=W.current?`block`:`none`);let i=Math.floor(v[0]/2),a=f?re?[v[0],i]:[i-1,0]:v;if(N.style.zIndex=`${le(I.current,E,a)}`,d){let[e,t]=[O.width/2,O.height/2],n=E.projectionMatrix.elements[5]*t,{isOrthographicCamera:r,top:i,left:a,bottom:o,right:s}=E,l=fe(E.matrixWorldInverse),d=r?`scale(${n})translate(${ue(-(s+a)/2)}px,${ue((i+o)/2)}px)`:`translateZ(${n}px)`,f=I.current.matrixWorld;u&&(f=E.matrixWorldInverse.clone().transpose().copyPosition(f).scale(I.current.scale),f.elements[3]=f.elements[7]=f.elements[11]=0,f.elements[15]=1),N.style.width=O.width+`px`,N.style.height=O.height+`px`,N.style.perspective=r?``:`${n}px`,R.current&&z.current&&(R.current.style.transform=`${d}${l}translate(${e}px,${t}px)`,z.current.style.transform=pe(f,1/((c||10)/400)))}else{let t=c===void 0?1:ce(I.current,E)*c;N.style.transform=`translate3d(${e[0]}px,${e[1]}px,0) scale(${t})`}ee.current=e,L.current=E.zoom}}if(!re&&H.current&&!U.current)if(d){if(R.current){let e=R.current.children[0];if(e!=null&&e.clientWidth&&e!=null&&e.clientHeight){let{isOrthographicCamera:t}=E;if(t||_)C.scale&&(Array.isArray(C.scale)?C.scale instanceof l?H.current.scale.copy(C.scale.clone().divideScalar(1)):H.current.scale.set(1/C.scale[0],1/C.scale[1],1/C.scale[2]):H.current.scale.setScalar(1/C.scale));else{let t=(c||10)/400,n=e.clientWidth*t,r=e.clientHeight*t;H.current.scale.set(n,r,1)}U.current=!0}}}else{let t=N.children[0];if(t!=null&&t.clientWidth&&t!=null&&t.clientHeight){let e=1/M.factor,n=t.clientWidth*e,r=t.clientHeight*e;H.current.scale.set(n,r,1),U.current=!0}H.current.lookAt(e.camera.position)}});let he=V.useMemo(()=>({vertexShader:d?void 0:`
          /*
            This shader is from the THREE's SpriteMaterial.
            We need to turn the backing plane into a Sprite
            (make it always face the camera) if "transfrom"
            is false.
          */
          #include <common>

          void main() {
            vec2 center = vec2(0., 1.);
            float rotation = 0.0;

            // This is somewhat arbitrary, but it seems to work well
            // Need to figure out how to derive this dynamically if it even matters
            float size = 0.03;

            vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
            vec2 scale;
            scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
            scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );

            bool isPerspective = isPerspectiveMatrix( projectionMatrix );
            if ( isPerspective ) scale *= - mvPosition.z;

            vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale * size;
            vec2 rotatedPosition;
            rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
            rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
            mvPosition.xy += rotatedPosition;

            gl_Position = projectionMatrix * mvPosition;
          }
      `,fragmentShader:`
        void main() {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        }
      `}),[d]);return V.createElement(`group`,te({},C,{ref:I}),f&&!re&&V.createElement(`mesh`,{castShadow:m,receiveShadow:h,ref:H},_||V.createElement(`planeGeometry`,null),g||V.createElement(`shaderMaterial`,{side:2,vertexShader:he.vertexShader,fragmentShader:he.fragmentShader})))}),he=Object.defineProperty,ge=(e,t,n)=>t in e?he(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,_e=(e,t,n)=>(ge(e,typeof t==`symbol`?t:t+``,n),n),ve=class{constructor(){_e(this,`_listeners`)}addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;let n=this._listeners;return n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;let n=this._listeners[e];if(n!==void 0){let e=n.indexOf(t);e!==-1&&n.splice(e,1)}}dispatchEvent(e){if(this._listeners===void 0)return;let t=this._listeners[e.type];if(t!==void 0){e.target=this;let n=t.slice(0);for(let t=0,r=n.length;t<r;t++)n[t].call(this,e);e.target=null}}},ye=Object.defineProperty,be=(e,t,n)=>t in e?ye(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,G=(e,t,n)=>(be(e,typeof t==`symbol`?t:t+``,n),n),xe=new c,Se=new o,Ce=Math.cos(Math.PI/180*70),we=(e,t)=>(e%t+t)%t,Te=class extends ve{constructor(e,t){super(),G(this,`object`),G(this,`domElement`),G(this,`enabled`,!0),G(this,`target`,new l),G(this,`minDistance`,0),G(this,`maxDistance`,1/0),G(this,`minZoom`,0),G(this,`maxZoom`,1/0),G(this,`minPolarAngle`,0),G(this,`maxPolarAngle`,Math.PI),G(this,`minAzimuthAngle`,-1/0),G(this,`maxAzimuthAngle`,1/0),G(this,`enableDamping`,!1),G(this,`dampingFactor`,.05),G(this,`enableZoom`,!0),G(this,`zoomSpeed`,1),G(this,`enableRotate`,!0),G(this,`rotateSpeed`,1),G(this,`enablePan`,!0),G(this,`panSpeed`,1),G(this,`screenSpacePanning`,!0),G(this,`keyPanSpeed`,7),G(this,`zoomToCursor`,!1),G(this,`autoRotate`,!1),G(this,`autoRotateSpeed`,2),G(this,`reverseOrbit`,!1),G(this,`reverseHorizontalOrbit`,!1),G(this,`reverseVerticalOrbit`,!1),G(this,`keys`,{LEFT:`ArrowLeft`,UP:`ArrowUp`,RIGHT:`ArrowRight`,BOTTOM:`ArrowDown`}),G(this,`mouseButtons`,{LEFT:w.ROTATE,MIDDLE:w.DOLLY,RIGHT:w.PAN}),G(this,`touches`,{ONE:f.ROTATE,TWO:f.DOLLY_PAN}),G(this,`target0`),G(this,`position0`),G(this,`zoom0`),G(this,`_domElementKeyEvents`,null),G(this,`getPolarAngle`),G(this,`getAzimuthalAngle`),G(this,`setPolarAngle`),G(this,`setAzimuthalAngle`),G(this,`getDistance`),G(this,`getZoomScale`),G(this,`listenToKeyEvents`),G(this,`stopListenToKeyEvents`),G(this,`saveState`),G(this,`reset`),G(this,`update`),G(this,`connect`),G(this,`dispose`),G(this,`dollyIn`),G(this,`dollyOut`),G(this,`getScale`),G(this,`setScale`),this.object=e,this.domElement=t,this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this.getPolarAngle=()=>u.phi,this.getAzimuthalAngle=()=>u.theta,this.setPolarAngle=e=>{let t=we(e,2*Math.PI),r=u.phi;r<0&&(r+=2*Math.PI),t<0&&(t+=2*Math.PI);let i=Math.abs(t-r);2*Math.PI-i<i&&(t<r?t+=2*Math.PI:r+=2*Math.PI),d.phi=t-r,n.update()},this.setAzimuthalAngle=e=>{let t=we(e,2*Math.PI),r=u.theta;r<0&&(r+=2*Math.PI),t<0&&(t+=2*Math.PI);let i=Math.abs(t-r);2*Math.PI-i<i&&(t<r?t+=2*Math.PI:r+=2*Math.PI),d.theta=t-r,n.update()},this.getDistance=()=>n.object.position.distanceTo(n.target),this.listenToKeyEvents=e=>{e.addEventListener(`keydown`,Ae),this._domElementKeyEvents=e},this.stopListenToKeyEvents=()=>{this._domElementKeyEvents.removeEventListener(`keydown`,Ae),this._domElementKeyEvents=null},this.saveState=()=>{n.target0.copy(n.target),n.position0.copy(n.object.position),n.zoom0=n.object.zoom},this.reset=()=>{n.target.copy(n.target0),n.object.position.copy(n.position0),n.object.zoom=n.zoom0,n.object.updateProjectionMatrix(),n.dispatchEvent(r),n.update(),s=o.NONE},this.update=(()=>{let t=new l,i=new l(0,1,0),a=new _().setFromUnitVectors(e.up,i),f=a.clone().invert(),h=new l,v=new _,y=2*Math.PI;return function(){let _=n.object.position;a.setFromUnitVectors(e.up,i),f.copy(a).invert(),t.copy(_).sub(n.target),t.applyQuaternion(a),u.setFromVector3(t),n.autoRotate&&s===o.NONE&&I(P()),n.enableDamping?(u.theta+=d.theta*n.dampingFactor,u.phi+=d.phi*n.dampingFactor):(u.theta+=d.theta,u.phi+=d.phi);let b=n.minAzimuthAngle,x=n.maxAzimuthAngle;isFinite(b)&&isFinite(x)&&(b<-Math.PI?b+=y:b>Math.PI&&(b-=y),x<-Math.PI?x+=y:x>Math.PI&&(x-=y),b<=x?u.theta=Math.max(b,Math.min(x,u.theta)):u.theta=u.theta>(b+x)/2?Math.max(b,u.theta):Math.min(x,u.theta)),u.phi=Math.max(n.minPolarAngle,Math.min(n.maxPolarAngle,u.phi)),u.makeSafe(),n.enableDamping===!0?n.target.addScaledVector(m,n.dampingFactor):n.target.add(m),n.zoomToCursor&&j||n.object.isOrthographicCamera?u.radius=U(u.radius):u.radius=U(u.radius*p),t.setFromSpherical(u),t.applyQuaternion(f),_.copy(n.target).add(t),n.object.matrixAutoUpdate||n.object.updateMatrix(),n.object.lookAt(n.target),n.enableDamping===!0?(d.theta*=1-n.dampingFactor,d.phi*=1-n.dampingFactor,m.multiplyScalar(1-n.dampingFactor)):(d.set(0,0,0),m.set(0,0,0));let S=!1;if(n.zoomToCursor&&j){let r=null;if(n.object instanceof g&&n.object.isPerspectiveCamera){let e=t.length();r=U(e*p);let i=e-r;n.object.position.addScaledVector(k,i),n.object.updateMatrixWorld()}else if(n.object.isOrthographicCamera){let e=new l(A.x,A.y,0);e.unproject(n.object),n.object.zoom=Math.max(n.minZoom,Math.min(n.maxZoom,n.object.zoom/p)),n.object.updateProjectionMatrix(),S=!0;let i=new l(A.x,A.y,0);i.unproject(n.object),n.object.position.sub(i).add(e),n.object.updateMatrixWorld(),r=t.length()}else console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled.`),n.zoomToCursor=!1;r!==null&&(n.screenSpacePanning?n.target.set(0,0,-1).transformDirection(n.object.matrix).multiplyScalar(r).add(n.object.position):(xe.origin.copy(n.object.position),xe.direction.set(0,0,-1).transformDirection(n.object.matrix),Math.abs(n.object.up.dot(xe.direction))<Ce?e.lookAt(n.target):(Se.setFromNormalAndCoplanarPoint(n.object.up,n.target),xe.intersectPlane(Se,n.target))))}else n.object instanceof z&&n.object.isOrthographicCamera&&(S=p!==1,S&&(n.object.zoom=Math.max(n.minZoom,Math.min(n.maxZoom,n.object.zoom/p)),n.object.updateProjectionMatrix()));return p=1,j=!1,S||h.distanceToSquared(n.object.position)>c||8*(1-v.dot(n.object.quaternion))>c?(n.dispatchEvent(r),h.copy(n.object.position),v.copy(n.object.quaternion),S=!1,!0):!1}})(),this.connect=e=>{n.domElement=e,n.domElement.style.touchAction=`none`,n.domElement.addEventListener(`contextmenu`,Ne),n.domElement.addEventListener(`pointerdown`,be),n.domElement.addEventListener(`pointercancel`,Ee),n.domElement.addEventListener(`wheel`,ke)},this.dispose=()=>{var e,t,r,i,a,o;n.domElement&&(n.domElement.style.touchAction=`auto`),(e=n.domElement)==null||e.removeEventListener(`contextmenu`,Ne),(t=n.domElement)==null||t.removeEventListener(`pointerdown`,be),(r=n.domElement)==null||r.removeEventListener(`pointercancel`,Ee),(i=n.domElement)==null||i.removeEventListener(`wheel`,ke),(a=n.domElement)==null||a.ownerDocument.removeEventListener(`pointermove`,Te),(o=n.domElement)==null||o.ownerDocument.removeEventListener(`pointerup`,Ee),n._domElementKeyEvents!==null&&n._domElementKeyEvents.removeEventListener(`keydown`,Ae)};let n=this,r={type:`change`},i={type:`start`},a={type:`end`},o={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},s=o.NONE,c=1e-6,u=new D,d=new D,p=1,m=new l,v=new h,y=new h,b=new h,x=new h,S=new h,C=new h,T=new h,E=new h,O=new h,k=new l,A=new h,j=!1,M=[],N={};function P(){return 2*Math.PI/60/60*n.autoRotateSpeed}function F(){return .95**n.zoomSpeed}function I(e){n.reverseOrbit||n.reverseHorizontalOrbit?d.theta+=e:d.theta-=e}function L(e){n.reverseOrbit||n.reverseVerticalOrbit?d.phi+=e:d.phi-=e}let ee=(()=>{let e=new l;return function(t,n){e.setFromMatrixColumn(n,0),e.multiplyScalar(-t),m.add(e)}})(),R=(()=>{let e=new l;return function(t,r){n.screenSpacePanning===!0?e.setFromMatrixColumn(r,1):(e.setFromMatrixColumn(r,0),e.crossVectors(n.object.up,e)),e.multiplyScalar(t),m.add(e)}})(),B=(()=>{let e=new l;return function(t,r){let i=n.domElement;if(i&&n.object instanceof g&&n.object.isPerspectiveCamera){let a=n.object.position;e.copy(a).sub(n.target);let o=e.length();o*=Math.tan(n.object.fov/2*Math.PI/180),ee(2*t*o/i.clientHeight,n.object.matrix),R(2*r*o/i.clientHeight,n.object.matrix)}else i&&n.object instanceof z&&n.object.isOrthographicCamera?(ee(t*(n.object.right-n.object.left)/n.object.zoom/i.clientWidth,n.object.matrix),R(r*(n.object.top-n.object.bottom)/n.object.zoom/i.clientHeight,n.object.matrix)):(console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.`),n.enablePan=!1)}})();function te(e){n.object instanceof g&&n.object.isPerspectiveCamera||n.object instanceof z&&n.object.isOrthographicCamera?p=e:(console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.`),n.enableZoom=!1)}function V(e){te(p/e)}function ne(e){te(p*e)}function H(e){if(!n.zoomToCursor||!n.domElement)return;j=!0;let t=n.domElement.getBoundingClientRect(),r=e.clientX-t.left,i=e.clientY-t.top,a=t.width,o=t.height;A.x=r/a*2-1,A.y=-(i/o)*2+1,k.set(A.x,A.y,1).unproject(n.object).sub(n.object.position).normalize()}function U(e){return Math.max(n.minDistance,Math.min(n.maxDistance,e))}function re(e){v.set(e.clientX,e.clientY)}function ie(e){H(e),T.set(e.clientX,e.clientY)}function ae(e){x.set(e.clientX,e.clientY)}function oe(e){y.set(e.clientX,e.clientY),b.subVectors(y,v).multiplyScalar(n.rotateSpeed);let t=n.domElement;t&&(I(2*Math.PI*b.x/t.clientHeight),L(2*Math.PI*b.y/t.clientHeight)),v.copy(y),n.update()}function se(e){E.set(e.clientX,e.clientY),O.subVectors(E,T),O.y>0?V(F()):O.y<0&&ne(F()),T.copy(E),n.update()}function ce(e){S.set(e.clientX,e.clientY),C.subVectors(S,x).multiplyScalar(n.panSpeed),B(C.x,C.y),x.copy(S),n.update()}function le(e){H(e),e.deltaY<0?ne(F()):e.deltaY>0&&V(F()),n.update()}function ue(e){let t=!1;switch(e.code){case n.keys.UP:B(0,n.keyPanSpeed),t=!0;break;case n.keys.BOTTOM:B(0,-n.keyPanSpeed),t=!0;break;case n.keys.LEFT:B(n.keyPanSpeed,0),t=!0;break;case n.keys.RIGHT:B(-n.keyPanSpeed,0),t=!0;break}t&&(e.preventDefault(),n.update())}function de(){if(M.length==1)v.set(M[0].pageX,M[0].pageY);else{let e=.5*(M[0].pageX+M[1].pageX),t=.5*(M[0].pageY+M[1].pageY);v.set(e,t)}}function fe(){if(M.length==1)x.set(M[0].pageX,M[0].pageY);else{let e=.5*(M[0].pageX+M[1].pageX),t=.5*(M[0].pageY+M[1].pageY);x.set(e,t)}}function pe(){let e=M[0].pageX-M[1].pageX,t=M[0].pageY-M[1].pageY,n=Math.sqrt(e*e+t*t);T.set(0,n)}function me(){n.enableZoom&&pe(),n.enablePan&&fe()}function W(){n.enableZoom&&pe(),n.enableRotate&&de()}function he(e){if(M.length==1)y.set(e.pageX,e.pageY);else{let t=Le(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);y.set(n,r)}b.subVectors(y,v).multiplyScalar(n.rotateSpeed);let t=n.domElement;t&&(I(2*Math.PI*b.x/t.clientHeight),L(2*Math.PI*b.y/t.clientHeight)),v.copy(y)}function ge(e){if(M.length==1)S.set(e.pageX,e.pageY);else{let t=Le(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);S.set(n,r)}C.subVectors(S,x).multiplyScalar(n.panSpeed),B(C.x,C.y),x.copy(S)}function _e(e){let t=Le(e),r=e.pageX-t.x,i=e.pageY-t.y,a=Math.sqrt(r*r+i*i);E.set(0,a),O.set(0,(E.y/T.y)**+n.zoomSpeed),V(O.y),T.copy(E)}function ve(e){n.enableZoom&&_e(e),n.enablePan&&ge(e)}function ye(e){n.enableZoom&&_e(e),n.enableRotate&&he(e)}function be(e){var t,r;n.enabled!==!1&&(M.length===0&&((t=n.domElement)==null||t.ownerDocument.addEventListener(`pointermove`,Te),(r=n.domElement)==null||r.ownerDocument.addEventListener(`pointerup`,Ee)),Pe(e),e.pointerType===`touch`?je(e):De(e))}function Te(e){n.enabled!==!1&&(e.pointerType===`touch`?Me(e):Oe(e))}function Ee(e){var t,r,i;Fe(e),M.length===0&&((t=n.domElement)==null||t.releasePointerCapture(e.pointerId),(r=n.domElement)==null||r.ownerDocument.removeEventListener(`pointermove`,Te),(i=n.domElement)==null||i.ownerDocument.removeEventListener(`pointerup`,Ee)),n.dispatchEvent(a),s=o.NONE}function De(e){let t;switch(e.button){case 0:t=n.mouseButtons.LEFT;break;case 1:t=n.mouseButtons.MIDDLE;break;case 2:t=n.mouseButtons.RIGHT;break;default:t=-1}switch(t){case w.DOLLY:if(n.enableZoom===!1)return;ie(e),s=o.DOLLY;break;case w.ROTATE:if(e.ctrlKey||e.metaKey||e.shiftKey){if(n.enablePan===!1)return;ae(e),s=o.PAN}else{if(n.enableRotate===!1)return;re(e),s=o.ROTATE}break;case w.PAN:if(e.ctrlKey||e.metaKey||e.shiftKey){if(n.enableRotate===!1)return;re(e),s=o.ROTATE}else{if(n.enablePan===!1)return;ae(e),s=o.PAN}break;default:s=o.NONE}s!==o.NONE&&n.dispatchEvent(i)}function Oe(e){if(n.enabled!==!1)switch(s){case o.ROTATE:if(n.enableRotate===!1)return;oe(e);break;case o.DOLLY:if(n.enableZoom===!1)return;se(e);break;case o.PAN:if(n.enablePan===!1)return;ce(e);break}}function ke(e){n.enabled===!1||n.enableZoom===!1||s!==o.NONE&&s!==o.ROTATE||(e.preventDefault(),n.dispatchEvent(i),le(e),n.dispatchEvent(a))}function Ae(e){n.enabled===!1||n.enablePan===!1||ue(e)}function je(e){switch(Ie(e),M.length){case 1:switch(n.touches.ONE){case f.ROTATE:if(n.enableRotate===!1)return;de(),s=o.TOUCH_ROTATE;break;case f.PAN:if(n.enablePan===!1)return;fe(),s=o.TOUCH_PAN;break;default:s=o.NONE}break;case 2:switch(n.touches.TWO){case f.DOLLY_PAN:if(n.enableZoom===!1&&n.enablePan===!1)return;me(),s=o.TOUCH_DOLLY_PAN;break;case f.DOLLY_ROTATE:if(n.enableZoom===!1&&n.enableRotate===!1)return;W(),s=o.TOUCH_DOLLY_ROTATE;break;default:s=o.NONE}break;default:s=o.NONE}s!==o.NONE&&n.dispatchEvent(i)}function Me(e){switch(Ie(e),s){case o.TOUCH_ROTATE:if(n.enableRotate===!1)return;he(e),n.update();break;case o.TOUCH_PAN:if(n.enablePan===!1)return;ge(e),n.update();break;case o.TOUCH_DOLLY_PAN:if(n.enableZoom===!1&&n.enablePan===!1)return;ve(e),n.update();break;case o.TOUCH_DOLLY_ROTATE:if(n.enableZoom===!1&&n.enableRotate===!1)return;ye(e),n.update();break;default:s=o.NONE}}function Ne(e){n.enabled!==!1&&e.preventDefault()}function Pe(e){M.push(e)}function Fe(e){delete N[e.pointerId];for(let t=0;t<M.length;t++)if(M[t].pointerId==e.pointerId){M.splice(t,1);return}}function Ie(e){let t=N[e.pointerId];t===void 0&&(t=new h,N[e.pointerId]=t),t.set(e.pageX,e.pageY)}function Le(e){return N[(e.pointerId===M[0].pointerId?M[1]:M[0]).pointerId]}this.dollyIn=(e=F())=>{ne(e),n.update()},this.dollyOut=(e=F())=>{V(e),n.update()},this.getScale=()=>p,this.setScale=e=>{te(e),n.update()},this.getZoomScale=()=>F(),t!==void 0&&this.connect(t),this.update()}},Ee=V.forwardRef(({makeDefault:e,camera:t,regress:n,domElement:r,enableDamping:i=!0,keyEvents:a=!1,onChange:o,onStart:s,onEnd:c,...l},u)=>{let d=P(e=>e.invalidate),f=P(e=>e.camera),p=P(e=>e.gl),m=P(e=>e.events),h=P(e=>e.setEvents),g=P(e=>e.set),_=P(e=>e.get),v=P(e=>e.performance),y=t||f,b=r||m.connected||p.domElement,x=V.useMemo(()=>new Te(y),[y]);return j(()=>{x.enabled&&x.update()},-1),V.useEffect(()=>(a&&x.connect(a===!0?b:a),x.connect(b),()=>void x.dispose()),[a,b,n,x,d]),V.useEffect(()=>{let e=e=>{d(),n&&v.regress(),o&&o(e)},t=e=>{s&&s(e)},r=e=>{c&&c(e)};return x.addEventListener(`change`,e),x.addEventListener(`start`,t),x.addEventListener(`end`,r),()=>{x.removeEventListener(`start`,t),x.removeEventListener(`end`,r),x.removeEventListener(`change`,e)}},[o,s,c,x,d,h]),V.useEffect(()=>{if(e){let e=_().controls;return g({controls:x}),()=>g({controls:e})}},[e,x]),V.createElement(`primitive`,te({ref:u,object:x,enableDamping:i},l))}),De=`#D7D7D7`,Oe=`#B9B9B9`,ke=`#8E8E8E`,Ae=`#5A5A5A`,je=`#FF9BAC`,Me=[25.2048,55.2708],Ne=[{lat:51.5072,lon:-.1276,label:`London`},{lat:1.3521,lon:103.8198,label:`Singapore`},{lat:22.3193,lon:114.1694,label:`Hong Kong`},{lat:55.7558,lon:37.6173,label:`Moscow`},{lat:6.5244,lon:3.3792,label:`Lagos`},{lat:35.6762,lon:139.6503,label:`Tokyo`},{lat:40.7128,lon:-74.006,label:`New York`},{lat:37.7749,lon:-122.4194,label:`San Francisco`},{lat:-23.5505,lon:-46.6333,label:`São Paulo`},{lat:-33.8688,lon:151.2093,label:`Sydney`},{lat:21.3069,lon:-157.8583,label:`Honolulu`},{lat:-36.8485,lon:174.7633,label:`Auckland`},{lat:-12.0464,lon:-77.0428,label:`Lima`}],Pe=1.4,Fe=1.9,Ie=2.5;function Le(e,t,n){return e<=t?0:e>=n?1:(e-t)/(n-t)}var K=n();function Re(){let e=document.createElement(`canvas`);e.width=128,e.height=128;let t=e.getContext(`2d`);t.fillStyle=`#ffffff`,t.beginPath(),t.arc(128/2,128/2,128/2-2,0,Math.PI*2),t.fill();let n=new F(e);return n.anisotropy=4,n.needsUpdate=!0,n}var ze=e=>1-(1-e)**3;function Be({start:e,target:t,delay:n,color:r,size:i,texture:a,dissolveProgress:o=0}){let s=(0,V.useRef)(null),c=(0,V.useRef)(null),u=(0,V.useMemo)(()=>new Float32Array(e),[e]),d=(0,V.useRef)(null),f=(0,V.useRef)(!1),p=(0,V.useMemo)(()=>({uCamPos:{value:new l},uMinSizeMul:{value:.45},uMinAlphaMul:{value:.55}}),[]);return(0,V.useEffect)(()=>{d.current=null,f.current=!1},[e,t]),j(r=>{if(c.current){let e=r.camera.position.clone(),t=c.current.userData?.parentObject;t&&e.applyMatrix4(t.matrixWorld.clone().invert()),p.uCamPos.value.copy(r.camera.position)}if(!s.current)return;if(o>0){let r=n.length,i=0;for(let e=0;e<r;e++)n[e]>i&&(i=n[e]);let a=i+Pe,l=(1-o)*a;for(let i=0;i<r;i++){let r=ze(Math.max(0,Math.min(1,(l-n[i])/Pe))),a=i*3;u[a+0]=e[a+0]+(t[a+0]-e[a+0])*r,u[a+1]=e[a+1]+(t[a+1]-e[a+1])*r,u[a+2]=e[a+2]+(t[a+2]-e[a+2])*r}let d=s.current.getAttribute(`position`);d.needsUpdate=!0,c.current&&(c.current.opacity=1);return}if(f.current)return;d.current===null&&(d.current=r.clock.elapsedTime);let i=r.clock.elapsedTime-d.current,a=n.length,l=!0;for(let r=0;r<a;r++){let a=Math.max(0,Math.min(1,(i-n[r])/Pe));a<1&&(l=!1);let o=ze(a),s=r*3;u[s+0]=e[s+0]+(t[s+0]-e[s+0])*o,u[s+1]=e[s+1]+(t[s+1]-e[s+1])*o,u[s+2]=e[s+2]+(t[s+2]-e[s+2])*o}let m=s.current.getAttribute(`position`);m.needsUpdate=!0,l&&(f.current=!0)}),(0,K.jsxs)(`points`,{children:[(0,K.jsx)(`bufferGeometry`,{ref:s,children:(0,K.jsx)(`bufferAttribute`,{attach:`attributes-position`,args:[u,3]})}),(0,K.jsx)(`pointsMaterial`,{ref:c,color:r,size:i,sizeAttenuation:!0,map:a,transparent:!0,alphaTest:.5,depthWrite:!1,depthTest:!1,onBeforeCompile:e=>{e.uniforms.uCamPos=p.uCamPos,e.uniforms.uMinSizeMul=p.uMinSizeMul,e.uniforms.uMinAlphaMul=p.uMinAlphaMul,e.vertexShader=e.vertexShader.replace(`#include <common>`,`#include <common>
         uniform vec3 uCamPos;
         uniform float uMinSizeMul;
         uniform float uMinAlphaMul;
         varying float vFacing;`).replace(`#include <begin_vertex>`,`#include <begin_vertex>
         {
           vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
           vec3 sphereNormal = normalize(worldPos);
           vec3 toCam = normalize(uCamPos - worldPos);
           vFacing = dot(sphereNormal, toCam);
         }`).replace(`gl_PointSize = size;`,`float facing01 = (vFacing + 1.0) * 0.5;
         gl_PointSize = size * mix(uMinSizeMul, 1.0, facing01);`),e.fragmentShader=e.fragmentShader.replace(`#include <common>`,`#include <common>
         uniform float uMinAlphaMul;
         varying float vFacing;`).replace(`#include <output_fragment>`,`#include <output_fragment>
         float facing01 = (vFacing + 1.0) * 0.5;
         gl_FragColor.a *= mix(uMinAlphaMul, 1.0, facing01);`)}})]})}function Ve({dots:e,dissolveProgress:t=0,dotSize:n=.011}){let r=(0,V.useMemo)(Re,[]);return(0,K.jsx)(`group`,{children:(0,K.jsx)(Be,{start:e.landStart,target:e.land,delay:e.landDelay,color:De,size:n,texture:r,dissolveProgress:t})})}var He=new M,Ue=new l,We=class extends C{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type=`LineSegmentsGeometry`,this.setIndex([0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5]),this.setAttribute(`position`,new S([-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],3)),this.setAttribute(`uv`,new S([-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],2))}applyMatrix4(e){let t=this.attributes.instanceStart,n=this.attributes.instanceEnd;return t!==void 0&&(t.applyMatrix4(e),n.applyMatrix4(e),t.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}setPositions(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let n=new N(t,6,1);return this.setAttribute(`instanceStart`,new A(n,3,0)),this.setAttribute(`instanceEnd`,new A(n,3,3)),this.instanceCount=this.attributes.instanceStart.count,this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let n=new N(t,6,1);return this.setAttribute(`instanceColorStart`,new A(n,3,0)),this.setAttribute(`instanceColorEnd`,new A(n,3,3)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new d(e.geometry)),this}fromLineSegments(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new M);let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;e!==void 0&&t!==void 0&&(this.boundingBox.setFromBufferAttribute(e),He.setFromBufferAttribute(t),this.boundingBox.union(He))}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new a),this.boundingBox===null&&this.computeBoundingBox();let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;if(e!==void 0&&t!==void 0){let n=this.boundingSphere.center;this.boundingBox.getCenter(n);let r=0;for(let i=0,a=e.count;i<a;i++)Ue.fromBufferAttribute(e,i),r=Math.max(r,n.distanceToSquared(Ue)),Ue.fromBufferAttribute(t,i),r=Math.max(r,n.distanceToSquared(Ue));this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error(`THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.`,this)}}toJSON(){}};y.line={worldUnits:{value:1},linewidth:{value:1},resolution:{value:new h(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}},E.line={uniforms:p.merge([y.common,y.fog,y.line]),vertexShader:`
		#include <common>
		#include <color_pars_vertex>
		#include <fog_pars_vertex>
		#include <logdepthbuf_pars_vertex>
		#include <clipping_planes_pars_vertex>

		uniform float linewidth;
		uniform vec2 resolution;

		attribute vec3 instanceStart;
		attribute vec3 instanceEnd;

		attribute vec3 instanceColorStart;
		attribute vec3 instanceColorEnd;

		#ifdef WORLD_UNITS

			varying vec4 worldPos;
			varying vec3 worldStart;
			varying vec3 worldEnd;

			#ifdef USE_DASH

				varying vec2 vUv;

			#endif

		#else

			varying vec2 vUv;

		#endif

		#ifdef USE_DASH

			uniform float dashScale;
			attribute float instanceDistanceStart;
			attribute float instanceDistanceEnd;
			varying float vLineDistance;

		#endif

		void trimSegment( const in vec4 start, inout vec4 end ) {

			// trim end segment so it terminates between the camera plane and the near plane

			// conservative estimate of the near plane
			float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
			float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column
			float nearEstimate = - 0.5 * b / a;

			float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );

			end.xyz = mix( start.xyz, end.xyz, alpha );

		}

		void main() {

			#ifdef USE_COLOR

				vColor.xyz = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

			#endif

			#ifdef USE_DASH

				vLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;
				vUv = uv;

			#endif

			float aspect = resolution.x / resolution.y;

			// camera space
			vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
			vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

			#ifdef WORLD_UNITS

				worldStart = start.xyz;
				worldEnd = end.xyz;

			#else

				vUv = uv;

			#endif

			// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
			// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
			// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
			// perhaps there is a more elegant solution -- WestLangley

			bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

			if ( perspective ) {

				if ( start.z < 0.0 && end.z >= 0.0 ) {

					trimSegment( start, end );

				} else if ( end.z < 0.0 && start.z >= 0.0 ) {

					trimSegment( end, start );

				}

			}

			// clip space
			vec4 clipStart = projectionMatrix * start;
			vec4 clipEnd = projectionMatrix * end;

			// ndc space
			vec3 ndcStart = clipStart.xyz / clipStart.w;
			vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

			// direction
			vec2 dir = ndcEnd.xy - ndcStart.xy;

			// account for clip-space aspect ratio
			dir.x *= aspect;
			dir = normalize( dir );

			#ifdef WORLD_UNITS

				vec3 worldDir = normalize( end.xyz - start.xyz );
				vec3 tmpFwd = normalize( mix( start.xyz, end.xyz, 0.5 ) );
				vec3 worldUp = normalize( cross( worldDir, tmpFwd ) );
				vec3 worldFwd = cross( worldDir, worldUp );
				worldPos = position.y < 0.5 ? start: end;

				// height offset
				float hw = linewidth * 0.5;
				worldPos.xyz += position.x < 0.0 ? hw * worldUp : - hw * worldUp;

				// don't extend the line if we're rendering dashes because we
				// won't be rendering the endcaps
				#ifndef USE_DASH

					// cap extension
					worldPos.xyz += position.y < 0.5 ? - hw * worldDir : hw * worldDir;

					// add width to the box
					worldPos.xyz += worldFwd * hw;

					// endcaps
					if ( position.y > 1.0 || position.y < 0.0 ) {

						worldPos.xyz -= worldFwd * 2.0 * hw;

					}

				#endif

				// project the worldpos
				vec4 clip = projectionMatrix * worldPos;

				// shift the depth of the projected points so the line
				// segments overlap neatly
				vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
				clip.z = clipPose.z * clip.w;

			#else

				vec2 offset = vec2( dir.y, - dir.x );
				// undo aspect ratio adjustment
				dir.x /= aspect;
				offset.x /= aspect;

				// sign flip
				if ( position.x < 0.0 ) offset *= - 1.0;

				// endcaps
				if ( position.y < 0.0 ) {

					offset += - dir;

				} else if ( position.y > 1.0 ) {

					offset += dir;

				}

				// adjust for linewidth
				offset *= linewidth;

				// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
				offset /= resolution.y;

				// select end
				vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

				// back to clip space
				offset *= clip.w;

				clip.xy += offset;

			#endif

			gl_Position = clip;

			vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

			#include <logdepthbuf_vertex>
			#include <clipping_planes_vertex>
			#include <fog_vertex>

		}
		`,fragmentShader:`
		uniform vec3 diffuse;
		uniform float opacity;
		uniform float linewidth;

		#ifdef USE_DASH

			uniform float dashOffset;
			uniform float dashSize;
			uniform float gapSize;

		#endif

		varying float vLineDistance;

		#ifdef WORLD_UNITS

			varying vec4 worldPos;
			varying vec3 worldStart;
			varying vec3 worldEnd;

			#ifdef USE_DASH

				varying vec2 vUv;

			#endif

		#else

			varying vec2 vUv;

		#endif

		#include <common>
		#include <color_pars_fragment>
		#include <fog_pars_fragment>
		#include <logdepthbuf_pars_fragment>
		#include <clipping_planes_pars_fragment>

		vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {

			float mua;
			float mub;

			vec3 p13 = p1 - p3;
			vec3 p43 = p4 - p3;

			vec3 p21 = p2 - p1;

			float d1343 = dot( p13, p43 );
			float d4321 = dot( p43, p21 );
			float d1321 = dot( p13, p21 );
			float d4343 = dot( p43, p43 );
			float d2121 = dot( p21, p21 );

			float denom = d2121 * d4343 - d4321 * d4321;

			float numer = d1343 * d4321 - d1321 * d4343;

			mua = numer / denom;
			mua = clamp( mua, 0.0, 1.0 );
			mub = ( d1343 + d4321 * ( mua ) ) / d4343;
			mub = clamp( mub, 0.0, 1.0 );

			return vec2( mua, mub );

		}

		void main() {

			float alpha = opacity;
			vec4 diffuseColor = vec4( diffuse, alpha );

			#include <clipping_planes_fragment>

			#ifdef USE_DASH

				if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

				if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

			#endif

			#ifdef WORLD_UNITS

				// Find the closest points on the view ray and the line segment
				vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
				vec3 lineDir = worldEnd - worldStart;
				vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );

				vec3 p1 = worldStart + lineDir * params.x;
				vec3 p2 = rayEnd * params.y;
				vec3 delta = p1 - p2;
				float len = length( delta );
				float norm = len / linewidth;

				#ifndef USE_DASH

					#ifdef USE_ALPHA_TO_COVERAGE

						float dnorm = fwidth( norm );
						alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );

					#else

						if ( norm > 0.5 ) {

							discard;

						}

					#endif

				#endif

			#else

				#ifdef USE_ALPHA_TO_COVERAGE

					// artifacts appear on some hardware if a derivative is taken within a conditional
					float a = vUv.x;
					float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
					float len2 = a * a + b * b;
					float dlen = fwidth( len2 );

					if ( abs( vUv.y ) > 1.0 ) {

						alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );

					}

				#else

					if ( abs( vUv.y ) > 1.0 ) {

						float a = vUv.x;
						float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
						float len2 = a * a + b * b;

						if ( len2 > 1.0 ) discard;

					}

				#endif

			#endif

			#include <logdepthbuf_fragment>
			#include <color_fragment>

			gl_FragColor = vec4( diffuseColor.rgb, alpha );

			#include <tonemapping_fragment>
			#include <colorspace_fragment>
			#include <fog_fragment>
			#include <premultiplied_alpha_fragment>

		}
		`};var Ge=class extends O{constructor(e){super({type:`LineMaterial`,uniforms:p.clone(E.line.uniforms),vertexShader:E.line.vertexShader,fragmentShader:E.line.fragmentShader,clipping:!0}),this.isLineMaterial=!0,this.setValues(e)}get color(){return this.uniforms.diffuse.value}set color(e){this.uniforms.diffuse.value=e}get worldUnits(){return`WORLD_UNITS`in this.defines}set worldUnits(e){e===!0!==this.worldUnits&&(this.needsUpdate=!0),e===!0?this.defines.WORLD_UNITS=``:delete this.defines.WORLD_UNITS}get linewidth(){return this.uniforms.linewidth.value}set linewidth(e){this.uniforms.linewidth&&(this.uniforms.linewidth.value=e)}get dashed(){return`USE_DASH`in this.defines}set dashed(e){e===!0!==this.dashed&&(this.needsUpdate=!0),e===!0?this.defines.USE_DASH=``:delete this.defines.USE_DASH}get dashScale(){return this.uniforms.dashScale.value}set dashScale(e){this.uniforms.dashScale.value=e}get dashSize(){return this.uniforms.dashSize.value}set dashSize(e){this.uniforms.dashSize.value=e}get dashOffset(){return this.uniforms.dashOffset.value}set dashOffset(e){this.uniforms.dashOffset.value=e}get gapSize(){return this.uniforms.gapSize.value}set gapSize(e){this.uniforms.gapSize.value=e}get opacity(){return this.uniforms.opacity.value}set opacity(e){this.uniforms&&(this.uniforms.opacity.value=e)}get resolution(){return this.uniforms.resolution.value}set resolution(e){this.uniforms.resolution.value.copy(e)}get alphaToCoverage(){return`USE_ALPHA_TO_COVERAGE`in this.defines}set alphaToCoverage(e){this.defines&&(e===!0!==this.alphaToCoverage&&(this.needsUpdate=!0),e===!0?this.defines.USE_ALPHA_TO_COVERAGE=``:delete this.defines.USE_ALPHA_TO_COVERAGE)}},Ke=new u,qe=new l,Je=new l,q=new u,J=new u,Y=new u,Ye=new l,Xe=new ee,X=new T,Ze=new l,Qe=new M,$e=new a,Z=new u,Q,et;function tt(e,t,n){return Z.set(0,0,-t,1).applyMatrix4(e.projectionMatrix),Z.multiplyScalar(1/Z.w),Z.x=et/n.width,Z.y=et/n.height,Z.applyMatrix4(e.projectionMatrixInverse),Z.multiplyScalar(1/Z.w),Math.abs(Math.max(Z.x,Z.y))}function nt(e,t){let n=e.matrixWorld,r=e.geometry,i=r.attributes.instanceStart,a=r.attributes.instanceEnd,o=Math.min(r.instanceCount,i.count);for(let r=0,s=o;r<s;r++){X.start.fromBufferAttribute(i,r),X.end.fromBufferAttribute(a,r),X.applyMatrix4(n);let o=new l,s=new l;Q.distanceSqToSegment(X.start,X.end,s,o),s.distanceTo(o)<et*.5&&t.push({point:s,pointOnLine:o,distance:Q.origin.distanceTo(s),object:e,face:null,faceIndex:r,uv:null,uv1:null})}}function rt(e,t,n){let r=t.projectionMatrix,i=e.material.resolution,a=e.matrixWorld,o=e.geometry,s=o.attributes.instanceStart,c=o.attributes.instanceEnd,u=Math.min(o.instanceCount,s.count),d=-t.near;Q.at(1,Y),Y.w=1,Y.applyMatrix4(t.matrixWorldInverse),Y.applyMatrix4(r),Y.multiplyScalar(1/Y.w),Y.x*=i.x/2,Y.y*=i.y/2,Y.z=0,Ye.copy(Y),Xe.multiplyMatrices(t.matrixWorldInverse,a);for(let t=0,o=u;t<o;t++){if(q.fromBufferAttribute(s,t),J.fromBufferAttribute(c,t),q.w=1,J.w=1,q.applyMatrix4(Xe),J.applyMatrix4(Xe),q.z>d&&J.z>d)continue;if(q.z>d){let e=q.z-J.z,t=(q.z-d)/e;q.lerp(J,t)}else if(J.z>d){let e=J.z-q.z,t=(J.z-d)/e;J.lerp(q,t)}q.applyMatrix4(r),J.applyMatrix4(r),q.multiplyScalar(1/q.w),J.multiplyScalar(1/J.w),q.x*=i.x/2,q.y*=i.y/2,J.x*=i.x/2,J.y*=i.y/2,X.start.copy(q),X.start.z=0,X.end.copy(J),X.end.z=0;let o=X.closestPointToPointParameter(Ye,!0);X.at(o,Ze);let u=v.lerp(q.z,J.z,o),f=u>=-1&&u<=1,p=Ye.distanceTo(Ze)<et*.5;if(f&&p){X.start.fromBufferAttribute(s,t),X.end.fromBufferAttribute(c,t),X.start.applyMatrix4(a),X.end.applyMatrix4(a);let r=new l,i=new l;Q.distanceSqToSegment(X.start,X.end,i,r),n.push({point:i,pointOnLine:r,distance:Q.origin.distanceTo(i),object:e,face:null,faceIndex:t,uv:null,uv1:null})}}}var it=class extends B{constructor(e=new We,t=new Ge({color:Math.random()*16777215})){super(e,t),this.isLineSegments2=!0,this.type=`LineSegments2`}computeLineDistances(){let e=this.geometry,t=e.attributes.instanceStart,n=e.attributes.instanceEnd,r=new Float32Array(2*t.count);for(let e=0,i=0,a=t.count;e<a;e++,i+=2)qe.fromBufferAttribute(t,e),Je.fromBufferAttribute(n,e),r[i]=i===0?0:r[i-1],r[i+1]=r[i]+qe.distanceTo(Je);let i=new N(r,2,1);return e.setAttribute(`instanceDistanceStart`,new A(i,1,0)),e.setAttribute(`instanceDistanceEnd`,new A(i,1,1)),this}raycast(e,t){let n=this.material.worldUnits,r=e.camera;r===null&&!n&&console.error(`LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.`);let i=e.params.Line2===void 0?0:e.params.Line2.threshold||0;Q=e.ray;let a=this.matrixWorld,o=this.geometry,s=this.material;et=s.linewidth+i,o.boundingSphere===null&&o.computeBoundingSphere(),$e.copy(o.boundingSphere).applyMatrix4(a);let c;if(c=n?et*.5:tt(r,Math.max(r.near,$e.distanceToPoint(Q.origin)),s.resolution),$e.radius+=c,Q.intersectsSphere($e)===!1)return;o.boundingBox===null&&o.computeBoundingBox(),Qe.copy(o.boundingBox).applyMatrix4(a);let l;l=n?et*.5:tt(r,Math.max(r.near,Qe.distanceToPoint(Q.origin)),s.resolution),Qe.expandByScalar(l),Q.intersectsBox(Qe)!==!1&&(n?nt(this,t):rt(this,r,t))}onBeforeRender(e){let t=this.material.uniforms;t&&t.resolution&&(e.getViewport(Ke),this.material.uniforms.resolution.value.set(Ke.z,Ke.w))}},at=class extends We{constructor(){super(),this.isLineGeometry=!0,this.type=`LineGeometry`}setPositions(e){let t=e.length-3,n=new Float32Array(2*t);for(let r=0;r<t;r+=3)n[2*r]=e[r],n[2*r+1]=e[r+1],n[2*r+2]=e[r+2],n[2*r+3]=e[r+3],n[2*r+4]=e[r+4],n[2*r+5]=e[r+5];return super.setPositions(n),this}setColors(e){let t=e.length-3,n=new Float32Array(2*t);for(let r=0;r<t;r+=3)n[2*r]=e[r],n[2*r+1]=e[r+1],n[2*r+2]=e[r+2],n[2*r+3]=e[r+3],n[2*r+4]=e[r+4],n[2*r+5]=e[r+5];return super.setColors(n),this}setFromPoints(e){let t=e.length-1,n=new Float32Array(6*t);for(let r=0;r<t;r++)n[6*r]=e[r].x,n[6*r+1]=e[r].y,n[6*r+2]=e[r].z||0,n[6*r+3]=e[r+1].x,n[6*r+4]=e[r+1].y,n[6*r+5]=e[r+1].z||0;return super.setPositions(n),this}fromLine(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}},ot=class extends it{constructor(e=new at,t=new Ge({color:Math.random()*16777215})){super(e,t),this.isLine2=!0,this.type=`Line2`}};function st(e,t,n){let r=(90-e)*(Math.PI/180),i=(t+180)*(Math.PI/180),a=-n*Math.sin(r)*Math.cos(i),o=n*Math.sin(r)*Math.sin(i);return new l(a,n*Math.cos(r),o)}function ct(e,t,n){let r=e.clone().add(t).multiplyScalar(.5),i=n+e.distanceTo(t)*.6;return r.normalize().multiplyScalar(i),new R(e.clone(),r,t.clone())}var lt=32e3,ut=.9,dt=2,ft=6,pt=8,mt=.6;function ht(e){let[t,n]=(0,V.useState)(null);return(0,V.useEffect)(()=>{let t=new Image;t.onload=()=>{let e=t.width,r=t.height,i=document.createElement(`canvas`);i.width=e,i.height=r;let a=i.getContext(`2d`);if(!a)return;a.drawImage(t,0,0);let o;try{o=a.getImageData(0,0,e,r)}catch{return}let s=o.data,c=(t,n)=>{let i=(n+180)/360*e,a=(90-t)/180*r,o=Math.min(e-1,Math.max(0,Math.floor(i)));return s[(Math.min(r-1,Math.max(0,Math.floor(a)))*e+o)*4]},l=c(20,10)<c(0,-150),u=(e,t)=>{let n=c(e,t);return l?n<128:n>128};n(()=>u)},t.src=e},[e]),t}function gt(e){let t=e.clone().normalize();t.x+=(Math.random()-.5)*1.6,t.y+=(Math.random()-.5)*1.6,t.z+=(Math.random()-.5)*1.6,t.normalize();let n=ft+Math.random()*pt;return[t.x*n,t.y*n,t.z*n]}function _t(e=`/uaerealeastate/earth-mask.png`){let t=ht(e);return(0,V.useMemo)(()=>{if(!t)return null;let e=[],n=[],r=[],i=[],a=[],o=[],s=[],c=Math.PI*(3-Math.sqrt(5)),u=(e,n)=>{let r=ut;return!t(e+r,n)||!t(e-r,n)||!t(e,n+r)||!t(e,n-r)},d=(e,t)=>{let n=e.clone().normalize(),r=(Math.abs(n.y)<.9?new l(0,1,0):new l(1,0,0)).cross(n).normalize(),i=n.clone().cross(r).normalize(),a=Math.random()*Math.PI*2,o=Math.random()*t;return new l().copy(n).addScaledVector(r,Math.cos(a)*o).addScaledVector(i,Math.sin(a)*o).normalize().multiplyScalar(1)},f=(t,n,i,o)=>{let[c,l,u]=gt(o),d=Math.random()*mt;e.push(t,n,i),r.push(c,l,u),a.push(d),s.push(o)};for(let e=0;e<lt;e++){let r=1-e/(lt-1)*2,a=Math.sqrt(1-r*r),s=c*e,p=Math.cos(s)*a,m=Math.sin(s)*a,h=90-Math.acos(r)*180/Math.PI,g=((Math.atan2(m,-p)*180/Math.PI-180+180)%360+360)%360-180,_=p*1,v=r*1,y=m*1,b=new l(_,v,y);if(t(h,g)){if(f(_,v,y,b),u(h,g))for(let e=0;e<dt;e++){let e=d(b,.012);f(e.x,e.y,e.z,e.clone())}}else{let[e,t,r]=gt(b),a=Math.random()*mt;n.push(_,v,y),i.push(e,t,r),o.push(a)}}return{land:new Float32Array(e),sea:new Float32Array(n),landStart:new Float32Array(r),seaStart:new Float32Array(i),landDelay:new Float32Array(a),seaDelay:new Float32Array(o),landVectors:s}},[t])}function vt(e,t){let n=1/0,r=t[0];for(let i of t){let t=i.distanceToSquared(e);t<n&&(n=t,r=i)}return r.clone()}function yt(e){return(0,V.useMemo)(()=>{if(!e||e.length===0)return[];let t=vt(st(Me[0],Me[1],1),e);return Ne.map(({lat:n,lon:r})=>{let i=vt(st(n,r,1),e),a=ct(i,t,1);return{curve:a,points:a.getPoints(64),start:i,end:t,planeNormal:new l().subVectors(a.v1,i).cross(new l().subVectors(t,i)).normalize()}})},[e])}var bt=1,xt=192,St=2;function Ct({arcs:e,dissolveProgress:t=0}){let{size:n}=P(),r=(0,V.useRef)(null),i=(0,V.useMemo)(()=>{let t=n.width<=600?1:St;return e.map(e=>{let r=e.curve.getPoints(xt),i=new Float32Array(r.length*3);r.forEach((e,t)=>{i[t*3+0]=e.x,i[t*3+1]=e.y,i[t*3+2]=e.z});let a=new at;a.setPositions(i);let o=new ot(a,new Ge({color:new k(Oe).getHex(),linewidth:t,worldUnits:!1,transparent:!0,opacity:0,depthTest:!0,depthWrite:!1,toneMapped:!1,resolution:new h(n.width,n.height)}));return o.renderOrder=1,o})},[e,n.width,n.height]);return(0,V.useEffect)(()=>{i.forEach(e=>{e.material.resolution.set(n.width,n.height)})},[i,n.width,n.height]),(0,V.useEffect)(()=>()=>{i.forEach(e=>{e.geometry.dispose(),e.material.dispose()})},[i]),j(e=>{r.current===null&&(r.current=e.clock.elapsedTime);let n=Le(e.clock.elapsedTime-r.current,Fe,Ie)*bt,a=.056,o=t>a?Math.max(0,1-(t-a)/.011):1;i.forEach(e=>{e.material.opacity=n*o})}),(0,K.jsx)(K.Fragment,{children:i.map((e,t)=>(0,K.jsx)(`primitive`,{object:e},t))})}var wt=2,Tt=.05,Et=.1,Dt=.03,Ot=.015,kt=36,At=.96,jt=.5,Mt=1,Nt=.4,Pt=jt+Mt+Nt,Ft=.03,It=[`$`,`€`,`£`,`¥`,`₹`],Lt=`#272727`,$=4;function Rt(e,t,n,r,i){e.font=`900 ${Math.round(i*.55)}px "Helvetica Neue", Helvetica, Arial, sans-serif`,e.textAlign=`center`,e.textBaseline=`middle`,e.fillStyle=je,e.fillText(t,n,r),e.lineWidth=$,e.lineCap=`round`,e.lineJoin=`round`,e.strokeStyle=Lt,e.strokeText(t,n,r)}function zt(e){let t=document.createElement(`canvas`);t.width=256,t.height=256;let n=t.getContext(`2d`);n.fillStyle=je,n.beginPath(),n.arc(128,128,128-$/2,0,Math.PI*2),n.fill(),n.lineWidth=$,n.strokeStyle=Lt,n.beginPath(),n.arc(128,128,128-$/2,0,Math.PI*2),n.stroke(),n.beginPath(),n.arc(128,128,128*.78,0,Math.PI*2),n.stroke(),Rt(n,e,128,135.68,256);let r=new F(t);return r.colorSpace=m,r.anisotropy=4,r.needsUpdate=!0,r}function Bt(){let e=1024,t=document.createElement(`canvas`);t.width=e,t.height=64;let n=t.getContext(`2d`);n.fillStyle=je,n.fillRect(0,0,e,64),n.fillStyle=Lt;for(let t=0;t<kt;t++){let r=t/kt*e;n.fillRect(r,0,$,64)}n.fillRect(0,0,e,$),n.fillRect(0,64-$,e,$);let r=new F(t);return r.colorSpace=m,r.wrapS=s,r.wrapT=x,r.anisotropy=4,r.needsUpdate=!0,r}var Vt=e=>1-(1-e)**3;function Ht({arcs:e,dissolveProgress:t=0}){let[n,r]=(0,V.useState)(null);(0,V.useEffect)(()=>{r({faces:It.map(zt),side:Bt()})},[]);let i=(0,V.useMemo)(()=>{let t=[],n=0;return e.forEach((e,r)=>{for(let e=0;e<wt;e++)t.push({arcIndex:r,phase:(e/wt+Math.random()*.3)%1,speed:Tt+Math.random()*(Et-Tt),currencyIndex:n%It.length,arrivedAt:null}),n++}),t},[e]),a=(0,V.useMemo)(()=>e.map(e=>e.curve.getLength()),[e]),o=(0,V.useMemo)(()=>n?i.map(e=>{let t=n.faces[e.currencyIndex],r={transparent:!0,opacity:0,depthWrite:!1,toneMapped:!1};return[new b({...r,map:n.side}),new b({...r,map:t}),new b({...r,map:t})]}):[],[n,i]),s=(0,V.useRef)([]),c=(0,V.useRef)(null),u=(0,V.useMemo)(()=>new l(0,1,0),[]),d=(0,V.useMemo)(()=>new l,[]),f=(0,V.useMemo)(()=>new l,[]),p=(0,V.useMemo)(()=>new l,[]),m=(0,V.useMemo)(()=>new _,[]),h=(0,V.useMemo)(()=>new _,[]),g=(0,V.useMemo)(()=>new _,[]),y=(0,V.useMemo)(()=>new _,[]),x=(0,V.useMemo)(()=>new l,[]),S=(0,V.useMemo)(()=>new l,[]),C=(0,V.useMemo)(()=>new l,[]),w=(0,V.useMemo)(()=>new l,[]),T=(0,V.useMemo)(()=>i.map(()=>({dir:new l((Math.random()-.5)*2.4,Math.random()*1.8+.2,(Math.random()-.5)*2.4).normalize(),spinAxis:new l(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize(),startProgress:Math.random()*.4,distance:10+Math.random()*8,spinAmount:(Math.random()+.6)*Math.PI*6,scaleEnd:.4+Math.random()*2.6})),[i]),E=(0,V.useMemo)(()=>new _,[]),D=(0,V.useRef)([]),O=(0,V.useRef)([]),k=(0,V.useMemo)(()=>new l,[]);return j((n,r)=>{c.current===null&&(c.current=n.clock.elapsedTime);let l=Le(n.clock.elapsedTime-c.current,Ie,3),_=n.clock.elapsedTime;i.forEach(e=>{e.arrivedAt===null?(e.phase+=r*e.speed,e.phase>=At&&(e.phase=At,e.arrivedAt=_)):_-e.arrivedAt>=Pt&&(e.phase=0,e.arrivedAt=null)});let b=[];i.forEach((e,t)=>{e.arrivedAt!==null&&b.push(t)}),b.sort((e,t)=>(i[e].arrivedAt??0)-(i[t].arrivedAt??0));let A=new Int8Array(i.length).fill(-1);b.forEach((e,t)=>{A[e]=t}),i.forEach((r,i)=>{let c=s.current[i],b=o[i];if(!c||!b)return;let j=e[r.arcIndex];if(!j)return;j.curve.getPointAt(r.phase,x),j.curve.getTangent(r.phase,f).normalize(),d.crossVectors(f,j.planeNormal).normalize();let M=x.distanceTo(n.camera.position),N=v.clamp((M-1.5)/3.5,0,1),P=v.lerp(1.05,.55,N),F=0+Dt*P+.001;S.copy(x).addScaledVector(d,F);let I=a[r.arcIndex]*r.phase/Dt,L=1;if(r.arrivedAt===null)c.position.copy(S),p.copy(j.planeNormal),h.setFromAxisAngle(u,I),m.setFromUnitVectors(u,p),g.multiplyQuaternions(m,h),c.quaternion.copy(g);else{let e=_-r.arrivedAt,t=A[i],n=j.end;w.copy(n).normalize();let a=Ft+Ot/2+t*Ot*.95;if(C.copy(n).addScaledVector(w,a),e<jt){let t=Vt(e/jt);c.position.lerpVectors(S,C,t),h.setFromAxisAngle(u,I),m.setFromUnitVectors(u,j.planeNormal),g.multiplyQuaternions(m,h),y.setFromUnitVectors(u,w),g.slerp(y,t),c.quaternion.copy(g)}else if(e<jt+Mt)c.position.copy(C),g.setFromUnitVectors(u,w),c.quaternion.copy(g);else{let t=(e-jt-Mt)/Nt;L=v.clamp(1-t,0,1),c.position.copy(C),g.setFromUnitVectors(u,w),c.quaternion.copy(g)}}if(c.scale.setScalar(P),t>0){if(O.current[i]==null){k.copy(c.position),k.project(n.camera);let e=(k.x+1)/2*window.innerWidth,r=(1-k.y)/2*window.innerHeight;(e<100||e>window.innerWidth-100||r<100||r>window.innerHeight-100||t>0)&&(O.current[i]=t)}let e=T[i],r=O.current[i],a=r==null?0:Math.min(1,(t-r)/Math.max(.05,1-r));if(a>0){if(!D.current[i]){let t=c.position.clone();t.lengthSq()>1e-4?t.normalize():t.copy(e.dir),t.x+=(Math.random()-.5)*.4,t.y+=(Math.random()-.5)*.4,t.z+=(Math.random()-.5)*.4,t.normalize(),D.current[i]=t}let t=D.current[i],n=1-(1-a)*(1-a),r=e.distance*n;c.position.x+=t.x*r,c.position.y+=t.y*r,c.position.z+=t.z*r,E.setFromAxisAngle(e.spinAxis,a*e.spinAmount),c.quaternion.multiply(E);let o=1+(e.scaleEnd-1)*a;c.scale.setScalar(P*o),L=1}else D.current[i]=null}else O.current[i]=null,D.current[i]=null;b.forEach(e=>{e.opacity=l*L})})}),i.length===0||!n?null:(0,K.jsx)(K.Fragment,{children:i.map((e,t)=>(0,K.jsx)(`group`,{ref:e=>{s.current[t]=e},renderOrder:2,children:(0,K.jsx)(`mesh`,{material:o[t],renderOrder:2,children:(0,K.jsx)(`cylinderGeometry`,{args:[Dt,Dt,Ot,48,1,!1]})})},t))})}var Ut=.036,Wt=.03;function Gt({landVectors:e}){let t=(0,V.useMemo)(()=>new l(0,1,0),[]),n=(0,V.useMemo)(()=>{let n=vt(st(Me[0],Me[1],1),e),r=n.clone().normalize();return{position:n.clone().addScaledVector(r,Wt/2),quaternion:new _().setFromUnitVectors(t,r)}},[e,t]),r=(0,V.useMemo)(()=>new L(Ut,Ut,Wt,48,1,!1),[]);(0,V.useEffect)(()=>()=>{r.dispose()},[r]);let i=(0,V.useRef)(null),a=(0,V.useRef)(null);return j(e=>{if(!i.current)return;a.current===null&&(a.current=e.clock.elapsedTime);let t=Le(e.clock.elapsedTime-a.current,Ie,3);i.current.children.forEach(e=>{let n=e.material;if(!n)return;let r=e=>{e.transparent=!0,e.opacity=t};Array.isArray(n)?n.forEach(r):r(n)})}),(0,K.jsx)(`group`,{ref:i,position:n.position,quaternion:n.quaternion,children:(0,K.jsxs)(`mesh`,{geometry:r,renderOrder:2,children:[(0,K.jsx)(`meshBasicMaterial`,{attach:`material-0`,color:ke,transparent:!0,opacity:0,toneMapped:!1}),(0,K.jsx)(`meshBasicMaterial`,{attach:`material-1`,color:Oe,transparent:!0,opacity:0,toneMapped:!1}),(0,K.jsx)(`meshBasicMaterial`,{attach:`material-2`,color:Ae,transparent:!0,opacity:0,toneMapped:!1})]})})}var Kt=1.2,qt=240,Jt=[{code:`UA`,name:`Ukraine`,flag:`🇺🇦`,lat:50.4501,lon:30.5234,body:`Wartime capital controls limit personal spending abroad to about $2,500 a month.`},{code:`LB`,name:`Lebanon`,flag:`🇱🇧`,lat:33.8938,lon:35.5018,body:`Depositors are limited to about $400 a month at official withdrawal rates.`},{code:`NG`,name:`Nigeria`,flag:`🇳🇬`,lat:6.5244,lon:3.3792,body:`The Central Bank caps individual outbound transfers at $10,000 per year.`},{code:`PK`,name:`Pakistan`,flag:`🇵🇰`,lat:24.8607,lon:67.0011,body:`State Bank approval is required for outbound real estate, months of paperwork.`},{code:`AR`,name:`Argentina`,flag:`🇦🇷`,lat:-34.6037,lon:-58.3816,body:`Strict capital controls and a triple exchange-rate regime.`},{code:`EG`,name:`Egypt`,flag:`🇪🇬`,lat:30.0444,lon:31.2357,body:`USD shortages mean banks can't always source the FX and wires queue for weeks.`},{code:`CN`,name:`China`,flag:`🇨🇳`,lat:39.9042,lon:116.4074,body:`A $50,000 annual outbound limit per citizen.`},{code:`TR`,name:`Turkey`,flag:`🇹🇷`,lat:41.0082,lon:28.9784,body:`Lira instability. Banks restrict outbound foreign-currency transfers above certain thresholds.`}],Yt={UA:{lat:2,lon:-6},EG:{lat:-10,lon:-10},LB:{lat:-8,lon:5},TR:{lat:2,lon:2},PK:{lat:-10,lon:10}};function Xt({country:e,pos:t,visible:n,sizePct:r,dissolveProgress:a,flyDx:o,flyDy:s,spinX:c,spinY:u,spinZ:d,startProgress:f,flyDistance:p,scaleEnd:m}){let h=(0,V.useRef)(null),g=(0,V.useRef)(null),_=(0,V.useRef)(0),v=(0,V.useRef)(!0),y=(0,V.useRef)(null),b=(0,V.useRef)(null),x=(0,V.useMemo)(()=>new l,[]);return j(e=>{let t=h.current,r=g.current;if(!t||!r)return;let i=r.parentElement;i&&i.style.willChange!==`transform`&&(i.style.willChange=`transform`),t.getWorldPosition(x);let l=x.x*(e.camera.position.x-x.x)+x.y*(e.camera.position.y-x.y)+x.z*(e.camera.position.z-x.z)>0;if(b.current===null&&a>0){let e=r.parentElement,t=!1;if(e){let n=e.getBoundingClientRect(),r=window.innerWidth,i=window.innerHeight,a=(n.left+n.right)/2,o=(n.top+n.bottom)/2;(a<100||a>r-100||o<100||o>i-100)&&(t=!0)}(t||a>0)&&(b.current=a)}let S=b.current??f,C=b.current===null?0:Math.min(1,(a-S)/Math.max(.05,1-S)),w=b.current;if((w===null||a<w?0:Math.min(1,(a-w)/Math.max(.05,1-w)))>0)r.style.opacity=`1`;else{let e=n&&l?1:0;e>_.current?_.current=e:_.current+=(e-_.current)*.2,r.style.opacity=`${_.current}`}if(C>0){if(!y.current){let t=x.clone().project(e.camera),n=t.x,r=-t.y,i=Math.sqrt(n*n+r*r);i>.08?(n/=i,r/=i):(n=o,r=s),n+=(Math.random()-.5)*.25,r+=(Math.random()-.5)*.25,y.current={x:n,y:r}}let t=y.current,n=1-(1-C)*(1-C),i=t.x*p*n,a=t.y*p*n,l=c*C,f=u*C,h=d*C,g=1+(m-1)*C;if(r.style.transform=`perspective(900px) translate3d(${i}px, ${a}px, 0) rotateX(${l}deg) rotateY(${f}deg) rotateZ(${h}deg) scale(${g})`,g>=3){let e=Math.min(1,(g-3)/1);r.style.filter=`blur(${e*16}px)`}else r.style.filter=``}else r.style.transform=``,r.style.filter=``,a<=0&&(y.current=null,b.current=null);l!==v.current&&(v.current=l,r.style.pointerEvents=`none`)}),(0,K.jsx)(`group`,{ref:h,position:[t.x,t.y,t.z],children:(0,K.jsx)(W,{center:!0,pointerEvents:`none`,zIndexRange:[100,0],children:(0,K.jsx)(`div`,{ref:g,className:`country-card`,style:{opacity:0,width:`${r/100*qt}px`,pointerEvents:`none`},children:(0,K.jsx)(i,{width:`100%`,height:`auto`,borderRadius:15,simple:!0,children:(0,K.jsxs)(`div`,{className:`country-card__body`,children:[(0,K.jsxs)(`div`,{className:`country-card__head`,children:[(0,K.jsx)(`img`,{className:`country-card__flag`,src:`https://flagicons.lipis.dev/flags/4x3/${e.code.toLowerCase()}.svg`,alt:`${e.name} flag`}),(0,K.jsx)(`span`,{className:`country-card__name`,children:e.name.toUpperCase()})]}),(0,K.jsx)(`p`,{className:`country-card__text`,children:e.body})]})})})})})}function Zt({visible:e,sizePct:t=100,dissolveProgress:n=0}){return(0,K.jsx)(K.Fragment,{children:(0,V.useMemo)(()=>Jt.map(e=>{let t=Yt[e.code]??{lat:0,lon:0},n=st(e.lat+t.lat,e.lon+t.lon,Kt),r=Math.random()*Math.PI*2;return{country:e,pos:n,flyDx:Math.cos(r),flyDy:Math.sin(r)-.2+(Math.random()-.5)*.5,spinX:(Math.random()-.5)*960,spinY:(Math.random()-.5)*960,spinZ:(Math.random()-.5)*720,startProgress:Math.random()*.35,flyDistance:1500+Math.random()*700,scaleEnd:Math.random()<.5?.3+Math.random()*.7:3+Math.random()*2}}),[]).map(r=>(0,K.jsx)(Xt,{country:r.country,pos:r.pos,visible:e,sizePct:t,dissolveProgress:n,flyDx:r.flyDx,flyDy:r.flyDy,spinX:r.spinX,spinY:r.spinY,spinZ:r.spinZ,startProgress:r.startProgress,flyDistance:r.flyDistance,scaleEnd:r.scaleEnd},r.country.code))})}function Qt({sphereYOffset:e,sphereScale:t,cardsVisible:n,cardSizePct:r,dissolveProgress:i,preLockProgress:a,dotSize:o}){let s=_t(),c=yt(s?.landVectors??null),l=(0,V.useMemo)(()=>{let e=st(Me[0],Me[1],1);return-Math.atan2(e.x,e.z)},[]),u=(0,V.useRef)(null),d=(0,V.useRef)(0),f=(0,V.useRef)(!1),p=Math.PI/30*.32;return j((e,t)=>{if(!u.current)return;n&&!f.current&&(d.current=0),f.current=n,d.current+=t*p;let r=Math.PI*2;d.current=((d.current+Math.PI)%r+r)%r-Math.PI;let i=n?0:a,o=d.current*(1-i);u.current.rotation.y=l+o}),s?(0,K.jsxs)(`group`,{ref:u,position:[0,e,0],scale:t,rotation:[0,l,0],children:[(0,K.jsx)(`ambientLight`,{intensity:1}),(0,K.jsxs)(`mesh`,{renderOrder:-1,children:[(0,K.jsx)(`sphereGeometry`,{args:[.99,64,64]}),(0,K.jsx)(`meshBasicMaterial`,{colorWrite:!1})]}),(0,K.jsx)(Ve,{dots:s,dissolveProgress:i,dotSize:o}),(0,K.jsx)(Zt,{visible:n,sizePct:r,dissolveProgress:i}),(0,K.jsx)(Ct,{arcs:c,dissolveProgress:i}),i<=0&&(0,K.jsx)(Gt,{landVectors:s.landVectors}),(0,K.jsx)(Ht,{arcs:c,dissolveProgress:i})]}):null}function $t({sphereYOffset:e=-.4,sphereScale:t=1,cardsVisible:n=!1,cardSizePct:r=100,dissolveProgress:i=0,preLockProgress:a=0,dotSize:o=.011}){return(0,V.useEffect)(()=>{let e=()=>window.dispatchEvent(new Event(`resize`)),t=requestAnimationFrame(e),n=setTimeout(e,100);return()=>{cancelAnimationFrame(t),clearTimeout(n)}},[]),(0,K.jsxs)(I,{camera:{position:[0,.32,3.1],fov:45},dpr:[1,2],gl:{antialias:!0,alpha:!0,preserveDrawingBuffer:!0},style:{width:`100%`,height:`100%`,background:`transparent`},children:[(0,K.jsx)(Qt,{sphereYOffset:e,sphereScale:t,cardsVisible:n,cardSizePct:r,dissolveProgress:i,preLockProgress:a,dotSize:o}),(0,K.jsx)(Ee,{autoRotate:!1,enableZoom:!1,enablePan:!1,enableRotate:n,minPolarAngle:Math.PI/2.4,maxPolarAngle:Math.PI/1.7})]})}export{$t as default};