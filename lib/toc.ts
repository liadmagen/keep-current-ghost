import { Node } from 'unist'
import visit from 'unist-util-visit'

interface NodeProperties {
  id?: string
}

export interface IToC {
  id: string
  heading: string
  items?: IToC[]
}

interface TOC {
  id: string
  heading: string
  level: string
  parentIndex: number
  items: TOC[] | []
}

export const generateTableOfContents = (htmlAst: Node) => {
  const tags = [`h1`, `h2`, `h3`, `h4`, `h5`, `h6`]

  function headings(node: unknown): node is Node {
    return tags.includes(((node as any).tagName as string))
  }

  // recursive walk to visit all children
  const walk = (children: Node[], text = ``, depth = 0) => {
    children.forEach((child) => {
      if ((child as any).type === `text`) {
        text = text + ((child as any).value || '')
      } else if ((child as any).children && depth < 3) {
        depth = depth + 1
        text = walk((child as any).children as Node[], text, depth)
      }
    })
    return text
  }

  let toc: TOC[] = []
  visit(htmlAst, headings, (node: any) => {
    const text = walk((node.children as Node[]) || [])
    if (text.length > 0) {
      const id = (((node as any).properties as NodeProperties) || {}).id || `error-missing-id`
      const level = ((node as any).tagName as string).substr(1, 1)
      toc.push({ level: level, id: id, heading: text, parentIndex: -1, items: [] })
    }
  })

  // Walk up the list to find matching parent
  const findParent = (toc: TOC[], parentIndex: number, level: string) => {
    while (parentIndex >= 0 && level < toc[parentIndex].level) {
      parentIndex = toc[parentIndex].parentIndex
    }
    return parentIndex >= 0 ? toc[parentIndex].parentIndex : -1
  }

  // determine parents
  toc.forEach((node, index) => {
    const prev = toc[index > 0 ? index - 1 : 0]
    node.parentIndex = node.level > prev.level ? node.parentIndex = index - 1 : prev.parentIndex
    node.parentIndex = node.level < prev.level ? findParent(toc, node.parentIndex, node.level) : node.parentIndex
  })

  // add children to their parent
  toc.forEach((node: TOC) => node.parentIndex >= 0 && (toc[node.parentIndex].items as TOC[]).push(node))

  // make final tree
  let tocTree = toc.filter(({ parentIndex }) => parentIndex === -1)

  const removeProps = ({ id, heading, items }: TOC): IToC => (
    (items.length > 0)
      ? { id, heading, items: (items as TOC[]).map(item => removeProps(item)) }
      : { id, heading }
  )

  return tocTree.map(node => removeProps(node))
}
