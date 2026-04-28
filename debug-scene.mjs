// debug-scene.mjs
import { readFile } from 'node:fs/promises'

const raw = await readFile('./assets/scenes/Game.scene', 'utf8')
const items = JSON.parse(raw)

// In tất cả cc.Node và tên của chúng
items.forEach((it, idx) => {
    if (it?.__type__ === 'cc.Node') {
        console.log(`[${idx}] _name: ${JSON.stringify(it._name)}  name: ${JSON.stringify(it.name)}`)
    }
})

// debug-scene.mjs (thêm vào)
const idx = 56  // thay bằng index tìm được ở trên
const node = items[idx]

// Tìm tất cả item nào có __id__: 56
items.forEach((it, i) => {
    if (!it || typeof it !== 'object') return
    const str = JSON.stringify(it)
    if (str.includes(`"__id__":${idx}`) || str.includes(`"__id__": ${idx}`)) {
        console.log(`\n[${i}] type: ${it.__type__}`)
        console.log(JSON.stringify(it, null, 2).slice(0, 500))
    }
})

// Tìm tất cả item chứa __id__: 56 (raw JSON search)
console.log('\n=== items referencing __id__: 56 ===')
items.forEach((it, i) => {
    if (!it) return
    const str = JSON.stringify(it)
    // tìm cả có space và không có space
    if (str.includes('"__id__":56') || str.includes('"__id__": 56')) {
        console.log(`\n[${i}] type: ${it.__type__}`)
        console.log(str.slice(0, 800))
    }
})

// Tìm item chứa __id__: 58 (cc.Label component)
console.log('\n=== items referencing __id__: 58 (cc.Label) ===')
items.forEach((it, i) => {
    if (!it) return
    const str = JSON.stringify(it)
    if (str.includes('"__id__":58') || str.includes('"__id__": 58')) {
        console.log(`\n[${i}] type: ${it.__type__}`)
        console.log(str.slice(0, 800))
    }
})