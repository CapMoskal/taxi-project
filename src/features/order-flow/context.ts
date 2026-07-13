import { createActorContext } from '@xstate/react'
import { orderFlowMachine } from './machine'

export const OrderFlowActorContext = createActorContext(orderFlowMachine)
export const OrderFlowProvider = OrderFlowActorContext.Provider
export const useOrderFlowActorRef = OrderFlowActorContext.useActorRef
export const useOrderFlowSelector = OrderFlowActorContext.useSelector
