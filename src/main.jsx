import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Camera, ChevronDown, Heart, Menu, Search, ShoppingBag, Sparkles, Upload, User, X, ZoomIn } from 'lucide-react'
import './styles.css'
import './try-on/camera/camera.css'
import { categories, getProduct, getVariant, products } from './catalog/catalog.js'
import { cartCount, cartReducer, loadCart, saveCart } from './cart/cart.js'
import { orderedLookLayers, removeLookLayer, toggleLookLayer, updateLookLayer, upsertLookLayer } from './try-on/state/lookState.js'
import { CAMERA_COPY, CAMERA_STATES, cameraErrorMessage, cameraErrorState, requestCameraStream } from './try-on/camera/cameraState.js'
import { chooseQualityTier, detectCapabilities } from './try-on/core/capabilities.js'
import { captureRenderAnchors, isSegmentationCompatible, smoothLandmarks } from './try-on/core/renderingMath.js'
import { PerformanceDiagnostics, cosmeticCondition } from './try-on/core/performanceDiagnostics.js'
import { uploadValidationError } from './try-on/core/uploadValidation.js'
import { MakeupRenderer } from './try-on/rendering/makeupRenderer.js'

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

function DiagnosticsPanel({ diagnostics, condition }) {
  const [snapshot, setSnapshot] = useState(null)
  useEffect(() => {
    if (!diagnostics) return undefined
    const update = () => setSnapshot(diagnostics.snapshot({ now: performance.now(), memoryBytes: performance.memory?.usedJSHeapSize }))
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [diagnostics])
  if (!diagnostics || !snapshot) return null
  const metrics = snapshot.conditions[condition] || {}
  const format = value => Number.isFinite(value) ? value.toFixed(1) : '—'
  const pair = metric => `${format(metrics[metric]?.average)} / ${format(metrics[metric]?.p95)} ms`
  return <details className="diagnostics-panel">
    <summary>Local diagnostics · {condition}</summary>
    <dl>
      <div><dt>Preview FPS</dt><dd>{format(snapshot.previewFps)}</dd></div>
      <div><dt>Render avg / p95</dt><dd>{pair('renderMs')}</dd></div>
      <div><dt>MediaPipe avg / p95</dt><dd>{pair('mediaPipeMs')}</dd></div>
      <div><dt>ONNX avg / p95</dt><dd>{pair('segmentationMs')}</dd></div>
      <div><dt>Mask age avg / p95</dt><dd>{pair('maskAgeMs')}</dd></div>
      <div><dt>Long tasks</dt><dd>{snapshot.longTasks.count} / {format(snapshot.longTasks.totalDuration)} ms</dd></div>
      <div><dt>JS heap</dt><dd>{snapshot.usedHeapBytes === null ? 'Unavailable' : `${(snapshot.usedHeapBytes / 1048576).toFixed(1)} MiB`}</dd></div>
    </dl>
    <p>Timings and counts only. No images, landmarks or masks are retained.</p>
  </details>
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
      <button className="nav-close" onClick={() => setMenu(false)} aria-label="Close menu"><X/></button>
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
  const diagnosticsEnabled=useMemo(()=>new URLSearchParams(window.location.search).get('diagnostics')==='1',[])
  const diagnosticsRef=useRef(null)
  if(diagnosticsEnabled&&!diagnosticsRef.current)diagnosticsRef.current=new PerformanceDiagnostics()
  const videoRef = useRef(null), canvasRef = useRef(null), imageRef = useRef(null), uploadInputRef=useRef(null),dialogRef=useRef(null),closeRef=useRef(null),landmarkerRef = useRef(null), landmarkerPromiseRef = useRef(null), runningModeRef = useRef('IMAGE'), lastLandmarksRef = useRef(null), rafRef = useRef(), streamRef=useRef(), makeupStateRef=useRef(),cameraSessionRef=useRef(0)
  const parserRef = useRef(null), faceModuleRef = useRef(null), segmentationRef = useRef(null), segmentationVersionRef=useRef(0), parsingRef = useRef(false), lastParseRef = useRef(0), rendererRef=useRef(null), uploadUrlRef = useRef(null),imageRequestRef=useRef(0),staticFrameRef=useRef(null)
  makeupStateRef.current={layers:orderedLookLayers(look),showBefore}

  const switchProduct = p => {const existing=look[p.category],nextShade=existing?.productId===p.id?existing.shade:p.shades[0],nextIntensity=existing?.intensity??82;setProduct(p);setShade(nextShade);setIntensity(nextIntensity);setLook(current=>upsertLookLayer(current,p,nextShade,nextIntensity))}
  const selectShade=s=>{setShade(s);setLook(current=>upsertLookLayer(current,product,s,intensity))}
  const changeIntensity=value=>{setIntensity(value);setLook(current=>updateLookLayer(current,product.category,{intensity:value}))}
  const getParser=async()=>{if(!faceModuleRef.current)faceModuleRef.current=await import('./faceParserClient.js');if(!parserRef.current)parserRef.current=new faceModuleRef.current.FaceParser();return parserRef.current}
  const getRenderer=()=>rendererRef.current||(rendererRef.current=new MakeupRenderer())
  const clearSegmentation=()=>{segmentationRef.current=null;getRenderer().clearSegmentation()}
  const scheduleParsing=(source,mirror=false,force=false,landmarks=lastLandmarksRef.current)=>{const now=performance.now(),session=cameraSessionRef.current,anchors=captureRenderAnchors(landmarks),condition=cosmeticCondition(makeupStateRef.current.layers,makeupStateRef.current.showBefore);if(!anchors||parsingRef.current||(!force&&now-lastParseRef.current<(qualityTier==='low'?500:qualityTier==='medium'?320:180)))return;parsingRef.current=true;lastParseRef.current=now;getParser().then(parser=>{const started=performance.now();return parser.parse(source,mirror).then(result=>({result,duration:performance.now()-started}))}).then(({result,duration})=>{diagnosticsRef.current?.record('segmentationMs',duration,condition);if(session!==cameraSessionRef.current||!isSegmentationCompatible({anchors},lastLandmarksRef.current))return;const parsed={...result,anchors,acceptedAt:performance.now()};segmentationRef.current=parsed;segmentationVersionRef.current++;getRenderer().setSegmentation(parsed,faceModuleRef.current,segmentationVersionRef.current);setAiStatus('Face parsing active')}).catch(()=>{if(session===cameraSessionRef.current)setAiStatus('Landmark fallback')}).finally(()=>{parsingRef.current=false})}
  const renderMakeup=(ctx, pts, w, h)=>{
    const {layers,showBefore:before}=makeupStateRef.current
    const condition=cosmeticCondition(layers,before),started=performance.now()
    if(!before)getRenderer().render(ctx,pts,w,h,layers,{qualityTier,debugMask})
    diagnosticsRef.current?.record('renderMs',performance.now()-started,condition)
    if(segmentationRef.current?.acceptedAt)diagnosticsRef.current?.record('maskAgeMs',Math.max(0,performance.now()-segmentationRef.current.acceptedAt),condition)
  }
  const ensureModel=async()=>{if(landmarkerRef.current)return landmarkerRef.current;if(landmarkerPromiseRef.current)return landmarkerPromiseRef.current;setLoading(true);landmarkerPromiseRef.current=(async()=>{try{const {FaceLandmarker,FilesetResolver}=await import('@mediapipe/tasks-vision');const vision=await FilesetResolver.forVisionTasks('/models/mediapipe/wasm');let instance;try{instance=await FaceLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:'/models/mediapipe/face_landmarker.task',delegate:'GPU'},runningMode:'IMAGE',numFaces:2,minFaceDetectionConfidence:.35,minFacePresenceConfidence:.35,minTrackingConfidence:.35})}catch{instance=await FaceLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:'/models/mediapipe/face_landmarker.task',delegate:'CPU'},runningMode:'IMAGE',numFaces:2,minFaceDetectionConfidence:.35,minFacePresenceConfidence:.35,minTrackingConfidence:.35})}landmarkerRef.current=instance;runningModeRef.current='IMAGE';return instance}catch(e){landmarkerPromiseRef.current=null;setError('Face model could not load. Try again or continue without virtual try-on.');throw e}finally{setLoading(false)}})();return landmarkerPromiseRef.current}
  const setLandmarkerMode=async(modeName)=>{const lm=await ensureModel();if(runningModeRef.current!==modeName){await lm.setOptions({runningMode:modeName});runningModeRef.current=modeName}return lm}
  const redrawStatic=()=>{const frame=staticFrameRef.current,c=canvasRef.current;if(!frame||!c)return;const ctx=c.getContext('2d');ctx.fillStyle='#eadfdb';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(frame.img,frame.offsetX,frame.offsetY,frame.drawW,frame.drawH);renderMakeup(ctx,frame.landmarks,c.width,c.height)}
  const processImage=async img=>{
    const request=++imageRequestRef.current,lm=await setLandmarkerMode('IMAGE')
    if(request!==imageRequestRef.current)return
    const condition=cosmeticCondition(makeupStateRef.current.layers,makeupStateRef.current.showBefore),detectStarted=performance.now(),res=lm.detect(img)
    diagnosticsRef.current?.record('mediaPipeMs',performance.now()-detectStarted,condition)
    if(request!==imageRequestRef.current)return
    const c=canvasRef.current
    if(!c)return
    const sourceW=img.naturalWidth||img.videoWidth,sourceH=img.naturalHeight||img.videoHeight
    c.width=1600;c.height=900
    const scale=Math.min(c.width/sourceW,c.height/sourceH),drawW=sourceW*scale,drawH=sourceH*scale,offsetX=(c.width-drawW)/2,offsetY=(c.height-drawH)/2,ctx=c.getContext('2d')
    ctx.fillStyle='#eadfdb';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(img,offsetX,offsetY,drawW,drawH)
    if(res.faceLandmarks?.[0]){
      const fitted=res.faceLandmarks[0].map(p=>({...p,x:(offsetX+p.x*drawW)/c.width,y:(offsetY+p.y*drawH)/c.height}))
      try{
        const parser=await getParser(),parseStarted=performance.now(),parsed=await parser.parse(c)
        diagnosticsRef.current?.record('segmentationMs',performance.now()-parseStarted,condition)
        if(request!==imageRequestRef.current)return
        const anchored={...parsed,anchors:captureRenderAnchors(fitted),acceptedAt:performance.now()}
        segmentationRef.current=anchored;segmentationVersionRef.current++;getRenderer().setSegmentation(anchored,faceModuleRef.current,segmentationVersionRef.current);setAiStatus('Face parsing active')
      }catch{if(request===imageRequestRef.current)setAiStatus('Landmark fallback')}
      if(request!==imageRequestRef.current)return
      staticFrameRef.current={img,offsetX,offsetY,drawW,drawH,landmarks:fitted};redrawStatic()
    }else{staticFrameRef.current=null;clearSegmentation();setError('Move closer or choose a clear, front-facing photo.')}
  }
  const stopCamera=()=>{cameraSessionRef.current++;imageRequestRef.current++;cancelAnimationFrame(rafRef.current);streamRef.current?.getTracks().forEach(track=>track.stop());streamRef.current=null;if(videoRef.current)videoRef.current.srcObject=null;lastLandmarksRef.current=null;clearSegmentation();setCameraState(CAMERA_STATES.STOPPED)}
  const prepareCamera=()=>{stopCamera();setMode('camera');setError('');setCameraState(capabilities.camera?CAMERA_STATES.EXPLAINING_PERMISSION:CAMERA_STATES.BROWSER_UNSUPPORTED)}
  const startCamera=async()=>{
    const session=++cameraSessionRef.current
    setError('');setCameraState(CAMERA_STATES.REQUESTING_PERMISSION)
    let stream
    try{
      stream=await requestCameraStream(navigator.mediaDevices)
      if(session!==cameraSessionRef.current){stream.getTracks().forEach(track=>track.stop());return}
      streamRef.current=stream;setCameraState(CAMERA_STATES.STARTING)
      const track=stream.getVideoTracks()[0]
      track?.addEventListener('ended',()=>{if(session===cameraSessionRef.current)setCameraState(CAMERA_STATES.DEVICE_DISCONNECTED)},{once:true})
      const v=videoRef.current;if(!v)throw new Error('Video element unavailable')
      v.srcObject=stream
      if(v.readyState<1)await new Promise((resolve,reject)=>{v.addEventListener('loadedmetadata',resolve,{once:true});v.addEventListener('error',reject,{once:true})})
      if(session!==cameraSessionRef.current)return
      await v.play()
      const previewCanvas=canvasRef.current
      if(previewCanvas){previewCanvas.width=v.videoWidth||1;previewCanvas.height=v.videoHeight||1}
    }catch(error){
      if(session!==cameraSessionRef.current)return
      stream?.getTracks().forEach(track=>track.stop())
      streamRef.current=null
      if(videoRef.current)videoRef.current.srcObject=null
      const state=cameraErrorState(error);setCameraState(state);setError(cameraErrorMessage(error))
      return
    }
    setCameraState(CAMERA_STATES.WARMING_MODELS)
    let lm
    try{
      lm=await setLandmarkerMode('VIDEO')
    }catch(error){
      if(session!==cameraSessionRef.current)return
      const name=typeof error?.name==='string'?error.name:'UnknownError'
      setCameraState(CAMERA_STATES.MODEL_FAILED)
      setError(`${CAMERA_COPY[CAMERA_STATES.MODEL_FAILED]} (Browser error: ${name})`)
      return
    }
    if(session!==cameraSessionRef.current)return
    let lastVideoTime=-1
    const loop=()=>{
      if(session!==cameraSessionRef.current||!videoRef.current||!canvasRef.current)return
      const frameStarted=performance.now(),c=canvasRef.current,ctx=c.getContext('2d'),video=videoRef.current
      diagnosticsRef.current?.recordFrame(frameStarted)
      if(video.videoWidth){
        if(c.width!==video.videoWidth||c.height!==video.videoHeight){c.width=video.videoWidth;c.height=video.videoHeight}
        ctx.save();ctx.translate(c.width,0);ctx.scale(-1,1);ctx.drawImage(video,0,0,c.width,c.height);ctx.restore()
        if(video.currentTime!==lastVideoTime){
          lastVideoTime=video.currentTime
          const condition=cosmeticCondition(makeupStateRef.current.layers,makeupStateRef.current.showBefore),detectStarted=performance.now(),res=lm.detectForVideo(video,performance.now()),faces=res.faceLandmarks||[]
          diagnosticsRef.current?.record('mediaPipeMs',performance.now()-detectStarted,condition)
          if(faces.length>1){lastLandmarksRef.current=null;clearSegmentation();setCameraState(CAMERA_STATES.MULTIPLE_FACES)}
          else if(faces.length===0){lastLandmarksRef.current=null;clearSegmentation();setCameraState(CAMERA_STATES.NO_FACE)}
          else{
            setCameraState(CAMERA_STATES.READY)
            const detected=faces[0].map(p=>({...p,x:1-p.x}))
            lastLandmarksRef.current=smoothLandmarks(lastLandmarksRef.current,detected)
            if(segmentationRef.current&&!isSegmentationCompatible(segmentationRef.current,lastLandmarksRef.current))clearSegmentation()
            scheduleParsing(video,true,false,lastLandmarksRef.current)
          }
        }
        if(lastLandmarksRef.current)renderMakeup(ctx,lastLandmarksRef.current,c.width,c.height)
      }
      rafRef.current=requestAnimationFrame(loop)
    }
    loop()
  }
  const chooseMode=m=>{stopCamera();setMode(m);setError('');if(m==='model'&&imageRef.current?.complete)processImage(imageRef.current);if(m==='camera')prepareCamera()}
  const upload=e=>{const file=e.target.files?.[0];if(!file)return;const validationError=uploadValidationError(file);if(validationError){setError(validationError);return}chooseMode('upload');if(uploadUrlRef.current)URL.revokeObjectURL(uploadUrlRef.current);uploadUrlRef.current=URL.createObjectURL(file);setUploadedUrl(uploadUrlRef.current)}
  useEffect(()=>{if(mode!=='camera'&&imageRef.current?.complete)processImage(imageRef.current)},[selectedModel,uploadedUrl,mode])
  useEffect(()=>{if(mode!=='camera')redrawStatic()},[look,showBefore])
  useEffect(()=>{const previous=document.activeElement;closeRef.current?.focus();return()=>previous?.focus?.()},[])
  useEffect(()=>{
    if(!diagnosticsEnabled)return undefined
    const diagnostics=diagnosticsRef.current,api=Object.freeze({
      snapshot:()=>diagnostics.snapshot({now:performance.now(),memoryBytes:performance.memory?.usedJSHeapSize}),
      reset:()=>{diagnostics.reset();diagnostics.start(performance.now())},
    })
    diagnostics.start(performance.now())
    window.__GO_GO_GORGEOUS_DIAGNOSTICS__=api
    let observer
    if('PerformanceObserver' in window){
      try{observer=new PerformanceObserver(list=>list.getEntries().forEach(entry=>diagnostics.recordLongTask(entry.duration)));observer.observe({type:'longtask',buffered:true})}catch{observer=undefined}
    }
    return()=>{observer?.disconnect();if(window.__GO_GO_GORGEOUS_DIAGNOSTICS__===api)delete window.__GO_GO_GORGEOUS_DIAGNOSTICS__}
  },[diagnosticsEnabled])
  useEffect(()=>()=>{cameraSessionRef.current++;cancelAnimationFrame(rafRef.current);streamRef.current?.getTracks().forEach(t=>t.stop());landmarkerRef.current?.close();parserRef.current?.close();if(uploadUrlRef.current)URL.revokeObjectURL(uploadUrlRef.current)},[])

  const handleDialogKey=e=>{if(e.key==='Escape'){onClose();return}if(e.key!=='Tab')return;const focusable=[...dialogRef.current.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),label[tabindex]')].filter(el=>el.offsetParent!==null);if(!focusable.length)return;const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}
  const cameraIsLive=[CAMERA_STATES.READY,CAMERA_STATES.NO_FACE,CAMERA_STATES.MULTIPLE_FACES].includes(cameraState)
  const cameraBadge=cameraIsLive?'LIVE':cameraState===CAMERA_STATES.CAMERA_UNAVAILABLE?'CAMERA UNAVAILABLE':cameraState===CAMERA_STATES.PERMISSION_DENIED?'CAMERA PERMISSION':cameraState===CAMERA_STATES.CAMERA_BUSY?'CAMERA BUSY':'CAMERA STARTING'
  return <div ref={dialogRef} className="try-overlay" role="dialog" aria-modal="true" aria-labelledby="try-on-title" onKeyDown={handleDialogKey}><div className="try-modal"><button ref={closeRef} className="modal-close" onClick={onClose} aria-label="Close virtual try-on"><X/></button>
    <aside><a className="logo compact"><span>Go Go</span><strong>GORGEOUS</strong></a><span className="try-label"><Sparkles/> VIRTUAL BEAUTY MIRROR</span><h2 id="try-on-title">Build your<br/><i>complete look.</i></h2><p>Add products without losing the makeup already in your mirror.</p><div className="try-products">{products.map(p=><button className={product.id===p.id?'active':''} aria-pressed={look[p.category]?.productId===p.id} onClick={()=>switchProduct(p)} key={p.id}><ProductArt type={p.art} mini/><span>{p.name}<small>{p.brand}{p.tryOnStatus==='beta'?' · Beta preview':''}</small></span></button>)}</div><div className="privacy">🔒 Face processing happens in this browser. Photos and camera frames are not uploaded.</div></aside>
    <main><div className="mode-tabs"><button className={mode==='model'?'active':''} onClick={()=>chooseMode('model')}><User/> Model</button><label className={mode==='upload'?'active':''} role="button" tabIndex="0" aria-label="Upload a photo" onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();uploadInputRef.current?.click()}}}><Upload/> Upload<input ref={uploadInputRef} type="file" accept="image/*" tabIndex="-1" onChange={upload}/></label><button className={mode==='camera'?'active':''} onClick={prepareCamera}><Camera/> Live camera</button><small className="quality-tier">{qualityTier} quality</small></div>
      <div className="try-stage">{mode==='camera'&&<video ref={videoRef} muted playsInline/>}<img ref={imageRef} className="source-image" src={mode==='upload'?uploadedUrl:selectedModel.src} onLoad={()=>mode!=='camera'&&processImage(imageRef.current)} alt={mode==='upload'?'Uploaded try-on preview':`${selectedModel.name} skin tone try-on model`}/><canvas ref={canvasRef}/>{mode==='model'&&<div className="model-picker"><span>Choose model</span>{tryOnModels.map(model=><button key={model.id} className={selectedModel.id===model.id?'active':''} onClick={()=>setSelectedModel(model)} title={`${model.name} skin tone`}><img src={model.src} alt=""/><small>{model.name}</small></button>)}</div>}{loading&&<div className="stage-status" role="status"><span/>Preparing your mirror…</div>}{error&&mode!=='camera'&&<div className="stage-error" role="alert">{error}</div>}{mode==='camera'&&cameraState===CAMERA_STATES.EXPLAINING_PERMISSION&&<div className="camera-consent" role="status"><Camera/><strong>Use your live beauty mirror</strong><p>{CAMERA_COPY[cameraState]}</p><button onClick={startCamera}>Continue with camera</button><small>No frames or face data leave this device.</small></div>}{mode==='camera'&&cameraState!==CAMERA_STATES.EXPLAINING_PERMISSION&&cameraState!==CAMERA_STATES.READY&&<div className={`camera-guidance ${cameraState}`} role={error?'alert':'status'} aria-live={error?'assertive':'polite'}><span>{error||CAMERA_COPY[cameraState]||'Preparing camera…'}</span>{[CAMERA_STATES.PERMISSION_DENIED,CAMERA_STATES.CAMERA_UNAVAILABLE,CAMERA_STATES.CAMERA_BUSY,CAMERA_STATES.DEVICE_DISCONNECTED].includes(cameraState)&&<button onClick={startCamera}>Retry camera</button>}</div>}<span className="live-pill"><i/> {mode==='camera'?`${cameraBadge} · ${cameraState===CAMERA_STATES.NO_FACE?'Center your face':cameraState===CAMERA_STATES.MULTIPLE_FACES?'Multiple faces detected':cameraState===CAMERA_STATES.READY?'Mirror ready':''}`:`AI PREVIEW · ${aiStatus}`}</span>{import.meta.env.DEV&&<button className={`mask-debug ${debugMask?'active':''}`} onClick={()=>setDebugMask(v=>!v)}>Mask debug</button>}<button className="zoom" aria-label="Zoom preview"><ZoomIn/></button><DiagnosticsPanel diagnostics={diagnosticsRef.current} condition={cosmeticCondition(orderedLookLayers(look),showBefore)}/><div className="look-toolbar" aria-label="Current makeup look"><div><button className={showBefore?'active':''} aria-pressed={showBefore} onClick={()=>setShowBefore(value=>!value)}>{showBefore?'Show look':'Before'}</button><button onClick={()=>setLook({})}>Clear look</button></div><div>{orderedLookLayers(look).map(layer=><span key={layer.category} className={!layer.enabled?'disabled':''}><button onClick={()=>setLook(current=>toggleLookLayer(current,layer.category))} aria-pressed={layer.enabled}>{layer.category} · {layer.shade.n}</button><button onClick={()=>setLook(current=>removeLookLayer(current,layer.category))} aria-label={`Remove ${layer.category}`}>×</button></span>)}</div></div></div>
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
  return <><Header cart={cartCount(cart)} openTryOn={()=>openTry()} openBag={()=>setBagOpen(true)}/><main><Hero openTryOn={()=>openTry()}/>
    <section className="trust"><div><b>100%</b><span>Authentic products</span></div><div><b>24h</b><span>Dhaka delivery</span></div><div><b>4.9★</b><span>Loved by thousands</span></div><div><b>Easy</b><span>Returns & exchange</span></div></section>
    <section className="shop" id="shop"><div className="section-head"><span className="eyebrow">CURATED FOR YOU</span><h2>Meet your new <i>beauty favourites.</i></h2><p>Three essentials. Endless possibilities. Try every shade before you choose.</p></div><div className="filters"><button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>Shop all</button>{categories.map(c=><button key={c.id} className={filter===c.id?'active':''} onClick={()=>setFilter(c.id)}>{c.label}</button>)}</div><div className="products">{shown.map(p=><ProductCard key={p.id} product={p} onTry={openTry} onAdd={add}/>)}</div></section>
    <section className="try-banner"><div><span className="eyebrow">NO GUESSING. JUST GLOWING.</span><h2>Your face.<br/>Every shade.<br/><i>One perfect match.</i></h2><p>Our virtual try-on maps makeup to your unique features in real time.</p><button className="primary" onClick={()=>openTry()}>Start trying <Sparkles/></button></div><div className="face-card"><img src="/assets/gorgeous-hero.png" alt="Virtual makeup preview"/><span>LIPSTICK • INTERVIEW</span><div className="scan-line"/></div></section></main>
    <footer id="about"><a className="logo"><span>Go Go</span><strong>GORGEOUS</strong><em>BEAUTY, MADE PERSONAL</em></a><p>Authentic beauty, thoughtfully curated for Bangladesh.</p><div><a href="#shop">Shop</a><a href="#about">About us</a><a href="#">Contact</a><a href="#">Privacy</a></div><small>© 2026 Go Go Gorgeous. Prototype experience.</small></footer>
    {trySelection&&<TryOnErrorBoundary onClose={()=>setTrySelection(null)}><TryOn product={trySelection.product} initialShade={trySelection.shade} onClose={()=>setTrySelection(null)} onAdd={add}/></TryOnErrorBoundary>} {bagOpen&&<BagDrawer items={cart} onClose={()=>setBagOpen(false)} onQuantity={(item,quantity)=>dispatchCart({type:'quantity',...item,quantity})} onRemove={item=>dispatchCart({type:'remove',...item})} onTry={openTry}/>} {toast&&<div className="toast" role="status">✓ {toast}</div>}
  </>
}

createRoot(document.getElementById('root')).render(<App/>)
