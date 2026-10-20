/* Nova WebGL ports of React Bits components (ElectricLogo, DitherVeil, ElectricBorder, LaserFlow, Strands, Galaxy),
   each turned from a React component into NovaUI.<name>(container, props) -> { set, destroy }. Bundles ogl 1.0.11 (Unlicense). */
(()=>{function Le(t){let e=t[0],r=t[1],i=t[2];return Math.sqrt(e*e+r*r+i*i)}function Ne(t,e){return t[0]=e[0],t[1]=e[1],t[2]=e[2],t}function vt(t,e,r,i){return t[0]=e,t[1]=r,t[2]=i,t}function Ke(t,e,r){return t[0]=e[0]+r[0],t[1]=e[1]+r[1],t[2]=e[2]+r[2],t}function $e(t,e,r){return t[0]=e[0]-r[0],t[1]=e[1]-r[1],t[2]=e[2]-r[2],t}function yt(t,e,r){return t[0]=e[0]*r[0],t[1]=e[1]*r[1],t[2]=e[2]*r[2],t}function wt(t,e,r){return t[0]=e[0]/r[0],t[1]=e[1]/r[1],t[2]=e[2]/r[2],t}function Be(t,e,r){return t[0]=e[0]*r,t[1]=e[1]*r,t[2]=e[2]*r,t}function Mt(t,e){let r=e[0]-t[0],i=e[1]-t[1],n=e[2]-t[2];return Math.sqrt(r*r+i*i+n*n)}function bt(t,e){let r=e[0]-t[0],i=e[1]-t[1],n=e[2]-t[2];return r*r+i*i+n*n}function Qe(t){let e=t[0],r=t[1],i=t[2];return e*e+r*r+i*i}function Et(t,e){return t[0]=-e[0],t[1]=-e[1],t[2]=-e[2],t}function Rt(t,e){return t[0]=1/e[0],t[1]=1/e[1],t[2]=1/e[2],t}function Ue(t,e){let r=e[0],i=e[1],n=e[2],s=r*r+i*i+n*n;return s>0&&(s=1/Math.sqrt(s)),t[0]=e[0]*s,t[1]=e[1]*s,t[2]=e[2]*s,t}function Ze(t,e){return t[0]*e[0]+t[1]*e[1]+t[2]*e[2]}function Je(t,e,r){let i=e[0],n=e[1],s=e[2],a=r[0],c=r[1],o=r[2];return t[0]=n*o-s*c,t[1]=s*a-i*o,t[2]=i*c-n*a,t}function At(t,e,r,i){let n=e[0],s=e[1],a=e[2];return t[0]=n+i*(r[0]-n),t[1]=s+i*(r[1]-s),t[2]=a+i*(r[2]-a),t}function St(t,e,r,i,n){let s=Math.exp(-i*n),a=e[0],c=e[1],o=e[2];return t[0]=r[0]+(a-r[0])*s,t[1]=r[1]+(c-r[1])*s,t[2]=r[2]+(o-r[2])*s,t}function Tt(t,e,r){let i=e[0],n=e[1],s=e[2],a=r[3]*i+r[7]*n+r[11]*s+r[15];return a=a||1,t[0]=(r[0]*i+r[4]*n+r[8]*s+r[12])/a,t[1]=(r[1]*i+r[5]*n+r[9]*s+r[13])/a,t[2]=(r[2]*i+r[6]*n+r[10]*s+r[14])/a,t}function Ft(t,e,r){let i=e[0],n=e[1],s=e[2],a=r[3]*i+r[7]*n+r[11]*s+r[15];return a=a||1,t[0]=(r[0]*i+r[4]*n+r[8]*s)/a,t[1]=(r[1]*i+r[5]*n+r[9]*s)/a,t[2]=(r[2]*i+r[6]*n+r[10]*s)/a,t}function Lt(t,e,r){let i=e[0],n=e[1],s=e[2];return t[0]=i*r[0]+n*r[3]+s*r[6],t[1]=i*r[1]+n*r[4]+s*r[7],t[2]=i*r[2]+n*r[5]+s*r[8],t}function Ct(t,e,r){let i=e[0],n=e[1],s=e[2],a=r[0],c=r[1],o=r[2],d=r[3],f=c*s-o*n,u=o*i-a*s,l=a*n-c*i,m=c*l-o*u,p=o*f-a*l,h=a*u-c*f,g=d*2;return f*=g,u*=g,l*=g,m*=2,p*=2,h*=2,t[0]=i+f+m,t[1]=n+u+p,t[2]=s+l+h,t}var _t=(function(){let t=[0,0,0],e=[0,0,0];return function(r,i){Ne(t,r),Ne(e,i),Ue(t,t),Ue(e,e);let n=Ze(t,e);return n>1?0:n<-1?Math.PI:Math.acos(n)}})();function It(t,e){return t[0]===e[0]&&t[1]===e[1]&&t[2]===e[2]}var xe=class t extends Array{constructor(e=0,r=e,i=e){return super(e,r,i),this}get x(){return this[0]}get y(){return this[1]}get z(){return this[2]}set x(e){this[0]=e}set y(e){this[1]=e}set z(e){this[2]=e}set(e,r=e,i=e){return e.length?this.copy(e):(vt(this,e,r,i),this)}copy(e){return Ne(this,e),this}add(e,r){return r?Ke(this,e,r):Ke(this,this,e),this}sub(e,r){return r?$e(this,e,r):$e(this,this,e),this}multiply(e){return e.length?yt(this,this,e):Be(this,this,e),this}divide(e){return e.length?wt(this,this,e):Be(this,this,1/e),this}inverse(e=this){return Rt(this,e),this}len(){return Le(this)}distance(e){return e?Mt(this,e):Le(this)}squaredLen(){return Qe(this)}squaredDistance(e){return e?bt(this,e):Qe(this)}negate(e=this){return Et(this,e),this}cross(e,r){return r?Je(this,e,r):Je(this,this,e),this}scale(e){return Be(this,this,e),this}normalize(){return Ue(this,this),this}dot(e){return Ze(this,e)}equals(e){return It(this,e)}applyMatrix3(e){return Lt(this,this,e),this}applyMatrix4(e){return Tt(this,this,e),this}scaleRotateMatrix4(e){return Ft(this,this,e),this}applyQuaternion(e){return Ct(this,this,e),this}angle(e){return _t(this,e)}lerp(e,r){return At(this,this,e,r),this}smoothLerp(e,r,i){return St(this,this,e,r,i),this}clone(){return new t(this[0],this[1],this[2])}fromArray(e,r=0){return this[0]=e[r],this[1]=e[r+1],this[2]=e[r+2],this}toArray(e=[],r=0){return e[r]=this[0],e[r+1]=this[1],e[r+2]=this[2],e}transformDirection(e){let r=this[0],i=this[1],n=this[2];return this[0]=e[0]*r+e[4]*i+e[8]*n,this[1]=e[1]*r+e[5]*i+e[9]*n,this[2]=e[2]*r+e[6]*i+e[10]*n,this.normalize()}};var Pt=new xe,ci=1,hi=1,zt=!1,Ge=class{constructor(e,r={}){e.canvas||console.error("gl not passed as first argument to Geometry"),this.gl=e,this.attributes=r,this.id=ci++,this.VAOs={},this.drawRange={start:0,count:0},this.instancedCount=0,this.gl.renderer.bindVertexArray(null),this.gl.renderer.currentGeometry=null,this.glState=this.gl.renderer.state;for(let i in r)this.addAttribute(i,r[i])}addAttribute(e,r){if(this.attributes[e]=r,r.id=hi++,r.size=r.size||1,r.type=r.type||(r.data.constructor===Float32Array?this.gl.FLOAT:r.data.constructor===Uint16Array?this.gl.UNSIGNED_SHORT:this.gl.UNSIGNED_INT),r.target=e==="index"?this.gl.ELEMENT_ARRAY_BUFFER:this.gl.ARRAY_BUFFER,r.normalized=r.normalized||!1,r.stride=r.stride||0,r.offset=r.offset||0,r.count=r.count||(r.stride?r.data.byteLength/r.stride:r.data.length/r.size),r.divisor=r.instanced||0,r.needsUpdate=!1,r.usage=r.usage||this.gl.STATIC_DRAW,r.buffer||this.updateAttribute(r),r.divisor){if(this.isInstanced=!0,this.instancedCount&&this.instancedCount!==r.count*r.divisor)return console.warn("geometry has multiple instanced buffers of different length"),this.instancedCount=Math.min(this.instancedCount,r.count*r.divisor);this.instancedCount=r.count*r.divisor}else e==="index"?this.drawRange.count=r.count:this.attributes.index||(this.drawRange.count=Math.max(this.drawRange.count,r.count))}updateAttribute(e){let r=!e.buffer;r&&(e.buffer=this.gl.createBuffer()),this.glState.boundBuffer!==e.buffer&&(this.gl.bindBuffer(e.target,e.buffer),this.glState.boundBuffer=e.buffer),r?this.gl.bufferData(e.target,e.data,e.usage):this.gl.bufferSubData(e.target,0,e.data),e.needsUpdate=!1}setIndex(e){this.addAttribute("index",e)}setDrawRange(e,r){this.drawRange.start=e,this.drawRange.count=r}setInstancedCount(e){this.instancedCount=e}createVAO(e){this.VAOs[e.attributeOrder]=this.gl.renderer.createVertexArray(),this.gl.renderer.bindVertexArray(this.VAOs[e.attributeOrder]),this.bindAttributes(e)}bindAttributes(e){e.attributeLocations.forEach((r,{name:i,type:n})=>{if(!this.attributes[i]){console.warn(`active attribute ${i} not being supplied`);return}let s=this.attributes[i];this.gl.bindBuffer(s.target,s.buffer),this.glState.boundBuffer=s.buffer;let a=1;n===35674&&(a=2),n===35675&&(a=3),n===35676&&(a=4);let c=s.size/a,o=a===1?0:a*a*4,d=a===1?0:a*4;for(let f=0;f<a;f++)this.gl.vertexAttribPointer(r+f,c,s.type,s.normalized,s.stride+o,s.offset+f*d),this.gl.enableVertexAttribArray(r+f),this.gl.renderer.vertexAttribDivisor(r+f,s.divisor)}),this.attributes.index&&this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER,this.attributes.index.buffer)}draw({program:e,mode:r=this.gl.TRIANGLES}){this.gl.renderer.currentGeometry!==`${this.id}_${e.attributeOrder}`&&(this.VAOs[e.attributeOrder]||this.createVAO(e),this.gl.renderer.bindVertexArray(this.VAOs[e.attributeOrder]),this.gl.renderer.currentGeometry=`${this.id}_${e.attributeOrder}`),e.attributeLocations.forEach((n,{name:s})=>{let a=this.attributes[s];a.needsUpdate&&this.updateAttribute(a)});let i=2;this.attributes.index?.type===this.gl.UNSIGNED_INT&&(i=4),this.isInstanced?this.attributes.index?this.gl.renderer.drawElementsInstanced(r,this.drawRange.count,this.attributes.index.type,this.attributes.index.offset+this.drawRange.start*i,this.instancedCount):this.gl.renderer.drawArraysInstanced(r,this.drawRange.start,this.drawRange.count,this.instancedCount):this.attributes.index?this.gl.drawElements(r,this.drawRange.count,this.attributes.index.type,this.attributes.index.offset+this.drawRange.start*i):this.gl.drawArrays(r,this.drawRange.start,this.drawRange.count)}getPosition(){let e=this.attributes.position;if(e.data)return e;if(!zt)return console.warn("No position buffer data found to compute bounds"),zt=!0}computeBoundingBox(e){e||(e=this.getPosition());let r=e.data,i=e.size;this.bounds||(this.bounds={min:new xe,max:new xe,center:new xe,scale:new xe,radius:1/0});let n=this.bounds.min,s=this.bounds.max,a=this.bounds.center,c=this.bounds.scale;n.set(1/0),s.set(-1/0);for(let o=0,d=r.length;o<d;o+=i){let f=r[o],u=r[o+1],l=r[o+2];n.x=Math.min(f,n.x),n.y=Math.min(u,n.y),n.z=Math.min(l,n.z),s.x=Math.max(f,s.x),s.y=Math.max(u,s.y),s.z=Math.max(l,s.z)}c.sub(s,n),a.add(n,s).divide(2)}computeBoundingSphere(e){e||(e=this.getPosition());let r=e.data,i=e.size;this.bounds||this.computeBoundingBox(e);let n=0;for(let s=0,a=r.length;s<a;s+=i)Pt.fromArray(r,s),n=Math.max(n,this.bounds.center.squaredDistance(Pt));this.bounds.radius=Math.sqrt(n)}remove(){for(let e in this.VAOs)this.gl.renderer.deleteVertexArray(this.VAOs[e]),delete this.VAOs[e];for(let e in this.attributes)this.gl.deleteBuffer(this.attributes[e].buffer),delete this.attributes[e]}};var fi=1,Ot={},Ce=class{constructor(e,{vertex:r,fragment:i,uniforms:n={},transparent:s=!1,cullFace:a=e.BACK,frontFace:c=e.CCW,depthTest:o=!0,depthWrite:d=!0,depthFunc:f=e.LEQUAL}={}){e.canvas||console.error("gl not passed as first argument to Program"),this.gl=e,this.uniforms=n,this.id=fi++,r||console.warn("vertex shader not supplied"),i||console.warn("fragment shader not supplied"),this.transparent=s,this.cullFace=a,this.frontFace=c,this.depthTest=o,this.depthWrite=d,this.depthFunc=f,this.blendFunc={},this.blendEquation={},this.stencilFunc={},this.stencilOp={},this.transparent&&!this.blendFunc.src&&(this.gl.renderer.premultipliedAlpha?this.setBlendFunc(this.gl.ONE,this.gl.ONE_MINUS_SRC_ALPHA):this.setBlendFunc(this.gl.SRC_ALPHA,this.gl.ONE_MINUS_SRC_ALPHA)),this.vertexShader=e.createShader(e.VERTEX_SHADER),this.fragmentShader=e.createShader(e.FRAGMENT_SHADER),this.program=e.createProgram(),e.attachShader(this.program,this.vertexShader),e.attachShader(this.program,this.fragmentShader),this.setShaders({vertex:r,fragment:i})}setShaders({vertex:e,fragment:r}){if(e&&(this.gl.shaderSource(this.vertexShader,e),this.gl.compileShader(this.vertexShader),this.gl.getShaderInfoLog(this.vertexShader)!==""&&console.warn(`${this.gl.getShaderInfoLog(this.vertexShader)}
Vertex Shader
${Dt(e)}`)),r&&(this.gl.shaderSource(this.fragmentShader,r),this.gl.compileShader(this.fragmentShader),this.gl.getShaderInfoLog(this.fragmentShader)!==""&&console.warn(`${this.gl.getShaderInfoLog(this.fragmentShader)}
Fragment Shader
${Dt(r)}`)),this.gl.linkProgram(this.program),!this.gl.getProgramParameter(this.program,this.gl.LINK_STATUS))return console.warn(this.gl.getProgramInfoLog(this.program));this.uniformLocations=new Map;let i=this.gl.getProgramParameter(this.program,this.gl.ACTIVE_UNIFORMS);for(let a=0;a<i;a++){let c=this.gl.getActiveUniform(this.program,a);this.uniformLocations.set(c,this.gl.getUniformLocation(this.program,c.name));let o=c.name.match(/(\w+)/g);c.uniformName=o[0],c.nameComponents=o.slice(1)}this.attributeLocations=new Map;let n=[],s=this.gl.getProgramParameter(this.program,this.gl.ACTIVE_ATTRIBUTES);for(let a=0;a<s;a++){let c=this.gl.getActiveAttrib(this.program,a),o=this.gl.getAttribLocation(this.program,c.name);o!==-1&&(n[o]=c.name,this.attributeLocations.set(c,o))}this.attributeOrder=n.join("")}setBlendFunc(e,r,i,n){this.blendFunc.src=e,this.blendFunc.dst=r,this.blendFunc.srcAlpha=i,this.blendFunc.dstAlpha=n,e&&(this.transparent=!0)}setBlendEquation(e,r){this.blendEquation.modeRGB=e,this.blendEquation.modeAlpha=r}setStencilFunc(e,r,i){this.stencilRef=r,this.stencilFunc.func=e,this.stencilFunc.ref=r,this.stencilFunc.mask=i}setStencilOp(e,r,i){this.stencilOp.stencilFail=e,this.stencilOp.depthFail=r,this.stencilOp.depthPass=i}applyState(){this.depthTest?this.gl.renderer.enable(this.gl.DEPTH_TEST):this.gl.renderer.disable(this.gl.DEPTH_TEST),this.cullFace?this.gl.renderer.enable(this.gl.CULL_FACE):this.gl.renderer.disable(this.gl.CULL_FACE),this.blendFunc.src?this.gl.renderer.enable(this.gl.BLEND):this.gl.renderer.disable(this.gl.BLEND),this.cullFace&&this.gl.renderer.setCullFace(this.cullFace),this.gl.renderer.setFrontFace(this.frontFace),this.gl.renderer.setDepthMask(this.depthWrite),this.gl.renderer.setDepthFunc(this.depthFunc),this.blendFunc.src&&this.gl.renderer.setBlendFunc(this.blendFunc.src,this.blendFunc.dst,this.blendFunc.srcAlpha,this.blendFunc.dstAlpha),this.gl.renderer.setBlendEquation(this.blendEquation.modeRGB,this.blendEquation.modeAlpha),this.stencilFunc.func||this.stencilOp.stencilFail?this.gl.renderer.enable(this.gl.STENCIL_TEST):this.gl.renderer.disable(this.gl.STENCIL_TEST),this.gl.renderer.setStencilFunc(this.stencilFunc.func,this.stencilFunc.ref,this.stencilFunc.mask),this.gl.renderer.setStencilOp(this.stencilOp.stencilFail,this.stencilOp.depthFail,this.stencilOp.depthPass)}use({flipFaces:e=!1}={}){let r=-1;this.gl.renderer.state.currentProgram===this.id||(this.gl.useProgram(this.program),this.gl.renderer.state.currentProgram=this.id),this.uniformLocations.forEach((n,s)=>{let a=this.uniforms[s.uniformName];for(let c of s.nameComponents){if(!a)break;if(c in a)a=a[c];else{if(Array.isArray(a.value))break;a=void 0;break}}if(!a)return Nt(`Active uniform ${s.name} has not been supplied`);if(a&&a.value===void 0)return Nt(`${s.name} uniform is missing a value parameter`);if(a.value.texture)return r=r+1,a.value.update(r),et(this.gl,s.type,n,r);if(a.value.length&&a.value[0].texture){let c=[];return a.value.forEach(o=>{r=r+1,o.update(r),c.push(r)}),et(this.gl,s.type,n,c)}et(this.gl,s.type,n,a.value)}),this.applyState(),e&&this.gl.renderer.setFrontFace(this.frontFace===this.gl.CCW?this.gl.CW:this.gl.CCW)}remove(){this.gl.deleteProgram(this.program)}};function et(t,e,r,i){i=i.length?ui(i):i;let n=t.renderer.state.uniformLocations.get(r);if(i.length)if(n===void 0||n.length!==i.length)t.renderer.state.uniformLocations.set(r,i.slice(0));else{if(di(n,i))return;n.set?n.set(i):pi(n,i),t.renderer.state.uniformLocations.set(r,n)}else{if(n===i)return;t.renderer.state.uniformLocations.set(r,i)}switch(e){case 5126:return i.length?t.uniform1fv(r,i):t.uniform1f(r,i);case 35664:return t.uniform2fv(r,i);case 35665:return t.uniform3fv(r,i);case 35666:return t.uniform4fv(r,i);case 35670:case 5124:case 35678:case 36306:case 35680:case 36289:return i.length?t.uniform1iv(r,i):t.uniform1i(r,i);case 35671:case 35667:return t.uniform2iv(r,i);case 35672:case 35668:return t.uniform3iv(r,i);case 35673:case 35669:return t.uniform4iv(r,i);case 35674:return t.uniformMatrix2fv(r,!1,i);case 35675:return t.uniformMatrix3fv(r,!1,i);case 35676:return t.uniformMatrix4fv(r,!1,i)}}function Dt(t){let e=t.split(`
`);for(let r=0;r<e.length;r++)e[r]=r+1+": "+e[r];return e.join(`
`)}function ui(t){let e=t.length,r=t[0].length;if(r===void 0)return t;let i=e*r,n=Ot[i];n||(Ot[i]=n=new Float32Array(i));for(let s=0;s<e;s++)n.set(t[s],s*r);return n}function di(t,e){if(t.length!==e.length)return!1;for(let r=0,i=t.length;r<i;r++)if(t[r]!==e[r])return!1;return!0}function pi(t,e){for(let r=0,i=t.length;r<i;r++)t[r]=e[r]}var tt=0;function Nt(t){tt>100||(console.warn(t),tt++,tt>100&&console.warn("More than 100 program warnings - stopping logs."))}var rt=new xe,mi=1,_e=class{constructor({canvas:e=document.createElement("canvas"),width:r=300,height:i=150,dpr:n=1,alpha:s=!1,depth:a=!0,stencil:c=!1,antialias:o=!1,premultipliedAlpha:d=!1,preserveDrawingBuffer:f=!1,powerPreference:u="default",autoClear:l=!0,webgl:m=2}={}){let p={alpha:s,depth:a,stencil:c,antialias:o,premultipliedAlpha:d,preserveDrawingBuffer:f,powerPreference:u};this.dpr=n,this.alpha=s,this.color=!0,this.depth=a,this.stencil=c,this.premultipliedAlpha=d,this.autoClear=l,this.id=mi++,m===2&&(this.gl=e.getContext("webgl2",p)),this.isWebgl2=!!this.gl,this.gl||(this.gl=e.getContext("webgl",p)),this.gl||console.error("unable to create webgl context"),this.gl.renderer=this,this.setSize(r,i),this.state={},this.state.blendFunc={src:this.gl.ONE,dst:this.gl.ZERO},this.state.blendEquation={modeRGB:this.gl.FUNC_ADD},this.state.cullFace=!1,this.state.frontFace=this.gl.CCW,this.state.depthMask=!0,this.state.depthFunc=this.gl.LEQUAL,this.state.premultiplyAlpha=!1,this.state.flipY=!1,this.state.unpackAlignment=4,this.state.framebuffer=null,this.state.viewport={x:0,y:0,width:null,height:null},this.state.textureUnits=[],this.state.activeTextureUnit=0,this.state.boundBuffer=null,this.state.uniformLocations=new Map,this.state.currentProgram=null,this.extensions={},this.isWebgl2?(this.getExtension("EXT_color_buffer_float"),this.getExtension("OES_texture_float_linear")):(this.getExtension("OES_texture_float"),this.getExtension("OES_texture_float_linear"),this.getExtension("OES_texture_half_float"),this.getExtension("OES_texture_half_float_linear"),this.getExtension("OES_element_index_uint"),this.getExtension("OES_standard_derivatives"),this.getExtension("EXT_sRGB"),this.getExtension("WEBGL_depth_texture"),this.getExtension("WEBGL_draw_buffers")),this.getExtension("WEBGL_compressed_texture_astc"),this.getExtension("EXT_texture_compression_bptc"),this.getExtension("WEBGL_compressed_texture_s3tc"),this.getExtension("WEBGL_compressed_texture_etc1"),this.getExtension("WEBGL_compressed_texture_pvrtc"),this.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc"),this.vertexAttribDivisor=this.getExtension("ANGLE_instanced_arrays","vertexAttribDivisor","vertexAttribDivisorANGLE"),this.drawArraysInstanced=this.getExtension("ANGLE_instanced_arrays","drawArraysInstanced","drawArraysInstancedANGLE"),this.drawElementsInstanced=this.getExtension("ANGLE_instanced_arrays","drawElementsInstanced","drawElementsInstancedANGLE"),this.createVertexArray=this.getExtension("OES_vertex_array_object","createVertexArray","createVertexArrayOES"),this.bindVertexArray=this.getExtension("OES_vertex_array_object","bindVertexArray","bindVertexArrayOES"),this.deleteVertexArray=this.getExtension("OES_vertex_array_object","deleteVertexArray","deleteVertexArrayOES"),this.drawBuffers=this.getExtension("WEBGL_draw_buffers","drawBuffers","drawBuffersWEBGL"),this.parameters={},this.parameters.maxTextureUnits=this.gl.getParameter(this.gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),this.parameters.maxAnisotropy=this.getExtension("EXT_texture_filter_anisotropic")?this.gl.getParameter(this.getExtension("EXT_texture_filter_anisotropic").MAX_TEXTURE_MAX_ANISOTROPY_EXT):0}setSize(e,r){this.width=e,this.height=r,this.gl.canvas.width=e*this.dpr,this.gl.canvas.height=r*this.dpr,this.gl.canvas.style&&Object.assign(this.gl.canvas.style,{width:e+"px",height:r+"px"})}setViewport(e,r,i=0,n=0){this.state.viewport.width===e&&this.state.viewport.height===r||(this.state.viewport.width=e,this.state.viewport.height=r,this.state.viewport.x=i,this.state.viewport.y=n,this.gl.viewport(i,n,e,r))}setScissor(e,r,i=0,n=0){this.gl.scissor(i,n,e,r)}enable(e){this.state[e]!==!0&&(this.gl.enable(e),this.state[e]=!0)}disable(e){this.state[e]!==!1&&(this.gl.disable(e),this.state[e]=!1)}setBlendFunc(e,r,i,n){this.state.blendFunc.src===e&&this.state.blendFunc.dst===r&&this.state.blendFunc.srcAlpha===i&&this.state.blendFunc.dstAlpha===n||(this.state.blendFunc.src=e,this.state.blendFunc.dst=r,this.state.blendFunc.srcAlpha=i,this.state.blendFunc.dstAlpha=n,i!==void 0?this.gl.blendFuncSeparate(e,r,i,n):this.gl.blendFunc(e,r))}setBlendEquation(e,r){e=e||this.gl.FUNC_ADD,!(this.state.blendEquation.modeRGB===e&&this.state.blendEquation.modeAlpha===r)&&(this.state.blendEquation.modeRGB=e,this.state.blendEquation.modeAlpha=r,r!==void 0?this.gl.blendEquationSeparate(e,r):this.gl.blendEquation(e))}setCullFace(e){this.state.cullFace!==e&&(this.state.cullFace=e,this.gl.cullFace(e))}setFrontFace(e){this.state.frontFace!==e&&(this.state.frontFace=e,this.gl.frontFace(e))}setDepthMask(e){this.state.depthMask!==e&&(this.state.depthMask=e,this.gl.depthMask(e))}setDepthFunc(e){this.state.depthFunc!==e&&(this.state.depthFunc=e,this.gl.depthFunc(e))}setStencilMask(e){this.state.stencilMask!==e&&(this.state.stencilMask=e,this.gl.stencilMask(e))}setStencilFunc(e,r,i){this.state.stencilFunc===e&&this.state.stencilRef===r&&this.state.stencilFuncMask===i||(this.state.stencilFunc=e||this.gl.ALWAYS,this.state.stencilRef=r||0,this.state.stencilFuncMask=i||0,this.gl.stencilFunc(e||this.gl.ALWAYS,r||0,i||0))}setStencilOp(e,r,i){this.state.stencilFail===e&&this.state.stencilDepthFail===r&&this.state.stencilDepthPass===i||(this.state.stencilFail=e,this.state.stencilDepthFail=r,this.state.stencilDepthPass=i,this.gl.stencilOp(e,r,i))}activeTexture(e){this.state.activeTextureUnit!==e&&(this.state.activeTextureUnit=e,this.gl.activeTexture(this.gl.TEXTURE0+e))}bindFramebuffer({target:e=this.gl.FRAMEBUFFER,buffer:r=null}={}){this.state.framebuffer!==r&&(this.state.framebuffer=r,this.gl.bindFramebuffer(e,r))}getExtension(e,r,i){return r&&this.gl[r]?this.gl[r].bind(this.gl):(this.extensions[e]||(this.extensions[e]=this.gl.getExtension(e)),r?this.extensions[e]?this.extensions[e][i].bind(this.extensions[e]):null:this.extensions[e])}sortOpaque(e,r){return e.renderOrder!==r.renderOrder?e.renderOrder-r.renderOrder:e.program.id!==r.program.id?e.program.id-r.program.id:e.zDepth!==r.zDepth?e.zDepth-r.zDepth:r.id-e.id}sortTransparent(e,r){return e.renderOrder!==r.renderOrder?e.renderOrder-r.renderOrder:e.zDepth!==r.zDepth?r.zDepth-e.zDepth:r.id-e.id}sortUI(e,r){return e.renderOrder!==r.renderOrder?e.renderOrder-r.renderOrder:e.program.id!==r.program.id?e.program.id-r.program.id:r.id-e.id}getRenderList({scene:e,camera:r,frustumCull:i,sort:n}){let s=[];if(r&&i&&r.updateFrustum(),e.traverse(a=>{if(!a.visible)return!0;a.draw&&(i&&a.frustumCulled&&r&&!r.frustumIntersectsMesh(a)||s.push(a))}),n){let a=[],c=[],o=[];s.forEach(d=>{d.program.transparent?d.program.depthTest?c.push(d):o.push(d):a.push(d),d.zDepth=0,!(d.renderOrder!==0||!d.program.depthTest||!r)&&(d.worldMatrix.getTranslation(rt),rt.applyMatrix4(r.projectionViewMatrix),d.zDepth=rt.z)}),a.sort(this.sortOpaque),c.sort(this.sortTransparent),o.sort(this.sortUI),s=a.concat(c,o)}return s}render({scene:e,camera:r,target:i=null,update:n=!0,sort:s=!0,frustumCull:a=!0,clear:c}){i===null?(this.bindFramebuffer(),this.setViewport(this.width*this.dpr,this.height*this.dpr)):(this.bindFramebuffer(i),this.setViewport(i.width,i.height)),(c||this.autoClear&&c!==!1)&&(this.depth&&(!i||i.depth)&&(this.enable(this.gl.DEPTH_TEST),this.setDepthMask(!0)),(this.stencil||!i||i.stencil)&&(this.enable(this.gl.STENCIL_TEST),this.setStencilMask(255)),this.gl.clear((this.color?this.gl.COLOR_BUFFER_BIT:0)|(this.depth?this.gl.DEPTH_BUFFER_BIT:0)|(this.stencil?this.gl.STENCIL_BUFFER_BIT:0))),n&&e.updateMatrixWorld(),r&&r.updateMatrixWorld(),this.getRenderList({scene:e,camera:r,frustumCull:a,sort:s}).forEach(d=>{d.draw({camera:r})})}};function Ut(t,e){return t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],t}function Bt(t,e,r,i,n){return t[0]=e,t[1]=r,t[2]=i,t[3]=n,t}function Gt(t,e){let r=e[0],i=e[1],n=e[2],s=e[3],a=r*r+i*i+n*n+s*s;return a>0&&(a=1/Math.sqrt(a)),t[0]=r*a,t[1]=i*a,t[2]=n*a,t[3]=s*a,t}function Ht(t,e){return t[0]*e[0]+t[1]*e[1]+t[2]*e[2]+t[3]*e[3]}function qt(t){return t[0]=0,t[1]=0,t[2]=0,t[3]=1,t}function Wt(t,e,r){r=r*.5;let i=Math.sin(r);return t[0]=i*e[0],t[1]=i*e[1],t[2]=i*e[2],t[3]=Math.cos(r),t}function it(t,e,r){let i=e[0],n=e[1],s=e[2],a=e[3],c=r[0],o=r[1],d=r[2],f=r[3];return t[0]=i*f+a*c+n*d-s*o,t[1]=n*f+a*o+s*c-i*d,t[2]=s*f+a*d+i*o-n*c,t[3]=a*f-i*c-n*o-s*d,t}function Vt(t,e,r){r*=.5;let i=e[0],n=e[1],s=e[2],a=e[3],c=Math.sin(r),o=Math.cos(r);return t[0]=i*o+a*c,t[1]=n*o+s*c,t[2]=s*o-n*c,t[3]=a*o-i*c,t}function Xt(t,e,r){r*=.5;let i=e[0],n=e[1],s=e[2],a=e[3],c=Math.sin(r),o=Math.cos(r);return t[0]=i*o-s*c,t[1]=n*o+a*c,t[2]=s*o+i*c,t[3]=a*o-n*c,t}function Yt(t,e,r){r*=.5;let i=e[0],n=e[1],s=e[2],a=e[3],c=Math.sin(r),o=Math.cos(r);return t[0]=i*o+n*c,t[1]=n*o-i*c,t[2]=s*o+a*c,t[3]=a*o-s*c,t}function jt(t,e,r,i){let n=e[0],s=e[1],a=e[2],c=e[3],o=r[0],d=r[1],f=r[2],u=r[3],l,m,p,h,g;return m=n*o+s*d+a*f+c*u,m<0&&(m=-m,o=-o,d=-d,f=-f,u=-u),1-m>1e-6?(l=Math.acos(m),p=Math.sin(l),h=Math.sin((1-i)*l)/p,g=Math.sin(i*l)/p):(h=1-i,g=i),t[0]=h*n+g*o,t[1]=h*s+g*d,t[2]=h*a+g*f,t[3]=h*c+g*u,t}function Kt(t,e){let r=e[0],i=e[1],n=e[2],s=e[3],a=r*r+i*i+n*n+s*s,c=a?1/a:0;return t[0]=-r*c,t[1]=-i*c,t[2]=-n*c,t[3]=s*c,t}function $t(t,e){return t[0]=-e[0],t[1]=-e[1],t[2]=-e[2],t[3]=e[3],t}function Qt(t,e){let r=e[0]+e[4]+e[8],i;if(r>0)i=Math.sqrt(r+1),t[3]=.5*i,i=.5/i,t[0]=(e[5]-e[7])*i,t[1]=(e[6]-e[2])*i,t[2]=(e[1]-e[3])*i;else{let n=0;e[4]>e[0]&&(n=1),e[8]>e[n*3+n]&&(n=2);let s=(n+1)%3,a=(n+2)%3;i=Math.sqrt(e[n*3+n]-e[s*3+s]-e[a*3+a]+1),t[n]=.5*i,i=.5/i,t[3]=(e[s*3+a]-e[a*3+s])*i,t[s]=(e[s*3+n]+e[n*3+s])*i,t[a]=(e[a*3+n]+e[n*3+a])*i}return t}function Zt(t,e,r="YXZ"){let i=Math.sin(e[0]*.5),n=Math.cos(e[0]*.5),s=Math.sin(e[1]*.5),a=Math.cos(e[1]*.5),c=Math.sin(e[2]*.5),o=Math.cos(e[2]*.5);return r==="XYZ"?(t[0]=i*a*o+n*s*c,t[1]=n*s*o-i*a*c,t[2]=n*a*c+i*s*o,t[3]=n*a*o-i*s*c):r==="YXZ"?(t[0]=i*a*o+n*s*c,t[1]=n*s*o-i*a*c,t[2]=n*a*c-i*s*o,t[3]=n*a*o+i*s*c):r==="ZXY"?(t[0]=i*a*o-n*s*c,t[1]=n*s*o+i*a*c,t[2]=n*a*c+i*s*o,t[3]=n*a*o-i*s*c):r==="ZYX"?(t[0]=i*a*o-n*s*c,t[1]=n*s*o+i*a*c,t[2]=n*a*c-i*s*o,t[3]=n*a*o+i*s*c):r==="YZX"?(t[0]=i*a*o+n*s*c,t[1]=n*s*o+i*a*c,t[2]=n*a*c-i*s*o,t[3]=n*a*o-i*s*c):r==="XZY"&&(t[0]=i*a*o-n*s*c,t[1]=n*s*o-i*a*c,t[2]=n*a*c+i*s*o,t[3]=n*a*o+i*s*c),t}var Jt=Ut,er=Bt;var tr=Ht;var rr=Gt;var He=class extends Array{constructor(e=0,r=0,i=0,n=1){super(e,r,i,n),this.onChange=()=>{},this._target=this;let s=["0","1","2","3"];return new Proxy(this,{set(a,c){let o=Reflect.set(...arguments);return o&&s.includes(c)&&a.onChange(),o}})}get x(){return this[0]}get y(){return this[1]}get z(){return this[2]}get w(){return this[3]}set x(e){this._target[0]=e,this.onChange()}set y(e){this._target[1]=e,this.onChange()}set z(e){this._target[2]=e,this.onChange()}set w(e){this._target[3]=e,this.onChange()}identity(){return qt(this._target),this.onChange(),this}set(e,r,i,n){return e.length?this.copy(e):(er(this._target,e,r,i,n),this.onChange(),this)}rotateX(e){return Vt(this._target,this._target,e),this.onChange(),this}rotateY(e){return Xt(this._target,this._target,e),this.onChange(),this}rotateZ(e){return Yt(this._target,this._target,e),this.onChange(),this}inverse(e=this._target){return Kt(this._target,e),this.onChange(),this}conjugate(e=this._target){return $t(this._target,e),this.onChange(),this}copy(e){return Jt(this._target,e),this.onChange(),this}normalize(e=this._target){return rr(this._target,e),this.onChange(),this}multiply(e,r){return r?it(this._target,e,r):it(this._target,this._target,e),this.onChange(),this}dot(e){return tr(this._target,e)}fromMatrix3(e){return Qt(this._target,e),this.onChange(),this}fromEuler(e,r){return Zt(this._target,e,e.order),r||this.onChange(),this}fromAxisAngle(e,r){return Wt(this._target,e,r),this.onChange(),this}slerp(e,r){return jt(this._target,this._target,e,r),this.onChange(),this}fromArray(e,r=0){return this._target[0]=e[r],this._target[1]=e[r+1],this._target[2]=e[r+2],this._target[3]=e[r+3],this.onChange(),this}toArray(e=[],r=0){return e[r]=this[0],e[r+1]=this[1],e[r+2]=this[2],e[r+3]=this[3],e}};var vi=1e-6;function ir(t,e){return t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],t[4]=e[4],t[5]=e[5],t[6]=e[6],t[7]=e[7],t[8]=e[8],t[9]=e[9],t[10]=e[10],t[11]=e[11],t[12]=e[12],t[13]=e[13],t[14]=e[14],t[15]=e[15],t}function nr(t,e,r,i,n,s,a,c,o,d,f,u,l,m,p,h,g){return t[0]=e,t[1]=r,t[2]=i,t[3]=n,t[4]=s,t[5]=a,t[6]=c,t[7]=o,t[8]=d,t[9]=f,t[10]=u,t[11]=l,t[12]=m,t[13]=p,t[14]=h,t[15]=g,t}function sr(t){return t[0]=1,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=1,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[10]=1,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t}function ar(t,e){let r=e[0],i=e[1],n=e[2],s=e[3],a=e[4],c=e[5],o=e[6],d=e[7],f=e[8],u=e[9],l=e[10],m=e[11],p=e[12],h=e[13],g=e[14],x=e[15],T=r*c-i*a,E=r*o-n*a,y=r*d-s*a,w=i*o-n*c,v=i*d-s*c,A=n*d-s*o,F=f*h-u*p,D=f*g-l*p,R=f*x-m*p,W=u*g-l*h,_=u*x-m*h,H=l*x-m*g,b=T*H-E*_+y*W+w*R-v*D+A*F;return b?(b=1/b,t[0]=(c*H-o*_+d*W)*b,t[1]=(n*_-i*H-s*W)*b,t[2]=(h*A-g*v+x*w)*b,t[3]=(l*v-u*A-m*w)*b,t[4]=(o*R-a*H-d*D)*b,t[5]=(r*H-n*R+s*D)*b,t[6]=(g*y-p*A-x*E)*b,t[7]=(f*A-l*y+m*E)*b,t[8]=(a*_-c*R+d*F)*b,t[9]=(i*R-r*_-s*F)*b,t[10]=(p*v-h*y+x*T)*b,t[11]=(u*y-f*v-m*T)*b,t[12]=(c*D-a*W-o*F)*b,t[13]=(r*W-i*D+n*F)*b,t[14]=(h*E-p*w-g*T)*b,t[15]=(f*w-u*E+l*T)*b,t):null}function nt(t){let e=t[0],r=t[1],i=t[2],n=t[3],s=t[4],a=t[5],c=t[6],o=t[7],d=t[8],f=t[9],u=t[10],l=t[11],m=t[12],p=t[13],h=t[14],g=t[15],x=e*a-r*s,T=e*c-i*s,E=e*o-n*s,y=r*c-i*a,w=r*o-n*a,v=i*o-n*c,A=d*p-f*m,F=d*h-u*m,D=d*g-l*m,R=f*h-u*p,W=f*g-l*p,_=u*g-l*h;return x*_-T*W+E*R+y*D-w*F+v*A}function st(t,e,r){let i=e[0],n=e[1],s=e[2],a=e[3],c=e[4],o=e[5],d=e[6],f=e[7],u=e[8],l=e[9],m=e[10],p=e[11],h=e[12],g=e[13],x=e[14],T=e[15],E=r[0],y=r[1],w=r[2],v=r[3];return t[0]=E*i+y*c+w*u+v*h,t[1]=E*n+y*o+w*l+v*g,t[2]=E*s+y*d+w*m+v*x,t[3]=E*a+y*f+w*p+v*T,E=r[4],y=r[5],w=r[6],v=r[7],t[4]=E*i+y*c+w*u+v*h,t[5]=E*n+y*o+w*l+v*g,t[6]=E*s+y*d+w*m+v*x,t[7]=E*a+y*f+w*p+v*T,E=r[8],y=r[9],w=r[10],v=r[11],t[8]=E*i+y*c+w*u+v*h,t[9]=E*n+y*o+w*l+v*g,t[10]=E*s+y*d+w*m+v*x,t[11]=E*a+y*f+w*p+v*T,E=r[12],y=r[13],w=r[14],v=r[15],t[12]=E*i+y*c+w*u+v*h,t[13]=E*n+y*o+w*l+v*g,t[14]=E*s+y*d+w*m+v*x,t[15]=E*a+y*f+w*p+v*T,t}function or(t,e,r){let i=r[0],n=r[1],s=r[2],a,c,o,d,f,u,l,m,p,h,g,x;return e===t?(t[12]=e[0]*i+e[4]*n+e[8]*s+e[12],t[13]=e[1]*i+e[5]*n+e[9]*s+e[13],t[14]=e[2]*i+e[6]*n+e[10]*s+e[14],t[15]=e[3]*i+e[7]*n+e[11]*s+e[15]):(a=e[0],c=e[1],o=e[2],d=e[3],f=e[4],u=e[5],l=e[6],m=e[7],p=e[8],h=e[9],g=e[10],x=e[11],t[0]=a,t[1]=c,t[2]=o,t[3]=d,t[4]=f,t[5]=u,t[6]=l,t[7]=m,t[8]=p,t[9]=h,t[10]=g,t[11]=x,t[12]=a*i+f*n+p*s+e[12],t[13]=c*i+u*n+h*s+e[13],t[14]=o*i+l*n+g*s+e[14],t[15]=d*i+m*n+x*s+e[15]),t}function lr(t,e,r){let i=r[0],n=r[1],s=r[2];return t[0]=e[0]*i,t[1]=e[1]*i,t[2]=e[2]*i,t[3]=e[3]*i,t[4]=e[4]*n,t[5]=e[5]*n,t[6]=e[6]*n,t[7]=e[7]*n,t[8]=e[8]*s,t[9]=e[9]*s,t[10]=e[10]*s,t[11]=e[11]*s,t[12]=e[12],t[13]=e[13],t[14]=e[14],t[15]=e[15],t}function cr(t,e,r,i){let n=i[0],s=i[1],a=i[2],c=Math.hypot(n,s,a),o,d,f,u,l,m,p,h,g,x,T,E,y,w,v,A,F,D,R,W,_,H,b,B;return Math.abs(c)<vi?null:(c=1/c,n*=c,s*=c,a*=c,o=Math.sin(r),d=Math.cos(r),f=1-d,u=e[0],l=e[1],m=e[2],p=e[3],h=e[4],g=e[5],x=e[6],T=e[7],E=e[8],y=e[9],w=e[10],v=e[11],A=n*n*f+d,F=s*n*f+a*o,D=a*n*f-s*o,R=n*s*f-a*o,W=s*s*f+d,_=a*s*f+n*o,H=n*a*f+s*o,b=s*a*f-n*o,B=a*a*f+d,t[0]=u*A+h*F+E*D,t[1]=l*A+g*F+y*D,t[2]=m*A+x*F+w*D,t[3]=p*A+T*F+v*D,t[4]=u*R+h*W+E*_,t[5]=l*R+g*W+y*_,t[6]=m*R+x*W+w*_,t[7]=p*R+T*W+v*_,t[8]=u*H+h*b+E*B,t[9]=l*H+g*b+y*B,t[10]=m*H+x*b+w*B,t[11]=p*H+T*b+v*B,e!==t&&(t[12]=e[12],t[13]=e[13],t[14]=e[14],t[15]=e[15]),t)}function hr(t,e){return t[0]=e[12],t[1]=e[13],t[2]=e[14],t}function at(t,e){let r=e[0],i=e[1],n=e[2],s=e[4],a=e[5],c=e[6],o=e[8],d=e[9],f=e[10];return t[0]=Math.hypot(r,i,n),t[1]=Math.hypot(s,a,c),t[2]=Math.hypot(o,d,f),t}function fr(t){let e=t[0],r=t[1],i=t[2],n=t[4],s=t[5],a=t[6],c=t[8],o=t[9],d=t[10],f=e*e+r*r+i*i,u=n*n+s*s+a*a,l=c*c+o*o+d*d;return Math.sqrt(Math.max(f,u,l))}var ot=(function(){let t=[1,1,1];return function(e,r){let i=t;at(i,r);let n=1/i[0],s=1/i[1],a=1/i[2],c=r[0]*n,o=r[1]*s,d=r[2]*a,f=r[4]*n,u=r[5]*s,l=r[6]*a,m=r[8]*n,p=r[9]*s,h=r[10]*a,g=c+u+h,x=0;return g>0?(x=Math.sqrt(g+1)*2,e[3]=.25*x,e[0]=(l-p)/x,e[1]=(m-d)/x,e[2]=(o-f)/x):c>u&&c>h?(x=Math.sqrt(1+c-u-h)*2,e[3]=(l-p)/x,e[0]=.25*x,e[1]=(o+f)/x,e[2]=(m+d)/x):u>h?(x=Math.sqrt(1+u-c-h)*2,e[3]=(m-d)/x,e[0]=(o+f)/x,e[1]=.25*x,e[2]=(l+p)/x):(x=Math.sqrt(1+h-c-u)*2,e[3]=(o-f)/x,e[0]=(m+d)/x,e[1]=(l+p)/x,e[2]=.25*x),e}})();function ur(t,e,r,i){let n=Le([t[0],t[1],t[2]]),s=Le([t[4],t[5],t[6]]),a=Le([t[8],t[9],t[10]]);nt(t)<0&&(n=-n),r[0]=t[12],r[1]=t[13],r[2]=t[14];let o=t.slice(),d=1/n,f=1/s,u=1/a;o[0]*=d,o[1]*=d,o[2]*=d,o[4]*=f,o[5]*=f,o[6]*=f,o[8]*=u,o[9]*=u,o[10]*=u,ot(e,o),i[0]=n,i[1]=s,i[2]=a}function dr(t,e,r,i){let n=t,s=e[0],a=e[1],c=e[2],o=e[3],d=s+s,f=a+a,u=c+c,l=s*d,m=s*f,p=s*u,h=a*f,g=a*u,x=c*u,T=o*d,E=o*f,y=o*u,w=i[0],v=i[1],A=i[2];return n[0]=(1-(h+x))*w,n[1]=(m+y)*w,n[2]=(p-E)*w,n[3]=0,n[4]=(m-y)*v,n[5]=(1-(l+x))*v,n[6]=(g+T)*v,n[7]=0,n[8]=(p+E)*A,n[9]=(g-T)*A,n[10]=(1-(l+h))*A,n[11]=0,n[12]=r[0],n[13]=r[1],n[14]=r[2],n[15]=1,n}function pr(t,e){let r=e[0],i=e[1],n=e[2],s=e[3],a=r+r,c=i+i,o=n+n,d=r*a,f=i*a,u=i*c,l=n*a,m=n*c,p=n*o,h=s*a,g=s*c,x=s*o;return t[0]=1-u-p,t[1]=f+x,t[2]=l-g,t[3]=0,t[4]=f-x,t[5]=1-d-p,t[6]=m+h,t[7]=0,t[8]=l+g,t[9]=m-h,t[10]=1-d-u,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t}function mr(t,e,r,i,n){let s=1/Math.tan(e/2),a=1/(i-n);return t[0]=s/r,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=s,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[10]=(n+i)*a,t[11]=-1,t[12]=0,t[13]=0,t[14]=2*n*i*a,t[15]=0,t}function gr(t,e,r,i,n,s,a){let c=1/(e-r),o=1/(i-n),d=1/(s-a);return t[0]=-2*c,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=-2*o,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[10]=2*d,t[11]=0,t[12]=(e+r)*c,t[13]=(n+i)*o,t[14]=(a+s)*d,t[15]=1,t}function xr(t,e,r,i){let n=e[0],s=e[1],a=e[2],c=i[0],o=i[1],d=i[2],f=n-r[0],u=s-r[1],l=a-r[2],m=f*f+u*u+l*l;m===0?l=1:(m=1/Math.sqrt(m),f*=m,u*=m,l*=m);let p=o*l-d*u,h=d*f-c*l,g=c*u-o*f;return m=p*p+h*h+g*g,m===0&&(d?c+=1e-6:o?d+=1e-6:o+=1e-6,p=o*l-d*u,h=d*f-c*l,g=c*u-o*f,m=p*p+h*h+g*g),m=1/Math.sqrt(m),p*=m,h*=m,g*=m,t[0]=p,t[1]=h,t[2]=g,t[3]=0,t[4]=u*g-l*h,t[5]=l*p-f*g,t[6]=f*h-u*p,t[7]=0,t[8]=f,t[9]=u,t[10]=l,t[11]=0,t[12]=n,t[13]=s,t[14]=a,t[15]=1,t}function lt(t,e,r){return t[0]=e[0]+r[0],t[1]=e[1]+r[1],t[2]=e[2]+r[2],t[3]=e[3]+r[3],t[4]=e[4]+r[4],t[5]=e[5]+r[5],t[6]=e[6]+r[6],t[7]=e[7]+r[7],t[8]=e[8]+r[8],t[9]=e[9]+r[9],t[10]=e[10]+r[10],t[11]=e[11]+r[11],t[12]=e[12]+r[12],t[13]=e[13]+r[13],t[14]=e[14]+r[14],t[15]=e[15]+r[15],t}function ct(t,e,r){return t[0]=e[0]-r[0],t[1]=e[1]-r[1],t[2]=e[2]-r[2],t[3]=e[3]-r[3],t[4]=e[4]-r[4],t[5]=e[5]-r[5],t[6]=e[6]-r[6],t[7]=e[7]-r[7],t[8]=e[8]-r[8],t[9]=e[9]-r[9],t[10]=e[10]-r[10],t[11]=e[11]-r[11],t[12]=e[12]-r[12],t[13]=e[13]-r[13],t[14]=e[14]-r[14],t[15]=e[15]-r[15],t}function vr(t,e,r){return t[0]=e[0]*r,t[1]=e[1]*r,t[2]=e[2]*r,t[3]=e[3]*r,t[4]=e[4]*r,t[5]=e[5]*r,t[6]=e[6]*r,t[7]=e[7]*r,t[8]=e[8]*r,t[9]=e[9]*r,t[10]=e[10]*r,t[11]=e[11]*r,t[12]=e[12]*r,t[13]=e[13]*r,t[14]=e[14]*r,t[15]=e[15]*r,t}var Ae=class extends Array{constructor(e=1,r=0,i=0,n=0,s=0,a=1,c=0,o=0,d=0,f=0,u=1,l=0,m=0,p=0,h=0,g=1){return super(e,r,i,n,s,a,c,o,d,f,u,l,m,p,h,g),this}get x(){return this[12]}get y(){return this[13]}get z(){return this[14]}get w(){return this[15]}set x(e){this[12]=e}set y(e){this[13]=e}set z(e){this[14]=e}set w(e){this[15]=e}set(e,r,i,n,s,a,c,o,d,f,u,l,m,p,h,g){return e.length?this.copy(e):(nr(this,e,r,i,n,s,a,c,o,d,f,u,l,m,p,h,g),this)}translate(e,r=this){return or(this,r,e),this}rotate(e,r,i=this){return cr(this,i,e,r),this}scale(e,r=this){return lr(this,r,typeof e=="number"?[e,e,e]:e),this}add(e,r){return r?lt(this,e,r):lt(this,this,e),this}sub(e,r){return r?ct(this,e,r):ct(this,this,e),this}multiply(e,r){return e.length?r?st(this,e,r):st(this,this,e):vr(this,this,e),this}identity(){return sr(this),this}copy(e){return ir(this,e),this}fromPerspective({fov:e,aspect:r,near:i,far:n}={}){return mr(this,e,r,i,n),this}fromOrthogonal({left:e,right:r,bottom:i,top:n,near:s,far:a}){return gr(this,e,r,i,n,s,a),this}fromQuaternion(e){return pr(this,e),this}setPosition(e){return this.x=e[0],this.y=e[1],this.z=e[2],this}inverse(e=this){return ar(this,e),this}compose(e,r,i){return dr(this,e,r,i),this}decompose(e,r,i){return ur(this,e,r,i),this}getRotation(e){return ot(e,this),this}getTranslation(e){return hr(e,this),this}getScaling(e){return at(e,this),this}getMaxScaleOnAxis(){return fr(this)}lookAt(e,r,i){return xr(this,e,r,i),this}determinant(){return nt(this)}fromArray(e,r=0){return this[0]=e[r],this[1]=e[r+1],this[2]=e[r+2],this[3]=e[r+3],this[4]=e[r+4],this[5]=e[r+5],this[6]=e[r+6],this[7]=e[r+7],this[8]=e[r+8],this[9]=e[r+9],this[10]=e[r+10],this[11]=e[r+11],this[12]=e[r+12],this[13]=e[r+13],this[14]=e[r+14],this[15]=e[r+15],this}toArray(e=[],r=0){return e[r]=this[0],e[r+1]=this[1],e[r+2]=this[2],e[r+3]=this[3],e[r+4]=this[4],e[r+5]=this[5],e[r+6]=this[6],e[r+7]=this[7],e[r+8]=this[8],e[r+9]=this[9],e[r+10]=this[10],e[r+11]=this[11],e[r+12]=this[12],e[r+13]=this[13],e[r+14]=this[14],e[r+15]=this[15],e}};function yr(t,e,r="YXZ"){return r==="XYZ"?(t[1]=Math.asin(Math.min(Math.max(e[8],-1),1)),Math.abs(e[8])<.99999?(t[0]=Math.atan2(-e[9],e[10]),t[2]=Math.atan2(-e[4],e[0])):(t[0]=Math.atan2(e[6],e[5]),t[2]=0)):r==="YXZ"?(t[0]=Math.asin(-Math.min(Math.max(e[9],-1),1)),Math.abs(e[9])<.99999?(t[1]=Math.atan2(e[8],e[10]),t[2]=Math.atan2(e[1],e[5])):(t[1]=Math.atan2(-e[2],e[0]),t[2]=0)):r==="ZXY"?(t[0]=Math.asin(Math.min(Math.max(e[6],-1),1)),Math.abs(e[6])<.99999?(t[1]=Math.atan2(-e[2],e[10]),t[2]=Math.atan2(-e[4],e[5])):(t[1]=0,t[2]=Math.atan2(e[1],e[0]))):r==="ZYX"?(t[1]=Math.asin(-Math.min(Math.max(e[2],-1),1)),Math.abs(e[2])<.99999?(t[0]=Math.atan2(e[6],e[10]),t[2]=Math.atan2(e[1],e[0])):(t[0]=0,t[2]=Math.atan2(-e[4],e[5]))):r==="YZX"?(t[2]=Math.asin(Math.min(Math.max(e[1],-1),1)),Math.abs(e[1])<.99999?(t[0]=Math.atan2(-e[9],e[5]),t[1]=Math.atan2(-e[2],e[0])):(t[0]=0,t[1]=Math.atan2(e[8],e[10]))):r==="XZY"&&(t[2]=Math.asin(-Math.min(Math.max(e[4],-1),1)),Math.abs(e[4])<.99999?(t[0]=Math.atan2(e[6],e[5]),t[1]=Math.atan2(e[8],e[0])):(t[0]=Math.atan2(-e[9],e[10]),t[1]=0)),t}var wr=new Ae,qe=class extends Array{constructor(e=0,r=e,i=e,n="YXZ"){super(e,r,i),this.order=n,this.onChange=()=>{},this._target=this;let s=["0","1","2"];return new Proxy(this,{set(a,c){let o=Reflect.set(...arguments);return o&&s.includes(c)&&a.onChange(),o}})}get x(){return this[0]}get y(){return this[1]}get z(){return this[2]}set x(e){this._target[0]=e,this.onChange()}set y(e){this._target[1]=e,this.onChange()}set z(e){this._target[2]=e,this.onChange()}set(e,r=e,i=e){return e.length?this.copy(e):(this._target[0]=e,this._target[1]=r,this._target[2]=i,this.onChange(),this)}copy(e){return this._target[0]=e[0],this._target[1]=e[1],this._target[2]=e[2],this.onChange(),this}reorder(e){return this._target.order=e,this.onChange(),this}fromRotationMatrix(e,r=this.order){return yr(this._target,e,r),this.onChange(),this}fromQuaternion(e,r=this.order,i){return wr.fromQuaternion(e),this._target.fromRotationMatrix(wr,r),i||this.onChange(),this}fromArray(e,r=0){return this._target[0]=e[r],this._target[1]=e[r+1],this._target[2]=e[r+2],this}toArray(e=[],r=0){return e[r]=this[0],e[r+1]=this[1],e[r+2]=this[2],e}};var We=class{constructor(){this.parent=null,this.children=[],this.visible=!0,this.matrix=new Ae,this.worldMatrix=new Ae,this.matrixAutoUpdate=!0,this.worldMatrixNeedsUpdate=!1,this.position=new xe,this.quaternion=new He,this.scale=new xe(1),this.rotation=new qe,this.up=new xe(0,1,0),this.rotation._target.onChange=()=>this.quaternion.fromEuler(this.rotation,!0),this.quaternion._target.onChange=()=>this.rotation.fromQuaternion(this.quaternion,void 0,!0)}setParent(e,r=!0){this.parent&&e!==this.parent&&this.parent.removeChild(this,!1),this.parent=e,r&&e&&e.addChild(this,!1)}addChild(e,r=!0){~this.children.indexOf(e)||this.children.push(e),r&&e.setParent(this,!1)}removeChild(e,r=!0){~this.children.indexOf(e)&&this.children.splice(this.children.indexOf(e),1),r&&e.setParent(null,!1)}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.worldMatrixNeedsUpdate||e)&&(this.parent===null?this.worldMatrix.copy(this.matrix):this.worldMatrix.multiply(this.parent.worldMatrix,this.matrix),this.worldMatrixNeedsUpdate=!1,e=!0);for(let r=0,i=this.children.length;r<i;r++)this.children[r].updateMatrixWorld(e)}updateMatrix(){this.matrix.compose(this.quaternion,this.position,this.scale),this.worldMatrixNeedsUpdate=!0}traverse(e){if(!e(this))for(let r=0,i=this.children.length;r<i;r++)this.children[r].traverse(e)}decompose(){this.matrix.decompose(this.quaternion._target,this.position,this.scale),this.rotation.fromQuaternion(this.quaternion)}lookAt(e,r=!1){r?this.matrix.lookAt(this.position,e,this.up):this.matrix.lookAt(e,this.position,this.up),this.matrix.getRotation(this.quaternion._target),this.rotation.fromQuaternion(this.quaternion)}};function Mr(t,e){return t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[4],t[4]=e[5],t[5]=e[6],t[6]=e[8],t[7]=e[9],t[8]=e[10],t}function br(t,e){let r=e[0],i=e[1],n=e[2],s=e[3],a=r+r,c=i+i,o=n+n,d=r*a,f=i*a,u=i*c,l=n*a,m=n*c,p=n*o,h=s*a,g=s*c,x=s*o;return t[0]=1-u-p,t[3]=f-x,t[6]=l+g,t[1]=f+x,t[4]=1-d-p,t[7]=m-h,t[2]=l-g,t[5]=m+h,t[8]=1-d-u,t}function Er(t,e){return t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],t[4]=e[4],t[5]=e[5],t[6]=e[6],t[7]=e[7],t[8]=e[8],t}function Rr(t,e,r,i,n,s,a,c,o,d){return t[0]=e,t[1]=r,t[2]=i,t[3]=n,t[4]=s,t[5]=a,t[6]=c,t[7]=o,t[8]=d,t}function Ar(t){return t[0]=1,t[1]=0,t[2]=0,t[3]=0,t[4]=1,t[5]=0,t[6]=0,t[7]=0,t[8]=1,t}function Sr(t,e){let r=e[0],i=e[1],n=e[2],s=e[3],a=e[4],c=e[5],o=e[6],d=e[7],f=e[8],u=f*a-c*d,l=-f*s+c*o,m=d*s-a*o,p=r*u+i*l+n*m;return p?(p=1/p,t[0]=u*p,t[1]=(-f*i+n*d)*p,t[2]=(c*i-n*a)*p,t[3]=l*p,t[4]=(f*r-n*o)*p,t[5]=(-c*r+n*s)*p,t[6]=m*p,t[7]=(-d*r+i*o)*p,t[8]=(a*r-i*s)*p,t):null}function ht(t,e,r){let i=e[0],n=e[1],s=e[2],a=e[3],c=e[4],o=e[5],d=e[6],f=e[7],u=e[8],l=r[0],m=r[1],p=r[2],h=r[3],g=r[4],x=r[5],T=r[6],E=r[7],y=r[8];return t[0]=l*i+m*a+p*d,t[1]=l*n+m*c+p*f,t[2]=l*s+m*o+p*u,t[3]=h*i+g*a+x*d,t[4]=h*n+g*c+x*f,t[5]=h*s+g*o+x*u,t[6]=T*i+E*a+y*d,t[7]=T*n+E*c+y*f,t[8]=T*s+E*o+y*u,t}function Tr(t,e,r){let i=e[0],n=e[1],s=e[2],a=e[3],c=e[4],o=e[5],d=e[6],f=e[7],u=e[8],l=r[0],m=r[1];return t[0]=i,t[1]=n,t[2]=s,t[3]=a,t[4]=c,t[5]=o,t[6]=l*i+m*a+d,t[7]=l*n+m*c+f,t[8]=l*s+m*o+u,t}function Fr(t,e,r){let i=e[0],n=e[1],s=e[2],a=e[3],c=e[4],o=e[5],d=e[6],f=e[7],u=e[8],l=Math.sin(r),m=Math.cos(r);return t[0]=m*i+l*a,t[1]=m*n+l*c,t[2]=m*s+l*o,t[3]=m*a-l*i,t[4]=m*c-l*n,t[5]=m*o-l*s,t[6]=d,t[7]=f,t[8]=u,t}function Lr(t,e,r){let i=r[0],n=r[1];return t[0]=i*e[0],t[1]=i*e[1],t[2]=i*e[2],t[3]=n*e[3],t[4]=n*e[4],t[5]=n*e[5],t[6]=e[6],t[7]=e[7],t[8]=e[8],t}function Cr(t,e){let r=e[0],i=e[1],n=e[2],s=e[3],a=e[4],c=e[5],o=e[6],d=e[7],f=e[8],u=e[9],l=e[10],m=e[11],p=e[12],h=e[13],g=e[14],x=e[15],T=r*c-i*a,E=r*o-n*a,y=r*d-s*a,w=i*o-n*c,v=i*d-s*c,A=n*d-s*o,F=f*h-u*p,D=f*g-l*p,R=f*x-m*p,W=u*g-l*h,_=u*x-m*h,H=l*x-m*g,b=T*H-E*_+y*W+w*R-v*D+A*F;return b?(b=1/b,t[0]=(c*H-o*_+d*W)*b,t[1]=(o*R-a*H-d*D)*b,t[2]=(a*_-c*R+d*F)*b,t[3]=(n*_-i*H-s*W)*b,t[4]=(r*H-n*R+s*D)*b,t[5]=(i*R-r*_-s*F)*b,t[6]=(h*A-g*v+x*w)*b,t[7]=(g*y-p*A-x*E)*b,t[8]=(p*v-h*y+x*T)*b,t):null}var Ve=class extends Array{constructor(e=1,r=0,i=0,n=0,s=1,a=0,c=0,o=0,d=1){return super(e,r,i,n,s,a,c,o,d),this}set(e,r,i,n,s,a,c,o,d){return e.length?this.copy(e):(Rr(this,e,r,i,n,s,a,c,o,d),this)}translate(e,r=this){return Tr(this,r,e),this}rotate(e,r=this){return Fr(this,r,e),this}scale(e,r=this){return Lr(this,r,e),this}multiply(e,r){return r?ht(this,e,r):ht(this,this,e),this}identity(){return Ar(this),this}copy(e){return Er(this,e),this}fromMatrix4(e){return Mr(this,e),this}fromQuaternion(e){return br(this,e),this}fromBasis(e,r,i){return this.set(e[0],e[1],e[2],r[0],r[1],r[2],i[0],i[1],i[2]),this}inverse(e=this){return Sr(this,e),this}getNormalMatrix(e){return Cr(this,e),this}};var bi=0,Te=class extends We{constructor(e,{geometry:r,program:i,mode:n=e.TRIANGLES,frustumCulled:s=!0,renderOrder:a=0}={}){super(),e.canvas||console.error("gl not passed as first argument to Mesh"),this.gl=e,this.id=bi++,this.geometry=r,this.program=i,this.mode=n,this.frustumCulled=s,this.renderOrder=a,this.modelViewMatrix=new Ae,this.normalMatrix=new Ve,this.beforeRenderCallbacks=[],this.afterRenderCallbacks=[]}onBeforeRender(e){return this.beforeRenderCallbacks.push(e),this}onAfterRender(e){return this.afterRenderCallbacks.push(e),this}draw({camera:e}={}){e&&(this.program.uniforms.modelMatrix||Object.assign(this.program.uniforms,{modelMatrix:{value:null},viewMatrix:{value:null},modelViewMatrix:{value:null},normalMatrix:{value:null},projectionMatrix:{value:null},cameraPosition:{value:null}}),this.program.uniforms.projectionMatrix.value=e.projectionMatrix,this.program.uniforms.cameraPosition.value=e.worldPosition,this.program.uniforms.viewMatrix.value=e.viewMatrix,this.modelViewMatrix.multiply(e.viewMatrix,this.worldMatrix),this.normalMatrix.getNormalMatrix(this.modelViewMatrix),this.program.uniforms.modelMatrix.value=this.worldMatrix,this.program.uniforms.modelViewMatrix.value=this.modelViewMatrix,this.program.uniforms.normalMatrix.value=this.normalMatrix),this.beforeRenderCallbacks.forEach(i=>i&&i({mesh:this,camera:e}));let r=this.program.cullFace&&this.worldMatrix.determinant()<0;this.program.use({flipFaces:r}),this.geometry.draw({mode:this.mode,program:this.program}),this.afterRenderCallbacks.forEach(i=>i&&i({mesh:this,camera:e}))}};var _r=new Uint8Array(4);function Ir(t){return(t&t-1)===0}var Ei=1,we=class{constructor(e,{image:r,target:i=e.TEXTURE_2D,type:n=e.UNSIGNED_BYTE,format:s=e.RGBA,internalFormat:a=s,wrapS:c=e.CLAMP_TO_EDGE,wrapT:o=e.CLAMP_TO_EDGE,wrapR:d=e.CLAMP_TO_EDGE,generateMipmaps:f=i===(e.TEXTURE_2D||e.TEXTURE_CUBE_MAP),minFilter:u=f?e.NEAREST_MIPMAP_LINEAR:e.LINEAR,magFilter:l=e.LINEAR,premultiplyAlpha:m=!1,unpackAlignment:p=4,flipY:h=i==(e.TEXTURE_2D||e.TEXTURE_3D),anisotropy:g=0,level:x=0,width:T,height:E=T,length:y=1}={}){this.gl=e,this.id=Ei++,this.image=r,this.target=i,this.type=n,this.format=s,this.internalFormat=a,this.minFilter=u,this.magFilter=l,this.wrapS=c,this.wrapT=o,this.wrapR=d,this.generateMipmaps=f,this.premultiplyAlpha=m,this.unpackAlignment=p,this.flipY=h,this.anisotropy=Math.min(g,this.gl.renderer.parameters.maxAnisotropy),this.level=x,this.width=T,this.height=E,this.length=y,this.texture=this.gl.createTexture(),this.store={image:null},this.glState=this.gl.renderer.state,this.state={},this.state.minFilter=this.gl.NEAREST_MIPMAP_LINEAR,this.state.magFilter=this.gl.LINEAR,this.state.wrapS=this.gl.REPEAT,this.state.wrapT=this.gl.REPEAT,this.state.anisotropy=0}bind(){this.glState.textureUnits[this.glState.activeTextureUnit]!==this.id&&(this.gl.bindTexture(this.target,this.texture),this.glState.textureUnits[this.glState.activeTextureUnit]=this.id)}update(e=0){let r=!(this.image===this.store.image&&!this.needsUpdate);if((r||this.glState.textureUnits[e]!==this.id)&&(this.gl.renderer.activeTexture(e),this.bind()),!!r){if(this.needsUpdate=!1,this.flipY!==this.glState.flipY&&(this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL,this.flipY),this.glState.flipY=this.flipY),this.premultiplyAlpha!==this.glState.premultiplyAlpha&&(this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,this.premultiplyAlpha),this.glState.premultiplyAlpha=this.premultiplyAlpha),this.unpackAlignment!==this.glState.unpackAlignment&&(this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT,this.unpackAlignment),this.glState.unpackAlignment=this.unpackAlignment),this.minFilter!==this.state.minFilter&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_MIN_FILTER,this.minFilter),this.state.minFilter=this.minFilter),this.magFilter!==this.state.magFilter&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_MAG_FILTER,this.magFilter),this.state.magFilter=this.magFilter),this.wrapS!==this.state.wrapS&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_WRAP_S,this.wrapS),this.state.wrapS=this.wrapS),this.wrapT!==this.state.wrapT&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_WRAP_T,this.wrapT),this.state.wrapT=this.wrapT),this.wrapR!==this.state.wrapR&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_WRAP_R,this.wrapR),this.state.wrapR=this.wrapR),this.anisotropy&&this.anisotropy!==this.state.anisotropy&&(this.gl.texParameterf(this.target,this.gl.renderer.getExtension("EXT_texture_filter_anisotropic").TEXTURE_MAX_ANISOTROPY_EXT,this.anisotropy),this.state.anisotropy=this.anisotropy),this.image){if(this.image.width&&(this.width=this.image.width,this.height=this.image.height),this.target===this.gl.TEXTURE_CUBE_MAP)for(let i=0;i<6;i++)this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+i,this.level,this.internalFormat,this.format,this.type,this.image[i]);else if(ArrayBuffer.isView(this.image))this.target===this.gl.TEXTURE_2D?this.gl.texImage2D(this.target,this.level,this.internalFormat,this.width,this.height,0,this.format,this.type,this.image):(this.target===this.gl.TEXTURE_2D_ARRAY||this.target===this.gl.TEXTURE_3D)&&this.gl.texImage3D(this.target,this.level,this.internalFormat,this.width,this.height,this.length,0,this.format,this.type,this.image);else if(this.image.isCompressedTexture)for(let i=0;i<this.image.length;i++)this.gl.compressedTexImage2D(this.target,i,this.internalFormat,this.image[i].width,this.image[i].height,0,this.image[i].data);else this.target===this.gl.TEXTURE_2D?this.gl.texImage2D(this.target,this.level,this.internalFormat,this.format,this.type,this.image):this.gl.texImage3D(this.target,this.level,this.internalFormat,this.width,this.height,this.length,0,this.format,this.type,this.image);this.generateMipmaps&&(!this.gl.renderer.isWebgl2&&(!Ir(this.image.width)||!Ir(this.image.height))?(this.generateMipmaps=!1,this.wrapS=this.wrapT=this.gl.CLAMP_TO_EDGE,this.minFilter=this.gl.LINEAR):this.gl.generateMipmap(this.target)),this.onUpdate&&this.onUpdate()}else if(this.target===this.gl.TEXTURE_CUBE_MAP)for(let i=0;i<6;i++)this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+i,0,this.gl.RGBA,1,1,0,this.gl.RGBA,this.gl.UNSIGNED_BYTE,_r);else this.width?this.target===this.gl.TEXTURE_2D?this.gl.texImage2D(this.target,this.level,this.internalFormat,this.width,this.height,0,this.format,this.type,null):this.gl.texImage3D(this.target,this.level,this.internalFormat,this.width,this.height,this.length,0,this.format,this.type,null):this.gl.texImage2D(this.target,0,this.gl.RGBA,1,1,0,this.gl.RGBA,this.gl.UNSIGNED_BYTE,_r);this.store.image=this.image}}};var Pe=class{constructor(e,{width:r=e.canvas.width,height:i=e.canvas.height,target:n=e.FRAMEBUFFER,color:s=1,depth:a=!0,stencil:c=!1,depthTexture:o=!1,wrapS:d=e.CLAMP_TO_EDGE,wrapT:f=e.CLAMP_TO_EDGE,wrapR:u=e.CLAMP_TO_EDGE,minFilter:l=e.LINEAR,magFilter:m=l,type:p=e.UNSIGNED_BYTE,format:h=e.RGBA,internalFormat:g=h,unpackAlignment:x,premultiplyAlpha:T}={}){this.gl=e,this.width=r,this.height=i,this.depth=a,this.stencil=c,this.buffer=this.gl.createFramebuffer(),this.target=n,this.gl.renderer.bindFramebuffer(this),this.textures=[];let E=[];for(let y=0;y<s;y++)this.textures.push(new we(e,{width:r,height:i,wrapS:d,wrapT:f,wrapR:u,minFilter:l,magFilter:m,type:p,format:h,internalFormat:g,unpackAlignment:x,premultiplyAlpha:T,flipY:!1,generateMipmaps:!1})),this.textures[y].update(),this.gl.framebufferTexture2D(this.target,this.gl.COLOR_ATTACHMENT0+y,this.gl.TEXTURE_2D,this.textures[y].texture,0),E.push(this.gl.COLOR_ATTACHMENT0+y);E.length>1&&this.gl.renderer.drawBuffers(E),this.texture=this.textures[0],o&&(this.gl.renderer.isWebgl2||this.gl.renderer.getExtension("WEBGL_depth_texture"))?(this.depthTexture=new we(e,{width:r,height:i,minFilter:this.gl.NEAREST,magFilter:this.gl.NEAREST,format:this.stencil?this.gl.DEPTH_STENCIL:this.gl.DEPTH_COMPONENT,internalFormat:e.renderer.isWebgl2?this.stencil?this.gl.DEPTH24_STENCIL8:this.gl.DEPTH_COMPONENT16:this.gl.DEPTH_COMPONENT,type:this.stencil?this.gl.UNSIGNED_INT_24_8:this.gl.UNSIGNED_INT}),this.depthTexture.update(),this.gl.framebufferTexture2D(this.target,this.stencil?this.gl.DEPTH_STENCIL_ATTACHMENT:this.gl.DEPTH_ATTACHMENT,this.gl.TEXTURE_2D,this.depthTexture.texture,0)):(a&&!c&&(this.depthBuffer=this.gl.createRenderbuffer(),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_COMPONENT16,r,i),this.gl.framebufferRenderbuffer(this.target,this.gl.DEPTH_ATTACHMENT,this.gl.RENDERBUFFER,this.depthBuffer)),c&&!a&&(this.stencilBuffer=this.gl.createRenderbuffer(),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.stencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.STENCIL_INDEX8,r,i),this.gl.framebufferRenderbuffer(this.target,this.gl.STENCIL_ATTACHMENT,this.gl.RENDERBUFFER,this.stencilBuffer)),a&&c&&(this.depthStencilBuffer=this.gl.createRenderbuffer(),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthStencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_STENCIL,r,i),this.gl.framebufferRenderbuffer(this.target,this.gl.DEPTH_STENCIL_ATTACHMENT,this.gl.RENDERBUFFER,this.depthStencilBuffer))),this.gl.renderer.bindFramebuffer({target:this.target})}setSize(e,r){if(!(this.width===e&&this.height===r)){this.width=e,this.height=r,this.gl.renderer.bindFramebuffer(this);for(let i=0;i<this.textures.length;i++)this.textures[i].width=e,this.textures[i].height=r,this.textures[i].needsUpdate=!0,this.textures[i].update(),this.gl.framebufferTexture2D(this.target,this.gl.COLOR_ATTACHMENT0+i,this.gl.TEXTURE_2D,this.textures[i].texture,0);this.depthTexture?(this.depthTexture.width=e,this.depthTexture.height=r,this.depthTexture.needsUpdate=!0,this.depthTexture.update(),this.gl.framebufferTexture2D(this.target,this.gl.DEPTH_ATTACHMENT,this.gl.TEXTURE_2D,this.depthTexture.texture,0)):(this.depthBuffer&&(this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_COMPONENT16,e,r)),this.stencilBuffer&&(this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.stencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.STENCIL_INDEX8,e,r)),this.depthStencilBuffer&&(this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthStencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_STENCIL,e,r))),this.gl.renderer.bindFramebuffer({target:this.target})}}};var Ie=class extends Ge{constructor(e,{attributes:r={}}={}){Object.assign(r,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])},uv:{size:2,data:new Float32Array([0,0,2,0,0,2])}}),super(e,r)}};var Ur=`data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><path d="M39 3 12 37h17l-4 24 27-34H35z" fill="#fff"/></svg>')}`,Ri=560,ye=4,ze=1e20,Fe=5,Oe=3,Ai=4e6,kr=t=>{let e=String(t||"").replace("#","");e.length===3&&(e=e.replace(/./g,i=>i+i));let r=parseInt(e.slice(0,6),16);return Number.isNaN(r)?[1,1,1]:[(r>>16&255)/255,(r>>8&255)/255,(r&255)/255]},Pr=(t,e,r,i,n)=>{let s=0;r[0]=0,i[0]=-ze,i[1]=ze;for(let a=1;a<n;a++){let c=(t[a]+a*a-(t[r[s]]+r[s]*r[s]))/(2*a-2*r[s]);for(;c<=i[s];)s--,c=(t[a]+a*a-(t[r[s]]+r[s]*r[s]))/(2*a-2*r[s]);s++,r[s]=a,i[s]=c,i[s+1]=ze}s=0;for(let a=0;a<n;a++){for(;i[s+1]<a;)s++;e[a]=(a-r[s])*(a-r[s])+t[r[s]]}},zr=(t,e,r)=>{let i=Math.max(e,r),n=new Float64Array(i),s=new Float64Array(i),a=new Int32Array(i),c=new Float64Array(i+1);for(let o=0;o<e;o++){for(let d=0;d<r;d++)n[d]=t[d*e+o];Pr(n,s,a,c,r);for(let d=0;d<r;d++)t[d*e+o]=s[d]}for(let o=0;o<r;o++){for(let d=0;d<e;d++)n[d]=t[o*e+d];Pr(n,s,a,c,e);for(let d=0;d<e;d++)t[o*e+d]=s[d]}},Or=(t,e,r,i,n,s)=>{let a=1/(2*s+1),c=0;for(let o=0;o<=s&&o<n;o++)c+=t[r+o*i];for(let o=0;o<n;o++)e[r+o*i]=c*a,o+s+1<n&&(c+=t[r+(o+s+1)*i]),o-s>=0&&(c-=t[r+(o-s)*i])},Dr=(t,e,r,i)=>{let n=new Float32Array(e*r);for(let s=0;s<3;s++){for(let a=0;a<r;a++)Or(t,n,a*e,1,e,i);for(let a=0;a<e;a++)Or(n,t,a,e,r,i)}},Si=(t,e,r)=>{let i=new Float32Array(e*r),n=0;for(let f=0;f<e*r;f++)t[f*4+3]<250&&n++;if(n>e*r*.01){for(let f=0;f<e*r;f++)i[f]=t[f*4+3]/255;return i}let s=0,a=0,c=0,o=0,d=f=>{s+=t[f*4],a+=t[f*4+1],c+=t[f*4+2],o++};for(let f=0;f<e;f++)d(f),d((r-1)*e+f);for(let f=0;f<r;f++)d(f*e),d(f*e+e-1);s/=o,a/=o,c/=o;for(let f=0;f<e*r;f++){let u=Math.max(Math.abs(t[f*4]-s),Math.abs(t[f*4+1]-a),Math.abs(t[f*4+2]-c));i[f]=Math.min(1,Math.max(0,(u-24)/48))}return i},Nr=(t,e,r)=>{let{field:i,width:n,height:s}=t,a=Math.min(Math.max(e,.5),n-.5),c=Math.min(Math.max(r,.5),s-.5),o=Math.min(Math.floor(a-.5),n-2),d=Math.min(Math.floor(c-.5),s-2),f=a-.5-o,u=c-.5-d,l=d*n+o,m=i[l]+(i[l+1]-i[l])*f,p=i[l+n]+(i[l+n+1]-i[l+n])*f;return m+(p-m)*u+Math.hypot(e-a,r-c)},Ti=t=>{let e=t.naturalWidth||t.width,r=t.naturalHeight||t.height;if(!e||!r)return null;let i=Ri/Math.max(e,r),n=Math.max(2,Math.round(e*i)),s=Math.max(2,Math.round(r*i)),a=document.createElement("canvas");a.width=n,a.height=s;let c=a.getContext("2d",{willReadFrequently:!0});if(!c)return null;c.drawImage(t,0,0,n,s);let o=Si(c.getImageData(0,0,n,s).data,n,s),d=n,f=s,u=-1,l=-1;for(let N=0;N<s;N++)for(let $=0;$<n;$++)o[N*n+$]<=.01||($<d&&(d=$),$>u&&(u=$),N<f&&(f=N),N>l&&(l=N));if(u<0)return null;let m=u-d+1,p=l-f+1,h=Math.ceil(Math.max(m,p)*.25)+2,g=m+h*2,x=p+h*2,T=new Float32Array(g*x),E=new Float32Array(g*x);for(let N=0;N<x;N++)for(let $=0;$<g;$++){let Y=$-h+d,se=N-h+f,ae=Y>=0&&se>=0&&Y<n&&se<s?o[se*n+Y]:0,P=N*g+$;if(ae>=1)T[P]=0,E[P]=ze;else if(ae<=0)T[P]=ze,E[P]=0;else{let z=.5-ae;T[P]=z>0?z*z:0,E[P]=z<0?z*z:0}}zr(T,g,x),zr(E,g,x);let y=new Float32Array(g*x);for(let N=0;N<g*x;N++)y[N]=Math.sqrt(T[N])-Math.sqrt(E[N]);let w=[];for(let N=1;N<x-1;N++)for(let $=1;$<g-1;$++){let Y=N*g+$,se=y[Y];if(se>0||y[Y-1]<=0&&y[Y+1]<=0&&y[Y-g]<=0&&y[Y+g]<=0)continue;let ae=y[Y+1]-y[Y-1],P=y[Y+g]-y[Y-g],z=Math.hypot(ae,P)||1;w.push($+.5-se*ae/z,N+.5-se*P/z)}let v=Math.max(1,Math.ceil(w.length/2/3e3))*2,A=[];for(let N=0;N<w.length;N+=v)A.push(w[N],w[N+1]);let F=Math.max(m,p),D=Math.ceil(F*.7/ye),R=Math.ceil(m/ye)+D*2,W=Math.ceil(p/ye)+D*2,_=new Float32Array(R*W);for(let N=0;N<x;N++){let $=Math.floor((N-h)/ye)+D;for(let Y=0;Y<g;Y++){let se=Math.floor((Y-h)/ye)+D;_[$*R+se]+=Math.exp(-Math.abs(y[N*g+Y])/1.5)/(ye*ye)}}let H=_.slice(),b=Math.max(1,Math.round(F*.035/ye)),B=Math.max(2,Math.round(F*.13/ye));Dr(_,R,W,b),Dr(H,R,W,B);let L=Math.sqrt(2*Math.PI*(b*b+b))*ye/3,j=Math.sqrt(2*Math.PI*(B*B+B))*ye/3,K=new Float32Array(R*W*2);for(let N=0;N<R*W;N++)K[N*2]=_[N]*L,K[N*2+1]=H[N]*j;return{field:y,edges:A,width:g,height:x,pad:h,logoWidth:m,logoHeight:p,glow:K,glowWidth:R,glowHeight:W,glowOffset:h-D*ye}},ft=(t,e,r)=>{let{edges:i,logoWidth:n,logoHeight:s}=t,a=i.length/2;if(a<2)return null;let c=Math.max(n,s),o=Math.floor(Math.random()*a);if(r){let u=!1;for(let l=0;l<40&&!u;l++){let m=Math.floor(Math.random()*a);Math.hypot(i[m*2]-r.x,i[m*2+1]-r.y)<r.radius&&(o=m,u=!0)}if(!u)return null}let d=i[o*2],f=i[o*2+1];for(let u=0;u<24;u++){let l=Math.floor(Math.random()*a),m=i[l*2],p=i[l*2+1],h=Math.hypot(m-d,p-f);if(h<c*.08||h>c*.3)continue;let g=-(p-f)/h,x=(m-d)/h,T=h*(.2+Math.random()*.3),E=(d+m)/2,y=(f+p)/2,w=Nr(t,E+g*T,y+x*T),v=Nr(t,E-g*T,y-x*T);if(!(Math.max(w,v)<=0))return{ax:d,ay:f,bx:m,by:p,bow:w>=v?T:-T,seed:1+Math.random()*60,born:e,life:.35+Math.random()*.45}}return null},Fi=`#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`,Li=`#version 300 es
precision highp float;
precision highp int;

uniform sampler2D tFieldFrom;
uniform sampler2D tGlowFrom;
uniform sampler2D tFieldTo;
uniform sampler2D tGlowTo;
uniform vec4 uMapFrom;
uniform vec4 uSizeFrom;
uniform vec4 uMapTo;
uniform vec4 uSizeTo;
uniform float uMorph;
uniform vec2 uResolution;
uniform float uUnit;
uniform float uTime;
uniform float uPresence;
uniform vec3 uHover;
uniform float uHoverRadius;
uniform vec4 uPulses[${Oe}];
uniform float uPulseBoost;
uniform float uFlash;
uniform vec3 uColor;
uniform vec3 uGlowColor;
uniform float uIntensity;
uniform float uGlow;
uniform float uThickness;
uniform float uStrands;
uniform float uBend;
uniform float uCrackle;
uniform float uFlicker;
uniform float uFill;
uniform float uInk;
uniform vec4 uArcEnds[${Fe}];
uniform vec4 uArcShape[${Fe}];

in vec2 vUv;
out vec4 fragColor;

uint scramble(uint x) {
  x ^= x >> 16u;
  x *= 0x7feb352du;
  x ^= x >> 15u;
  x *= 0x846ca68bu;
  x ^= x >> 16u;
  return x;
}

float fieldAt(sampler2D tex, vec4 map, vec4 size, vec2 p) {
  vec2 f = (p - map.xy) / map.z;
  vec2 c = clamp(f, vec2(0.5), size.xy - 0.5);
  return (textureLod(tex, c / size.xy, 0.0).r + length(f - c)) * map.z;
}

vec2 glowAt(sampler2D tex, vec4 map, vec4 size, vec2 p) {
  vec2 f = (p - map.xy) / map.z - map.w;
  return textureLod(tex, f / (size.zw * ${ye}.0), 0.0).rg;
}

float shape(vec2 p, float k) {
  float to = fieldAt(tFieldTo, uMapTo, uSizeTo, p);
  if (k >= 1.0) return to;
  return mix(fieldAt(tFieldFrom, uMapFrom, uSizeFrom, p), to, k);
}

vec2 aura(vec2 p, float k) {
  vec2 to = glowAt(tGlowTo, uMapTo, uSizeTo, p);
  if (k >= 1.0) return to;
  return mix(glowAt(tGlowFrom, uMapFrom, uSizeFrom, p), to, k);
}

vec4 corner(ivec2 c, uint seed) {
  uint h = scramble(uint(c.x) * 0x8da6b343u + uint(c.y) * 0xd8163841u + seed * 0xcb1ab31fu);
  return vec4(uvec4(h, h >> 8u, h >> 16u, h >> 24u) & 255u) / 127.5 - 1.0;
}

vec2 drift(vec2 p, uint seed, out mat2 jac) {
  vec2 i = floor(p);
  vec2 f = p - i;
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  vec2 du = 30.0 * f * f * (f * (f - 2.0) + 1.0);
  ivec2 c = ivec2(i);
  vec4 ga = corner(c, seed);
  vec4 gb = corner(c + ivec2(1, 0), seed);
  vec4 gc = corner(c + ivec2(0, 1), seed);
  vec4 gd = corner(c + ivec2(1, 1), seed);
  vec2 fb = f - vec2(1.0, 0.0);
  vec2 fc = f - vec2(0.0, 1.0);
  vec2 fd = f - vec2(1.0);
  vec2 va = vec2(dot(ga.xy, f), dot(ga.zw, f));
  vec2 vb = vec2(dot(gb.xy, fb), dot(gb.zw, fb));
  vec2 vc = vec2(dot(gc.xy, fc), dot(gc.zw, fc));
  vec2 vd = vec2(dot(gd.xy, fd), dot(gd.zw, fd));
  vec2 k = va - vb - vc + vd;
  vec4 g = ga + u.x * (gb - ga) + u.y * (gc - ga) + u.x * u.y * (ga - gb - gc + gd);
  jac = mat2(
    g.xy + du * (u.yx * k.x + vec2(vb.x - va.x, vc.x - va.x)),
    g.zw + du * (u.yx * k.y + vec2(vb.y - va.y, vc.y - va.y))
  );
  return va + u.x * (vb - va) + u.y * (vc - va) + u.x * u.y * k;
}

float wobble(vec2 p, uint seed) {
  mat2 jac;
  return drift(p, seed, jac).x;
}

vec2 ripple(vec2 p, out float surge) {
  vec2 push = vec2(0.0);
  surge = 0.0;
  float width = uUnit * 10.0;
  for (int i = 0; i < ${Oe}; i++) {
    vec4 pulse = uPulses[i];
    if (pulse.w <= 0.0) continue;
    vec2 d = p - pulse.xy;
    float dist = length(d);
    float front = (dist - pulse.z * uUnit * 150.0) / width;
    float env = exp(-front * front) * pulse.w * exp(-pulse.z * 1.7) * smoothstep(0.0, uUnit * 8.0, dist);
    push += d / max(dist, 1.0) * env * cos(front * 2.2) * uUnit * 7.5;
    surge += env;
  }
  return push;
}

vec2 wander(vec2 p, float t, uint seed, float reachScale, out mat2 jac, out vec2 sway) {
  vec2 q = p / uUnit;
  mat2 ja;
  mat2 jb;
  mat2 jc;
  mat2 jd;
  vec2 a = drift(q * 0.028 + vec2(t * 0.29, t * 0.21), seed, ja);
  vec2 b = drift(q * 0.085 + a * 0.4 + vec2(t * 0.83, -t * 0.61) + 17.0, seed + 1u, jb);
  vec2 c = drift(p / 9.0 + b * 0.6 + vec2(t * 1.9, t * 1.3) + 5.0, seed + 2u, jc);
  vec2 d = drift(p / 4.1 + vec2(-t * 2.7, t * 2.2) + 11.0, seed + 3u, jd);
  float bendAmp = uBend * 8.0 * reachScale;
  float rippleAmp = uBend * 3.2 * reachScale;
  float crinkleAmp = uCrackle * 1.5 * reachScale;
  jac = ja * (0.028 * bendAmp) + jb * (0.085 * rippleAmp) + jc * (crinkleAmp / 9.0) + jd * (crinkleAmp * 0.35 / 4.1);
  sway = (a * bendAmp + b * rippleAmp) * uUnit;
  return sway + (c + d * 0.35) * crinkleAmp;
}

vec2 glowShape(float line, float spread, float w) {
  float x = abs(line);
  float y = abs(spread);
  return vec2(exp(-x * x / (w * w * 0.5)) + exp(-y / (w * 2.2)) * 0.6, exp(-y / (w * 4.5)) * 0.5);
}

void addArc(vec2 p, vec4 ends, vec4 info, float t, inout vec3 light, inout float energy, inout float hot) {
  if (info.y < 0.002) return;
  vec2 ab = ends.zw - ends.xy;
  float len = max(length(ab), 1.0);
  vec2 dir = ab / len;
  vec2 rel = p - ends.xy;
  float s = dot(rel, dir);
  float h = dot(rel, vec2(-dir.y, dir.x));
  float margin = abs(info.x) + uCrackle * (2.0 + len * 0.08) + uThickness * 12.0 + 10.0;
  if (s < -margin || s > len + margin || abs(h) > margin) return;
  float u = clamp(s / len, 0.0, 1.0);
  float taper = sin(3.14159265 * u);
  float bendSlope = s > 0.0 && s < len ? 3.14159265 / len * cos(3.14159265 * u) : 0.0;
  float beyond = max(-s, 0.0) + max(s - len, 0.0);
  for (int c = 0; c < 2; c++) {
    uint seed = uint(info.z * 131.0) + uint(c) * 29u + 7u;
    float jag = 0.0;
    float jagSlope = 0.0;
    float wave = max(len * 0.3, 14.0);
    float weight = uCrackle * (1.5 + len * 0.05) * (c == 0 ? 1.0 : 1.5);
    for (int o = 0; o < 3; o++) {
      mat2 jac;
      float n = drift(vec2(s / wave + info.z * 3.0, t * (1.4 + float(o) * 1.1)), seed + uint(o), jac).x;
      jag += n * weight;
      jagSlope += jac[0].x * weight / wave;
      wave *= 0.42;
      weight *= 0.4;
    }
    float offset = (info.x + jag) * taper;
    float offsetSlope = (info.x + jag) * bendSlope + jagSlope * taper;
    float across = (h - offset) / sqrt(1.0 + offsetSlope * offsetSlope);
    float gap = length(vec2(beyond, across));
    float w = uThickness * (c == 0 ? 0.9 : 0.6);
    vec2 g = glowShape(gap, gap, w);
    float k = info.y * (c == 0 ? 1.0 : 0.45);
    light += (uColor * g.x + uGlowColor * g.y * uGlow) * k;
    energy += (g.x + g.y * uGlow) * k;
    hot += exp(-gap * gap / (w * w * 0.16)) * k * (c == 0 ? 1.0 : 0.0);
  }
}

void main() {
  vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uResolution;
  float t = uTime;
  vec3 light = vec3(0.0);
  float energy = 0.0;
  float hot = 0.0;

  float surge;
  vec2 pr = p - ripple(p, surge);
  float k = uMorph >= 1.0 ? 1.0 : smoothstep(0.0, 1.0, clamp(uMorph * 1.7 - 0.35 + 0.35 * wobble(p / uUnit * 0.018, 41u), 0.0, 1.0));
  float transit = uMorph >= 1.0 ? 0.0 : sin(3.14159265 * uMorph);
  float base = shape(pr, k);

  vec2 toHover = p - uHover.xy;
  float heat = min(uHover.z * exp(-dot(toHover, toHover) / (uHoverRadius * uHoverRadius)) + surge * 1.4 + transit * 0.5, 2.0);
  float heatCap = min(uHover.z + uPulseBoost * 1.4 + transit * 0.5, 2.0);
  float breath = 1.0 + uFlicker * 0.6 * wobble(vec2(t * 2.1, 7.0), 3u);
  float grow = uPresence;

  float edge = abs(base);
  vec2 halo = aura(pr, k);
  float ink = uInk;
  float bloom = (halo.x * 0.16 + halo.y * 0.08) * (1.0 - ink * 0.65) * uGlow * (1.0 + heat * 1.2);
  float body = smoothstep(0.75, -0.75, base) * uFill * (0.06 + 1.2 * min(halo.x, 1.0)) * (1.0 + heat * 0.5);
  light += uGlowColor * bloom * grow * grow;
  energy += bloom * grow * grow;

  float reachScale = mix(0.15, 1.0, grow) * (1.0 + heat * 0.9);
  float reach = (uUnit * uBend * 16.0 + uCrackle * 3.0) * (1.0 + heatCap * 0.9) + uThickness * 20.0 + 8.0;
  if (edge < reach && grow > 0.0) {
    float fade = smoothstep(reach, reach * 0.55, edge);
    vec2 q = pr / uUnit;
    float count = min(uStrands + heat * 2.5, 6.0);
    float limit = min(uStrands + heatCap * 2.5, 6.0);
    for (int i = 0; i < 6; i++) {
      float fi = float(i);
      if (fi >= limit) break;
      float present = clamp(count - fi, 0.0, 1.0);
      if (present <= 0.0) continue;
      uint seed = uint(i) * 7u + 3u;
      mat2 jac;
      vec2 sway;
      float lead = i == 0 ? 1.0 : 0.0;
      vec2 warped = pr + wander(pr, t * (1.0 + fi * 0.19), seed, reachScale * mix(0.6 + fi * 0.2, 0.7, lead), jac, sway);
      float dw = shape(warped, k);
      vec2 slope = vec2(shape(warped + vec2(1.0, 0.0), k), shape(warped + vec2(0.0, 1.0), k)) - dw;
      float d = dw / max(length(slope + jac * slope), 0.3);
      float spread = shape(pr + sway, k);
      float swell = 0.5 + 0.5 * wobble(q * 0.06 + vec2(t * 0.9, fi * 5.1 - t * 0.6), seed + 8u);
      float w = uThickness * mix(0.5, 1.0, lead) * (0.5 + swell);
      float vis = mix(0.3 + 0.45 * smoothstep(-0.25, 0.2, wobble(q * 0.035 + vec2(t * 0.21, fi * 3.7), seed + 5u)), 1.0, lead);
      float spark = 1.0 - uFlicker * 0.3 * (0.5 + 0.5 * wobble(vec2(t * 6.0, fi * 2.3), seed + 6u));
      float weight = max(vis, heat * 0.85) * spark * fade * present * (0.7 + 0.6 * swell);
      vec2 g = glowShape(d, spread, w) * weight;
      float soft = mix(1.0, mix(0.5, 1.0, lead), ink);
      vec3 stroke = mix(uColor, uGlowColor, ink * (1.0 - lead) * 0.65);
      float haze = uGlow * (1.0 + heat) * (1.0 - ink * 0.7);
      light += stroke * g.x * soft + uGlowColor * g.y * haze;
      energy += g.x * soft + g.y * haze;
      hot += exp(-d * d / (w * w * 0.16)) * lead * weight;
    }
    light *= grow;
    energy *= grow;
  }

  for (int i = 0; i < ${Fe}; i++) addArc(pr, uArcEnds[i], uArcShape[i], t, light, energy, hot);

  float gain = uIntensity * breath * (1.0 + heat * 0.45) * (1.0 + uFlash * 0.3) * 1.4;
  float alpha = 1.0 - exp(-energy * gain);
  vec3 color = mix(1.0 - exp(-light * gain), alpha * light / max(energy, 1e-4), ink);
  color = mix(color, vec3(alpha), clamp(hot * grow, 0.0, 1.0) * ink * 0.85);
  float tint = (1.0 - exp(-body * gain * 1.2)) * grow * grow * (1.0 - ink * 0.82);
  color += uGlowColor * tint * (1.0 - alpha);
  alpha += tint * (1.0 - alpha);
  float grain = (fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) - 0.5) / 255.0;
  alpha = clamp(alpha + grain, 0.0, 1.0);
  fragColor = vec4(clamp(color + grain, 0.0, alpha), alpha);
}
`,Ci={src:Ur,color:"#ecc7ff",glowColor:"#ad6dff",scale:.7,intensity:1,glow:1,thickness:1.5,strands:4,bend:.6,crackle:1.5,arcs:1,flicker:.6,fill:0,speed:2.5,interactive:!0,cursorIntensity:.75,cursorRadius:100,theme:"dark",onRender:void 0};function Br(t,e={}){let r={current:{...Ci,...e}},i={current:null},n={current:t};t.classList.add("electric-logo");let s=r.current.src,a=(()=>{let o=!0,d=new Image;return d.crossOrigin="anonymous",d.decoding="async",d.onload=()=>{if(!o)return;let f=null;try{f=Ti(d)}catch{f=null}f&&(i.current=f)},d.src=s||Ur,()=>{o=!1,d.onload=null}})(),c=(()=>{let o=n.current;if(!o)return;let d=new _e({dpr:Math.min(window.devicePixelRatio||1,2),alpha:!0,premultipliedAlpha:!0,antialias:!1}),f=d.gl;if(!d.isWebgl2){f.getExtension("WEBGL_lose_context")?.loseContext();return}f.clearColor(0,0,0,0);let u=f.canvas;u.style.display="block",u.style.width="100%",u.style.height="100%",o.appendChild(u);let l=()=>({shape:null,field:new we(f,{image:new Float32Array([1e3]),width:1,height:1,internalFormat:f.R16F,format:f.RED,type:f.FLOAT,minFilter:f.LINEAR,magFilter:f.LINEAR,generateMipmaps:!1,flipY:!1,unpackAlignment:1}),glow:new we(f,{image:new Float32Array([0,0]),width:1,height:1,internalFormat:f.RG16F,format:f.RG,type:f.FLOAT,minFilter:f.LINEAR,magFilter:f.LINEAR,generateMipmaps:!1,flipY:!1,unpackAlignment:1})}),m=[l(),l()],p=Array.from({length:Fe*4},()=>0),h=Array.from({length:Fe*4},()=>0),g=Array.from({length:Oe*4},()=>0),x={tFieldFrom:{value:m[1].field},tGlowFrom:{value:m[1].glow},tFieldTo:{value:m[0].field},tGlowTo:{value:m[0].glow},uMapFrom:{value:[0,0,1,0]},uSizeFrom:{value:[1,1,1,1]},uMapTo:{value:[0,0,1,0]},uSizeTo:{value:[1,1,1,1]},uMorph:{value:1},uResolution:{value:[1,1]},uUnit:{value:1},uTime:{value:0},uPresence:{value:0},uHover:{value:[0,0,0]},uHoverRadius:{value:120},uPulses:{value:g},uPulseBoost:{value:0},uFlash:{value:0},uColor:{value:[1,1,1]},uGlowColor:{value:[.43,.48,1]},uIntensity:{value:1},uGlow:{value:1},uThickness:{value:1.8},uStrands:{value:3},uBend:{value:1},uCrackle:{value:1},uFlicker:{value:.4},uFill:{value:.5},uInk:{value:0},uArcEnds:{value:p},uArcShape:{value:h}},T=new Te(f,{geometry:new Ie(f),program:new Ce(f,{vertex:Fi,fragment:Li,uniforms:x,depthTest:!1,depthWrite:!1})}),E=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches??!1,y={x:0,y:0,over:!1},w={x:0,y:0,vx:0,vy:0,power:0},v=[],A=[],F=0,D=null,R=1,W=null,_=0,H=0,b=[[1,1,1],[1,1,1]],B=!1,L=0,j=1,K=1,N=0,$=performance.now(),Y=!0,se=(O,I)=>{O.shape=I,O.field.image=I.field,O.field.width=I.width,O.field.height=I.height,O.field.needsUpdate=!0,O.glow.image=I.glow,O.glow.width=I.glowWidth,O.glow.height=I.glowHeight,O.glow.needsUpdate=!0},ae=(O,I)=>{let re=Math.max(1e-4,Math.min(j*I.scale/O.logoWidth,K*I.scale/O.logoHeight));return{fit:re,ox:j/2-(O.pad+O.logoWidth/2)*re,oy:K/2-(O.pad+O.logoHeight/2)*re,unit:Math.max(O.logoWidth,O.logoHeight)*re/100}},P=()=>{j=Math.max(1,o.clientWidth),K=Math.max(1,o.clientHeight),d.dpr=Math.min(window.devicePixelRatio||1,2,Math.sqrt(Ai/(j*K))),d.setSize(j,K),x.uResolution.value=[j,K]},z=O=>{N=0;let I=r.current,re=Math.min(.05,Math.max(0,(O-$)/1e3));$=O;let he=i.current;he&&he!==m[F].shape&&(D=he),D&&R>=1&&(m[F].shape&&(F=1-F,R=0,v.length=0),se(m[F],D),D=null),R<1&&(R=Math.min(1,R+re/(D?.3:1.6)));let te=m[F].shape,X=R<1?m[1-F].shape:null;te&&(_=Math.min(1,_+re/1.4));let k=_*_*(3-2*_);if(te&&I){let M=ae(te,I),U=X?ae(X,I):M,ne=R*R*(3-2*R),le=U.unit+(M.unit-U.unit)*ne,fe=I.interactive&&y.over;fe&&w.power<.01&&(w.x=y.x,w.y=y.y,w.vx=0,w.vy=0),w.vx+=((y.x-w.x)*120-w.vx*19)*re,w.vy+=((y.y-w.y)*120-w.vy*19)*re,w.x+=w.vx*re,w.y+=w.vy*re,w.power+=((fe?1:0)-w.power)*(1-Math.exp(-re/(fe?.3:.55)));let J=E?.2:1;L+=re*I.speed*J;for(let Q=v.length-1;Q>=0;Q--)L-v[Q].born>v[Q].life&&v.splice(Q,1);let oe=Q=>({x:(Q.x-M.ox)/M.fit,y:(Q.y-M.oy)/M.fit,radius:Math.max(1,I.cursorRadius)/M.fit});if(W&&R>=1&&I.arcs>0)for(let Q=0;Q<3&&v.length<Fe;Q++){let ie=ft(te,L,oe(W));ie&&v.push(ie)}if(W=null,!E&&k>.8&&R>=1&&v.length<Fe){let Q=re*I.speed*I.arcs;if(Math.random()<Q*6*w.power*I.cursorIntensity){let ie=ft(te,L,oe(w));ie&&v.push(ie)}else if(Math.random()<Q*2.2){let ie=ft(te,L,null);ie&&v.push(ie)}}for(let Q=0;Q<Fe;Q++){let ie=Q*4,ee=v[Q];if(!ee){h[ie+1]=0;continue}let ue=(L-ee.born)/ee.life;p[ie]=M.ox+ee.ax*M.fit,p[ie+1]=M.oy+ee.ay*M.fit,p[ie+2]=M.ox+ee.bx*M.fit,p[ie+3]=M.oy+ee.by*M.fit,h[ie]=ee.bow*M.fit,h[ie+1]=Math.sin(Math.PI*Math.min(1,Math.max(0,ue)))*k,h[ie+2]=ee.seed}let ce=0,pe=0;for(let Q=A.length-1;Q>=0;Q--)(O-A[Q].born)/1e3>2&&A.splice(Q,1);for(let Q=0;Q<Oe;Q++){let ie=Q*4,ee=A[Q];if(!ee){g[ie+3]=0;continue}let ue=(O-ee.born)/1e3;g[ie]=ee.x,g[ie+1]=ee.y,g[ie+2]=ue,g[ie+3]=1,ce=Math.max(ce,Math.exp(-ue*1.7)),pe+=Math.exp(-ue*7)}let me=m[1-F];x.tFieldTo.value=m[F].field,x.tGlowTo.value=m[F].glow,x.tFieldFrom.value=me.field,x.tGlowFrom.value=me.glow,x.uMapTo.value=[M.ox,M.oy,M.fit,te.glowOffset],x.uSizeTo.value=[te.width,te.height,te.glowWidth,te.glowHeight],X&&(x.uMapFrom.value=[U.ox,U.oy,U.fit,X.glowOffset],x.uSizeFrom.value=[X.width,X.height,X.glowWidth,X.glowHeight]),x.uMorph.value=R,x.uUnit.value=le,x.uTime.value=L,x.uPresence.value=k,x.uHover.value=[w.x,w.y,w.power*Math.max(0,I.cursorIntensity)],x.uHoverRadius.value=Math.max(1,I.cursorRadius),x.uPulseBoost.value=ce,x.uFlash.value=pe;let de=[kr(I.color),kr(I.glowColor)],Me=B?1-Math.exp(-re/.35):1;B=!0;for(let Q=0;Q<2;Q++)for(let ie=0;ie<3;ie++)b[Q][ie]+=(de[Q][ie]-b[Q][ie])*Me;x.uColor.value=b[0].slice(),x.uGlowColor.value=b[1].slice(),x.uIntensity.value=I.intensity,x.uGlow.value=I.glow,x.uThickness.value=I.thickness,x.uStrands.value=Math.max(1,Math.min(6,Math.round(I.strands))),x.uBend.value=I.bend,x.uCrackle.value=I.crackle,x.uFlicker.value=E?0:I.flicker,H+=((I.theme==="light"?1:0)-H)*(1-Math.exp(-re/.25)),x.uFill.value=I.fill,x.uInk.value=H,d.render({scene:T}),I.onRender?.(u)}Y&&(N=requestAnimationFrame(z))},G=()=>{N||!Y||($=performance.now(),N=requestAnimationFrame(z))},q=O=>{let I=o.getBoundingClientRect();y.x=O.clientX-I.left,y.y=O.clientY-I.top,y.over=!0},Z=O=>{q(O),!(!r.current?.interactive||E)&&(A.push({x:y.x,y:y.y,born:performance.now()}),A.length>Oe&&A.shift(),W={x:y.x,y:y.y})},S=()=>{y.over=!1};o.addEventListener("pointermove",q),o.addEventListener("pointerdown",Z),o.addEventListener("pointerleave",S),o.addEventListener("pointercancel",S);let C=new ResizeObserver(P);C.observe(o);let V=new IntersectionObserver(([O])=>{Y=O.isIntersecting,G()});return V.observe(o),P(),G(),()=>{Y=!1,cancelAnimationFrame(N),C.disconnect(),V.disconnect(),o.removeEventListener("pointermove",q),o.removeEventListener("pointerdown",Z),o.removeEventListener("pointerleave",S),o.removeEventListener("pointercancel",S),f.getExtension("WEBGL_lose_context")?.loseContext(),u.parentNode&&u.parentNode.removeChild(u)}})();return{set(o){Object.assign(r.current,o)},destroy(){a&&a(),c&&c()}}}var _i="https://images.unsplash.com/photo-1737071371043-761e02b1ef95?q=80&w=1400&auto=format&fit=crop",Ii={bayer:0,noise:1,lines:2},Gr={atkinson:[[1,0,1/8],[2,0,1/8],[-1,1,1/8],[0,1,1/8],[1,1,1/8],[0,2,1/8]],floyd:[[1,0,7/16],[-1,1,3/16],[0,1,5/16],[1,1,1/16]]},Hr=.5,qr=4,Wr=1.2,Vr=1.6,ki=1100,ut=t=>{let e=String(t||"").replace("#","");e.length===3&&(e=e.replace(/./g,i=>i+i));let r=parseInt(e.slice(0,6),16);return Number.isNaN(r)?[0,0,0]:[(r>>16&255)/255,(r>>8&255)/255,(r&255)/255]},Pi=(t,e,r,i,n)=>{let s=t/e/(r/i);return n?s>1?[s,1]:[1,1/s]:s>1?[1,1/s]:[s,1]},zi=(t,e,r)=>[e*(.5+.33*Math.sin(t*.53)+.08*Math.sin(t*1.31+.6)),r*(.5+.28*Math.sin(t*.71+1.1)+.07*Math.cos(t*1.57))],Oi=(t,e)=>{t.canvas.width=32,t.canvas.height=32,t.drawImage(e,0,0,32,32);let i=t.getImageData(0,0,32,32).data,n=[0,0,0],s=[0,0,0],a=0;for(let d=0;d<32;d++)for(let f=0;f<32;f++)if(!(f>0&&d>0&&f<31&&d<31)){for(let u=0;u<3;u++){let l=i[(d*32+f)*4+u]/255;n[u]+=l,s[u]+=l*l}a++}let c=[n[0]/a,n[1]/a,n[2]/a],o=c.reduce((d,f,u)=>d+Math.sqrt(Math.max(0,s[u]/a-f*f)),0)/3;return{matte:c,plain:o<.06}},dt=null,Di=()=>{if(dt)return dt;let t=64,e=t*t,r=t-1,i=[];for(let h=-6;h<=6;h++)for(let g=-6;g<=6;g++)i.push(g,h,Math.exp(-(g*g+h*h)/4.5));let n=new Float32Array(e),s=new Uint8Array(e),a=(h,g)=>{let x=h%t,T=(h-x)/t;for(let E=0;E<i.length;E+=3)n[(T+i[E+1]&r)*t+(x+i[E]&r)]+=g*i[E+2]},c=(h,g)=>{let x=0,T=g?-1/0:1/0;for(let E=0;E<e;E++)s[E]===h&&(g?n[E]>T:n[E]<T)&&(T=n[E],x=E);return x},o=7,d=()=>(o=o*16807%2147483647,o/2147483647),f=Math.round(e*.1);for(let h=0;h<f;){let g=Math.floor(d()*e);s[g]||(s[g]=1,a(g,1),h++)}for(let h=0;h<e;h++){let g=c(1,!0);s[g]=0,a(g,-1);let x=c(0,!1);if(s[x]=1,a(x,1),x===g)break}let u=s.slice(),l=n.slice(),m=new Uint16Array(e);for(let h=f-1;h>=0;h--){let g=c(1,!0);s[g]=0,a(g,-1),m[g]=h}s.set(u),n.set(l);for(let h=f;h<e;h++){let g=c(0,!1);s[g]=1,a(g,1),m[g]=h}let p=new Uint8Array(e*4);for(let h=0;h<e;h++){let g=Math.floor(m[h]/e*256);p[h*4]=g,p[h*4+1]=g,p[h*4+2]=g,p[h*4+3]=255}return dt=p,p},Ni=(t,e,r,i,n,s,a)=>{let c=s?3:1,o=new Float32Array(e*r*c);for(let u=0;u<e*r;u++){let l=t[u*4]/255,m=t[u*4+1]/255,p=t[u*4+2]/255;s?(o[u*3]=a(l),o[u*3+1]=a(m),o[u*3+2]=a(p)):o[u]=a(.2126*l+.7152*m+.0722*p)}let d=n-1,f=new Uint8Array(e*r*4);for(let u=0;u<r;u++){let l=u&1?-1:1;for(let m=0;m<e;m++){let p=l>0?m:e-1-m,h=u*e+p;for(let g=0;g<c;g++){let x=o[h*c+g],T=Math.min(d,Math.max(0,Math.round(x*d)))/d,E=x-T,y=Math.round(T*255);s?f[h*4+g]=y:f[h*4]=f[h*4+1]=f[h*4+2]=y;for(let w=0;w<i.length;w++){let v=p+i[w][0]*l,A=u+i[w][1];v<0||v>=e||A>=r||(o[(A*e+v)*c+g]+=E*i[w][2])}}f[h*4+3]=255}}return f},Ui=`#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`,Bi=`#version 300 es
precision highp float;

uniform sampler2D tPrev;
uniform vec2 uSize;
uniform vec2 uFrom;
uniform vec2 uTo;
uniform float uRadius;
uniform float uSoftness;
uniform float uStrength;
uniform float uFade;
uniform float uHold;

in vec2 vUv;
out vec4 fragColor;

float strokeDistance(vec2 p, vec2 a, vec2 b) {
  vec2 ab = b - a;
  float h = clamp(dot(p - a, ab) / max(dot(ab, ab), 0.0001), 0.0, 1.0);
  return length(p - a - ab * h);
}

void main() {
  vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uSize;
  float trail = max(texture(tPrev, vUv).r - uFade, 0.0);
  float band = max(uRadius * uSoftness, 1.0) * uHold;
  float d = strokeDistance(p, uFrom, uTo);
  trail = max(trail, clamp((uRadius - d) / band, 0.0, 1.0) * uStrength);
  fragColor = vec4(trail, 0.0, 0.0, 1.0);
}
`,Gi=`#version 300 es
precision highp float;
precision highp int;

uniform sampler2D tImage;
uniform sampler2D tMask;
uniform sampler2D tNoise;
uniform sampler2D tDiffused;
uniform vec2 uResolution;
uniform vec2 uCover;
uniform float uLod;
uniform float uCell;
uniform int uPattern;
uniform int uPalette;
uniform float uLevels;
uniform vec3 uInk;
uniform vec3 uPaper;
uniform vec3 uRimColor;
uniform float uRim;
uniform float uContrast;
uniform float uBrightness;
uniform float uReverse;
uniform float uIntro;
uniform float uHold;
uniform vec3 uMatte;
uniform float uKey;
uniform vec2 uSize;
uniform vec4 uBursts[4];
uniform float uBurstWidth;

in vec2 vUv;
out vec4 fragColor;

float bayer(vec2 cell) {
  ivec2 p = ivec2(mod(cell, 8.0));
  int v = p.x ^ p.y;
  int m = ((v & 1) << 5) | ((p.y & 1) << 4) | ((v & 2) << 2) | ((p.y & 2) << 1) | ((v & 4) >> 1) | ((p.y & 4) >> 2);
  return (float(m) + 0.5) / 64.0;
}

float blueNoise(vec2 cell) {
  return (texelFetch(tNoise, ivec2(mod(cell, 64.0)), 0).r * 255.0 + 0.5) / 256.0;
}

float engraving(vec2 cell) {
  float period = 6.0;
  float f = (mod(cell.x + cell.y, period) + 0.5) / period;
  return clamp(abs(f * 2.0 - 1.0) + (bayer(cell) - 0.5) * (2.0 / period), 0.0, 1.0);
}

vec2 imageUv(vec2 uv) {
  return (uv - 0.5) * uCover + 0.5;
}

float within(vec2 p) {
  vec2 s = step(vec2(0.0), p) * step(p, vec2(1.0));
  return s.x * s.y;
}

vec3 grade(vec3 c) {
  return pow(clamp((c - 0.5) * uContrast + 0.5 + uBrightness, 0.0, 1.0), vec3(1.6));
}

float shockwave(vec2 p) {
  float value = 0.0;
  for (int i = 0; i < 4; i++) {
    vec4 burst = uBursts[i];
    if (burst.w <= 0.0) continue;
    float offset = distance(p, burst.xy) - burst.z;
    float edge = offset > 0.0 ? offset / (uBurstWidth * 0.35) : -offset / uBurstWidth;
    value = max(value, clamp(1.0 - edge, 0.0, 1.0) * burst.w);
  }
  return value;
}

vec3 toned(vec3 c) {
  return uPalette == 1 ? grade(c) : grade(vec3(dot(c, vec3(0.2126, 0.7152, 0.0722))));
}

vec3 quantize(vec3 v, float t) {
  float steps = max(uLevels - 1.0, 1.0);
  vec3 s = v * steps;
  vec3 base = floor(s);
  return min(base + step(vec3(t), s - base), vec3(steps)) / steps;
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y);
  vec2 cell = floor(px / uCell);
  vec2 center = (cell + 0.5) * uCell;
  vec2 cellUv = vec2(center.x / uResolution.x, 1.0 - center.y / uResolution.y);

  vec2 sampleUv = imageUv(cellUv);
  float framed = within(sampleUv);
  vec3 level;
  if (uPattern == 3) {
    level = texelFetch(tDiffused, ivec2(cell), 0).rgb;
  } else {
    vec3 c = mix(uMatte, textureLod(tImage, sampleUv, uLod).rgb, framed);
    float t = uPattern == 1 ? blueNoise(cell) : (uPattern == 2 ? engraving(cell) : bayer(cell));
    level = quantize(toned(c), t);
  }

  vec3 color = mix(uInk, mix(uInk, uPaper, level), max(framed, uKey));
  vec3 backdrop = mix(uInk, uPaper, toned(uMatte));
  vec2 photoUv = imageUv(vUv);
  vec3 raw = texture(tImage, photoUv).rgb;
  float plain = uKey * (1.0 - smoothstep(0.05, 0.22, distance(raw, uMatte)));
  vec3 photo = mix(mix(uInk, backdrop, uKey), mix(raw, backdrop, plain), within(photoUv));

  vec2 point = vec2(cellUv.x, 1.0 - cellUv.y) * uSize;
  float mask = max(clamp(texture(tMask, cellUv).r * uHold, 0.0, 1.0), shockwave(point));
  float shown = mix(mask, 1.0 - mask, uReverse);
  float order = bayer(cell.yx);
  float low = order * (1.0 - uRim);
  color = mix(color, uRimColor, step(low, shown) * step(0.001, uRim));
  color = mix(color, photo, step(low + uRim, shown));

  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  float spread = length((cellUv - 0.5) * aspect) / length(aspect * 0.5);
  float appear = step(spread * 0.72 + bayer(cell + vec2(3.0, 5.0)) * 0.28, uIntro * 1.001);
  fragColor = vec4(mix(uInk, color, appear), 1.0);
}
`,Hi={src:_i,fit:"contain",pattern:"floyd",pixelSize:2,levels:2,palette:"duotone",inkColor:"#120f17",paperColor:"#f4f1ea",contrast:1.15,brightness:0,revealRadius:200,softness:.6,linger:1,rimColor:"#a78bfa",rim:0,reverse:!1,wander:!1,clickBurst:!0,className:""};function Xr(t,e={}){let r={...Hi,...e},i={current:t},n={current:r},s={current:()=>{}};t.classList.add("dither-veil");let a=r.src,c=(()=>{let o=i.current;if(!o)return;let d=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,f=new _e({dpr:Math.min(window.devicePixelRatio||1,2),alpha:!1,antialias:!1}),u=f.gl,l=u.canvas;l.style.display="block",l.style.width="100%",l.style.height="100%",o.appendChild(l);let m=f.isWebgl2&&!!f.getExtension("EXT_color_buffer_float"),p=new Ie(u),h=()=>new we(u,{image:new Uint8Array(4),width:1,height:1,generateMipmaps:!1,flipY:!1,minFilter:u.NEAREST,magFilter:u.NEAREST}),g=new we(u,{minFilter:u.LINEAR_MIPMAP_LINEAR,magFilter:u.LINEAR}),x=h(),T=h(),E=(M,U)=>new Pe(u,{width:M,height:U,depth:!1,type:m?u.HALF_FLOAT:u.UNSIGNED_BYTE,internalFormat:m?u.RGBA16F:u.RGBA,minFilter:u.LINEAR,magFilter:u.LINEAR}),y=M=>{u.deleteFramebuffer(M.buffer),u.deleteTexture(M.texture.texture)},w=[E(2,2),E(2,2)],v={tPrev:{value:w[0].texture},uSize:{value:[1,1]},uFrom:{value:[0,0]},uTo:{value:[0,0]},uRadius:{value:1},uSoftness:{value:.5},uStrength:{value:0},uFade:{value:1},uHold:{value:Vr}},A={tImage:{value:g},tMask:{value:w[0].texture},tNoise:{value:x},tDiffused:{value:T},uResolution:{value:[1,1]},uCover:{value:[1,1]},uLod:{value:0},uCell:{value:3},uPattern:{value:0},uPalette:{value:0},uLevels:{value:2},uInk:{value:[0,0,0]},uPaper:{value:[1,1,1]},uRimColor:{value:[1,1,1]},uRim:{value:0},uContrast:{value:1},uBrightness:{value:0},uReverse:{value:0},uIntro:{value:0},uHold:{value:Vr},uMatte:{value:[0,0,0]},uKey:{value:0},uSize:{value:[1,1]},uBursts:{value:Array.from({length:qr*4},()=>0)},uBurstWidth:{value:60}},F=(M,U)=>new Ce(u,{vertex:Ui,fragment:M,uniforms:U,depthTest:!1,depthWrite:!1}),D=new Te(u,{geometry:p,program:F(Bi,v)}),R=new Te(u,{geometry:p,program:F(Gi,A)}),W=document.createElement("canvas"),_=W.getContext("2d",{willReadFrequently:!0}),H=null,b=0,B="",L=!1,j=1,K=1,N=!0,$=0,Y=performance.now(),se=0,ae=0,P=0,z={x:0,y:0,inside:!1,fresh:!0,placed:!1},G={x:0,y:0,px:0,py:0},q=[],Z=()=>{j=Math.max(1,o.clientWidth),K=Math.max(1,o.clientHeight),f.setSize(j,K),A.uResolution.value=[l.width,l.height],v.uSize.value=[j,K],A.uSize.value=[j,K];let M=Math.max(2,Math.round(j*Hr)),U=Math.max(2,Math.round(K*Hr));(M!==w[0].width||U!==w[0].height)&&(w.forEach(y),w=[E(M,U),E(M,U)]),z.placed||(z.x=j/2,z.y=K/2)},S=(M,U)=>{if(!H||!_)return;let ne=Math.ceil(l.width/M),le=Math.ceil(l.height/M),fe=[U.pattern,U.levels,U.palette,U.contrast,U.brightness,U.fit,ne,le,l.width,l.height].join("|");if(fe===B)return;B=fe;let[J,oe]=A.uCover.value,ce=H.naturalWidth,pe=H.naturalHeight;W.width=ne,W.height=le,_.imageSmoothingEnabled=!0,_.imageSmoothingQuality="high";let[me,de,Me]=A.uMatte.value;_.fillStyle=`rgb(${me*255}, ${de*255}, ${Me*255})`,_.fillRect(0,0,ne,le);let Q=(.5-.5*J)*ce,ie=(.5-.5*oe)*pe,ee=ne*M/l.width*J*ce,ue=le*M/l.height*oe*pe,ge=Math.max(Q,0),ve=Math.max(ie,0),Re=Math.min(Q+ee,ce),ke=Math.min(ie+ue,pe);Re>ge&&ke>ve&&_.drawImage(H,ge,ve,Re-ge,ke-ve,(ge-Q)/ee*ne,(ve-ie)/ue*le,(Re-ge)/ee*ne,(ke-ve)/ue*le);let xt=li=>Math.pow(Math.min(1,Math.max(0,(li-.5)*U.contrast+.5+U.brightness)),1.6),oi=_.getImageData(0,0,ne,le).data;T.image=Ni(oi,ne,le,Gr[U.pattern],U.levels,U.palette==="rgb",xt),T.width=ne,T.height=le,T.needsUpdate=!0},C=M=>{$=0;let U=n.current;if(!U)return;let ne=Math.min(.05,Math.max(0,(M-Y)/1e3));Y=M;let le=U.wander&&!d,fe=z.x,J=z.y;if(!z.inside&&le){P=Math.min(1,P+ne/1.2);let[ee,ue]=zi(M/1e3,j,K),ge=P*P*(3-2*P);fe+=(ee-fe)*ge,J+=(ue-J)*ge}else P=0;if(ae+=((z.inside||le?1:0)-ae)*(1-Math.exp(-ne/.16)),z.fresh)G.x=G.px=fe,G.y=G.py=J,z.fresh=!1;else{let ee=1-Math.exp(-ne/.035);G.x+=(fe-G.x)*ee,G.y+=(J-G.y)*ee}let oe=A.uBursts.value;oe.fill(0);for(let ee=q.length-1;ee>=0;ee--)(M-q[ee].start)/1e3>=Wr&&q.splice(ee,1);q.forEach((ee,ue)=>{let ge=Math.max(0,(M-ee.start)/1e3/Wr),ve=Math.hypot(Math.max(ee.x,j-ee.x),Math.max(ee.y,K-ee.y))+A.uBurstWidth.value;oe[ue*4]=ee.x,oe[ue*4+1]=ee.y,oe[ue*4+2]=ve*Math.sin(ge*Math.PI/2),oe[ue*4+3]=1-ge*ge*ge}),ae>.002&&(se=M+U.linger*1e3+150);let ce=m?0:1.5/255,pe=U.linger>0?ne/U.linger:1;v.tPrev.value=w[0].texture,v.uFrom.value=[G.px,G.py],v.uTo.value=[G.x,G.y],v.uRadius.value=U.revealRadius*(.45+.55*ae),v.uSoftness.value=U.softness,v.uStrength.value=ae,v.uFade.value=Math.max(pe,ce),A.uBurstWidth.value=Math.max(60,U.revealRadius*.9),f.render({scene:D,target:w[1]}),w.reverse(),G.px=G.x,G.py=G.y;let me=Math.max(1,Math.round(U.pixelSize*f.dpr));H&&(A.uCover.value=Pi(l.width,l.height,H.naturalWidth,H.naturalHeight,U.fit==="contain"));let de=Ii[U.pattern]??0;if(Gr[U.pattern]&&(de=0,H&&!L))try{S(me,U),de=3}catch{L=!0}de===1&&x.width!==64&&(x.image=Di(),x.width=64,x.height=64,x.needsUpdate=!0);let Me=H?A.uCover.value[0]*H.naturalWidth/l.width:1;A.tMask.value=w[0].texture,A.uCell.value=me,A.uLod.value=Math.log2(Math.max(me*Me,1)),A.uPattern.value=de,A.uPalette.value=U.palette==="rgb"?1:0,A.uLevels.value=Math.max(2,Math.round(U.levels)),A.uInk.value=ut(U.inkColor),A.uPaper.value=ut(U.paperColor),A.uRimColor.value=ut(U.rimColor),A.uRim.value=Math.min(Math.max(U.rim,0),.95),A.uContrast.value=U.contrast,A.uBrightness.value=U.brightness,A.uReverse.value=U.reverse?1:0;let Q=H?Math.min(1,(M-b)/ki):0;A.uIntro.value=1-Math.pow(1-Q,2),f.render({scene:R}),(z.inside||le||ae>.002||q.length>0||M<se||H&&Q<1)&&N&&($=requestAnimationFrame(C))},V=()=>{$||!N||(Y=performance.now(),$=requestAnimationFrame(C))};s.current=V;let O=new Image;O.crossOrigin="anonymous",O.decoding="async",O.onload=()=>{H=O,g.image=O;try{if(_){let M=Oi(_,O);A.uMatte.value=M.matte,A.uKey.value=M.plain?1:0}}catch{}b=performance.now(),V()},O.src=a;let I=M=>{let U=o.getBoundingClientRect();z.x=M.clientX-U.left,z.y=M.clientY-U.top,z.placed=!0},re=M=>{I(M),z.inside||(z.inside=!0,z.fresh=!0),V()},he=()=>{z.inside=!1,V()},te=M=>{re(M),!(!n.current?.clickBurst||M.pointerType==="mouse"&&M.button!==0)&&(q.push({x:z.x,y:z.y,start:performance.now()}),q.length>qr&&q.shift())};o.addEventListener("pointermove",re,{passive:!0}),o.addEventListener("pointerenter",re,{passive:!0}),o.addEventListener("pointerdown",te,{passive:!0}),o.addEventListener("pointerleave",he,{passive:!0}),o.addEventListener("pointercancel",he,{passive:!0});let X=new ResizeObserver(()=>{Z(),V()});X.observe(o);let k=new IntersectionObserver(([M])=>{N=M.isIntersecting,V()});return k.observe(o),Z(),V(),()=>{cancelAnimationFrame($),s.current=()=>{},X.disconnect(),k.disconnect(),O.onload=null,o.removeEventListener("pointermove",re),o.removeEventListener("pointerenter",re),o.removeEventListener("pointerdown",te),o.removeEventListener("pointerleave",he),o.removeEventListener("pointercancel",he),u.getExtension("WEBGL_lose_context")?.loseContext(),l.parentNode&&l.parentNode.removeChild(l)}})();return{set(o){Object.assign(r,o),s.current()},destroy(){c&&c()}}}var Xe=Math.PI/2,qi=`#version 300 es
const vec2 corners[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
void main() {
  gl_Position = vec4(corners[gl_VertexID], 0.0, 1.0);
}`,Wi=`#version 300 es
precision highp float;
precision highp int;

uniform vec2 uSize;
uniform float uRatio;
uniform vec2 uCenter;
uniform vec2 uHalf;
uniform float uRadius;
uniform vec3 uParam;
uniform float uPerimeter;
uniform vec4 uCells;
uniform vec2 uSoft;
uniform float uTime;
uniform float uPower;
uniform float uReveal;
uniform vec3 uHover;
uniform float uHoverRadius;
uniform vec4 uPulses[3];
uniform vec3 uCore;
uniform vec3 uGlowColor;
uniform float uIntensity;
uniform float uGlow;
uniform float uThickness;
uniform float uStrands;
uniform float uChaos;
uniform float uSpread;
uniform float uFlicker;
uniform float uInk;
uniform vec4 uArcEnds[4];
uniform vec4 uArcShape[4];

out vec4 fragColor;

uint scramble(uint x) {
  x ^= x >> 16u;
  x *= 0x7feb352du;
  x ^= x >> 15u;
  x *= 0x846ca68bu;
  x ^= x >> 16u;
  return x;
}

vec2 slant(uint x, uint y, uint seed) {
  uint h = scramble(x * 0x8da6b343u + y * 0xd8163841u + seed * 0xcb1ab31fu);
  return vec2(uvec2(h, h >> 8u) & 255u) / 127.5 - 1.0;
}

vec2 ring(vec2 p, float period, uint seed) {
  vec2 i = floor(p);
  vec2 f = p - i;
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float du = 30.0 * f.x * f.x * (f.x * (f.x - 2.0) + 1.0);
  uint x0 = uint(mod(i.x, period));
  uint x1 = uint(mod(i.x + 1.0, period));
  uint y0 = uint(i.y + 65536.0);
  vec2 ga = slant(x0, y0, seed);
  vec2 gb = slant(x1, y0, seed);
  vec2 gc = slant(x0, y0 + 1u, seed);
  vec2 gd = slant(x1, y0 + 1u, seed);
  float va = dot(ga, f);
  float vb = dot(gb, f - vec2(1.0, 0.0));
  float vc = dot(gc, f - vec2(0.0, 1.0));
  float vd = dot(gd, f - vec2(1.0, 1.0));
  float k = va - vb - vc + vd;
  float value = va + u.x * (vb - va) + u.y * (vc - va) + u.x * u.y * k;
  float gx = ga.x + u.x * (gb.x - ga.x) + u.y * (gc.x - ga.x) + u.x * u.y * (ga.x - gb.x - gc.x + gd.x);
  return vec2(value, gx + du * (vb - va + u.y * k));
}

float wobble(float x, uint seed) {
  return ring(vec2(x, 0.5), 1048576.0, seed).x;
}

vec2 frameAt(vec2 p) {
  vec2 inner = max(uHalf - uRadius, 0.0);
  vec2 q = abs(p) - inner;
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
  float quarter = uPerimeter * 0.25;
  vec2 v = abs(p) - uParam.xy;
  float t;
  if (v.x > 0.0 && v.y > 0.0) t = uParam.x + uParam.z * atan(v.x, v.y);
  else if (v.x > v.y) t = uParam.x + 1.5707963 * uParam.z + uParam.y - abs(p.y);
  else t = abs(p.x);
  t = clamp(t, 0.0, quarter);
  float s = p.x >= 0.0 ? (p.y < 0.0 ? t : 2.0 * quarter - t) : (p.y < 0.0 ? 4.0 * quarter - t : 2.0 * quarter + t);
  return vec2(s, d);
}

vec2 glowShape(float line, float spread, float w) {
  float x = abs(line);
  float y = abs(spread);
  return vec2(exp(-x * x / (w * w * 0.5)) + exp(-y / (w * 2.2)) * 0.6, exp(-y / (w * 4.5)) * 0.5);
}

void addArc(vec2 p, vec4 ends, vec4 info, float t, inout vec3 light, inout float energy, inout float hot) {
  if (info.y < 0.002) return;
  vec2 ab = ends.zw - ends.xy;
  float len = max(length(ab), 1.0);
  vec2 dir = ab / len;
  vec2 rel = p - ends.xy;
  float along = dot(rel, dir);
  float side = dot(rel, vec2(-dir.y, dir.x));
  float margin = abs(info.x) + (0.6 + uChaos) * (2.0 + len * 0.08) + uThickness * 12.0 + 10.0;
  if (along < -margin || along > len + margin || abs(side) > margin) return;
  float u = clamp(along / len, 0.0, 1.0);
  float taper = sin(3.14159265 * u);
  float settle = smoothstep(0.0, 0.15, u) * smoothstep(1.0, 0.85, u);
  float bendSlope = 3.14159265 / len * cos(3.14159265 * u) * settle;
  float beyond = max(-along, 0.0) + max(along - len, 0.0);
  for (int c = 0; c < 2; c++) {
    uint seed = uint(info.z * 131.0) + uint(c) * 29u + 7u;
    float jag = 0.0;
    float jagSlope = 0.0;
    float wave = max(len * 0.3, 14.0);
    float weight = (0.6 + uChaos) * (1.5 + len * 0.05) * (c == 0 ? 1.0 : 1.5);
    for (int o = 0; o < 3; o++) {
      vec2 n = ring(vec2(along / wave + info.z * 3.0, t * (1.4 + float(o) * 1.1)), 1048576.0, seed + uint(o));
      jag += n.x * weight;
      jagSlope += n.y * weight / wave;
      wave *= 0.42;
      weight *= 0.4;
    }
    float offset = (info.x + jag) * taper;
    float offsetSlope = (info.x + jag) * bendSlope + jagSlope * taper * settle;
    float across = (side - offset) / sqrt(1.0 + offsetSlope * offsetSlope);
    float gap = length(vec2(beyond, across));
    float w = uThickness * (c == 0 ? 0.9 : 0.6);
    vec2 g = glowShape(gap, gap, w);
    float k = info.y * (c == 0 ? 1.0 : 0.45);
    light += (uCore * g.x + uGlowColor * g.y * uGlow) * k;
    energy += (g.x + g.y * uGlow) * k;
    hot += exp(-gap * gap / (w * w * 0.16)) * k * (c == 0 ? 1.0 : 0.0);
  }
}

void main() {
  vec2 p = vec2(gl_FragCoord.x / uRatio, uSize.y - gl_FragCoord.y / uRatio);
  vec2 frame = frameAt(p - uCenter);
  float s = frame.x;
  float d = frame.y;
  float t = uTime;
  vec3 light = vec3(0.0);
  float energy = 0.0;
  float hot = 0.0;

  float along = min(s, uPerimeter - s);
  float front = uReveal * (uPerimeter * 0.5 + 80.0);
  float shown = smoothstep(front, front - 70.0, along) * uPower;
  float flare = uReveal < 1.0 ? exp(-pow((along - front + 30.0) / 26.0, 2.0)) * uPower : 0.0;

  vec2 toHover = p - uHover.xy;
  float heat = uHover.z * exp(-dot(toHover, toHover) / (uHoverRadius * uHoverRadius));
  float surge = 0.0;
  for (int i = 0; i < 3; i++) {
    vec4 pulse = uPulses[i];
    if (pulse.z <= 0.0) continue;
    float gap = abs(s - pulse.x);
    gap = min(gap, uPerimeter - gap);
    float wave = (gap - pulse.y * 560.0) / 46.0;
    surge += exp(-wave * wave) * pulse.z * exp(-pulse.y * 1.2);
  }
  heat = min(heat * 0.7 + surge * 0.8 + flare * 0.6, 1.2);
  vec2 inset = min(p, uSize - p);
  float frameFade = smoothstep(0.0, 14.0, min(inset.x, inset.y));

  float edge = abs(d);
  float inward = d < 0.0 ? exp(d / 14.0) : 1.0;
  float bloom = (exp(-edge / 3.0) * 0.1 + exp(-edge / 16.0) * 0.05 * inward) * uGlow * (1.0 + heat * 0.6) * shown;
  light += uGlowColor * bloom;
  energy += bloom;

  float bendAmp = uSpread * 16.0 * (1.0 + heat * 0.35);
  float rippleAmp = uSpread * 6.0 * (1.0 + heat * 0.3);
  float crinkleAmp = uChaos * 4.5 * (1.0 + heat * 0.3);
  float squeeze = min(1.0, 34.0 / max((bendAmp + rippleAmp) * 1.6 + crinkleAmp, 1e-3));
  bendAmp *= squeeze;
  rippleAmp *= squeeze;
  crinkleAmp *= squeeze;
  float reach = (bendAmp * 1.9 + rippleAmp + crinkleAmp * 1.6) * 1.3 + uThickness * 14.0 + 8.0;
  if (edge < reach && shown > 0.0) {
    float fade = smoothstep(reach, reach * 0.55, edge);
    float count = min(uStrands + heat * 1.2, 6.0);
    float slopeScale = 1.0 / uPerimeter;
    for (int i = 0; i < 6; i++) {
      float fi = float(i);
      if (fi >= ceil(count)) break;
      float present = clamp(count - fi, 0.0, 1.0);
      uint seed = uint(i) * 7u + 3u;
      float lead = i == 0 ? 1.0 : 0.0;
      float range = mix(1.35 + fi * 0.18, 0.7, lead);
      float x = s * slopeScale;
      vec2 a = ring(vec2(x * uCells.x, t * 0.7 + fi * 3.1), uCells.x, seed);
      vec2 b = ring(vec2(x * uCells.y, t * 1.9 + fi * 1.7), uCells.y, seed + 1u);
      vec2 c = ring(vec2(x * uCells.z, t * 4.6 + fi * 0.9), uCells.z, seed + 2u);
      vec2 e = ring(vec2(x * uCells.w, t * 6.8), uCells.w, seed + 3u);
      float offset = (a.x * bendAmp + b.x * rippleAmp) * range + (c.x + e.x * 0.35) * crinkleAmp;
      float slope =
        ((a.y * uCells.x * bendAmp + b.y * uCells.y * rippleAmp) * range +
          (c.y * uCells.z + e.y * 0.35 * uCells.w) * crinkleAmp) *
        slopeScale;
      float drift = lead > 0.5 ? 0.0 : wobble(fi * 7.3, seed + 9u) * 2.5 * uSpread;
      offset += drift;
      float across = (d - offset) / sqrt(1.0 + slope * slope);
      float spread = d - a.x * bendAmp * range - drift;
      float swell = 0.5 + 0.5 * ring(vec2(x * uSoft.y, t * 2.0 + fi * 5.1), uSoft.y, seed + 8u).x;
      float w = uThickness * mix(0.55, 1.0, lead) * (0.5 + swell);
      float vis = mix(0.3 + 0.45 * smoothstep(-0.25, 0.2, ring(vec2(x * uSoft.x, t * 0.5 + fi * 3.7), uSoft.x, seed + 5u).x), 1.0, lead);
      float spark = 1.0 - uFlicker * 0.3 * (0.5 + 0.5 * wobble(t * 13.0 + fi * 2.3, seed + 6u));
      float weight = max(vis, heat * 0.6) * spark * fade * present * (0.7 + 0.6 * swell);
      vec2 g = glowShape(across, spread, w) * weight;
      g.y *= inward;
      float haze = uGlow * (1.0 + heat * 0.5) * (1.0 - uInk * 0.7);
      light += uCore * g.x + uGlowColor * g.y * haze;
      energy += g.x + g.y * haze;
      hot += exp(-across * across / (w * w * 0.16)) * lead * weight;
    }
    light *= shown;
    energy *= shown;
    hot *= shown;
  }

  for (int i = 0; i < 4; i++) addArc(p, uArcEnds[i], uArcShape[i], t, light, energy, hot);

  float breath = 1.0 + uFlicker * 0.5 * wobble(t * 4.6 + 7.0, 3u);
  float gain = uIntensity * breath * (1.0 + heat * 0.25) * 1.4;
  light *= frameFade;
  energy *= frameFade;
  hot *= frameFade;
  float alpha = 1.0 - exp(-energy * gain);
  vec3 color = mix(1.0 - exp(-light * gain), alpha * light / max(energy, 1e-4), uInk);
  color = mix(color, vec3(alpha), clamp(hot, 0.0, 1.0) * uInk * 0.85);
  float grain = (fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) - 0.5) / 255.0;
  alpha = clamp(alpha + grain, 0.0, 1.0);
  fragColor = vec4(clamp(color + grain, 0.0, alpha), alpha);
}`,Ee=(t,e,r)=>Math.min(r,Math.max(e,t)),mt=t=>{let e=String(t||"").trim(),r=/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(e);if(r){let n=r[1].length===3?r[1].replace(/./g,s=>s+s):r[1];return[0,2,4].map(s=>parseInt(n.slice(s,s+2),16)/255)}let i=/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(e);if(i)return[i[1],i[2],i[3]].map(n=>Ee(parseFloat(n)/255,0,1));if(typeof document<"u"){let n=document.createElement("canvas").getContext("2d");if(n){n.fillStyle="#000000",n.fillStyle=e;let s=String(n.fillStyle);if(s!=="#000000"||/^(#0{3}|#0{6}|black)$/i.test(e))return mt(s)}}return[.49,.98,1]},Yr=(t,e,r)=>{let i=t.createShader(e);return i?(t.shaderSource(i,r),t.compileShader(i),t.getShaderParameter(i,t.COMPILE_STATUS)?i:(console.error(t.getShaderInfoLog(i)),t.deleteShader(i),null)):null},Vi=t=>{let e=Yr(t,t.VERTEX_SHADER,qi),r=Yr(t,t.FRAGMENT_SHADER,Wi),i=e&&r?t.createProgram():null;if(!e||!r||!i)return e&&t.deleteShader(e),r&&t.deleteShader(r),null;if(t.attachShader(i,e),t.attachShader(i,r),t.linkProgram(i),t.deleteShader(e),t.deleteShader(r),!t.getProgramParameter(i,t.LINK_STATUS))return console.error(t.getProgramInfoLog(i)),t.deleteProgram(i),null;let n={},s=t.getProgramParameter(i,t.ACTIVE_UNIFORMS);for(let a=0;a<s;a++){let c=t.getActiveUniform(i,a);c&&(n[c.name.replace(/\[0\]$/,"")]=t.getUniformLocation(i,c.name))}return{program:i,uniforms:n}},De=(t,e,r,i,n)=>{let s=Math.abs(t)-(r-n),a=Math.abs(e)-(i-n);return Math.hypot(Math.max(s,0),Math.max(a,0))+Math.min(Math.max(s,a),0)-n},jr=(t,e,r,i)=>{let n=Math.max(1,t/2+i),s=Math.max(1,e/2+i),a=Ee(r+i,0,Math.min(n,s)),c=Math.min(a+48,Math.min(n,s)),o=n-c,d=s-c,f=o+d+Xe*c;return{hx:n,hy:s,r:a,vr:c,ax:o,ay:d,quarter:f,perimeter:f*4}},pt=(t,e)=>{let{hx:r,hy:i,r:n,vr:s,ax:a,ay:c,quarter:o,perimeter:d}=t,f=(e%d+d)%d,u=Math.min(3,Math.floor(f/o)),l=f-u*o,m=u%2?o-l:l,p,h;if(m<=a)p=m,h=-i;else if(m<=a+Xe*s){let A=s>0?(m-a)/s:0,F=Math.sin(A),D=-Math.cos(A),R=0,W=s+n+2;for(let _=0;_<18;_++){let H=(R+W)/2;De(a+F*H,-c+D*H,r,i,n)<0?R=H:W=H}p=a+F*R,h=-c+D*R}else p=r,h=-c+(m-a-Xe*s);let g=u>=2?-1:1,x=u===1||u===2?-1:1,T=p*g,E=h*x,y=De(T+.5,E,r,i,n)-De(T-.5,E,r,i,n),w=De(T,E+.5,r,i,n)-De(T,E-.5,r,i,n),v=Math.hypot(y,w)||1;return{x:T,y:E,nx:y/v,ny:w/v}},Kr=(t,e,r)=>{let{ax:i,ay:n,vr:s,quarter:a}=t,c=Math.abs(e)-i,o=Math.abs(r)-n,d;return c>0&&o>0?d=i+s*Math.atan2(c,o):c>o?d=i+Xe*s+n-Math.abs(r):d=Math.abs(e),d=Ee(d,0,a),e>=0?r<0?d:2*a-d:r<0?4*a-d:2*a+d},Xi={color:"#7df9ff",glowColor:void 0,speed:1,chaos:.5,spread:.6,thickness:1.5,strands:3,glow:.6,intensity:.8,arcs:1,flicker:.5,borderRadius:24,offset:0,active:!0,intro:!0,interactive:!0,cursorRadius:90,theme:"dark",className:""};function $r(t,e={}){let r={...Xi,...e},i=()=>{let{color:m,glowColor:p,speed:h,chaos:g,spread:x,thickness:T,strands:E,glow:y,intensity:w,arcs:v,flicker:A,borderRadius:F,offset:D,active:R,intro:W,interactive:_,cursorRadius:H,theme:b}=r,B=mt(m);return{core:B.map(j=>j+(1-j)*.55),glowColor:p?mt(p):B,speed:Math.max(0,h),chaos:Ee(g,0,2),spread:Ee(x,0,2),thickness:Math.max(.25,T),strands:Ee(Math.round(E),1,6),glow:Ee(y,0,3),intensity:Math.max(0,w),arcs:Math.max(0,v),flicker:Ee(A,0,1),borderRadius:Math.max(0,F),offset:D,active:R,intro:W,interactive:_,cursorRadius:Math.max(1,H),light:b==="light"}},n={current:t},s=document.createElement("canvas");s.className="electric-border__canvas",s.setAttribute("aria-hidden","true"),s.style.top="-64px",s.style.left="-64px",t.classList.add("electric-border"),t.appendChild(s);let a={current:s},c={current:null},o={current:i()},d=0,f=null,u=()=>{f=(()=>{let m=n.current,p=a.current;if(!m||!p)return;let h=p.getContext("webgl2",{alpha:!0,premultipliedAlpha:!0,antialias:!1,depth:!1,stencil:!1,powerPreference:"default"}),g=h?Vi(h):null;if(!h||!g)return;let x=window.matchMedia("(prefers-reduced-motion: reduce)").matches,T=h.createVertexArray(),E=new Float32Array(16),y=new Float32Array(16),w=new Float32Array(12),v={width:1,height:1,ratio:1},A={x:0,y:0,over:!1,near:!1},F={x:0,y:0,vx:0,vy:0,power:0},D=[],R=[],W=o.current,_=W.active&&!(W.intro&&!x&&d===0)?1:0,H=_,b=W.active,B=W.light?1:0,L=jr(1,1,0,0),j=Math.random()*100,K=0,N=0,$=!0,Y=document.visibilityState!=="hidden",se=!1,ae=()=>{let X=o.current,k=Math.max(1,m.offsetWidth),M=Math.max(1,m.offsetHeight),U=k+128,ne=M+128,le=Math.min(window.devicePixelRatio||1,2,Math.sqrt(3e6/(U*ne))),fe=Math.max(1,Math.round(U*le)),J=Math.max(1,Math.round(ne*le));(p.width!==fe||p.height!==J)&&(p.width=fe,p.height=J),p.style.width=`${U}px`,p.style.height=`${ne}px`,Object.assign(v,{width:k,height:M,ratio:fe/U}),L=jr(k,M,X.borderRadius,X.offset)},P=(X,k)=>{let M=Math.min(L.perimeter*.3,60+Math.random()*90),ne=(k??Math.random()*L.perimeter)-M*(.2+Math.random()*.6),le=ne+M,fe=pt(L,ne),J=pt(L,le),oe=pt(L,(ne+le)/2),ce=J.x-fe.x,pe=J.y-fe.y,me=Math.hypot(ce,pe)||1,de=-pe/me*oe.nx+ce/me*oe.ny,Me=Math.min(34,me*(.14+Math.random()*.16)+5);return{ax:fe.x,ay:fe.y,bx:J.x,by:J.y,bow:de>=0?Me:-Me,seed:1+Math.random()*60,born:X,life:.35+Math.random()*.45}},z=(X,k)=>{let M=g.uniforms,U=v.width+128,ne=v.height+128;h.viewport(0,0,p.width,p.height),h.clearColor(0,0,0,0),h.clear(h.COLOR_BUFFER_BIT),!(_<=.001&&!D.length)&&(h.useProgram(g.program),h.uniform2f(M.uSize,U,ne),h.uniform1f(M.uRatio,v.ratio),h.uniform2f(M.uCenter,U/2,ne/2),h.uniform2f(M.uHalf,L.hx,L.hy),h.uniform1f(M.uRadius,L.r),h.uniform3f(M.uParam,L.ax,L.ay,L.vr),h.uniform1f(M.uPerimeter,L.perimeter),h.uniform4f(M.uCells,Math.max(1,Math.round(L.perimeter/75)),Math.max(2,Math.round(L.perimeter/25)),Math.max(3,Math.round(L.perimeter/9)),Math.max(4,Math.round(L.perimeter/4))),h.uniform2f(M.uSoft,Math.max(1,Math.round(L.perimeter/150)),Math.max(1,Math.round(L.perimeter/50))),h.uniform1f(M.uTime,j),h.uniform1f(M.uPower,_*_*(3-2*_)),h.uniform1f(M.uReveal,H),h.uniform3f(M.uHover,F.x+64,F.y+64,k),h.uniform1f(M.uHoverRadius,X.cursorRadius),h.uniform4fv(M.uPulses,w),h.uniform3fv(M.uCore,X.core),h.uniform3fv(M.uGlowColor,X.glowColor),h.uniform1f(M.uIntensity,X.intensity),h.uniform1f(M.uGlow,X.glow),h.uniform1f(M.uThickness,X.thickness),h.uniform1f(M.uStrands,X.strands),h.uniform1f(M.uChaos,X.chaos),h.uniform1f(M.uSpread,X.spread),h.uniform1f(M.uFlicker,x?0:X.flicker),h.uniform1f(M.uInk,B),h.uniform4fv(M.uArcEnds,E),h.uniform4fv(M.uArcShape,y),h.bindVertexArray(T),h.drawArrays(h.TRIANGLES,0,3))},G=X=>{if(K=0,se)return;let k=o.current,M=Ee((X-N)/1e3||0,0,.05);N=Math.max(N,X);let U=x?.2:1;j+=M*k.speed*U,k.active&&!b&&(H=0),b=k.active,_+=((k.active?1:0)-_)*(1-Math.exp(-M/(k.active?.28:.4))),k.active&&(H=x?1:Math.min(1,H+M/.9)),B+=((k.light?1:0)-B)*(1-Math.exp(-M/.25));let ne=k.interactive&&A.near&&k.active;ne&&F.power<.01&&(F.x=A.x,F.y=A.y,F.vx=0,F.vy=0),F.vx+=((A.x-F.x)*120-F.vx*19)*M,F.vy+=((A.y-F.y)*120-F.vy*19)*M,F.x+=F.vx*M,F.y+=F.vy*M,F.power+=((ne?1:0)-F.power)*(1-Math.exp(-M/(ne?.3:.55)));for(let J=D.length-1;J>=0;J--)j-D[J].born>D[J].life&&D.splice(J,1);if(!x&&k.active&&H>=1&&k.arcs>0&&D.length<4){let J=M*k.speed*k.arcs;Math.random()<J*5*F.power?D.push(P(j,Kr(L,F.x-v.width/2,F.y-v.height/2))):Math.random()<J*(.6+L.perimeter/2400)&&D.push(P(j,null))}let le=_*_*(3-2*_);for(let J=0;J<4;J++){let oe=J*4,ce=D[J];if(!ce){y[oe+1]=0;continue}let pe=Ee((j-ce.born)/ce.life,0,1);E[oe]=ce.ax+v.width/2+64,E[oe+1]=ce.ay+v.height/2+64,E[oe+2]=ce.bx+v.width/2+64,E[oe+3]=ce.by+v.height/2+64,y[oe]=ce.bow,y[oe+1]=Math.sin(Math.PI*pe)*le,y[oe+2]=ce.seed}for(let J=R.length-1;J>=0;J--)X-R[J].born>2200&&R.splice(J,1);for(let J=0;J<3;J++){let oe=J*4,ce=R[J];if(!ce){w[oe+2]=0;continue}w[oe]=ce.s,w[oe+1]=(X-ce.born)/1e3,w[oe+2]=1}z(k,F.power*(k.interactive?1:0)),(_>.002||k.active||D.length>0)&&$&&Y&&(K=requestAnimationFrame(G))},q=()=>{K||se||!$||!Y||(N=performance.now(),K=requestAnimationFrame(G))};c.current=()=>{ae(),q()};let Z=X=>{let k=m.getBoundingClientRect();A.x=X.clientX-k.left,A.y=X.clientY-k.top,A.over=A.x>=0&&A.y>=0&&A.x<=k.width&&A.y<=k.height,A.near=A.x>=-64/2&&A.y>=-64/2&&A.x<=k.width+64/2&&A.y<=k.height+64/2},S=X=>{Z(X),A.near&&q()},C=X=>{Z(X);let k=o.current;if(!A.over||!k.interactive||!k.active||x)return;let M=Kr(L,A.x-v.width/2,A.y-v.height/2);R.push({s:M,born:performance.now()}),R.length>3&&R.shift(),D.length<4&&D.push(P(j,M)),q()},V=()=>{A.over=!1,A.near=!1};window.addEventListener("pointermove",S,{passive:!0}),window.addEventListener("pointerdown",C,{passive:!0}),document.documentElement.addEventListener("pointerleave",V);let O=X=>{X.preventDefault(),se=!0,cancelAnimationFrame(K),K=0},I=()=>l(X=>X+1);p.addEventListener("webglcontextlost",O),p.addEventListener("webglcontextrestored",I);let re=new ResizeObserver(()=>{ae(),q()});re.observe(m);let he=new IntersectionObserver(X=>{$=X.some(k=>k.isIntersecting),q()});he.observe(m);let te=()=>{Y=document.visibilityState!=="hidden",q()};return document.addEventListener("visibilitychange",te),ae(),q(),()=>{cancelAnimationFrame(K),c.current=null,re.disconnect(),he.disconnect(),window.removeEventListener("pointermove",S),window.removeEventListener("pointerdown",C),document.documentElement.removeEventListener("pointerleave",V),document.removeEventListener("visibilitychange",te),p.removeEventListener("webglcontextlost",O),p.removeEventListener("webglcontextrestored",I),h.isContextLost()||(h.deleteVertexArray(T),h.deleteProgram(g.program))}})()},l=m=>{f&&f(),d=m(d),u()};return u(),{set(m){Object.assign(r,m),o.current=i(),c.current?.()},destroy(){f&&f(),f=null;try{s.getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext()}catch{}s.remove(),t.classList.remove("electric-border")}}}var Yi=`#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`,ji=`#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2 uResolution;
uniform float uDpr;
uniform float uScale;
uniform float uTime;
uniform float uBeamX;
uniform vec4 uSurface;
uniform float uRadius;
uniform vec3 uIntro;
uniform vec4 uPour;
uniform vec2 uRun;
uniform vec4 uLens;
uniform sampler2D uReveal;
uniform vec4 uRevealMap;
uniform vec2 uRevealInfo;
uniform float uAtmosphere;
uniform vec4 uAmount;
uniform vec4 uShape;
uniform vec4 uExtra;
uniform float uTheme;
uniform vec3 uTint[16];

#define BEAM uTint[0]
#define LEFT uTint[1]
#define RIGHT uTint[2]
#define CYAN uTint[3]
#define PINK uTint[4]
#define LILAC uTint[5]
#define SKY uTint[6]
#define PURPLE uTint[7]
#define DEEP uTint[8]
#define MIST uTint[9]
#define NAVY uTint[10]
#define WARM uTint[11]
#define EMBER uTint[12]
#define WHITE uTint[13]
#define HAZE uTint[14]
#define LAVENDER uTint[15]

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

float sq(float x) {
  return x * x;
}

float roundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

vec3 spill(float e, float fall, float strength, float front, float t, out vec3 glow) {
  glow = vec3(0.0);
  if (strength < 0.0005) return vec3(0.0);
  float f = max(fall, 0.0);
  float d = max(e, 0.0);
  float u = d / (6.0 + 0.28 * f);
  float start = smoothstep(-6.0, 12.0, fall);
  float fade = exp(-sq(max(f - 125.0, 0.0) / 40.0));
  float streak = 0.88 + 0.24 * noise(vec2(u * 6.0, f / 22.0 - t * 1.7));
  float bright = pow(strength, 1.5);
  float soft = sqrt(strength);
  float warmth = smoothstep(90.0, 130.0, f);
  vec3 coreK = mix(WHITE, WARM, warmth * exp(-d / 9.0));
  float core = mix(9.0, 2.6, warmth) * exp(-sq(d / (3.5 + 0.04 * f))) * exp(-sq(max(f - 130.0, 0.0) / 38.0));
  float wall = 24.0 * exp(-sq(d / 1.1)) * exp(-sq(max(f - 100.0, 0.0) / 30.0));
  float bandCenter = 0.7 - 0.3 * smoothstep(30.0, 110.0, f);
  float offset = u - bandCenter;
  float decay = (1.05 - bandCenter) / 1.31;
  float profile = offset < 0.0 ? exp(-sq(offset / 0.3)) : exp(-offset / decay);
  profile *= 1.0 - smoothstep(1.0, 1.4, u);
  vec3 bandA = mix(CYAN, PINK, smoothstep(50.0, 75.0, f));
  bandA = mix(bandA, LILAC, smoothstep(100.0, 125.0, f));
  vec3 bandB = mix(SKY, PURPLE, smoothstep(50.0, 75.0, f));
  vec3 fanK = mix(bandA, bandB, smoothstep(0.06, 0.18, offset));
  fanK = mix(fanK, DEEP, smoothstep(0.22, 0.42, offset));
  vec3 thread = WHITE * wall * bright + coreK * core * streak * bright;
  glow += fanK * 4.5 * profile * fade * streak * bright;
  glow += MIST * 0.7 * exp(-max(u - 1.0, 0.0) / 0.9) * smoothstep(0.7, 1.2, u) * fade * soft;
  glow += EMBER * 0.35 * exp(-sq((f - 165.0) / 22.0)) * exp(-d / 25.0) * bright;
  float lag = u * (6.0 + 0.28 * f) * 0.35;
  float reveal = 1.0 - smoothstep(front - 70.0, front + 8.0, f + lag);
  glow *= start * reveal;
  return thread * start * reveal;
}

vec3 easeLight(vec3 light, float amount) {
  return -log(max(1.0 - amount * (1.0 - exp(-light)), vec3(0.0001)));
}

void main() {
  vec2 frag = vec2(gl_FragCoord.x, uResolution.y * uDpr - gl_FragCoord.y) / uDpr;
  vec2 p = frag / uScale;
  float t = uTime;
  float bx = uBeamX / uScale;
  float sl = uSurface.x / uScale;
  float sy = uSurface.y / uScale;
  float sr = uSurface.z / uScale;
  float sb = uSurface.w / uScale;
  float radius = uRadius / uScale;
  float dx = p.x - bx;
  float adx = abs(dx);
  float h = sy - p.y;
  float hp = max(h, 0.0);
  float above = smoothstep(-0.5, 0.5, h);
  float side = smoothstep(-24.0, 24.0, dx);
  vec3 sideK = mix(mix(LAVENDER, LEFT, smoothstep(40.0, 140.0, adx)), RIGHT, side);
  float beamWidth = uShape.x;
  float flare = uShape.y;
  float spread = 250.0 * uShape.z;
  float reachL = max(bx - sl, 1.0);
  float reachR = max(sr - bx, 1.0);
  float reach = dx < 0.0 ? reachL : reachR;
  float layerLen = clamp(0.29 * reach, 20.0, 100.0) * sqrt(uShape.z);
  float run = uRun.x;
  float runMask = 1.0 - smoothstep(run - 34.0, run + 6.0, adx);
  float bead = exp(-sq((adx - run + 16.0) / (18.0 + 0.04 * run))) * uRun.y;
  float flowMask = (1.0 - smoothstep(0.75 * spread, 1.1 * spread, adx)) * runMask;
  float edgeMask = (1.0 - smoothstep(0.8 * spread, 1.25 * spread, adx)) * runMask;
  float bloom = uIntro.y;
  vec2 center = vec2((sl + sr) * 0.5, (sy + sb) * 0.5);
  vec2 halfSize = vec2((sr - sl) * 0.5, (sb - sy) * 0.5);
  float sd = roundBox(p - center, halfSize, radius);
  float outline = max(sd, 0.0);
  float below = max(p.y - sy - radius, 0.0);
  float hug = smoothstep(-0.5, 0.5, sd) * exp(-sq(below / 14.0));
  float hugWide = smoothstep(-0.5, 0.5, sd) * exp(-sq(below / 40.0));

  vec3 col = vec3(0.0);

  float breathe = 1.0 + uExtra.x * (0.12 * sin(t * 1.5708) + 0.08 * (noise(vec2(t * 0.5, 3.0)) - 0.5));

  float front = uIntro.x / uScale;
  float drop = smoothstep(front + 10.0, front - 110.0, p.y);
  float falling = 1.0 - smoothstep(sy - 24.0, sy, front);
  float top = mix(0.3, 1.0, smoothstep(0.0, 0.3 * sy, p.y));
  float beamCore = 24.0 * exp(-adx / (2.0 * beamWidth));
  float beamHalo = 1.3 * exp(-adx / (6.0 * beamWidth)) + 0.3 * exp(-adx / (22.0 * beamWidth));
  vec3 haloK = mix(BEAM, sideK, exp(-hp / 80.0));
  col += (BEAM * beamCore + haloK * beamHalo) * top * above * drop;
  float head = exp(-sq((p.y - front) / 24.0)) * falling;
  col += mix(WHITE, BEAM, 0.35) * head * (7.0 * exp(-adx / (2.6 * beamWidth)) + 1.0 * exp(-adx / (14.0 * beamWidth)));

  float psi = adx * (outline + 1.0);
  float rise = max(hp - 17.9 * flare, 0.0);
  float skirtAmp = 16.6 * (exp(-sq(rise / (11.8 * flare))) + 0.3 * exp(-rise / (60.0 * flare)));
  float skirtSpread = mix(134.0, 155.0, side) * breathe * flare * flare * mix(0.35, 1.0, min(bloom, 1.0)) * max(bloom, 1.0);
  float skirt = skirtAmp * exp(-psi / skirtSpread) * exp(-sq(adx / (max(layerLen, 60.0 * sqrt(uShape.z)) * 1.48))) * hug;
  col += sideK * skirt * flowMask * min(bloom, 1.0);

  float layer = 12.0 * exp(-adx / layerLen) * exp(-outline / (0.19 * layerLen)) * (1.0 + 0.4 * bead);
  col += sideK * layer * hug * flowMask * min(bloom, 1.0);
  float washMask = smoothstep(sl - 60.0, sl + 6.0, p.x) * (1.0 - smoothstep(sr - 6.0, sr + 45.0, p.x));
  float wash = 1.4 * exp(-adx / 100.0) * exp(-outline / 30.0);
  col += mix(BEAM, sideK, 0.25) * wash * hugWide * washMask * flowMask * min(bloom, 1.0);
  float highWash = 0.7 * exp(-adx / 140.0) * exp(-outline / 60.0);
  col += mix(BEAM, NAVY, 0.5) * highWash * hugWide * washMask * runMask * min(bloom, 1.0);

  float sideSign = dx < 0.0 ? 0.0 : 1.0;
  float along = 0.5 * log((hp + 1.0) / (adx + 1.0));
  float lineScale = 6.0;
  float lp = log(max(psi, 1.0) / (120.0 * flare * flare)) * lineScale;
  float lineIndex = floor(lp) + sideSign * 97.0;
  float wobble = 0.22 * (noise(vec2(lineIndex * 3.7, t * 0.4 + along)) - 0.5);
  float lf = fract(lp + wobble) - 0.5;
  float gradient = lineScale * length(vec2(hp + 1.0, adx)) / max(psi, 1.0) / uScale;
  float halfWidth = max(0.35 * gradient, 0.0001);
  float drawWidth = max(halfWidth, 0.6 * gradient);
  float lineShape = exp(-lf * lf / (drawWidth * drawWidth)) * (halfWidth / drawWidth);
  float lineOn = step(0.3, hash(vec2(lineIndex, 1.3)));
  float lineFlow = smoothstep(0.25, 0.85, noise(vec2(lineIndex * 5.3 + 2.0, along * 3.0 + t * 1.1)));
  float flareArea = 120.0 * flare * flare;
  float lineEnvelope = smoothstep(0.85 * flareArea, 1.4 * flareArea, psi) * (1.0 - smoothstep(3.2 * flareArea, 7.5 * flareArea, psi));
  lineEnvelope *= exp(-adx / (layerLen * 1.5)) * hug * flowMask * (1.0 - smoothstep(35.0 * flare, 80.0 * flare, hp));
  float lineBright = mix(0.35, 1.0, hash(vec2(lineIndex, 4.0)));
  col += mix(sideK, WHITE, 0.6) * lineShape * lineOn * lineFlow * lineEnvelope * lineBright * 2.6 * uAmount.w * min(bloom, 1.0);

  float edgeGlow = 22.8 * exp(-sq(adx / (150.0 * uShape.z))) * edgeMask * (1.0 + 0.9 * bead);
  float onTop = 1.0 - smoothstep(sy + radius, sy + radius + 10.0, p.y);
  float edgeLine = (exp(-sq(max(sd, 0.0) / 0.9)) + 0.12 * exp(-max(sd, 0.0) / 3.0)) * edgeGlow * onTop;
  col += mix(sideK, WHITE, 0.6) * edgeLine * min(bloom, 1.0);

  float pour = uShape.w;
  float baseline = exp(-sq(130.0 / 150.0));
  float strengthR = exp(-sq(reachR / (150.0 * uShape.z))) * (1.0 - smoothstep(0.8 * spread, 1.25 * spread, reachR)) / baseline * pour;
  float strengthL = exp(-sq(reachL / (150.0 * uShape.z))) * (1.0 - smoothstep(0.8 * spread, 1.25 * spread, reachL)) / baseline * pour;
  float fallY = p.y - sy - 0.3 * radius;
  float rightHalf = smoothstep(center.x - 4.0, center.x + 4.0, p.x);
  float haloR = exp(-length(p - vec2(sr - 0.3 * radius, sy + 0.3 * radius)) / 40.0) * sqrt(strengthR);
  float haloL = exp(-length(p - vec2(sl + 0.3 * radius, sy + 0.3 * radius)) / 40.0) * sqrt(strengthL);
  vec3 glowR;
  vec3 glowL;
  col += spill(sd, fallY, strengthR, uPour.y, t, glowR) * rightHalf;
  col += spill(sd, fallY, strengthL, uPour.x, t, glowL) * (1.0 - rightHalf);
  col += easeLight(glowR * rightHalf + NAVY * 0.9 * haloR, uPour.w);
  col += easeLight(glowL * (1.0 - rightHalf) + NAVY * 0.9 * haloL, uPour.z);

  vec2 toLens = frag - uLens.xy;
  float lens = exp(-dot(toLens, toLens) / sq(uLens.z)) * uLens.w;
  col *= 1.0 + 0.35 * lens * hug;
  float fogAmount = uAmount.y * uAtmosphere;
  float near = exp(-adx / 150.0);
  float envelope = near * (0.3 + 0.4 * exp(-hp / 50.0) + 1.2 * exp(-p.y / 120.0));
  if (fogAmount > 0.001 && h > -2.0 && envelope * max(0.25, 6.0 * exp(-adx / 50.0)) > 0.002) {
    vec2 fq = vec2(dx / 1.7, h) / 85.0 + vec2(t * 0.012, -t * 0.03) + uExtra.zw;
    vec2 fw = vec2(fbm(fq * 1.3 + vec2(1.7, 9.2) + t * 0.03), fbm(fq * 1.3 + vec2(8.3, 2.8) - t * 0.025));
    float cloud = fbm(fq + 1.4 * fw);
    float density = smoothstep(0.5, 0.78, cloud);
    float lit = exp(-adx / 50.0);
    float fogMask = smoothstep(-2.0, 20.0, h);
    float reached = smoothstep(front + 80.0, front - 40.0, p.y);
    vec3 fog = (HAZE * 0.45 + BEAM * 6.0 * lit * reached) * density * envelope * fogMask;
    float surfaceLit = exp(-adx / (layerLen * 1.3)) * exp(-outline / 28.0) * hugWide * flowMask * washMask * min(bloom, 1.0);
    fog += sideK * 2.2 * surfaceLit * (smoothstep(0.38, 0.72, cloud) - 0.35) * fogMask;
    float smoke = smoothstep(0.3, 0.75, cloud);
    fog += BEAM * 0.35 * exp(-adx / (22.0 * beamWidth)) * (0.35 + 0.9 * smoke) * fogMask * top * drop;
    col += fog * fogAmount * (1.0 + 1.2 * lens) * mix(1.0, 0.45, uTheme);
  }

  if (uRevealInfo.y > 0.001 && uLens.w > 0.002) {
    vec2 toReveal = frag - uLens.xy;
    float reveal = exp(-dot(toReveal, toReveal) / sq(uRevealInfo.x)) * uLens.w;
    vec2 uv = frag * uRevealMap.xy + uRevealMap.zw;
    float onImage = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
    vec4 ui = texture(uReveal, uv);
    float ink = max(ui.r, max(ui.g, ui.b)) * onImage;
    float lit = clamp(col.b * 0.9, 0.0, 1.0) * (1.0 - smoothstep(0.9, 2.2, col.b));
    float clearance = smoothstep(60.0 * sqrt(beamWidth), 150.0 * sqrt(beamWidth), adx);
    col += mix(BEAM, WHITE, 0.4) * ink * reveal * lit * clearance * uRevealInfo.y * 2.2;
  }

  float haze = col.b;
  float dotGrid = 1.0 - smoothstep(0.16, 0.32, length(fract(frag / 3.0) - 0.5));
  col += BEAM * dotGrid * clamp(haze, 0.0, 1.5) * (1.0 - smoothstep(1.5, 4.0, haze)) * (0.18 + 0.3 * lens) * uExtra.y;
  if (lens > 0.002) {
    vec2 drift = frag - vec2(0.0, t * 14.0);
    vec2 sparkCell = floor(drift / 7.0);
    vec2 sparkPos = (sparkCell + 0.2 + 0.6 * vec2(hash(sparkCell + 5.1), hash(sparkCell + 2.3))) * 7.0;
    float sparkDist = length(drift - sparkPos);
    float sparkOn = step(0.8, hash(sparkCell + 8.8));
    float sparkTwinkle = 0.5 + 0.5 * sin(t * 5.0 + hash(sparkCell + 3.7) * 6.283);
    col += WHITE * exp(-sparkDist * sparkDist / 0.35) * sparkOn * sparkTwinkle * lens * clamp(haze * 1.5, 0.0, 1.0) * 1.6 * uAmount.z;
  }

  float dustAmount = uAmount.z;
  if (dustAmount > 0.001) {
    float dustLp = log(max(psi, 1.0) / (120.0 * flare * flare)) * 2.2;
    vec2 flowCell = vec2(dustLp / 1.1, (along + t * 0.22) / 0.06);
    vec2 cellId = floor(flowCell) + vec2(sideSign * 131.0, 0.0);
    vec2 cellJitter = vec2(hash(cellId + 1.7), hash(cellId + 8.3));
    vec2 particleFlow = (floor(flowCell) + 0.1 + cellJitter * 0.8) * vec2(1.1, 0.06);
    float particlePsi = 120.0 * flare * flare * exp(particleFlow.x / 2.2);
    float particleAlong = particleFlow.y - t * 0.22;
    float particleX = sqrt(particlePsi * exp(-2.0 * particleAlong)) - 1.0;
    float particleH = sqrt(particlePsi * exp(2.0 * particleAlong)) - 1.0;
    float particleDist = length(vec2(adx - particleX, hp - particleH)) * uScale;
    float particleOn = step(0.62, hash(cellId + 3.1));
    float particleTwinkle = 0.5 + 0.5 * sin(t * 5.0 + hash(cellId + 9.2) * 6.283);
    float dustZone = exp(-sq(log(max(psi, 1.0) / (200.0 * flare * flare)) / 0.55)) * hug * flowMask * smoothstep(0.0, 6.0, outline);
    col += WHITE * exp(-particleDist * particleDist / 0.3) * particleOn * particleTwinkle * dustZone * 3.0 * dustAmount * min(bloom, 1.0);

    vec2 glitterCell = vec2(dx / 3.0, (p.y - t * 26.0) / 9.0);
    vec2 glitterId = floor(glitterCell);
    vec2 glitterJitter = vec2(hash(glitterId + 4.4), hash(glitterId + 2.9));
    vec2 glitterPos = (glitterId + 0.15 + glitterJitter * 0.7) * vec2(3.0, 9.0);
    float glitterDist = length(vec2(dx, p.y - t * 26.0) - glitterPos) * uScale;
    float glitterOn = step(0.7, hash(glitterId + 6.6));
    float glitterTwinkle = 0.5 + 0.5 * sin(t * 6.0 + hash(glitterId + 1.1) * 6.283);
    float glitterZone = exp(-adx / (5.0 * beamWidth)) * smoothstep(1.5, 4.0, adx / beamWidth) * above * smoothstep(25.0, 70.0, hp) * top * drop;
    col += WHITE * exp(-glitterDist * glitterDist / 0.25) * glitterOn * glitterTwinkle * glitterZone * 2.2 * dustAmount * uAtmosphere;
  }

  col *= uAmount.x * (1.0 + uIntro.z * 0.9 * exp(-length(vec2(dx, h * 1.6)) / 70.0));
  col *= smoothstep(-0.75, 0.25, sd * uScale);

  vec3 emit = 1.0 - exp(-col * mix(1.0, 0.6, uTheme));
  float peak = max(emit.r, max(emit.g, emit.b));
  if (uTheme > 0.5) {
    float low = min(emit.r, min(emit.g, emit.b));
    float chroma = peak - low;
    vec3 hue = (emit - low) / max(chroma, 0.0001);
    float alpha = clamp(pow(chroma, 1.35) * 1.3, 0.0, 1.0) * 0.9;
    outColor = vec4((hue * 0.82 + 0.06) * alpha, alpha);
  } else {
    outColor = vec4(emit, peak);
  }
}`,Qr=[[0,1],[-11.5,.77],[9.5,.95],[-53.5,.79],[39.5,.77],[16,.81],[-16.3,.92],[13.3,.96],[3,1.01],[1,.68],[1,1.15],[142.5,.51],[113.6,.28],[-7.5,.13],[-2.7,.32],[7.5,.81]],Zr=.78,Jr=2048,gt=1.25,Ye=5,be=(t,e,r)=>Math.min(r,Math.max(e,t)),Ki=t=>1-Math.pow(1-be(t,0,1),3),$i=t=>{let i=8*Math.sqrt(.6155999999999999);return 1-Math.exp(-.62*8*t)*(Math.cos(i*t)+.62*8/i*Math.sin(i*t))},Qi=([t,e,r])=>{let i=Math.max(t,e,r),n=Math.min(t,e,r),s=i-n,a=0;return s>0&&(i===t?a=(e-r)/s%6:i===e?a=(r-t)/s+2:a=(t-e)/s+4),[(a*60+360)%360,i>0?s/i:0]},Zi=(t,e)=>{let r=(t%360+360)%360/60,i=e,n=i*(1-Math.abs(r%2-1)),s=1-i,[a,c,o]=r<1?[i,n,0]:r<2?[n,i,0]:r<3?[0,i,n]:r<4?[0,n,i]:r<5?[n,0,i]:[i,0,n];return[a+s,c+s,o+s]},ei=t=>{let[e,r]=Qi(t),i=r/Zr,n=new Float32Array(Qr.length*3);return Qr.forEach(([s,a],c)=>{n.set(Zi(e+s,be(Zr*a*i,0,1)),c*3)}),n},ti=(t,e,r)=>{let i=t.createShader(e);return i?(t.shaderSource(i,r),t.compileShader(i),t.getShaderParameter(i,t.COMPILE_STATUS)?i:(t.deleteShader(i),null)):null},Ji=(t,e,r)=>{let i=ti(t,t.VERTEX_SHADER,e),n=ti(t,t.FRAGMENT_SHADER,r),s=t.createProgram();return!i||!n||!s?null:(t.attachShader(s,i),t.attachShader(s,n),t.linkProgram(s),t.deleteShader(i),t.deleteShader(n),t.getProgramParameter(s,t.LINK_STATUS)?s:(t.deleteProgram(s),null))},en=(t,e,r)=>{let i={};for(let n of r)i[n]=t.getUniformLocation(e,n);return i},tn={beamPosition:.6,surfaceLevel:1,color:"#3847ff",intensity:1.8,beamWidth:1.5,flare:1.5,spread:1.5,spill:1,fog:.2,dust:1.6,streaks:1.5,dots:1,pulse:1.5,speed:1.5,seed:3,mouseInteraction:!0,revealImage:void 0,revealRadius:220,revealOpacity:.6,intro:!0,theme:"dark",paused:!1,dpr:void 0};function ri(t,e={}){let r={...tn,...e},i=()=>{let{surfaceRef:f,beamPosition:u,surfaceLevel:l,color:m,intensity:p,beamWidth:h,flare:g,spread:x,spill:T,fog:E,dust:y,streaks:w,dots:v,pulse:A,speed:F,seed:D,mouseInteraction:R,revealImage:W,revealRadius:_,revealOpacity:H,intro:b,theme:B,paused:L,dpr:j}=r;return{surfaceRef:f,beamPosition:be(u,0,1),surfaceLevel:be(l,0,1),color:String(m),intensity:Math.max(0,p),beamWidth:be(h,.2,5),flare:be(g,.2,4),spread:be(x,.1,4),spill:Math.max(0,T),fog:Math.max(0,E),dust:Math.max(0,y),streaks:Math.max(0,w),dots:Math.max(0,v),pulse:Math.max(0,A),speed:F,seed:D,mouseInteraction:R,revealImage:W,revealRadius:Math.max(1,_),revealOpacity:be(H,0,1),intro:b,theme:B,paused:L,dpr:j}},n={current:t},s=document.createElement("canvas");s.className="laser-flow-canvas",s.setAttribute("aria-hidden","true"),t.classList.add("laser-flow-container"),t.appendChild(s);let a={current:s},c={current:null},o={current:i()},d=(()=>{let f=n.current,u=a.current,l=u?.getContext("webgl2",{alpha:!0,premultipliedAlpha:!0,antialias:!1,depth:!1,stencil:!1});if(!f||!u||!l)return;let m=Ji(l,Yi,ji);if(!m)return;let p=en(l,m,["uResolution","uDpr","uScale","uTime","uBeamX","uSurface","uRadius","uIntro","uPour","uRun","uLens","uReveal","uRevealMap","uRevealInfo","uAtmosphere","uAmount","uShape","uExtra","uTheme","uTint"]),h=l.createVertexArray(),g=l.createBuffer();l.bindVertexArray(h),l.bindBuffer(l.ARRAY_BUFFER,g),l.bufferData(l.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),l.STATIC_DRAW);let x=l.getAttribLocation(m,"aPosition");l.enableVertexAttribArray(x),l.vertexAttribPointer(x,2,l.FLOAT,!1,0,0),l.bindVertexArray(null);let T=l.createTexture();l.bindTexture(l.TEXTURE_2D,T),l.texImage2D(l.TEXTURE_2D,0,l.RGBA,1,1,0,l.RGBA,l.UNSIGNED_BYTE,new Uint8Array([0,0,0,0])),l.texParameteri(l.TEXTURE_2D,l.TEXTURE_MIN_FILTER,l.LINEAR),l.texParameteri(l.TEXTURE_2D,l.TEXTURE_MAG_FILTER,l.LINEAR),l.texParameteri(l.TEXTURE_2D,l.TEXTURE_WRAP_S,l.CLAMP_TO_EDGE),l.texParameteri(l.TEXTURE_2D,l.TEXTURE_WRAP_T,l.CLAMP_TO_EDGE);let E=document.createElement("canvas");E.width=1,E.height=1;let y=E.getContext("2d",{willReadFrequently:!0}),w=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches??!1,v={time:0,introTime:o.current.intro&&!w?0:Ye,width:1,height:1,ratio:1,colorKey:"",tints:ei([.22,.28,1]),observed:null,pointer:{x:0,y:0,inside:!1},lens:{x:0,y:0,vx:0,vy:0,strength:0,placed:!1},reveal:{src:"",ready:!1,width:1,height:1,image:null}},A=0,F=0,D=!0,R=!0,W=P=>{if(!y)return[.22,.28,1];y.clearRect(0,0,1,1),y.fillStyle="#3847ff",y.fillStyle=P,y.fillRect(0,0,1,1);let[z,G,q]=y.getImageData(0,0,1,1).data;return[z/255,G/255,q/255]},_=P=>{P.color!==v.colorKey&&(v.colorKey=P.color,v.tints=ei(W(P.color)))},H=P=>{let z=P.revealImage?String(P.revealImage):"",G=v.reveal;if(z===G.src||(G.src=z,G.ready=!1,G.image&&(G.image.onload=null),!z))return;let q=new Image;q.crossOrigin="anonymous",q.decoding="async",q.onload=()=>{if(!R||G.src!==z)return;let Z=q.naturalWidth||q.width||1,S=q.naturalHeight||q.height||1,C=Math.min(1,2048/Math.max(Z,S)),V=document.createElement("canvas");V.width=Math.max(1,Math.round(Z*C)),V.height=Math.max(1,Math.round(S*C)),V.getContext("2d")?.drawImage(q,0,0,V.width,V.height),l.bindTexture(l.TEXTURE_2D,T),l.pixelStorei(l.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!0),l.texImage2D(l.TEXTURE_2D,0,l.RGBA,l.RGBA,l.UNSIGNED_BYTE,V),l.pixelStorei(l.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),G.width=V.width,G.height=V.height,G.ready=!0,c.current?.()},q.src=z,G.image=q},b=(P,z,G)=>{let q=P.surfaceRef?.current??null;if(q!==v.observed&&(v.observed&&se.unobserve(v.observed),q&&se.observe(q),v.observed=q),q){let Z=f.getBoundingClientRect(),S=q.getBoundingClientRect();if(S.width>0){let C=getComputedStyle(q),V=Math.max(parseFloat(C.borderTopLeftRadius)||0,parseFloat(C.borderTopRightRadius)||0);return{left:S.left-Z.left,top:S.top-Z.top,right:S.right-Z.left,bottom:S.bottom-Z.top,radius:Math.min(V,S.width/2,S.height/2),real:!0}}}return{left:-z*2,top:P.surfaceLevel*G,right:z*3,bottom:G*3,radius:0,real:!1}},B=()=>{let P=Math.max(1,f.clientWidth),z=Math.max(1,f.clientHeight),G=o.current,q=Math.min(G.dpr||window.devicePixelRatio||1,2),Z=Math.max(P,z)*q,S=Z>Jr?q*Jr/Z:q,C=Math.max(1,Math.round(P*S)),V=Math.max(1,Math.round(z*S));(u.width!==C||u.height!==V)&&(u.width=C,u.height=V),v.width=P,v.height=z,v.ratio=u.width/P,L()},L=()=>{let P=o.current;_(P);let{width:z,height:G}=v,q=Math.max(.2,Math.min(z/585,G/507)),Z=b(P,z,G),S=P.beamPosition*z;if(Z.real){let ee=Z.radius+6;S>=Z.left&&S<=Z.right?S=be(S,Z.left+ee,Z.right-ee):Z={left:-z*2,top:G,right:z*3,bottom:G*3,radius:0,real:!1}}let C=-.15*G,V=Z.top-C+.3*G,O=v.introTime,I=O>=Ye,re=I?Z.top+.3*G:C+V*Math.pow(be(O/gt,0,1),1.3),he=gt*Math.pow(Math.max(0,Z.top-C)/V,1/1.3),te=O-he,X=I?1:te<=0?0:$i(te),k=I||te<=0?0:Math.exp(-te/.35)*(1-Math.exp(-te/.05)),M=P.spread*250*1.3+80,U=I?1e5:te<=0?-40:M*(1-Math.exp(-1.15*te)),ne=I||te<=0?0:Math.exp(-1.15*te)*(1-Math.exp(-te/.08)),le=ee=>{if(I)return[1e3,1];if(te<=0)return[-ee,0];let ue=Math.min(ee,M*.97),ge=-Math.log(1-ue/M)/1.15,ve=te-ge,Re=be((ve+.15)/.8,0,1),ke=Re*Re*Re*(Re*(Re*6-15)+10);return ve<=0?[U-ue,ke]:[1.15*(M-ue)*ve+260*ve*ve,ke]},[fe,J]=le((S-Z.left)/q),[oe,ce]=le((Z.right-S)/q),pe=I?1:te<=0?.3*Ki(O/gt):.3+.7*(1-Math.exp(-1.3*te)),me=Number(P.seed)||0;l.viewport(0,0,u.width,u.height),l.clearColor(0,0,0,0),l.clear(l.COLOR_BUFFER_BIT),l.useProgram(m),l.uniform2f(p.uResolution,z,G),l.uniform1f(p.uDpr,v.ratio),l.uniform1f(p.uScale,q),l.uniform1f(p.uTime,v.time),l.uniform1f(p.uBeamX,S),l.uniform4f(p.uSurface,Z.left,Z.top,Z.right,Z.bottom),l.uniform1f(p.uRadius,Z.radius),l.uniform3f(p.uIntro,re,X,k),l.uniform4f(p.uPour,fe,oe,J,ce),l.uniform2f(p.uRun,U,ne),l.uniform4f(p.uLens,v.lens.x,v.lens.y,95*q,v.lens.strength),H(P);let{reveal:de}=v,Me=Math.max(z/de.width,G/de.height),Q=de.width*Me,ie=de.height*Me;l.activeTexture(l.TEXTURE0),l.bindTexture(l.TEXTURE_2D,T),l.uniform1i(p.uReveal,0),l.uniform4f(p.uRevealMap,1/Q,1/ie,(Q-z)/2/Q,(ie-G)/2/ie),l.uniform2f(p.uRevealInfo,P.revealRadius,de.ready?P.revealOpacity:0),l.uniform1f(p.uAtmosphere,pe),l.uniform4f(p.uAmount,P.intensity,P.fog,P.dust,P.streaks),l.uniform4f(p.uShape,P.beamWidth,P.flare,P.spread,P.spill),l.uniform4f(p.uExtra,P.pulse,P.dots,34.34+me*7.31,11.58+me*3.17),l.uniform1f(p.uTheme,P.theme==="light"?1:0),l.uniform3fv(p.uTint,v.tints),l.bindVertexArray(h),l.drawArrays(l.TRIANGLES,0,3),l.bindVertexArray(null)},j=P=>{if(A=0,!R||!D||document.hidden)return;let z=o.current,G=F?Math.min(.05,(P-F)/1e3):1/60;F=P;let q=!z.paused&&!w;q&&(v.time+=G*z.speed);let Z=v.introTime<Ye;Z&&(v.introTime=Math.min(Ye,v.introTime+G));let{pointer:S,lens:C}=v,V=z.mouseInteraction&&S.inside&&!w;V&&!C.placed&&(C.x=S.x,C.y=S.y,C.vx=0,C.vy=0,C.placed=!0);let O=120*(S.x-C.x)-19*C.vx,I=120*(S.y-C.y)-19*C.vy;C.vx+=O*G,C.vy+=I*G,C.x+=C.vx*G,C.y+=C.vy*G;let re=V?1:0;C.strength+=(re-C.strength)*(1-Math.exp(-G/(re>C.strength?.3:.55))),C.strength<.001&&!V&&(C.placed=!1),L();let he=Math.abs(v.lens.strength-(z.mouseInteraction&&v.pointer.inside?1:0))>.002||Math.hypot(v.lens.vx,v.lens.vy)>.5;q||Z||he?A=requestAnimationFrame(j):F=0},K=()=>{!A&&R&&D&&!document.hidden&&(A=requestAnimationFrame(j))},N=P=>{let z=f.getBoundingClientRect(),G=P.clientX-z.left,q=P.clientY-z.top;v.pointer.x=G,v.pointer.y=q,v.pointer.inside=G>=0&&q>=0&&G<=z.width&&q<=z.height,K()},$=()=>{v.pointer.inside=!1,K()},Y=()=>{F=0,K()},se=new ResizeObserver(B);se.observe(f);let ae=new IntersectionObserver(P=>{D=P.some(z=>z.isIntersecting),D&&(F=0,K())});return ae.observe(f),window.addEventListener("pointermove",N,{passive:!0}),document.documentElement.addEventListener("pointerleave",$),document.addEventListener("visibilitychange",Y),B(),K(),c.current=()=>{A||L(),K()},()=>{R=!1,cancelAnimationFrame(A),c.current=null,se.disconnect(),ae.disconnect(),window.removeEventListener("pointermove",N),document.documentElement.removeEventListener("pointerleave",$),document.removeEventListener("visibilitychange",Y),l.deleteTexture(T),l.deleteBuffer(g),l.deleteVertexArray(h),l.deleteProgram(m)}})();return{set(f){Object.assign(r,f),o.current=i(),c.current?.()},destroy(){d&&d();try{s.getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext()}catch{}s.remove()}}}var rn=`#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`,nn=`#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform vec3 uMotion;
uniform float uLevel;
uniform vec3 uColors[8];
uniform int uCount;
uniform float uAmplitude;
uniform float uWaviness;
uniform float uThickness;
uniform float uGlow;
uniform float uTaper;
uniform float uSpread;
uniform float uHueShift;
uniform float uIntensity;
uniform float uSaturation;
uniform float uScale;
uniform float uGlass;
uniform float uRadius;
uniform float uRefraction;
uniform float uDispersion;
uniform float uRim;
uniform vec2 uLean;
uniform float uIntro;
uniform float uPulse;
uniform float uLight;
uniform float uOpacity;

out vec4 fragColor;

const int NB = 10;
const float PI = 3.14159265;

vec3 hueRotate(vec3 c, float a) {
  const mat3 toYiq = mat3(0.299, 0.596, 0.211, 0.587, -0.274, -0.523, 0.114, -0.322, 0.312);
  const mat3 toRgb = mat3(1.0, 1.0, 1.0, 0.956, -0.272, -1.106, 0.621, -0.647, 1.703);
  vec3 yiq = toYiq * c;
  float ca = cos(a);
  float sa = sin(a);
  yiq.yz = mat2(ca, sa, -sa, ca) * yiq.yz;
  return max(toRgb * yiq, 0.0);
}

vec3 grade(vec3 c) {
  float g = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = clamp(mix(vec3(g), c, 1.5 * uSaturation), 0.0, 1.0);
  return hueRotate(c, uHueShift * 6.2831853);
}

vec3 lightInk(vec3 L, float halo, vec3 body) {
  vec3 Lg = grade(L);
  float lum = dot(Lg, vec3(0.2126, 0.7152, 0.0722));
  float cov = 1.0 - exp(-lum * 2.6);
  vec3 hue = Lg / max(max(Lg.r, max(Lg.g, Lg.b)), 1e-4);
  float white = pow(clamp(min(hue.r, min(hue.g, hue.b)), 0.0, 1.0), 1.4);
  vec3 ink = pow(hue, vec3(2.2)) * 0.88;
  float coreAmt = white * smoothstep(0.05, 2.2, lum) * 0.92;
  vec3 cream = mix(mix(uColors[3], vec3(1.0), 0.3), vec3(1.0, 0.985, 0.95), smoothstep(1.2, 3.5, lum));
  vec3 c = mix(body, vec3(0.66, 0.69, 0.76), halo * 0.32);
  c = mix(c, ink, cov * (1.0 - white));
  return mix(c, cream, clamp(coreAmt, 0.0, 1.0));
}

float sstep(float a, float b, float x) {
  float t = clamp((x - a) / (b - a), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}

float erfa(float x) {
  float a = abs(x);
  float t = 1.0 / (1.0 + 0.3275911 * a);
  float y = 1.0 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * exp(-a * a);
  return x < 0.0 ? -y : y;
}

vec3 grad4(vec3 c0, vec3 c1, vec3 c2, vec3 c3, float p1, float p2, float f) {
  vec3 c = mix(c0, c1, sstep(0.0, p1, f));
  c = mix(c, c2, sstep(p1, p2, f));
  return mix(c, c3, sstep(p2, 1.0, f));
}

float smaxk(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(a, b, h) + k * h * (1.0 - h);
}

vec2 sheetW(float tt, float H, float sig, float sigB, float ridges) {
  float ew = 0.04 * uThickness;
  float res0;
  float res1;
  for (int pass = 0; pass < 2; pass++) {
    float sg = pass == 0 ? sig : sigB;
    float fill = 0.5 * (erfa(tt / sg) - erfa((tt - H) / sg)) / H;
    float se = sqrt(sg * sg + 0.25 * ew * ew * H * H);
    float de = (tt - H + 0.5 * ew * H) / se;
    float eg = exp(-de * de) / (se * 1.7724539);
    float rgw = sqrt(sg * sg + 0.0025 * H * H);
    float d1 = (tt - 0.45 * H) / rgw;
    float d2 = (tt - 0.241 * H) / rgw;
    float rid = 0.04 * (exp(-d1 * d1) * step(1.5, ridges) + 0.7 * exp(-d2 * d2) * step(2.5, ridges)) / (rgw * 1.7724539);
    float v = 0.6 * fill * (1.0 - 0.55 * uLight) + (1.6 * ew * 0.886 * eg + rid) * (1.0 + 1.3 * uLight);
    if (pass == 0) res0 = v;
    else res1 = v;
  }
  return vec2(res0, res1);
}

float axis(float x) {
  float a = uAmplitude;
  return -0.2318 + uLean.y * 0.06 + (-0.2394 + uLean.x * 0.1) * x + 0.2815 * a * x * x + 0.3368 * a * x * x * x;
}

float softp(float z) {
  return 0.03 * log(1.0 + exp(clamp(z / 0.03, -60.0, 60.0)));
}

vec3 light(vec2 u, float fp, float bend, float level, out float halo) {
  float amp = level < 0.65 ? mix(0.25, 1.0, sstep(0.0, 0.65, level)) : mix(1.0, 1.12, (level - 0.65) / 0.35);
  float grow = clamp((amp - 0.25) / 0.75, 0.0, 1.25);
  float x = u.x / uScale;
  float uy = u.y;
  float ya = axis(x);
  float taper = max(uTaper, 0.05);
  float bx = 0.0437 + uMotion.z + uLean.x * 0.08;
  float bump = exp(-pow((x - bx) / (0.6879 * taper), 2.0));
  float hW = 0.02 + softp(-0.12 + 0.5324 * uAmplitude * grow * uMotion.y * bump - 0.02);
  float k = 1.0 * uWaviness;
  float cphi = cos(0.5 * PI + k * (x + 0.0664) + uMotion.x);
  float envC = (0.0886 + 0.3 * exp(-pow((x - 0.0634) / 0.6873, 2.0))) * uSpread * grow;
  float hC = -envC * tanh(cphi / 0.6);
  float th = 0.051 * uThickness * exp(-pow(cphi / 0.5, 2.0));
  float sig = sqrt(pow(0.005 + 0.05 * bend, 2.0) + fp * fp + th * th);
  float sigB = sqrt(0.0064 * max(uGlow, 0.05) * max(uGlow, 0.05) + fp * fp + th * th);
  float mend = exp(-pow(abs((x + 0.0421) / (0.4235 * taper)), 2.2689));
  vec3 red = uColors[0];
  vec3 orange = uColors[1];
  vec3 amber = uColors[2];
  vec3 warmWhite = uColors[3];
  vec3 cyan = uColors[4];
  vec3 blue = uColors[5];
  vec3 deep = uColors[6];
  vec3 orangeEdge = orange * vec3(1.0, 0.85, 0.77);
  vec3 coolCore = mix(warmWhite, vec3(1.0, 1.0, 0.7), 0.6);
  vec3 mint = clamp(mix(cyan, warmWhite, 0.35) * vec3(0.92, 1.05, 0.95), 0.0, 1.0);
  float ridges = float(uCount);
  float glow = max(uGlow, 0.0);
  vec3 L = vec3(0.0);
  vec3 Lb = vec3(0.0);
  {
    float H = max(abs(hW), 1e-4);
    float tt = uy - ya;
    vec2 w = sheetW(tt, H, sig, sigB, ridges);
    float f = clamp(tt / H, 0.0, 1.0);
    vec3 c = grad4(warmWhite, amber, orange, orangeEdge, 0.2351, 0.5643, f);
    c = mix(c, red, sstep(0.75, 1.0, f) * sstep(0.196, 0.3376, hW));
    vec3 mean = (grad4(warmWhite, amber, orange, orangeEdge, 0.2351, 0.5643, 0.1) + grad4(warmWhite, amber, orange, orangeEdge, 0.2351, 0.5643, 0.35) + grad4(warmWhite, amber, orange, orangeEdge, 0.2351, 0.5643, 0.6) + grad4(warmWhite, amber, orange, orangeEdge, 0.2351, 0.5643, 0.9)) * 0.25;
    L += mix(c, mean, sstep(0.3, 1.2, sig / H)) * (w.x * 0.2101 * mend);
    Lb += mix(c, mean, sstep(0.3, 1.2, sigB / H)) * (w.y * 0.2101 * mend);
  }
  {
    float H = max(abs(hC), 1e-4);
    float tt = (uy - ya) * (hC >= 0.0 ? 1.0 : -1.0);
    vec2 w = sheetW(tt, H, sig, sigB, 1.0);
    float f = clamp(tt / H, 0.0, 1.0);
    vec3 c = grad4(coolCore, cyan, blue, deep, 0.15, 0.7931, f);
    vec3 mean = (grad4(coolCore, cyan, blue, deep, 0.15, 0.7931, 0.1) + grad4(coolCore, cyan, blue, deep, 0.15, 0.7931, 0.35) + grad4(coolCore, cyan, blue, deep, 0.15, 0.7931, 0.6) + grad4(coolCore, cyan, blue, deep, 0.15, 0.7931, 0.9)) * 0.25;
    L += mix(c, mean, sstep(0.3, 1.2, sig / H)) * (w.x * 0.28 * mend);
    Lb += mix(c, mean, sstep(0.3, 1.2, sigB / H)) * (w.y * 0.28 * mend);
  }
  vec3 G = vec3(0.0);
  float wh = sqrt(0.0256 + envC * envC * cphi * cphi);
  float dg = (uy - ya) / wh;
  G += vec3(1.0, 0.97, 0.92) * (exp(-dg * dg) * 0.0315 / wh * mend * glow);
  float nx = -0.0664 - uMotion.x / k + 0.2168;
  float bxx = (x - nx) / 0.1849;
  float byy = (uy - axis(nx) - 0.0333) / (0.0544 * mix(0.7, 1.0, min(amp, 1.0)));
  G += mint * (exp(-bxx * bxx - byy * byy) * 1.4 * glow * sstep(0.0, 0.6, amp));
  float hb = (uy - ya - 0.3 * hW) / (0.07 + 0.45 * hW + 0.3 * envC);
  halo = exp(-hb * hb) * mend * smoothstep(0.0, 0.3, uIntro);
  vec3 total = L + 0.16 * glow * Lb + 1.16 * G;
  return total * 2.4 * uIntensity * smoothstep(0.0, 0.3, uIntro) * sstep(uIntro * 1.6, uIntro * 1.6 - 0.5, abs(x));
}

vec2 remap(vec2 p, float f, out float r, out float bend) {
  r = min(length(p), 0.9995);
  bend = pow(r, 5.17);
  float k = clamp(uRefraction, 0.0, 1.8);
  float sc = (1.0 - 0.278 * k * (1.0 - bend)) * (1.0 - 0.632 * k * bend) / (1.0 - 0.278 * k);
  return p * sc * f;
}

void main() {
  vec2 res = uResolution;
  vec2 p = (gl_FragCoord.xy - 0.5 * res) / min(res.x, res.y);
  float level = clamp(uLevel, 0.0, 1.0);
  float appear = smoothstep(0.0, 0.35, uIntro);

  if (uGlass > 0.5) {
    float R = uRadius * mix(0.94, 1.0, uIntro) * (1.0 + 0.03 * uPulse);
    float px = 1.0 / (min(res.x, res.y) * R);
    vec2 pc = p / R;
    float rho = length(pc);
    if (rho > 1.0 + 2.0 * px) {
      float sh = uLight * 0.07 * exp(-pow((rho - 0.985) / 0.07, 2.0)) * smoothstep(-0.6, 0.4, -pc.y) * appear * uOpacity;
      fragColor = vec4(0.0, 0.0, 0.0, sh);
      return;
    }
    float r;
    float bend;
    vec2 u = remap(pc, 1.0, r, bend);
    float fp = 0.5 * max(length(dFdx(u)), length(dFdy(u)));
    float halo;
    float skip;
    vec3 L = light(u, fp, bend, level, halo);
    float ca = 0.02 * uDispersion * bend;
    if (ca > 0.0015) {
      float r2;
      float b2;
      L.r = light(remap(pc, 1.0 - ca, r2, b2), fp, bend, level, skip).r;
      L.b = light(remap(pc, 1.0 + ca, r2, b2), fp, bend, level, skip).b;
    }
    vec3 col = 1.0 - exp(-L);
    vec2 d = pc / max(rho, 1e-6);
    float key = 0.4 * pow(max(0.0, d.x * 0.94 - d.y * 0.34), 6.0) + 0.2 * pow(max(0.0, -d.x * 0.5 + d.y * 0.87), 6.0);
    float ring = exp(-pow((r - 0.985) / 0.011, 2.0));
    float hzk = 0.25 + 0.7 * pow(max(0.0, -d.x * 0.6 + d.y * 0.8), 2.0) + pow(max(0.0, d.x * 0.8 - d.y * 0.6), 2.0);
    float haze = exp(-pow((1.0 - r) / 0.09, 2.0)) * hzk * 0.13 * uRim;
    vec3 orb;
    if (uLight > 0.5) {
      float lz = dot(d * r, vec2(-0.55, 0.83));
      vec3 body = mix(vec3(0.885, 0.893, 0.915), vec3(0.972, 0.975, 0.983), 0.5 + 0.5 * lz);
      float fres = smoothstep(0.8, 1.0, r);
      body = mix(body, vec3(0.82, 0.83, 0.86), fres * fres * 0.5);
      orb = lightInk(L, halo, body);
      float spec = exp(-pow((r - 0.955) / 0.03, 2.0)) * pow(max(0.0, dot(d, vec2(-0.55, 0.83))), 3.0);
      orb = mix(orb, vec3(1.0), clamp(spec * 0.85 * uRim + haze * 0.6, 0.0, 1.0));
      float edge = exp(-pow((1.0 - r) / (0.01 + 1.2 * px), 2.0));
      orb *= 1.0 - 0.12 * edge;
    } else {
      orb = vec3(0.04) + col * (1.0 + 0.1 * bend * uRim) + ring * key * uRim * (1.0 + 0.4 * level) + haze * vec3(1.0, 1.02, 1.04);
      orb = grade(clamp(orb, 0.0, 1.0));
    }
    float inside = clamp((1.0 - rho) / px + 0.5, 0.0, 1.0) * appear;
    vec3 rgb = orb * inside;
    fragColor = vec4(rgb, max(inside * mix(0.92, 1.0, uLight), max(max(rgb.r, rgb.g), rgb.b))) * uOpacity;
  } else {
    float span = 0.5 * res.x / min(res.x, res.y);
    vec2 u = p * (0.78 / span) + vec2(0.0, -0.15);
    float fp = 0.5 * max(length(dFdx(u)), length(dFdy(u)));
    float halo;
    float fade = sstep(0.82, 0.55, abs(u.x));
    vec3 L = light(u, fp, 0.0, level, halo) * fade;
    vec3 col = grade(1.0 - exp(-L)) * appear;
    if (uLight > 0.5) {
      vec3 c = lightInk(L, halo * fade * 0.6, vec3(1.0));
      float a = clamp(1.0 - min(c.r, min(c.g, c.b)), 0.0, 1.0) * appear;
      fragColor = vec4((c - (1.0 - a)) * appear, a) * uOpacity;
    } else {
      fragColor = vec4(col, max(max(col.r, col.g), col.b)) * uOpacity;
    }
  }
}
`,sn=t=>{let e=String(t).replace("#","").trim();e.length===3&&(e=e.replace(/(.)/g,"$1$1"));let r=parseInt(e.slice(0,6),16);return isFinite(r)?[(r>>16&255)/255,(r>>8&255)/255,(r&255)/255]:[1,1,1]},Se=(t,e,r)=>Math.min(r,Math.max(e,t)),ii=(t,e,r)=>{let i=t.createShader(e);return t.shaderSource(i,r),t.compileShader(i),i},an=t=>{let e=t.createProgram();return t.attachShader(e,ii(t,t.VERTEX_SHADER,rn)),t.attachShader(e,ii(t,t.FRAGMENT_SHADER,nn)),t.bindAttribLocation(e,0,"position"),t.linkProgram(e),t.getProgramParameter(e,t.LINK_STATUS)?e:null},on=(t,e,r)=>{let i=Math.min(1,Math.max(0,(r-t)/(e-t)));return i*i*(3-2*i)},ln=t=>{let e=on(-.8,-.3,.6*Math.sin(t*2.7)+.5*Math.sin(t*1.53+1.2)),r=Math.max(0,Math.sin(t*17+1.6*Math.sin(t*5.3))),i=.6+.4*Math.sin(t*3.7+.7);return e*(.35+.65*r)*(.25+i)},ni=["#d95b56","#ba5046","#ffa24c","#ffe0b3","#93f1ff","#3569fa","#193d9b"],cn={colors:ni,count:3,speed:1,amplitude:1,waviness:1,thickness:1,glow:1,taper:1,spread:1,hueShift:0,intensity:1,saturation:1,opacity:1,scale:1,glass:!0,refraction:1,dispersion:1,glassSize:1,rim:1,energy:.65,listening:!1,level:void 0,interactive:!0,clickPulse:!0,intro:!0,lightMode:!1,maxDevicePixelRatio:2,className:""};function si(t,e={}){let r={...cn,...e},i={current:t},n={current:r};t.classList.add("strands-container");let s=(()=>{let a=i.current;if(!a)return;let c=document.createElement("canvas");c.style.display="block",c.style.width="100%",c.style.height="100%",c.setAttribute("aria-hidden","true");let o=c.getContext("webgl2",{alpha:!0,premultipliedAlpha:!0,antialias:!1});if(!o)return;a.appendChild(c);let d=null,f=null,u={},l=["uResolution","uMotion","uLevel","uColors","uCount","uAmplitude","uWaviness","uThickness","uGlow","uTaper","uSpread","uHueShift","uIntensity","uSaturation","uScale","uGlass","uRadius","uRefraction","uDispersion","uRim","uLean","uIntro","uPulse","uLight","uOpacity"],m=()=>{let b=an(o);return b?(d=b,f=o.createBuffer(),o.bindBuffer(o.ARRAY_BUFFER,f),o.bufferData(o.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),o.STATIC_DRAW),o.enableVertexAttribArray(0),o.vertexAttribPointer(0,2,o.FLOAT,!1,0,0),o.useProgram(b),u=Object.fromEntries(l.map(B=>[B,o.getUniformLocation(b,B)])),o.disable(o.BLEND),o.clearColor(0,0,0,0),!0):!1};if(!m()){c.remove();return}let p=typeof window.matchMedia=="function"?window.matchMedia("(prefers-reduced-motion: reduce)"):null,h={clock:0,pace:0,activity:0,hover:0,hoverTarget:0,burst:0,lean:[0,0],leanTarget:[0,0],pulse:0,pulseV:0,introStart:-1,intro:n.current.intro?0:1,visible:typeof IntersectionObserver>"u",lost:!1,raf:0,last:0,width:0,height:0,speechT:0,paletteKey:"",palette:{flat:new Float32Array(24),count:1}},g=()=>{let b=Math.min(window.devicePixelRatio||1,Math.max(.5,n.current.maxDevicePixelRatio)),B=Math.max(1,Math.round(a.clientWidth*b)),L=Math.max(1,Math.round(a.clientHeight*b));(B!==h.width||L!==h.height)&&(h.width=B,h.height=L,c.width=B,c.height=L)},x=b=>{let B=b.join(",");if(B===h.paletteKey)return;h.paletteKey=B;let L=(b.length?b:ni).slice(0,8).map(sn),j=new Float32Array(24);for(let K=0;K<7;K++){let N=L.length>1?K/6*(L.length-1):0,$=Math.floor(N),Y=Math.min($+1,L.length-1),se=N-$;j.set(L[$].map((ae,P)=>ae+(L[Y][P]-ae)*se),K*3)}h.palette={flat:j,count:7}},T=()=>{if(h.lost||!d)return;let b=n.current;x(Array.isArray(b.colors)?b.colors:[]),o.viewport(0,0,h.width,h.height),o.uniform2f(u.uResolution,h.width,h.height);let B=h.clock,L=.75+.45*h.pace;o.uniform3f(u.uMotion,(.26*Math.sin(.53*B)+.1*Math.sin(1.19*B+1.3))*L,1+(.06*Math.sin(.71*B)+.035*Math.sin(1.37*B+.4))*L,.06*Math.sin(.41*B+2)*L),o.uniform1f(u.uLevel,Se(h.activity,0,1)),o.uniform3fv(u.uColors,h.palette.flat),o.uniform1i(u.uCount,Se(Math.round(b.count),1,3)),o.uniform1f(u.uAmplitude,b.amplitude),o.uniform1f(u.uWaviness,b.waviness),o.uniform1f(u.uThickness,b.thickness),o.uniform1f(u.uGlow,b.glow),o.uniform1f(u.uTaper,Math.max(.05,b.taper)),o.uniform1f(u.uSpread,b.spread),o.uniform1f(u.uHueShift,b.hueShift),o.uniform1f(u.uIntensity,b.intensity),o.uniform1f(u.uSaturation,b.saturation),o.uniform1f(u.uScale,Math.max(.05,b.scale)),o.uniform1f(u.uGlass,b.glass?1:0),o.uniform1f(u.uRadius,.42*b.glassSize),o.uniform1f(u.uRefraction,b.refraction),o.uniform1f(u.uDispersion,b.dispersion),o.uniform1f(u.uRim,b.rim),o.uniform2f(u.uLean,h.lean[0],h.lean[1]),o.uniform1f(u.uIntro,h.intro),o.uniform1f(u.uPulse,h.pulse),o.uniform1f(u.uLight,b.lightMode?1:0),o.uniform1f(u.uOpacity,b.opacity),o.clear(o.COLOR_BUFFER_BIT),o.drawArrays(o.TRIANGLES,0,3)},E=b=>{h.raf=0;let B=n.current,L=h.last?Se((b-h.last)/1e3,0,.05):0;h.last=b;let j=!!p?.matches;if(h.introStart<0&&h.visible&&(h.introStart=b),B.intro&&!j&&h.introStart>=0){let Y=Se((b-h.introStart)/1400,0,1);h.intro=1-Math.pow(1-Y,3)}else h.intro=1;h.hover+=(h.hoverTarget-h.hover)*(1-Math.exp(-L/(h.hoverTarget>h.hover?.25:.6)));for(let Y=0;Y<2;Y++)h.lean[Y]+=(h.leanTarget[Y]-h.lean[Y])*(1-Math.exp(-L/.35));h.pulseV+=(-170*h.pulse-14*h.pulseV)*L,h.pulse+=h.pulseV*L,h.burst*=Math.exp(-L/.45),B.listening&&!j&&(h.speechT+=L);let K=typeof B.level=="number"?Se(B.level,0,1):B.listening&&!j?ln(h.speechT):0,N=Math.min(1.2,Math.max(Se(B.energy,0,1),K)+h.hover*.18+h.burst);h.activity+=(N-h.activity)*(1-Math.exp(-L/(N>h.activity?.12:.4))),h.pace+=(Math.min(1,h.activity)-h.pace)*(1-Math.exp(-L/.8)),j||(h.clock+=L*B.speed*(.6+1.6*h.pace)),T();let $=j&&Math.abs(h.activity-N)<.001&&Math.abs(h.pulse)<.001&&Math.abs(h.pulseV)<.001&&h.burst<.001&&Math.abs(h.hover-h.hoverTarget)<.001&&Math.abs(h.lean[0]-h.leanTarget[0])<.001&&Math.abs(h.lean[1]-h.leanTarget[1])<.001;h.visible&&!document.hidden&&!h.lost&&!$&&(h.raf=requestAnimationFrame(E))},y=()=>{!h.raf&&h.visible&&!h.lost&&(h.last=0,h.raf=requestAnimationFrame(E))},w=b=>{let B=a.getBoundingClientRect(),L=Math.min(B.width,B.height)||1;return[(b.clientX-B.left-B.width/2)/(L/2),(b.clientY-B.top-B.height/2)/(L/2)]},v=b=>{if(!n.current.interactive)return;let[B,L]=w(b);h.hoverTarget=Se(1.6-Math.hypot(B,L),0,1),h.leanTarget=[Se(B,-1.2,1.2)*.8,Se(-L,-1.2,1.2)*.8],y()},A=()=>{h.hoverTarget=0,h.leanTarget=[0,0],y()},F=()=>{n.current.clickPulse&&(h.pulseV+=5,h.burst=Math.min(1.2,h.burst+.9),y())},D=b=>{b.preventDefault(),h.lost=!0,h.raf&&cancelAnimationFrame(h.raf),h.raf=0},R=()=>{h.lost=!1,m()&&y()};c.addEventListener("webglcontextlost",D),c.addEventListener("webglcontextrestored",R),a.addEventListener("pointermove",v),a.addEventListener("pointerleave",A),a.addEventListener("pointerdown",F);let W=new ResizeObserver(()=>{g(),T()});W.observe(a),g();let _=null;typeof IntersectionObserver<"u"&&(_=new IntersectionObserver(b=>{h.visible=b[b.length-1].isIntersecting,h.visible&&y()}),_.observe(a));let H=()=>{document.hidden||y()};return document.addEventListener("visibilitychange",H),y(),()=>{h.raf&&cancelAnimationFrame(h.raf),c.removeEventListener("webglcontextlost",D),c.removeEventListener("webglcontextrestored",R),a.removeEventListener("pointermove",v),a.removeEventListener("pointerleave",A),a.removeEventListener("pointerdown",F),document.removeEventListener("visibilitychange",H),W.disconnect(),_?.disconnect(),d&&o.deleteProgram(d),f&&o.deleteBuffer(f),o.getExtension("WEBGL_lose_context")?.loseContext(),c.remove()}})();return{set(a){Object.assign(r,a)},destroy(){s&&s()}}}var hn=`#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`,fn=`#version 300 es
precision highp float;
precision highp int;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uFocal;
uniform vec2 uRotation;
uniform float uGloss;
uniform float uDepth;
uniform float uDensity;
uniform float uHueShift;
uniform float uSpeed;
uniform vec2 uMouse;
uniform float uStarGlow;
uniform float uFlareGain;
uniform float uSquash;
uniform float uSaturation;
uniform float uMouseRepulsion;
uniform float uTwinkleIntensity;
uniform float uRotationAngle;
uniform float uRepulsionStrength;
uniform float uMouseActiveFactor;
uniform float uAutoCenterRepulsion;
uniform int uLayers;
uniform vec3 uColors[4];
uniform int uColorCount;
uniform float uWarp;
uniform float uReveal;
uniform float uMode;
uniform vec3 uBackground;
uniform float uOpacity;
out vec4 outColor;

#define STAR_COLOR_CUTOFF 0.2
#define MAT45 mat2(0.7071, -0.7071, 0.7071, 0.7071)
#define PERIOD 3.0

float Hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float tri(float x) {
  return abs(fract(x) * 2.0 - 1.0);
}

float tris(float x) {
  float t = fract(x);
  return 1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0));
}

float trisn(float x) {
  float t = fract(x);
  return 2.0 * (1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0))) - 1.0;
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float Star(vec2 uv, float flare, vec2 radial, float invReach) {
#ifdef WARP
  float along = dot(uv, radial);
  float d = sqrt(max(dot(uv, uv) - uSquash * along * along, 0.0));
#else
  float d = length(uv);
#endif
  float m = uStarGlow / d;
  float rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * flare * uFlareGain;
  uv *= MAT45;
  rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * 0.3 * flare * uFlareGain;
  m *= smoothstep(1.0, 0.2, d * invReach);
#ifdef WARP
  m *= mix(1.0, smoothstep(1.0, 0.55, length(uv) * invReach), min(uWarp * 4.0, 1.0));
#endif
  return m;
}

vec3 StarLayer(vec2 uv, vec2 radial, vec2 repelAt, float pushCells, float spread) {
  vec3 col = vec3(0.0);
  vec2 gv = fract(uv) - 0.5;
  vec2 id = floor(uv);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y));
      vec2 si = id + offset;
      float seed = Hash21(si);
      float size = fract(seed * 345.32);
      float glossLocal = tri(uGloss / (PERIOD * seed + 1.0));
      float flareSize = smoothstep(0.9, 1.0, size) * glossLocal;

#ifdef PALETTE
      float pick = Hash21(si + 7.0) * float(uColorCount);
      vec3 base = uColors[int(min(floor(pick), float(uColorCount - 1)))];
#else
      float red = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 1.0)) + STAR_COLOR_CUTOFF;
      float blu = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 3.0)) + STAR_COLOR_CUTOFF;
      float grn = min(red, blu) * seed;
      vec3 base = vec3(red, grn, blu);
      float hue = atan(base.g - base.r, base.b - base.r) / (2.0 * 3.14159) + 0.5;
      hue = fract(hue + uHueShift / 360.0);
      float sat = length(base - vec3(dot(base, vec3(0.299, 0.587, 0.114)))) * uSaturation;
      float val = max(max(base.r, base.g), base.b);
      base = hsv2rgb(vec3(hue, sat, val));
#endif

      vec2 pad = vec2(tris(seed * 34.0 + uTime * uSpeed / 10.0), tris(seed * 38.0 + uTime * uSpeed / 30.0)) - 0.5;
      vec2 shift = vec2(0.0);
      float invReach = 1.0;
#ifdef REPEL
      vec2 away = si + 0.5 + pad - repelAt;
      float dist = length(away);
      float q = dist * spread;
      float cells = pushCells * exp(-q * q);
      float moved = cells * inversesqrt(1.0 + cells * cells * 2.78);
      shift = away * (moved / max(dist, 0.0001));
      invReach = 1.0 / (1.0 - moved);
#endif
      float star = Star(gv - offset - pad - shift, flareSize, radial, invReach);
      float twinkle = trisn(uTime * uSpeed + seed * 6.2831) * 0.5 + 1.0;
      twinkle = mix(1.0, twinkle, uTwinkleIntensity);
      col += star * twinkle * size * base;
    }
  }
  return col;
}

void main() {
  vec2 focalPx = uFocal * uResolution;
  vec2 uv = (gl_FragCoord.xy - focalPx) / uResolution.y;
  vec2 mouseNorm = uMouse - vec2(0.5);

  vec2 repelAt = vec2(0.0);
  float strength = 0.0;
  float push = 0.0;
  if (uAutoCenterRepulsion > 0.0) {
    strength = uAutoCenterRepulsion;
    push = strength * 0.05;
  } else if (uMouseRepulsion > 0.5) {
    repelAt = (uMouse * uResolution - focalPx) / uResolution.y;
    strength = max(uRepulsionStrength, 0.0);
    push = strength * 0.05 * uMouseActiveFactor;
  } else {
    uv += mouseNorm * 0.1 * uMouseActiveFactor;
  }
  float radius = 0.16 + 0.04 * strength;

  vec2 radial = length(uv) > 0.0001 ? normalize(uv) : vec2(1.0, 0.0);
  float angle = uRotationAngle;
  uv = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * uv;
  uv = mat2(uRotation.x, -uRotation.y, uRotation.y, uRotation.x) * uv;
  radial = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * radial;
  radial = mat2(uRotation.x, -uRotation.y, uRotation.y, uRotation.x) * radial;
  repelAt = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * repelAt;
  repelAt = mat2(uRotation.x, -uRotation.y, uRotation.y, uRotation.x) * repelAt;

  vec3 col = vec3(0.0);
  float layers = float(uLayers);
  for (int k = 0; k < 8; k++) {
    if (k >= uLayers) break;
    float i = float(k) / layers;
    float depth = fract(i + uDepth);
    float scale = mix(20.0 * uDensity, 0.5 * uDensity, depth);
    float fade = depth * smoothstep(1.0, 0.9, depth);
    vec2 offset = vec2(i * 453.32);
    col += StarLayer(uv * scale + offset, radial, repelAt * scale + offset, push * scale, 1.0 / (scale * radius)) * fade;
  }
  col *= uReveal;

  if (uMode > 1.5) {
    vec3 lit = col * smoothstep(0.0, 0.3, length(col));
    float energy = max(max(lit.r, lit.g), lit.b);
    vec3 tint = lit / max(energy, 0.0001);
    vec3 ink = tint * (0.16 / max(dot(tint, vec3(0.2126, 0.7152, 0.0722)), 0.16));
    float coverage = pow(min(energy * 1.3, 1.0), 1.3) * 0.92 * uOpacity;
    outColor = uMode > 2.5 ? vec4(ink * coverage, coverage) : vec4(mix(uBackground, ink, coverage), 1.0);
  } else if (uMode > 0.5) {
    float alpha = min(smoothstep(0.0, 0.3, length(col)), 1.0) * uOpacity;
    outColor = vec4(col * alpha, alpha);
  } else {
    outColor = vec4(mix(uBackground, col, uOpacity), 1.0);
  }
}`,je=(t,e,r)=>Math.min(r,Math.max(e,t)),un=(t,e,r)=>(t?4:0)+(e?2:0)+(r?1:0),dn=(t,e,r,i)=>{let n=`${e?`#define PALETTE
`:""}${r?`#define REPEL
`:""}${i?`#define WARP
`:""}`,s=t.createProgram(),a=t.createShader(t.VERTEX_SHADER),c=t.createShader(t.FRAGMENT_SHADER);return!s||!a||!c?null:(t.shaderSource(a,hn),t.shaderSource(c,fn.replace(`
`,`
${n}`)),t.compileShader(a),t.compileShader(c),t.attachShader(s,a),t.attachShader(s,c),t.bindAttribLocation(s,0,"aPosition"),t.linkProgram(s),t.deleteShader(a),t.deleteShader(c),s)},pn=(t,e)=>{if(!t.getProgramParameter(e,t.LINK_STATUS))return null;let r={},i=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let n=0;n<i;n++){let s=t.getActiveUniform(e,n);s&&(r[s.name.replace("[0]","")]=t.getUniformLocation(e,s.name))}return{program:e,uniforms:r}},mn={focal:[.5,.5],rotation:[1,0],starSpeed:.5,density:1,hueShift:140,disableAnimation:!1,speed:1,mouseInteraction:!0,glowIntensity:.3,saturation:0,mouseRepulsion:!0,repulsionStrength:2,twinkleIntensity:.3,rotationSpeed:.1,autoCenterRepulsion:0,transparent:!0,lightMode:!1,starColors:void 0,starSize:1,flareIntensity:1,layers:4,direction:"forward",clickWarp:!0,intro:!0,backgroundColor:void 0,opacity:1,dpr:void 0,className:""};function ai(t,e={}){let r={...mn,...e},i=()=>{let{focal:f,rotation:u,starSpeed:l,density:m,hueShift:p,disableAnimation:h,speed:g,mouseInteraction:x,glowIntensity:T,saturation:E,mouseRepulsion:y,repulsionStrength:w,twinkleIntensity:v,rotationSpeed:A,autoCenterRepulsion:F,transparent:D,lightMode:R,starColors:W,starSize:_,flareIntensity:H,layers:b,direction:B,clickWarp:L,intro:j,backgroundColor:K,opacity:N,dpr:$,className:Y}=r,se=Array.isArray(W)?W.filter(Boolean).slice(0,4):[];return{focal:Array.isArray(f)?f:[.5,.5],rotation:Array.isArray(u)?u:[1,0],starSpeed:l,density:Math.max(.01,m),hueShift:p,disableAnimation:h,speed:g,mouseInteraction:x,glowIntensity:Math.max(0,T),saturation:Math.max(0,E),mouseRepulsion:y,repulsionStrength:w,twinkleIntensity:je(v,0,1),rotationSpeed:A,autoCenterRepulsion:Math.max(0,F),transparent:D,lightMode:R,palette:se,starSize:Math.max(0,_),flareIntensity:Math.max(0,H),layers:je(Math.round(b),2,8),reverse:B==="backward",clickWarp:L,intro:j,backgroundColor:K,opacity:je(N,0,1),dpr:$}},n={current:t},s=document.createElement("canvas");s.className="galaxy-canvas",s.setAttribute("aria-hidden","true"),t.classList.add("galaxy-container"),t.appendChild(s);let a={current:s},c={current:null},o={current:i()},d=(()=>{let f=n.current,u=a.current,l=u?.getContext("webgl2",{alpha:!0,premultipliedAlpha:!0,antialias:!1,depth:!1,stencil:!1});if(!f||!u||!l)return;let m=l.getExtension("KHR_parallel_shader_compile"),p=new Map,h=(S,C,V)=>{let O=un(S,C,V),I=p.get(O);return I||(I={program:dn(l,S,C,V),linked:null,done:!1},p.set(O,I)),I},g=(S,C,V,O)=>{let I=h(S,C,V);if(!I.done&&I.program){if(!O&&m&&!l.getProgramParameter(I.program,m.COMPLETION_STATUS_KHR))return null;I.linked=pn(l,I.program),I.done=!0}return I.linked},x=o.current;if(!g(x.palette.length>0,!1,!1,!0)){p.forEach(S=>S.program&&l.deleteProgram(S.program));return}let T=l.createBuffer(),E=l.createVertexArray();l.bindVertexArray(E),l.bindBuffer(l.ARRAY_BUFFER,T),l.bufferData(l.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),l.STATIC_DRAW),l.enableVertexAttribArray(0),l.vertexAttribPointer(0,2,l.FLOAT,!1,0,0);let y=document.createElement("canvas").getContext("2d",{willReadFrequently:!0}),w=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches??!1,v=new Map,A=(S,C)=>{if(!S)return C;let V=String(S);if(v.has(V))return v.get(V);let O=C;if(y){y.clearRect(0,0,1,1),y.fillStyle="#000000",y.fillStyle=V,y.fillRect(0,0,1,1);let[I,re,he]=y.getImageData(0,0,1,1).data;O=[I/255,re/255,he/255]}return v.set(V,O),O},F=new Float32Array(12),D={x:.5,y:.5,inside:!1},R={time:0,gloss:0,depth:0,angle:0,mx:.5,my:.5,active:0,boost:0,reveal:o.current.intro&&!w?0:1},W=0,_=0,H=!0,b=()=>{let S=o.current;S.palette.forEach((ne,le)=>F.set(A(ne,[1,1,1]),le*3));let C=S.lightMode?S.transparent?3:2:S.transparent?1:0,V=A(S.backgroundColor,S.lightMode?[1,1,1]:[0,0,0]),O=R.reveal,I=S.palette.length>0,re=S.autoCenterRepulsion>0||S.mouseRepulsion&&S.repulsionStrength>0&&R.active>0,he=R.boost>0,te=g(I,!1,!1,!0);if(!te)return;let X=(re||he?g(I,re,he,!1):null)??te,k=X.uniforms;l.viewport(0,0,u.width,u.height),l.useProgram(X.program),l.bindVertexArray(E),l.uniform1f(k.uTime,R.time),l.uniform2f(k.uResolution,u.width,u.height),l.uniform2f(k.uFocal,S.focal[0],S.focal[1]),l.uniform2f(k.uRotation,S.rotation[0],S.rotation[1]),l.uniform1f(k.uGloss,R.gloss),l.uniform1f(k.uDepth,R.depth),l.uniform1f(k.uDensity,S.density),l.uniform1f(k.uHueShift,S.hueShift),l.uniform1f(k.uSpeed,S.speed),l.uniform2f(k.uMouse,R.mx,R.my);let M=1+R.boost*5;l.uniform1f(k.uStarGlow,.05*S.glowIntensity*S.starSize/Math.pow(M,.6)),l.uniform1f(k.uFlareGain,S.glowIntensity*S.flareIntensity),l.uniform1f(k.uSquash,1-1/(M*M)),l.uniform1f(k.uSaturation,S.saturation),l.uniform1f(k.uMouseRepulsion,S.mouseRepulsion?1:0),l.uniform1f(k.uTwinkleIntensity,S.twinkleIntensity),l.uniform1f(k.uRotationAngle,R.angle),l.uniform1f(k.uRepulsionStrength,S.repulsionStrength),l.uniform1f(k.uMouseActiveFactor,R.active),l.uniform1f(k.uAutoCenterRepulsion,S.autoCenterRepulsion),l.uniform1i(k.uLayers,S.layers),l.uniform3fv(k.uColors,F),l.uniform1i(k.uColorCount,S.palette.length),l.uniform1f(k.uWarp,R.boost);let U=Math.min(1,O/.35);l.uniform1f(k.uReveal,U*U*(3-2*U)),l.uniform1f(k.uMode,C),l.uniform3fv(k.uBackground,V),l.uniform1f(k.uOpacity,S.opacity),l.drawArrays(l.TRIANGLES,0,3)},B=S=>{if(W=0,!H||document.hidden)return;let C=o.current,V=_?je((S-_)/1e3,5e-4,.05):1/60;_=S;let O=C.disableAnimation||w?0:1;C.intro&&!w&&R.reveal<1?(R.reveal=Math.min(1,R.reveal+V/2.2),R.boost=Math.max(R.boost,Math.pow(1-R.reveal,2)*1.4)):(!C.intro||w)&&(R.reveal=1);let I=C.starSpeed/10*(C.reverse?-1:1);R.time+=V*O,R.gloss+=V*I*O,R.depth+=V*I*C.speed*O*(1+R.boost*14),R.angle+=V*C.rotationSpeed*O,R.boost*=Math.exp(-V*1.3),R.boost<.001&&(R.boost=0);let re=1-Math.exp(-V/.325),he=C.mouseInteraction&&D.inside&&!w;he&&(R.mx+=(D.x-R.mx)*re,R.my+=(D.y-R.my)*re);let te=he?1:0;R.active+=(te-R.active)*re,Math.abs(te-R.active)<.001&&(R.active=te),b(),O>0||R.boost>0||R.active!==te||R.reveal<1?W=requestAnimationFrame(B):_=0},L=()=>{!W&&H&&!document.hidden&&(W=requestAnimationFrame(B))},j=()=>{let S=o.current,C=Math.max(1,f.clientWidth),V=Math.max(1,f.clientHeight),O=Math.min(S.dpr||window.devicePixelRatio||1,2);u.width=Math.max(1,Math.round(C*O)),u.height=Math.max(1,Math.round(V*O)),b(),L()},K=S=>{let C=f.getBoundingClientRect(),V=S.clientX-C.left,O=S.clientY-C.top;D.inside=V>=0&&O>=0&&V<=C.width&&O<=C.height,D.x=V/Math.max(1,C.width),D.y=1-O/Math.max(1,C.height)},N=S=>{K(S),L()},$=S=>{let C=o.current;K(S),!(!D.inside||!C.clickWarp||w)&&(R.boost=Math.min(1.6,R.boost+1),L())},Y=S=>{S.pointerType!=="mouse"&&(D.inside=!1)},se=()=>{D.inside=!1},ae=()=>{_=0,L()},P=new ResizeObserver(j);P.observe(f);let z=new IntersectionObserver(S=>{H=S.some(C=>C.isIntersecting),H&&(_=0,L())});z.observe(f),window.addEventListener("pointermove",N,{passive:!0}),window.addEventListener("pointerdown",$,{passive:!0}),window.addEventListener("pointerup",Y,{passive:!0}),window.addEventListener("pointercancel",Y,{passive:!0}),document.documentElement.addEventListener("pointerleave",se),document.addEventListener("visibilitychange",ae),j();let G=x.autoCenterRepulsion>0||x.mouseInteraction&&x.mouseRepulsion,q=x.palette.length>0;(x.clickWarp||x.intro)&&h(q,!1,!0),G&&h(q,!0,!1),G&&x.clickWarp&&h(q,!0,!0);let Z=o.current.dpr;return c.current=()=>{let S=o.current;if(S.dpr!==Z){Z=S.dpr,j();return}W||b(),L()},()=>{cancelAnimationFrame(W),c.current=null,P.disconnect(),z.disconnect(),window.removeEventListener("pointermove",N),window.removeEventListener("pointerdown",$),window.removeEventListener("pointerup",Y),window.removeEventListener("pointercancel",Y),document.documentElement.removeEventListener("pointerleave",se),document.removeEventListener("visibilitychange",ae),p.forEach(S=>S.program&&l.deleteProgram(S.program)),l.deleteBuffer(T),l.deleteVertexArray(E),l.getExtension("WEBGL_lose_context")?.loseContext()}})();return{set(f){Object.assign(r,f),o.current=i(),c.current?.()},destroy(){d&&d(),s.remove()}}}window.NovaUI=window.NovaUI||{};Object.assign(window.NovaUI,{electricLogo:Br,ditherVeil:Xr,electricBorder:$r,laserFlow:ri,strands:si,galaxy:ai});})();
