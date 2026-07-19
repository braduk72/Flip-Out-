import test from 'node:test'
import assert from 'node:assert/strict'
import { MATCH3_RULES, applyPowerUp, createGame, findMatches, generateBoard, legalMoves, resolveBoard, seededRandom, shuffleBoard, swap } from '../src/match3/engine.js'
import { MATCH3_LEVELS, validateMatch3Levels } from '../src/match3/levels.js'
const cell=(token,special=null)=>({token,special,ice:0,chain:0,crate:0,drop:false})
const board=rows=>rows.map(row=>row.map(t=>cell(t)))
test('detects horizontal matches of 3, 4 and 5',()=>{for(const n of [3,4,5]){const b=board([Array(n).fill('a'),Array.from({length:n},(_,i)=>`b${i}`),Array.from({length:n},(_,i)=>`c${i}`)]);assert.equal(findMatches(b).groups[0].length,n)}})
test('detects vertical matches of 3, 4 and 5',()=>{for(const n of [3,4,5]){const b=board(Array.from({length:n},()=>['a','b','c']));assert.equal(findMatches(b).groups[0].length,n)}})
test('detects a T match',()=>{const m=findMatches(board([['b','a','b'],['a','a','a'],['b','a','b']]));assert.equal(m.groups.length,2);assert.ok(m.cells.some(p=>p.horizontal===3&&p.vertical===3))})
test('classifies T and L matches for wrapped-special creation',()=>{
 const t=findMatches(board([['b','a','c'],['d','a','e'],['a','a','a'],['f','g','h']]))
 const l=findMatches(board([['a','b','c'],['a','d','e'],['a','a','a']]))
 assert.ok(t.patterns.some(pattern=>pattern.type==='t'))
 assert.ok(l.patterns.some(pattern=>pattern.type==='l'))
})
test('detects supported 2x2 square matches',()=>{
 assert.equal(MATCH3_RULES.squareMatches,true)
 const match=findMatches(board([['a','a','b'],['a','a','c'],['d','e','f']]))
 assert.ok(match.patterns.some(pattern=>pattern.type==='square'))
 assert.equal(match.squareGroups.length,1)
})
test('seeded generation has no starting matches and at least one legal move',()=>{for(let seed=1;seed<50;seed++){const b=generateBoard(MATCH3_LEVELS[0],seed);assert.equal(findMatches(b).cells.length,0);assert.ok(legalMoves(b).length)}})
test('same seed is deterministic',()=>assert.deepEqual(generateBoard(MATCH3_LEVELS[0],17),generateBoard(MATCH3_LEVELS[0],17)))
test('invalid swap is rejected without a move cost',()=>{const s=createGame(MATCH3_LEVELS[0],5),m=s.movesRemaining;let result;for(let r=0;r<8&&!result;r++)for(let c=0;c<7;c++){const x=swap(s,{r,c},{r,c:c+1});if(!x.accepted){result=x;break}}assert.equal(result.accepted,false);assert.equal(s.movesRemaining,m)})
test('legal swap is accepted, cascades and refills',()=>{const s=createGame(MATCH3_LEVELS[0],9),move=legalMoves(s.board)[0],r=swap(s,move.from,move.to);assert.equal(r.accepted,true);assert.equal(r.state.movesRemaining,s.movesRemaining-1);assert.ok(r.state.cascades.length);for(const row of r.state.board)for(const c of row)if(!c.hole&&!c.crate&&!c.drop)assert.ok(c.token)})
test('match four creates a line clearer',()=>{const s=createGame(MATCH3_LEVELS[0],1),ids=['sun','moon','leaf','drop','star','gem'];for(let r=0;r<8;r++)for(let c=0;c<8;c++)s.board[r][c]=cell(ids[(r*2+c)%6]);for(let c=0;c<4;c++)s.board[0][c].token='sun';s.board[0][4].token='moon';const r=resolveBoard(s,{r:0,c:0});assert.ok(r.board.flat().some(c=>c.special==='row'||c.special==='col'))})
test('match five creates a colour clearer',()=>{const s=createGame(MATCH3_LEVELS[0],1);for(let c=0;c<5;c++)s.board[0][c].token='sun';const r=resolveBoard(s,{r:0,c:0});assert.ok(r.board.flat().some(c=>c.special==='color'))})
test('T, L and square matches create wrapped specials',()=>{
 const shapes=[
  [[2,0],[2,1],[2,2],[0,1],[1,1]],
  [[0,0],[1,0],[2,0],[2,1],[2,2]],
  [[0,0],[0,1],[1,0],[1,1]],
 ]
 for(const [index,shape] of shapes.entries()){
  const s=createGame(MATCH3_LEVELS[0],31+index),ids=['sun','moon','leaf','drop','star','gem']
  for(let r=0;r<8;r++)for(let c=0;c<8;c++)s.board[r][c]=cell(ids[(r*2+c)%6])
  for(const [r,c] of shape)s.board[r][c].token='sun'
  const result=resolveBoard(s,shape[0])
  assert.ok(result.cascades[0].createdSpecials.some(special=>special.type==='wrapped'),`shape ${index}`)
 }
})
test('special combination clears tiles',()=>{const s=createGame(MATCH3_LEVELS[0],2);s.board[0][0].special='row';s.board[0][1].special='col';const r=swap(s,{r:0,c:0},{r:0,c:1});assert.equal(r.accepted,true);assert.ok(Object.values(r.state.progress.collected).reduce((a,b)=>a+b,0)>3)})
test('a single swapped special activates without requiring a normal match',()=>{
 const s=createGame(MATCH3_LEVELS[0],52)
 s.board[0][0].special='row'
 const result=swap(s,{r:0,c:0},{r:0,c:1})
 assert.equal(result.accepted,true)
 assert.equal(result.state.cascades[0].kind,'special-activation')
 assert.equal(result.state.cascades[0].comboType,'row')
})
test('line, wrapped and colour combinations resolve with distinct effects',()=>{
 const combinations=[
  ['row','col','line+line'],
  ['row','wrapped','line+wrapped'],
  ['wrapped','wrapped','wrapped+wrapped'],
  ['color','row','color+row'],
  ['color','wrapped','color+wrapped'],
  ['color','color','color+color'],
 ]
 for(const [index,[first,second,expected]] of combinations.entries()){
  const s=createGame(MATCH3_LEVELS[0],70+index)
  s.board[3][3].special=first
  s.board[3][4].special=second
  const result=swap(s,{r:3,c:3},{r:3,c:4})
  assert.equal(result.accepted,true,expected)
  assert.equal(result.state.cascades[0].comboType,expected)
  assert.equal(result.state.cascades[0].kind,'special-combination')
 }
})
test('colour bomb plus a normal token clears that token colour',()=>{
 const s=createGame(MATCH3_LEVELS[0],90)
 s.board[2][2].special='color'
 s.board[2][3].special=null
 const target=s.board[2][3].token
 const count=s.board.flat().filter(current=>current.token===target).length
 const result=swap(s,{r:2,c:2},{r:2,c:3})
 assert.equal(result.state.cascades[0].comboType,'color+token')
 assert.ok((result.state.progress.collected[target]??0)>=count)
})
test('specials trigger recursively during a chain reaction',()=>{
 const s=createGame(MATCH3_LEVELS[0],104)
 s.board[2][2].special='row'
 s.board[2][5].special='col'
 const result=swap(s,{r:2,c:2},{r:2,c:3})
 const triggered=result.state.cascades[0].triggeredSpecials.map(special=>special.type)
 assert.ok(triggered.includes('row'))
 assert.ok(triggered.includes('col'))
})
test('cascade score uses increasing multipliers and exposes combo feedback data',()=>{
 let result
 for(let seed=1;seed<=250&&!result;seed++){
  const s=createGame(MATCH3_LEVELS[0],seed)
  for(const move of legalMoves(s.board)){
   const candidate=swap(s,move.from,move.to)
   if(candidate.state.cascades.length>=2){result=candidate.state;break}
  }
 }
 assert.ok(result,'expected a reproducible multi-cascade seed')
 assert.equal(result.cascades[0].multiplier,1)
 assert.equal(result.cascades[1].multiplier,1.5)
 assert.equal(result.combo.count,result.cascades.length)
 assert.ok(result.combo.label)
 assert.equal(result.combo.scoreGained,result.cascades.reduce((sum,cascade)=>sum+cascade.scoreGain,0))
})
test('legacy bomb specials resume as wrapped specials',()=>{
 const s=createGame(MATCH3_LEVELS[0],122)
 s.version=1
 s.board[4][4].special='bomb'
 const result=swap(s,{r:4,c:4},{r:4,c:5})
 assert.equal(result.accepted,true)
 assert.equal(result.state.version,2)
 assert.equal(result.state.cascades[0].comboType,'wrapped')
})
test('hammer damages one blocker layer and invalid target is not applied',()=>{const s=createGame(MATCH3_LEVELS[3],4),before=s.board[2][2].crate,r=applyPowerUp(s,'hammer',{r:2,c:2});assert.equal(r.applied,true);assert.equal(r.state.board[2][2].crate,before-1);assert.equal(applyPowerUp(s,'hammer',{r:-1,c:0}).applied,false)})
test('falling object can reach the bottom',()=>{const s=createGame(MATCH3_LEVELS[8],3);for(let r=1;r<8;r++)if(s.board[r][2]&&!s.board[r][2].hole){s.board[r][2].token=null;s.board[r][2].drop=false}for(let c=3;c<6;c++)s.board[4][c].token='sun';const r=resolveBoard(s);assert.ok(r.progress.drops>=1)})
test('all power-ups validate and apply',()=>{for(const type of ['shuffle','extra-moves','hammer','line-blast','color-clear']){const s=createGame(MATCH3_LEVELS[0],12),r=applyPowerUp(s,type,['shuffle','extra-moves'].includes(type)?null:{r:0,c:0});assert.equal(r.applied,true,type)}})
test('extra moves restores a lost game',()=>{const s=createGame(MATCH3_LEVELS[0],2);s.status='lost';s.movesRemaining=0;const r=applyPowerUp(s,'extra-moves');assert.equal(r.state.status,'active');assert.equal(r.state.movesRemaining,5)})
test('non-clearing power-ups do not replay stale cascade feedback',()=>{
 const s=createGame(MATCH3_LEVELS[0],18)
 s.cascades=[{kind:'match',createdSpecials:[],triggeredSpecials:[],scoreGain:150}]
 s.combo={count:1,multiplier:1,label:'Nice match!',scoreGained:150}
 const extra=applyPowerUp({...s,status:'lost',movesRemaining:0},'extra-moves')
 const shuffled=applyPowerUp(s,'shuffle')
 assert.deepEqual(extra.state.cascades,[])
 assert.deepEqual(shuffled.state.cascades,[])
 assert.equal(extra.state.combo.count,0)
 assert.equal(shuffled.state.combo.count,0)
})
test('shuffle returns a match-free playable board',()=>{const b=shuffleBoard(createGame(MATCH3_LEVELS[0],3).board,9);assert.equal(findMatches(b).cells.length,0);assert.ok(legalMoves(b).length)})
test('level data validates',()=>assert.deepEqual(validateMatch3Levels(),[]))
test('seeded random is repeatable',()=>{const a=seededRandom(3),b=seededRandom(3);assert.deepEqual([a(),a(),a()],[b(),b(),b()])})
