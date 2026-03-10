document.addEventListener("DOMContentLoaded", () => {

initIntro()
initReveal()
initScrollSigil()
initContactForm()
initSpotify()
initProjects()
initTerminal()
initParallax()
loadGithub()
})

/* ================= GLOBAL ================= */

const INTRO_DURATION = 2800


/* ================= INTRO ================= */

function initIntro(){

const intro = document.getElementById("intro-screen")
if(!intro) return

if(!sessionStorage.getItem("introPlayed")){

setTimeout(()=>{

intro.classList.add("fade-out")
sessionStorage.setItem("introPlayed","true")

setTimeout(()=>{
intro.style.display="none"
},800)

},INTRO_DURATION - 800)

}else{

intro.style.display="none"

}

}


/* ================= REVEAL ================= */

function initReveal(){

const sections = document.querySelectorAll("section")

const observer = new IntersectionObserver(entries => {

entries.forEach(entry=>{
if(entry.isIntersecting){
entry.target.classList.add("visible")
}
})

},{threshold:0.2})

sections.forEach(section=>{
section.classList.add("hidden")
observer.observe(section)
})

}


/* ================= SCROLL SIGIL ================= */

function initScrollSigil(){

const sigil = document.getElementById("scroll-sigil")
if(!sigil) return

let lastScroll = window.scrollY
let timeout

window.addEventListener("scroll",()=>{

const current = window.scrollY

if(current > lastScroll){

sigil.style.top="auto"
sigil.style.bottom="40px"

}else{

sigil.style.bottom="auto"
sigil.style.top="40px"

}

sigil.style.opacity="1"

clearTimeout(timeout)

timeout=setTimeout(()=>{
sigil.style.opacity="0"
},700)

lastScroll=current

})

}

/* ================= CONTACT FORM ================= */

function initContactForm(){

const form = document.getElementById("contact-form")
const status = document.getElementById("form-status")

if(!form) return

form.addEventListener("submit", async e => {

e.preventDefault()

const email = document.getElementById("email").value
const message = document.getElementById("message").value

const btn = form.querySelector(".btn-submit")
const original = btn.innerText

btn.innerText="Sending..."
btn.disabled=true

try{

const res = await fetch("/api/contact",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({email,message})
})

const data = await res.json()

if(res.ok){

form.reset()

status.textContent="✔ Message sent"
status.className="form-status success"

}else{

status.textContent=data.error || "Something went wrong"
status.className="form-status error"

}

}catch(err){

console.error(err)

status.textContent="Server error"
status.className="form-status error"

}

btn.innerText=original
btn.disabled=false

})

}


/* ================= SPOTIFY ================= */

function initSpotify(){

fetchSpotify()
setInterval(fetchSpotify,15000)

}

async function fetchSpotify(){

const track = document.querySelector(".track")
const cover = document.querySelector(".cover img")
const label = document.querySelector(".label")
const disc = document.querySelector(".cd-disc")

if(!track || !cover || !label || !disc) return

try{

const res = await fetch("/api/spotify")
const data = await res.json()

if(data.isPlaying){

label.innerText="NOW LISTENING"

track.innerHTML=`
<a href="${data.songUrl}" target="_blank"
style="color:inherit;text-decoration:none;border-bottom:1px solid var(--green)">
${data.artist} – ${data.title}
</a>`

cover.src=data.albumImageUrl

cover.parentElement.classList.add("playing")

disc.style.left="85px"
disc.style.animationPlayState="running"

}else{

label.innerText="PAUSED"
track.innerText="Cisza w eterze..."

cover.src="images/chivas-cover.png"

cover.parentElement.classList.remove("playing")

disc.style.left="45px"
disc.style.animationPlayState="paused"

}

}catch(err){

console.error("Spotify error:",err)

}

}


/* ================= PROJECTS ================= */

function initProjects(){

loadProjects()

}

async function loadProjects(){

const container=document.getElementById("projects-container")
if(!container) return

try{

const res=await fetch("/api/projects")
const projects=await res.json()

container.innerHTML=""

projects.forEach(p=>{

const section=document.createElement("section")
section.className="section-box"

section.innerHTML=`
<h3>${p.title}</h3>
<p>${p.description}</p>
<div class="tech">${p.tech}</div>
<div class="links">
${p.live ? `<a href="${p.live}" target="_blank">live</a>`:""}
<a href="${p.github}" target="_blank">github</a>
</div>
`

container.appendChild(section)

})

}catch(err){

console.error("Projects error:",err)
container.innerHTML="<p>Nie udało się załadować projektów.</p>"

}

}


/* ================= TERMINAL ================= */

function initTerminal(){

const terminal = document.querySelector(".terminal")
const text = document.getElementById("terminal-text")
const inputLine = document.querySelector(".terminal-input-line")
const input = document.getElementById("terminal-input")
const btn = document.getElementById("terminal-btn")

if(!terminal || !text) return


/* jeśli terminal był już odpalony */

if(sessionStorage.getItem("terminalPlayed")){

text.textContent =
`herman@dev:~$ boot portfolio
loading modules...
projects loaded
system ready
welcome, herman
`

inputLine.style.display = "flex"
btn.style.display = "block"

if(input) input.focus()

return

}


/* boot linie */

const lines = [
"herman@dev:~$ boot portfolio",
"loading modules...",
"spotify connected",
"projects loaded",
"system ready"
]

let line = 0
let char = 0

function type(){

if(line < lines.length){

if(char < lines[line].length){

text.textContent += lines[line][char]

char++

setTimeout(type,25)

}else{

text.textContent += "\n"

line++
char = 0

setTimeout(type,300)

}

}else{

sessionStorage.setItem("terminalPlayed","true")

inputLine.style.display = "flex"
btn.style.display = "block"

if(input) input.focus()

}

}


/* CRT boot */

setTimeout(()=>{

terminal.classList.add("crt-glitch")

const bootLine = document.createElement("div")
bootLine.className = "terminal-boot"

terminal.appendChild(bootLine)

bootLine.animate([
{transform:"scaleY(0)",opacity:1},
{transform:"scaleY(25)",opacity:0}
],{
duration:350,
easing:"ease-out"
})

setTimeout(()=>{

bootLine.remove()
type()

},350)

},INTRO_DURATION)

}


/* ================= PARALLAX ================= */

function initParallax(){

document.addEventListener("mousemove", e => {

const x = (e.clientX / window.innerWidth) * 10
const y = (e.clientY / window.innerHeight) * 10

document.body.style.backgroundPosition = `${50 - x/2}% ${50 - y/2}%`

})

}

async function loadGithub(){

try{

const res = await fetch("/api/stats")
const data = await res.json()

const repos = document.getElementById("github-repos")
const followers = document.getElementById("github-followers")
const badge = document.getElementById("github-repos-badge")

if(repos){
repos.innerText = data.githubRepos
}

if(followers){
followers.innerText = data.githubFollowers
}

if(badge){
badge.innerText = data.githubRepos
}

}catch(err){

console.error("GitHub error:",err)

}

}