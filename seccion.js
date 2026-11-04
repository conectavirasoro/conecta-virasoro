const secciones={
servicios:{titulo:"Servicios",emoji:"🔧",subtitulo:"Encontrá profesionales y trabajadores de Virasoro.",categorias:["Electricidad","Plomería","Albañilería","Peluquería y belleza","Informática","Limpieza","Jardinería","Otros servicios"],pregunta:"¿Qué servicio ofrecés?",ejemplo:"Ej.: Electricista matriculado"},
empleos:{titulo:"Empleos",emoji:"💼",subtitulo:"Conectamos a quienes buscan trabajo con quienes necesitan incorporar personal.",categorias:["Administración","Comercio","Gastronomía","Construcción","Transporte","Oficios","Otros"],pregunta:"¿Qué querés publicar?",ejemplo:"Ej.: Se busca vendedor/a",empleo:true},
alquileres:{titulo:"Alquileres",emoji:"🏠",subtitulo:"Casas, departamentos, habitaciones y locales en alquiler.",categorias:["Casa","Departamento","Habitación","Local comercial","Galpón","Otros"],pregunta:"¿Qué propiedad ofrecés?",ejemplo:"Ej.: Departamento de 2 habitaciones"},
"compra-venta":{titulo:"Compra y venta",emoji:"🛒",subtitulo:"Publicá productos nuevos o usados y encontrá oportunidades cerca tuyo.",categorias:["Hogar","Electrodomésticos","Muebles","Ropa y calzado","Herramientas","Tecnología","Otros"],pregunta:"¿Qué producto ofrecés?",ejemplo:"Ej.: Vendo bicicleta en buen estado"},
vehiculos:{titulo:"Vehículos",emoji:"🚗",subtitulo:"Autos, motos, camionetas y otros vehículos.",categorias:["Autos","Motos","Camionetas","Camiones","Maquinaria","Repuestos","Otros"],pregunta:"¿Qué vehículo o producto ofrecés?",ejemplo:"Ej.: Vendo moto 150 cc"}
};

const SUPABASE_URL="https://gxcutobwmwdbsfwjgcqr.supabase.co";
const SUPABASE_KEY="sb_publishable_xy9wfM2qYKi8qbdMDAY3dQ_mgTZLuSR";
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const clave=document.body.dataset.seccion;
const cfg=secciones[clave];
let listado=[];

function norm(t){return String(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")}
function escapar(t){return String(t??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function normalizarTelefono(t){
 let n=String(t||"").replace(/\D/g,"");
 if(n.startsWith("00"))n=n.slice(2);
 if(n.startsWith("0"))n=n.slice(1);
 if(n && !n.startsWith("54") && n.length<=10)n="549"+n;
 return n;
}
function render(lista){
 const el=document.getElementById("listado");
 if(!lista.length){
  el.innerHTML='<div class="empty"><h2>🔎 Todavía no hay publicaciones aprobadas</h2><p>Estamos sumando propuestas de la comunidad. ¿Querés ser de los primeros en publicar?</p><a class="btn" href="#publicar">Enviar mi publicación</a></div>';
  return;
 }
 el.innerHTML=lista.map(x=>{
  const contacto=String(x.contacto||"");
  const partes=contacto.split("|");
  const nombre=partes[0].trim();
  const telefono=normalizarTelefono(partes.slice(1).join("|").trim());
  const enlace=telefono ? '<a href="https://wa.me/'+escapar(telefono)+'" target="_blank" rel="noopener noreferrer">💬 Contactar por WhatsApp</a>' : "";
  const redes=String(x.redes_url||"").trim();
  const enlaceRedes=/^https?:\/\//i.test(redes) ? '<a href="'+escapar(redes)+'" target="_blank" rel="noopener noreferrer">🔗 Más información</a>' : "";
  return '<article class="item"><span class="tag">'+escapar(x.tipo_aviso||cfg.titulo)+'</span><h3>'+escapar(x.titulo)+'</h3><p>'+escapar(x.descripcion)+'</p>'+(x.zona?'<p>📍 '+escapar(x.zona)+'</p>':"")+(x.precio?'<p><strong>Precio / remuneración:</strong> '+escapar(x.precio)+'</p>':"")+(nombre?'<p><small>Contacto: '+escapar(nombre)+'</small></p>':"")+'<div class="actions">'+enlace+' '+enlaceRedes+'</div></article>';
 }).join("");
}
function filtrar(){
 const q=norm(document.getElementById("busqueda").value);
 render(listado.filter(x=>norm([x.titulo,x.descripcion,x.tipo_aviso,x.zona,x.precio].join(" ")).includes(q)));
}
document.getElementById("busqueda").addEventListener("keydown",e=>{if(e.key==="Enter")filtrar()});
document.getElementById("tipo").innerHTML=cfg.categorias.map(c=>'<option value="'+escapar(c)+'">'+escapar(c)+'</option>').join("");
document.getElementById("campoTituloLabel").textContent=cfg.pregunta;
document.getElementById("titulo").placeholder=cfg.ejemplo;
if(clave==="servicios"){
 document.getElementById("modoServicio").hidden=false;
 document.getElementById("modoServicioSelect").required=true;
}
if(cfg.empleo){document.getElementById("modoEmpleo").hidden=false;document.getElementById("modoEmpleoSelect").required=true;}
const modoServicioSelect=document.getElementById("modoServicioSelect");
function actualizarPreguntaServicio(){
 if(clave!=="servicios")return;
 const modoServicio=modoServicioSelect.value;
 const buscando=modoServicio==="Busco un servicio";
 document.getElementById("campoTituloLabel").textContent=buscando?"¿Qué servicio necesitás? *":"¿Qué servicio ofrecés? *";
 document.getElementById("titulo").placeholder=buscando?"Ej.: Necesito un electricista para reparar una instalación":"Ej.: Electricista, plomero o peluquera";
}
modoServicioSelect?.addEventListener("change",actualizarPreguntaServicio);

async function cargarPublicaciones(){
 const el=document.getElementById("listado");
 el.innerHTML='<div class="empty"><p>⏳ Cargando publicaciones...</p></div>';
 const {data,error}=await db.from("publicaciones").select("id,categoria,tipo_aviso,titulo,descripcion,zona,precio,contacto,redes_url,created_at").eq("estado","aprobada").eq("categoria",clave).order("created_at",{ascending:false});
 if(error){
  console.error("No se pudieron cargar las publicaciones:",error);
  el.innerHTML='<div class="empty"><h2>No pudimos cargar los avisos</h2><p>Probá recargar la página dentro de unos minutos.</p></div>';
  return;
 }
 listado=data||[];
 filtrar();
}

document.getElementById("formPublicacion").addEventListener("submit",async e=>{
 e.preventDefault();
 const boton=e.currentTarget.querySelector('button[type="submit"]');
 const textoOriginal=boton.textContent;
 boton.disabled=true;
 boton.textContent="Enviando solicitud...";
 const nombre=document.getElementById("nombre").value.trim();
 const telefono=document.getElementById("telefono").value.trim();
 const modo=document.getElementById("modoEmpleoSelect")?.value||"";
 const modoServicio=document.getElementById("modoServicioSelect")?.value||"";
 const tipo=document.getElementById("tipo").value;
 const modalidad=clave==="servicios"?modoServicio:modo;
 const aviso=modalidad ? modalidad+" · "+tipo : tipo;
 const registro={
  categoria:clave,
  tipo_aviso:aviso,
  titulo:document.getElementById("titulo").value.trim(),
  descripcion:document.getElementById("descripcion").value.trim(),
  zona:document.getElementById("ubicacion").value.trim(),
  precio:document.getElementById("precio").value.trim()||null,
  contacto:nombre+" | "+telefono,
  redes_url:document.getElementById("redes").value.trim()||null,
  estado:"pendiente"
 };
 const {error}=await db.from("publicaciones").insert(registro);
 boton.disabled=false;
 boton.textContent=textoOriginal;
 if(error){
  console.error("Error al guardar la solicitud:",error);
  alert("No pudimos guardar tu solicitud. Revisá tu conexión e intentá nuevamente. Si el problema continúa, contactá a Conecta Virasoro por WhatsApp.");
  return;
 }
 const form=e.currentTarget;
 let avisoEstado=document.getElementById("estadoEnvio");
 if(!avisoEstado){
  avisoEstado=document.createElement("div");
  avisoEstado.id="estadoEnvio";
  avisoEstado.setAttribute("role","status");
  avisoEstado.setAttribute("aria-live","polite");
  avisoEstado.style.cssText="display:block;background:#e5f6f1;color:#145c48;border:2px solid #20b98b;border-radius:12px;padding:18px;margin:18px 0;font-weight:600;line-height:1.6;text-align:center;";
  form.parentNode.insertBefore(avisoEstado,form);
 }
 avisoEstado.textContent="✅ ¡Muchas gracias por tu publicación! Recibimos tus datos correctamente. Nuestro equipo los revisará y, si todo está bien, aprobará el aviso para que aparezca en Conecta Virasoro. Por ahora, tu solicitud está pendiente de revisión.";
 avisoEstado.hidden=false;
 form.reset();
 document.getElementById("tipo").innerHTML=cfg.categorias.map(c=>'<option value="'+escapar(c)+'">'+escapar(c)+'</option>').join("");
 if(clave==="servicios"){
  document.getElementById("modoServicio").hidden=false;
  document.getElementById("modoServicioSelect").required=true;
  actualizarPreguntaServicio();
 }
 if(cfg.empleo){document.getElementById("modoEmpleo").hidden=false;document.getElementById("modoEmpleoSelect").required=true;}
 avisoEstado.scrollIntoView({behavior:"smooth",block:"center"});
});

cargarPublicaciones();
if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));}
