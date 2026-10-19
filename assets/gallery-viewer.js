"use strict";
(()=>{
 const gallery=document.getElementById("gallery-dialog");
 const full=document.getElementById("gallery-full-image");
 const thumbnails=[...document.querySelectorAll(".gallery-zoom")];
 const count=document.getElementById("gallery-count");
 if(!gallery||!full||!count||!thumbnails.length)return;
 let selected=0,opener=null,touchX=null;
 function showImage(index){
  selected=(index+thumbnails.length)%thumbnails.length;
  const img=thumbnails[selected].querySelector("img");
  if(!img)return;
  full.src=img.getAttribute("src");
  full.alt=img.getAttribute("alt")||"Happy Eck Bild";
  count.textContent=(selected+1)+" / "+thumbnails.length;
 }
 function close(){if(gallery.open)gallery.close()}
 thumbnails.forEach((button,index)=>button.addEventListener("click",()=>{
  const image=button.querySelector("img");
  if(typeof gallery.showModal!=="function"){
   if(image)window.open(image.src,"_blank","noopener");
   return;
  }
  opener=button;
  showImage(index);
  gallery.showModal();
  document.getElementById("gallery-close").focus({preventScroll:true});
 }));
 document.getElementById("gallery-close").addEventListener("click",close);
 document.getElementById("gallery-prev").addEventListener("click",()=>showImage(selected-1));
 document.getElementById("gallery-next").addEventListener("click",()=>showImage(selected+1));
 gallery.addEventListener("keydown",event=>{
  if(event.key==="ArrowLeft"){event.preventDefault();showImage(selected-1)}
  if(event.key==="ArrowRight"){event.preventDefault();showImage(selected+1)}
 });
 gallery.addEventListener("click",event=>{if(event.target===gallery)close()});
 gallery.addEventListener("close",()=>{
  full.removeAttribute("src");
  if(opener?.isConnected)opener.focus({preventScroll:true});
 });
 full.addEventListener("touchstart",event=>{
  if(event.changedTouches.length)touchX=event.changedTouches[0].clientX;
 },{passive:true});
 full.addEventListener("touchend",event=>{
  if(touchX===null||!event.changedTouches.length)return;
  const dx=event.changedTouches[0].clientX-touchX;touchX=null;
  if(Math.abs(dx)>50)showImage(selected+(dx<0?1:-1));
 },{passive:true});
})();
