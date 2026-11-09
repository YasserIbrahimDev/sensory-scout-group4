import { DEMO_ACCOUNT, mockAccountStore } from '../data/mockAccount';

export { DEMO_ACCOUNT };

// Starts the test signed in as the demo account, which has two saved places:
// Emily Fowler Central Library and North Lakes Park.
export function signInAsDemo() {
  mockAccountStore.currentUserId = 'user-1';
}
