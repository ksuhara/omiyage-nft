/* eslint-disable @typescript-eslint/no-unused-vars */
// ** React Imports
import { ReactNode, useContext } from 'react'
// ** Types
import { NavGroup, NavLink } from 'src/@core/layouts/types'
// ** Component Imports
import { AbilityContext } from 'src/layouts/components/acl/Can'

interface Props {
  navGroup?: NavGroup
  children: ReactNode
}

const CanViewNavGroup = (props: Props) => {
  // ** Props
  const { children, navGroup } = props

  // ** Hook
  const ability = useContext(AbilityContext)

  const canViewMenuGroup = (item: NavGroup) => {
    const hasAnyVisibleChild =
      item.children && item.children.some((i: NavLink) => ability && ability.can(i.action, i.subject))

    if (!(item.action && item.subject)) {
      return hasAnyVisibleChild
    }

    return ability && ability.can(item.action, item.subject) && hasAnyVisibleChild
  }

  return <>{children}</>
}

export default CanViewNavGroup
