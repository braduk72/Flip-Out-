import { writeFile } from 'node:fs/promises'
import { performance } from 'node:perf_hooks'
import { MATCH3_LEVELS, validateMatch3Levels } from '../src/match3/levels.js'
import { AUTO_STRATEGIES, simulateLevels } from '../src/match3/autoplayer.js'
const arg=name=>{const i=process.argv.indexOf(name);return i<0?null:process.argv[i+1]}
const runs=Number(arg('--runs')??100),output=arg('--output'),strategyArg=arg('--strategies'),strategies=strategyArg?strategyArg.split(','):AUTO_STRATEGIES
const errors=validateMatch3Levels();if(errors.length)throw new Error(errors.join('\n'))
const before=process.memoryUsage().heapUsed,start=performance.now(),results=simulateLevels(MATCH3_LEVELS,{runs,strategies,seed:20260718}),elapsedMs=performance.now()-start,after=process.memoryUsage().heapUsed
const report={generatedAt:new Date().toISOString(),runsPerLevelPerStrategy:runs,levels:MATCH3_LEVELS.length,strategies,elapsedMs:Number(elapsedMs.toFixed(3)),averageRunMs:Number((elapsedMs/(runs*MATCH3_LEVELS.length*strategies.length)).toFixed(4)),heapGrowthBytes:after-before,results:results.map(r=>({...r,winRate:Number(r.winRate.toFixed(4)),averageMovesUsed:Number(r.averageMovesUsed.toFixed(3)),averageRemainingMovesOnWins:Number(r.averageRemainingMovesOnWins.toFixed(3)),averageScore:Number(r.averageScore.toFixed(1)),averageCascades:Number(r.averageCascades.toFixed(3))}))}
if(output)await writeFile(output,JSON.stringify(report,null,2))
if(process.argv.includes('--quiet'))console.log(JSON.stringify({output,runs,elapsedMs:report.elapsedMs,averageRunMs:report.averageRunMs,heapGrowthBytes:report.heapGrowthBytes},null,2));else console.log(JSON.stringify(report,null,2))
