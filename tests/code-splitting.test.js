import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
test('Match-3 and large screens are route-level lazy imports under Suspense',async()=>{const app=await readFile(new URL('../src/App.jsx',import.meta.url),'utf8'),main=await readFile(new URL('../src/main.jsx',import.meta.url),'utf8');for(const name of ['Match3','Game','Shop','LuckySpin','Inventory','Marketplace'])assert.match(app,new RegExp(`const ${name}=lazy`));assert.match(main,/Suspense fallback=/)})
