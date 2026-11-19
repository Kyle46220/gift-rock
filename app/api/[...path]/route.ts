// The original public site continues to own saved rocks and images in D1/R2.
// Proxy only the four existing API operations; never forward cookies or credentials.
const STORAGE_ORIGIN = 'https://little-rock-post.kyle394956.chatgpt.site';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
async function proxy(request:Request,{params}:{params:Promise<{path:string[]}>}) {
 const {path}=await params;
 const collection=path[0];
 if(!['rocks','images'].includes(collection) || path.length>2 || (path[1]&&!/^[a-f0-9-]{36}$/.test(path[1])) || (request.method==='GET'&&path.length!==2) || (request.method==='POST'&&path.length!==1)) return Response.json({error:'Not found'},{status:404});
 if(request.method==='POST'){
   const origin=request.headers.get('origin');
   if(origin){
     let originHost:string;
     try{originHost=new URL(origin).host;}catch{return Response.json({error:'Invalid origin'},{status:403});}
     const host=request.headers.get('x-forwarded-host')||request.headers.get('host')||new URL(request.url).host;
     if(originHost!==host)return Response.json({error:'Invalid origin'},{status:403});
   }
 }
 try{
   const headers=new Headers();let body:ArrayBuffer|undefined;
   if(request.method==='POST'){
     const limit=collection==='images'?3000000:100000;
     if(Number(request.headers.get('content-length')||0)>limit)return Response.json({error:'Upload too large'},{status:413});
     body=await request.arrayBuffer();if(body.byteLength>limit)return Response.json({error:'Upload too large'},{status:413});
     headers.set('Content-Type',collection==='images'?'image/jpeg':'application/json');
   }
   const upstream=await fetch(`${STORAGE_ORIGIN}/api/${path.join('/')}`,{method:request.method,headers,body,redirect:'error',signal:AbortSignal.timeout(20000),cache:'no-store'});
   const responseHeaders=new Headers({'X-Content-Type-Options':'nosniff'});
   for(const key of ['content-type','cache-control']){const value=upstream.headers.get(key);if(value)responseHeaders.set(key,value);}
   return new Response(upstream.body,{status:upstream.status,headers:responseHeaders});
 }catch(error){console.error('Rock storage request failed',error);return Response.json({error:'Storage is temporarily unavailable. Your edits are still here; please retry.'},{status:503});}
}
export const GET=proxy;
export const POST=proxy;
