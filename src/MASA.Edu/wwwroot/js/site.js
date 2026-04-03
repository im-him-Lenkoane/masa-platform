(function(){
  var t=localStorage.getItem("masa-theme")||"light";
  document.documentElement.setAttribute("data-theme",t);
})();
function toggleTheme(){
  var h=document.documentElement,n=h.getAttribute("data-theme")==="dark"?"light":"dark";
  h.setAttribute("data-theme",n);localStorage.setItem("masa-theme",n);
  var b=document.getElementById("themeBtn");
  if(b)b.textContent=n==="dark"?"\u2600":"\u263E";
}
function toggleMenu(){var m=document.getElementById("navMobile");if(m)m.classList.toggle("open");}
document.addEventListener("DOMContentLoaded",function(){
  var b=document.getElementById("themeBtn");
  if(b){var t=document.documentElement.getAttribute("data-theme");b.textContent=t==="dark"?"\u2600":"\u263E";}
  if("IntersectionObserver" in window){
    var obs=new IntersectionObserver(function(e){
      e.forEach(function(x){if(x.isIntersecting){x.target.style.animationPlayState="running";obs.unobserve(x.target);}});
    },{threshold:0.12});
    document.querySelectorAll(".anim").forEach(function(el){el.style.animationPlayState="paused";obs.observe(el);});
  }
});
