import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Camera, ChevronDown, Heart, Menu, Search, ShoppingBag, Sparkles, Upload, User, X, ZoomIn } from 'lucide-react'
import './styles.css'

const categories = [
  { id: 'lipstick', label: 'Lipstick', art: 'lip' },
  { id: 'concealer', label: 'Concealer', art: 'concealer' },
  { id: 'eyeliner', label: 'Eyeliner', art: 'liner' },
]

const products = [
  { id: 1, category: 'lipstick', brand: 'HUDA BEAUTY', name: 'Power Bullet Matte Lipstick', price: 3850, rating: 4.9, art: 'lip', shades: [{n:'Interview',c:'#8e3544'}, {n:'Pay Day',c:'#a7525c'}, {n:'Third Date',c:'#762a3e'}, {n:'Board Meeting',c:'#9b493d'}] },
  { id: 2, category: 'lipstick', brand: 'MAC', name: 'M·A·Cximal Silky Matte Lipstick', price: 3450, oldPrice: 3750, rating: 4.8, art: 'lip', shades: [{n:'Ruby Woo',c:'#b0172c'}, {n:'Velvet Teddy',c:'#9b594f'}, {n:'Mehr',c:'#a95d68'}] },
  { id: 3, category: 'concealer', brand: 'e.l.f.', name: 'Hydrating Camo Concealer 6mL', price: 1650, rating: 4.7, art: 'concealer', shades: [{n:'Fair Beige',c:'#edc5a5'}, {n:'Light Sand',c:'#dba77e'}, {n:'Medium Peach',c:'#c78c68'}, {n:'Tan Walnut',c:'#946043'}] },
  { id: 4, category: 'concealer', brand: 'MAYBELLINE', name: 'Instant Age Rewind Concealer', price: 1850, rating: 4.8, art: 'concealer', shades: [{n:'Ivory',c:'#efcdb1'}, {n:'Sand',c:'#d8a47f'}, {n:'Caramel',c:'#b77a54'}] },
  { id: 5, category: 'eyeliner', brand: 'NYX', name: 'Epic Ink Waterproof Liner', price: 1550, rating: 4.9, art: 'liner', shades: [{n:'Black',c:'#141316'}, {n:'Brown',c:'#432d28'}, {n:'Plum',c:'#3e2339'}] },
  { id: 6, category: 'eyeliner', brand: 'SHEGLAM', name: 'All-In-One Color Eyeliner', price: 950, rating: 4.6, art: 'liner', shades: [{n:'Midnight',c:'#11141c'}, {n:'Espresso',c:'#473128'}, {n:'Ocean',c:'#183f61'}] },
]

const fmt = n => `৳ ${n.toLocaleString('en-BD')}.00`

function ProductArt({ type, mini=false }) {
  return <div className={`product-art ${type} ${mini ? 'mini' : ''}`} aria-hidden="true"><i/><b/><span/></div>
}

function Header({ cart, openTryOn }) {
  const [menu, setMenu] = useState(false)
  return <>
    <div className="announcement">Free delivery on orders over ৳ 3,000 <span>•</span> Authentic products, always</div>
    <header>
      <button className="icon-btn menu-btn" onClick={() => setMenu(!menu)} aria-label="Menu"><Menu/></button>
      <a href="#" className="logo"><span>go go</span><strong>GORGEOUS</strong><em>BEAUTY, MADE PERSONAL</em></a>
      <div className="search"><Search/><input placeholder="Search your beauty favourites..."/></div>
      <div className="header-actions"><button><User/><span>Sign in</span></button><button><Heart/><span>Wishlist</span></button><button className="bag"><ShoppingBag/><span>Bag</span>{cart > 0 && <b>{cart}</b>}</button></div>
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
  return <article className="product-card">
    <div className="product-visual"><span className="tag">{product.oldPrice ? 'SALE' : 'NEW'}</span><button className={liked ? 'liked' : ''} onClick={()=>setLiked(!liked)} aria-label="Add to wishlist"><Heart fill={liked?'currentColor':'none'}/></button><ProductArt type={product.art}/><button className="quick" onClick={()=>onTry(product)}><Sparkles/> Try it on</button></div>
    <div className="product-info"><small>{product.brand}</small><h3>{product.name}</h3><div className="stars">★★★★★ <span>{product.rating}</span></div><div className="shade-row">{product.shades.slice(0,4).map(s=><i key={s.n} style={{background:s.c}} title={s.n}/>)}<span>{product.shades.length} shades</span></div><div className="price"><strong>{fmt(product.price)}</strong>{product.oldPrice && <del>{fmt(product.oldPrice)}</del>}</div><button className="add" onClick={()=>onAdd(product)}>Add to bag</button></div>
  </article>
}

const lipOuter=[61,185,40,39,37,0,267,269,270,409,291,375,321,405,314,17,84,181,91,146]
const lipInner=[78,191,80,81,82,13,312,311,310,415,308,324,318,402,317,14,87,178,88,95]
const leftEye=[33,246,161,160,159,158,157,173,133,155,154,153,145,144,163,7]
const rightEye=[263,466,388,387,386,385,384,398,362,382,381,380,374,373,390,249]
const faceOval=[10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109]

function TryOn({ product: initial, onClose }) {
  const [product, setProduct] = useState(initial || products[0])
  const [shade, setShade] = useState((initial || products[0]).shades[0])
  const [mode, setMode] = useState('model')
  const [intensity, setIntensity] = useState(68)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const videoRef = useRef(null), canvasRef = useRef(null), imageRef = useRef(null), landmarkerRef = useRef(null), rafRef = useRef(), streamRef=useRef()

  const switchProduct = p => { setProduct(p); setShade(p.shades[0]) }
  const drawPath=(ctx, pts, ids, w, h)=>{ctx.beginPath(); ids.forEach((id,i)=>{const p=pts[id]; if(!p)return; (i?ctx.lineTo.bind(ctx):ctx.moveTo.bind(ctx))(p.x*w,p.y*h)});ctx.closePath()}
  const renderMakeup=(ctx, pts, w, h)=>{
    ctx.save(); const alpha=intensity/100; ctx.globalCompositeOperation='multiply';
    if(product.category==='lipstick'){drawPath(ctx,pts,lipOuter,w,h); ctx.fillStyle=shade.c;ctx.globalAlpha=.78*alpha;ctx.fill();drawPath(ctx,pts,lipInner,w,h);ctx.globalCompositeOperation='destination-out';ctx.globalAlpha=.8;ctx.fill()}
    if(product.category==='eyeliner'){ctx.strokeStyle=shade.c;ctx.fillStyle=shade.c;ctx.lineWidth=Math.max(2,w*.006)*alpha;ctx.lineCap='round';[leftEye,rightEye].forEach((eye,idx)=>{ctx.beginPath();eye.slice(0,9).forEach((id,i)=>{const p=pts[id];(i?ctx.lineTo.bind(ctx):ctx.moveTo.bind(ctx))(p.x*w,p.y*h)});ctx.stroke();const outer=pts[idx?263:33], inner=pts[idx?362:133]; if(outer&&inner){const dir=idx?1:-1;ctx.beginPath();ctx.moveTo(outer.x*w,outer.y*h);ctx.lineTo((outer.x+dir*.045)*w,(outer.y-.018)*h);ctx.lineTo((outer.x+dir*.008)*w,(outer.y+.006)*h);ctx.fill()}})}
    if(product.category==='concealer'){drawPath(ctx,pts,faceOval,w,h);ctx.clip();const grad=ctx.createRadialGradient(w*.5,h*.45,0,w*.5,h*.45,w*.4);grad.addColorStop(0,shade.c+'cc');grad.addColorStop(1,shade.c+'00');ctx.fillStyle=grad;ctx.globalAlpha=.22*alpha;ctx.fillRect(0,0,w,h)} ctx.restore()
  }
  const ensureModel=async()=>{if(landmarkerRef.current)return landmarkerRef.current;setLoading(true);try{const {FaceLandmarker,FilesetResolver}=await import('@mediapipe/tasks-vision');const vision=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm');landmarkerRef.current=await FaceLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',delegate:'GPU'},runningMode:'IMAGE',numFaces:1});return landmarkerRef.current}catch(e){setError('Face model could not load. Check your connection and try again.');throw e}finally{setLoading(false)}}
  const processImage=async(img)=>{const lm=await ensureModel();const res=lm.detect(img);const c=canvasRef.current;if(!c)return;c.width=img.naturalWidth||img.videoWidth;c.height=img.naturalHeight||img.videoHeight;const ctx=c.getContext('2d');ctx.drawImage(img,0,0,c.width,c.height);if(res.faceLandmarks?.[0])renderMakeup(ctx,res.faceLandmarks[0],c.width,c.height);else setError('Move closer or choose a clear, front-facing photo.')}
  const startCamera=async()=>{setMode('camera');setError('');try{streamRef.current=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1280}},audio:false});setTimeout(async()=>{const v=videoRef.current;if(!v)return;v.srcObject=streamRef.current;await v.play();const lm=await ensureModel();await lm.setOptions({runningMode:'VIDEO'});const loop=()=>{if(!videoRef.current||!canvasRef.current)return;const c=canvasRef.current,ctx=c.getContext('2d'),v=videoRef.current;if(v.videoWidth){c.width=v.videoWidth;c.height=v.videoHeight;ctx.save();ctx.translate(c.width,0);ctx.scale(-1,1);ctx.drawImage(v,0,0,c.width,c.height);ctx.restore();const res=lm.detectForVideo(v,performance.now());if(res.faceLandmarks?.[0]){const mirrored=res.faceLandmarks[0].map(p=>({...p,x:1-p.x}));renderMakeup(ctx,mirrored,c.width,c.height)}}rafRef.current=requestAnimationFrame(loop)};loop()},50)}catch(e){setError('Camera access was blocked. Allow camera permission or upload a photo.') }}
  const chooseMode=m=>{cancelAnimationFrame(rafRef.current);streamRef.current?.getTracks().forEach(t=>t.stop());setMode(m);setError('');if(m==='model')setTimeout(()=>imageRef.current&&processImage(imageRef.current),20);if(m==='camera')startCamera()}
  const upload=e=>{const file=e.target.files?.[0];if(!file)return;chooseMode('upload');const url=URL.createObjectURL(file);setTimeout(()=>{imageRef.current.src=url},0)}
  useEffect(()=>{if(mode==='model'&&imageRef.current?.complete)processImage(imageRef.current)},[product,shade,intensity])
  useEffect(()=>()=>{cancelAnimationFrame(rafRef.current);streamRef.current?.getTracks().forEach(t=>t.stop());landmarkerRef.current?.close()},[])

  return <div className="try-overlay" role="dialog" aria-modal="true"><div className="try-modal"><button className="modal-close" onClick={onClose}><X/></button>
    <aside><a className="logo compact"><span>go go</span><strong>GORGEOUS</strong></a><span className="try-label"><Sparkles/> VIRTUAL TRY-ON</span><h2>Find your<br/><i>perfect look.</i></h2><p>Choose a product and shade, then see it come alive instantly.</p><div className="try-products">{categories.map(c=>{const p=products.find(x=>x.category===c.id);return <button className={product.category===c.id?'active':''} onClick={()=>switchProduct(p)} key={c.id}><ProductArt type={c.art} mini/><span>{c.label}<small>{products.filter(x=>x.category===c.id).length} products</small></span></button>})}</div><div className="privacy">🔒 Your camera and photos stay on this device.</div></aside>
    <main><div className="mode-tabs"><button className={mode==='model'?'active':''} onClick={()=>chooseMode('model')}><User/> Model</button><label className={mode==='upload'?'active':''}><Upload/> Upload<input type="file" accept="image/*" onChange={upload}/></label><button className={mode==='camera'?'active':''} onClick={startCamera}><Camera/> Live camera</button></div>
      <div className="try-stage">{mode==='camera'&&<video ref={videoRef} muted playsInline/>}<img ref={imageRef} className="source-image" src="/assets/gorgeous-hero.png" onLoad={()=>mode!=='camera'&&processImage(imageRef.current)} alt="Try-on model"/><canvas ref={canvasRef}/>{loading&&<div className="stage-status"><span/>Loading face intelligence…</div>}{error&&<div className="stage-error">{error}</div>}<span className="live-pill"><i/> {mode==='camera'?'LIVE':'AI PREVIEW'}</span><button className="zoom"><ZoomIn/></button></div>
      <div className="try-controls"><div className="selected"><ProductArt type={product.art} mini/><div><small>{product.brand}</small><strong>{product.name}</strong><span>{fmt(product.price)}</span></div></div><div className="shade-picker"><div><strong>Choose your shade</strong><span>{shade.n}</span></div><div className="swatches">{product.shades.map(s=><button key={s.n} className={shade.n===s.n?'active':''} style={{'--shade':s.c}} onClick={()=>setShade(s)} title={s.n}/>)}</div><label>Intensity <input type="range" min="20" max="100" value={intensity} onChange={e=>setIntensity(+e.target.value)}/><span>{intensity}%</span></label></div><button className="add try-add">Add to bag <ShoppingBag/></button></div>
    </main></div></div>
}

function App(){
  const [filter,setFilter]=useState('all'),[cart,setCart]=useState(0),[tryProduct,setTryProduct]=useState(null),[toast,setToast]=useState('')
  const openTry=p=>setTryProduct(p||products[0]);const add=p=>{setCart(c=>c+1);setToast(`${p.name} added to your bag`);setTimeout(()=>setToast(''),2200)}
  const shown=filter==='all'?products:products.filter(p=>p.category===filter)
  return <><Header cart={cart} openTryOn={()=>openTry()}/><Hero openTryOn={()=>openTry()}/>
    <section className="trust"><div><b>100%</b><span>Authentic products</span></div><div><b>24h</b><span>Dhaka delivery</span></div><div><b>4.9★</b><span>Loved by thousands</span></div><div><b>Easy</b><span>Returns & exchange</span></div></section>
    <section className="shop" id="shop"><div className="section-head"><span className="eyebrow">CURATED FOR YOU</span><h2>Meet your new <i>beauty favourites.</i></h2><p>Three essentials. Endless possibilities. Try every shade before you choose.</p></div><div className="filters"><button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>Shop all</button>{categories.map(c=><button key={c.id} className={filter===c.id?'active':''} onClick={()=>setFilter(c.id)}>{c.label}</button>)}</div><div className="products">{shown.map(p=><ProductCard key={p.id} product={p} onTry={openTry} onAdd={add}/>)}</div></section>
    <section className="try-banner"><div><span className="eyebrow">NO GUESSING. JUST GLOWING.</span><h2>Your face.<br/>Every shade.<br/><i>One perfect match.</i></h2><p>Our virtual try-on maps makeup to your unique features in real time.</p><button className="primary" onClick={()=>openTry()}>Start trying <Sparkles/></button></div><div className="face-card"><img src="/assets/gorgeous-hero.png" alt="Virtual makeup preview"/><span>LIPSTICK • INTERVIEW</span><div className="scan-line"/></div></section>
    <footer id="about"><a className="logo"><span>go go</span><strong>GORGEOUS</strong><em>BEAUTY, MADE PERSONAL</em></a><p>Authentic beauty, thoughtfully curated for Bangladesh.</p><div><a href="#shop">Shop</a><a href="#about">About us</a><a href="#">Contact</a><a href="#">Privacy</a></div><small>© 2026 Go Go Gorgeous. Prototype experience.</small></footer>
    {tryProduct&&<TryOn product={tryProduct} onClose={()=>setTryProduct(null)}/>} {toast&&<div className="toast">✓ {toast}</div>}
  </>
}

createRoot(document.getElementById('root')).render(<App/>)
