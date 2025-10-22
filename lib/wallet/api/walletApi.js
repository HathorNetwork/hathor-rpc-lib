"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _lodash = require("lodash");
var _walletServiceAxios = require("./walletServiceAxios");
var _errors = require("../../errors");
var _bigint = require("../../utils/bigint");
var _walletApi = require("./schemas/walletApi");
/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Api calls for wallet
 *
 * @namespace ApiWallet
 */

const walletApi = {
  async getWalletStatus(wallet) {
    const axios = await (0, _walletServiceAxios.axiosInstance)(wallet, true);
    const response = await axios.get('wallet/status');
    const {
      data
    } = response;
    if (response.status === 200 && data.success) {
      return (0, _bigint.parseSchema)(data, _walletApi.walletStatusResponseSchema);
    }
    throw new _errors.WalletRequestError('Error getting wallet status.');
  },
  async getVersionData(wallet) {
    const axios = await (0, _walletServiceAxios.axiosInstance)(wallet, false);
    const response = await axios.get('version');
    const {
      data
    } = response;
    if (response.status === 200 && data.success) {
      return (0, _bigint.parseSchema)(data.data, _walletApi.fullNodeVersionDataSchema);
    }
    throw new _errors.WalletRequestError('Error getting fullnode data.');
  },
  async createWallet(wallet, xpubkey, xpubkeySignature, authXpubkey, authXpubkeySignature, timestamp, firstAddress = null) {
    const data = {
      xpubkey,
      xpubkeySignature,
      authXpubkey,
      authXpubkeySignature,
      timestamp
    };
    if (firstAddress) {
      data.firstAddress = firstAddress;
    }
    const axios = await (0, _walletServiceAxios.axiosInstance)(wallet, false);
    const response = await axios.post('wallet/init', data);
    if (response.status === 200 && response.data.success) {
      return (0, _bigint.parseSchema)(response.data, _walletApi.walletStatusResponseSchema);
    }
    if (response.status === 400 && response.data.error === 'wallet-already-loaded') {
      // If it was already loaded, we have to check if it's ready
      return (0, _bigint.parseSchema)(response.data, _walletApi.walletStatusResponseSchema);
    }
    throw new _errors.WalletRequestError('Error creating wallet.');
  },
  async getAddresses(wallet, index) {
    const axios = await (0, _walletServiceAxios.axiosInstance)(wallet, true);
    const path = (0, _lodash.isNumber)(index) ? `?index=${index}` : '';
    const url = `wallet/addresses${path}`;
    const response = await axios.get(url);
    if (response.status === 200 && response.data.success === true) {
      return (0, _bigint.parseSchema)(response.data, _walletApi.addressesResponseSchema);
    }
    throw new _errors.WalletRequestError('Error getting wallet addresses.');
  },
  async getAddressDetails(wallet, address) {
    const axios = await (0, _walletServiceAxios.axiosInstance)(wallet, true);
    const path = `?address=${address}`;
    const url = `wallet/address/info${path}`;
    const response = await axios.get(url);
    if (response.status === 200 && response.data.success === true) {
      return (0, _bigint.parseSchema)(response.data, _walletApi.addressDetailsResponseSchema);
    }
    throw new _errors.WalletRequestError('Error getting address info.');
  },
  async checkAddressesMine(wallet, addresses) {
    const axios = await (0, _walletServiceAxios.axiosInstance)(wallet, true);
    const response = await axios.post('wallet/addresses/check_mine', {
      addresses
    });
    if (response.status === 200 && response.data.success === true) {
      return (0, _bigint.parseSchema)(response.data, _walletApi.checkAddressesMineResponseSchema);
    }
    throw new _errors.WalletRequestError('Error checking wallet addresses.');
  },
  async getNewAddresses(wallet) {
    const axios = await (0, _walletServiceAxios.axiosInstance)(wallet, true);
    const response = await axios.get('wallet/addresses/new');
    if (response.status === 200 && response.data.success === true) {
      return (0, _bigint.parseSchema)(response.data, _walletApi.newAddressesResponseSchema);
    }
    throw new _errors.WalletRequestError('Error getting wallet addresses to use.');
  },
  async getTokenDetails(wallet, tokenId) {
    const axios = await (0, _walletServiceAxios.axiosInstance)(wallet, true);
    const response = await axios.get(`wallet/tokens/${tokenId}/details`);
    if (response.status === 200 && response.data.success === true) {
      return (0, _bigint.parseSchema)(response.data, _walletApi.tokenDetailsResponseSchema);
    }
    throw new _errors.WalletRequestError('Error getting token details.');
  },
  async getBalances(wallet, token = null) {
    const data = {
      params: {}
    };
    if (token) {
      data.params.token_id = token;
    }
    const axios = await (0, _walletServiceAxios.axiosInstance)(wallet, true);
    const response = await axios.get('wallet/balances', data);
    if (response.status === 200 && response.data.success === true) {
      return (0, _bigint.parseSchema)(response.data, _walletApi.balanceResponseSchema);
    }
    throw new _errors.WalletRequestError('Error getting wallet balance.');
  },
  async getTokens(wallet) {
    const axios = await (0, _walletServiceAxios.axiosInstance)(wallet, true);
    const response = await axios.get('wallet/tokens');
    if (response.status === 200 && response.data.success === true) {
      return (0, _bigint.parseSchema)(response.data, _walletApi.tokensResponseSchema);
    }
    throw new _errors.WalletRequestError('Error getting list of tokens.');
  },
  async getHistory(wallet, options = {}) {
    const data = {
      params: options
    };
    const axios = await (0, _walletServiceAxios.axiosInstance)(wallet, true);
    const response = await axios.get('wallet/history', data);
    if (response.status === 200 && response.data.success === true) {
      return (0, _bigint.parseSchema)(response.data, _walletApi.historyResponseSchema);
    }
    throw new _errors.WalletRequestError('Error getting wallet history.');
  },
  async getTxOutputs(wallet, options = {}) {
    const data = {
      params: options
    };
    const axios = await (0, _walletServiceAxios.axiosInstance)(wallet, true);
    const response = await axios.get('wallet/tx_outputs', data);
    if (response.status === 200 && response.data.success === true) {
      return (0, _bigint.parseSchema)(response.data, _walletApi.txOutputResponseSchema);
    }
    throw new _errors.WalletRequestError('Error requesting utxo.');
  },
  async createTxProposal(wallet, txHex) {
    const data = {
      txHex
    };
    const axios = await (0, _walletServiceAxios.axiosInstance)(wallet, true);
    const response = await axios.post('tx/proposal', data);
    if (response.status === 201) {
      return (0, _bigint.parseSchema)(response.data, _walletApi.txProposalCreateResponseSchema);
    }
    throw new _errors.WalletRequestError('Error creating tx proposal.');
  },
  async updateTxProposal(wallet, id, txHex) {
    const data = {
      txHex
    };
    const axios = await (0, _walletServiceAxios.axiosInstance)(wallet, true);
    const response = await axios.put(`tx/proposal/${id}`, data);
    if (response.status === 200) {
      return (0, _bigint.parseSchema)(response.data, _walletApi.txProposalUpdateResponseSchema);
    }
    throw new _errors.WalletRequestError('Error sending tx proposal.');
  },
  async deleteTxProposal(wallet, id) {
    const axios = await (0, _walletServiceAxios.axiosInstance)(wallet, true);
    const response = await axios.delete(`tx/proposal/${id}`);
    if (response.status === 200) {
      return (0, _bigint.parseSchema)(response.data, _walletApi.txProposalUpdateResponseSchema);
    }
    throw new _errors.WalletRequestError('Error deleting tx proposal.');
  },
  async createAuthToken(wallet, timestamp, xpub, sign) {
    const data = {
      ts: timestamp,
      xpub,
      sign,
      walletId: wallet.walletId
    };
    const axios = await (0, _walletServiceAxios.axiosInstance)(wallet, false);
    const response = await axios.post('auth/token', data);
    if (response.status === 200 && response.data.success === true) {
      return (0, _bigint.parseSchema)(response.data, _walletApi.authTokenResponseSchema);
    }
    throw new _errors.WalletRequestError('Error requesting auth token.');
  },
  async getTxById(wallet, txId) {
    const axios = await (0, _walletServiceAxios.axiosInstance)(wallet, true);
    const response = await axios.get(`wallet/transactions/${txId}`);
    if (response.status === 200 && response.data) {
      if (!response.data.success) {
        walletApi._txNotFoundGuard(response.data);
        throw new _errors.WalletRequestError('Error getting transaction by its id.', {
          cause: response.data
        });
      }
      return (0, _bigint.parseSchema)(response.data, _walletApi.txByIdResponseSchema);
    }
    throw new _errors.WalletRequestError('Error getting transaction by its id.', {
      cause: response.data
    });
  },
  _txNotFoundGuard(data) {
    const message = (0, _lodash.get)(data, 'message', '');
    if (message === 'Transaction not found') {
      throw new _errors.TxNotFoundError();
    }
  },
  async getFullTxById(wallet, txId) {
    const axios = await (0, _walletServiceAxios.axiosInstance)(wallet, true);
    const response = await axios.get(`wallet/proxy/transactions/${txId}`);
    if (response.status === 200 && response.data.success) {
      return (0, _bigint.parseSchema)(response.data, _walletApi.fullNodeTxResponseSchema);
    }
    walletApi._txNotFoundGuard(response.data);
    throw new _errors.WalletRequestError('Error getting transaction by its id from the proxied fullnode.', {
      cause: response.data
    });
  },
  async getTxConfirmationData(wallet, txId) {
    const axios = await (0, _walletServiceAxios.axiosInstance)(wallet, true);
    const response = await axios.get(`wallet/proxy/transactions/${txId}/confirmation_data`);
    if (response.status === 200 && response.data.success) {
      return (0, _bigint.parseSchema)(response.data, _walletApi.fullNodeTxConfirmationDataResponseSchema);
    }
    walletApi._txNotFoundGuard(response.data);
    throw new _errors.WalletRequestError('Error getting transaction confirmation data by its id from the proxied fullnode.', {
      cause: response.data
    });
  },
  async graphvizNeighborsQuery(wallet, txId, graphType, maxLevel) {
    const axios = await (0, _walletServiceAxios.axiosInstance)(wallet, true);
    const response = await axios.get(`wallet/proxy/graphviz/neighbours?txId=${txId}&graphType=${graphType}&maxLevel=${maxLevel}`);
    if (response.status === 200) {
      // The service might answer a status code 200 but output an error message like
      // { success: false, message: '...' }, we need to handle it.
      //
      // We also need to check if `success` is a key to the object since this API will return
      // a string on success.
      if (Object.hasOwnProperty.call(response.data, 'success') && !response.data.success) {
        walletApi._txNotFoundGuard(response.data);
        throw new _errors.WalletRequestError(`Error getting neighbors data for ${txId} from the proxied fullnode.`, {
          cause: response.data.message
        });
      }
      return response.data;
    }
    throw new _errors.WalletRequestError(`Error getting neighbors data for ${txId} from the proxied fullnode.`, {
      cause: response.data
    });
  }
};
var _default = exports.default = walletApi;