import { applyPowerUp, createGame, legalMoves, objectiveProgress, seededRandom, swap } from './engine.js'

export const AUTO_STRATEGIES=Object.freeze(['random-legal','greedy-score','objective-aware'])
const total=(values)=>values.reduce((sum,value)=>sum+value,0)
const objectiveRatio=(state,o)=>objectiveProgress(state,o)/o.target
const specials=state=>state.board.flat().filter(cell=>cell?.special).length
const dropDepth=state=>state.board.reduce((sum,row,r)=>sum+row.filter(cell=>cell?.drop).length*r,0)

export function scoreCandidate(before,after,strategy){
  const immediate=after.score-before.score
  if(strategy==='greedy-score')return immediate*100+total(after.cascades.map(c=>c.cleared))*10+specials(after)*5
  if(strategy==='objective-aware'){
    let objectiveGain=0
    for(const o of before.level.objectives){const gain=objectiveRatio(after,o)-objectiveRatio(before,o);const urgency=1-objectiveRatio(before,o);objectiveGain+=gain*(200000+urgency*100000)}
    const needsDrops=before.level.objectives.some(o=>o.type==='drops')
    return objectiveGain+immediate*25+total(after.cascades.map(c=>c.cleared))*20+specials(after)*40+(needsDrops?(dropDepth(after)-dropDepth(before))*5000:0)
  }
  return 0
}

export function chooseAutoMove(state,{strategy='objective-aware',seed=1}={}){
  if(!AUTO_STRATEGIES.includes(strategy))throw new Error(`Unknown strategy ${strategy}`)
  const moves=legalMoves(state.board);if(!moves.length)return null
  const rng=seededRandom(seed)
  if(strategy==='random-legal')return moves[Math.floor(rng()*moves.length)]
  const candidates=moves.map(move=>{const result=swap(state,move.from,move.to);return{move,state:result.state,score:scoreCandidate(state,result.state,strategy),tie:rng()}})
  candidates.sort((a,b)=>b.score-a.score||b.tie-a.tie)
  return candidates[0].move
}

function remainingBlocker(state){for(let r=0;r<state.board.length;r++)for(let c=0;c<state.board[0].length;c++){const cell=state.board[r][c];if(cell?.crate||cell?.ice||cell?.chain)return{r,c}}return null}
function choosePowerUp(state,inventory){
  if(state.status==='lost'&&(inventory['extra-moves']??0)>0)return{type:'extra-moves',target:null}
  if(state.status!=='active'||state.movesRemaining>Math.max(3,Math.floor(state.level.moves*.2)))return null
  const blocker=remainingBlocker(state)
  if(blocker&&(inventory.hammer??0)>0)return{type:'hammer',target:blocker}
  if((inventory['color-clear']??0)>0){for(let r=0;r<state.board.length;r++)for(let c=0;c<state.board[0].length;c++)if(state.board[r][c]?.token)return{type:'color-clear',target:{r,c}}}
  if((inventory['line-blast']??0)>0)return{type:'line-blast',target:{r:Math.floor(state.board.length/2),c:0}}
  return null
}

export function playLevel(level,{strategy='objective-aware',seed=1,safetyLimit=level.moves+20,powerUps={}}={}){
  let state=createGame(level,seed),steps=0,cascadeCount=0,longestCascade=0,deadBoardShuffles=0
  const used={};const inventory={...powerUps}
  while(steps<safetyLimit&&state.status!=='won'){
    const power=choosePowerUp(state,inventory)
    if(power){const applied=applyPowerUp(state,power.type,power.target);if(applied.applied){state=applied.state;inventory[power.type]--;used[power.type]=(used[power.type]??0)+1;if(power.type==='extra-moves')continue}}
    if(state.status!=='active')break
    const move=chooseAutoMove(state,{strategy,seed:seed*1009+steps});if(!move)break
    const next=swap(state,move.from,move.to);if(!next.accepted)throw new Error('Auto-player selected an illegal move')
    state=next.state;steps++;cascadeCount+=state.cascades.length;longestCascade=Math.max(longestCascade,state.cascades.length);deadBoardShuffles+=state.analytics.splice(0).filter(e=>e.type==='dead-board-shuffle').length
  }
  const ratios=state.level.objectives.map(o=>({objective:o,ratio:objectiveRatio(state,o)})).sort((a,b)=>a.ratio-b.ratio)
  const failureReason=state.status==='won'?null:steps>=safetyLimit?'safety-limit':state.status==='lost'?'moves-exhausted':'no-legal-move'
  return{levelId:level.id,strategy,seed,status:state.status,won:state.status==='won',movesUsed:steps,remainingMoves:state.movesRemaining,score:state.score,failureReason,bottleneck:state.status==='won'?null:ratios[0]?.objective,objectiveRatios:ratios.map(x=>x.ratio),powerUpsUsed:used,deadBoardShuffles,cascadeCount,longestCascade,finalState:state}
}

export function classifyDifficulty(winRate){if(winRate>=.85)return'Tutorial';if(winRate>=.70)return'Easy';if(winRate>=.45)return'Medium';if(winRate>=.20)return'Hard';return'Showcase'}
export const DIFFICULTY_TARGETS=Object.freeze({Tutorial:[.85,.98],Easy:[.70,.90],Medium:[.45,.75],Hard:[.20,.50],Showcase:[.10,.35]})
export function compareDifficultyTarget(winRate,band){const range=DIFFICULTY_TARGETS[band];if(!range)throw new Error(`Unknown difficulty band ${band}`);return winRate<range[0]?'below':winRate>range[1]?'above':'within'}
const median=values=>{const sorted=[...values].sort((a,b)=>a-b),mid=Math.floor(sorted.length/2);return sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2}
export function aggregateSimulations(results){
  if(!results.length)throw new Error('No simulation results')
  const wins=results.filter(r=>r.won),failures={},bottlenecks={},powerUps={}
  for(const r of results){if(r.failureReason)failures[r.failureReason]=(failures[r.failureReason]??0)+1;if(r.bottleneck){const k=r.bottleneck.type+(r.bottleneck.token?`:${r.bottleneck.token}`:'');bottlenecks[k]=(bottlenecks[k]??0)+1}for(const[k,v]of Object.entries(r.powerUpsUsed))powerUps[k]=(powerUps[k]??0)+v}
  const winRate=wins.length/results.length
  return{levelId:results[0].levelId,strategy:results[0].strategy,runs:results.length,wins:wins.length,winRate,averageMovesUsed:total(results.map(r=>r.movesUsed))/results.length,medianMovesUsed:median(results.map(r=>r.movesUsed)),averageRemainingMovesOnWins:wins.length?total(wins.map(r=>r.remainingMoves))/wins.length:0,averageScore:total(results.map(r=>r.score))/results.length,failureReasons:failures,objectiveBottlenecks:bottlenecks,powerUpUsage:powerUps,deadBoardShuffles:total(results.map(r=>r.deadBoardShuffles)),averageCascades:total(results.map(r=>r.cascadeCount))/results.length,longestCascade:Math.max(...results.map(r=>r.longestCascade)),difficultyBand:classifyDifficulty(winRate)}
}

export function simulateLevels(levels,{runs=100,strategies=AUTO_STRATEGIES,seed=1,safetyLimit,powerUps={}}={}){const output=[];for(const level of levels)for(const strategy of strategies){const results=[];for(let index=0;index<runs;index++)results.push(playLevel(level,{strategy,seed:seed+level.id*100000+index,safetyLimit:safetyLimit??level.moves+20,powerUps}));output.push(aggregateSimulations(results))}return output}
