import { and, assign, setup } from 'xstate'
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
  layout: 'mobile',
}

export const orderFlowMachine = setup({
  types: {
    context: {} as OrderFlowContext,
    events: {} as OrderFlowEvent,
  },
  actions: {
    // Layout survives RESET ("Заказать снова") — it's a viewport fact, not
    // part of the order being reset, and losing it would drop the desktop
    // compose panel back into step-by-step mode after every completed ride.
    resetOrder: assign(({ context }) => ({ ...initialContext, layout: context.layout })),
  },
  guards: {
    hasPickup: ({ context }) => context.pickup !== null,
    hasDestination: ({ context }) => context.destination !== null,
    hasSelectedClass: ({ context }) => context.selectedClassId !== null,
    isDesktopLayout: ({ context }) => context.layout === 'desktop',
  },
}).createMachine({
  id: 'orderFlow',
  initial: 'selectingPickup',
  context: initialContext,
  // Available in every state so PickupResolver can seed userLocation/pickup
  // as soon as geolocation settles — see docs/decisions.md. SELECT_CLASS is
  // global for the same reason since 2d: OrderComposePanel's class grid (and
  // its auto-select effect) now render as soon as pickup resolves, before
  // the machine reaches selectingClass (destination not set yet) — a
  // state-scoped handler would silently drop the event (XState's default for
  // unhandled events), and the "Заказать" button never gets a selectedQuote
  // to show a real price with. Only OrderComposePanel can ever send this
  // (UI-gated), so it being reachable outside selectingClass is harmless.
  on: {
    SET_LAYOUT: { actions: assign({ layout: ({ event }) => event.layout }) },
    SET_USER_LOCATION: { actions: assign({ userLocation: ({ event }) => event.coords }) },
    SET_PICKUP: { actions: assign({ pickup: ({ event }) => event.coords }) },
    SELECT_CLASS: { actions: assign({ selectedClassId: ({ event }) => event.classId }) },
  },
  states: {
    selectingPickup: {
      on: {
        CONFIRM_PICKUP: { target: 'selectingDestination', guard: 'hasPickup' },
      },
      // Desktop skips the standalone pickup step (A = resolved location,
      // shown editable inside the compose panel instead) — as soon as
      // PickupResolver seeds pickup, jump straight to picking B. Guarded
      // false on mobile, where this step is still shown step-by-step.
      always: [{ target: 'selectingDestination', guard: and(['hasPickup', 'isDesktopLayout']) }],
    },
    selectingDestination: {
      on: {
        SET_DESTINATION: { actions: assign({ destination: ({ event }) => event.coords }) },
        CONFIRM_DESTINATION: { target: 'selectingClass', guard: 'hasDestination' },
      },
      // Desktop: once B is set (search pick or map drag), fall straight
      // through to the compose anchor — no separate confirm step there.
      always: [{ target: 'selectingClass', guard: and(['hasDestination', 'isDesktopLayout']) }],
    },
    selectingClass: {
      on: {
        // Desktop-only in practice (OrderComposePanel keeps addresses
        // editable in-place) — mobile's ClassPickerSheet never sends this,
        // so it's inert there. Lets dragging the map / re-searching "Куда"
        // update B without leaving the compose view.
        SET_DESTINATION: { actions: assign({ destination: ({ event }) => event.coords }) },
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
        CANCEL_RIDE: { target: 'selectingPickup', actions: 'resetOrder' },
      },
    },
    driverAssigned: {
      on: {
        DRIVER_EN_ROUTE: 'enRoute',
        CANCEL_RIDE: { target: 'selectingPickup', actions: 'resetOrder' },
      },
    },
    enRoute: {
      on: {
        DRIVER_LOCATION_UPDATE: { actions: assign({ driverLocation: ({ event }) => event.coords }) },
        DRIVER_ARRIVED: 'arrived',
        CANCEL_RIDE: { target: 'selectingPickup', actions: 'resetOrder' },
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
      on: { RESET: { target: 'selectingPickup', actions: 'resetOrder' } },
    },
  },
})
