const SUPABASE_URL="https://gxcutobwmwdbsfwjgcqr.supabase.co";
const SUPABASE_KEY="sb_publishable_xy9wfM2qYKi8qbdMDAY3dQ_mgTZLuSR";
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const loginPanel=document.getElementById("loginPanel");
const dashboard=document.getElementById("dashboard");
const loginMessage=document.getElementById("loginMessage");
const dashboardMessage=document.getElementById("dashboardMessage");
const publicationList=document.getElementById("publicationList");
const searchInput=document.getElementById("searchPublications");
let publicaciones=[];
let filtro="pendiente";
let busqueda="";

function escapeHtml(value){
 return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function mensaje(el,texto,error=false){
 el.className=error?"status error":"status";
 el.textContent=texto;
 el.hidden=false;
}
function ocultarMensaje(el){el.hidden=true;el.textContent="";}
function mostrarLogin(){dashboard.hidden=true;loginPanel.hidden=false;}
function mostrarPanel(){loginPanel.hidden=true;dashboard.hidden=false;}
function esAdministrador(user){return user?.app_metadata?.role==="admin";}

async function verificarSesion(){
 const {data,error}=await db.auth.getSession();
 if(error||!data.session){mostrarLogin();return;}
 const {data:userData}=await db.auth.getUser();
 if(!esAdministrador(userData?.user)){
  await db.auth.signOut();
  mostrarLogin();
  mensaje(loginMessage,"Esta cuenta no tiene permisos de administración. Contactá al responsable del sitio.",true);
  return;
 }
 mostrarPanel();
 await cargarPublicaciones();
}

document.getElementById("loginForm").addEventListener("submit",async e=>{
 e.preventDefault();
 const button=document.getElementById("loginButton");
 button.disabled=true;button.textContent="Ingresando...";
 ocultarMensaje(loginMessage);
 const email=document.getElementById("email").value.trim();
 const password=document.getElementById("password").value;
 const {data,error}=await db.auth.signInWithPassword({email,password});
 button.disabled=false;button.textContent="Ingresar";
 if(error){mensaje(loginMessage,"No pudimos iniciar sesión. Revisá el correo y la contraseña.",true);return;}
 if(!esAdministrador(data.user)){
  await db.auth.signOut();
  mensaje(loginMessage,"La cuenta ingresada no tiene permisos de administración.",true);
  return;
 }
 mostrarPanel();
 await cargarPublicaciones();
});

document.getElementById("logoutButton").addEventListener("click",async()=>{
 await db.auth.signOut();
 publicaciones=[];
 mostrarLogin();
 document.getElementById("password").value="";
});

function actualizarEstadisticas(){
 document.getElementById("countPending").textContent=publicaciones.filter(p=>p.estado==="pendiente").length;
 document.getElementById("countApproved").textContent=publicaciones.filter(p=>p.estado==="aprobada").length;
 document.getElementById("countRejected").textContent=publicaciones.filter(p=>p.estado==="rechazada").length;
 document.getElementById("countTotal").textContent=publicaciones.length;
}

async function cargarPublicaciones(){
 publicationList.innerHTML='<div class="empty">⏳ Cargando publicaciones...</div>';
 ocultarMensaje(dashboardMessage);
 const {data,error}=await db.from("publicaciones").select("*").order("created_at",{ascending:false});
 if(error){
  publicationList.innerHTML="";
  mensaje(dashboardMessage,"No pudimos cargar las publicaciones. Verificá los permisos de la cuenta.",true);
  return;
 }
 publicaciones=data||[];
 actualizarEstadisticas();
 renderPublicaciones();
}

function renderPublicaciones(){
 const termino=busqueda.trim().toLocaleLowerCase("es");
 const lista=publicaciones.filter(p=>{
  const coincideEstado=filtro==="todas"||p.estado===filtro;
  const texto=[p.titulo,p.descripcion,p.categoria,p.tipo_aviso,p.zona,p.precio,p.contacto].join(" ").toLocaleLowerCase("es");
  return coincideEstado&&(!termino||texto.includes(termino));
 });
 if(!lista.length){
  publicationList.innerHTML='<div class="empty">'+(busqueda?'No encontramos publicaciones con esa búsqueda.':'No hay publicaciones en esta categoría.')+'</div>';
  return;
 }
 publicationList.innerHTML=lista.map(p=>{
  const contacto=String(p.contacto||"").split("|");
  const nombre=contacto[0]?.trim()||"Sin nombre";
  const telefono=contacto.slice(1).join("|").trim();
  const whatsapp=telefono.replace(/\D/g,"");
  const enlaceWhatsapp=whatsapp?'<a target="_blank" rel="noopener" href="https://wa.me/'+escapeHtml(whatsapp)+'">💬 Contactar por WhatsApp</a>':"";
  const fecha=p.created_at?new Date(p.created_at).toLocaleString("es-AR"):"";
  return '<article class="publication"><span class="tag">'+escapeHtml(p.estado)+'</span><h3>'+escapeHtml(p.titulo)+'</h3><p>'+escapeHtml(p.descripcion)+'</p><div class="meta"><strong>Sección:</strong> '+escapeHtml(p.categoria)+' · <strong>Tipo:</strong> '+escapeHtml(p.tipo_aviso||"Sin especificar")+'<br><strong>Zona:</strong> '+escapeHtml(p.zona||"No indicada")+' · <strong>Precio:</strong> '+escapeHtml(p.precio||"No indicado")+'<br><strong>Contacto:</strong> '+escapeHtml(nombre)+' · '+escapeHtml(telefono)+'<br><strong>Recibida:</strong> '+escapeHtml(fecha)+(p.redes_url?'<br><strong>Enlace:</strong> <a target="_blank" rel="noopener" href="'+escapeHtml(p.redes_url)+'">Abrir enlace</a>':"")+'</div><div class="actions">'+enlaceWhatsapp+(p.estado!=="aprobada"?'<button class="primary" data-action="aprobar" data-id="'+p.id+'">✓ Aprobar</button>':"")+(p.estado!=="rechazada"?'<button class="secondary" data-action="rechazar" data-id="'+p.id+'">Rechazar</button>':"")+'<button class="danger" data-action="eliminar" data-id="'+p.id+'">Eliminar</button></div></article>';
 }).join("");
}

searchInput.addEventListener("input",()=>{
 busqueda=searchInput.value;
 renderPublicaciones();
});

document.querySelectorAll("[data-filter]").forEach(button=>button.addEventListener("click",()=>{
 filtro=button.dataset.filter;
 document.querySelectorAll("[data-filter]").forEach(b=>b.classList.toggle("active",b===button));
 renderPublicaciones();
}));

publicationList.addEventListener("click",async e=>{
 const button=e.target.closest("button[data-action]");
 if(!button)return;
 const id=Number(button.dataset.id);
 const accion=button.dataset.action;
 if(accion==="eliminar"&&!confirm("¿Seguro que querés eliminar esta publicación? Esta acción no se puede deshacer."))return;
 button.disabled=true;
 let result;
 if(accion==="aprobar"||accion==="rechazar"){
  result=await db.from("publicaciones").update({estado:accion==="aprobar"?"aprobada":"rechazada"}).eq("id",id);
 }else{
  result=await db.from("publicaciones").delete().eq("id",id);
 }
 if(result.error){
  mensaje(dashboardMessage,"No se pudo completar la acción. Revisá los permisos e intentá nuevamente.",true);
  button.disabled=false;
  return;
 }
 mensaje(dashboardMessage,accion==="aprobar"?"Publicación aprobada y visible en el sitio.":accion==="rechazar"?"Publicación rechazada.":"Publicación eliminada.");
 await cargarPublicaciones();
});

document.getElementById("refreshButton").addEventListener("click",cargarPublicaciones);
db.auth.onAuthStateChange((_event,session)=>{if(!session)mostrarLogin();});
verificarSesion();
