/* Nova WebGL ports of React Bits components (ElectricLogo, DitherVeil, ElectricBorder, LaserFlow, Strands),
   each turned from a React component into NovaUI.<name>(container, props) -> { set, destroy }. Bundles ogl 1.0.11 (Unlicense). */
(()=>{function Le(t){let e=t[0],r=t[1],i=t[2];return Math.sqrt(e*e+r*r+i*i)}function Ue(t,e){return t[0]=e[0],t[1]=e[1],t[2]=e[2],t}function xt(t,e,r,i){return t[0]=e,t[1]=r,t[2]=i,t}function je(t,e,r){return t[0]=e[0]+r[0],t[1]=e[1]+r[1],t[2]=e[2]+r[2],t}function Ke(t,e,r){return t[0]=e[0]-r[0],t[1]=e[1]-r[1],t[2]=e[2]-r[2],t}function vt(t,e,r){return t[0]=e[0]*r[0],t[1]=e[1]*r[1],t[2]=e[2]*r[2],t}function yt(t,e,r){return t[0]=e[0]/r[0],t[1]=e[1]/r[1],t[2]=e[2]/r[2],t}function Oe(t,e,r){return t[0]=e[0]*r,t[1]=e[1]*r,t[2]=e[2]*r,t}function wt(t,e){let r=e[0]-t[0],i=e[1]-t[1],s=e[2]-t[2];return Math.sqrt(r*r+i*i+s*s)}function Mt(t,e){let r=e[0]-t[0],i=e[1]-t[1],s=e[2]-t[2];return r*r+i*i+s*s}function Qe(t){let e=t[0],r=t[1],i=t[2];return e*e+r*r+i*i}function bt(t,e){return t[0]=-e[0],t[1]=-e[1],t[2]=-e[2],t}function Et(t,e){return t[0]=1/e[0],t[1]=1/e[1],t[2]=1/e[2],t}function Be(t,e){let r=e[0],i=e[1],s=e[2],n=r*r+i*i+s*s;return n>0&&(n=1/Math.sqrt(n)),t[0]=e[0]*n,t[1]=e[1]*n,t[2]=e[2]*n,t}function $e(t,e){return t[0]*e[0]+t[1]*e[1]+t[2]*e[2]}function Ze(t,e,r){let i=e[0],s=e[1],n=e[2],a=r[0],h=r[1],o=r[2];return t[0]=s*o-n*h,t[1]=n*a-i*o,t[2]=i*h-s*a,t}function At(t,e,r,i){let s=e[0],n=e[1],a=e[2];return t[0]=s+i*(r[0]-s),t[1]=n+i*(r[1]-n),t[2]=a+i*(r[2]-a),t}function Rt(t,e,r,i,s){let n=Math.exp(-i*s),a=e[0],h=e[1],o=e[2];return t[0]=r[0]+(a-r[0])*n,t[1]=r[1]+(h-r[1])*n,t[2]=r[2]+(o-r[2])*n,t}function Tt(t,e,r){let i=e[0],s=e[1],n=e[2],a=r[3]*i+r[7]*s+r[11]*n+r[15];return a=a||1,t[0]=(r[0]*i+r[4]*s+r[8]*n+r[12])/a,t[1]=(r[1]*i+r[5]*s+r[9]*n+r[13])/a,t[2]=(r[2]*i+r[6]*s+r[10]*n+r[14])/a,t}function St(t,e,r){let i=e[0],s=e[1],n=e[2],a=r[3]*i+r[7]*s+r[11]*n+r[15];return a=a||1,t[0]=(r[0]*i+r[4]*s+r[8]*n)/a,t[1]=(r[1]*i+r[5]*s+r[9]*n)/a,t[2]=(r[2]*i+r[6]*s+r[10]*n)/a,t}function Ft(t,e,r){let i=e[0],s=e[1],n=e[2];return t[0]=i*r[0]+s*r[3]+n*r[6],t[1]=i*r[1]+s*r[4]+n*r[7],t[2]=i*r[2]+s*r[5]+n*r[8],t}function Lt(t,e,r){let i=e[0],s=e[1],n=e[2],a=r[0],h=r[1],o=r[2],u=r[3],f=h*n-o*s,d=o*i-a*n,c=a*s-h*i,p=h*c-o*d,m=o*f-a*c,l=a*d-h*f,g=u*2;return f*=g,d*=g,c*=g,p*=2,m*=2,l*=2,t[0]=i+f+p,t[1]=s+d+m,t[2]=n+c+l,t}var _t=(function(){let t=[0,0,0],e=[0,0,0];return function(r,i){Ue(t,r),Ue(e,i),Be(t,t),Be(e,e);let s=$e(t,e);return s>1?0:s<-1?Math.PI:Math.acos(s)}})();function Ct(t,e){return t[0]===e[0]&&t[1]===e[1]&&t[2]===e[2]}var xe=class t extends Array{constructor(e=0,r=e,i=e){return super(e,r,i),this}get x(){return this[0]}get y(){return this[1]}get z(){return this[2]}set x(e){this[0]=e}set y(e){this[1]=e}set z(e){this[2]=e}set(e,r=e,i=e){return e.length?this.copy(e):(xt(this,e,r,i),this)}copy(e){return Ue(this,e),this}add(e,r){return r?je(this,e,r):je(this,this,e),this}sub(e,r){return r?Ke(this,e,r):Ke(this,this,e),this}multiply(e){return e.length?vt(this,this,e):Oe(this,this,e),this}divide(e){return e.length?yt(this,this,e):Oe(this,this,1/e),this}inverse(e=this){return Et(this,e),this}len(){return Le(this)}distance(e){return e?wt(this,e):Le(this)}squaredLen(){return Qe(this)}squaredDistance(e){return e?Mt(this,e):Qe(this)}negate(e=this){return bt(this,e),this}cross(e,r){return r?Ze(this,e,r):Ze(this,this,e),this}scale(e){return Oe(this,this,e),this}normalize(){return Be(this,this),this}dot(e){return $e(this,e)}equals(e){return Ct(this,e)}applyMatrix3(e){return Ft(this,this,e),this}applyMatrix4(e){return Tt(this,this,e),this}scaleRotateMatrix4(e){return St(this,this,e),this}applyQuaternion(e){return Lt(this,this,e),this}angle(e){return _t(this,e)}lerp(e,r){return At(this,this,e,r),this}smoothLerp(e,r,i){return Rt(this,this,e,r,i),this}clone(){return new t(this[0],this[1],this[2])}fromArray(e,r=0){return this[0]=e[r],this[1]=e[r+1],this[2]=e[r+2],this}toArray(e=[],r=0){return e[r]=this[0],e[r+1]=this[1],e[r+2]=this[2],e}transformDirection(e){let r=this[0],i=this[1],s=this[2];return this[0]=e[0]*r+e[4]*i+e[8]*s,this[1]=e[1]*r+e[5]*i+e[9]*s,this[2]=e[2]*r+e[6]*i+e[10]*s,this.normalize()}};var kt=new xe,oi=1,li=1,Pt=!1,Ge=class{constructor(e,r={}){e.canvas||console.error("gl not passed as first argument to Geometry"),this.gl=e,this.attributes=r,this.id=oi++,this.VAOs={},this.drawRange={start:0,count:0},this.instancedCount=0,this.gl.renderer.bindVertexArray(null),this.gl.renderer.currentGeometry=null,this.glState=this.gl.renderer.state;for(let i in r)this.addAttribute(i,r[i])}addAttribute(e,r){if(this.attributes[e]=r,r.id=li++,r.size=r.size||1,r.type=r.type||(r.data.constructor===Float32Array?this.gl.FLOAT:r.data.constructor===Uint16Array?this.gl.UNSIGNED_SHORT:this.gl.UNSIGNED_INT),r.target=e==="index"?this.gl.ELEMENT_ARRAY_BUFFER:this.gl.ARRAY_BUFFER,r.normalized=r.normalized||!1,r.stride=r.stride||0,r.offset=r.offset||0,r.count=r.count||(r.stride?r.data.byteLength/r.stride:r.data.length/r.size),r.divisor=r.instanced||0,r.needsUpdate=!1,r.usage=r.usage||this.gl.STATIC_DRAW,r.buffer||this.updateAttribute(r),r.divisor){if(this.isInstanced=!0,this.instancedCount&&this.instancedCount!==r.count*r.divisor)return console.warn("geometry has multiple instanced buffers of different length"),this.instancedCount=Math.min(this.instancedCount,r.count*r.divisor);this.instancedCount=r.count*r.divisor}else e==="index"?this.drawRange.count=r.count:this.attributes.index||(this.drawRange.count=Math.max(this.drawRange.count,r.count))}updateAttribute(e){let r=!e.buffer;r&&(e.buffer=this.gl.createBuffer()),this.glState.boundBuffer!==e.buffer&&(this.gl.bindBuffer(e.target,e.buffer),this.glState.boundBuffer=e.buffer),r?this.gl.bufferData(e.target,e.data,e.usage):this.gl.bufferSubData(e.target,0,e.data),e.needsUpdate=!1}setIndex(e){this.addAttribute("index",e)}setDrawRange(e,r){this.drawRange.start=e,this.drawRange.count=r}setInstancedCount(e){this.instancedCount=e}createVAO(e){this.VAOs[e.attributeOrder]=this.gl.renderer.createVertexArray(),this.gl.renderer.bindVertexArray(this.VAOs[e.attributeOrder]),this.bindAttributes(e)}bindAttributes(e){e.attributeLocations.forEach((r,{name:i,type:s})=>{if(!this.attributes[i]){console.warn(`active attribute ${i} not being supplied`);return}let n=this.attributes[i];this.gl.bindBuffer(n.target,n.buffer),this.glState.boundBuffer=n.buffer;let a=1;s===35674&&(a=2),s===35675&&(a=3),s===35676&&(a=4);let h=n.size/a,o=a===1?0:a*a*4,u=a===1?0:a*4;for(let f=0;f<a;f++)this.gl.vertexAttribPointer(r+f,h,n.type,n.normalized,n.stride+o,n.offset+f*u),this.gl.enableVertexAttribArray(r+f),this.gl.renderer.vertexAttribDivisor(r+f,n.divisor)}),this.attributes.index&&this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER,this.attributes.index.buffer)}draw({program:e,mode:r=this.gl.TRIANGLES}){this.gl.renderer.currentGeometry!==`${this.id}_${e.attributeOrder}`&&(this.VAOs[e.attributeOrder]||this.createVAO(e),this.gl.renderer.bindVertexArray(this.VAOs[e.attributeOrder]),this.gl.renderer.currentGeometry=`${this.id}_${e.attributeOrder}`),e.attributeLocations.forEach((s,{name:n})=>{let a=this.attributes[n];a.needsUpdate&&this.updateAttribute(a)});let i=2;this.attributes.index?.type===this.gl.UNSIGNED_INT&&(i=4),this.isInstanced?this.attributes.index?this.gl.renderer.drawElementsInstanced(r,this.drawRange.count,this.attributes.index.type,this.attributes.index.offset+this.drawRange.start*i,this.instancedCount):this.gl.renderer.drawArraysInstanced(r,this.drawRange.start,this.drawRange.count,this.instancedCount):this.attributes.index?this.gl.drawElements(r,this.drawRange.count,this.attributes.index.type,this.attributes.index.offset+this.drawRange.start*i):this.gl.drawArrays(r,this.drawRange.start,this.drawRange.count)}getPosition(){let e=this.attributes.position;if(e.data)return e;if(!Pt)return console.warn("No position buffer data found to compute bounds"),Pt=!0}computeBoundingBox(e){e||(e=this.getPosition());let r=e.data,i=e.size;this.bounds||(this.bounds={min:new xe,max:new xe,center:new xe,scale:new xe,radius:1/0});let s=this.bounds.min,n=this.bounds.max,a=this.bounds.center,h=this.bounds.scale;s.set(1/0),n.set(-1/0);for(let o=0,u=r.length;o<u;o+=i){let f=r[o],d=r[o+1],c=r[o+2];s.x=Math.min(f,s.x),s.y=Math.min(d,s.y),s.z=Math.min(c,s.z),n.x=Math.max(f,n.x),n.y=Math.max(d,n.y),n.z=Math.max(c,n.z)}h.sub(n,s),a.add(s,n).divide(2)}computeBoundingSphere(e){e||(e=this.getPosition());let r=e.data,i=e.size;this.bounds||this.computeBoundingBox(e);let s=0;for(let n=0,a=r.length;n<a;n+=i)kt.fromArray(r,n),s=Math.max(s,this.bounds.center.squaredDistance(kt));this.bounds.radius=Math.sqrt(s)}remove(){for(let e in this.VAOs)this.gl.renderer.deleteVertexArray(this.VAOs[e]),delete this.VAOs[e];for(let e in this.attributes)this.gl.deleteBuffer(this.attributes[e].buffer),delete this.attributes[e]}};var hi=1,zt={},_e=class{constructor(e,{vertex:r,fragment:i,uniforms:s={},transparent:n=!1,cullFace:a=e.BACK,frontFace:h=e.CCW,depthTest:o=!0,depthWrite:u=!0,depthFunc:f=e.LEQUAL}={}){e.canvas||console.error("gl not passed as first argument to Program"),this.gl=e,this.uniforms=s,this.id=hi++,r||console.warn("vertex shader not supplied"),i||console.warn("fragment shader not supplied"),this.transparent=n,this.cullFace=a,this.frontFace=h,this.depthTest=o,this.depthWrite=u,this.depthFunc=f,this.blendFunc={},this.blendEquation={},this.stencilFunc={},this.stencilOp={},this.transparent&&!this.blendFunc.src&&(this.gl.renderer.premultipliedAlpha?this.setBlendFunc(this.gl.ONE,this.gl.ONE_MINUS_SRC_ALPHA):this.setBlendFunc(this.gl.SRC_ALPHA,this.gl.ONE_MINUS_SRC_ALPHA)),this.vertexShader=e.createShader(e.VERTEX_SHADER),this.fragmentShader=e.createShader(e.FRAGMENT_SHADER),this.program=e.createProgram(),e.attachShader(this.program,this.vertexShader),e.attachShader(this.program,this.fragmentShader),this.setShaders({vertex:r,fragment:i})}setShaders({vertex:e,fragment:r}){if(e&&(this.gl.shaderSource(this.vertexShader,e),this.gl.compileShader(this.vertexShader),this.gl.getShaderInfoLog(this.vertexShader)!==""&&console.warn(`${this.gl.getShaderInfoLog(this.vertexShader)}
Vertex Shader
${Dt(e)}`)),r&&(this.gl.shaderSource(this.fragmentShader,r),this.gl.compileShader(this.fragmentShader),this.gl.getShaderInfoLog(this.fragmentShader)!==""&&console.warn(`${this.gl.getShaderInfoLog(this.fragmentShader)}
Fragment Shader
${Dt(r)}`)),this.gl.linkProgram(this.program),!this.gl.getProgramParameter(this.program,this.gl.LINK_STATUS))return console.warn(this.gl.getProgramInfoLog(this.program));this.uniformLocations=new Map;let i=this.gl.getProgramParameter(this.program,this.gl.ACTIVE_UNIFORMS);for(let a=0;a<i;a++){let h=this.gl.getActiveUniform(this.program,a);this.uniformLocations.set(h,this.gl.getUniformLocation(this.program,h.name));let o=h.name.match(/(\w+)/g);h.uniformName=o[0],h.nameComponents=o.slice(1)}this.attributeLocations=new Map;let s=[],n=this.gl.getProgramParameter(this.program,this.gl.ACTIVE_ATTRIBUTES);for(let a=0;a<n;a++){let h=this.gl.getActiveAttrib(this.program,a),o=this.gl.getAttribLocation(this.program,h.name);o!==-1&&(s[o]=h.name,this.attributeLocations.set(h,o))}this.attributeOrder=s.join("")}setBlendFunc(e,r,i,s){this.blendFunc.src=e,this.blendFunc.dst=r,this.blendFunc.srcAlpha=i,this.blendFunc.dstAlpha=s,e&&(this.transparent=!0)}setBlendEquation(e,r){this.blendEquation.modeRGB=e,this.blendEquation.modeAlpha=r}setStencilFunc(e,r,i){this.stencilRef=r,this.stencilFunc.func=e,this.stencilFunc.ref=r,this.stencilFunc.mask=i}setStencilOp(e,r,i){this.stencilOp.stencilFail=e,this.stencilOp.depthFail=r,this.stencilOp.depthPass=i}applyState(){this.depthTest?this.gl.renderer.enable(this.gl.DEPTH_TEST):this.gl.renderer.disable(this.gl.DEPTH_TEST),this.cullFace?this.gl.renderer.enable(this.gl.CULL_FACE):this.gl.renderer.disable(this.gl.CULL_FACE),this.blendFunc.src?this.gl.renderer.enable(this.gl.BLEND):this.gl.renderer.disable(this.gl.BLEND),this.cullFace&&this.gl.renderer.setCullFace(this.cullFace),this.gl.renderer.setFrontFace(this.frontFace),this.gl.renderer.setDepthMask(this.depthWrite),this.gl.renderer.setDepthFunc(this.depthFunc),this.blendFunc.src&&this.gl.renderer.setBlendFunc(this.blendFunc.src,this.blendFunc.dst,this.blendFunc.srcAlpha,this.blendFunc.dstAlpha),this.gl.renderer.setBlendEquation(this.blendEquation.modeRGB,this.blendEquation.modeAlpha),this.stencilFunc.func||this.stencilOp.stencilFail?this.gl.renderer.enable(this.gl.STENCIL_TEST):this.gl.renderer.disable(this.gl.STENCIL_TEST),this.gl.renderer.setStencilFunc(this.stencilFunc.func,this.stencilFunc.ref,this.stencilFunc.mask),this.gl.renderer.setStencilOp(this.stencilOp.stencilFail,this.stencilOp.depthFail,this.stencilOp.depthPass)}use({flipFaces:e=!1}={}){let r=-1;this.gl.renderer.state.currentProgram===this.id||(this.gl.useProgram(this.program),this.gl.renderer.state.currentProgram=this.id),this.uniformLocations.forEach((s,n)=>{let a=this.uniforms[n.uniformName];for(let h of n.nameComponents){if(!a)break;if(h in a)a=a[h];else{if(Array.isArray(a.value))break;a=void 0;break}}if(!a)return Nt(`Active uniform ${n.name} has not been supplied`);if(a&&a.value===void 0)return Nt(`${n.name} uniform is missing a value parameter`);if(a.value.texture)return r=r+1,a.value.update(r),Je(this.gl,n.type,s,r);if(a.value.length&&a.value[0].texture){let h=[];return a.value.forEach(o=>{r=r+1,o.update(r),h.push(r)}),Je(this.gl,n.type,s,h)}Je(this.gl,n.type,s,a.value)}),this.applyState(),e&&this.gl.renderer.setFrontFace(this.frontFace===this.gl.CCW?this.gl.CW:this.gl.CCW)}remove(){this.gl.deleteProgram(this.program)}};function Je(t,e,r,i){i=i.length?ci(i):i;let s=t.renderer.state.uniformLocations.get(r);if(i.length)if(s===void 0||s.length!==i.length)t.renderer.state.uniformLocations.set(r,i.slice(0));else{if(fi(s,i))return;s.set?s.set(i):ui(s,i),t.renderer.state.uniformLocations.set(r,s)}else{if(s===i)return;t.renderer.state.uniformLocations.set(r,i)}switch(e){case 5126:return i.length?t.uniform1fv(r,i):t.uniform1f(r,i);case 35664:return t.uniform2fv(r,i);case 35665:return t.uniform3fv(r,i);case 35666:return t.uniform4fv(r,i);case 35670:case 5124:case 35678:case 36306:case 35680:case 36289:return i.length?t.uniform1iv(r,i):t.uniform1i(r,i);case 35671:case 35667:return t.uniform2iv(r,i);case 35672:case 35668:return t.uniform3iv(r,i);case 35673:case 35669:return t.uniform4iv(r,i);case 35674:return t.uniformMatrix2fv(r,!1,i);case 35675:return t.uniformMatrix3fv(r,!1,i);case 35676:return t.uniformMatrix4fv(r,!1,i)}}function Dt(t){let e=t.split(`
`);for(let r=0;r<e.length;r++)e[r]=r+1+": "+e[r];return e.join(`
`)}function ci(t){let e=t.length,r=t[0].length;if(r===void 0)return t;let i=e*r,s=zt[i];s||(zt[i]=s=new Float32Array(i));for(let n=0;n<e;n++)s.set(t[n],n*r);return s}function fi(t,e){if(t.length!==e.length)return!1;for(let r=0,i=t.length;r<i;r++)if(t[r]!==e[r])return!1;return!0}function ui(t,e){for(let r=0,i=t.length;r<i;r++)t[r]=e[r]}var et=0;function Nt(t){et>100||(console.warn(t),et++,et>100&&console.warn("More than 100 program warnings - stopping logs."))}var tt=new xe,di=1,Ce=class{constructor({canvas:e=document.createElement("canvas"),width:r=300,height:i=150,dpr:s=1,alpha:n=!1,depth:a=!0,stencil:h=!1,antialias:o=!1,premultipliedAlpha:u=!1,preserveDrawingBuffer:f=!1,powerPreference:d="default",autoClear:c=!0,webgl:p=2}={}){let m={alpha:n,depth:a,stencil:h,antialias:o,premultipliedAlpha:u,preserveDrawingBuffer:f,powerPreference:d};this.dpr=s,this.alpha=n,this.color=!0,this.depth=a,this.stencil=h,this.premultipliedAlpha=u,this.autoClear=c,this.id=di++,p===2&&(this.gl=e.getContext("webgl2",m)),this.isWebgl2=!!this.gl,this.gl||(this.gl=e.getContext("webgl",m)),this.gl||console.error("unable to create webgl context"),this.gl.renderer=this,this.setSize(r,i),this.state={},this.state.blendFunc={src:this.gl.ONE,dst:this.gl.ZERO},this.state.blendEquation={modeRGB:this.gl.FUNC_ADD},this.state.cullFace=!1,this.state.frontFace=this.gl.CCW,this.state.depthMask=!0,this.state.depthFunc=this.gl.LEQUAL,this.state.premultiplyAlpha=!1,this.state.flipY=!1,this.state.unpackAlignment=4,this.state.framebuffer=null,this.state.viewport={x:0,y:0,width:null,height:null},this.state.textureUnits=[],this.state.activeTextureUnit=0,this.state.boundBuffer=null,this.state.uniformLocations=new Map,this.state.currentProgram=null,this.extensions={},this.isWebgl2?(this.getExtension("EXT_color_buffer_float"),this.getExtension("OES_texture_float_linear")):(this.getExtension("OES_texture_float"),this.getExtension("OES_texture_float_linear"),this.getExtension("OES_texture_half_float"),this.getExtension("OES_texture_half_float_linear"),this.getExtension("OES_element_index_uint"),this.getExtension("OES_standard_derivatives"),this.getExtension("EXT_sRGB"),this.getExtension("WEBGL_depth_texture"),this.getExtension("WEBGL_draw_buffers")),this.getExtension("WEBGL_compressed_texture_astc"),this.getExtension("EXT_texture_compression_bptc"),this.getExtension("WEBGL_compressed_texture_s3tc"),this.getExtension("WEBGL_compressed_texture_etc1"),this.getExtension("WEBGL_compressed_texture_pvrtc"),this.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc"),this.vertexAttribDivisor=this.getExtension("ANGLE_instanced_arrays","vertexAttribDivisor","vertexAttribDivisorANGLE"),this.drawArraysInstanced=this.getExtension("ANGLE_instanced_arrays","drawArraysInstanced","drawArraysInstancedANGLE"),this.drawElementsInstanced=this.getExtension("ANGLE_instanced_arrays","drawElementsInstanced","drawElementsInstancedANGLE"),this.createVertexArray=this.getExtension("OES_vertex_array_object","createVertexArray","createVertexArrayOES"),this.bindVertexArray=this.getExtension("OES_vertex_array_object","bindVertexArray","bindVertexArrayOES"),this.deleteVertexArray=this.getExtension("OES_vertex_array_object","deleteVertexArray","deleteVertexArrayOES"),this.drawBuffers=this.getExtension("WEBGL_draw_buffers","drawBuffers","drawBuffersWEBGL"),this.parameters={},this.parameters.maxTextureUnits=this.gl.getParameter(this.gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),this.parameters.maxAnisotropy=this.getExtension("EXT_texture_filter_anisotropic")?this.gl.getParameter(this.getExtension("EXT_texture_filter_anisotropic").MAX_TEXTURE_MAX_ANISOTROPY_EXT):0}setSize(e,r){this.width=e,this.height=r,this.gl.canvas.width=e*this.dpr,this.gl.canvas.height=r*this.dpr,this.gl.canvas.style&&Object.assign(this.gl.canvas.style,{width:e+"px",height:r+"px"})}setViewport(e,r,i=0,s=0){this.state.viewport.width===e&&this.state.viewport.height===r||(this.state.viewport.width=e,this.state.viewport.height=r,this.state.viewport.x=i,this.state.viewport.y=s,this.gl.viewport(i,s,e,r))}setScissor(e,r,i=0,s=0){this.gl.scissor(i,s,e,r)}enable(e){this.state[e]!==!0&&(this.gl.enable(e),this.state[e]=!0)}disable(e){this.state[e]!==!1&&(this.gl.disable(e),this.state[e]=!1)}setBlendFunc(e,r,i,s){this.state.blendFunc.src===e&&this.state.blendFunc.dst===r&&this.state.blendFunc.srcAlpha===i&&this.state.blendFunc.dstAlpha===s||(this.state.blendFunc.src=e,this.state.blendFunc.dst=r,this.state.blendFunc.srcAlpha=i,this.state.blendFunc.dstAlpha=s,i!==void 0?this.gl.blendFuncSeparate(e,r,i,s):this.gl.blendFunc(e,r))}setBlendEquation(e,r){e=e||this.gl.FUNC_ADD,!(this.state.blendEquation.modeRGB===e&&this.state.blendEquation.modeAlpha===r)&&(this.state.blendEquation.modeRGB=e,this.state.blendEquation.modeAlpha=r,r!==void 0?this.gl.blendEquationSeparate(e,r):this.gl.blendEquation(e))}setCullFace(e){this.state.cullFace!==e&&(this.state.cullFace=e,this.gl.cullFace(e))}setFrontFace(e){this.state.frontFace!==e&&(this.state.frontFace=e,this.gl.frontFace(e))}setDepthMask(e){this.state.depthMask!==e&&(this.state.depthMask=e,this.gl.depthMask(e))}setDepthFunc(e){this.state.depthFunc!==e&&(this.state.depthFunc=e,this.gl.depthFunc(e))}setStencilMask(e){this.state.stencilMask!==e&&(this.state.stencilMask=e,this.gl.stencilMask(e))}setStencilFunc(e,r,i){this.state.stencilFunc===e&&this.state.stencilRef===r&&this.state.stencilFuncMask===i||(this.state.stencilFunc=e||this.gl.ALWAYS,this.state.stencilRef=r||0,this.state.stencilFuncMask=i||0,this.gl.stencilFunc(e||this.gl.ALWAYS,r||0,i||0))}setStencilOp(e,r,i){this.state.stencilFail===e&&this.state.stencilDepthFail===r&&this.state.stencilDepthPass===i||(this.state.stencilFail=e,this.state.stencilDepthFail=r,this.state.stencilDepthPass=i,this.gl.stencilOp(e,r,i))}activeTexture(e){this.state.activeTextureUnit!==e&&(this.state.activeTextureUnit=e,this.gl.activeTexture(this.gl.TEXTURE0+e))}bindFramebuffer({target:e=this.gl.FRAMEBUFFER,buffer:r=null}={}){this.state.framebuffer!==r&&(this.state.framebuffer=r,this.gl.bindFramebuffer(e,r))}getExtension(e,r,i){return r&&this.gl[r]?this.gl[r].bind(this.gl):(this.extensions[e]||(this.extensions[e]=this.gl.getExtension(e)),r?this.extensions[e]?this.extensions[e][i].bind(this.extensions[e]):null:this.extensions[e])}sortOpaque(e,r){return e.renderOrder!==r.renderOrder?e.renderOrder-r.renderOrder:e.program.id!==r.program.id?e.program.id-r.program.id:e.zDepth!==r.zDepth?e.zDepth-r.zDepth:r.id-e.id}sortTransparent(e,r){return e.renderOrder!==r.renderOrder?e.renderOrder-r.renderOrder:e.zDepth!==r.zDepth?r.zDepth-e.zDepth:r.id-e.id}sortUI(e,r){return e.renderOrder!==r.renderOrder?e.renderOrder-r.renderOrder:e.program.id!==r.program.id?e.program.id-r.program.id:r.id-e.id}getRenderList({scene:e,camera:r,frustumCull:i,sort:s}){let n=[];if(r&&i&&r.updateFrustum(),e.traverse(a=>{if(!a.visible)return!0;a.draw&&(i&&a.frustumCulled&&r&&!r.frustumIntersectsMesh(a)||n.push(a))}),s){let a=[],h=[],o=[];n.forEach(u=>{u.program.transparent?u.program.depthTest?h.push(u):o.push(u):a.push(u),u.zDepth=0,!(u.renderOrder!==0||!u.program.depthTest||!r)&&(u.worldMatrix.getTranslation(tt),tt.applyMatrix4(r.projectionViewMatrix),u.zDepth=tt.z)}),a.sort(this.sortOpaque),h.sort(this.sortTransparent),o.sort(this.sortUI),n=a.concat(h,o)}return n}render({scene:e,camera:r,target:i=null,update:s=!0,sort:n=!0,frustumCull:a=!0,clear:h}){i===null?(this.bindFramebuffer(),this.setViewport(this.width*this.dpr,this.height*this.dpr)):(this.bindFramebuffer(i),this.setViewport(i.width,i.height)),(h||this.autoClear&&h!==!1)&&(this.depth&&(!i||i.depth)&&(this.enable(this.gl.DEPTH_TEST),this.setDepthMask(!0)),(this.stencil||!i||i.stencil)&&(this.enable(this.gl.STENCIL_TEST),this.setStencilMask(255)),this.gl.clear((this.color?this.gl.COLOR_BUFFER_BIT:0)|(this.depth?this.gl.DEPTH_BUFFER_BIT:0)|(this.stencil?this.gl.STENCIL_BUFFER_BIT:0))),s&&e.updateMatrixWorld(),r&&r.updateMatrixWorld(),this.getRenderList({scene:e,camera:r,frustumCull:a,sort:n}).forEach(u=>{u.draw({camera:r})})}};function Ut(t,e){return t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],t}function Bt(t,e,r,i,s){return t[0]=e,t[1]=r,t[2]=i,t[3]=s,t}function Ot(t,e){let r=e[0],i=e[1],s=e[2],n=e[3],a=r*r+i*i+s*s+n*n;return a>0&&(a=1/Math.sqrt(a)),t[0]=r*a,t[1]=i*a,t[2]=s*a,t[3]=n*a,t}function Gt(t,e){return t[0]*e[0]+t[1]*e[1]+t[2]*e[2]+t[3]*e[3]}function Ht(t){return t[0]=0,t[1]=0,t[2]=0,t[3]=1,t}function qt(t,e,r){r=r*.5;let i=Math.sin(r);return t[0]=i*e[0],t[1]=i*e[1],t[2]=i*e[2],t[3]=Math.cos(r),t}function rt(t,e,r){let i=e[0],s=e[1],n=e[2],a=e[3],h=r[0],o=r[1],u=r[2],f=r[3];return t[0]=i*f+a*h+s*u-n*o,t[1]=s*f+a*o+n*h-i*u,t[2]=n*f+a*u+i*o-s*h,t[3]=a*f-i*h-s*o-n*u,t}function Wt(t,e,r){r*=.5;let i=e[0],s=e[1],n=e[2],a=e[3],h=Math.sin(r),o=Math.cos(r);return t[0]=i*o+a*h,t[1]=s*o+n*h,t[2]=n*o-s*h,t[3]=a*o-i*h,t}function Vt(t,e,r){r*=.5;let i=e[0],s=e[1],n=e[2],a=e[3],h=Math.sin(r),o=Math.cos(r);return t[0]=i*o-n*h,t[1]=s*o+a*h,t[2]=n*o+i*h,t[3]=a*o-s*h,t}function Xt(t,e,r){r*=.5;let i=e[0],s=e[1],n=e[2],a=e[3],h=Math.sin(r),o=Math.cos(r);return t[0]=i*o+s*h,t[1]=s*o-i*h,t[2]=n*o+a*h,t[3]=a*o-n*h,t}function Yt(t,e,r,i){let s=e[0],n=e[1],a=e[2],h=e[3],o=r[0],u=r[1],f=r[2],d=r[3],c,p,m,l,g;return p=s*o+n*u+a*f+h*d,p<0&&(p=-p,o=-o,u=-u,f=-f,d=-d),1-p>1e-6?(c=Math.acos(p),m=Math.sin(c),l=Math.sin((1-i)*c)/m,g=Math.sin(i*c)/m):(l=1-i,g=i),t[0]=l*s+g*o,t[1]=l*n+g*u,t[2]=l*a+g*f,t[3]=l*h+g*d,t}function jt(t,e){let r=e[0],i=e[1],s=e[2],n=e[3],a=r*r+i*i+s*s+n*n,h=a?1/a:0;return t[0]=-r*h,t[1]=-i*h,t[2]=-s*h,t[3]=n*h,t}function Kt(t,e){return t[0]=-e[0],t[1]=-e[1],t[2]=-e[2],t[3]=e[3],t}function Qt(t,e){let r=e[0]+e[4]+e[8],i;if(r>0)i=Math.sqrt(r+1),t[3]=.5*i,i=.5/i,t[0]=(e[5]-e[7])*i,t[1]=(e[6]-e[2])*i,t[2]=(e[1]-e[3])*i;else{let s=0;e[4]>e[0]&&(s=1),e[8]>e[s*3+s]&&(s=2);let n=(s+1)%3,a=(s+2)%3;i=Math.sqrt(e[s*3+s]-e[n*3+n]-e[a*3+a]+1),t[s]=.5*i,i=.5/i,t[3]=(e[n*3+a]-e[a*3+n])*i,t[n]=(e[n*3+s]+e[s*3+n])*i,t[a]=(e[a*3+s]+e[s*3+a])*i}return t}function $t(t,e,r="YXZ"){let i=Math.sin(e[0]*.5),s=Math.cos(e[0]*.5),n=Math.sin(e[1]*.5),a=Math.cos(e[1]*.5),h=Math.sin(e[2]*.5),o=Math.cos(e[2]*.5);return r==="XYZ"?(t[0]=i*a*o+s*n*h,t[1]=s*n*o-i*a*h,t[2]=s*a*h+i*n*o,t[3]=s*a*o-i*n*h):r==="YXZ"?(t[0]=i*a*o+s*n*h,t[1]=s*n*o-i*a*h,t[2]=s*a*h-i*n*o,t[3]=s*a*o+i*n*h):r==="ZXY"?(t[0]=i*a*o-s*n*h,t[1]=s*n*o+i*a*h,t[2]=s*a*h+i*n*o,t[3]=s*a*o-i*n*h):r==="ZYX"?(t[0]=i*a*o-s*n*h,t[1]=s*n*o+i*a*h,t[2]=s*a*h-i*n*o,t[3]=s*a*o+i*n*h):r==="YZX"?(t[0]=i*a*o+s*n*h,t[1]=s*n*o+i*a*h,t[2]=s*a*h-i*n*o,t[3]=s*a*o-i*n*h):r==="XZY"&&(t[0]=i*a*o-s*n*h,t[1]=s*n*o-i*a*h,t[2]=s*a*h+i*n*o,t[3]=s*a*o+i*n*h),t}var Zt=Ut,Jt=Bt;var er=Gt;var tr=Ot;var He=class extends Array{constructor(e=0,r=0,i=0,s=1){super(e,r,i,s),this.onChange=()=>{},this._target=this;let n=["0","1","2","3"];return new Proxy(this,{set(a,h){let o=Reflect.set(...arguments);return o&&n.includes(h)&&a.onChange(),o}})}get x(){return this[0]}get y(){return this[1]}get z(){return this[2]}get w(){return this[3]}set x(e){this._target[0]=e,this.onChange()}set y(e){this._target[1]=e,this.onChange()}set z(e){this._target[2]=e,this.onChange()}set w(e){this._target[3]=e,this.onChange()}identity(){return Ht(this._target),this.onChange(),this}set(e,r,i,s){return e.length?this.copy(e):(Jt(this._target,e,r,i,s),this.onChange(),this)}rotateX(e){return Wt(this._target,this._target,e),this.onChange(),this}rotateY(e){return Vt(this._target,this._target,e),this.onChange(),this}rotateZ(e){return Xt(this._target,this._target,e),this.onChange(),this}inverse(e=this._target){return jt(this._target,e),this.onChange(),this}conjugate(e=this._target){return Kt(this._target,e),this.onChange(),this}copy(e){return Zt(this._target,e),this.onChange(),this}normalize(e=this._target){return tr(this._target,e),this.onChange(),this}multiply(e,r){return r?rt(this._target,e,r):rt(this._target,this._target,e),this.onChange(),this}dot(e){return er(this._target,e)}fromMatrix3(e){return Qt(this._target,e),this.onChange(),this}fromEuler(e,r){return $t(this._target,e,e.order),r||this.onChange(),this}fromAxisAngle(e,r){return qt(this._target,e,r),this.onChange(),this}slerp(e,r){return Yt(this._target,this._target,e,r),this.onChange(),this}fromArray(e,r=0){return this._target[0]=e[r],this._target[1]=e[r+1],this._target[2]=e[r+2],this._target[3]=e[r+3],this.onChange(),this}toArray(e=[],r=0){return e[r]=this[0],e[r+1]=this[1],e[r+2]=this[2],e[r+3]=this[3],e}};var gi=1e-6;function rr(t,e){return t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],t[4]=e[4],t[5]=e[5],t[6]=e[6],t[7]=e[7],t[8]=e[8],t[9]=e[9],t[10]=e[10],t[11]=e[11],t[12]=e[12],t[13]=e[13],t[14]=e[14],t[15]=e[15],t}function ir(t,e,r,i,s,n,a,h,o,u,f,d,c,p,m,l,g){return t[0]=e,t[1]=r,t[2]=i,t[3]=s,t[4]=n,t[5]=a,t[6]=h,t[7]=o,t[8]=u,t[9]=f,t[10]=d,t[11]=c,t[12]=p,t[13]=m,t[14]=l,t[15]=g,t}function sr(t){return t[0]=1,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=1,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[10]=1,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t}function nr(t,e){let r=e[0],i=e[1],s=e[2],n=e[3],a=e[4],h=e[5],o=e[6],u=e[7],f=e[8],d=e[9],c=e[10],p=e[11],m=e[12],l=e[13],g=e[14],x=e[15],R=r*h-i*a,E=r*o-s*a,y=r*u-n*a,b=i*o-s*h,v=i*u-n*h,A=s*u-n*o,T=f*l-d*m,D=f*g-c*m,_=f*x-p*m,O=d*g-c*l,C=d*x-p*l,N=c*x-p*g,M=R*N-E*C+y*O+b*_-v*D+A*T;return M?(M=1/M,t[0]=(h*N-o*C+u*O)*M,t[1]=(s*C-i*N-n*O)*M,t[2]=(l*A-g*v+x*b)*M,t[3]=(c*v-d*A-p*b)*M,t[4]=(o*_-a*N-u*D)*M,t[5]=(r*N-s*_+n*D)*M,t[6]=(g*y-m*A-x*E)*M,t[7]=(f*A-c*y+p*E)*M,t[8]=(a*C-h*_+u*T)*M,t[9]=(i*_-r*C-n*T)*M,t[10]=(m*v-l*y+x*R)*M,t[11]=(d*y-f*v-p*R)*M,t[12]=(h*D-a*O-o*T)*M,t[13]=(r*O-i*D+s*T)*M,t[14]=(l*E-m*b-g*R)*M,t[15]=(f*b-d*E+c*R)*M,t):null}function it(t){let e=t[0],r=t[1],i=t[2],s=t[3],n=t[4],a=t[5],h=t[6],o=t[7],u=t[8],f=t[9],d=t[10],c=t[11],p=t[12],m=t[13],l=t[14],g=t[15],x=e*a-r*n,R=e*h-i*n,E=e*o-s*n,y=r*h-i*a,b=r*o-s*a,v=i*o-s*h,A=u*m-f*p,T=u*l-d*p,D=u*g-c*p,_=f*l-d*m,O=f*g-c*m,C=d*g-c*l;return x*C-R*O+E*_+y*D-b*T+v*A}function st(t,e,r){let i=e[0],s=e[1],n=e[2],a=e[3],h=e[4],o=e[5],u=e[6],f=e[7],d=e[8],c=e[9],p=e[10],m=e[11],l=e[12],g=e[13],x=e[14],R=e[15],E=r[0],y=r[1],b=r[2],v=r[3];return t[0]=E*i+y*h+b*d+v*l,t[1]=E*s+y*o+b*c+v*g,t[2]=E*n+y*u+b*p+v*x,t[3]=E*a+y*f+b*m+v*R,E=r[4],y=r[5],b=r[6],v=r[7],t[4]=E*i+y*h+b*d+v*l,t[5]=E*s+y*o+b*c+v*g,t[6]=E*n+y*u+b*p+v*x,t[7]=E*a+y*f+b*m+v*R,E=r[8],y=r[9],b=r[10],v=r[11],t[8]=E*i+y*h+b*d+v*l,t[9]=E*s+y*o+b*c+v*g,t[10]=E*n+y*u+b*p+v*x,t[11]=E*a+y*f+b*m+v*R,E=r[12],y=r[13],b=r[14],v=r[15],t[12]=E*i+y*h+b*d+v*l,t[13]=E*s+y*o+b*c+v*g,t[14]=E*n+y*u+b*p+v*x,t[15]=E*a+y*f+b*m+v*R,t}function ar(t,e,r){let i=r[0],s=r[1],n=r[2],a,h,o,u,f,d,c,p,m,l,g,x;return e===t?(t[12]=e[0]*i+e[4]*s+e[8]*n+e[12],t[13]=e[1]*i+e[5]*s+e[9]*n+e[13],t[14]=e[2]*i+e[6]*s+e[10]*n+e[14],t[15]=e[3]*i+e[7]*s+e[11]*n+e[15]):(a=e[0],h=e[1],o=e[2],u=e[3],f=e[4],d=e[5],c=e[6],p=e[7],m=e[8],l=e[9],g=e[10],x=e[11],t[0]=a,t[1]=h,t[2]=o,t[3]=u,t[4]=f,t[5]=d,t[6]=c,t[7]=p,t[8]=m,t[9]=l,t[10]=g,t[11]=x,t[12]=a*i+f*s+m*n+e[12],t[13]=h*i+d*s+l*n+e[13],t[14]=o*i+c*s+g*n+e[14],t[15]=u*i+p*s+x*n+e[15]),t}function or(t,e,r){let i=r[0],s=r[1],n=r[2];return t[0]=e[0]*i,t[1]=e[1]*i,t[2]=e[2]*i,t[3]=e[3]*i,t[4]=e[4]*s,t[5]=e[5]*s,t[6]=e[6]*s,t[7]=e[7]*s,t[8]=e[8]*n,t[9]=e[9]*n,t[10]=e[10]*n,t[11]=e[11]*n,t[12]=e[12],t[13]=e[13],t[14]=e[14],t[15]=e[15],t}function lr(t,e,r,i){let s=i[0],n=i[1],a=i[2],h=Math.hypot(s,n,a),o,u,f,d,c,p,m,l,g,x,R,E,y,b,v,A,T,D,_,O,C,N,M,z;return Math.abs(h)<gi?null:(h=1/h,s*=h,n*=h,a*=h,o=Math.sin(r),u=Math.cos(r),f=1-u,d=e[0],c=e[1],p=e[2],m=e[3],l=e[4],g=e[5],x=e[6],R=e[7],E=e[8],y=e[9],b=e[10],v=e[11],A=s*s*f+u,T=n*s*f+a*o,D=a*s*f-n*o,_=s*n*f-a*o,O=n*n*f+u,C=a*n*f+s*o,N=s*a*f+n*o,M=n*a*f-s*o,z=a*a*f+u,t[0]=d*A+l*T+E*D,t[1]=c*A+g*T+y*D,t[2]=p*A+x*T+b*D,t[3]=m*A+R*T+v*D,t[4]=d*_+l*O+E*C,t[5]=c*_+g*O+y*C,t[6]=p*_+x*O+b*C,t[7]=m*_+R*O+v*C,t[8]=d*N+l*M+E*z,t[9]=c*N+g*M+y*z,t[10]=p*N+x*M+b*z,t[11]=m*N+R*M+v*z,e!==t&&(t[12]=e[12],t[13]=e[13],t[14]=e[14],t[15]=e[15]),t)}function hr(t,e){return t[0]=e[12],t[1]=e[13],t[2]=e[14],t}function nt(t,e){let r=e[0],i=e[1],s=e[2],n=e[4],a=e[5],h=e[6],o=e[8],u=e[9],f=e[10];return t[0]=Math.hypot(r,i,s),t[1]=Math.hypot(n,a,h),t[2]=Math.hypot(o,u,f),t}function cr(t){let e=t[0],r=t[1],i=t[2],s=t[4],n=t[5],a=t[6],h=t[8],o=t[9],u=t[10],f=e*e+r*r+i*i,d=s*s+n*n+a*a,c=h*h+o*o+u*u;return Math.sqrt(Math.max(f,d,c))}var at=(function(){let t=[1,1,1];return function(e,r){let i=t;nt(i,r);let s=1/i[0],n=1/i[1],a=1/i[2],h=r[0]*s,o=r[1]*n,u=r[2]*a,f=r[4]*s,d=r[5]*n,c=r[6]*a,p=r[8]*s,m=r[9]*n,l=r[10]*a,g=h+d+l,x=0;return g>0?(x=Math.sqrt(g+1)*2,e[3]=.25*x,e[0]=(c-m)/x,e[1]=(p-u)/x,e[2]=(o-f)/x):h>d&&h>l?(x=Math.sqrt(1+h-d-l)*2,e[3]=(c-m)/x,e[0]=.25*x,e[1]=(o+f)/x,e[2]=(p+u)/x):d>l?(x=Math.sqrt(1+d-h-l)*2,e[3]=(p-u)/x,e[0]=(o+f)/x,e[1]=.25*x,e[2]=(c+m)/x):(x=Math.sqrt(1+l-h-d)*2,e[3]=(o-f)/x,e[0]=(p+u)/x,e[1]=(c+m)/x,e[2]=.25*x),e}})();function fr(t,e,r,i){let s=Le([t[0],t[1],t[2]]),n=Le([t[4],t[5],t[6]]),a=Le([t[8],t[9],t[10]]);it(t)<0&&(s=-s),r[0]=t[12],r[1]=t[13],r[2]=t[14];let o=t.slice(),u=1/s,f=1/n,d=1/a;o[0]*=u,o[1]*=u,o[2]*=u,o[4]*=f,o[5]*=f,o[6]*=f,o[8]*=d,o[9]*=d,o[10]*=d,at(e,o),i[0]=s,i[1]=n,i[2]=a}function ur(t,e,r,i){let s=t,n=e[0],a=e[1],h=e[2],o=e[3],u=n+n,f=a+a,d=h+h,c=n*u,p=n*f,m=n*d,l=a*f,g=a*d,x=h*d,R=o*u,E=o*f,y=o*d,b=i[0],v=i[1],A=i[2];return s[0]=(1-(l+x))*b,s[1]=(p+y)*b,s[2]=(m-E)*b,s[3]=0,s[4]=(p-y)*v,s[5]=(1-(c+x))*v,s[6]=(g+R)*v,s[7]=0,s[8]=(m+E)*A,s[9]=(g-R)*A,s[10]=(1-(c+l))*A,s[11]=0,s[12]=r[0],s[13]=r[1],s[14]=r[2],s[15]=1,s}function dr(t,e){let r=e[0],i=e[1],s=e[2],n=e[3],a=r+r,h=i+i,o=s+s,u=r*a,f=i*a,d=i*h,c=s*a,p=s*h,m=s*o,l=n*a,g=n*h,x=n*o;return t[0]=1-d-m,t[1]=f+x,t[2]=c-g,t[3]=0,t[4]=f-x,t[5]=1-u-m,t[6]=p+l,t[7]=0,t[8]=c+g,t[9]=p-l,t[10]=1-u-d,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t}function pr(t,e,r,i,s){let n=1/Math.tan(e/2),a=1/(i-s);return t[0]=n/r,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=n,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[10]=(s+i)*a,t[11]=-1,t[12]=0,t[13]=0,t[14]=2*s*i*a,t[15]=0,t}function mr(t,e,r,i,s,n,a){let h=1/(e-r),o=1/(i-s),u=1/(n-a);return t[0]=-2*h,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=-2*o,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[10]=2*u,t[11]=0,t[12]=(e+r)*h,t[13]=(s+i)*o,t[14]=(a+n)*u,t[15]=1,t}function gr(t,e,r,i){let s=e[0],n=e[1],a=e[2],h=i[0],o=i[1],u=i[2],f=s-r[0],d=n-r[1],c=a-r[2],p=f*f+d*d+c*c;p===0?c=1:(p=1/Math.sqrt(p),f*=p,d*=p,c*=p);let m=o*c-u*d,l=u*f-h*c,g=h*d-o*f;return p=m*m+l*l+g*g,p===0&&(u?h+=1e-6:o?u+=1e-6:o+=1e-6,m=o*c-u*d,l=u*f-h*c,g=h*d-o*f,p=m*m+l*l+g*g),p=1/Math.sqrt(p),m*=p,l*=p,g*=p,t[0]=m,t[1]=l,t[2]=g,t[3]=0,t[4]=d*g-c*l,t[5]=c*m-f*g,t[6]=f*l-d*m,t[7]=0,t[8]=f,t[9]=d,t[10]=c,t[11]=0,t[12]=s,t[13]=n,t[14]=a,t[15]=1,t}function ot(t,e,r){return t[0]=e[0]+r[0],t[1]=e[1]+r[1],t[2]=e[2]+r[2],t[3]=e[3]+r[3],t[4]=e[4]+r[4],t[5]=e[5]+r[5],t[6]=e[6]+r[6],t[7]=e[7]+r[7],t[8]=e[8]+r[8],t[9]=e[9]+r[9],t[10]=e[10]+r[10],t[11]=e[11]+r[11],t[12]=e[12]+r[12],t[13]=e[13]+r[13],t[14]=e[14]+r[14],t[15]=e[15]+r[15],t}function lt(t,e,r){return t[0]=e[0]-r[0],t[1]=e[1]-r[1],t[2]=e[2]-r[2],t[3]=e[3]-r[3],t[4]=e[4]-r[4],t[5]=e[5]-r[5],t[6]=e[6]-r[6],t[7]=e[7]-r[7],t[8]=e[8]-r[8],t[9]=e[9]-r[9],t[10]=e[10]-r[10],t[11]=e[11]-r[11],t[12]=e[12]-r[12],t[13]=e[13]-r[13],t[14]=e[14]-r[14],t[15]=e[15]-r[15],t}function xr(t,e,r){return t[0]=e[0]*r,t[1]=e[1]*r,t[2]=e[2]*r,t[3]=e[3]*r,t[4]=e[4]*r,t[5]=e[5]*r,t[6]=e[6]*r,t[7]=e[7]*r,t[8]=e[8]*r,t[9]=e[9]*r,t[10]=e[10]*r,t[11]=e[11]*r,t[12]=e[12]*r,t[13]=e[13]*r,t[14]=e[14]*r,t[15]=e[15]*r,t}var Re=class extends Array{constructor(e=1,r=0,i=0,s=0,n=0,a=1,h=0,o=0,u=0,f=0,d=1,c=0,p=0,m=0,l=0,g=1){return super(e,r,i,s,n,a,h,o,u,f,d,c,p,m,l,g),this}get x(){return this[12]}get y(){return this[13]}get z(){return this[14]}get w(){return this[15]}set x(e){this[12]=e}set y(e){this[13]=e}set z(e){this[14]=e}set w(e){this[15]=e}set(e,r,i,s,n,a,h,o,u,f,d,c,p,m,l,g){return e.length?this.copy(e):(ir(this,e,r,i,s,n,a,h,o,u,f,d,c,p,m,l,g),this)}translate(e,r=this){return ar(this,r,e),this}rotate(e,r,i=this){return lr(this,i,e,r),this}scale(e,r=this){return or(this,r,typeof e=="number"?[e,e,e]:e),this}add(e,r){return r?ot(this,e,r):ot(this,this,e),this}sub(e,r){return r?lt(this,e,r):lt(this,this,e),this}multiply(e,r){return e.length?r?st(this,e,r):st(this,this,e):xr(this,this,e),this}identity(){return sr(this),this}copy(e){return rr(this,e),this}fromPerspective({fov:e,aspect:r,near:i,far:s}={}){return pr(this,e,r,i,s),this}fromOrthogonal({left:e,right:r,bottom:i,top:s,near:n,far:a}){return mr(this,e,r,i,s,n,a),this}fromQuaternion(e){return dr(this,e),this}setPosition(e){return this.x=e[0],this.y=e[1],this.z=e[2],this}inverse(e=this){return nr(this,e),this}compose(e,r,i){return ur(this,e,r,i),this}decompose(e,r,i){return fr(this,e,r,i),this}getRotation(e){return at(e,this),this}getTranslation(e){return hr(e,this),this}getScaling(e){return nt(e,this),this}getMaxScaleOnAxis(){return cr(this)}lookAt(e,r,i){return gr(this,e,r,i),this}determinant(){return it(this)}fromArray(e,r=0){return this[0]=e[r],this[1]=e[r+1],this[2]=e[r+2],this[3]=e[r+3],this[4]=e[r+4],this[5]=e[r+5],this[6]=e[r+6],this[7]=e[r+7],this[8]=e[r+8],this[9]=e[r+9],this[10]=e[r+10],this[11]=e[r+11],this[12]=e[r+12],this[13]=e[r+13],this[14]=e[r+14],this[15]=e[r+15],this}toArray(e=[],r=0){return e[r]=this[0],e[r+1]=this[1],e[r+2]=this[2],e[r+3]=this[3],e[r+4]=this[4],e[r+5]=this[5],e[r+6]=this[6],e[r+7]=this[7],e[r+8]=this[8],e[r+9]=this[9],e[r+10]=this[10],e[r+11]=this[11],e[r+12]=this[12],e[r+13]=this[13],e[r+14]=this[14],e[r+15]=this[15],e}};function vr(t,e,r="YXZ"){return r==="XYZ"?(t[1]=Math.asin(Math.min(Math.max(e[8],-1),1)),Math.abs(e[8])<.99999?(t[0]=Math.atan2(-e[9],e[10]),t[2]=Math.atan2(-e[4],e[0])):(t[0]=Math.atan2(e[6],e[5]),t[2]=0)):r==="YXZ"?(t[0]=Math.asin(-Math.min(Math.max(e[9],-1),1)),Math.abs(e[9])<.99999?(t[1]=Math.atan2(e[8],e[10]),t[2]=Math.atan2(e[1],e[5])):(t[1]=Math.atan2(-e[2],e[0]),t[2]=0)):r==="ZXY"?(t[0]=Math.asin(Math.min(Math.max(e[6],-1),1)),Math.abs(e[6])<.99999?(t[1]=Math.atan2(-e[2],e[10]),t[2]=Math.atan2(-e[4],e[5])):(t[1]=0,t[2]=Math.atan2(e[1],e[0]))):r==="ZYX"?(t[1]=Math.asin(-Math.min(Math.max(e[2],-1),1)),Math.abs(e[2])<.99999?(t[0]=Math.atan2(e[6],e[10]),t[2]=Math.atan2(e[1],e[0])):(t[0]=0,t[2]=Math.atan2(-e[4],e[5]))):r==="YZX"?(t[2]=Math.asin(Math.min(Math.max(e[1],-1),1)),Math.abs(e[1])<.99999?(t[0]=Math.atan2(-e[9],e[5]),t[1]=Math.atan2(-e[2],e[0])):(t[0]=0,t[1]=Math.atan2(e[8],e[10]))):r==="XZY"&&(t[2]=Math.asin(-Math.min(Math.max(e[4],-1),1)),Math.abs(e[4])<.99999?(t[0]=Math.atan2(e[6],e[5]),t[1]=Math.atan2(e[8],e[0])):(t[0]=Math.atan2(-e[9],e[10]),t[1]=0)),t}var yr=new Re,qe=class extends Array{constructor(e=0,r=e,i=e,s="YXZ"){super(e,r,i),this.order=s,this.onChange=()=>{},this._target=this;let n=["0","1","2"];return new Proxy(this,{set(a,h){let o=Reflect.set(...arguments);return o&&n.includes(h)&&a.onChange(),o}})}get x(){return this[0]}get y(){return this[1]}get z(){return this[2]}set x(e){this._target[0]=e,this.onChange()}set y(e){this._target[1]=e,this.onChange()}set z(e){this._target[2]=e,this.onChange()}set(e,r=e,i=e){return e.length?this.copy(e):(this._target[0]=e,this._target[1]=r,this._target[2]=i,this.onChange(),this)}copy(e){return this._target[0]=e[0],this._target[1]=e[1],this._target[2]=e[2],this.onChange(),this}reorder(e){return this._target.order=e,this.onChange(),this}fromRotationMatrix(e,r=this.order){return vr(this._target,e,r),this.onChange(),this}fromQuaternion(e,r=this.order,i){return yr.fromQuaternion(e),this._target.fromRotationMatrix(yr,r),i||this.onChange(),this}fromArray(e,r=0){return this._target[0]=e[r],this._target[1]=e[r+1],this._target[2]=e[r+2],this}toArray(e=[],r=0){return e[r]=this[0],e[r+1]=this[1],e[r+2]=this[2],e}};var We=class{constructor(){this.parent=null,this.children=[],this.visible=!0,this.matrix=new Re,this.worldMatrix=new Re,this.matrixAutoUpdate=!0,this.worldMatrixNeedsUpdate=!1,this.position=new xe,this.quaternion=new He,this.scale=new xe(1),this.rotation=new qe,this.up=new xe(0,1,0),this.rotation._target.onChange=()=>this.quaternion.fromEuler(this.rotation,!0),this.quaternion._target.onChange=()=>this.rotation.fromQuaternion(this.quaternion,void 0,!0)}setParent(e,r=!0){this.parent&&e!==this.parent&&this.parent.removeChild(this,!1),this.parent=e,r&&e&&e.addChild(this,!1)}addChild(e,r=!0){~this.children.indexOf(e)||this.children.push(e),r&&e.setParent(this,!1)}removeChild(e,r=!0){~this.children.indexOf(e)&&this.children.splice(this.children.indexOf(e),1),r&&e.setParent(null,!1)}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.worldMatrixNeedsUpdate||e)&&(this.parent===null?this.worldMatrix.copy(this.matrix):this.worldMatrix.multiply(this.parent.worldMatrix,this.matrix),this.worldMatrixNeedsUpdate=!1,e=!0);for(let r=0,i=this.children.length;r<i;r++)this.children[r].updateMatrixWorld(e)}updateMatrix(){this.matrix.compose(this.quaternion,this.position,this.scale),this.worldMatrixNeedsUpdate=!0}traverse(e){if(!e(this))for(let r=0,i=this.children.length;r<i;r++)this.children[r].traverse(e)}decompose(){this.matrix.decompose(this.quaternion._target,this.position,this.scale),this.rotation.fromQuaternion(this.quaternion)}lookAt(e,r=!1){r?this.matrix.lookAt(this.position,e,this.up):this.matrix.lookAt(e,this.position,this.up),this.matrix.getRotation(this.quaternion._target),this.rotation.fromQuaternion(this.quaternion)}};function wr(t,e){return t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[4],t[4]=e[5],t[5]=e[6],t[6]=e[8],t[7]=e[9],t[8]=e[10],t}function Mr(t,e){let r=e[0],i=e[1],s=e[2],n=e[3],a=r+r,h=i+i,o=s+s,u=r*a,f=i*a,d=i*h,c=s*a,p=s*h,m=s*o,l=n*a,g=n*h,x=n*o;return t[0]=1-d-m,t[3]=f-x,t[6]=c+g,t[1]=f+x,t[4]=1-u-m,t[7]=p-l,t[2]=c-g,t[5]=p+l,t[8]=1-u-d,t}function br(t,e){return t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],t[4]=e[4],t[5]=e[5],t[6]=e[6],t[7]=e[7],t[8]=e[8],t}function Er(t,e,r,i,s,n,a,h,o,u){return t[0]=e,t[1]=r,t[2]=i,t[3]=s,t[4]=n,t[5]=a,t[6]=h,t[7]=o,t[8]=u,t}function Ar(t){return t[0]=1,t[1]=0,t[2]=0,t[3]=0,t[4]=1,t[5]=0,t[6]=0,t[7]=0,t[8]=1,t}function Rr(t,e){let r=e[0],i=e[1],s=e[2],n=e[3],a=e[4],h=e[5],o=e[6],u=e[7],f=e[8],d=f*a-h*u,c=-f*n+h*o,p=u*n-a*o,m=r*d+i*c+s*p;return m?(m=1/m,t[0]=d*m,t[1]=(-f*i+s*u)*m,t[2]=(h*i-s*a)*m,t[3]=c*m,t[4]=(f*r-s*o)*m,t[5]=(-h*r+s*n)*m,t[6]=p*m,t[7]=(-u*r+i*o)*m,t[8]=(a*r-i*n)*m,t):null}function ht(t,e,r){let i=e[0],s=e[1],n=e[2],a=e[3],h=e[4],o=e[5],u=e[6],f=e[7],d=e[8],c=r[0],p=r[1],m=r[2],l=r[3],g=r[4],x=r[5],R=r[6],E=r[7],y=r[8];return t[0]=c*i+p*a+m*u,t[1]=c*s+p*h+m*f,t[2]=c*n+p*o+m*d,t[3]=l*i+g*a+x*u,t[4]=l*s+g*h+x*f,t[5]=l*n+g*o+x*d,t[6]=R*i+E*a+y*u,t[7]=R*s+E*h+y*f,t[8]=R*n+E*o+y*d,t}function Tr(t,e,r){let i=e[0],s=e[1],n=e[2],a=e[3],h=e[4],o=e[5],u=e[6],f=e[7],d=e[8],c=r[0],p=r[1];return t[0]=i,t[1]=s,t[2]=n,t[3]=a,t[4]=h,t[5]=o,t[6]=c*i+p*a+u,t[7]=c*s+p*h+f,t[8]=c*n+p*o+d,t}function Sr(t,e,r){let i=e[0],s=e[1],n=e[2],a=e[3],h=e[4],o=e[5],u=e[6],f=e[7],d=e[8],c=Math.sin(r),p=Math.cos(r);return t[0]=p*i+c*a,t[1]=p*s+c*h,t[2]=p*n+c*o,t[3]=p*a-c*i,t[4]=p*h-c*s,t[5]=p*o-c*n,t[6]=u,t[7]=f,t[8]=d,t}function Fr(t,e,r){let i=r[0],s=r[1];return t[0]=i*e[0],t[1]=i*e[1],t[2]=i*e[2],t[3]=s*e[3],t[4]=s*e[4],t[5]=s*e[5],t[6]=e[6],t[7]=e[7],t[8]=e[8],t}function Lr(t,e){let r=e[0],i=e[1],s=e[2],n=e[3],a=e[4],h=e[5],o=e[6],u=e[7],f=e[8],d=e[9],c=e[10],p=e[11],m=e[12],l=e[13],g=e[14],x=e[15],R=r*h-i*a,E=r*o-s*a,y=r*u-n*a,b=i*o-s*h,v=i*u-n*h,A=s*u-n*o,T=f*l-d*m,D=f*g-c*m,_=f*x-p*m,O=d*g-c*l,C=d*x-p*l,N=c*x-p*g,M=R*N-E*C+y*O+b*_-v*D+A*T;return M?(M=1/M,t[0]=(h*N-o*C+u*O)*M,t[1]=(o*_-a*N-u*D)*M,t[2]=(a*C-h*_+u*T)*M,t[3]=(s*C-i*N-n*O)*M,t[4]=(r*N-s*_+n*D)*M,t[5]=(i*_-r*C-n*T)*M,t[6]=(l*A-g*v+x*b)*M,t[7]=(g*y-m*A-x*E)*M,t[8]=(m*v-l*y+x*R)*M,t):null}var Ve=class extends Array{constructor(e=1,r=0,i=0,s=0,n=1,a=0,h=0,o=0,u=1){return super(e,r,i,s,n,a,h,o,u),this}set(e,r,i,s,n,a,h,o,u){return e.length?this.copy(e):(Er(this,e,r,i,s,n,a,h,o,u),this)}translate(e,r=this){return Tr(this,r,e),this}rotate(e,r=this){return Sr(this,r,e),this}scale(e,r=this){return Fr(this,r,e),this}multiply(e,r){return r?ht(this,e,r):ht(this,this,e),this}identity(){return Ar(this),this}copy(e){return br(this,e),this}fromMatrix4(e){return wr(this,e),this}fromQuaternion(e){return Mr(this,e),this}fromBasis(e,r,i){return this.set(e[0],e[1],e[2],r[0],r[1],r[2],i[0],i[1],i[2]),this}inverse(e=this){return Rr(this,e),this}getNormalMatrix(e){return Lr(this,e),this}};var wi=0,Se=class extends We{constructor(e,{geometry:r,program:i,mode:s=e.TRIANGLES,frustumCulled:n=!0,renderOrder:a=0}={}){super(),e.canvas||console.error("gl not passed as first argument to Mesh"),this.gl=e,this.id=wi++,this.geometry=r,this.program=i,this.mode=s,this.frustumCulled=n,this.renderOrder=a,this.modelViewMatrix=new Re,this.normalMatrix=new Ve,this.beforeRenderCallbacks=[],this.afterRenderCallbacks=[]}onBeforeRender(e){return this.beforeRenderCallbacks.push(e),this}onAfterRender(e){return this.afterRenderCallbacks.push(e),this}draw({camera:e}={}){e&&(this.program.uniforms.modelMatrix||Object.assign(this.program.uniforms,{modelMatrix:{value:null},viewMatrix:{value:null},modelViewMatrix:{value:null},normalMatrix:{value:null},projectionMatrix:{value:null},cameraPosition:{value:null}}),this.program.uniforms.projectionMatrix.value=e.projectionMatrix,this.program.uniforms.cameraPosition.value=e.worldPosition,this.program.uniforms.viewMatrix.value=e.viewMatrix,this.modelViewMatrix.multiply(e.viewMatrix,this.worldMatrix),this.normalMatrix.getNormalMatrix(this.modelViewMatrix),this.program.uniforms.modelMatrix.value=this.worldMatrix,this.program.uniforms.modelViewMatrix.value=this.modelViewMatrix,this.program.uniforms.normalMatrix.value=this.normalMatrix),this.beforeRenderCallbacks.forEach(i=>i&&i({mesh:this,camera:e}));let r=this.program.cullFace&&this.worldMatrix.determinant()<0;this.program.use({flipFaces:r}),this.geometry.draw({mode:this.mode,program:this.program}),this.afterRenderCallbacks.forEach(i=>i&&i({mesh:this,camera:e}))}};var _r=new Uint8Array(4);function Cr(t){return(t&t-1)===0}var Mi=1,we=class{constructor(e,{image:r,target:i=e.TEXTURE_2D,type:s=e.UNSIGNED_BYTE,format:n=e.RGBA,internalFormat:a=n,wrapS:h=e.CLAMP_TO_EDGE,wrapT:o=e.CLAMP_TO_EDGE,wrapR:u=e.CLAMP_TO_EDGE,generateMipmaps:f=i===(e.TEXTURE_2D||e.TEXTURE_CUBE_MAP),minFilter:d=f?e.NEAREST_MIPMAP_LINEAR:e.LINEAR,magFilter:c=e.LINEAR,premultiplyAlpha:p=!1,unpackAlignment:m=4,flipY:l=i==(e.TEXTURE_2D||e.TEXTURE_3D),anisotropy:g=0,level:x=0,width:R,height:E=R,length:y=1}={}){this.gl=e,this.id=Mi++,this.image=r,this.target=i,this.type=s,this.format=n,this.internalFormat=a,this.minFilter=d,this.magFilter=c,this.wrapS=h,this.wrapT=o,this.wrapR=u,this.generateMipmaps=f,this.premultiplyAlpha=p,this.unpackAlignment=m,this.flipY=l,this.anisotropy=Math.min(g,this.gl.renderer.parameters.maxAnisotropy),this.level=x,this.width=R,this.height=E,this.length=y,this.texture=this.gl.createTexture(),this.store={image:null},this.glState=this.gl.renderer.state,this.state={},this.state.minFilter=this.gl.NEAREST_MIPMAP_LINEAR,this.state.magFilter=this.gl.LINEAR,this.state.wrapS=this.gl.REPEAT,this.state.wrapT=this.gl.REPEAT,this.state.anisotropy=0}bind(){this.glState.textureUnits[this.glState.activeTextureUnit]!==this.id&&(this.gl.bindTexture(this.target,this.texture),this.glState.textureUnits[this.glState.activeTextureUnit]=this.id)}update(e=0){let r=!(this.image===this.store.image&&!this.needsUpdate);if((r||this.glState.textureUnits[e]!==this.id)&&(this.gl.renderer.activeTexture(e),this.bind()),!!r){if(this.needsUpdate=!1,this.flipY!==this.glState.flipY&&(this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL,this.flipY),this.glState.flipY=this.flipY),this.premultiplyAlpha!==this.glState.premultiplyAlpha&&(this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,this.premultiplyAlpha),this.glState.premultiplyAlpha=this.premultiplyAlpha),this.unpackAlignment!==this.glState.unpackAlignment&&(this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT,this.unpackAlignment),this.glState.unpackAlignment=this.unpackAlignment),this.minFilter!==this.state.minFilter&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_MIN_FILTER,this.minFilter),this.state.minFilter=this.minFilter),this.magFilter!==this.state.magFilter&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_MAG_FILTER,this.magFilter),this.state.magFilter=this.magFilter),this.wrapS!==this.state.wrapS&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_WRAP_S,this.wrapS),this.state.wrapS=this.wrapS),this.wrapT!==this.state.wrapT&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_WRAP_T,this.wrapT),this.state.wrapT=this.wrapT),this.wrapR!==this.state.wrapR&&(this.gl.texParameteri(this.target,this.gl.TEXTURE_WRAP_R,this.wrapR),this.state.wrapR=this.wrapR),this.anisotropy&&this.anisotropy!==this.state.anisotropy&&(this.gl.texParameterf(this.target,this.gl.renderer.getExtension("EXT_texture_filter_anisotropic").TEXTURE_MAX_ANISOTROPY_EXT,this.anisotropy),this.state.anisotropy=this.anisotropy),this.image){if(this.image.width&&(this.width=this.image.width,this.height=this.image.height),this.target===this.gl.TEXTURE_CUBE_MAP)for(let i=0;i<6;i++)this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+i,this.level,this.internalFormat,this.format,this.type,this.image[i]);else if(ArrayBuffer.isView(this.image))this.target===this.gl.TEXTURE_2D?this.gl.texImage2D(this.target,this.level,this.internalFormat,this.width,this.height,0,this.format,this.type,this.image):(this.target===this.gl.TEXTURE_2D_ARRAY||this.target===this.gl.TEXTURE_3D)&&this.gl.texImage3D(this.target,this.level,this.internalFormat,this.width,this.height,this.length,0,this.format,this.type,this.image);else if(this.image.isCompressedTexture)for(let i=0;i<this.image.length;i++)this.gl.compressedTexImage2D(this.target,i,this.internalFormat,this.image[i].width,this.image[i].height,0,this.image[i].data);else this.target===this.gl.TEXTURE_2D?this.gl.texImage2D(this.target,this.level,this.internalFormat,this.format,this.type,this.image):this.gl.texImage3D(this.target,this.level,this.internalFormat,this.width,this.height,this.length,0,this.format,this.type,this.image);this.generateMipmaps&&(!this.gl.renderer.isWebgl2&&(!Cr(this.image.width)||!Cr(this.image.height))?(this.generateMipmaps=!1,this.wrapS=this.wrapT=this.gl.CLAMP_TO_EDGE,this.minFilter=this.gl.LINEAR):this.gl.generateMipmap(this.target)),this.onUpdate&&this.onUpdate()}else if(this.target===this.gl.TEXTURE_CUBE_MAP)for(let i=0;i<6;i++)this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X+i,0,this.gl.RGBA,1,1,0,this.gl.RGBA,this.gl.UNSIGNED_BYTE,_r);else this.width?this.target===this.gl.TEXTURE_2D?this.gl.texImage2D(this.target,this.level,this.internalFormat,this.width,this.height,0,this.format,this.type,null):this.gl.texImage3D(this.target,this.level,this.internalFormat,this.width,this.height,this.length,0,this.format,this.type,null):this.gl.texImage2D(this.target,0,this.gl.RGBA,1,1,0,this.gl.RGBA,this.gl.UNSIGNED_BYTE,_r);this.store.image=this.image}}};var Pe=class{constructor(e,{width:r=e.canvas.width,height:i=e.canvas.height,target:s=e.FRAMEBUFFER,color:n=1,depth:a=!0,stencil:h=!1,depthTexture:o=!1,wrapS:u=e.CLAMP_TO_EDGE,wrapT:f=e.CLAMP_TO_EDGE,wrapR:d=e.CLAMP_TO_EDGE,minFilter:c=e.LINEAR,magFilter:p=c,type:m=e.UNSIGNED_BYTE,format:l=e.RGBA,internalFormat:g=l,unpackAlignment:x,premultiplyAlpha:R}={}){this.gl=e,this.width=r,this.height=i,this.depth=a,this.stencil=h,this.buffer=this.gl.createFramebuffer(),this.target=s,this.gl.renderer.bindFramebuffer(this),this.textures=[];let E=[];for(let y=0;y<n;y++)this.textures.push(new we(e,{width:r,height:i,wrapS:u,wrapT:f,wrapR:d,minFilter:c,magFilter:p,type:m,format:l,internalFormat:g,unpackAlignment:x,premultiplyAlpha:R,flipY:!1,generateMipmaps:!1})),this.textures[y].update(),this.gl.framebufferTexture2D(this.target,this.gl.COLOR_ATTACHMENT0+y,this.gl.TEXTURE_2D,this.textures[y].texture,0),E.push(this.gl.COLOR_ATTACHMENT0+y);E.length>1&&this.gl.renderer.drawBuffers(E),this.texture=this.textures[0],o&&(this.gl.renderer.isWebgl2||this.gl.renderer.getExtension("WEBGL_depth_texture"))?(this.depthTexture=new we(e,{width:r,height:i,minFilter:this.gl.NEAREST,magFilter:this.gl.NEAREST,format:this.stencil?this.gl.DEPTH_STENCIL:this.gl.DEPTH_COMPONENT,internalFormat:e.renderer.isWebgl2?this.stencil?this.gl.DEPTH24_STENCIL8:this.gl.DEPTH_COMPONENT16:this.gl.DEPTH_COMPONENT,type:this.stencil?this.gl.UNSIGNED_INT_24_8:this.gl.UNSIGNED_INT}),this.depthTexture.update(),this.gl.framebufferTexture2D(this.target,this.stencil?this.gl.DEPTH_STENCIL_ATTACHMENT:this.gl.DEPTH_ATTACHMENT,this.gl.TEXTURE_2D,this.depthTexture.texture,0)):(a&&!h&&(this.depthBuffer=this.gl.createRenderbuffer(),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_COMPONENT16,r,i),this.gl.framebufferRenderbuffer(this.target,this.gl.DEPTH_ATTACHMENT,this.gl.RENDERBUFFER,this.depthBuffer)),h&&!a&&(this.stencilBuffer=this.gl.createRenderbuffer(),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.stencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.STENCIL_INDEX8,r,i),this.gl.framebufferRenderbuffer(this.target,this.gl.STENCIL_ATTACHMENT,this.gl.RENDERBUFFER,this.stencilBuffer)),a&&h&&(this.depthStencilBuffer=this.gl.createRenderbuffer(),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthStencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_STENCIL,r,i),this.gl.framebufferRenderbuffer(this.target,this.gl.DEPTH_STENCIL_ATTACHMENT,this.gl.RENDERBUFFER,this.depthStencilBuffer))),this.gl.renderer.bindFramebuffer({target:this.target})}setSize(e,r){if(!(this.width===e&&this.height===r)){this.width=e,this.height=r,this.gl.renderer.bindFramebuffer(this);for(let i=0;i<this.textures.length;i++)this.textures[i].width=e,this.textures[i].height=r,this.textures[i].needsUpdate=!0,this.textures[i].update(),this.gl.framebufferTexture2D(this.target,this.gl.COLOR_ATTACHMENT0+i,this.gl.TEXTURE_2D,this.textures[i].texture,0);this.depthTexture?(this.depthTexture.width=e,this.depthTexture.height=r,this.depthTexture.needsUpdate=!0,this.depthTexture.update(),this.gl.framebufferTexture2D(this.target,this.gl.DEPTH_ATTACHMENT,this.gl.TEXTURE_2D,this.depthTexture.texture,0)):(this.depthBuffer&&(this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_COMPONENT16,e,r)),this.stencilBuffer&&(this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.stencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.STENCIL_INDEX8,e,r)),this.depthStencilBuffer&&(this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthStencilBuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_STENCIL,e,r))),this.gl.renderer.bindFramebuffer({target:this.target})}}};var Ie=class extends Ge{constructor(e,{attributes:r={}}={}){Object.assign(r,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])},uv:{size:2,data:new Float32Array([0,0,2,0,0,2])}}),super(e,r)}};var Ur=`data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><path d="M39 3 12 37h17l-4 24 27-34H35z" fill="#fff"/></svg>')}`,bi=560,ye=4,ze=1e20,Fe=5,De=3,Ei=4e6,Ir=t=>{let e=String(t||"").replace("#","");e.length===3&&(e=e.replace(/./g,i=>i+i));let r=parseInt(e.slice(0,6),16);return Number.isNaN(r)?[1,1,1]:[(r>>16&255)/255,(r>>8&255)/255,(r&255)/255]},kr=(t,e,r,i,s)=>{let n=0;r[0]=0,i[0]=-ze,i[1]=ze;for(let a=1;a<s;a++){let h=(t[a]+a*a-(t[r[n]]+r[n]*r[n]))/(2*a-2*r[n]);for(;h<=i[n];)n--,h=(t[a]+a*a-(t[r[n]]+r[n]*r[n]))/(2*a-2*r[n]);n++,r[n]=a,i[n]=h,i[n+1]=ze}n=0;for(let a=0;a<s;a++){for(;i[n+1]<a;)n++;e[a]=(a-r[n])*(a-r[n])+t[r[n]]}},Pr=(t,e,r)=>{let i=Math.max(e,r),s=new Float64Array(i),n=new Float64Array(i),a=new Int32Array(i),h=new Float64Array(i+1);for(let o=0;o<e;o++){for(let u=0;u<r;u++)s[u]=t[u*e+o];kr(s,n,a,h,r);for(let u=0;u<r;u++)t[u*e+o]=n[u]}for(let o=0;o<r;o++){for(let u=0;u<e;u++)s[u]=t[o*e+u];kr(s,n,a,h,e);for(let u=0;u<e;u++)t[o*e+u]=n[u]}},zr=(t,e,r,i,s,n)=>{let a=1/(2*n+1),h=0;for(let o=0;o<=n&&o<s;o++)h+=t[r+o*i];for(let o=0;o<s;o++)e[r+o*i]=h*a,o+n+1<s&&(h+=t[r+(o+n+1)*i]),o-n>=0&&(h-=t[r+(o-n)*i])},Dr=(t,e,r,i)=>{let s=new Float32Array(e*r);for(let n=0;n<3;n++){for(let a=0;a<r;a++)zr(t,s,a*e,1,e,i);for(let a=0;a<e;a++)zr(s,t,a,e,r,i)}},Ai=(t,e,r)=>{let i=new Float32Array(e*r),s=0;for(let f=0;f<e*r;f++)t[f*4+3]<250&&s++;if(s>e*r*.01){for(let f=0;f<e*r;f++)i[f]=t[f*4+3]/255;return i}let n=0,a=0,h=0,o=0,u=f=>{n+=t[f*4],a+=t[f*4+1],h+=t[f*4+2],o++};for(let f=0;f<e;f++)u(f),u((r-1)*e+f);for(let f=0;f<r;f++)u(f*e),u(f*e+e-1);n/=o,a/=o,h/=o;for(let f=0;f<e*r;f++){let d=Math.max(Math.abs(t[f*4]-n),Math.abs(t[f*4+1]-a),Math.abs(t[f*4+2]-h));i[f]=Math.min(1,Math.max(0,(d-24)/48))}return i},Nr=(t,e,r)=>{let{field:i,width:s,height:n}=t,a=Math.min(Math.max(e,.5),s-.5),h=Math.min(Math.max(r,.5),n-.5),o=Math.min(Math.floor(a-.5),s-2),u=Math.min(Math.floor(h-.5),n-2),f=a-.5-o,d=h-.5-u,c=u*s+o,p=i[c]+(i[c+1]-i[c])*f,m=i[c+s]+(i[c+s+1]-i[c+s])*f;return p+(m-p)*d+Math.hypot(e-a,r-h)},Ri=t=>{let e=t.naturalWidth||t.width,r=t.naturalHeight||t.height;if(!e||!r)return null;let i=bi/Math.max(e,r),s=Math.max(2,Math.round(e*i)),n=Math.max(2,Math.round(r*i)),a=document.createElement("canvas");a.width=s,a.height=n;let h=a.getContext("2d",{willReadFrequently:!0});if(!h)return null;h.drawImage(t,0,0,s,n);let o=Ai(h.getImageData(0,0,s,n).data,s,n),u=s,f=n,d=-1,c=-1;for(let I=0;I<n;I++)for(let Q=0;Q<s;Q++)o[I*s+Q]<=.01||(Q<u&&(u=Q),Q>d&&(d=Q),I<f&&(f=I),I>c&&(c=I));if(d<0)return null;let p=d-u+1,m=c-f+1,l=Math.ceil(Math.max(p,m)*.25)+2,g=p+l*2,x=m+l*2,R=new Float32Array(g*x),E=new Float32Array(g*x);for(let I=0;I<x;I++)for(let Q=0;Q<g;Q++){let V=Q-l+u,he=I-l+f,oe=V>=0&&he>=0&&V<s&&he<n?o[he*s+V]:0,F=I*g+Q;if(oe>=1)R[F]=0,E[F]=ze;else if(oe<=0)R[F]=ze,E[F]=0;else{let L=.5-oe;R[F]=L>0?L*L:0,E[F]=L<0?L*L:0}}Pr(R,g,x),Pr(E,g,x);let y=new Float32Array(g*x);for(let I=0;I<g*x;I++)y[I]=Math.sqrt(R[I])-Math.sqrt(E[I]);let b=[];for(let I=1;I<x-1;I++)for(let Q=1;Q<g-1;Q++){let V=I*g+Q,he=y[V];if(he>0||y[V-1]<=0&&y[V+1]<=0&&y[V-g]<=0&&y[V+g]<=0)continue;let oe=y[V+1]-y[V-1],F=y[V+g]-y[V-g],L=Math.hypot(oe,F)||1;b.push(Q+.5-he*oe/L,I+.5-he*F/L)}let v=Math.max(1,Math.ceil(b.length/2/3e3))*2,A=[];for(let I=0;I<b.length;I+=v)A.push(b[I],b[I+1]);let T=Math.max(p,m),D=Math.ceil(T*.7/ye),_=Math.ceil(p/ye)+D*2,O=Math.ceil(m/ye)+D*2,C=new Float32Array(_*O);for(let I=0;I<x;I++){let Q=Math.floor((I-l)/ye)+D;for(let V=0;V<g;V++){let he=Math.floor((V-l)/ye)+D;C[Q*_+he]+=Math.exp(-Math.abs(y[I*g+V])/1.5)/(ye*ye)}}let N=C.slice(),M=Math.max(1,Math.round(T*.035/ye)),z=Math.max(2,Math.round(T*.13/ye));Dr(C,_,O,M),Dr(N,_,O,z);let S=Math.sqrt(2*Math.PI*(M*M+M))*ye/3,j=Math.sqrt(2*Math.PI*(z*z+z))*ye/3,K=new Float32Array(_*O*2);for(let I=0;I<_*O;I++)K[I*2]=C[I]*S,K[I*2+1]=N[I]*j;return{field:y,edges:A,width:g,height:x,pad:l,logoWidth:p,logoHeight:m,glow:K,glowWidth:_,glowHeight:O,glowOffset:l-D*ye}},ct=(t,e,r)=>{let{edges:i,logoWidth:s,logoHeight:n}=t,a=i.length/2;if(a<2)return null;let h=Math.max(s,n),o=Math.floor(Math.random()*a);if(r){let d=!1;for(let c=0;c<40&&!d;c++){let p=Math.floor(Math.random()*a);Math.hypot(i[p*2]-r.x,i[p*2+1]-r.y)<r.radius&&(o=p,d=!0)}if(!d)return null}let u=i[o*2],f=i[o*2+1];for(let d=0;d<24;d++){let c=Math.floor(Math.random()*a),p=i[c*2],m=i[c*2+1],l=Math.hypot(p-u,m-f);if(l<h*.08||l>h*.3)continue;let g=-(m-f)/l,x=(p-u)/l,R=l*(.2+Math.random()*.3),E=(u+p)/2,y=(f+m)/2,b=Nr(t,E+g*R,y+x*R),v=Nr(t,E-g*R,y-x*R);if(!(Math.max(b,v)<=0))return{ax:u,ay:f,bx:p,by:m,bow:b>=v?R:-R,seed:1+Math.random()*60,born:e,life:.35+Math.random()*.45}}return null},Ti=`#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`,Si=`#version 300 es
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
uniform vec4 uPulses[${De}];
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
  for (int i = 0; i < ${De}; i++) {
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
`,Fi={src:Ur,color:"#ecc7ff",glowColor:"#ad6dff",scale:.7,intensity:1,glow:1,thickness:1.5,strands:4,bend:.6,crackle:1.5,arcs:1,flicker:.6,fill:0,speed:2.5,interactive:!0,cursorIntensity:.75,cursorRadius:100,theme:"dark",onRender:void 0};function Br(t,e={}){let r={current:{...Fi,...e}},i={current:null},s={current:t};t.classList.add("electric-logo");let n=r.current.src,a=(()=>{let o=!0,u=new Image;return u.crossOrigin="anonymous",u.decoding="async",u.onload=()=>{if(!o)return;let f=null;try{f=Ri(u)}catch{f=null}f&&(i.current=f)},u.src=n||Ur,()=>{o=!1,u.onload=null}})(),h=(()=>{let o=s.current;if(!o)return;let u=new Ce({dpr:Math.min(window.devicePixelRatio||1,2),alpha:!0,premultipliedAlpha:!0,antialias:!1}),f=u.gl;if(!u.isWebgl2){f.getExtension("WEBGL_lose_context")?.loseContext();return}f.clearColor(0,0,0,0);let d=f.canvas;d.style.display="block",d.style.width="100%",d.style.height="100%",o.appendChild(d);let c=()=>({shape:null,field:new we(f,{image:new Float32Array([1e3]),width:1,height:1,internalFormat:f.R16F,format:f.RED,type:f.FLOAT,minFilter:f.LINEAR,magFilter:f.LINEAR,generateMipmaps:!1,flipY:!1,unpackAlignment:1}),glow:new we(f,{image:new Float32Array([0,0]),width:1,height:1,internalFormat:f.RG16F,format:f.RG,type:f.FLOAT,minFilter:f.LINEAR,magFilter:f.LINEAR,generateMipmaps:!1,flipY:!1,unpackAlignment:1})}),p=[c(),c()],m=Array.from({length:Fe*4},()=>0),l=Array.from({length:Fe*4},()=>0),g=Array.from({length:De*4},()=>0),x={tFieldFrom:{value:p[1].field},tGlowFrom:{value:p[1].glow},tFieldTo:{value:p[0].field},tGlowTo:{value:p[0].glow},uMapFrom:{value:[0,0,1,0]},uSizeFrom:{value:[1,1,1,1]},uMapTo:{value:[0,0,1,0]},uSizeTo:{value:[1,1,1,1]},uMorph:{value:1},uResolution:{value:[1,1]},uUnit:{value:1},uTime:{value:0},uPresence:{value:0},uHover:{value:[0,0,0]},uHoverRadius:{value:120},uPulses:{value:g},uPulseBoost:{value:0},uFlash:{value:0},uColor:{value:[1,1,1]},uGlowColor:{value:[.43,.48,1]},uIntensity:{value:1},uGlow:{value:1},uThickness:{value:1.8},uStrands:{value:3},uBend:{value:1},uCrackle:{value:1},uFlicker:{value:.4},uFill:{value:.5},uInk:{value:0},uArcEnds:{value:m},uArcShape:{value:l}},R=new Se(f,{geometry:new Ie(f),program:new _e(f,{vertex:Ti,fragment:Si,uniforms:x,depthTest:!1,depthWrite:!1})}),E=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches??!1,y={x:0,y:0,over:!1},b={x:0,y:0,vx:0,vy:0,power:0},v=[],A=[],T=0,D=null,_=1,O=null,C=0,N=0,M=[[1,1,1],[1,1,1]],z=!1,S=0,j=1,K=1,I=0,Q=performance.now(),V=!0,he=(G,B)=>{G.shape=B,G.field.image=B.field,G.field.width=B.width,G.field.height=B.height,G.field.needsUpdate=!0,G.glow.image=B.glow,G.glow.width=B.glowWidth,G.glow.height=B.glowHeight,G.glow.needsUpdate=!0},oe=(G,B)=>{let se=Math.max(1e-4,Math.min(j*B.scale/G.logoWidth,K*B.scale/G.logoHeight));return{fit:se,ox:j/2-(G.pad+G.logoWidth/2)*se,oy:K/2-(G.pad+G.logoHeight/2)*se,unit:Math.max(G.logoWidth,G.logoHeight)*se/100}},F=()=>{j=Math.max(1,o.clientWidth),K=Math.max(1,o.clientHeight),u.dpr=Math.min(window.devicePixelRatio||1,2,Math.sqrt(Ei/(j*K))),u.setSize(j,K),x.uResolution.value=[j,K]},L=G=>{I=0;let B=r.current,se=Math.min(.05,Math.max(0,(G-Q)/1e3));Q=G;let de=i.current;de&&de!==p[T].shape&&(D=de),D&&_>=1&&(p[T].shape&&(T=1-T,_=0,v.length=0),he(p[T],D),D=null),_<1&&(_=Math.min(1,_+se/(D?.3:1.6)));let ie=p[T].shape,H=_<1?p[1-T].shape:null;ie&&(C=Math.min(1,C+se/1.4));let W=C*C*(3-2*C);if(ie&&B){let w=oe(ie,B),k=H?oe(H,B):w,re=_*_*(3-2*_),le=k.unit+(w.unit-k.unit)*re,ce=B.interactive&&y.over;ce&&b.power<.01&&(b.x=y.x,b.y=y.y,b.vx=0,b.vy=0),b.vx+=((y.x-b.x)*120-b.vx*19)*se,b.vy+=((y.y-b.y)*120-b.vy*19)*se,b.x+=b.vx*se,b.y+=b.vy*se,b.power+=((ce?1:0)-b.power)*(1-Math.exp(-se/(ce?.3:.55)));let Y=E?.2:1;S+=se*B.speed*Y;for(let q=v.length-1;q>=0;q--)S-v[q].born>v[q].life&&v.splice(q,1);let ne=q=>({x:(q.x-w.ox)/w.fit,y:(q.y-w.oy)/w.fit,radius:Math.max(1,B.cursorRadius)/w.fit});if(O&&_>=1&&B.arcs>0)for(let q=0;q<3&&v.length<Fe;q++){let J=ct(ie,S,ne(O));J&&v.push(J)}if(O=null,!E&&W>.8&&_>=1&&v.length<Fe){let q=se*B.speed*B.arcs;if(Math.random()<q*6*b.power*B.cursorIntensity){let J=ct(ie,S,ne(b));J&&v.push(J)}else if(Math.random()<q*2.2){let J=ct(ie,S,null);J&&v.push(J)}}for(let q=0;q<Fe;q++){let J=q*4,$=v[q];if(!$){l[J+1]=0;continue}let fe=(S-$.born)/$.life;m[J]=w.ox+$.ax*w.fit,m[J+1]=w.oy+$.ay*w.fit,m[J+2]=w.ox+$.bx*w.fit,m[J+3]=w.oy+$.by*w.fit,l[J]=$.bow*w.fit,l[J+1]=Math.sin(Math.PI*Math.min(1,Math.max(0,fe)))*W,l[J+2]=$.seed}let ae=0,pe=0;for(let q=A.length-1;q>=0;q--)(G-A[q].born)/1e3>2&&A.splice(q,1);for(let q=0;q<De;q++){let J=q*4,$=A[q];if(!$){g[J+3]=0;continue}let fe=(G-$.born)/1e3;g[J]=$.x,g[J+1]=$.y,g[J+2]=fe,g[J+3]=1,ae=Math.max(ae,Math.exp(-fe*1.7)),pe+=Math.exp(-fe*7)}let me=p[1-T];x.tFieldTo.value=p[T].field,x.tGlowTo.value=p[T].glow,x.tFieldFrom.value=me.field,x.tGlowFrom.value=me.glow,x.uMapTo.value=[w.ox,w.oy,w.fit,ie.glowOffset],x.uSizeTo.value=[ie.width,ie.height,ie.glowWidth,ie.glowHeight],H&&(x.uMapFrom.value=[k.ox,k.oy,k.fit,H.glowOffset],x.uSizeFrom.value=[H.width,H.height,H.glowWidth,H.glowHeight]),x.uMorph.value=_,x.uUnit.value=le,x.uTime.value=S,x.uPresence.value=W,x.uHover.value=[b.x,b.y,b.power*Math.max(0,B.cursorIntensity)],x.uHoverRadius.value=Math.max(1,B.cursorRadius),x.uPulseBoost.value=ae,x.uFlash.value=pe;let ue=[Ir(B.color),Ir(B.glowColor)],Me=z?1-Math.exp(-se/.35):1;z=!0;for(let q=0;q<2;q++)for(let J=0;J<3;J++)M[q][J]+=(ue[q][J]-M[q][J])*Me;x.uColor.value=M[0].slice(),x.uGlowColor.value=M[1].slice(),x.uIntensity.value=B.intensity,x.uGlow.value=B.glow,x.uThickness.value=B.thickness,x.uStrands.value=Math.max(1,Math.min(6,Math.round(B.strands))),x.uBend.value=B.bend,x.uCrackle.value=B.crackle,x.uFlicker.value=E?0:B.flicker,N+=((B.theme==="light"?1:0)-N)*(1-Math.exp(-se/.25)),x.uFill.value=B.fill,x.uInk.value=N,u.render({scene:R}),B.onRender?.(d)}V&&(I=requestAnimationFrame(L))},P=()=>{I||!V||(Q=performance.now(),I=requestAnimationFrame(L))},U=G=>{let B=o.getBoundingClientRect();y.x=G.clientX-B.left,y.y=G.clientY-B.top,y.over=!0},Z=G=>{U(G),!(!r.current?.interactive||E)&&(A.push({x:y.x,y:y.y,born:performance.now()}),A.length>De&&A.shift(),O={x:y.x,y:y.y})},ee=()=>{y.over=!1};o.addEventListener("pointermove",U),o.addEventListener("pointerdown",Z),o.addEventListener("pointerleave",ee),o.addEventListener("pointercancel",ee);let X=new ResizeObserver(F);X.observe(o);let te=new IntersectionObserver(([G])=>{V=G.isIntersecting,P()});return te.observe(o),F(),P(),()=>{V=!1,cancelAnimationFrame(I),X.disconnect(),te.disconnect(),o.removeEventListener("pointermove",U),o.removeEventListener("pointerdown",Z),o.removeEventListener("pointerleave",ee),o.removeEventListener("pointercancel",ee),f.getExtension("WEBGL_lose_context")?.loseContext(),d.parentNode&&d.parentNode.removeChild(d)}})();return{set(o){Object.assign(r.current,o)},destroy(){a&&a(),h&&h()}}}var Li="https://images.unsplash.com/photo-1737071371043-761e02b1ef95?q=80&w=1400&auto=format&fit=crop",_i={bayer:0,noise:1,lines:2},Or={atkinson:[[1,0,1/8],[2,0,1/8],[-1,1,1/8],[0,1,1/8],[1,1,1/8],[0,2,1/8]],floyd:[[1,0,7/16],[-1,1,3/16],[0,1,5/16],[1,1,1/16]]},Gr=.5,Hr=4,qr=1.2,Wr=1.6,Ci=1100,ft=t=>{let e=String(t||"").replace("#","");e.length===3&&(e=e.replace(/./g,i=>i+i));let r=parseInt(e.slice(0,6),16);return Number.isNaN(r)?[0,0,0]:[(r>>16&255)/255,(r>>8&255)/255,(r&255)/255]},Ii=(t,e,r,i,s)=>{let n=t/e/(r/i);return s?n>1?[n,1]:[1,1/n]:n>1?[1,1/n]:[n,1]},ki=(t,e,r)=>[e*(.5+.33*Math.sin(t*.53)+.08*Math.sin(t*1.31+.6)),r*(.5+.28*Math.sin(t*.71+1.1)+.07*Math.cos(t*1.57))],Pi=(t,e)=>{t.canvas.width=32,t.canvas.height=32,t.drawImage(e,0,0,32,32);let i=t.getImageData(0,0,32,32).data,s=[0,0,0],n=[0,0,0],a=0;for(let u=0;u<32;u++)for(let f=0;f<32;f++)if(!(f>0&&u>0&&f<31&&u<31)){for(let d=0;d<3;d++){let c=i[(u*32+f)*4+d]/255;s[d]+=c,n[d]+=c*c}a++}let h=[s[0]/a,s[1]/a,s[2]/a],o=h.reduce((u,f,d)=>u+Math.sqrt(Math.max(0,n[d]/a-f*f)),0)/3;return{matte:h,plain:o<.06}},ut=null,zi=()=>{if(ut)return ut;let t=64,e=t*t,r=t-1,i=[];for(let l=-6;l<=6;l++)for(let g=-6;g<=6;g++)i.push(g,l,Math.exp(-(g*g+l*l)/4.5));let s=new Float32Array(e),n=new Uint8Array(e),a=(l,g)=>{let x=l%t,R=(l-x)/t;for(let E=0;E<i.length;E+=3)s[(R+i[E+1]&r)*t+(x+i[E]&r)]+=g*i[E+2]},h=(l,g)=>{let x=0,R=g?-1/0:1/0;for(let E=0;E<e;E++)n[E]===l&&(g?s[E]>R:s[E]<R)&&(R=s[E],x=E);return x},o=7,u=()=>(o=o*16807%2147483647,o/2147483647),f=Math.round(e*.1);for(let l=0;l<f;){let g=Math.floor(u()*e);n[g]||(n[g]=1,a(g,1),l++)}for(let l=0;l<e;l++){let g=h(1,!0);n[g]=0,a(g,-1);let x=h(0,!1);if(n[x]=1,a(x,1),x===g)break}let d=n.slice(),c=s.slice(),p=new Uint16Array(e);for(let l=f-1;l>=0;l--){let g=h(1,!0);n[g]=0,a(g,-1),p[g]=l}n.set(d),s.set(c);for(let l=f;l<e;l++){let g=h(0,!1);n[g]=1,a(g,1),p[g]=l}let m=new Uint8Array(e*4);for(let l=0;l<e;l++){let g=Math.floor(p[l]/e*256);m[l*4]=g,m[l*4+1]=g,m[l*4+2]=g,m[l*4+3]=255}return ut=m,m},Di=(t,e,r,i,s,n,a)=>{let h=n?3:1,o=new Float32Array(e*r*h);for(let d=0;d<e*r;d++){let c=t[d*4]/255,p=t[d*4+1]/255,m=t[d*4+2]/255;n?(o[d*3]=a(c),o[d*3+1]=a(p),o[d*3+2]=a(m)):o[d]=a(.2126*c+.7152*p+.0722*m)}let u=s-1,f=new Uint8Array(e*r*4);for(let d=0;d<r;d++){let c=d&1?-1:1;for(let p=0;p<e;p++){let m=c>0?p:e-1-p,l=d*e+m;for(let g=0;g<h;g++){let x=o[l*h+g],R=Math.min(u,Math.max(0,Math.round(x*u)))/u,E=x-R,y=Math.round(R*255);n?f[l*4+g]=y:f[l*4]=f[l*4+1]=f[l*4+2]=y;for(let b=0;b<i.length;b++){let v=m+i[b][0]*c,A=d+i[b][1];v<0||v>=e||A>=r||(o[(A*e+v)*h+g]+=E*i[b][2])}}f[l*4+3]=255}}return f},Ni=`#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`,Ui=`#version 300 es
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
`,Bi=`#version 300 es
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
`,Oi={src:Li,fit:"contain",pattern:"floyd",pixelSize:2,levels:2,palette:"duotone",inkColor:"#120f17",paperColor:"#f4f1ea",contrast:1.15,brightness:0,revealRadius:200,softness:.6,linger:1,rimColor:"#a78bfa",rim:0,reverse:!1,wander:!1,clickBurst:!0,className:""};function Vr(t,e={}){let r={...Oi,...e},i={current:t},s={current:r},n={current:()=>{}};t.classList.add("dither-veil");let a=r.src,h=(()=>{let o=i.current;if(!o)return;let u=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,f=new Ce({dpr:Math.min(window.devicePixelRatio||1,2),alpha:!1,antialias:!1}),d=f.gl,c=d.canvas;c.style.display="block",c.style.width="100%",c.style.height="100%",o.appendChild(c);let p=f.isWebgl2&&!!f.getExtension("EXT_color_buffer_float"),m=new Ie(d),l=()=>new we(d,{image:new Uint8Array(4),width:1,height:1,generateMipmaps:!1,flipY:!1,minFilter:d.NEAREST,magFilter:d.NEAREST}),g=new we(d,{minFilter:d.LINEAR_MIPMAP_LINEAR,magFilter:d.LINEAR}),x=l(),R=l(),E=(w,k)=>new Pe(d,{width:w,height:k,depth:!1,type:p?d.HALF_FLOAT:d.UNSIGNED_BYTE,internalFormat:p?d.RGBA16F:d.RGBA,minFilter:d.LINEAR,magFilter:d.LINEAR}),y=w=>{d.deleteFramebuffer(w.buffer),d.deleteTexture(w.texture.texture)},b=[E(2,2),E(2,2)],v={tPrev:{value:b[0].texture},uSize:{value:[1,1]},uFrom:{value:[0,0]},uTo:{value:[0,0]},uRadius:{value:1},uSoftness:{value:.5},uStrength:{value:0},uFade:{value:1},uHold:{value:Wr}},A={tImage:{value:g},tMask:{value:b[0].texture},tNoise:{value:x},tDiffused:{value:R},uResolution:{value:[1,1]},uCover:{value:[1,1]},uLod:{value:0},uCell:{value:3},uPattern:{value:0},uPalette:{value:0},uLevels:{value:2},uInk:{value:[0,0,0]},uPaper:{value:[1,1,1]},uRimColor:{value:[1,1,1]},uRim:{value:0},uContrast:{value:1},uBrightness:{value:0},uReverse:{value:0},uIntro:{value:0},uHold:{value:Wr},uMatte:{value:[0,0,0]},uKey:{value:0},uSize:{value:[1,1]},uBursts:{value:Array.from({length:Hr*4},()=>0)},uBurstWidth:{value:60}},T=(w,k)=>new _e(d,{vertex:Ni,fragment:w,uniforms:k,depthTest:!1,depthWrite:!1}),D=new Se(d,{geometry:m,program:T(Ui,v)}),_=new Se(d,{geometry:m,program:T(Bi,A)}),O=document.createElement("canvas"),C=O.getContext("2d",{willReadFrequently:!0}),N=null,M=0,z="",S=!1,j=1,K=1,I=!0,Q=0,V=performance.now(),he=0,oe=0,F=0,L={x:0,y:0,inside:!1,fresh:!0,placed:!1},P={x:0,y:0,px:0,py:0},U=[],Z=()=>{j=Math.max(1,o.clientWidth),K=Math.max(1,o.clientHeight),f.setSize(j,K),A.uResolution.value=[c.width,c.height],v.uSize.value=[j,K],A.uSize.value=[j,K];let w=Math.max(2,Math.round(j*Gr)),k=Math.max(2,Math.round(K*Gr));(w!==b[0].width||k!==b[0].height)&&(b.forEach(y),b=[E(w,k),E(w,k)]),L.placed||(L.x=j/2,L.y=K/2)},ee=(w,k)=>{if(!N||!C)return;let re=Math.ceil(c.width/w),le=Math.ceil(c.height/w),ce=[k.pattern,k.levels,k.palette,k.contrast,k.brightness,k.fit,re,le,c.width,c.height].join("|");if(ce===z)return;z=ce;let[Y,ne]=A.uCover.value,ae=N.naturalWidth,pe=N.naturalHeight;O.width=re,O.height=le,C.imageSmoothingEnabled=!0,C.imageSmoothingQuality="high";let[me,ue,Me]=A.uMatte.value;C.fillStyle=`rgb(${me*255}, ${ue*255}, ${Me*255})`,C.fillRect(0,0,re,le);let q=(.5-.5*Y)*ae,J=(.5-.5*ne)*pe,$=re*w/c.width*Y*ae,fe=le*w/c.height*ne*pe,ge=Math.max(q,0),ve=Math.max(J,0),Ae=Math.min(q+$,ae),ke=Math.min(J+fe,pe);Ae>ge&&ke>ve&&C.drawImage(N,ge,ve,Ae-ge,ke-ve,(ge-q)/$*re,(ve-J)/fe*le,(Ae-ge)/$*re,(ke-ve)/fe*le);let gt=ai=>Math.pow(Math.min(1,Math.max(0,(ai-.5)*k.contrast+.5+k.brightness)),1.6),ni=C.getImageData(0,0,re,le).data;R.image=Di(ni,re,le,Or[k.pattern],k.levels,k.palette==="rgb",gt),R.width=re,R.height=le,R.needsUpdate=!0},X=w=>{Q=0;let k=s.current;if(!k)return;let re=Math.min(.05,Math.max(0,(w-V)/1e3));V=w;let le=k.wander&&!u,ce=L.x,Y=L.y;if(!L.inside&&le){F=Math.min(1,F+re/1.2);let[$,fe]=ki(w/1e3,j,K),ge=F*F*(3-2*F);ce+=($-ce)*ge,Y+=(fe-Y)*ge}else F=0;if(oe+=((L.inside||le?1:0)-oe)*(1-Math.exp(-re/.16)),L.fresh)P.x=P.px=ce,P.y=P.py=Y,L.fresh=!1;else{let $=1-Math.exp(-re/.035);P.x+=(ce-P.x)*$,P.y+=(Y-P.y)*$}let ne=A.uBursts.value;ne.fill(0);for(let $=U.length-1;$>=0;$--)(w-U[$].start)/1e3>=qr&&U.splice($,1);U.forEach(($,fe)=>{let ge=Math.max(0,(w-$.start)/1e3/qr),ve=Math.hypot(Math.max($.x,j-$.x),Math.max($.y,K-$.y))+A.uBurstWidth.value;ne[fe*4]=$.x,ne[fe*4+1]=$.y,ne[fe*4+2]=ve*Math.sin(ge*Math.PI/2),ne[fe*4+3]=1-ge*ge*ge}),oe>.002&&(he=w+k.linger*1e3+150);let ae=p?0:1.5/255,pe=k.linger>0?re/k.linger:1;v.tPrev.value=b[0].texture,v.uFrom.value=[P.px,P.py],v.uTo.value=[P.x,P.y],v.uRadius.value=k.revealRadius*(.45+.55*oe),v.uSoftness.value=k.softness,v.uStrength.value=oe,v.uFade.value=Math.max(pe,ae),A.uBurstWidth.value=Math.max(60,k.revealRadius*.9),f.render({scene:D,target:b[1]}),b.reverse(),P.px=P.x,P.py=P.y;let me=Math.max(1,Math.round(k.pixelSize*f.dpr));N&&(A.uCover.value=Ii(c.width,c.height,N.naturalWidth,N.naturalHeight,k.fit==="contain"));let ue=_i[k.pattern]??0;if(Or[k.pattern]&&(ue=0,N&&!S))try{ee(me,k),ue=3}catch{S=!0}ue===1&&x.width!==64&&(x.image=zi(),x.width=64,x.height=64,x.needsUpdate=!0);let Me=N?A.uCover.value[0]*N.naturalWidth/c.width:1;A.tMask.value=b[0].texture,A.uCell.value=me,A.uLod.value=Math.log2(Math.max(me*Me,1)),A.uPattern.value=ue,A.uPalette.value=k.palette==="rgb"?1:0,A.uLevels.value=Math.max(2,Math.round(k.levels)),A.uInk.value=ft(k.inkColor),A.uPaper.value=ft(k.paperColor),A.uRimColor.value=ft(k.rimColor),A.uRim.value=Math.min(Math.max(k.rim,0),.95),A.uContrast.value=k.contrast,A.uBrightness.value=k.brightness,A.uReverse.value=k.reverse?1:0;let q=N?Math.min(1,(w-M)/Ci):0;A.uIntro.value=1-Math.pow(1-q,2),f.render({scene:_}),(L.inside||le||oe>.002||U.length>0||w<he||N&&q<1)&&I&&(Q=requestAnimationFrame(X))},te=()=>{Q||!I||(V=performance.now(),Q=requestAnimationFrame(X))};n.current=te;let G=new Image;G.crossOrigin="anonymous",G.decoding="async",G.onload=()=>{N=G,g.image=G;try{if(C){let w=Pi(C,G);A.uMatte.value=w.matte,A.uKey.value=w.plain?1:0}}catch{}M=performance.now(),te()},G.src=a;let B=w=>{let k=o.getBoundingClientRect();L.x=w.clientX-k.left,L.y=w.clientY-k.top,L.placed=!0},se=w=>{B(w),L.inside||(L.inside=!0,L.fresh=!0),te()},de=()=>{L.inside=!1,te()},ie=w=>{se(w),!(!s.current?.clickBurst||w.pointerType==="mouse"&&w.button!==0)&&(U.push({x:L.x,y:L.y,start:performance.now()}),U.length>Hr&&U.shift())};o.addEventListener("pointermove",se,{passive:!0}),o.addEventListener("pointerenter",se,{passive:!0}),o.addEventListener("pointerdown",ie,{passive:!0}),o.addEventListener("pointerleave",de,{passive:!0}),o.addEventListener("pointercancel",de,{passive:!0});let H=new ResizeObserver(()=>{Z(),te()});H.observe(o);let W=new IntersectionObserver(([w])=>{I=w.isIntersecting,te()});return W.observe(o),Z(),te(),()=>{cancelAnimationFrame(Q),n.current=()=>{},H.disconnect(),W.disconnect(),G.onload=null,o.removeEventListener("pointermove",se),o.removeEventListener("pointerenter",se),o.removeEventListener("pointerdown",ie),o.removeEventListener("pointerleave",de),o.removeEventListener("pointercancel",de),d.getExtension("WEBGL_lose_context")?.loseContext(),c.parentNode&&c.parentNode.removeChild(c)}})();return{set(o){Object.assign(r,o),n.current()},destroy(){h&&h()}}}var Xe=Math.PI/2,Gi=`#version 300 es
const vec2 corners[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
void main() {
  gl_Position = vec4(corners[gl_VertexID], 0.0, 1.0);
}`,Hi=`#version 300 es
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
}`,Ee=(t,e,r)=>Math.min(r,Math.max(e,t)),pt=t=>{let e=String(t||"").trim(),r=/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(e);if(r){let s=r[1].length===3?r[1].replace(/./g,n=>n+n):r[1];return[0,2,4].map(n=>parseInt(s.slice(n,n+2),16)/255)}let i=/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(e);if(i)return[i[1],i[2],i[3]].map(s=>Ee(parseFloat(s)/255,0,1));if(typeof document<"u"){let s=document.createElement("canvas").getContext("2d");if(s){s.fillStyle="#000000",s.fillStyle=e;let n=String(s.fillStyle);if(n!=="#000000"||/^(#0{3}|#0{6}|black)$/i.test(e))return pt(n)}}return[.49,.98,1]},Xr=(t,e,r)=>{let i=t.createShader(e);return i?(t.shaderSource(i,r),t.compileShader(i),t.getShaderParameter(i,t.COMPILE_STATUS)?i:(console.error(t.getShaderInfoLog(i)),t.deleteShader(i),null)):null},qi=t=>{let e=Xr(t,t.VERTEX_SHADER,Gi),r=Xr(t,t.FRAGMENT_SHADER,Hi),i=e&&r?t.createProgram():null;if(!e||!r||!i)return e&&t.deleteShader(e),r&&t.deleteShader(r),null;if(t.attachShader(i,e),t.attachShader(i,r),t.linkProgram(i),t.deleteShader(e),t.deleteShader(r),!t.getProgramParameter(i,t.LINK_STATUS))return console.error(t.getProgramInfoLog(i)),t.deleteProgram(i),null;let s={},n=t.getProgramParameter(i,t.ACTIVE_UNIFORMS);for(let a=0;a<n;a++){let h=t.getActiveUniform(i,a);h&&(s[h.name.replace(/\[0\]$/,"")]=t.getUniformLocation(i,h.name))}return{program:i,uniforms:s}},Ne=(t,e,r,i,s)=>{let n=Math.abs(t)-(r-s),a=Math.abs(e)-(i-s);return Math.hypot(Math.max(n,0),Math.max(a,0))+Math.min(Math.max(n,a),0)-s},Yr=(t,e,r,i)=>{let s=Math.max(1,t/2+i),n=Math.max(1,e/2+i),a=Ee(r+i,0,Math.min(s,n)),h=Math.min(a+48,Math.min(s,n)),o=s-h,u=n-h,f=o+u+Xe*h;return{hx:s,hy:n,r:a,vr:h,ax:o,ay:u,quarter:f,perimeter:f*4}},dt=(t,e)=>{let{hx:r,hy:i,r:s,vr:n,ax:a,ay:h,quarter:o,perimeter:u}=t,f=(e%u+u)%u,d=Math.min(3,Math.floor(f/o)),c=f-d*o,p=d%2?o-c:c,m,l;if(p<=a)m=p,l=-i;else if(p<=a+Xe*n){let A=n>0?(p-a)/n:0,T=Math.sin(A),D=-Math.cos(A),_=0,O=n+s+2;for(let C=0;C<18;C++){let N=(_+O)/2;Ne(a+T*N,-h+D*N,r,i,s)<0?_=N:O=N}m=a+T*_,l=-h+D*_}else m=r,l=-h+(p-a-Xe*n);let g=d>=2?-1:1,x=d===1||d===2?-1:1,R=m*g,E=l*x,y=Ne(R+.5,E,r,i,s)-Ne(R-.5,E,r,i,s),b=Ne(R,E+.5,r,i,s)-Ne(R,E-.5,r,i,s),v=Math.hypot(y,b)||1;return{x:R,y:E,nx:y/v,ny:b/v}},jr=(t,e,r)=>{let{ax:i,ay:s,vr:n,quarter:a}=t,h=Math.abs(e)-i,o=Math.abs(r)-s,u;return h>0&&o>0?u=i+n*Math.atan2(h,o):h>o?u=i+Xe*n+s-Math.abs(r):u=Math.abs(e),u=Ee(u,0,a),e>=0?r<0?u:2*a-u:r<0?4*a-u:2*a+u},Wi={color:"#7df9ff",glowColor:void 0,speed:1,chaos:.5,spread:.6,thickness:1.5,strands:3,glow:.6,intensity:.8,arcs:1,flicker:.5,borderRadius:24,offset:0,active:!0,intro:!0,interactive:!0,cursorRadius:90,theme:"dark",className:""};function Kr(t,e={}){let r={...Wi,...e},i=()=>{let{color:p,glowColor:m,speed:l,chaos:g,spread:x,thickness:R,strands:E,glow:y,intensity:b,arcs:v,flicker:A,borderRadius:T,offset:D,active:_,intro:O,interactive:C,cursorRadius:N,theme:M}=r,z=pt(p);return{core:z.map(j=>j+(1-j)*.55),glowColor:m?pt(m):z,speed:Math.max(0,l),chaos:Ee(g,0,2),spread:Ee(x,0,2),thickness:Math.max(.25,R),strands:Ee(Math.round(E),1,6),glow:Ee(y,0,3),intensity:Math.max(0,b),arcs:Math.max(0,v),flicker:Ee(A,0,1),borderRadius:Math.max(0,T),offset:D,active:_,intro:O,interactive:C,cursorRadius:Math.max(1,N),light:M==="light"}},s={current:t},n=document.createElement("canvas");n.className="electric-border__canvas",n.setAttribute("aria-hidden","true"),n.style.top="-64px",n.style.left="-64px",t.classList.add("electric-border"),t.appendChild(n);let a={current:n},h={current:null},o={current:i()},u=0,f=null,d=()=>{f=(()=>{let p=s.current,m=a.current;if(!p||!m)return;let l=m.getContext("webgl2",{alpha:!0,premultipliedAlpha:!0,antialias:!1,depth:!1,stencil:!1,powerPreference:"default"}),g=l?qi(l):null;if(!l||!g)return;let x=window.matchMedia("(prefers-reduced-motion: reduce)").matches,R=l.createVertexArray(),E=new Float32Array(16),y=new Float32Array(16),b=new Float32Array(12),v={width:1,height:1,ratio:1},A={x:0,y:0,over:!1,near:!1},T={x:0,y:0,vx:0,vy:0,power:0},D=[],_=[],O=o.current,C=O.active&&!(O.intro&&!x&&u===0)?1:0,N=C,M=O.active,z=O.light?1:0,S=Yr(1,1,0,0),j=Math.random()*100,K=0,I=0,Q=!0,V=document.visibilityState!=="hidden",he=!1,oe=()=>{let H=o.current,W=Math.max(1,p.offsetWidth),w=Math.max(1,p.offsetHeight),k=W+128,re=w+128,le=Math.min(window.devicePixelRatio||1,2,Math.sqrt(3e6/(k*re))),ce=Math.max(1,Math.round(k*le)),Y=Math.max(1,Math.round(re*le));(m.width!==ce||m.height!==Y)&&(m.width=ce,m.height=Y),m.style.width=`${k}px`,m.style.height=`${re}px`,Object.assign(v,{width:W,height:w,ratio:ce/k}),S=Yr(W,w,H.borderRadius,H.offset)},F=(H,W)=>{let w=Math.min(S.perimeter*.3,60+Math.random()*90),re=(W??Math.random()*S.perimeter)-w*(.2+Math.random()*.6),le=re+w,ce=dt(S,re),Y=dt(S,le),ne=dt(S,(re+le)/2),ae=Y.x-ce.x,pe=Y.y-ce.y,me=Math.hypot(ae,pe)||1,ue=-pe/me*ne.nx+ae/me*ne.ny,Me=Math.min(34,me*(.14+Math.random()*.16)+5);return{ax:ce.x,ay:ce.y,bx:Y.x,by:Y.y,bow:ue>=0?Me:-Me,seed:1+Math.random()*60,born:H,life:.35+Math.random()*.45}},L=(H,W)=>{let w=g.uniforms,k=v.width+128,re=v.height+128;l.viewport(0,0,m.width,m.height),l.clearColor(0,0,0,0),l.clear(l.COLOR_BUFFER_BIT),!(C<=.001&&!D.length)&&(l.useProgram(g.program),l.uniform2f(w.uSize,k,re),l.uniform1f(w.uRatio,v.ratio),l.uniform2f(w.uCenter,k/2,re/2),l.uniform2f(w.uHalf,S.hx,S.hy),l.uniform1f(w.uRadius,S.r),l.uniform3f(w.uParam,S.ax,S.ay,S.vr),l.uniform1f(w.uPerimeter,S.perimeter),l.uniform4f(w.uCells,Math.max(1,Math.round(S.perimeter/75)),Math.max(2,Math.round(S.perimeter/25)),Math.max(3,Math.round(S.perimeter/9)),Math.max(4,Math.round(S.perimeter/4))),l.uniform2f(w.uSoft,Math.max(1,Math.round(S.perimeter/150)),Math.max(1,Math.round(S.perimeter/50))),l.uniform1f(w.uTime,j),l.uniform1f(w.uPower,C*C*(3-2*C)),l.uniform1f(w.uReveal,N),l.uniform3f(w.uHover,T.x+64,T.y+64,W),l.uniform1f(w.uHoverRadius,H.cursorRadius),l.uniform4fv(w.uPulses,b),l.uniform3fv(w.uCore,H.core),l.uniform3fv(w.uGlowColor,H.glowColor),l.uniform1f(w.uIntensity,H.intensity),l.uniform1f(w.uGlow,H.glow),l.uniform1f(w.uThickness,H.thickness),l.uniform1f(w.uStrands,H.strands),l.uniform1f(w.uChaos,H.chaos),l.uniform1f(w.uSpread,H.spread),l.uniform1f(w.uFlicker,x?0:H.flicker),l.uniform1f(w.uInk,z),l.uniform4fv(w.uArcEnds,E),l.uniform4fv(w.uArcShape,y),l.bindVertexArray(R),l.drawArrays(l.TRIANGLES,0,3))},P=H=>{if(K=0,he)return;let W=o.current,w=Ee((H-I)/1e3||0,0,.05);I=Math.max(I,H);let k=x?.2:1;j+=w*W.speed*k,W.active&&!M&&(N=0),M=W.active,C+=((W.active?1:0)-C)*(1-Math.exp(-w/(W.active?.28:.4))),W.active&&(N=x?1:Math.min(1,N+w/.9)),z+=((W.light?1:0)-z)*(1-Math.exp(-w/.25));let re=W.interactive&&A.near&&W.active;re&&T.power<.01&&(T.x=A.x,T.y=A.y,T.vx=0,T.vy=0),T.vx+=((A.x-T.x)*120-T.vx*19)*w,T.vy+=((A.y-T.y)*120-T.vy*19)*w,T.x+=T.vx*w,T.y+=T.vy*w,T.power+=((re?1:0)-T.power)*(1-Math.exp(-w/(re?.3:.55)));for(let Y=D.length-1;Y>=0;Y--)j-D[Y].born>D[Y].life&&D.splice(Y,1);if(!x&&W.active&&N>=1&&W.arcs>0&&D.length<4){let Y=w*W.speed*W.arcs;Math.random()<Y*5*T.power?D.push(F(j,jr(S,T.x-v.width/2,T.y-v.height/2))):Math.random()<Y*(.6+S.perimeter/2400)&&D.push(F(j,null))}let le=C*C*(3-2*C);for(let Y=0;Y<4;Y++){let ne=Y*4,ae=D[Y];if(!ae){y[ne+1]=0;continue}let pe=Ee((j-ae.born)/ae.life,0,1);E[ne]=ae.ax+v.width/2+64,E[ne+1]=ae.ay+v.height/2+64,E[ne+2]=ae.bx+v.width/2+64,E[ne+3]=ae.by+v.height/2+64,y[ne]=ae.bow,y[ne+1]=Math.sin(Math.PI*pe)*le,y[ne+2]=ae.seed}for(let Y=_.length-1;Y>=0;Y--)H-_[Y].born>2200&&_.splice(Y,1);for(let Y=0;Y<3;Y++){let ne=Y*4,ae=_[Y];if(!ae){b[ne+2]=0;continue}b[ne]=ae.s,b[ne+1]=(H-ae.born)/1e3,b[ne+2]=1}L(W,T.power*(W.interactive?1:0)),(C>.002||W.active||D.length>0)&&Q&&V&&(K=requestAnimationFrame(P))},U=()=>{K||he||!Q||!V||(I=performance.now(),K=requestAnimationFrame(P))};h.current=()=>{oe(),U()};let Z=H=>{let W=p.getBoundingClientRect();A.x=H.clientX-W.left,A.y=H.clientY-W.top,A.over=A.x>=0&&A.y>=0&&A.x<=W.width&&A.y<=W.height,A.near=A.x>=-64/2&&A.y>=-64/2&&A.x<=W.width+64/2&&A.y<=W.height+64/2},ee=H=>{Z(H),A.near&&U()},X=H=>{Z(H);let W=o.current;if(!A.over||!W.interactive||!W.active||x)return;let w=jr(S,A.x-v.width/2,A.y-v.height/2);_.push({s:w,born:performance.now()}),_.length>3&&_.shift(),D.length<4&&D.push(F(j,w)),U()},te=()=>{A.over=!1,A.near=!1};window.addEventListener("pointermove",ee,{passive:!0}),window.addEventListener("pointerdown",X,{passive:!0}),document.documentElement.addEventListener("pointerleave",te);let G=H=>{H.preventDefault(),he=!0,cancelAnimationFrame(K),K=0},B=()=>c(H=>H+1);m.addEventListener("webglcontextlost",G),m.addEventListener("webglcontextrestored",B);let se=new ResizeObserver(()=>{oe(),U()});se.observe(p);let de=new IntersectionObserver(H=>{Q=H.some(W=>W.isIntersecting),U()});de.observe(p);let ie=()=>{V=document.visibilityState!=="hidden",U()};return document.addEventListener("visibilitychange",ie),oe(),U(),()=>{cancelAnimationFrame(K),h.current=null,se.disconnect(),de.disconnect(),window.removeEventListener("pointermove",ee),window.removeEventListener("pointerdown",X),document.documentElement.removeEventListener("pointerleave",te),document.removeEventListener("visibilitychange",ie),m.removeEventListener("webglcontextlost",G),m.removeEventListener("webglcontextrestored",B),l.isContextLost()||(l.deleteVertexArray(R),l.deleteProgram(g.program))}})()},c=p=>{f&&f(),u=p(u),d()};return d(),{set(p){Object.assign(r,p),o.current=i(),h.current?.()},destroy(){f&&f(),f=null;try{n.getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext()}catch{}n.remove(),t.classList.remove("electric-border")}}}var Vi=`#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`,Xi=`#version 300 es
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
}`,Qr=[[0,1],[-11.5,.77],[9.5,.95],[-53.5,.79],[39.5,.77],[16,.81],[-16.3,.92],[13.3,.96],[3,1.01],[1,.68],[1,1.15],[142.5,.51],[113.6,.28],[-7.5,.13],[-2.7,.32],[7.5,.81]],$r=.78,Zr=2048,mt=1.25,Ye=5,be=(t,e,r)=>Math.min(r,Math.max(e,t)),Yi=t=>1-Math.pow(1-be(t,0,1),3),ji=t=>{let i=8*Math.sqrt(.6155999999999999);return 1-Math.exp(-.62*8*t)*(Math.cos(i*t)+.62*8/i*Math.sin(i*t))},Ki=([t,e,r])=>{let i=Math.max(t,e,r),s=Math.min(t,e,r),n=i-s,a=0;return n>0&&(i===t?a=(e-r)/n%6:i===e?a=(r-t)/n+2:a=(t-e)/n+4),[(a*60+360)%360,i>0?n/i:0]},Qi=(t,e)=>{let r=(t%360+360)%360/60,i=e,s=i*(1-Math.abs(r%2-1)),n=1-i,[a,h,o]=r<1?[i,s,0]:r<2?[s,i,0]:r<3?[0,i,s]:r<4?[0,s,i]:r<5?[s,0,i]:[i,0,s];return[a+n,h+n,o+n]},Jr=t=>{let[e,r]=Ki(t),i=r/$r,s=new Float32Array(Qr.length*3);return Qr.forEach(([n,a],h)=>{s.set(Qi(e+n,be($r*a*i,0,1)),h*3)}),s},ei=(t,e,r)=>{let i=t.createShader(e);return i?(t.shaderSource(i,r),t.compileShader(i),t.getShaderParameter(i,t.COMPILE_STATUS)?i:(t.deleteShader(i),null)):null},$i=(t,e,r)=>{let i=ei(t,t.VERTEX_SHADER,e),s=ei(t,t.FRAGMENT_SHADER,r),n=t.createProgram();return!i||!s||!n?null:(t.attachShader(n,i),t.attachShader(n,s),t.linkProgram(n),t.deleteShader(i),t.deleteShader(s),t.getProgramParameter(n,t.LINK_STATUS)?n:(t.deleteProgram(n),null))},Zi=(t,e,r)=>{let i={};for(let s of r)i[s]=t.getUniformLocation(e,s);return i},Ji={beamPosition:.6,surfaceLevel:1,color:"#3847ff",intensity:1.8,beamWidth:1.5,flare:1.5,spread:1.5,spill:1,fog:.2,dust:1.6,streaks:1.5,dots:1,pulse:1.5,speed:1.5,seed:3,mouseInteraction:!0,revealImage:void 0,revealRadius:220,revealOpacity:.6,intro:!0,theme:"dark",paused:!1,dpr:void 0};function ti(t,e={}){let r={...Ji,...e},i=()=>{let{surfaceRef:f,beamPosition:d,surfaceLevel:c,color:p,intensity:m,beamWidth:l,flare:g,spread:x,spill:R,fog:E,dust:y,streaks:b,dots:v,pulse:A,speed:T,seed:D,mouseInteraction:_,revealImage:O,revealRadius:C,revealOpacity:N,intro:M,theme:z,paused:S,dpr:j}=r;return{surfaceRef:f,beamPosition:be(d,0,1),surfaceLevel:be(c,0,1),color:String(p),intensity:Math.max(0,m),beamWidth:be(l,.2,5),flare:be(g,.2,4),spread:be(x,.1,4),spill:Math.max(0,R),fog:Math.max(0,E),dust:Math.max(0,y),streaks:Math.max(0,b),dots:Math.max(0,v),pulse:Math.max(0,A),speed:T,seed:D,mouseInteraction:_,revealImage:O,revealRadius:Math.max(1,C),revealOpacity:be(N,0,1),intro:M,theme:z,paused:S,dpr:j}},s={current:t},n=document.createElement("canvas");n.className="laser-flow-canvas",n.setAttribute("aria-hidden","true"),t.classList.add("laser-flow-container"),t.appendChild(n);let a={current:n},h={current:null},o={current:i()},u=(()=>{let f=s.current,d=a.current,c=d?.getContext("webgl2",{alpha:!0,premultipliedAlpha:!0,antialias:!1,depth:!1,stencil:!1});if(!f||!d||!c)return;let p=$i(c,Vi,Xi);if(!p)return;let m=Zi(c,p,["uResolution","uDpr","uScale","uTime","uBeamX","uSurface","uRadius","uIntro","uPour","uRun","uLens","uReveal","uRevealMap","uRevealInfo","uAtmosphere","uAmount","uShape","uExtra","uTheme","uTint"]),l=c.createVertexArray(),g=c.createBuffer();c.bindVertexArray(l),c.bindBuffer(c.ARRAY_BUFFER,g),c.bufferData(c.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),c.STATIC_DRAW);let x=c.getAttribLocation(p,"aPosition");c.enableVertexAttribArray(x),c.vertexAttribPointer(x,2,c.FLOAT,!1,0,0),c.bindVertexArray(null);let R=c.createTexture();c.bindTexture(c.TEXTURE_2D,R),c.texImage2D(c.TEXTURE_2D,0,c.RGBA,1,1,0,c.RGBA,c.UNSIGNED_BYTE,new Uint8Array([0,0,0,0])),c.texParameteri(c.TEXTURE_2D,c.TEXTURE_MIN_FILTER,c.LINEAR),c.texParameteri(c.TEXTURE_2D,c.TEXTURE_MAG_FILTER,c.LINEAR),c.texParameteri(c.TEXTURE_2D,c.TEXTURE_WRAP_S,c.CLAMP_TO_EDGE),c.texParameteri(c.TEXTURE_2D,c.TEXTURE_WRAP_T,c.CLAMP_TO_EDGE);let E=document.createElement("canvas");E.width=1,E.height=1;let y=E.getContext("2d",{willReadFrequently:!0}),b=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches??!1,v={time:0,introTime:o.current.intro&&!b?0:Ye,width:1,height:1,ratio:1,colorKey:"",tints:Jr([.22,.28,1]),observed:null,pointer:{x:0,y:0,inside:!1},lens:{x:0,y:0,vx:0,vy:0,strength:0,placed:!1},reveal:{src:"",ready:!1,width:1,height:1,image:null}},A=0,T=0,D=!0,_=!0,O=F=>{if(!y)return[.22,.28,1];y.clearRect(0,0,1,1),y.fillStyle="#3847ff",y.fillStyle=F,y.fillRect(0,0,1,1);let[L,P,U]=y.getImageData(0,0,1,1).data;return[L/255,P/255,U/255]},C=F=>{F.color!==v.colorKey&&(v.colorKey=F.color,v.tints=Jr(O(F.color)))},N=F=>{let L=F.revealImage?String(F.revealImage):"",P=v.reveal;if(L===P.src||(P.src=L,P.ready=!1,P.image&&(P.image.onload=null),!L))return;let U=new Image;U.crossOrigin="anonymous",U.decoding="async",U.onload=()=>{if(!_||P.src!==L)return;let Z=U.naturalWidth||U.width||1,ee=U.naturalHeight||U.height||1,X=Math.min(1,2048/Math.max(Z,ee)),te=document.createElement("canvas");te.width=Math.max(1,Math.round(Z*X)),te.height=Math.max(1,Math.round(ee*X)),te.getContext("2d")?.drawImage(U,0,0,te.width,te.height),c.bindTexture(c.TEXTURE_2D,R),c.pixelStorei(c.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!0),c.texImage2D(c.TEXTURE_2D,0,c.RGBA,c.RGBA,c.UNSIGNED_BYTE,te),c.pixelStorei(c.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),P.width=te.width,P.height=te.height,P.ready=!0,h.current?.()},U.src=L,P.image=U},M=(F,L,P)=>{let U=F.surfaceRef?.current??null;if(U!==v.observed&&(v.observed&&he.unobserve(v.observed),U&&he.observe(U),v.observed=U),U){let Z=f.getBoundingClientRect(),ee=U.getBoundingClientRect();if(ee.width>0){let X=getComputedStyle(U),te=Math.max(parseFloat(X.borderTopLeftRadius)||0,parseFloat(X.borderTopRightRadius)||0);return{left:ee.left-Z.left,top:ee.top-Z.top,right:ee.right-Z.left,bottom:ee.bottom-Z.top,radius:Math.min(te,ee.width/2,ee.height/2),real:!0}}}return{left:-L*2,top:F.surfaceLevel*P,right:L*3,bottom:P*3,radius:0,real:!1}},z=()=>{let F=Math.max(1,f.clientWidth),L=Math.max(1,f.clientHeight),P=o.current,U=Math.min(P.dpr||window.devicePixelRatio||1,2),Z=Math.max(F,L)*U,ee=Z>Zr?U*Zr/Z:U,X=Math.max(1,Math.round(F*ee)),te=Math.max(1,Math.round(L*ee));(d.width!==X||d.height!==te)&&(d.width=X,d.height=te),v.width=F,v.height=L,v.ratio=d.width/F,S()},S=()=>{let F=o.current;C(F);let{width:L,height:P}=v,U=Math.max(.2,Math.min(L/585,P/507)),Z=M(F,L,P),ee=F.beamPosition*L;if(Z.real){let $=Z.radius+6;ee>=Z.left&&ee<=Z.right?ee=be(ee,Z.left+$,Z.right-$):Z={left:-L*2,top:P,right:L*3,bottom:P*3,radius:0,real:!1}}let X=-.15*P,te=Z.top-X+.3*P,G=v.introTime,B=G>=Ye,se=B?Z.top+.3*P:X+te*Math.pow(be(G/mt,0,1),1.3),de=mt*Math.pow(Math.max(0,Z.top-X)/te,1/1.3),ie=G-de,H=B?1:ie<=0?0:ji(ie),W=B||ie<=0?0:Math.exp(-ie/.35)*(1-Math.exp(-ie/.05)),w=F.spread*250*1.3+80,k=B?1e5:ie<=0?-40:w*(1-Math.exp(-1.15*ie)),re=B||ie<=0?0:Math.exp(-1.15*ie)*(1-Math.exp(-ie/.08)),le=$=>{if(B)return[1e3,1];if(ie<=0)return[-$,0];let fe=Math.min($,w*.97),ge=-Math.log(1-fe/w)/1.15,ve=ie-ge,Ae=be((ve+.15)/.8,0,1),ke=Ae*Ae*Ae*(Ae*(Ae*6-15)+10);return ve<=0?[k-fe,ke]:[1.15*(w-fe)*ve+260*ve*ve,ke]},[ce,Y]=le((ee-Z.left)/U),[ne,ae]=le((Z.right-ee)/U),pe=B?1:ie<=0?.3*Yi(G/mt):.3+.7*(1-Math.exp(-1.3*ie)),me=Number(F.seed)||0;c.viewport(0,0,d.width,d.height),c.clearColor(0,0,0,0),c.clear(c.COLOR_BUFFER_BIT),c.useProgram(p),c.uniform2f(m.uResolution,L,P),c.uniform1f(m.uDpr,v.ratio),c.uniform1f(m.uScale,U),c.uniform1f(m.uTime,v.time),c.uniform1f(m.uBeamX,ee),c.uniform4f(m.uSurface,Z.left,Z.top,Z.right,Z.bottom),c.uniform1f(m.uRadius,Z.radius),c.uniform3f(m.uIntro,se,H,W),c.uniform4f(m.uPour,ce,ne,Y,ae),c.uniform2f(m.uRun,k,re),c.uniform4f(m.uLens,v.lens.x,v.lens.y,95*U,v.lens.strength),N(F);let{reveal:ue}=v,Me=Math.max(L/ue.width,P/ue.height),q=ue.width*Me,J=ue.height*Me;c.activeTexture(c.TEXTURE0),c.bindTexture(c.TEXTURE_2D,R),c.uniform1i(m.uReveal,0),c.uniform4f(m.uRevealMap,1/q,1/J,(q-L)/2/q,(J-P)/2/J),c.uniform2f(m.uRevealInfo,F.revealRadius,ue.ready?F.revealOpacity:0),c.uniform1f(m.uAtmosphere,pe),c.uniform4f(m.uAmount,F.intensity,F.fog,F.dust,F.streaks),c.uniform4f(m.uShape,F.beamWidth,F.flare,F.spread,F.spill),c.uniform4f(m.uExtra,F.pulse,F.dots,34.34+me*7.31,11.58+me*3.17),c.uniform1f(m.uTheme,F.theme==="light"?1:0),c.uniform3fv(m.uTint,v.tints),c.bindVertexArray(l),c.drawArrays(c.TRIANGLES,0,3),c.bindVertexArray(null)},j=F=>{if(A=0,!_||!D||document.hidden)return;let L=o.current,P=T?Math.min(.05,(F-T)/1e3):1/60;T=F;let U=!L.paused&&!b;U&&(v.time+=P*L.speed);let Z=v.introTime<Ye;Z&&(v.introTime=Math.min(Ye,v.introTime+P));let{pointer:ee,lens:X}=v,te=L.mouseInteraction&&ee.inside&&!b;te&&!X.placed&&(X.x=ee.x,X.y=ee.y,X.vx=0,X.vy=0,X.placed=!0);let G=120*(ee.x-X.x)-19*X.vx,B=120*(ee.y-X.y)-19*X.vy;X.vx+=G*P,X.vy+=B*P,X.x+=X.vx*P,X.y+=X.vy*P;let se=te?1:0;X.strength+=(se-X.strength)*(1-Math.exp(-P/(se>X.strength?.3:.55))),X.strength<.001&&!te&&(X.placed=!1),S();let de=Math.abs(v.lens.strength-(L.mouseInteraction&&v.pointer.inside?1:0))>.002||Math.hypot(v.lens.vx,v.lens.vy)>.5;U||Z||de?A=requestAnimationFrame(j):T=0},K=()=>{!A&&_&&D&&!document.hidden&&(A=requestAnimationFrame(j))},I=F=>{let L=f.getBoundingClientRect(),P=F.clientX-L.left,U=F.clientY-L.top;v.pointer.x=P,v.pointer.y=U,v.pointer.inside=P>=0&&U>=0&&P<=L.width&&U<=L.height,K()},Q=()=>{v.pointer.inside=!1,K()},V=()=>{T=0,K()},he=new ResizeObserver(z);he.observe(f);let oe=new IntersectionObserver(F=>{D=F.some(L=>L.isIntersecting),D&&(T=0,K())});return oe.observe(f),window.addEventListener("pointermove",I,{passive:!0}),document.documentElement.addEventListener("pointerleave",Q),document.addEventListener("visibilitychange",V),z(),K(),h.current=()=>{A||S(),K()},()=>{_=!1,cancelAnimationFrame(A),h.current=null,he.disconnect(),oe.disconnect(),window.removeEventListener("pointermove",I),document.documentElement.removeEventListener("pointerleave",Q),document.removeEventListener("visibilitychange",V),c.deleteTexture(R),c.deleteBuffer(g),c.deleteVertexArray(l),c.deleteProgram(p)}})();return{set(f){Object.assign(r,f),o.current=i(),h.current?.()},destroy(){u&&u();try{n.getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext()}catch{}n.remove()}}}var es=`#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`,ts=`#version 300 es
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
`,rs=t=>{let e=String(t).replace("#","").trim();e.length===3&&(e=e.replace(/(.)/g,"$1$1"));let r=parseInt(e.slice(0,6),16);return isFinite(r)?[(r>>16&255)/255,(r>>8&255)/255,(r&255)/255]:[1,1,1]},Te=(t,e,r)=>Math.min(r,Math.max(e,t)),ri=(t,e,r)=>{let i=t.createShader(e);return t.shaderSource(i,r),t.compileShader(i),i},is=t=>{let e=t.createProgram();return t.attachShader(e,ri(t,t.VERTEX_SHADER,es)),t.attachShader(e,ri(t,t.FRAGMENT_SHADER,ts)),t.bindAttribLocation(e,0,"position"),t.linkProgram(e),t.getProgramParameter(e,t.LINK_STATUS)?e:null},ss=(t,e,r)=>{let i=Math.min(1,Math.max(0,(r-t)/(e-t)));return i*i*(3-2*i)},ns=t=>{let e=ss(-.8,-.3,.6*Math.sin(t*2.7)+.5*Math.sin(t*1.53+1.2)),r=Math.max(0,Math.sin(t*17+1.6*Math.sin(t*5.3))),i=.6+.4*Math.sin(t*3.7+.7);return e*(.35+.65*r)*(.25+i)},ii=["#d95b56","#ba5046","#ffa24c","#ffe0b3","#93f1ff","#3569fa","#193d9b"],as={colors:ii,count:3,speed:1,amplitude:1,waviness:1,thickness:1,glow:1,taper:1,spread:1,hueShift:0,intensity:1,saturation:1,opacity:1,scale:1,glass:!0,refraction:1,dispersion:1,glassSize:1,rim:1,energy:.65,listening:!1,level:void 0,interactive:!0,clickPulse:!0,intro:!0,lightMode:!1,maxDevicePixelRatio:2,className:""};function si(t,e={}){let r={...as,...e},i={current:t},s={current:r};t.classList.add("strands-container");let n=(()=>{let a=i.current;if(!a)return;let h=document.createElement("canvas");h.style.display="block",h.style.width="100%",h.style.height="100%",h.setAttribute("aria-hidden","true");let o=h.getContext("webgl2",{alpha:!0,premultipliedAlpha:!0,antialias:!1});if(!o)return;a.appendChild(h);let u=null,f=null,d={},c=["uResolution","uMotion","uLevel","uColors","uCount","uAmplitude","uWaviness","uThickness","uGlow","uTaper","uSpread","uHueShift","uIntensity","uSaturation","uScale","uGlass","uRadius","uRefraction","uDispersion","uRim","uLean","uIntro","uPulse","uLight","uOpacity"],p=()=>{let M=is(o);return M?(u=M,f=o.createBuffer(),o.bindBuffer(o.ARRAY_BUFFER,f),o.bufferData(o.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),o.STATIC_DRAW),o.enableVertexAttribArray(0),o.vertexAttribPointer(0,2,o.FLOAT,!1,0,0),o.useProgram(M),d=Object.fromEntries(c.map(z=>[z,o.getUniformLocation(M,z)])),o.disable(o.BLEND),o.clearColor(0,0,0,0),!0):!1};if(!p()){h.remove();return}let m=typeof window.matchMedia=="function"?window.matchMedia("(prefers-reduced-motion: reduce)"):null,l={clock:0,pace:0,activity:0,hover:0,hoverTarget:0,burst:0,lean:[0,0],leanTarget:[0,0],pulse:0,pulseV:0,introStart:-1,intro:s.current.intro?0:1,visible:typeof IntersectionObserver>"u",lost:!1,raf:0,last:0,width:0,height:0,speechT:0,paletteKey:"",palette:{flat:new Float32Array(24),count:1}},g=()=>{let M=Math.min(window.devicePixelRatio||1,Math.max(.5,s.current.maxDevicePixelRatio)),z=Math.max(1,Math.round(a.clientWidth*M)),S=Math.max(1,Math.round(a.clientHeight*M));(z!==l.width||S!==l.height)&&(l.width=z,l.height=S,h.width=z,h.height=S)},x=M=>{let z=M.join(",");if(z===l.paletteKey)return;l.paletteKey=z;let S=(M.length?M:ii).slice(0,8).map(rs),j=new Float32Array(24);for(let K=0;K<7;K++){let I=S.length>1?K/6*(S.length-1):0,Q=Math.floor(I),V=Math.min(Q+1,S.length-1),he=I-Q;j.set(S[Q].map((oe,F)=>oe+(S[V][F]-oe)*he),K*3)}l.palette={flat:j,count:7}},R=()=>{if(l.lost||!u)return;let M=s.current;x(Array.isArray(M.colors)?M.colors:[]),o.viewport(0,0,l.width,l.height),o.uniform2f(d.uResolution,l.width,l.height);let z=l.clock,S=.75+.45*l.pace;o.uniform3f(d.uMotion,(.26*Math.sin(.53*z)+.1*Math.sin(1.19*z+1.3))*S,1+(.06*Math.sin(.71*z)+.035*Math.sin(1.37*z+.4))*S,.06*Math.sin(.41*z+2)*S),o.uniform1f(d.uLevel,Te(l.activity,0,1)),o.uniform3fv(d.uColors,l.palette.flat),o.uniform1i(d.uCount,Te(Math.round(M.count),1,3)),o.uniform1f(d.uAmplitude,M.amplitude),o.uniform1f(d.uWaviness,M.waviness),o.uniform1f(d.uThickness,M.thickness),o.uniform1f(d.uGlow,M.glow),o.uniform1f(d.uTaper,Math.max(.05,M.taper)),o.uniform1f(d.uSpread,M.spread),o.uniform1f(d.uHueShift,M.hueShift),o.uniform1f(d.uIntensity,M.intensity),o.uniform1f(d.uSaturation,M.saturation),o.uniform1f(d.uScale,Math.max(.05,M.scale)),o.uniform1f(d.uGlass,M.glass?1:0),o.uniform1f(d.uRadius,.42*M.glassSize),o.uniform1f(d.uRefraction,M.refraction),o.uniform1f(d.uDispersion,M.dispersion),o.uniform1f(d.uRim,M.rim),o.uniform2f(d.uLean,l.lean[0],l.lean[1]),o.uniform1f(d.uIntro,l.intro),o.uniform1f(d.uPulse,l.pulse),o.uniform1f(d.uLight,M.lightMode?1:0),o.uniform1f(d.uOpacity,M.opacity),o.clear(o.COLOR_BUFFER_BIT),o.drawArrays(o.TRIANGLES,0,3)},E=M=>{l.raf=0;let z=s.current,S=l.last?Te((M-l.last)/1e3,0,.05):0;l.last=M;let j=!!m?.matches;if(l.introStart<0&&l.visible&&(l.introStart=M),z.intro&&!j&&l.introStart>=0){let V=Te((M-l.introStart)/1400,0,1);l.intro=1-Math.pow(1-V,3)}else l.intro=1;l.hover+=(l.hoverTarget-l.hover)*(1-Math.exp(-S/(l.hoverTarget>l.hover?.25:.6)));for(let V=0;V<2;V++)l.lean[V]+=(l.leanTarget[V]-l.lean[V])*(1-Math.exp(-S/.35));l.pulseV+=(-170*l.pulse-14*l.pulseV)*S,l.pulse+=l.pulseV*S,l.burst*=Math.exp(-S/.45),z.listening&&!j&&(l.speechT+=S);let K=typeof z.level=="number"?Te(z.level,0,1):z.listening&&!j?ns(l.speechT):0,I=Math.min(1.2,Math.max(Te(z.energy,0,1),K)+l.hover*.18+l.burst);l.activity+=(I-l.activity)*(1-Math.exp(-S/(I>l.activity?.12:.4))),l.pace+=(Math.min(1,l.activity)-l.pace)*(1-Math.exp(-S/.8)),j||(l.clock+=S*z.speed*(.6+1.6*l.pace)),R();let Q=j&&Math.abs(l.activity-I)<.001&&Math.abs(l.pulse)<.001&&Math.abs(l.pulseV)<.001&&l.burst<.001&&Math.abs(l.hover-l.hoverTarget)<.001&&Math.abs(l.lean[0]-l.leanTarget[0])<.001&&Math.abs(l.lean[1]-l.leanTarget[1])<.001;l.visible&&!document.hidden&&!l.lost&&!Q&&(l.raf=requestAnimationFrame(E))},y=()=>{!l.raf&&l.visible&&!l.lost&&(l.last=0,l.raf=requestAnimationFrame(E))},b=M=>{let z=a.getBoundingClientRect(),S=Math.min(z.width,z.height)||1;return[(M.clientX-z.left-z.width/2)/(S/2),(M.clientY-z.top-z.height/2)/(S/2)]},v=M=>{if(!s.current.interactive)return;let[z,S]=b(M);l.hoverTarget=Te(1.6-Math.hypot(z,S),0,1),l.leanTarget=[Te(z,-1.2,1.2)*.8,Te(-S,-1.2,1.2)*.8],y()},A=()=>{l.hoverTarget=0,l.leanTarget=[0,0],y()},T=()=>{s.current.clickPulse&&(l.pulseV+=5,l.burst=Math.min(1.2,l.burst+.9),y())},D=M=>{M.preventDefault(),l.lost=!0,l.raf&&cancelAnimationFrame(l.raf),l.raf=0},_=()=>{l.lost=!1,p()&&y()};h.addEventListener("webglcontextlost",D),h.addEventListener("webglcontextrestored",_),a.addEventListener("pointermove",v),a.addEventListener("pointerleave",A),a.addEventListener("pointerdown",T);let O=new ResizeObserver(()=>{g(),R()});O.observe(a),g();let C=null;typeof IntersectionObserver<"u"&&(C=new IntersectionObserver(M=>{l.visible=M[M.length-1].isIntersecting,l.visible&&y()}),C.observe(a));let N=()=>{document.hidden||y()};return document.addEventListener("visibilitychange",N),y(),()=>{l.raf&&cancelAnimationFrame(l.raf),h.removeEventListener("webglcontextlost",D),h.removeEventListener("webglcontextrestored",_),a.removeEventListener("pointermove",v),a.removeEventListener("pointerleave",A),a.removeEventListener("pointerdown",T),document.removeEventListener("visibilitychange",N),O.disconnect(),C?.disconnect(),u&&o.deleteProgram(u),f&&o.deleteBuffer(f),o.getExtension("WEBGL_lose_context")?.loseContext(),h.remove()}})();return{set(a){Object.assign(r,a)},destroy(){n&&n()}}}window.NovaUI=window.NovaUI||{};Object.assign(window.NovaUI,{electricLogo:Br,ditherVeil:Vr,electricBorder:Kr,laserFlow:ti,strands:si});})();
