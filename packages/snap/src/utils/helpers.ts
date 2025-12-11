/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RPC_RESTRICTIONS } from '../constants';

/*
 * Check if the method requested is allowed for the origin requesting
 */
export const isRequestAllowed = (method: string, origin: string): boolean => {
  if (method in RPC_RESTRICTIONS) {
    return RPC_RESTRICTIONS[method].includes(origin);
  }

  return true;
}
