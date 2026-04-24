#!/usr/bin/env node
// uuid-scan.mjs — static UUID reference scanner for Cocos Creator 3.x
// Usage: node uuid-scan.mjs <uuid> [--assets ./assets] [--out results.json]

import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, relative, extname } from 'node:path'
import { parseArgs } from 'node:util'

const { positionals, values } = parseArgs({
    args: process.argv.slice(2),
    options: {
        assets: { type: 'string', default: './assets' },
        out:    { type: 'string', default: '' },
        short:  { type: 'boolean', default: false },
    },
    allowPositionals: true,
})

const targetUUID = positionals[0]
if (!targetUUID) { console.error('Usage: node uuid-scan.mjs <uuid>'); process.exit(1) }
const targets = new Set([targetUUID])

const SCAN_EXTS = new Set(['.scene', '.prefab', '.anim', '.asset', '.json'])

async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true })
    const files = []
    for (const e of entries) {
        const full = join(dir, e.name)
        if (e.isDirectory()) files.push(...await walk(full))
        else if (SCAN_EXTS.has(extname(e.name))) files.push(full)
    }
    return files
}

function findContext(obj, uuid, path = '', ctx = {}) {
    if (!obj || typeof obj !== 'object') return null
    const local = { type: obj.__type__ ?? ctx.type, name: obj._name ?? obj.name ?? ctx.name }
    for (const [k, v] of Object.entries(obj)) {
        const fp = path ? `${path}.${k}` : k
        if (typeof v === 'string' && [...targets].some(t => v.includes(t)))
            return { propPath: fp, ...local }
        if (k === '__uuid__' && [...targets].some(t => v === t))
            return { propPath: fp, ...local }
        if (typeof v === 'object') {
            const r = findContext(v, uuid, fp, local)
            if (r) return r
        }
    }
    return null
}

async function main() {
    const files = await walk(values.assets)
    const results = []
    let scanned = 0

    for (const file of files) {
        const raw = await readFile(file, 'utf8')
        const hasRef = [...targets].some(t => raw.includes(t))
        if (!hasRef) { scanned++; continue }

        let parsed
        try { parsed = JSON.parse(raw) } catch { parsed = null }

        if (!parsed) {
            results.push({ file: relative('.', file), type: '', name: '', propPath: '(raw match)' })
        } else {
            const items = Array.isArray(parsed) ? parsed : [parsed]
            for (const item of items) {
                const ctx = findContext(item, targetUUID)
                if (ctx) results.push({ file: relative('.', file), ...ctx })
            }
        }
        scanned++
    }

    console.log(`\n[uuid-scan] target  : ${targetUUID}`)
    console.log(`[uuid-scan] scanned : ${scanned} files`)
    console.log(`[uuid-scan] found   : ${results.length} reference(s)\n`)

    if (results.length === 0) {
        console.log('  (no references found)')
    } else {
        results.forEach((r, i) => {
            console.log(`  ${String(i+1).padStart(2,'0')}  ${r.file}`)
            console.log(`       type : ${r.type || '—'}`)
            console.log(`       node : ${r.name || '—'}`)
            console.log(`       prop : ${r.propPath}`)
            console.log()
        })
    }

    if (values.out) {
        await writeFile(values.out, JSON.stringify({ targetUUID, results }, null, 2))
        console.log(`[uuid-scan] results written → ${values.out}`)
    }
}

main().catch(e => { console.error(e); process.exit(1) })