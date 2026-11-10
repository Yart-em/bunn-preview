import{n as e,s as t,t as n}from"./jsx-runtime-2UHhqg_S.js";import{a as r,c as i,g as a,m as o,o as s}from"./index-C6ZhWggw.js";import{A as c,C as l,D as u,E as d,F as f,I as p,L as m,M as h,N as g,O as _,P as v,S as y,T as b,_ as x,a as S,b as C,c as w,d as T,f as E,g as D,h as O,i as k,j as ee,k as A,l as j,m as M,n as N,o as P,p as F,r as I,s as L,t as R,u as z,v as B,w as V,x as H,y as te}from"./react-three-fiber.esm-JrLnBl0_.js";import{a as ne,i as re,n as U,o as ie,r as ae,s as oe,t as se}from"./constants-DOIkRQdP.js";function ce(){return ce=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)({}).hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},ce.apply(null,arguments)}var W=t(e()),le=t(a()),ue=new f,de=new f,fe=new f,pe=new v;function me(e,t,n){let r=ue.setFromMatrixPosition(e.matrixWorld);r.project(t);let i=n.width/2,a=n.height/2;return[r.x*i+i,-(r.y*a)+a]}function he(e,t){let n=ue.setFromMatrixPosition(e.matrixWorld),r=de.setFromMatrixPosition(t.matrixWorld),i=n.sub(r),a=t.getWorldDirection(fe);return i.angleTo(a)>Math.PI/2}function ge(e,t,n,r){let i=ue.setFromMatrixPosition(e.matrixWorld),a=i.clone();a.project(t),pe.set(a.x,a.y),n.setFromCamera(pe,t);let o=n.intersectObjects(r,!0);if(o.length){let e=o[0].distance;return i.distanceTo(n.ray.origin)<e}return!0}function _e(e,t){if(t instanceof H)return t.zoom;if(t instanceof y){let n=ue.setFromMatrixPosition(e.matrixWorld),r=de.setFromMatrixPosition(t.matrixWorld),i=t.fov*Math.PI/180,a=n.distanceTo(r);return 1/(2*Math.tan(i/2)*a)}else return 1}function ve(e,t,n){if(t instanceof y||t instanceof H){let r=ue.setFromMatrixPosition(e.matrixWorld),i=de.setFromMatrixPosition(t.matrixWorld),a=r.distanceTo(i),o=(n[1]-n[0])/(t.far-t.near),s=n[1]-o*t.far;return Math.round(o*a+s)}}var ye=e=>Math.abs(e)<1e-10?0:e;function be(e,t,n=``){let r=`matrix3d(`;for(let n=0;n!==16;n++)r+=ye(t[n]*e.elements[n])+(n===15?`)`:`,`);return n+r}var xe=(e=>t=>be(t,e))([1,-1,1,1,1,-1,1,1,1,-1,1,1,1,-1,1,1]),Se=(e=>(t,n)=>be(t,e(n),`translate(-50%,-50%)`))(e=>[1/e,1/e,1/e,1,-1/e,-1/e,-1/e,-1,1/e,1/e,1/e,1,1,1,1,1]);function Ce(e){return e&&typeof e==`object`&&`current`in e}var we=W.forwardRef(({children:e,eps:t=.001,style:n,className:r,prepend:i,center:a,fullscreen:o,portal:s,distanceFactor:c,sprite:l=!1,transform:u=!1,occlude:d,onOcclude:p,castShadow:m,receiveShadow:h,material:g,geometry:_,zIndexRange:v=[16777271,0],calculatePosition:y=me,as:b=`div`,wrapperClass:x,pointerEvents:S=`auto`,...C},w)=>{let{gl:T,camera:E,scene:D,size:O,raycaster:k,events:ee,viewport:A}=I(),[j]=W.useState(()=>document.createElement(b)),M=W.useRef(null),P=W.useRef(null),F=W.useRef(0),L=W.useRef([0,0]),R=W.useRef(null),z=W.useRef(null),B=s?.current||ee.connected||T.domElement.parentNode,V=W.useRef(null),H=W.useRef(!1),te=W.useMemo(()=>d&&d!==`blending`||Array.isArray(d)&&d.length&&Ce(d[0]),[d]);W.useLayoutEffect(()=>{let e=T.domElement;d&&d===`blending`?(e.style.zIndex=`${Math.floor(v[0]/2)}`,e.style.position=`absolute`,e.style.pointerEvents=`none`):(e.style.zIndex=null,e.style.position=null,e.style.pointerEvents=null)},[d]),W.useLayoutEffect(()=>{if(P.current){let e=M.current=le.createRoot(j);if(D.updateMatrixWorld(),u)j.style.cssText=`position:absolute;top:0;left:0;pointer-events:none;overflow:hidden;`;else{let e=y(P.current,E,O);j.style.cssText=`position:absolute;top:0;left:0;transform:translate3d(${e[0]}px,${e[1]}px,0);transform-origin:0 0;`}return B&&(i?B.prepend(j):B.appendChild(j)),()=>{B&&B.removeChild(j),e.unmount()}}},[B,u]),W.useLayoutEffect(()=>{x&&(j.className=x)},[x]);let ne=W.useMemo(()=>u?{position:`absolute`,top:0,left:0,width:O.width,height:O.height,transformStyle:`preserve-3d`,pointerEvents:`none`}:{position:`absolute`,transform:a?`translate3d(-50%,-50%,0)`:`none`,...o&&{top:-O.height/2,left:-O.width/2,width:O.width,height:O.height},...n},[n,a,o,O,u]),re=W.useMemo(()=>({position:`absolute`,pointerEvents:S}),[S]);W.useLayoutEffect(()=>{if(H.current=!1,u){var t;(t=M.current)==null||t.render(W.createElement(`div`,{ref:R,style:ne},W.createElement(`div`,{ref:z,style:re},W.createElement(`div`,{ref:w,className:r,style:n,children:e}))))}else{var i;(i=M.current)==null||i.render(W.createElement(`div`,{ref:w,style:ne,className:r,children:e}))}});let U=W.useRef(!0);N(e=>{if(P.current){E.updateMatrixWorld(),P.current.updateWorldMatrix(!0,!1);let e=u?L.current:y(P.current,E,O);if(u||Math.abs(F.current-E.zoom)>t||Math.abs(L.current[0]-e[0])>t||Math.abs(L.current[1]-e[1])>t){let t=he(P.current,E),n=!1;te&&(Array.isArray(d)?n=d.map(e=>e.current):d!==`blending`&&(n=[D]));let r=U.current;n?U.current=ge(P.current,E,k,n)&&!t:U.current=!t,r!==U.current&&(p?p(!U.current):j.style.display=U.current?`block`:`none`);let i=Math.floor(v[0]/2),a=d?te?[v[0],i]:[i-1,0]:v;if(j.style.zIndex=`${ve(P.current,E,a)}`,u){let[e,t]=[O.width/2,O.height/2],n=E.projectionMatrix.elements[5]*t,{isOrthographicCamera:r,top:i,left:a,bottom:o,right:s}=E,u=xe(E.matrixWorldInverse),d=r?`scale(${n})translate(${ye(-(s+a)/2)}px,${ye((i+o)/2)}px)`:`translateZ(${n}px)`,f=P.current.matrixWorld;l&&(f=E.matrixWorldInverse.clone().transpose().copyPosition(f).scale(P.current.scale),f.elements[3]=f.elements[7]=f.elements[11]=0,f.elements[15]=1),j.style.width=O.width+`px`,j.style.height=O.height+`px`,j.style.perspective=r?``:`${n}px`,R.current&&z.current&&(R.current.style.transform=`${d}${u}translate(${e}px,${t}px)`,z.current.style.transform=Se(f,1/((c||10)/400)))}else{let t=c===void 0?1:_e(P.current,E)*c;j.style.transform=`translate3d(${e[0]}px,${e[1]}px,0) scale(${t})`}L.current=e,F.current=E.zoom}}if(!te&&V.current&&!H.current)if(u){if(R.current){let e=R.current.children[0];if(e!=null&&e.clientWidth&&e!=null&&e.clientHeight){let{isOrthographicCamera:t}=E;if(t||_)C.scale&&(Array.isArray(C.scale)?C.scale instanceof f?V.current.scale.copy(C.scale.clone().divideScalar(1)):V.current.scale.set(1/C.scale[0],1/C.scale[1],1/C.scale[2]):V.current.scale.setScalar(1/C.scale));else{let t=(c||10)/400,n=e.clientWidth*t,r=e.clientHeight*t;V.current.scale.set(n,r,1)}H.current=!0}}}else{let t=j.children[0];if(t!=null&&t.clientWidth&&t!=null&&t.clientHeight){let e=1/A.factor,n=t.clientWidth*e,r=t.clientHeight*e;V.current.scale.set(n,r,1),H.current=!0}V.current.lookAt(e.camera.position)}});let ie=W.useMemo(()=>({vertexShader:u?void 0:`
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
      `}),[u]);return W.createElement(`group`,ce({},C,{ref:P}),d&&!te&&W.createElement(`mesh`,{castShadow:m,receiveShadow:h,ref:V},_||W.createElement(`planeGeometry`,null),g||W.createElement(`shaderMaterial`,{side:2,vertexShader:ie.vertexShader,fragmentShader:ie.fragmentShader})))}),Te=Object.defineProperty,Ee=(e,t,n)=>t in e?Te(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,De=(e,t,n)=>(Ee(e,typeof t==`symbol`?t:t+``,n),n),Oe=class{constructor(){De(this,`_listeners`)}addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;let n=this._listeners;return n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;let n=this._listeners[e];if(n!==void 0){let e=n.indexOf(t);e!==-1&&n.splice(e,1)}}dispatchEvent(e){if(this._listeners===void 0)return;let t=this._listeners[e.type];if(t!==void 0){e.target=this;let n=t.slice(0);for(let t=0,r=n.length;t<r;t++)n[t].call(this,e);e.target=null}}},ke=Object.defineProperty,Ae=(e,t,n)=>t in e?ke(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,G=(e,t,n)=>(Ae(e,typeof t==`symbol`?t:t+``,n),n),je=new d,Me=new l,Ne=Math.cos(Math.PI/180*70),Pe=(e,t)=>(e%t+t)%t,Fe=class extends Oe{constructor(e,t){super(),G(this,`object`),G(this,`domElement`),G(this,`enabled`,!0),G(this,`target`,new f),G(this,`minDistance`,0),G(this,`maxDistance`,1/0),G(this,`minZoom`,0),G(this,`maxZoom`,1/0),G(this,`minPolarAngle`,0),G(this,`maxPolarAngle`,Math.PI),G(this,`minAzimuthAngle`,-1/0),G(this,`maxAzimuthAngle`,1/0),G(this,`enableDamping`,!1),G(this,`dampingFactor`,.05),G(this,`enableZoom`,!0),G(this,`zoomSpeed`,1),G(this,`enableRotate`,!0),G(this,`rotateSpeed`,1),G(this,`enablePan`,!0),G(this,`panSpeed`,1),G(this,`screenSpacePanning`,!0),G(this,`keyPanSpeed`,7),G(this,`zoomToCursor`,!1),G(this,`autoRotate`,!1),G(this,`autoRotateSpeed`,2),G(this,`reverseOrbit`,!1),G(this,`reverseHorizontalOrbit`,!1),G(this,`reverseVerticalOrbit`,!1),G(this,`keys`,{LEFT:`ArrowLeft`,UP:`ArrowUp`,RIGHT:`ArrowRight`,BOTTOM:`ArrowDown`}),G(this,`mouseButtons`,{LEFT:D.ROTATE,MIDDLE:D.DOLLY,RIGHT:D.PAN}),G(this,`touches`,{ONE:h.ROTATE,TWO:h.DOLLY_PAN}),G(this,`target0`),G(this,`position0`),G(this,`zoom0`),G(this,`_domElementKeyEvents`,null),G(this,`getPolarAngle`),G(this,`getAzimuthalAngle`),G(this,`setPolarAngle`),G(this,`setAzimuthalAngle`),G(this,`getDistance`),G(this,`getZoomScale`),G(this,`listenToKeyEvents`),G(this,`stopListenToKeyEvents`),G(this,`saveState`),G(this,`reset`),G(this,`update`),G(this,`connect`),G(this,`dispose`),G(this,`dollyIn`),G(this,`dollyOut`),G(this,`getScale`),G(this,`setScale`),this.object=e,this.domElement=t,this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this.getPolarAngle=()=>l.phi,this.getAzimuthalAngle=()=>l.theta,this.setPolarAngle=e=>{let t=Pe(e,2*Math.PI),r=l.phi;r<0&&(r+=2*Math.PI),t<0&&(t+=2*Math.PI);let i=Math.abs(t-r);2*Math.PI-i<i&&(t<r?t+=2*Math.PI:r+=2*Math.PI),u.phi=t-r,n.update()},this.setAzimuthalAngle=e=>{let t=Pe(e,2*Math.PI),r=l.theta;r<0&&(r+=2*Math.PI),t<0&&(t+=2*Math.PI);let i=Math.abs(t-r);2*Math.PI-i<i&&(t<r?t+=2*Math.PI:r+=2*Math.PI),u.theta=t-r,n.update()},this.getDistance=()=>n.object.position.distanceTo(n.target),this.listenToKeyEvents=e=>{e.addEventListener(`keydown`,Ee),this._domElementKeyEvents=e},this.stopListenToKeyEvents=()=>{this._domElementKeyEvents.removeEventListener(`keydown`,Ee),this._domElementKeyEvents=null},this.saveState=()=>{n.target0.copy(n.target),n.position0.copy(n.object.position),n.zoom0=n.object.zoom},this.reset=()=>{n.target.copy(n.target0),n.object.position.copy(n.position0),n.object.zoom=n.zoom0,n.object.updateProjectionMatrix(),n.dispatchEvent(r),n.update(),s=o.NONE},this.update=(()=>{let t=new f,i=new f(0,1,0),a=new b().setFromUnitVectors(e.up,i),m=a.clone().invert(),h=new f,g=new b,_=2*Math.PI;return function(){let v=n.object.position;a.setFromUnitVectors(e.up,i),m.copy(a).invert(),t.copy(v).sub(n.target),t.applyQuaternion(a),l.setFromVector3(t),n.autoRotate&&s===o.NONE&&F(N()),n.enableDamping?(l.theta+=u.theta*n.dampingFactor,l.phi+=u.phi*n.dampingFactor):(l.theta+=u.theta,l.phi+=u.phi);let b=n.minAzimuthAngle,x=n.maxAzimuthAngle;isFinite(b)&&isFinite(x)&&(b<-Math.PI?b+=_:b>Math.PI&&(b-=_),x<-Math.PI?x+=_:x>Math.PI&&(x-=_),b<=x?l.theta=Math.max(b,Math.min(x,l.theta)):l.theta=l.theta>(b+x)/2?Math.max(b,l.theta):Math.min(x,l.theta)),l.phi=Math.max(n.minPolarAngle,Math.min(n.maxPolarAngle,l.phi)),l.makeSafe(),n.enableDamping===!0?n.target.addScaledVector(p,n.dampingFactor):n.target.add(p),n.zoomToCursor&&A||n.object.isOrthographicCamera?l.radius=re(l.radius):l.radius=re(l.radius*d),t.setFromSpherical(l),t.applyQuaternion(m),v.copy(n.target).add(t),n.object.matrixAutoUpdate||n.object.updateMatrix(),n.object.lookAt(n.target),n.enableDamping===!0?(u.theta*=1-n.dampingFactor,u.phi*=1-n.dampingFactor,p.multiplyScalar(1-n.dampingFactor)):(u.set(0,0,0),p.set(0,0,0));let S=!1;if(n.zoomToCursor&&A){let r=null;if(n.object instanceof y&&n.object.isPerspectiveCamera){let e=t.length();r=re(e*d);let i=e-r;n.object.position.addScaledVector(O,i),n.object.updateMatrixWorld()}else if(n.object.isOrthographicCamera){let e=new f(k.x,k.y,0);e.unproject(n.object),n.object.zoom=Math.max(n.minZoom,Math.min(n.maxZoom,n.object.zoom/d)),n.object.updateProjectionMatrix(),S=!0;let i=new f(k.x,k.y,0);i.unproject(n.object),n.object.position.sub(i).add(e),n.object.updateMatrixWorld(),r=t.length()}else console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled.`),n.zoomToCursor=!1;r!==null&&(n.screenSpacePanning?n.target.set(0,0,-1).transformDirection(n.object.matrix).multiplyScalar(r).add(n.object.position):(je.origin.copy(n.object.position),je.direction.set(0,0,-1).transformDirection(n.object.matrix),Math.abs(n.object.up.dot(je.direction))<Ne?e.lookAt(n.target):(Me.setFromNormalAndCoplanarPoint(n.object.up,n.target),je.intersectPlane(Me,n.target))))}else n.object instanceof H&&n.object.isOrthographicCamera&&(S=d!==1,S&&(n.object.zoom=Math.max(n.minZoom,Math.min(n.maxZoom,n.object.zoom/d)),n.object.updateProjectionMatrix()));return d=1,A=!1,S||h.distanceToSquared(n.object.position)>c||8*(1-g.dot(n.object.quaternion))>c?(n.dispatchEvent(r),h.copy(n.object.position),g.copy(n.object.quaternion),S=!1,!0):!1}})(),this.connect=e=>{n.domElement=e,n.domElement.style.touchAction=`none`,n.domElement.addEventListener(`contextmenu`,ke),n.domElement.addEventListener(`pointerdown`,be),n.domElement.addEventListener(`pointercancel`,Se),n.domElement.addEventListener(`wheel`,Te)},this.dispose=()=>{var e,t,r,i,a,o;n.domElement&&(n.domElement.style.touchAction=`auto`),(e=n.domElement)==null||e.removeEventListener(`contextmenu`,ke),(t=n.domElement)==null||t.removeEventListener(`pointerdown`,be),(r=n.domElement)==null||r.removeEventListener(`pointercancel`,Se),(i=n.domElement)==null||i.removeEventListener(`wheel`,Te),(a=n.domElement)==null||a.ownerDocument.removeEventListener(`pointermove`,xe),(o=n.domElement)==null||o.ownerDocument.removeEventListener(`pointerup`,Se),n._domElementKeyEvents!==null&&n._domElementKeyEvents.removeEventListener(`keydown`,Ee)};let n=this,r={type:`change`},i={type:`start`},a={type:`end`},o={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},s=o.NONE,c=1e-6,l=new ee,u=new ee,d=1,p=new f,m=new v,g=new v,_=new v,x=new v,S=new v,C=new v,w=new v,T=new v,E=new v,O=new f,k=new v,A=!1,j=[],M={};function N(){return 2*Math.PI/60/60*n.autoRotateSpeed}function P(){return .95**n.zoomSpeed}function F(e){n.reverseOrbit||n.reverseHorizontalOrbit?u.theta+=e:u.theta-=e}function I(e){n.reverseOrbit||n.reverseVerticalOrbit?u.phi+=e:u.phi-=e}let L=(()=>{let e=new f;return function(t,n){e.setFromMatrixColumn(n,0),e.multiplyScalar(-t),p.add(e)}})(),R=(()=>{let e=new f;return function(t,r){n.screenSpacePanning===!0?e.setFromMatrixColumn(r,1):(e.setFromMatrixColumn(r,0),e.crossVectors(n.object.up,e)),e.multiplyScalar(t),p.add(e)}})(),z=(()=>{let e=new f;return function(t,r){let i=n.domElement;if(i&&n.object instanceof y&&n.object.isPerspectiveCamera){let a=n.object.position;e.copy(a).sub(n.target);let o=e.length();o*=Math.tan(n.object.fov/2*Math.PI/180),L(2*t*o/i.clientHeight,n.object.matrix),R(2*r*o/i.clientHeight,n.object.matrix)}else i&&n.object instanceof H&&n.object.isOrthographicCamera?(L(t*(n.object.right-n.object.left)/n.object.zoom/i.clientWidth,n.object.matrix),R(r*(n.object.top-n.object.bottom)/n.object.zoom/i.clientHeight,n.object.matrix)):(console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.`),n.enablePan=!1)}})();function B(e){n.object instanceof y&&n.object.isPerspectiveCamera||n.object instanceof H&&n.object.isOrthographicCamera?d=e:(console.warn(`WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.`),n.enableZoom=!1)}function V(e){B(d/e)}function te(e){B(d*e)}function ne(e){if(!n.zoomToCursor||!n.domElement)return;A=!0;let t=n.domElement.getBoundingClientRect(),r=e.clientX-t.left,i=e.clientY-t.top,a=t.width,o=t.height;k.x=r/a*2-1,k.y=-(i/o)*2+1,O.set(k.x,k.y,1).unproject(n.object).sub(n.object.position).normalize()}function re(e){return Math.max(n.minDistance,Math.min(n.maxDistance,e))}function U(e){m.set(e.clientX,e.clientY)}function ie(e){ne(e),w.set(e.clientX,e.clientY)}function ae(e){x.set(e.clientX,e.clientY)}function oe(e){g.set(e.clientX,e.clientY),_.subVectors(g,m).multiplyScalar(n.rotateSpeed);let t=n.domElement;t&&(F(2*Math.PI*_.x/t.clientHeight),I(2*Math.PI*_.y/t.clientHeight)),m.copy(g),n.update()}function se(e){T.set(e.clientX,e.clientY),E.subVectors(T,w),E.y>0?V(P()):E.y<0&&te(P()),w.copy(T),n.update()}function ce(e){S.set(e.clientX,e.clientY),C.subVectors(S,x).multiplyScalar(n.panSpeed),z(C.x,C.y),x.copy(S),n.update()}function W(e){ne(e),e.deltaY<0?te(P()):e.deltaY>0&&V(P()),n.update()}function le(e){let t=!1;switch(e.code){case n.keys.UP:z(0,n.keyPanSpeed),t=!0;break;case n.keys.BOTTOM:z(0,-n.keyPanSpeed),t=!0;break;case n.keys.LEFT:z(n.keyPanSpeed,0),t=!0;break;case n.keys.RIGHT:z(-n.keyPanSpeed,0),t=!0;break}t&&(e.preventDefault(),n.update())}function ue(){if(j.length==1)m.set(j[0].pageX,j[0].pageY);else{let e=.5*(j[0].pageX+j[1].pageX),t=.5*(j[0].pageY+j[1].pageY);m.set(e,t)}}function de(){if(j.length==1)x.set(j[0].pageX,j[0].pageY);else{let e=.5*(j[0].pageX+j[1].pageX),t=.5*(j[0].pageY+j[1].pageY);x.set(e,t)}}function fe(){let e=j[0].pageX-j[1].pageX,t=j[0].pageY-j[1].pageY,n=Math.sqrt(e*e+t*t);w.set(0,n)}function pe(){n.enableZoom&&fe(),n.enablePan&&de()}function me(){n.enableZoom&&fe(),n.enableRotate&&ue()}function he(e){if(j.length==1)g.set(e.pageX,e.pageY);else{let t=Le(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);g.set(n,r)}_.subVectors(g,m).multiplyScalar(n.rotateSpeed);let t=n.domElement;t&&(F(2*Math.PI*_.x/t.clientHeight),I(2*Math.PI*_.y/t.clientHeight)),m.copy(g)}function ge(e){if(j.length==1)S.set(e.pageX,e.pageY);else{let t=Le(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);S.set(n,r)}C.subVectors(S,x).multiplyScalar(n.panSpeed),z(C.x,C.y),x.copy(S)}function _e(e){let t=Le(e),r=e.pageX-t.x,i=e.pageY-t.y,a=Math.sqrt(r*r+i*i);T.set(0,a),E.set(0,(T.y/w.y)**+n.zoomSpeed),V(E.y),w.copy(T)}function ve(e){n.enableZoom&&_e(e),n.enablePan&&ge(e)}function ye(e){n.enableZoom&&_e(e),n.enableRotate&&he(e)}function be(e){var t,r;n.enabled!==!1&&(j.length===0&&((t=n.domElement)==null||t.ownerDocument.addEventListener(`pointermove`,xe),(r=n.domElement)==null||r.ownerDocument.addEventListener(`pointerup`,Se)),Ae(e),e.pointerType===`touch`?De(e):Ce(e))}function xe(e){n.enabled!==!1&&(e.pointerType===`touch`?Oe(e):we(e))}function Se(e){var t,r,i;Fe(e),j.length===0&&((t=n.domElement)==null||t.releasePointerCapture(e.pointerId),(r=n.domElement)==null||r.ownerDocument.removeEventListener(`pointermove`,xe),(i=n.domElement)==null||i.ownerDocument.removeEventListener(`pointerup`,Se)),n.dispatchEvent(a),s=o.NONE}function Ce(e){let t;switch(e.button){case 0:t=n.mouseButtons.LEFT;break;case 1:t=n.mouseButtons.MIDDLE;break;case 2:t=n.mouseButtons.RIGHT;break;default:t=-1}switch(t){case D.DOLLY:if(n.enableZoom===!1)return;ie(e),s=o.DOLLY;break;case D.ROTATE:if(e.ctrlKey||e.metaKey||e.shiftKey){if(n.enablePan===!1)return;ae(e),s=o.PAN}else{if(n.enableRotate===!1)return;U(e),s=o.ROTATE}break;case D.PAN:if(e.ctrlKey||e.metaKey||e.shiftKey){if(n.enableRotate===!1)return;U(e),s=o.ROTATE}else{if(n.enablePan===!1)return;ae(e),s=o.PAN}break;default:s=o.NONE}s!==o.NONE&&n.dispatchEvent(i)}function we(e){if(n.enabled!==!1)switch(s){case o.ROTATE:if(n.enableRotate===!1)return;oe(e);break;case o.DOLLY:if(n.enableZoom===!1)return;se(e);break;case o.PAN:if(n.enablePan===!1)return;ce(e);break}}function Te(e){n.enabled===!1||n.enableZoom===!1||s!==o.NONE&&s!==o.ROTATE||(e.preventDefault(),n.dispatchEvent(i),W(e),n.dispatchEvent(a))}function Ee(e){n.enabled===!1||n.enablePan===!1||le(e)}function De(e){switch(Ie(e),j.length){case 1:switch(n.touches.ONE){case h.ROTATE:if(n.enableRotate===!1)return;ue(),s=o.TOUCH_ROTATE;break;case h.PAN:if(n.enablePan===!1)return;de(),s=o.TOUCH_PAN;break;default:s=o.NONE}break;case 2:switch(n.touches.TWO){case h.DOLLY_PAN:if(n.enableZoom===!1&&n.enablePan===!1)return;pe(),s=o.TOUCH_DOLLY_PAN;break;case h.DOLLY_ROTATE:if(n.enableZoom===!1&&n.enableRotate===!1)return;me(),s=o.TOUCH_DOLLY_ROTATE;break;default:s=o.NONE}break;default:s=o.NONE}s!==o.NONE&&n.dispatchEvent(i)}function Oe(e){switch(Ie(e),s){case o.TOUCH_ROTATE:if(n.enableRotate===!1)return;he(e),n.update();break;case o.TOUCH_PAN:if(n.enablePan===!1)return;ge(e),n.update();break;case o.TOUCH_DOLLY_PAN:if(n.enableZoom===!1&&n.enablePan===!1)return;ve(e),n.update();break;case o.TOUCH_DOLLY_ROTATE:if(n.enableZoom===!1&&n.enableRotate===!1)return;ye(e),n.update();break;default:s=o.NONE}}function ke(e){n.enabled!==!1&&e.preventDefault()}function Ae(e){j.push(e)}function Fe(e){delete M[e.pointerId];for(let t=0;t<j.length;t++)if(j[t].pointerId==e.pointerId){j.splice(t,1);return}}function Ie(e){let t=M[e.pointerId];t===void 0&&(t=new v,M[e.pointerId]=t),t.set(e.pageX,e.pageY)}function Le(e){return M[(e.pointerId===j[0].pointerId?j[1]:j[0]).pointerId]}this.dollyIn=(e=P())=>{te(e),n.update()},this.dollyOut=(e=P())=>{V(e),n.update()},this.getScale=()=>d,this.setScale=e=>{B(e),n.update()},this.getZoomScale=()=>P(),t!==void 0&&this.connect(t),this.update()}},Ie=W.forwardRef(({makeDefault:e,camera:t,regress:n,domElement:r,enableDamping:i=!0,keyEvents:a=!1,onChange:o,onStart:s,onEnd:c,...l},u)=>{let d=I(e=>e.invalidate),f=I(e=>e.camera),p=I(e=>e.gl),m=I(e=>e.events),h=I(e=>e.setEvents),g=I(e=>e.set),_=I(e=>e.get),v=I(e=>e.performance),y=t||f,b=r||m.connected||p.domElement,x=W.useMemo(()=>new Fe(y),[y]);return N(()=>{x.enabled&&x.update()},-1),W.useEffect(()=>(a&&x.connect(a===!0?b:a),x.connect(b),()=>void x.dispose()),[a,b,n,x,d]),W.useEffect(()=>{let e=e=>{d(),n&&v.regress(),o&&o(e)},t=e=>{s&&s(e)},r=e=>{c&&c(e)};return x.addEventListener(`change`,e),x.addEventListener(`start`,t),x.addEventListener(`end`,r),()=>{x.removeEventListener(`start`,t),x.removeEventListener(`end`,r),x.removeEventListener(`change`,e)}},[o,s,c,x,d,h]),W.useEffect(()=>{if(e){let e=_().controls;return g({controls:x}),()=>g({controls:e})}},[e,x]),W.createElement(`primitive`,ce({ref:u,object:x,enableDamping:i},l))}),Le=1.4,Re=1.9,ze=2.5,Be=.6,Ve=1.2;function He(e,t){return e.current===null&&(e.current=t),t-e.current}function Ue(e,t,n){return e<=t?0:e>=n?1:(e-t)/(n-t)}var K=n();function We(){let e=document.createElement(`canvas`);e.width=128,e.height=128;let t=e.getContext(`2d`);t.fillStyle=`#ffffff`,t.beginPath(),t.arc(128/2,128/2,128/2-2,0,Math.PI*2),t.fill();let n=new L(e);return n.anisotropy=4,n.needsUpdate=!0,n}function Ge({start:e,target:t,delay:n,color:r,size:i,texture:a,entryStart:o,dissolveProgress:s=0}){let c=(0,W.useMemo)(()=>{let e=0;for(let t=0;t<n.length;t++)n[t]>e&&(e=n[t]);return e},[n]),l=(0,W.useRef)(!1),u=(0,W.useMemo)(()=>({uCamPos:{value:new f},uMinSizeMul:{value:.45},uMinAlphaMul:{value:.55},uGatherTime:{value:0},uGatherDuration:{value:Le}}),[]);return N(e=>{u.uCamPos.value.copy(e.camera.position);let t=c+Le;if(s>0){u.uGatherTime.value=(1-s)*t;return}if(l.current){u.uGatherTime.value=t;return}let n=He(o,e.clock.elapsedTime);u.uGatherTime.value=n,n>=t&&(l.current=!0)}),(0,K.jsxs)(`points`,{frustumCulled:!1,children:[(0,K.jsxs)(`bufferGeometry`,{children:[(0,K.jsx)(`bufferAttribute`,{attach:`attributes-position`,args:[t,3]}),(0,K.jsx)(`bufferAttribute`,{attach:`attributes-aStart`,args:[e,3]}),(0,K.jsx)(`bufferAttribute`,{attach:`attributes-aDelay`,args:[n,1]})]}),(0,K.jsx)(`pointsMaterial`,{color:r,size:i,sizeAttenuation:!0,map:a,transparent:!0,alphaTest:.5,depthWrite:!1,depthTest:!1,onBeforeCompile:e=>{e.uniforms.uCamPos=u.uCamPos,e.uniforms.uMinSizeMul=u.uMinSizeMul,e.uniforms.uMinAlphaMul=u.uMinAlphaMul,e.uniforms.uGatherTime=u.uGatherTime,e.uniforms.uGatherDuration=u.uGatherDuration,e.vertexShader=e.vertexShader.replace(`#include <common>`,`#include <common>
         uniform vec3 uCamPos;
         uniform float uMinSizeMul;
         uniform float uMinAlphaMul;
         uniform float uGatherTime;
         uniform float uGatherDuration;
         attribute vec3 aStart;
         attribute float aDelay;
         varying float vFacing;`).replace(`#include <begin_vertex>`,`float gatherT = clamp((uGatherTime - aDelay) / uGatherDuration, 0.0, 1.0);
         float gatherLeft = 1.0 - gatherT;
         vec3 transformed = mix(aStart, position, 1.0 - gatherLeft * gatherLeft * gatherLeft);
         {
           vec3 worldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
           vec3 sphereNormal = normalize(worldPos);
           vec3 toCam = normalize(uCamPos - worldPos);
           vFacing = dot(sphereNormal, toCam);
         }`).replace(`gl_PointSize = size;`,`float facing01 = (vFacing + 1.0) * 0.5;
         gl_PointSize = size * mix(uMinSizeMul, 1.0, facing01);`),e.fragmentShader=e.fragmentShader.replace(`#include <common>`,`#include <common>
         uniform float uMinAlphaMul;
         varying float vFacing;`).replace(`#include <output_fragment>`,`#include <output_fragment>
         float facing01 = (vFacing + 1.0) * 0.5;
         gl_FragColor.a *= mix(uMinAlphaMul, 1.0, facing01);`)}})]})}function Ke({dots:e,entryStart:t,dissolveProgress:n=0,dotSize:r=.011}){let i=(0,W.useMemo)(We,[]);return(0,K.jsx)(`group`,{children:(0,K.jsx)(Ge,{start:e.landStart,target:e.land,delay:e.landDelay,color:re,size:r,texture:i,entryStart:t,dissolveProgress:n})})}var qe=new P,Je=new f,Ye=class extends E{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type=`LineSegmentsGeometry`,this.setIndex([0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5]),this.setAttribute(`position`,new T([-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],3)),this.setAttribute(`uv`,new T([-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],2))}applyMatrix4(e){let t=this.attributes.instanceStart,n=this.attributes.instanceEnd;return t!==void 0&&(t.applyMatrix4(e),n.applyMatrix4(e),t.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}setPositions(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let n=new F(t,6,1);return this.setAttribute(`instanceStart`,new M(n,3,0)),this.setAttribute(`instanceEnd`,new M(n,3,3)),this.instanceCount=this.attributes.instanceStart.count,this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let n=new F(t,6,1);return this.setAttribute(`instanceColorStart`,new M(n,3,0)),this.setAttribute(`instanceColorEnd`,new M(n,3,3)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new m(e.geometry)),this}fromLineSegments(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new P);let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;e!==void 0&&t!==void 0&&(this.boundingBox.setFromBufferAttribute(e),qe.setFromBufferAttribute(t),this.boundingBox.union(qe))}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new c),this.boundingBox===null&&this.computeBoundingBox();let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;if(e!==void 0&&t!==void 0){let n=this.boundingSphere.center;this.boundingBox.getCenter(n);let r=0;for(let i=0,a=e.count;i<a;i++)Je.fromBufferAttribute(e,i),r=Math.max(r,n.distanceToSquared(Je)),Je.fromBufferAttribute(t,i),r=Math.max(r,n.distanceToSquared(Je));this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error(`THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.`,this)}}toJSON(){}};S.line={worldUnits:{value:1},linewidth:{value:1},resolution:{value:new v(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}},k.line={uniforms:g.merge([S.common,S.fog,S.line]),vertexShader:`
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
		`};var Xe=class extends A{constructor(e){super({type:`LineMaterial`,uniforms:g.clone(k.line.uniforms),vertexShader:k.line.vertexShader,fragmentShader:k.line.fragmentShader,clipping:!0}),this.isLineMaterial=!0,this.setValues(e)}get color(){return this.uniforms.diffuse.value}set color(e){this.uniforms.diffuse.value=e}get worldUnits(){return`WORLD_UNITS`in this.defines}set worldUnits(e){e===!0!==this.worldUnits&&(this.needsUpdate=!0),e===!0?this.defines.WORLD_UNITS=``:delete this.defines.WORLD_UNITS}get linewidth(){return this.uniforms.linewidth.value}set linewidth(e){this.uniforms.linewidth&&(this.uniforms.linewidth.value=e)}get dashed(){return`USE_DASH`in this.defines}set dashed(e){e===!0!==this.dashed&&(this.needsUpdate=!0),e===!0?this.defines.USE_DASH=``:delete this.defines.USE_DASH}get dashScale(){return this.uniforms.dashScale.value}set dashScale(e){this.uniforms.dashScale.value=e}get dashSize(){return this.uniforms.dashSize.value}set dashSize(e){this.uniforms.dashSize.value=e}get dashOffset(){return this.uniforms.dashOffset.value}set dashOffset(e){this.uniforms.dashOffset.value=e}get gapSize(){return this.uniforms.gapSize.value}set gapSize(e){this.uniforms.gapSize.value=e}get opacity(){return this.uniforms.opacity.value}set opacity(e){this.uniforms&&(this.uniforms.opacity.value=e)}get resolution(){return this.uniforms.resolution.value}set resolution(e){this.uniforms.resolution.value.copy(e)}get alphaToCoverage(){return`USE_ALPHA_TO_COVERAGE`in this.defines}set alphaToCoverage(e){this.defines&&(e===!0!==this.alphaToCoverage&&(this.needsUpdate=!0),e===!0?this.defines.USE_ALPHA_TO_COVERAGE=``:delete this.defines.USE_ALPHA_TO_COVERAGE)}},Ze=new p,Qe=new f,$e=new f,q=new p,J=new p,Y=new p,et=new f,tt=new B,X=new O,nt=new f,rt=new P,it=new c,Z=new p,Q,at;function ot(e,t,n){return Z.set(0,0,-t,1).applyMatrix4(e.projectionMatrix),Z.multiplyScalar(1/Z.w),Z.x=at/n.width,Z.y=at/n.height,Z.applyMatrix4(e.projectionMatrixInverse),Z.multiplyScalar(1/Z.w),Math.abs(Math.max(Z.x,Z.y))}function st(e,t){let n=e.matrixWorld,r=e.geometry,i=r.attributes.instanceStart,a=r.attributes.instanceEnd,o=Math.min(r.instanceCount,i.count);for(let r=0,s=o;r<s;r++){X.start.fromBufferAttribute(i,r),X.end.fromBufferAttribute(a,r),X.applyMatrix4(n);let o=new f,s=new f;Q.distanceSqToSegment(X.start,X.end,s,o),s.distanceTo(o)<at*.5&&t.push({point:s,pointOnLine:o,distance:Q.origin.distanceTo(s),object:e,face:null,faceIndex:r,uv:null,uv1:null})}}function ct(e,t,n){let r=t.projectionMatrix,i=e.material.resolution,a=e.matrixWorld,o=e.geometry,s=o.attributes.instanceStart,c=o.attributes.instanceEnd,l=Math.min(o.instanceCount,s.count),u=-t.near;Q.at(1,Y),Y.w=1,Y.applyMatrix4(t.matrixWorldInverse),Y.applyMatrix4(r),Y.multiplyScalar(1/Y.w),Y.x*=i.x/2,Y.y*=i.y/2,Y.z=0,et.copy(Y),tt.multiplyMatrices(t.matrixWorldInverse,a);for(let t=0,o=l;t<o;t++){if(q.fromBufferAttribute(s,t),J.fromBufferAttribute(c,t),q.w=1,J.w=1,q.applyMatrix4(tt),J.applyMatrix4(tt),q.z>u&&J.z>u)continue;if(q.z>u){let e=q.z-J.z,t=(q.z-u)/e;q.lerp(J,t)}else if(J.z>u){let e=J.z-q.z,t=(J.z-u)/e;J.lerp(q,t)}q.applyMatrix4(r),J.applyMatrix4(r),q.multiplyScalar(1/q.w),J.multiplyScalar(1/J.w),q.x*=i.x/2,q.y*=i.y/2,J.x*=i.x/2,J.y*=i.y/2,X.start.copy(q),X.start.z=0,X.end.copy(J),X.end.z=0;let o=X.closestPointToPointParameter(et,!0);X.at(o,nt);let l=x.lerp(q.z,J.z,o),d=l>=-1&&l<=1,p=et.distanceTo(nt)<at*.5;if(d&&p){X.start.fromBufferAttribute(s,t),X.end.fromBufferAttribute(c,t),X.start.applyMatrix4(a),X.end.applyMatrix4(a);let r=new f,i=new f;Q.distanceSqToSegment(X.start,X.end,i,r),n.push({point:i,pointOnLine:r,distance:Q.origin.distanceTo(i),object:e,face:null,faceIndex:t,uv:null,uv1:null})}}}var lt=class extends te{constructor(e=new Ye,t=new Xe({color:Math.random()*16777215})){super(e,t),this.isLineSegments2=!0,this.type=`LineSegments2`}computeLineDistances(){let e=this.geometry,t=e.attributes.instanceStart,n=e.attributes.instanceEnd,r=new Float32Array(2*t.count);for(let e=0,i=0,a=t.count;e<a;e++,i+=2)Qe.fromBufferAttribute(t,e),$e.fromBufferAttribute(n,e),r[i]=i===0?0:r[i-1],r[i+1]=r[i]+Qe.distanceTo($e);let i=new F(r,2,1);return e.setAttribute(`instanceDistanceStart`,new M(i,1,0)),e.setAttribute(`instanceDistanceEnd`,new M(i,1,1)),this}raycast(e,t){let n=this.material.worldUnits,r=e.camera;r===null&&!n&&console.error(`LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.`);let i=e.params.Line2===void 0?0:e.params.Line2.threshold||0;Q=e.ray;let a=this.matrixWorld,o=this.geometry,s=this.material;at=s.linewidth+i,o.boundingSphere===null&&o.computeBoundingSphere(),it.copy(o.boundingSphere).applyMatrix4(a);let c;if(c=n?at*.5:ot(r,Math.max(r.near,it.distanceToPoint(Q.origin)),s.resolution),it.radius+=c,Q.intersectsSphere(it)===!1)return;o.boundingBox===null&&o.computeBoundingBox(),rt.copy(o.boundingBox).applyMatrix4(a);let l;l=n?at*.5:ot(r,Math.max(r.near,rt.distanceToPoint(Q.origin)),s.resolution),rt.expandByScalar(l),Q.intersectsBox(rt)!==!1&&(n?st(this,t):ct(this,r,t))}onBeforeRender(e){let t=this.material.uniforms;t&&t.resolution&&(e.getViewport(Ze),this.material.uniforms.resolution.value.set(Ze.z,Ze.w))}},ut=class extends Ye{constructor(){super(),this.isLineGeometry=!0,this.type=`LineGeometry`}setPositions(e){let t=e.length-3,n=new Float32Array(2*t);for(let r=0;r<t;r+=3)n[2*r]=e[r],n[2*r+1]=e[r+1],n[2*r+2]=e[r+2],n[2*r+3]=e[r+3],n[2*r+4]=e[r+4],n[2*r+5]=e[r+5];return super.setPositions(n),this}setColors(e){let t=e.length-3,n=new Float32Array(2*t);for(let r=0;r<t;r+=3)n[2*r]=e[r],n[2*r+1]=e[r+1],n[2*r+2]=e[r+2],n[2*r+3]=e[r+3],n[2*r+4]=e[r+4],n[2*r+5]=e[r+5];return super.setColors(n),this}setFromPoints(e){let t=e.length-1,n=new Float32Array(6*t);for(let r=0;r<t;r++)n[6*r]=e[r].x,n[6*r+1]=e[r].y,n[6*r+2]=e[r].z||0,n[6*r+3]=e[r+1].x,n[6*r+4]=e[r+1].y,n[6*r+5]=e[r+1].z||0;return super.setPositions(n),this}fromLine(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}},dt=class extends lt{constructor(e=new ut,t=new Xe({color:Math.random()*16777215})){super(e,t),this.isLine2=!0,this.type=`Line2`}};function ft(e,t,n){let r=(90-e)*(Math.PI/180),i=(t+180)*(Math.PI/180),a=-n*Math.sin(r)*Math.cos(i),o=n*Math.sin(r)*Math.sin(i);return new f(a,n*Math.cos(r),o)}function pt(e,t,n){let r=e.clone().add(t).multiplyScalar(.5),i=n+e.distanceTo(t)*.6;return r.normalize().multiplyScalar(i),new V(e.clone(),r,t.clone())}function mt(e){return(0,W.useMemo)(()=>{if(!e)return[];let t=e.dest.clone();return e.sources.map(e=>{let n=e.clone(),r=pt(n,t,1);return{curve:r,points:r.getPoints(64),start:n,end:t,planeNormal:new f().subVectors(r.v1,n).cross(new f().subVectors(t,n)).normalize()}})},[e])}var ht=1,gt=192,_t=2;function vt({arcs:e,entryStart:t,dissolveProgress:n=0}){let{size:r}=I(),i=(0,W.useMemo)(()=>{let t=r.width<=600?1:_t;return e.map(e=>{let n=e.curve.getPoints(gt),i=new Float32Array(n.length*3);n.forEach((e,t)=>{i[t*3+0]=e.x,i[t*3+1]=e.y,i[t*3+2]=e.z});let a=new ut;a.setPositions(i);let o=new dt(a,new Xe({color:new j(se).getHex(),linewidth:t,worldUnits:!1,transparent:!0,opacity:0,depthTest:!0,depthWrite:!1,toneMapped:!1,resolution:new v(r.width,r.height)}));return o.renderOrder=1,o})},[e,r.width,r.height]);return(0,W.useEffect)(()=>{i.forEach(e=>{e.material.resolution.set(r.width,r.height)})},[i,r.width,r.height]),(0,W.useEffect)(()=>()=>{i.forEach(e=>{e.geometry.dispose(),e.material.dispose()})},[i]),N(e=>{let r=Ue(He(t,e.clock.elapsedTime),Re,ze)*ht,a=.056,o=n>a?Math.max(0,1-(n-a)/.011):1;i.forEach(e=>{e.material.opacity=r*o})}),(0,K.jsx)(K.Fragment,{children:i.map((e,t)=>(0,K.jsx)(`primitive`,{object:e},t))})}var yt=[`$`,`€`,`£`,`¥`,`₹`],bt=36,xt=`#272727`,$=4;function St(e,t,n,r,i){e.font=`900 ${Math.round(i*.55)}px "Helvetica Neue", Helvetica, Arial, sans-serif`,e.textAlign=`center`,e.textBaseline=`middle`,e.fillStyle=ne,e.fillText(t,n,r),e.lineWidth=$,e.lineCap=`round`,e.lineJoin=`round`,e.strokeStyle=xt,e.strokeText(t,n,r)}function Ct(e){let t=document.createElement(`canvas`);t.width=256,t.height=256;let n=t.getContext(`2d`);return n.fillStyle=ne,n.beginPath(),n.arc(128,128,128-$/2,0,Math.PI*2),n.fill(),n.lineWidth=$,n.strokeStyle=xt,n.beginPath(),n.arc(128,128,128-$/2,0,Math.PI*2),n.stroke(),n.beginPath(),n.arc(128,128,128*.78,0,Math.PI*2),n.stroke(),St(n,e,128,135.68,256),t}function wt(){let e=1024,t=document.createElement(`canvas`);t.width=e,t.height=64;let n=t.getContext(`2d`);n.fillStyle=ne,n.fillRect(0,0,e,64),n.fillStyle=xt;for(let t=0;t<bt;t++){let r=t/bt*e;n.fillRect(r,0,$,64)}return n.fillRect(0,0,e,$),n.fillRect(0,64-$,e,$),t}var Tt={faces:[]},Et=e=>Tt.faces[e]??=Ct(yt[e]),Dt=()=>Tt.side??=wt(),Ot=200;function kt(){let e=[...yt.map((e,t)=>()=>Et(t)),Dt],t=()=>{},n=()=>{let r=e.shift();r&&(r(),t=i(n,Ot))};return t=i(n,Ot),()=>t()}var At=2,jt=.05,Mt=.1,Nt=.03,Pt=.015,Ft=.96,It=.5,Lt=1,Rt=.4,zt=It+Lt+Rt,Bt=.03;function Vt(e,t=!1){let n=new L(e);return n.colorSpace=_,t&&(n.wrapS=u,n.wrapT=w),n.anisotropy=4,n.needsUpdate=!0,n}var Ht=e=>1-(1-e)**3;function Ut({arcs:e,entryStart:t,dissolveProgress:n=0}){let r=(0,W.useMemo)(()=>({faces:yt.map((e,t)=>Vt(Et(t))),side:Vt(Dt(),!0)}),[]),i=(0,W.useMemo)(()=>{let t=[],n=0;return e.forEach((e,r)=>{for(let e=0;e<At;e++)t.push({arcIndex:r,phase:(e/At+Math.random()*.3)%1,speed:jt+Math.random()*(Mt-jt),currencyIndex:n%yt.length,arrivedAt:null}),n++}),t},[e]),a=(0,W.useMemo)(()=>e.map(e=>e.curve.getLength()),[e]),o=(0,W.useMemo)(()=>i.map(e=>{let t=r.faces[e.currencyIndex],n={transparent:!0,opacity:0,depthWrite:!1,toneMapped:!1};return[new C({...n,map:r.side}),new C({...n,map:t}),new C({...n,map:t})]}),[r,i]),s=(0,W.useRef)([]),c=(0,W.useMemo)(()=>new f(0,1,0),[]),l=(0,W.useMemo)(()=>new f,[]),u=(0,W.useMemo)(()=>new f,[]),d=(0,W.useMemo)(()=>new f,[]),p=(0,W.useMemo)(()=>new b,[]),m=(0,W.useMemo)(()=>new b,[]),h=(0,W.useMemo)(()=>new b,[]),g=(0,W.useMemo)(()=>new b,[]),_=(0,W.useMemo)(()=>new f,[]),v=(0,W.useMemo)(()=>new f,[]),y=(0,W.useMemo)(()=>new f,[]),S=(0,W.useMemo)(()=>new f,[]),w=(0,W.useMemo)(()=>i.map(()=>({dir:new f((Math.random()-.5)*2.4,Math.random()*1.8+.2,(Math.random()-.5)*2.4).normalize(),spinAxis:new f(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize(),startProgress:Math.random()*.4,distance:10+Math.random()*8,spinAmount:(Math.random()+.6)*Math.PI*6,scaleEnd:.4+Math.random()*2.6})),[i]),T=(0,W.useMemo)(()=>new b,[]),E=(0,W.useRef)([]),D=(0,W.useRef)([]),O=(0,W.useMemo)(()=>new f,[]);return N((r,f)=>{let b=Ue(He(t,r.clock.elapsedTime),ze,3),C=r.clock.elapsedTime;i.forEach(e=>{e.arrivedAt===null?(e.phase+=f*e.speed,e.phase>=Ft&&(e.phase=Ft,e.arrivedAt=C)):C-e.arrivedAt>=zt&&(e.phase=0,e.arrivedAt=null)});let k=[];i.forEach((e,t)=>{e.arrivedAt!==null&&k.push(t)}),k.sort((e,t)=>(i[e].arrivedAt??0)-(i[t].arrivedAt??0));let ee=new Int8Array(i.length).fill(-1);k.forEach((e,t)=>{ee[e]=t}),i.forEach((t,i)=>{let f=s.current[i],k=o[i];if(!f||!k)return;let A=e[t.arcIndex];if(!A)return;A.curve.getPointAt(t.phase,_),A.curve.getTangent(t.phase,u).normalize(),l.crossVectors(u,A.planeNormal).normalize();let j=_.distanceTo(r.camera.position),M=x.clamp((j-1.5)/3.5,0,1),N=x.lerp(1.05,.55,M),P=0+Nt*N+.001;v.copy(_).addScaledVector(l,P);let F=a[t.arcIndex]*t.phase/Nt,I=1;if(t.arrivedAt===null)f.position.copy(v),d.copy(A.planeNormal),m.setFromAxisAngle(c,F),p.setFromUnitVectors(c,d),h.multiplyQuaternions(p,m),f.quaternion.copy(h);else{let e=C-t.arrivedAt,n=ee[i],r=A.end;S.copy(r).normalize();let a=Bt+Pt/2+n*Pt*.95;if(y.copy(r).addScaledVector(S,a),e<It){let t=Ht(e/It);f.position.lerpVectors(v,y,t),m.setFromAxisAngle(c,F),p.setFromUnitVectors(c,A.planeNormal),h.multiplyQuaternions(p,m),g.setFromUnitVectors(c,S),h.slerp(g,t),f.quaternion.copy(h)}else if(e<It+Lt)f.position.copy(y),h.setFromUnitVectors(c,S),f.quaternion.copy(h);else{let t=(e-It-Lt)/Rt;I=x.clamp(1-t,0,1),f.position.copy(y),h.setFromUnitVectors(c,S),f.quaternion.copy(h)}}if(f.scale.setScalar(N),n>0){if(D.current[i]==null){O.copy(f.position),O.project(r.camera);let e=(O.x+1)/2*window.innerWidth,t=(1-O.y)/2*window.innerHeight;(e<100||e>window.innerWidth-100||t<100||t>window.innerHeight-100||n>0)&&(D.current[i]=n)}let e=w[i],t=D.current[i],a=t==null?0:Math.min(1,(n-t)/Math.max(.05,1-t));if(a>0){if(!E.current[i]){let t=f.position.clone();t.lengthSq()>1e-4?t.normalize():t.copy(e.dir),t.x+=(Math.random()-.5)*.4,t.y+=(Math.random()-.5)*.4,t.z+=(Math.random()-.5)*.4,t.normalize(),E.current[i]=t}let t=E.current[i],n=1-(1-a)*(1-a),r=e.distance*n;f.position.x+=t.x*r,f.position.y+=t.y*r,f.position.z+=t.z*r,T.setFromAxisAngle(e.spinAxis,a*e.spinAmount),f.quaternion.multiply(T);let o=1+(e.scaleEnd-1)*a;f.scale.setScalar(N*o),I=1}else E.current[i]=null}else D.current[i]=null,E.current[i]=null;k.forEach(e=>{e.opacity=b*I})})}),i.length===0?null:(0,K.jsx)(K.Fragment,{children:i.map((e,t)=>(0,K.jsx)(`group`,{ref:e=>{s.current[t]=e},renderOrder:2,children:(0,K.jsx)(`mesh`,{material:o[t],renderOrder:2,children:(0,K.jsx)(`cylinderGeometry`,{args:[Nt,Nt,Pt,48,1,!1]})})},t))})}var Wt=.036,Gt=.03;function Kt({dest:e,entryStart:t,returning:n}){let r=(0,W.useMemo)(()=>new f(0,1,0),[]),i=(0,W.useMemo)(()=>{let t=e.clone(),n=t.clone().normalize();return{position:t.clone().addScaledVector(n,Gt/2),quaternion:new b().setFromUnitVectors(r,n)}},[e,r]),a=(0,W.useMemo)(()=>new z(Wt,Wt,Gt,48,1,!1),[]);(0,W.useEffect)(()=>()=>{a.dispose()},[a]);let o=(0,W.useRef)(null),s=(0,W.useRef)(null);return N(e=>{if(!o.current)return;let r=e.clock.elapsedTime;s.current===null&&(s.current=n.current?r:r-He(t,r));let i=Ue(r-s.current,ze,3);o.current.children.forEach(e=>{let t=e.material;if(!t)return;let n=e=>{e.transparent=!0,e.opacity=i};Array.isArray(t)?t.forEach(n):n(t)})}),(0,K.jsx)(`group`,{ref:o,position:i.position,quaternion:i.quaternion,children:(0,K.jsxs)(`mesh`,{geometry:a,renderOrder:2,children:[(0,K.jsx)(`meshBasicMaterial`,{attach:`material-0`,color:ae,transparent:!0,opacity:0,toneMapped:!1}),(0,K.jsx)(`meshBasicMaterial`,{attach:`material-1`,color:se,transparent:!0,opacity:0,toneMapped:!1}),(0,K.jsx)(`meshBasicMaterial`,{attach:`material-2`,color:U,transparent:!0,opacity:0,toneMapped:!1})]})})}var qt=1.2,Jt=240,Yt=[{code:`UA`,name:`Ukraine`,flag:`🇺🇦`,lat:50.4501,lon:30.5234,body:`Wartime capital controls limit personal spending abroad to about $2,500 a month.`},{code:`LB`,name:`Lebanon`,flag:`🇱🇧`,lat:33.8938,lon:35.5018,body:`Depositors are limited to about $400 a month at official withdrawal rates.`},{code:`NG`,name:`Nigeria`,flag:`🇳🇬`,lat:6.5244,lon:3.3792,body:`The Central Bank caps individual outbound transfers at $10,000 per year.`},{code:`PK`,name:`Pakistan`,flag:`🇵🇰`,lat:24.8607,lon:67.0011,body:`State Bank approval is required for outbound real estate, months of paperwork.`},{code:`AR`,name:`Argentina`,flag:`🇦🇷`,lat:-34.6037,lon:-58.3816,body:`Strict capital controls and a triple exchange-rate regime.`},{code:`EG`,name:`Egypt`,flag:`🇪🇬`,lat:30.0444,lon:31.2357,body:`USD shortages mean banks can't always source the FX and wires queue for weeks.`},{code:`CN`,name:`China`,flag:`🇨🇳`,lat:39.9042,lon:116.4074,body:`A $50,000 annual outbound limit per citizen.`},{code:`TR`,name:`Turkey`,flag:`🇹🇷`,lat:41.0082,lon:28.9784,body:`Lira instability. Banks restrict outbound foreign-currency transfers above certain thresholds.`}],Xt={UA:{lat:2,lon:-6},EG:{lat:-10,lon:-10},LB:{lat:-8,lon:5},TR:{lat:2,lon:2},PK:{lat:-10,lon:10}};function Zt({country:e,pos:t,visible:n,sizePct:r,dissolveProgress:i,flyDx:a,flyDy:s,spinX:c,spinY:l,spinZ:u,startProgress:d,flyDistance:p,scaleEnd:m}){let h=(0,W.useRef)(null),g=(0,W.useRef)(null),_=(0,W.useRef)(0),v=(0,W.useRef)(!0),y=(0,W.useRef)(null),b=(0,W.useRef)(null),x=(0,W.useMemo)(()=>new f,[]);return N(e=>{let t=h.current,r=g.current;if(!t||!r)return;let o=r.parentElement;o&&o.style.willChange!==`transform`&&(o.style.willChange=`transform`),t.getWorldPosition(x);let f=x.x*(e.camera.position.x-x.x)+x.y*(e.camera.position.y-x.y)+x.z*(e.camera.position.z-x.z)>0;if(b.current===null&&i>0){let e=r.parentElement,t=!1;if(e){let n=e.getBoundingClientRect(),r=window.innerWidth,i=window.innerHeight,a=(n.left+n.right)/2,o=(n.top+n.bottom)/2;(a<100||a>r-100||o<100||o>i-100)&&(t=!0)}(t||i>0)&&(b.current=i)}let S=b.current??d,C=b.current===null?0:Math.min(1,(i-S)/Math.max(.05,1-S)),w=b.current;if((w===null||i<w?0:Math.min(1,(i-w)/Math.max(.05,1-w)))>0)r.style.opacity=`1`;else{let e=n&&f?1:0;e>_.current?_.current=e:_.current+=(e-_.current)*.2,r.style.opacity=`${_.current}`}if(C>0){if(!y.current){let t=x.clone().project(e.camera),n=t.x,r=-t.y,i=Math.sqrt(n*n+r*r);i>.08?(n/=i,r/=i):(n=a,r=s),n+=(Math.random()-.5)*.25,r+=(Math.random()-.5)*.25,y.current={x:n,y:r}}let t=y.current,n=1-(1-C)*(1-C),i=t.x*p*n,o=t.y*p*n,d=c*C,f=l*C,h=u*C,g=1+(m-1)*C;if(r.style.transform=`perspective(900px) translate3d(${i}px, ${o}px, 0) rotateX(${d}deg) rotateY(${f}deg) rotateZ(${h}deg) scale(${g})`,g>=3){let e=Math.min(1,(g-3)/1);r.style.filter=`blur(${e*16}px)`}else r.style.filter=``}else r.style.transform=``,r.style.filter=``,i<=0&&(y.current=null,b.current=null);f!==v.current&&(v.current=f,r.style.pointerEvents=`none`)}),(0,K.jsx)(`group`,{ref:h,position:[t.x,t.y,t.z],children:(0,K.jsx)(we,{center:!0,pointerEvents:`none`,zIndexRange:[100,0],children:(0,K.jsx)(`div`,{ref:g,className:`country-card`,style:{opacity:0,width:`${r/100*Jt}px`,pointerEvents:`none`},children:(0,K.jsx)(o,{width:`100%`,height:`auto`,borderRadius:15,simple:!0,children:(0,K.jsxs)(`div`,{className:`country-card__body`,children:[(0,K.jsxs)(`div`,{className:`country-card__head`,children:[(0,K.jsx)(`img`,{className:`country-card__flag`,src:`https://flagicons.lipis.dev/flags/4x3/${e.code.toLowerCase()}.svg`,alt:`${e.name} flag`}),(0,K.jsx)(`span`,{className:`country-card__name`,children:e.name.toUpperCase()})]}),(0,K.jsx)(`p`,{className:`country-card__text`,children:e.body})]})})})})})}function Qt({visible:e,sizePct:t=100,dissolveProgress:n=0}){return(0,K.jsx)(K.Fragment,{children:(0,W.useMemo)(()=>Yt.map(e=>{let t=Xt[e.code]??{lat:0,lon:0},n=ft(e.lat+t.lat,e.lon+t.lon,qt),r=Math.random()*Math.PI*2;return{country:e,pos:n,flyDx:Math.cos(r),flyDy:Math.sin(r)-.2+(Math.random()-.5)*.5,spinX:(Math.random()-.5)*960,spinY:(Math.random()-.5)*960,spinZ:(Math.random()-.5)*720,startProgress:Math.random()*.35,flyDistance:1500+Math.random()*700,scaleEnd:Math.random()<.5?.3+Math.random()*.7:3+Math.random()*2}}),[]).map(r=>(0,K.jsx)(Zt,{country:r.country,pos:r.pos,visible:e,sizePct:t,dissolveProgress:n,flyDx:r.flyDx,flyDy:r.flyDy,spinX:r.spinX,spinY:r.spinY,spinZ:r.spinZ,startProgress:r.startProgress,flyDistance:r.flyDistance,scaleEnd:r.scaleEnd},r.country.code))})}function $t(e){let t=t=>new f(e.snaps[t*3],e.snaps[t*3+1],e.snaps[t*3+2]);return{land:e.land,landStart:e.landStart,landDelay:e.landDelay,dest:t(0),sources:oe.map((e,n)=>t(n+1))}}function en(){let[e,t]=(0,W.useState)(()=>{let e=r();return e&&$t(e)});return(0,W.useEffect)(()=>{if(e)return;let n=!0;return s().then(e=>{n&&t($t(e))},()=>{}),()=>{n=!1}},[e]),e}var tn=1500;function nn(e,t,n,r,i){if(!e.extensions.has(`KHR_parallel_shader_compile`))return i(),()=>{};let a=!1,o=()=>{a||(a=!0,clearTimeout(s),i())},s=setTimeout(o,tn),c=setTimeout(()=>{try{e.compileAsync(t,n,r).then(o,o)}catch{o()}},0);return()=>{a=!0,clearTimeout(s),clearTimeout(c)}}function rn({onReady:e}){let t=I(e=>e.gl),n=I(e=>e.scene),r=I(e=>e.camera);return(0,W.useEffect)(()=>nn(t,n,r,n,e),[t,n,r,e]),null}function an({at:e,entryStart:t,children:n}){let r=I(e=>e.gl),i=I(e=>e.scene),a=I(e=>e.camera),o=(0,W.useRef)(null),[s,c]=(0,W.useState)(!1),[l,u]=(0,W.useState)(!1);return N(n=>{!s&&He(t,n.clock.elapsedTime)>=e&&c(!0)}),(0,W.useEffect)(()=>{let e=o.current;if(!(!s||!e))return nn(r,e,a,i,()=>u(!0))},[s,r,i,a]),s?(0,K.jsx)(`group`,{ref:o,visible:l,children:n}):null}function on({sphereYOffset:e,sphereScale:t,cardsVisible:n,cardSizePct:r,dissolveProgress:i,preLockProgress:a,dotSize:o,onShadersReady:s}){let c=en(),l=mt(c),u=(0,W.useRef)(null),d=(0,W.useRef)(!1);(0,W.useEffect)(()=>{i>0&&(d.current=!0)},[i]);let f=c!==null;(0,W.useEffect)(()=>{if(f)return kt()},[f]);let p=(0,W.useMemo)(()=>{let e=ft(ie[0],ie[1],1);return-Math.atan2(e.x,e.z)},[]),m=(0,W.useRef)(null),h=(0,W.useRef)(0),g=(0,W.useRef)(!1),_=Math.PI/30*.32;return N((e,t)=>{if(!m.current)return;n&&!g.current&&(h.current=0),g.current=n,h.current+=t*_;let r=Math.PI*2;h.current=((h.current+Math.PI)%r+r)%r-Math.PI;let i=n?0:a,o=h.current*(1-i);m.current.rotation.y=p+o}),c?(0,K.jsxs)(`group`,{ref:m,position:[0,e,0],scale:t,rotation:[0,p,0],children:[(0,K.jsx)(`ambientLight`,{intensity:1}),(0,K.jsxs)(`mesh`,{renderOrder:-1,children:[(0,K.jsx)(`sphereGeometry`,{args:[.99,64,64]}),(0,K.jsx)(`meshBasicMaterial`,{colorWrite:!1})]}),(0,K.jsx)(Ke,{dots:c,entryStart:u,dissolveProgress:i,dotSize:o}),(0,K.jsx)(Qt,{visible:n,sizePct:r,dissolveProgress:i}),(0,K.jsxs)(an,{at:Be,entryStart:u,children:[(0,K.jsx)(vt,{arcs:l,entryStart:u,dissolveProgress:i}),i<=0&&(0,K.jsx)(Kt,{dest:c.dest,entryStart:u,returning:d})]}),(0,K.jsx)(an,{at:Ve,entryStart:u,children:(0,K.jsx)(Ut,{arcs:l,entryStart:u,dissolveProgress:i})}),(0,K.jsx)(rn,{onReady:s})]}):null}function sn({sphereYOffset:e=-.4,sphereScale:t=1,cardsVisible:n=!1,cardSizePct:r=100,dissolveProgress:i=0,preLockProgress:a=0,dotSize:o=.011,frameloop:s=`always`}){let[c,l]=(0,W.useState)(!1),u=(0,W.useCallback)(()=>l(!0),[]);return(0,K.jsxs)(R,{resize:{scroll:!1},camera:{position:[0,.32,3.1],fov:45},dpr:[1,1.75],frameloop:c?s:`never`,gl:{antialias:!0,alpha:!0,powerPreference:`high-performance`},onCreated:({gl:e})=>{e.debug.checkShaderErrors=!1},style:{width:`100%`,height:`100%`,background:`transparent`},children:[(0,K.jsx)(on,{sphereYOffset:e,sphereScale:t,cardsVisible:n,cardSizePct:r,dissolveProgress:i,preLockProgress:a,dotSize:o,onShadersReady:u}),(0,K.jsx)(Ie,{autoRotate:!1,enableZoom:!1,enablePan:!1,enableRotate:n,minPolarAngle:Math.PI/2.4,maxPolarAngle:Math.PI/1.7})]})}export{sn as default};