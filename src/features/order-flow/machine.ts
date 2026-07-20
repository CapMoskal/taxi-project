import { assign, setup } from 'xstate'
import type { OrderFlowContext, OrderFlowEvent } from './types'

const initialContext: OrderFlowContext = {
  userLocation: null,
  pickup: null,
  destination: null,
  selectedClassId: null,
  driver: null,
  driverLocation: null,
  fare: null,
  payment: null,
  rating: null,
}

export const orderFlowMachine = setup({
  types: {
    context: {} as OrderFlowContext,
    events: {} as OrderFlowEvent,
  },
  actions: {
    resetOrder: assign(() => initialContext),
  },
  guards: {
    hasPickup: ({ context }) => context.pickup !== null,
    hasDestination: ({ context }) => context.destination !== null,
    hasSelectedClass: ({ context }) => context.selectedClassId !== null,
  },
}).createMachine({
  id: 'orderFlow',
  initial: 'idle',
  context: initialContext,
  // Available in every state so PickupResolver can seed userLocation/pickup
  // as soon as geolocation settles, whether that happens on `idle` or
  // `selectingPickup` — see docs/decisions.md.
  on: {
    SET_USER_LOCATION: { actions: assign({ userLocation: ({ event }) => event.coords }) },
    SET_PICKUP: { actions: assign({ pickup: ({ event }) => event.coords }) },
  },
  states: {
    idle: {
      on: { START_ORDER: 'selectingPickup' },
    },
    selectingPickup: {
      on: {
        CONFIRM_PICKUP: { target: 'selectingDestination', guard: 'hasPickup' },
        CANCEL_RIDE: { target: 'idle', actions: 'resetOrder' },
      },
    },
    selectingDestination: {
      on: {
        SET_DESTINATION: { actions: assign({ destination: ({ event }) => event.coords }) },
        CONFIRM_DESTINATION: { target: 'selectingClass', guard: 'hasDestination' },
      },
    },
    selectingClass: {
      on: {
        SELECT_CLASS: { actions: assign({ selectedClassId: ({ event }) => event.classId }) },
        CONFIRM_CLASS: {
          target: 'searchingDriver',
          guard: 'hasSelectedClass',
          actions: assign({ fare: ({ event }) => event.fare }),
        },
        BACK_TO_DESTINATION: 'selectingDestination',
      },
    },
    searchingDriver: {
      on: {
        DRIVER_FOUND: { target: 'driverAssigned', actions: assign({ driver: ({ event }) => event.driver }) },
        SEARCH_FAILED: 'selectingClass',
        CANCEL_RIDE: { target: 'idle', actions: 'resetOrder' },
      },
    },
    driverAssigned: {
      on: {
        DRIVER_EN_ROUTE: 'enRoute',
        CANCEL_RIDE: { target: 'idle', actions: 'resetOrder' },
      },
    },
    enRoute: {
      on: {
        DRIVER_LOCATION_UPDATE: { actions: assign({ driverLocation: ({ event }) => event.coords }) },
        DRIVER_ARRIVED: 'arrived',
        CANCEL_RIDE: { target: 'idle', actions: 'resetOrder' },
      },
    },
    arrived: {
      on: { START_RIDE: 'inRide' },
    },
    inRide: {
      on: {
        DRIVER_LOCATION_UPDATE: { actions: assign({ driverLocation: ({ event }) => event.coords }) },
        RIDE_COMPLETED: { target: 'completed' },
      },
    },
    completed: {
      type: 'parallel',
      states: {
        payment: {
          initial: 'pending',
          states: {
            pending: {
              on: {
                SUBMIT_PAYMENT: { target: 'paid', actions: assign({ payment: ({ event }) => event.payment }) },
              },
            },
            paid: { type: 'final' },
          },
        },
        rating: {
          initial: 'pending',
          states: {
            pending: {
              on: {
                SUBMIT_RATING: { target: 'rated', actions: assign({ rating: ({ event }) => event.rating }) },
              },
            },
            rated: { type: 'final' },
          },
        },
      },
      onDone: 'done',
    },
    done: {
      on: { RESET: { target: 'idle', actions: 'resetOrder' } },
    },
  },
})
