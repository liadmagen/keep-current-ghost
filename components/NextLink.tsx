import Link from 'next/link'
import { ComponentPropsWithNode } from 'rehype-react'
import { Node } from 'unist'

import { RenderContent } from '@components/RenderContent'

interface PropertyProps {
  href?: string
}

export const NextLink = (props: ComponentPropsWithNode) => {
  const { href } = (props.node as any)?.properties as PropertyProps
  const [child] = ((props.node as any)?.children as Node[]) || []

  return (
    <>
      {!!href && (
        <Link href={href} legacyBehavior>
          <a>
            <RenderContent htmlAst={child} />
          </a>
        </Link>
      )}
    </>
  )
}
