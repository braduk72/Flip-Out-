import { performance } from 'node:perf_hooks'
import { MATCH3_LEVELS } from '../src/match3/levels.js'
import { createGame, legalMoves, swap } from '../src/match3/engine.js'
const samples=Number(process.argv[2]??200),generation=[],moves=[],cascades=[];const heapStart=process.memoryUsage().heapUsed
for(let i=0;i<samples;i++){const level=MATCH3_LEVELS[i%MATCH3_LEVELS.length],a=performance.now(),state=createGame(level,7000+i);generation.push(performance.now()-a);const move=legalMoves(state.board)[0],b=performance.now(),result=swap(state,move.from,move.to);moves.push(performance.now()-b);if(result.state.cascades.length>1)cascades.push(moves.at(-1))}
if(global.gc)global.gc();const heapEnd=process.memoryUsage().heapUsed,avg=a=>a.reduce((x,y)=>x+y,0)/a.length
console.log(JSON.stringify({samples,averageBoardGenerationMs:Number(avg(generation).toFixed(3)),averageMoveResolutionMs:Number(avg(moves).toFixed(3)),averageCascadeMoveResolutionMs:Number((cascades.length?avg(cascades):0).toFixed(3)),cascadeSamples:cascades.length,heapGrowthBytes:heapEnd-heapStart},null,2))
