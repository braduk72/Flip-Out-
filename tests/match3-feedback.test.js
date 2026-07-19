import test from 'node:test'
import assert from 'node:assert/strict'
import { createMatch3Feedback, exportMatch3Feedback } from '../src/utils/match3Feedback.js'
test('development feedback export is structured and excludes unapproved personal fields',()=>{const record=createMatch3Feedback({level:3,result:'won',movesUsed:12,powerUpsUsed:{hammer:1},inputMethod:'touch',animationSetting:'reduced',perceivedDifficulty:3,controlProblems:'none',visualClarityProblems:'none',notes:'clear',email:'not allowed'},{now:0,userAgent:'Test Browser',width:320,height:640,orientation:'portrait'});assert.equal(record.screen.width,320);assert.equal(record.email,undefined);assert.deepEqual(JSON.parse(exportMatch3Feedback(record)),record)})
test('feedback rejects invalid difficulty rating',()=>assert.throws(()=>createMatch3Feedback({perceivedDifficulty:8})))
