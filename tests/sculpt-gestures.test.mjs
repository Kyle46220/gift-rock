import test from 'node:test';
import assert from 'node:assert/strict';
import {modeForTab,sculptGestureHandlers} from '../lib/sculpt-gestures.ts';
function setup(mode='push') {
  const captures=new Set(),dabs=[];
  const canvas={setPointerCapture:id=>captures.add(id),hasPointerCapture:id=>captures.has(id),releasePointerCapture:id=>captures.delete(id)};
  const handlers=sculptGestureHandlers(canvas,()=>mode,event=>dabs.push(event.pointerId));
  return {handlers,dabs,captures,setMode:next=>{mode=next;}};
}
function event(pointerId=1,primary=true,button=0){return {pointerId,isPrimary:primary,button,prevented:false,stopped:false,preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;}};}
test('entering Sculpt selects a brush; leaving it restores camera navigation',()=>{
 assert.equal(modeForTab('sculpt','orbit'),'push');
 assert.equal(modeForTab('sculpt','pull'),'pull');
 for(const tab of ['shape','surface','image'])assert.equal(modeForTab(tab,'push'),'orbit');
});
test('push and pull strokes capture the finger and prevent camera handling',()=>{
 for(const mode of ['push','pull']){
  const {handlers,dabs,captures}=setup(mode);const down=event(),move=event();
  handlers.start(down);handlers.move(move);
  assert.deepEqual(dabs,[1,1]);assert.ok(captures.has(1));
  assert.ok(down.prevented&&down.stopped&&move.prevented&&move.stopped);
  handlers.end(event());handlers.move(event());
  assert.deepEqual(dabs,[1,1]);assert.equal(captures.size,0);
 }
});
test('a second finger neither sculpts nor reaches orbit controls',()=>{
 const {handlers,dabs}=setup();handlers.start(event());
 const second=event(2,false);handlers.start(second);handlers.move(second);handlers.end(second);
 assert.ok(second.prevented&&second.stopped);assert.deepEqual(dabs,[1]);
 handlers.move(event());assert.deepEqual(dabs,[1,1]);
});
test('cancel or lost capture ends the brush until a new touch',()=>{
 const {handlers,dabs}=setup();handlers.start(event());handlers.end(event());handlers.move(event());
 assert.deepEqual(dabs,[1]);handlers.start(event(3));assert.deepEqual(dabs,[1,3]);
});
test('orbit mode passes one/two finger gestures through without painting',()=>{
 const {handlers,dabs,captures}=setup('orbit');
 for(const e of [event(),event(2,false)]){handlers.start(e);handlers.move(e);handlers.end(e);assert.equal(e.prevented,false);assert.equal(e.stopped,false);}
 assert.equal(dabs.length,0);assert.equal(captures.size,0);
});
test('switching back to orbit releases an active brush and ignores hover/right clicks',()=>{
 const {handlers,dabs,captures,setMode}=setup();handlers.move(event());handlers.start(event(1,true,2));assert.equal(dabs.length,0);
 handlers.start(event());setMode('orbit');const move=event();handlers.move(move);
 assert.equal(move.stopped,false);assert.equal(captures.size,0);assert.deepEqual(dabs,[1]);
});
