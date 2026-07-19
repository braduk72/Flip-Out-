import crypto from 'node:crypto'
import { performance } from 'node:perf_hooks'
import { legalMoves } from '../src/match3/engine.js'
const base=process.argv[2];if(!/^https:\/\/flip-[a-z0-9-]+\.vercel\.app$/.test(base??''))throw new Error('A Vercel Preview URL is required')
const identity=await fetch(`${base}/api/fo-identity`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'guest',deviceUuid:crypto.randomUUID()})});if(!identity.ok)throw new Error(`Identity HTTP ${identity.status}`);const token=(await identity.json()).session.token,headers={'content-type':'application/json',authorization:`Bearer ${token}`}
const request=async body=>{const start=performance.now(),response=await fetch(`${base}/api/fo-game?service=match3`,{method:'POST',headers,body:JSON.stringify(body)}),elapsed=performance.now()-start,data=await response.json();if(!response.ok)throw new Error(data.error);return{data,elapsed}}
const started=await request({action:'start',levelId:20,requestId:`latency:${crypto.randomUUID()}`});let session=started.data.session;const moves=[]
for(let i=0;i<10&&session.state.status==='active';i++){const move=legalMoves(session.state.board)[0],result=await request({action:'move',sessionId:session.sessionId,actionId:`latency-move:${crypto.randomUUID()}`,...move});moves.push(result.elapsed);session=result.data.session}
const sorted=[...moves].sort((a,b)=>a-b),avg=moves.reduce((a,b)=>a+b,0)/moves.length
console.log(JSON.stringify({preview:base,startLatencyMs:Number(started.elapsed.toFixed(1)),moveSamples:moves.length,averageMoveApiLatencyMs:Number(avg.toFixed(1)),medianMoveApiLatencyMs:Number(sorted[Math.floor(sorted.length/2)].toFixed(1)),minimumMoveApiLatencyMs:Number(Math.min(...moves).toFixed(1)),maximumMoveApiLatencyMs:Number(Math.max(...moves).toFixed(1))},null,2))
