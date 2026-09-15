import {readFileSync,writeFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
const origin='http://localhost:5173';
const initialPassword=readFileSync('outputs/acceso-administrador.txt','utf8').match(/Contraseña inicial: (.+)/)[1].trim();
const temporary='Test-'+randomBytes(18).toString('base64url');
let cookie='',changed=false,original=null,revision=0,restored=false;
const checks=[];
async function call(path,method='GET',data,expected=200,extra={}){const headers={Origin:origin,...extra};if(cookie)headers.Cookie=cookie;if(data)headers['Content-Type']='application/json';const r=await fetch(origin+path,{method,headers,body:data?JSON.stringify(data):undefined});const text=await r.text();let result;try{result=JSON.parse(text)}catch{result={error:text}}assert.equal(r.status,expected,`${method} ${path}: ${JSON.stringify(result)}`);if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];return result;}
function pass(text){checks.push(text);console.log('PASS '+text)}
try{
 await call('/api/content?admin=1','GET',null,401);await call('/api/content','PUT',{data:{}},401);pass('Anonymous editing is rejected');
 await call('/api/auth','POST',{username:'admin',password:'wrong'},401);pass('Invalid credentials are rejected');
 const login=await call('/api/auth','POST',{username:'admin',password:initialPassword});assert.equal(login.authenticated,true);pass('Username/password sign-in works');
 if(login.mustChange){await call('/api/content','PUT',{data:{}},403);pass('Initial password must be changed before editing')}
 await call('/api/admin/password','PUT',{current:initialPassword,password:temporary});changed=true;
 await call('/api/content?admin=1','GET',null,401);pass('Changing password invalidates sessions');
 await call('/api/auth','POST',{username:'admin',password:temporary});
 const loaded=await call('/api/content?admin=1');original=loaded.data;revision=loaded.revision;
 await call('/api/content','PUT',{data:original,revision},403,{Origin:'https://example.invalid'});pass('Cross-origin writes are rejected');
 const bad=structuredClone(original);bad.products[0].price=-1;await call('/api/content','PUT',{data:bad,revision},400);pass('Invalid catalog values are rejected');
 const draft=structuredClone(original);draft.categories.push({id:'qa-category',name:'Categoría de prueba',title:'Portada de prueba',description:'Temporal',image:'/assets/logo.png'});draft.products.push({...draft.products[0],id:'qa-product',name:'Producto de prueba',price:125.5,category:'qa-category'});draft.products[0].visible=false;
 const saved=await call('/api/content','PUT',{data:draft,revision});revision=saved.revision;
 const publicData=await call('/api/content');assert.equal(publicData.products.some(p=>p.id===draft.products[0].id),false);assert.equal(publicData.products.find(p=>p.id==='qa-product').price,125.5);assert.equal(publicData.categories.at(-1).title,'Portada de prueba');pass('Products, prices, category heroes and visibility persist');
 await call('/api/content','PUT',{data:draft,revision:revision-1},409);pass('Concurrent edits cannot overwrite a newer version');
 const invalidForm=new FormData();invalidForm.set('file',new File(['<svg/>'],'bad.svg',{type:'image/svg+xml'}));const invalid=await fetch(origin+'/api/upload',{method:'POST',headers:{Origin:origin,Cookie:cookie},body:invalidForm});assert.equal(invalid.status,400);pass('Unsafe upload formats are rejected');
 const bytes=readFileSync('public/assets/logo.png');const form=new FormData();form.set('file',new File([bytes],'logo.png',{type:'image/png'}));const uploaded=await fetch(origin+'/api/upload',{method:'POST',headers:{Origin:origin,Cookie:cookie},body:form});const uploadData=await uploaded.json();assert.equal(uploaded.status,200,JSON.stringify(uploadData));const media=await fetch(origin+uploadData.url);assert.equal(media.status,200);assert.equal((await media.arrayBuffer()).byteLength,bytes.byteLength);pass('Image upload and public delivery work');
 const reset=await call('/api/content','PUT',{data:original,revision});revision=reset.revision;restored=true;pass('Temporary catalog data removed');
 await call('/api/admin/password','PUT',{current:temporary,password:initialPassword});changed=false;
 await call('/api/auth','POST',{username:'admin',password:initialPassword});await call('/api/auth','DELETE');await call('/api/content?admin=1','GET',null,401);pass('Logout invalidates the session');
 writeFileSync('outputs/verification.json',JSON.stringify({date:new Date().toISOString(),checks,passed:true},null,2));
}finally{
 if(changed){try{await call('/api/auth','POST',{username:'admin',password:temporary});if(original&&!restored)await call('/api/content','PUT',{data:original,revision});await call('/api/admin/password','PUT',{current:temporary,password:initialPassword});}catch(e){console.error('Local test cleanup needs attention:',e.message)}}
}
