import { z } from 'zod';
export const rockSchema = z.object({
 template:z.number().int().min(0).max(5), stone:z.enum(['granite','basalt','sandstone','marble']), color:z.string().regex(/^#[0-9a-fA-F]{6}$/), roughness:z.number().min(0).max(1), stretch:z.number().min(.7).max(1.3), flatten:z.number().min(.65).max(1.25),
 strokes:z.array(z.object({x:z.number().min(-3).max(3),y:z.number().min(-3).max(3),z:z.number().min(-3).max(3),strength:z.number().min(-.1).max(.1),radius:z.number().min(.1).max(.7)})).max(400),
 wrap:z.object({size:z.number().min(.15).max(.8),x:z.number().min(0).max(1),y:z.number().min(.2).max(.8),rotation:z.number().min(-180).max(180)}),image:z.string().max(150).nullable()
});
export type RockConfig=z.infer<typeof rockSchema>;
export const initialRock:RockConfig={template:0,stone:'granite',color:'#9a9b91',roughness:.45,stretch:1,flatten:1,strokes:[],wrap:{size:.38,x:.25,y:.5,rotation:0},image:null};
export const templates=['River pebble','Rugged boulder','Skipping stone','Mountain shard','Coastal stone','Weathered oval'];
