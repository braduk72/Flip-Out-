import test from 'node:test'
import assert from 'node:assert/strict'
import { applyPowerUp, createGame, findMatches, generateBoard, legalMoves, resolveBoard, seededRandom, shuffleBoard, swap } from '../src/match3/engine.js'
import { MATCH3_LEVELS, validateMatch3Levels } from '../src/match3/levels.js'
const cell=(token,special=null)=>({token,special,ice:0,chain:0,crate:0,drop:false})
const board=rows=>rows.map(row=>row.map(t=>cell(t)))
test('detects horizontal matches of 3, 4 and 5',()=>{for(const n of [3,4,5]){const b=board([Array(n).fill('a'),Array.from({length:n},(_,i)=>`b${i}`),Array.from({length:n},(_,i)=>`c${i}`)]);assert.equal(findMatches(b).groups[0].length,n)}})
test('detects vertical matches of 3, 4 and 5',()=>{for(const n of [3,4,5]){const b=board(Array.from({length:n},()=>['a','b','c']));assert.equal(findMatches(b).groups[0].length,n)}})
test('detects a T match',()=>{const m=findMatches(board([['b','a','b'],['a','a','a'],['b','a','b']]));assert.equal(m.groups.length,2);assert.ok(m.cells.some(p=>p.horizontal===3&&p.vertical===3))})
test('seeded generation has no starting matches and at least one legal move',()=>{for(let seed=1;seed<50;seed++){const b=generateBoard(MATCH3_LEVELS[0],seed);assert.equal(findMatches(b).cells.length,0);assert.ok(legalMoves(b).length)}})
test('same seed is deterministic',()=>assert.deepEqual(generateBoard(MATCH3_LEVELS[0],17),generateBoard(MATCH3_LEVELS[0],17)))
test('invalid swap is rejected without a move cost',()=>{const s=createGame(MATCH3_LEVELS[0],5),m=s.movesRemaining;let result;for(let r=0;r<8&&!result;r++)for(let c=0;c<7;c++){const x=swap(s,{r,c},{r,c:c+1});if(!x.accepted){result=x;break}}assert.equal(result.accepted,false);assert.equal(s.movesRemaining,m)})
test('legal swap is accepted, cascades and refills',()=>{const s=createGame(MATCH3_LEVELS[0],9),move=legalMoves(s.board)[0],r=swap(s,move.from,move.to);assert.equal(r.accepted,true);assert.equal(r.state.movesRemaining,s.movesRemaining-1);assert.ok(r.state.cascades.length);for(const row of r.state.board)for(const c of row)if(!c.hole&&!c.crate&&!c.drop)assert.ok(c.token)})
test('match four creates a line clearer',()=>{const s=createGame(MATCH3_LEVELS[0],1),ids=['sun','moon','leaf','drop','star','gem'];for(let r=0;r<8;r++)for(let c=0;c<8;c++)s.board[r][c]=cell(ids[(r*2+c)%6]);for(let c=0;c<4;c++)s.board[0][c].token='sun';s.board[0][4].token='moon';const r=resolveBoard(s,{r:0,c:0});assert.ok(r.board.flat().some(c=>c.special==='row'||c.special==='col'))})
test('match five creates a colour clearer',()=>{const s=createGame(MATCH3_LEVELS[0],1);for(let c=0;c<5;c++)s.board[0][c].token='sun';const r=resolveBoard(s,{r:0,c:0});assert.ok(r.board.flat().some(c=>c.special==='color'))})
test('special combination clears tiles',()=>{const s=createGame(MATCH3_LEVELS[0],2);s.board[0][0].special='row';s.board[0][1].special='col';const r=swap(s,{r:0,c:0},{r:0,c:1});assert.equal(r.accepted,true);assert.ok(Object.values(r.state.progress.collected).reduce((a,b)=>a+b,0)>3)})
test('hammer damages one blocker layer and invalid target is not applied',()=>{const s=createGame(MATCH3_LEVELS[3],4),before=s.board[2][2].crate,r=applyPowerUp(s,'hammer',{r:2,c:2});assert.equal(r.applied,true);assert.equal(r.state.board[2][2].crate,before-1);assert.equal(applyPowerUp(s,'hammer',{r:-1,c:0}).applied,false)})
test('falling object can reach the bottom',()=>{const s=createGame(MATCH3_LEVELS[8],3);for(let r=1;r<8;r++)if(s.board[r][2]&&!s.board[r][2].hole){s.board[r][2].token=null;s.board[r][2].drop=false}for(let c=3;c<6;c++)s.board[4][c].token='sun';const r=resolveBoard(s);assert.ok(r.progress.drops>=1)})
test('all power-ups validate and apply',()=>{for(const type of ['shuffle','extra-moves','hammer','line-blast','color-clear']){const s=createGame(MATCH3_LEVELS[0],12),r=applyPowerUp(s,type,['shuffle','extra-moves'].includes(type)?null:{r:0,c:0});assert.equal(r.applied,true,type)}})
test('extra moves restores a lost game',()=>{const s=createGame(MATCH3_LEVELS[0],2);s.status='lost';s.movesRemaining=0;const r=applyPowerUp(s,'extra-moves');assert.equal(r.state.status,'active');assert.equal(r.state.movesRemaining,5)})
test('shuffle returns a match-free playable board',()=>{const b=shuffleBoard(createGame(MATCH3_LEVELS[0],3).board,9);assert.equal(findMatches(b).cells.length,0);assert.ok(legalMoves(b).length)})
test('level data validates',()=>assert.deepEqual(validateMatch3Levels(),[]))
test('seeded random is repeatable',()=>{const a=seededRandom(3),b=seededRandom(3);assert.deepEqual([a(),a(),a()],[b(),b(),b()])})
