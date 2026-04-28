#!/usr/bin/env node
// uuid-scan.mjs
// Usage:
//   node uuid-scan.mjs <NodeName>
//   node uuid-scan.mjs --uuid <UUID>
//   node uuid-scan.mjs TxtPercent --assets ./assets --out results.json

import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, relative, extname } from 'node:path'
import { parseArgs } from 'node:util'

const { positionals, values } = parseArgs({
    args: process.argv.slice(2),
    options: {
        assets: { type: 'string', default: './assets' },
        out:    { type: 'string', default: '' },
        uuid:   { type: 'string', default: '' },
    },
    allowPositionals: true,
})

const targetName = positionals[0] || ''
const targetUUID = values.uuid || ''

if (!targetName && !targetUUID) {
    console.error('Usage: node uuid-scan.mjs <NodeName>')
    console.error('       node uuid-scan.mjs --uuid <UUID>')
    process.exit(1)
}

const JSON_EXTS = new Set(['.scene', '.prefab', '.anim', '.asset', '.json'])
const CODE_EXTS = new Set(['.ts', '.js'])

// ─── filesystem walk, trả về cả json lẫn code ────────────────────────────────
async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true })
    const json = [], code = []
    for (const e of entries) {
        const full = join(dir, e.name)
        if (e.isDirectory()) {
            const sub = await walk(full)
            json.push(...sub.json)
            code.push(...sub.code)
        } else if (JSON_EXTS.has(extname(e.name))) json.push(full)
        else if (CODE_EXTS.has(extname(e.name))) code.push(full)
    }
    return { json, code }
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function resolveNodePath(node, items, visited = new Set()) {
    if (!node) return '?'
    const name = node._name ?? node.name ?? '?'
    if (node.__type__ === 'cc.Scene') return name
    const pid = node._parent?.__id__
    if (typeof pid !== 'number') return name
    if (visited.has(pid)) return name
    visited.add(pid)
    const parent = items[pid]
    if (!parent) return name
    return resolveNodePath(parent, items, visited) + ' > ' + name
}

function resolveOwnerNode(item, items) {
    if (item.__type__ === 'cc.Node') return item
    const id = item?.node?.__id__
    if (typeof id === 'number') return items[id] ?? null
    return null
}

function findAllIdRefPaths(obj, targetIdx, path = '', out = []) {
    if (!obj || typeof obj !== 'object') return out
    for (const [k, v] of Object.entries(obj)) {
        if (k === '__id__') continue
        const fp = path ? `${path}.${k}` : k
        if (v && typeof v === 'object') {
            if (Object.keys(v).length === 1 && v.__id__ === targetIdx) out.push(fp)
            else findAllIdRefPaths(v, targetIdx, fp, out)
        }
    }
    return out
}

function isStructuralProp(prop) {
    return (
        /^_children(\b|\[)/.test(prop)   ||
        /^_parent\b/.test(prop)          ||
        /^_components(\b|\[)/.test(prop) ||
        prop === 'node'
    )
}

// ─── scan JSON (scene / prefab / anim) ───────────────────────────────────────
function scanJsonFile(raw, relPath) {
    let items
    try {
        const parsed = JSON.parse(raw)
        items = Array.isArray(parsed) ? parsed : [parsed]
    } catch { return [] }

    // Có thể có nhiều node cùng tên trong 1 file (hiếm nhưng có)
    const targetIndices = items.reduce((acc, it, idx) => {
        if (!it || it.__type__ !== 'cc.Node') return acc
        const match = targetUUID
            ? it._id === targetUUID
            : (it._name ?? it.name) === targetName
        if (match) acc.push(idx)
        return acc
    }, [])

    if (targetIndices.length === 0) return []

    const hits = []

    for (const targetNodeIdx of targetIndices) {
        const targetNode = items[targetNodeIdx]
        const targetPath = resolveNodePath(targetNode, items)

        const componentIndices = (targetNode._components ?? [])
            .map(c => c?.__id__)
            .filter(id => typeof id === 'number')

        const selfIndices = new Set([targetNodeIdx, ...componentIndices])

        items.forEach((item, idx) => {
            if (!item || typeof item !== 'object') return
            if (selfIndices.has(idx)) return

            for (const ti of [targetNodeIdx, ...componentIndices]) {
                const props = findAllIdRefPaths(item, ti)
                    .filter(p => !isStructuralProp(p))
                if (props.length === 0) continue

                const ownerNode    = resolveOwnerNode(item, items)
                const ownerNodeIdx = ownerNode ? items.indexOf(ownerNode) : -1
                if (selfIndices.has(ownerNodeIdx)) continue

                const nodePath = ownerNode ? resolveNodePath(ownerNode, items) : '—'
                const refType  = ti === targetNodeIdx
                    ? 'cc.Node'
                    : (items[ti]?.__type__ ?? '?')

                for (const prop of props) {
                    hits.push({
                        kind: 'json',
                        file: relPath,
                        targetPath,
                        nodePath,
                        componentType: item.__type__ ?? '—',
                        refType,
                        prop,
                        itemIndex: idx,
                    })
                }
            }
        })
    }

    return hits
}

// ─── scan TypeScript / JavaScript ────────────────────────────────────────────
// Tìm các pattern phổ biến trong code Cocos Creator
function scanCodeFile(raw, relPath) {
    if (!targetName) return []   // uuid-only mode không scan code

    const hits = []
    const lines = raw.split('\n')

    // Pattern cần tìm:
    const patterns = [
        // find('TxtPercent') hoặc find('HUD/ProgressBar/TxtPercent')
        { re: /\bfind\s*\(\s*['"`]([^'"`]*)\b(TARGET)\b([^'"`]*)[`'"]\s*\)/,  label: 'find()' },
        // getChildByName('TxtPercent')
        { re: /getChildByName\s*\(\s*['"`](TARGET)['"`]\s*\)/,                 label: 'getChildByName()' },
        // @property annotation: thường comment hoặc tên biến
        { re: /\b(TARGET)\b/,                                                  label: 'identifier' },
    ]

    // Escape tên để dùng trong regex
    const escaped = targetName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    lines.forEach((line, i) => {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*')) return
        if (!line.includes(targetName)) return

        // Xác định pattern nào match
        let label = 'identifier'
        if (/\bfind\s*\(/.test(line))            label = 'find()'
        else if (/getChildByName\s*\(/.test(line)) label = 'getChildByName()'
        else if (/@property/.test(line))           label = '@property'

        // Bỏ qua dòng chỉ là định nghĩa class/interface/type tên trùng
        if (/^(export\s+)?(class|interface|type|enum)\s/.test(trimmed)) return

        hits.push({
            kind: 'code',
            file: relPath,
            line: i + 1,
            pattern: label,
            snippet: trimmed.slice(0, 120),
        })
    })

    return hits
}

// ─── print ────────────────────────────────────────────────────────────────────
function printResults(results, label) {
    const jsonHits = results.filter(r => r.kind === 'json')
    const codeHits = results.filter(r => r.kind === 'code')

    console.log(`\n[node-scan] target  : "${label}"`)
    console.log(`[node-scan] found   : ${results.length} reference(s)`)
    console.log(`            ├ scene/prefab : ${jsonHits.length}`)
    console.log(`            └ code (.ts)   : ${codeHits.length}\n`)

    if (results.length === 0) {
        console.log('  (no references found)')
        return
    }

    if (jsonHits.length > 0) {
        console.log('── Scene / Prefab ──────────────────────────────────────')
        jsonHits.forEach((r, i) => {
            console.log(`  ${String(i + 1).padStart(2, '0')}  ${r.file}`)
            console.log(`       target   : ${r.targetPath}`)
            console.log(`       used by  : ${r.nodePath}`)
            console.log(`       component: ${r.componentType}`)
            console.log(`       ref type : ${r.refType}`)
            console.log(`       prop     : ${r.prop}`)
            console.log(`       idx      : [${r.itemIndex}]`)
            console.log()
        })
    }

    if (codeHits.length > 0) {
        console.log('── Code (.ts / .js) ────────────────────────────────────')
        codeHits.forEach((r, i) => {
            console.log(`  ${String(i + 1).padStart(2, '0')}  ${r.file}:${r.line}`)
            console.log(`       pattern  : ${r.pattern}`)
            console.log(`       snippet  : ${r.snippet}`)
            console.log()
        })
    }
}

// ─── main ─────────────────────────────────────────────────────────────────────
async function main() {
    const { json: jsonFiles, code: codeFiles } = await walk(values.assets)
    const label   = targetUUID || targetName
    const results = []

    for (const file of jsonFiles) {
        const raw = await readFile(file, 'utf8')
        if (targetName && !raw.includes(`"${targetName}"`)) continue
        if (targetUUID && !raw.includes(targetUUID))         continue
        results.push(...scanJsonFile(raw, relative('.', file)))
    }

    for (const file of codeFiles) {
        const raw = await readFile(file, 'utf8')
        if (!raw.includes(targetName)) continue
        results.push(...scanCodeFile(raw, relative('.', file)))
    }

    console.log(`[node-scan] scanned : ${jsonFiles.length} scene/prefab  +  ${codeFiles.length} code files`)
    printResults(results, label)

    if (values.out) {
        await writeFile(values.out, JSON.stringify({ target: label, results }, null, 2))
        console.log(`[node-scan] results written → ${values.out}`)
    }
}

main().catch(e => { console.error(e); process.exit(1) })