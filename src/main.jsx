import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Camera, ChevronDown, Heart, Menu, Search, ShoppingBag, Sparkles, Upload, User, X, ZoomIn } from 'lucide-react'
import './styles.css'
import { categories, getProduct, getVariant, products } from './catalog/catalog.js'
import { cartCount, cartReducer, loadCart, saveCart } from './cart/cart.js'
import { orderedLookLayers, removeLookLayer, toggleLookLayer, updateLookLayer, upsertLookLayer } from './try-on/state/lookState.js'
import { CAMERA_COPY, CAMERA_STATES, cameraErrorState, requestCameraStream } from './try-on/camera/cameraState.js'
import { chooseQualityTier, detectCapabilities } from './try-on/core/capabilities.js'

const fmt = n => `৳ ${n.toLocaleString('en-BD')}.00`

const tryOnModels = [
  { id: 'fair', name: 'Fair', src: '/assets/model-fair.png' },
  { id: 'light', name: 'Light', src: '/assets/model-light.png' },
  { id: 'medium', name: 'Medium', src: '/assets/model-medium.png' },
  { id: 'tan', name: 'Tan', src: '/assets/model-tan.png' },
  { id: 'deep', name: 'Deep', src: '/assets/model-deep.png' },
]

function ProductArt({ type, mini=false }) {
  return <div className={`product-art ${type} ${mini ? 'mini' : ''}`} aria-hidden="true"><i/><b/><span/></div>
}

function Header({ cart, openTryOn, openBag }) {
  const [menu, setMenu] = useState(false)
  return <>
    <div className="announcement">Free delivery on orders over ৳ 3,000 <span>•</span> Authentic products, always</div>
    <header>
      <button className="icon-btn menu-btn" onClick={() => setMenu(!menu)} aria-label="Menu"><Menu/></button>
      <a href="#" className="logo"><span>Go Go</span><strong>GORGEOUS</strong><em>BEAUTY, MADE PERSONAL</em></a>
      <div className="search"><Search/><input placeholder="Search your beauty favourites..."/></div>
      <div className="header-actions"><button><User/><span>Sign in</span></button><button><Heart/><span>Wishlist</span></button><button className="bag" onClick={openBag} aria-label={`Bag with ${cart} items`}><ShoppingBag/><span>Bag</span>{cart > 0 && <b>{cart}</b>}</button></div>
    </header>
    <nav className={menu ? 'open' : ''}>
      <button className="nav-close" onClick={() => setMenu(false)}><X/></button>
      <a href="#new">New & Trending</a><a href="#shop">Make Up <ChevronDown/></a><a href="#shop">Brands <ChevronDown/></a><a href="#shop">Skin Care</a><a href="#shop">Hair Care</a><a href="#shop">Fragrance</a><a href="#about">About Us</a>
      <button className="try-nav" onClick={openTryOn}><Sparkles/> Virtual Try-On</button>
    </nav>
  </>
}

function Hero({ openTryOn }) {
  return <section className="hero" id="new">
    <img src="/assets/gorgeous-hero.png" alt="Beauty model wearing berry lipstick and winged eyeliner" />
    <div className="hero-copy"><span className="eyebrow">YOUR BEAUTY. YOUR WAY.</span><h1>Try the look<br/><i>before you love it.</i></h1><p>Discover shades made for you. See lipstick, concealer and eyeliner come alive—in real time.</p><div><button className="primary" onClick={openTryOn}>Try it now <Sparkles/></button><a className="secondary" href="#shop">Shop the edit</a></div><small><i/> Powered by intelligent face mapping</small></div>
  </section>
}

function ProductCard({ product, onTry, onAdd }) {
  const [liked, setLiked] = useState(false)
  const [selectedShade, setSelectedShade] = useState(product.shades[0])
  return <article className="product-card">
    <div className="product-visual"><span className="tag">{product.oldPrice ? 'SALE' : 'NEW'}</span><button className={liked ? 'liked' : ''} onClick={()=>setLiked(!liked)} aria-label="Add to wishlist"><Heart fill={liked?'currentColor':'none'}/></button><ProductArt type={product.art}/><button className="quick" onClick={()=>onTry(product)}><Sparkles/> Try it on</button></div>
    <div className="product-info"><small>{product.brand}</small><h3>{product.name}</h3><div className="stars" aria-label={`${product.rating} out of 5 stars`}>★★★★★ <span>{product.rating}</span></div><div className="shade-row" aria-label="Choose shade">{product.shades.slice(0,4).map(s=><button key={s.id} className={selectedShade.id===s.id?'active':''} style={{background:s.c}} title={s.n} aria-label={s.n} onClick={()=>setSelectedShade(s)}/>)}<span>{selectedShade.n}</span></div><div className="price"><strong>{fmt(product.price)}</strong>{product.oldPrice && <del>{fmt(product.oldPrice)}</del>}</div><button className="add" onClick={()=>onAdd(product,selectedShade)}>Add {selectedShade.n} to bag</button></div>
  </article>
}

class TryOnErrorBoundary extends React.Component {
  constructor(props){super(props);this.state={failed:false}}
  static getDerivedStateFromError(){return{failed:true}}
  componentDidCatch(error){if(import.meta.env.DEV)console.error('Try-On boundary',error?.message)}
  render(){return this.state.failed?<div className="try-overlay" role="dialog" aria-modal="true" aria-labelledby="try-failed-title"><div className="try-fallback"><Sparkles/><h2 id="try-failed-title">The mirror needs a moment.</h2><p>Your store and bag are safe. Close the mirror and try again, or continue shopping.</p><button onClick={this.props.onClose}>Close mirror</button></div></div>:this.props.children}
}

const lipOuter=[61,185,40,39,37,0,267,269,270,409,291,375,321,405,314,17,84,181,91,146]
const lipInner=[78,191,80,81,82,13,312,311,310,415,308,324,318,402,317,14,87,178,88,95]
const leftEye=[33,246,161,160,159,158,157,173,133,155,154,153,145,144,163,7]
const rightEye=[263,466,388,387,386,385,384,398,362,382,381,380,374,373,390,249]
const faceOval=[10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109]

function TryOn({ product: initial, initialShade, onClose, onAdd }) {
  const [product, setProduct] = useState(initial || products[0])
  const [shade, setShade] = useState(initialShade || (initial || products[0]).shades[0])
  const [look, setLook] = useState(()=>upsertLookLayer({},initial||products[0],initialShade||(initial||products[0]).shades[0],82))
  const [showBefore, setShowBefore] = useState(false)
  const [mode, setMode] = useState('model')
  const [selectedModel, setSelectedModel] = useState(tryOnModels[2])
  const [intensity, setIntensity] = useState(82)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [debugMask, setDebugMask] = useState(false)
  const [aiStatus, setAiStatus] = useState('Landmark tracking')
  const [uploadedUrl, setUploadedUrl] = useState('')
  const [cameraState,setCameraState]=useState(CAMERA_STATES.IDLE)
  const capabilities=useMemo(()=>detectCapabilities(),[]),qualityTier=useMemo(()=>chooseQualityTier(capabilities),[capabilities])
  const videoRef = useRef(null), canvasRef = useRef(null), imageRef = useRef(null), dialogRef=useRef(null),closeRef=useRef(null),landmarkerRef = useRef(null), landmarkerPromiseRef = useRef(null), runningModeRef = useRef('IMAGE'), lastLandmarksRef = useRef(null), rafRef = useRef(), streamRef=useRef(), makeupStateRef=useRef(),cameraSessionRef=useRef(0)
  const parserRef = useRef(null), faceModuleRef = useRef(null), segmentationRef = useRef(null), parsingRef = useRef(false), lastParseRef = useRef(0), maskCacheRef = useRef(new Map()), uploadUrlRef = useRef(null),imageRequestRef=useRef(0),staticFrameRef=useRef(null)
  makeupStateRef.current={layers:orderedLookLayers(look),showBefore}

  const switchProduct = p => {const existing=look[p.category],nextShade=existing?.productId===p.id?existing.shade:p.shades[0],nextIntensity=existing?.intensity??82;setProduct(p);setShade(nextShade);setIntensity(nextIntensity);setLook(current=>upsertLookLayer(current,p,nextShade,nextIntensity))}
  const selectShade=s=>{setShade(s);setLook(current=>upsertLookLayer(current,product,s,intensity))}
  const changeIntensity=value=>{setIntensity(value);setLook(current=>updateLookLayer(current,product.category,{intensity:value}))}
  const drawPath=(ctx, pts, ids, w, h)=>{ctx.beginPath(); ids.forEach((id,i)=>{const p=pts[id]; if(!p)return; (i?ctx.lineTo.bind(ctx):ctx.moveTo.bind(ctx))(p.x*w,p.y*h)});ctx.closePath()}
  const getParser=async()=>{if(!faceModuleRef.current)faceModuleRef.current=await import('./faceParserClient.js');if(!parserRef.current)parserRef.current=new faceModuleRef.current.FaceParser();return parserRef.current}
  const scheduleParsing=(source,mirror=false,force=false)=>{const now=performance.now(),session=cameraSessionRef.current;if(parsingRef.current||(!force&&now-lastParseRef.current<(qualityTier==='low'?500:qualityTier==='medium'?320:180)))return;parsingRef.current=true;lastParseRef.current=now;getParser().then(parser=>parser.parse(source,mirror)).then(result=>{if(session!==cameraSessionRef.current)return;segmentationRef.current=result;maskCacheRef.current.clear();setAiStatus('Face parsing active')}).catch(()=>{if(session===cameraSessionRef.current)setAiStatus('Landmark fallback')}).finally(()=>{parsingRef.current=false})}
  const paintSemanticMask=(ctx,classIds,color,opacity,w,h,blend='multiply',feather=1)=>{if(!segmentationRef.current||!faceModuleRef.current)return false;const key=`${classIds.join('-')}:${color}:${feather}`;let layer=maskCacheRef.current.get(key);if(!layer){const mask=faceModuleRef.current.createClassMask(segmentationRef.current,classIds,feather);layer=document.createElement('canvas');layer.width=mask.width;layer.height=mask.height;const layerCtx=layer.getContext('2d');layerCtx.drawImage(mask,0,0);layerCtx.globalCompositeOperation='source-in';layerCtx.fillStyle=color;layerCtx.fillRect(0,0,layer.width,layer.height);maskCacheRef.current.set(key,layer)}ctx.save();ctx.globalCompositeOperation=blend;ctx.globalAlpha=opacity;ctx.drawImage(layer,0,0,w,h);ctx.restore();return true}
  const renderMakeup=(ctx, pts, w, h)=>{
    const {layers,showBefore:before}=makeupStateRef.current
    if(before)return
    ctx.save()
    for(const {product:activeProduct,shade:activeShade,intensity:activeIntensity,enabled} of layers){
    if(!enabled)continue
    ctx.save(); const alpha=activeIntensity/100;
    if(activeProduct.category==='lipstick'){
      const labels=faceModuleRef.current?.FACE_LABELS
      const parsed=labels&&paintSemanticMask(ctx,[labels.upperLip,labels.lowerLip],activeShade.c,.82*alpha,w,h,'multiply',1.35)
      if(parsed)paintSemanticMask(ctx,[labels.upperLip,labels.lowerLip],activeShade.c,.2*alpha,w,h,'source-over',.7)
      else {const lipMask=()=>{ctx.beginPath();[lipOuter,lipInner].forEach(ring=>{ring.forEach((id,i)=>{const p=pts[id];if(!p)return;(i?ctx.lineTo.bind(ctx):ctx.moveTo.bind(ctx))(p.x*w,p.y*h)});ctx.closePath()})};ctx.filter=`blur(${Math.max(.45,w*.00055)}px)`;ctx.globalCompositeOperation='multiply';lipMask();ctx.fillStyle=activeShade.c;ctx.globalAlpha=.9*alpha;ctx.fill('evenodd');ctx.globalCompositeOperation='source-over';lipMask();ctx.fillStyle=activeShade.c;ctx.globalAlpha=.2*alpha;ctx.fill('evenodd');ctx.filter='none'}
    }
    if(activeProduct.category==='eyeliner'){
      const eyeSpecs=[{upper:[33,246,161,160,159,158,157,173,133],top:159,bottom:145},{upper:[263,466,388,387,386,385,384,398,362],top:386,bottom:374}]
      ctx.globalCompositeOperation='source-over';ctx.strokeStyle=activeShade.c;ctx.lineCap='round';ctx.lineJoin='round'
      eyeSpecs.forEach(({upper:ids,top,bottom})=>{const upper=ids.map(id=>pts[id]).filter(Boolean),outer=upper[0],inner=upper.at(-1),topPoint=pts[top],bottomPoint=pts[bottom];if(upper.length<5||!outer||!inner||!topPoint||!bottomPoint)return;const eyeWidth=Math.hypot((outer.x-inner.x)*w,(outer.y-inner.y)*h),openPx=Math.hypot((topPoint.x-bottomPoint.x)*w,(topPoint.y-bottomPoint.y)*h),openRatio=openPx/Math.max(eyeWidth,1),blinkFade=Math.max(0,Math.min(1,(openRatio-.035)/.09));if(blinkFade<=.03)return;const baseWidth=Math.max(1.25,Math.min(4.2,eyeWidth*.032))*(.72+alpha*.32);ctx.globalAlpha=(.58+.4*alpha)*blinkFade;ctx.lineWidth=baseWidth;ctx.beginPath();ctx.moveTo(outer.x*w,outer.y*h);for(let i=1;i<upper.length-1;i++){const next=upper[i+1],current=upper[i];ctx.quadraticCurveTo(current.x*w,current.y*h,(current.x+next.x)*w/2,(current.y+next.y)*h/2)}ctx.lineTo(inner.x*w,inner.y*h);ctx.stroke();const direction=outer.x<inner.x?-1:1,wingLength=Math.min(eyeWidth*.24,w*.022),wingLift=wingLength*.42;ctx.lineWidth=Math.max(1,baseWidth*.72);ctx.beginPath();ctx.moveTo(outer.x*w,outer.y*h);ctx.quadraticCurveTo(outer.x*w+direction*wingLength*.5,outer.y*h-wingLift*.25,outer.x*w+direction*wingLength,outer.y*h-wingLift);ctx.stroke()})
    }
    if(activeProduct.category==='concealer'){
      const correction=document.createElement('canvas'),cw=512,ch=512;correction.width=cw;correction.height=ch;const correctionCtx=correction.getContext('2d')
      ;[[33,133,118],[263,362,347]].forEach(([outerId,innerId,cheekId])=>{const outer=pts[outerId],inner=pts[innerId],cheek=pts[cheekId];if(!outer||!inner||!cheek)return;const eyeWidth=Math.hypot((inner.x-outer.x)*cw,(inner.y-outer.y)*ch),midX=(outer.x+inner.x)*cw/2,eyeY=(outer.y+inner.y)*ch/2,cx=midX,cy=eyeY+eyeWidth*.25,rx=Math.max(8,eyeWidth*.62),ry=Math.max(4,eyeWidth*.27),gradient=correctionCtx.createRadialGradient(cx,cy,rx*.08,cx,cy,rx);gradient.addColorStop(0,activeShade.c+'a8');gradient.addColorStop(.42,activeShade.c+'72');gradient.addColorStop(.76,activeShade.c+'2f');gradient.addColorStop(1,activeShade.c+'00');correctionCtx.save();correctionCtx.translate(cx,cy);correctionCtx.rotate((inner.y-outer.y)*.45);correctionCtx.scale(1,ry/rx);correctionCtx.beginPath();correctionCtx.arc(0,0,rx,0,Math.PI*2);correctionCtx.fillStyle=gradient;correctionCtx.fill();correctionCtx.restore()})
      if(segmentationRef.current&&faceModuleRef.current){const key='skin-clip';let skinMask=maskCacheRef.current.get(key);if(!skinMask){skinMask=faceModuleRef.current.createClassMask(segmentationRef.current,[faceModuleRef.current.FACE_LABELS.skin],1.4);maskCacheRef.current.set(key,skinMask)}correctionCtx.globalCompositeOperation='destination-in';correctionCtx.drawImage(skinMask,0,0,cw,ch)}
      ctx.globalCompositeOperation='soft-light';ctx.globalAlpha=.5+.34*alpha;ctx.drawImage(correction,0,0,w,h);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=.12*alpha;ctx.drawImage(correction,0,0,w,h)
    }
    ctx.restore()
    }
    if(debugMask&&segmentationRef.current&&faceModuleRef.current){const key='debug';let mask=maskCacheRef.current.get(key),labels=faceModuleRef.current.FACE_LABELS;if(!mask){mask=faceModuleRef.current.createClassMask(segmentationRef.current,[labels.skin,labels.upperLip,labels.lowerLip,labels.leftEye,labels.rightEye],0);maskCacheRef.current.set(key,mask)}ctx.globalCompositeOperation='source-over';ctx.globalAlpha=.26;ctx.drawImage(mask,0,0,w,h)}
    ctx.restore()
  }
  const ensureModel=async()=>{if(landmarkerRef.current)return landmarkerRef.current;if(landmarkerPromiseRef.current)return landmarkerPromiseRef.current;setLoading(true);landmarkerPromiseRef.current=(async()=>{try{const {FaceLandmarker,FilesetResolver}=await import('@mediapipe/tasks-vision');const vision=await FilesetResolver.forVisionTasks('/models/mediapipe/wasm');let instance;try{instance=await FaceLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:'/models/mediapipe/face_landmarker.task',delegate:'GPU'},runningMode:'IMAGE',numFaces:2,minFaceDetectionConfidence:.35,minFacePresenceConfidence:.35,minTrackingConfidence:.35})}catch{instance=await FaceLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:'/models/mediapipe/face_landmarker.task',delegate:'CPU'},runningMode:'IMAGE',numFaces:2,minFaceDetectionConfidence:.35,minFacePresenceConfidence:.35,minTrackingConfidence:.35})}landmarkerRef.current=instance;runningModeRef.current='IMAGE';return instance}catch(e){landmarkerPromiseRef.current=null;setError('Face model could not load. Try again or continue without virtual try-on.');throw e}finally{setLoading(false)}})();return landmarkerPromiseRef.current}
  const setLandmarkerMode=async(modeName)=>{const lm=await ensureModel();if(runningModeRef.current!==modeName){await lm.setOptions({runningMode:modeName});runningModeRef.current=modeName}return lm}
  const redrawStatic=()=>{const frame=staticFrameRef.current,c=canvasRef.current;if(!frame||!c)return;const ctx=c.getContext('2d');ctx.fillStyle='#eadfdb';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(frame.img,frame.offsetX,frame.offsetY,frame.drawW,frame.drawH);renderMakeup(ctx,frame.landmarks,c.width,c.height)}
  const processImage=async(img)=>{const request=++imageRequestRef.current,lm=await setLandmarkerMode('IMAGE');if(request!==imageRequestRef.current)return;const res=lm.detect(img);if(request!==imageRequestRef.current)return;const c=canvasRef.current;if(!c)return;const sourceW=img.naturalWidth||img.videoWidth,sourceH=img.naturalHeight||img.videoHeight;c.width=1600;c.height=900;const scale=Math.min(c.width/sourceW,c.height/sourceH),drawW=sourceW*scale,drawH=sourceH*scale,offsetX=(c.width-drawW)/2,offsetY=(c.height-drawH)/2,ctx=c.getContext('2d');ctx.fillStyle='#eadfdb';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(img,offsetX,offsetY,drawW,drawH);if(res.faceLandmarks?.[0]){try{const parser=await getParser(),parsed=await parser.parse(c);if(request!==imageRequestRef.current)return;segmentationRef.current=parsed;maskCacheRef.current.clear();setAiStatus('Face parsing active')}catch{if(request===imageRequestRef.current)setAiStatus('Landmark fallback')}if(request!==imageRequestRef.current)return;const fitted=res.faceLandmarks[0].map(p=>({...p,x:(offsetX+p.x*drawW)/c.width,y:(offsetY+p.y*drawH)/c.height}));staticFrameRef.current={img,offsetX,offsetY,drawW,drawH,landmarks:fitted};redrawStatic()}else{staticFrameRef.current=null;setError('Move closer or choose a clear, front-facing photo.')}}
  const stopCamera=()=>{cameraSessionRef.current++;imageRequestRef.current++;cancelAnimationFrame(rafRef.current);streamRef.current?.getTracks().forEach(track=>track.stop());streamRef.current=null;if(videoRef.current)videoRef.current.srcObject=null;lastLandmarksRef.current=null;segmentationRef.current=null;setCameraState(CAMERA_STATES.STOPPED)}
  const prepareCamera=()=>{stopCamera();setMode('camera');setError('');setCameraState(capabilities.camera?CAMERA_STATES.EXPLAINING_PERMISSION:CAMERA_STATES.BROWSER_UNSUPPORTED)}
  const startCamera=async()=>{
    const session=++cameraSessionRef.current
    setError('');setCameraState(CAMERA_STATES.REQUESTING_PERMISSION)
    try{
      const stream=await requestCameraStream(navigator.mediaDevices)
      if(session!==cameraSessionRef.current){stream.getTracks().forEach(track=>track.stop());return}
      streamRef.current=stream;setCameraState(CAMERA_STATES.STARTING)
      const track=stream.getVideoTracks()[0]
      track?.addEventListener('ended',()=>{if(session===cameraSessionRef.current)setCameraState(CAMERA_STATES.DEVICE_DISCONNECTED)},{once:true})
      const v=videoRef.current;if(!v)throw new Error('Video element unavailable')
      v.srcObject=stream
      if(v.readyState<1)await new Promise((resolve,reject)=>{v.addEventListener('loadedmetadata',resolve,{once:true});v.addEventListener('error',reject,{once:true})})
      if(session!==cameraSessionRef.current)return
      await v.play();setCameraState(CAMERA_STATES.WARMING_MODELS)
      const lm=await setLandmarkerMode('VIDEO');if(session!==cameraSessionRef.current)return
      let lastVideoTime=-1
      const loop=()=>{if(session!==cameraSessionRef.current||!videoRef.current||!canvasRef.current)return;const c=canvasRef.current,ctx=c.getContext('2d'),video=videoRef.current;if(video.videoWidth){if(c.width!==video.videoWidth||c.height!==video.videoHeight){c.width=video.videoWidth;c.height=video.videoHeight}ctx.save();ctx.translate(c.width,0);ctx.scale(-1,1);ctx.drawImage(video,0,0,c.width,c.height);ctx.restore();if(video.currentTime!==lastVideoTime){lastVideoTime=video.currentTime;const res=lm.detectForVideo(video,performance.now()),faces=res.faceLandmarks||[];if(faces.length>1){lastLandmarksRef.current=null;setCameraState(CAMERA_STATES.MULTIPLE_FACES)}else if(faces.length===0){lastLandmarksRef.current=null;setCameraState(CAMERA_STATES.NO_FACE)}else{setCameraState(CAMERA_STATES.READY);const detected=faces[0].map(p=>({...p,x:1-p.x})),previous=lastLandmarksRef.current;lastLandmarksRef.current=previous?detected.map((p,i)=>{const dx=p.x-previous[i].x,dy=p.y-previous[i].y,motion=Math.sqrt(dx*dx+dy*dy),follow=Math.min(.88,.22+motion*42);return{x:previous[i].x*(1-follow)+p.x*follow,y:previous[i].y*(1-follow)+p.y*follow,z:(previous[i].z||0)*(1-follow)+(p.z||0)*follow}}):detected;scheduleParsing(video,true)}}if(lastLandmarksRef.current)renderMakeup(ctx,lastLandmarksRef.current,c.width,c.height)}rafRef.current=requestAnimationFrame(loop)}
      loop()
    }catch(error){if(session!==cameraSessionRef.current)return;const state=cameraErrorState(error);setCameraState(state);setError(CAMERA_COPY[state])}
  }
  const chooseMode=m=>{stopCamera();setMode(m);setError('');if(m==='model'&&imageRef.current?.complete)processImage(imageRef.current);if(m==='camera')prepareCamera()}
  const upload=e=>{const file=e.target.files?.[0];if(!file)return;if(!file.type.startsWith('image/')||file.size>12*1024*1024){setError('Choose a valid image smaller than 12 MB.');return}chooseMode('upload');if(uploadUrlRef.current)URL.revokeObjectURL(uploadUrlRef.current);uploadUrlRef.current=URL.createObjectURL(file);setUploadedUrl(uploadUrlRef.current)}
  useEffect(()=>{if(mode!=='camera'&&imageRef.current?.complete)processImage(imageRef.current)},[selectedModel,uploadedUrl,mode])
  useEffect(()=>{if(mode!=='camera')redrawStatic()},[look,showBefore])
  useEffect(()=>{const previous=document.activeElement;closeRef.current?.focus();return()=>previous?.focus?.()},[])
  useEffect(()=>()=>{cameraSessionRef.current++;cancelAnimationFrame(rafRef.current);streamRef.current?.getTracks().forEach(t=>t.stop());landmarkerRef.current?.close();parserRef.current?.close();if(uploadUrlRef.current)URL.revokeObjectURL(uploadUrlRef.current)},[])

  const handleDialogKey=e=>{if(e.key==='Escape'){onClose();return}if(e.key!=='Tab')return;const focusable=[...dialogRef.current.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),label[tabindex]')].filter(el=>el.offsetParent!==null);if(!focusable.length)return;const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}
  return <div ref={dialogRef} className="try-overlay" role="dialog" aria-modal="true" aria-labelledby="try-on-title" onKeyDown={handleDialogKey}><div className="try-modal"><button ref={closeRef} className="modal-close" onClick={onClose} aria-label="Close virtual try-on"><X/></button>
    <aside><a className="logo compact"><span>Go Go</span><strong>GORGEOUS</strong></a><span className="try-label"><Sparkles/> VIRTUAL BEAUTY MIRROR</span><h2 id="try-on-title">Build your<br/><i>complete look.</i></h2><p>Add products without losing the makeup already in your mirror.</p><div className="try-products">{products.map(p=><button className={product.id===p.id?'active':''} aria-pressed={look[p.category]?.productId===p.id} onClick={()=>switchProduct(p)} key={p.id}><ProductArt type={p.art} mini/><span>{p.name}<small>{p.brand}{p.tryOnStatus==='beta'?' · Beta preview':''}</small></span></button>)}</div><div className="privacy">🔒 Face processing happens in this browser. Photos and camera frames are not uploaded.</div></aside>
    <main><div className="mode-tabs"><button className={mode==='model'?'active':''} onClick={()=>chooseMode('model')}><User/> Model</button><label className={mode==='upload'?'active':''}><Upload/> Upload<input type="file" accept="image/*" onChange={upload}/></label><button className={mode==='camera'?'active':''} onClick={prepareCamera}><Camera/> Live camera</button><small className="quality-tier">{qualityTier} quality</small></div>
      <div className="try-stage">{mode==='camera'&&<video ref={videoRef} muted playsInline/>}<img ref={imageRef} className="source-image" src={mode==='upload'?uploadedUrl:selectedModel.src} onLoad={()=>mode!=='camera'&&processImage(imageRef.current)} alt={mode==='upload'?'Uploaded try-on preview':`${selectedModel.name} skin tone try-on model`}/><canvas ref={canvasRef}/>{mode==='model'&&<div className="model-picker"><span>Choose model</span>{tryOnModels.map(model=><button key={model.id} className={selectedModel.id===model.id?'active':''} onClick={()=>setSelectedModel(model)} title={`${model.name} skin tone`}><img src={model.src} alt=""/><small>{model.name}</small></button>)}</div>}{loading&&<div className="stage-status" role="status"><span/>Preparing your mirror…</div>}{error&&mode!=='camera'&&<div className="stage-error" role="alert">{error}</div>}{mode==='camera'&&cameraState===CAMERA_STATES.EXPLAINING_PERMISSION&&<div className="camera-consent" role="status"><Camera/><strong>Use your live beauty mirror</strong><p>{CAMERA_COPY[cameraState]}</p><button onClick={startCamera}>Continue with camera</button><small>No frames or face data leave this device.</small></div>}{mode==='camera'&&cameraState!==CAMERA_STATES.EXPLAINING_PERMISSION&&cameraState!==CAMERA_STATES.READY&&<div className={`camera-guidance ${cameraState}`} role="status"><span>{CAMERA_COPY[cameraState]||'Preparing camera…'}</span>{[CAMERA_STATES.PERMISSION_DENIED,CAMERA_STATES.CAMERA_UNAVAILABLE,CAMERA_STATES.CAMERA_BUSY,CAMERA_STATES.DEVICE_DISCONNECTED].includes(cameraState)&&<button onClick={startCamera}>Retry camera</button>}</div>}<span className="live-pill"><i/> {mode==='camera'?'LIVE':'AI PREVIEW'} · {mode==='camera'?(CAMERA_COPY[cameraState]||cameraState):aiStatus}</span>{import.meta.env.DEV&&<button className={`mask-debug ${debugMask?'active':''}`} onClick={()=>setDebugMask(v=>!v)}>Mask debug</button>}<button className="zoom" aria-label="Zoom preview"><ZoomIn/></button><div className="look-toolbar" aria-label="Current makeup look"><div><button className={showBefore?'active':''} aria-pressed={showBefore} onClick={()=>setShowBefore(value=>!value)}>{showBefore?'Show look':'Before'}</button><button onClick={()=>setLook({})}>Clear look</button></div><div>{orderedLookLayers(look).map(layer=><span key={layer.category} className={!layer.enabled?'disabled':''}><button onClick={()=>setLook(current=>toggleLookLayer(current,layer.category))} aria-pressed={layer.enabled}>{layer.category} · {layer.shade.n}</button><button onClick={()=>setLook(current=>removeLookLayer(current,layer.category))} aria-label={`Remove ${layer.category}`}>×</button></span>)}</div></div></div>
      <div className="try-controls"><div className="selected"><ProductArt type={product.art} mini/><div><small>{product.brand}</small><strong>{product.name}</strong><span>{fmt(product.price)}</span></div></div><div className="shade-picker"><div><strong>Choose your shade</strong><span>{shade.n}</span></div><div className="swatches">{product.shades.map(s=><button key={s.id} className={shade.id===s.id?'active':''} style={{'--shade':s.c}} onClick={()=>selectShade(s)} title={s.n} aria-label={`Try ${s.n}`}/>)}</div><label>Intensity <input type="range" min="20" max="100" value={intensity} onChange={e=>changeIntensity(+e.target.value)}/><span>{intensity}%</span></label></div><button className="add try-add" onClick={()=>onAdd(product,shade)}>Add {shade.n} <ShoppingBag/></button></div>
    </main></div></div>
}

function BagDrawer({ items, onClose, onQuantity, onRemove, onTry }) {
  const detailed = useMemo(() => items.flatMap(item => {
    const product = getProduct(item.productId), variant = getVariant(product, item.variantId)
    return product && variant ? [{ ...item, product, variant }] : []
  }), [items])
  const subtotal = detailed.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  return <div className="bag-overlay" role="dialog" aria-modal="true" aria-labelledby="bag-title" onKeyDown={e=>{if(e.key==='Escape')onClose()}}>
    <button className="bag-backdrop" onClick={onClose} aria-label="Close bag"/>
    <section className="bag-drawer"><header><h2 id="bag-title">Your bag</h2><button onClick={onClose} aria-label="Close bag"><X/></button></header>
      {detailed.length===0?<div className="bag-empty"><ShoppingBag/><p>Your bag is empty.</p><button onClick={onClose}>Continue shopping</button></div>:<>
        <div className="bag-items">{detailed.map(item=><article key={item.variantId}><ProductArt type={item.product.art} mini/><div><small>{item.product.brand}</small><strong>{item.product.name}</strong><span><i style={{background:item.variant.color}}/> {item.variant.name}</span><b>{fmt(item.product.price)}</b><div className="bag-item-actions"><label>Qty <input type="number" min="1" max="99" value={item.quantity} onChange={e=>onQuantity(item,+e.target.value)}/></label><button onClick={()=>onTry(item.product,item.variant)}>Try on</button><button onClick={()=>onRemove(item)}>Remove</button></div></div></article>)}</div>
        <footer><div><span>Subtotal</span><strong>{fmt(subtotal)}</strong></div><p>Taxes and delivery are calculated during checkout.</p><button disabled>Checkout integration coming soon</button></footer>
      </>}
    </section>
  </div>
}

function App(){
  const [filter,setFilter]=useState('all'),[cart,dispatchCart]=useReducer(cartReducer,undefined,loadCart),[trySelection,setTrySelection]=useState(null),[bagOpen,setBagOpen]=useState(false),[toast,setToast]=useState('')
  useEffect(()=>saveCart(cart),[cart])
  const openTry=(product=products[0],shade=product.shades[0])=>{setBagOpen(false);setTrySelection({product,shade})}
  const add=(product,shade=product.shades[0])=>{dispatchCart({type:'add',productId:product.id,variantId:shade.id,quantity:1});setToast(`${product.name} · ${shade.n} added to your bag`);setTimeout(()=>setToast(''),2200)}
  const shown=filter==='all'?products:products.filter(p=>p.category===filter)
  return <><Header cart={cartCount(cart)} openTryOn={()=>openTry()} openBag={()=>setBagOpen(true)}/><Hero openTryOn={()=>openTry()}/>
    <section className="trust"><div><b>100%</b><span>Authentic products</span></div><div><b>24h</b><span>Dhaka delivery</span></div><div><b>4.9★</b><span>Loved by thousands</span></div><div><b>Easy</b><span>Returns & exchange</span></div></section>
    <section className="shop" id="shop"><div className="section-head"><span className="eyebrow">CURATED FOR YOU</span><h2>Meet your new <i>beauty favourites.</i></h2><p>Three essentials. Endless possibilities. Try every shade before you choose.</p></div><div className="filters"><button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>Shop all</button>{categories.map(c=><button key={c.id} className={filter===c.id?'active':''} onClick={()=>setFilter(c.id)}>{c.label}</button>)}</div><div className="products">{shown.map(p=><ProductCard key={p.id} product={p} onTry={openTry} onAdd={add}/>)}</div></section>
    <section className="try-banner"><div><span className="eyebrow">NO GUESSING. JUST GLOWING.</span><h2>Your face.<br/>Every shade.<br/><i>One perfect match.</i></h2><p>Our virtual try-on maps makeup to your unique features in real time.</p><button className="primary" onClick={()=>openTry()}>Start trying <Sparkles/></button></div><div className="face-card"><img src="/assets/gorgeous-hero.png" alt="Virtual makeup preview"/><span>LIPSTICK • INTERVIEW</span><div className="scan-line"/></div></section>
    <footer id="about"><a className="logo"><span>Go Go</span><strong>GORGEOUS</strong><em>BEAUTY, MADE PERSONAL</em></a><p>Authentic beauty, thoughtfully curated for Bangladesh.</p><div><a href="#shop">Shop</a><a href="#about">About us</a><a href="#">Contact</a><a href="#">Privacy</a></div><small>© 2026 Go Go Gorgeous. Prototype experience.</small></footer>
    {trySelection&&<TryOnErrorBoundary onClose={()=>setTrySelection(null)}><TryOn product={trySelection.product} initialShade={trySelection.shade} onClose={()=>setTrySelection(null)} onAdd={add}/></TryOnErrorBoundary>} {bagOpen&&<BagDrawer items={cart} onClose={()=>setBagOpen(false)} onQuantity={(item,quantity)=>dispatchCart({type:'quantity',...item,quantity})} onRemove={item=>dispatchCart({type:'remove',...item})} onTry={openTry}/>} {toast&&<div className="toast" role="status">✓ {toast}</div>}
  </>
}

createRoot(document.getElementById('root')).render(<App/>)
