import RockApp from '@/app/rock-app';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <RockApp rockId={id}/>;}
