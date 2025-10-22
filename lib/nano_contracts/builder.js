"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _lodash = require("lodash");
var _address = require("../utils/address");
var _tokens = _interopRequireDefault(require("../utils/tokens"));
var _transaction = _interopRequireDefault(require("../utils/transaction"));
var _constants = require("../constants");
var _errors = require("../errors");
var _types = require("./types");
var _utils = require("./utils");
var _header = _interopRequireDefault(require("./header"));
var _leb = _interopRequireDefault(require("../utils/leb128"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } /**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
class NanoContractTransactionBuilder {
  constructor() {
    _defineProperty(this, "blueprintId", void 0);
    // nano contract ID, null if initialize
    _defineProperty(this, "ncId", void 0);
    _defineProperty(this, "method", void 0);
    _defineProperty(this, "actions", void 0);
    _defineProperty(this, "caller", void 0);
    _defineProperty(this, "args", void 0);
    _defineProperty(this, "parsedArgs", void 0);
    _defineProperty(this, "serializedArgs", void 0);
    _defineProperty(this, "wallet", void 0);
    // So far we support Transaction or CreateTokenTransaction
    _defineProperty(this, "vertexType", void 0);
    // In case of a CreateTokenTransaction, these are the options
    // for the tx creation used by the tokens utils method
    _defineProperty(this, "createTokenOptions", void 0);
    // This parameter is used for token creation transactions
    // and indicates if the token deposit utxo was already added
    // in the action deposit phase
    _defineProperty(this, "tokenFeeAddedInDeposit", void 0);
    this.blueprintId = null;
    this.ncId = null;
    this.method = null;
    this.actions = null;
    this.caller = null;
    this.args = null;
    this.parsedArgs = null;
    this.serializedArgs = null;
    this.wallet = null;
    this.vertexType = null;
    this.createTokenOptions = null;
    this.tokenFeeAddedInDeposit = false;
  }

  /**
   * Set object method attribute
   *
   * @param method Method name
   *
   * @memberof NanoContractTransactionBuilder
   * @inner
   */
  setMethod(method) {
    this.method = method;
    return this;
  }

  /**
   * Set object actions attribute
   *
   * @param actions List of actions
   *
   * @memberof NanoContractTransactionBuilder
   * @inner
   */
  setActions(actions) {
    if (!actions) {
      return this;
    }
    const parseResult = _types.INanoContractActionSchema.array().safeParse(actions);
    if (!parseResult.success) {
      throw new _errors.NanoContractTransactionError(`Invalid actions. Error: ${parseResult.error.message}.`);
    }
    this.actions = parseResult.data;
    return this;
  }

  /**
   * Set object args attribute
   *
   * @param args List of arguments
   *
   * @memberof NanoContractTransactionBuilder
   * @inner
   */
  setArgs(args) {
    this.args = args ?? [];
    return this;
  }

  /**
   * Set object caller attribute
   *
   * @param caller Caller address
   *
   * @memberof NanoContractTransactionBuilder
   * @inner
   */
  setCaller(caller) {
    this.caller = caller;
    return this;
  }

  /**
   * Set object blueprintId attribute
   *
   * @param blueprintId Blueprint id
   *
   * @memberof NanoContractTransactionBuilder
   * @inner
   */
  setBlueprintId(blueprintId) {
    this.blueprintId = blueprintId;
    return this;
  }

  /**
   * Set object ncId attribute
   *
   * @param {ncId} Nano contract id
   *
   * @memberof NanoContractTransactionBuilder
   * @inner
   */
  setNcId(ncId) {
    this.ncId = ncId;
    return this;
  }

  /**
   * Set object wallet attribute
   *
   * @param {wallet} Wallet object building this transaction
   *
   * @memberof NanoContractTransactionBuilder
   * @inner
   */
  setWallet(wallet) {
    this.wallet = wallet;
    return this;
  }

  /**
   * Set vertex type
   *
   * @param {vertexType} The vertex type
   * @param {createTokenOptions} Options for the token creation tx
   *
   * @memberof NanoContractTransactionBuilder
   * @inner
   */
  setVertexType(vertexType, createTokenOptions = null) {
    this.vertexType = vertexType;
    this.createTokenOptions = createTokenOptions;
    return this;
  }

  /**
   * Execute a deposit action
   * Create inputs (and maybe change outputs) to complete the deposit
   *
   * @param {action} Action to be completed (must be a deposit type)
   *
   * @memberof NanoContractTransactionBuilder
   * @inner
   */
  async executeDeposit(action) {
    if (action.type !== _types.NanoContractActionType.DEPOSIT) {
      throw new _errors.NanoContractTransactionError("Can't execute a deposit with an action which type is different than deposit.");
    }
    if (!action.amount || !action.token) {
      throw new _errors.NanoContractTransactionError('Amount and token are required for deposit action.');
    }
    const changeAddressParam = action.changeAddress;
    if (changeAddressParam && !(await this.wallet.isAddressMine(changeAddressParam))) {
      throw new _errors.NanoContractTransactionError('Change address must belong to the same wallet.');
    }
    let {
      amount
    } = action;
    if (action.token === _constants.NATIVE_TOKEN_UID && this.vertexType === _types.NanoContractVertexType.CREATE_TOKEN_TRANSACTION && !this.createTokenOptions.contractPaysTokenDeposit) {
      // We will query for HTR utxos to fill the deposit action
      // and this is a transaction that creates a token and the contract
      // won't pay for the deposit fee, so we also add in this utxo query
      // the token deposit fee and data output fee
      const dataArray = this.createTokenOptions.data ?? [];
      const htrToCreateToken = _tokens.default.getTransactionHTRDeposit(this.createTokenOptions.amount, dataArray.length, this.wallet.storage);
      amount += htrToCreateToken;
      this.tokenFeeAddedInDeposit = true;
    }

    // Get the utxos with the amount of the deposit and create the inputs
    const utxoOptions = {
      token: action.token
    };
    if (action.address) {
      utxoOptions.filter_address = action.address;
    }
    let utxosData;
    try {
      utxosData = await this.wallet.getUtxosForAmount(amount, utxoOptions);
    } catch (e) {
      if (e instanceof _errors.UtxoError) {
        throw new _errors.NanoContractTransactionError('Not enough utxos to execute the deposit.');
      }
      throw e;
    }
    const inputs = [];
    for (const utxo of utxosData.utxos) {
      await this.wallet.markUtxoSelected(utxo.txId, utxo.index, true);
      inputs.push({
        txId: utxo.txId,
        index: utxo.index,
        value: utxo.value,
        authorities: utxo.authorities,
        token: utxo.tokenId,
        address: utxo.address
      });
    }
    const outputs = [];
    // If there's a change amount left in the utxos, create the change output
    if (utxosData.changeAmount) {
      const changeAddressStr = changeAddressParam || (await this.wallet.getCurrentAddress()).address;
      outputs.push({
        type: (0, _address.getAddressType)(changeAddressStr, this.wallet.getNetworkObject()),
        address: changeAddressStr,
        value: utxosData.changeAmount,
        timelock: null,
        token: action.token,
        authorities: 0n,
        isChange: true
      });
    }
    return {
      inputs,
      outputs
    };
  }

  /**
   * Execute a withdrawal action
   * Create outputs to complete the withdrawal
   * If the transaction is a token creation and
   * the contract will pay for the deposit fee,
   * then creates the output only of the difference
   *
   * @param {action} Action to be completed (must be a withdrawal type)
   *
   * @memberof NanoContractTransactionBuilder
   * @inner
   */
  executeWithdrawal(action) {
    if (action.type !== _types.NanoContractActionType.WITHDRAWAL) {
      throw new _errors.NanoContractTransactionError("Can't execute a withdrawal with an action which type is different than withdrawal.");
    }
    if (!action.amount || !action.token) {
      throw new _errors.NanoContractTransactionError('Amount and token are required for withdrawal action.');
    }

    // If it's a token creation creation tx and the contract is paying the deposit fee, then
    // we must reduce the amount created for the output from the total action amount
    let withdrawalAmount = action.amount;
    if (this.vertexType === _types.NanoContractVertexType.CREATE_TOKEN_TRANSACTION) {
      if (this.createTokenOptions === null) {
        throw new _errors.NanoContractTransactionError('For a token creation transaction we must have the options defined.');
      }

      // We pay the deposit in native token uid
      if (this.createTokenOptions.contractPaysTokenDeposit && action.token === _constants.NATIVE_TOKEN_UID) {
        const dataArray = this.createTokenOptions.data ?? [];
        const htrToCreateToken = _tokens.default.getTransactionHTRDeposit(this.createTokenOptions.amount, dataArray.length, this.wallet.storage);
        withdrawalAmount -= htrToCreateToken;
      }
    }
    if (withdrawalAmount === 0n) {
      // The whole withdrawal amount was used to pay deposit token fee
      return null;
    }
    if (!action.address) {
      throw new _errors.NanoContractTransactionError('Address is required for withdrawal action that creates outputs.');
    }

    // Create the output with the withdrawal address and amount
    return {
      type: (0, _address.getAddressType)(action.address, this.wallet.getNetworkObject()),
      address: action.address,
      value: withdrawalAmount,
      timelock: null,
      token: action.token,
      authorities: 0n
    };
  }

  /**
   * Execute a grant authority action
   * Create inputs (and maybe change output) to complete the action
   *
   * @param {action} Action to be completed (must be a grant authority type)
   *
   * @memberof NanoContractTransactionBuilder
   * @inner
   */
  async executeGrantAuthority(action) {
    if (action.type !== _types.NanoContractActionType.GRANT_AUTHORITY) {
      throw new _errors.NanoContractTransactionError("Can't execute a grant authority with an action which type is different than grant authority.");
    }
    if (!action.authority || !action.token) {
      throw new _errors.NanoContractTransactionError('Authority and token are required for grant authority action.');
    }
    const authorityAddressParam = action.authorityAddress;
    if (authorityAddressParam && !(await this.wallet.isAddressMine(authorityAddressParam))) {
      throw new _errors.NanoContractTransactionError('Authority address must belong to the same wallet.');
    }

    // Get the utxos with the authority of the action and create the input
    const utxos = await this.wallet.getAuthorityUtxo(action.token, action.authority, {
      many: false,
      only_available_utxos: true,
      filter_address: action.address
    });
    if (!utxos || utxos.length === 0) {
      throw new _errors.NanoContractTransactionError('Not enough authority utxos to execute the grant authority.');
    }
    const inputs = [];
    // The method gets only one utxo
    const utxo = utxos[0];
    await this.wallet.markUtxoSelected(utxo.txId, utxo.index, true);
    inputs.push({
      txId: utxo.txId,
      index: utxo.index,
      value: utxo.value,
      authorities: utxo.authorities,
      token: utxo.token,
      address: utxo.address
    });
    const outputs = [];
    // If there's the authorityAddress param, then we must create another authority output for this address
    if (action.authorityAddress) {
      outputs.push({
        type: (0, _address.getAddressType)(action.authorityAddress, this.wallet.getNetworkObject()),
        address: action.authorityAddress,
        value: action.authority === 'mint' ? _constants.TOKEN_MINT_MASK : _constants.TOKEN_MELT_MASK,
        timelock: null,
        token: action.token,
        authorities: action.authority === 'mint' ? _constants.TOKEN_MINT_MASK : _constants.TOKEN_MELT_MASK
      });
    }
    return {
      inputs,
      outputs
    };
  }

  /**
   * Execute an acquire authority action
   *
   * @param {action} Action to be completed (must be an acquire authority type)
   *
   * @memberof NanoContractTransactionBuilder
   * @inner
   */
  executeAcquireAuthority(action) {
    if (action.type !== _types.NanoContractActionType.ACQUIRE_AUTHORITY) {
      throw new _errors.NanoContractTransactionError("Can't execute an acquire authority with an action which type is different than acquire authority.");
    }
    if (!action.address || !action.authority || !action.token) {
      throw new _errors.NanoContractTransactionError('Address, authority, and token are required for acquire authority action.');
    }

    // Create the output with the authority of the action
    return {
      type: (0, _address.getAddressType)(action.address, this.wallet.getNetworkObject()),
      address: action.address,
      value: action.authority === 'mint' ? _constants.TOKEN_MINT_MASK : _constants.TOKEN_MELT_MASK,
      timelock: null,
      token: action.token,
      authorities: action.authority === 'mint' ? _constants.TOKEN_MINT_MASK : _constants.TOKEN_MELT_MASK
    };
  }

  /**
   * Verify if the builder attributes are valid for the nano build
   *
   * @throws {NanoContractTransactionError} In case the attributes are not valid
   *
   * @memberof NanoContractTransactionBuilder
   * @inner
   */
  async verify() {
    if (this.method === _constants.NANO_CONTRACTS_INITIALIZE_METHOD && !this.blueprintId) {
      // Initialize needs the blueprint ID
      throw new _errors.NanoContractTransactionError('Missing blueprint id. Parameter blueprintId in data');
    }
    if (this.method !== _constants.NANO_CONTRACTS_INITIALIZE_METHOD) {
      // Get the blueprint id from the nano transaction in the full node
      if (!this.ncId) {
        throw new _errors.NanoContractTransactionError(`Nano contract ID cannot be null for method ${this.method}`);
      }
      let response;
      try {
        response = await this.wallet.getFullTxById(this.ncId);
      } catch {
        // Error getting nano contract transaction data from the full node
        throw new _errors.NanoContractTransactionError(`Error getting nano contract transaction data with id ${this.ncId} from the full node`);
      }
      if (!response.tx.nc_id) {
        throw new _errors.NanoContractTransactionError(`Transaction with id ${this.ncId} is not a nano contract transaction.`);
      }
      this.blueprintId = response.tx.nc_blueprint_id;
    }
    if (!this.blueprintId || !this.method || !this.caller) {
      throw new _errors.NanoContractTransactionError('Must have blueprint id, method and caller.');
    }
    try {
      this.caller.validateAddress();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not validate caller address';
      throw new _errors.NanoContractTransactionError(message);
    }

    // Validate if the arguments match the expected method arguments
    this.parsedArgs = await (0, _utils.validateAndParseBlueprintMethodArgs)(this.blueprintId, this.method, this.args, this.wallet.getNetworkObject());
  }

  /**
   * Serialize nano arguments in an array of Buffer
   * and store the serialized data in this.serializedArgs
   *
   * @throws {NanoContractTransactionError} In case the arguments are not valid
   *
   * @memberof NanoContractTransactionBuilder
   * @inner
   */
  async serializeArgs() {
    if (!this.parsedArgs) {
      throw new _errors.NanoContractTransactionError('Arguments should be parsed and validated before serialization.');
    }
    const serializedArray = [_leb.default.encodeUnsigned(this.parsedArgs?.length ?? 0)];
    if (this.args) {
      for (const arg of this.parsedArgs) {
        serializedArray.push(arg.field.toBuffer());
      }
    }
    this.serializedArgs = Buffer.concat(serializedArray);
  }

  /**
   * Build inputs and outputs from nano actions
   *
   * @throws {Error} If a nano action type is invalid
   *
   * @memberof NanoContractTransactionBuilder
   * @inner
   */
  async buildInputsOutputs() {
    let inputs = [];
    let outputs = [];
    let tokens = [];
    if (this.actions) {
      const tokenSet = new Set();
      for (const action of this.actions) {
        // Get token list
        if (action.token !== _constants.NATIVE_TOKEN_UID) {
          tokenSet.add(action.token);
        }
      }
      tokens = Array.from(tokenSet);
      for (const action of this.actions) {
        // Call action
        switch (action.type) {
          case _types.NanoContractActionType.DEPOSIT:
            {
              const {
                inputs: depositInputs,
                outputs: depositOutputs
              } = await this.executeDeposit(action);
              inputs = (0, _lodash.concat)(inputs, depositInputs);
              outputs = (0, _lodash.concat)(outputs, depositOutputs);
              break;
            }
          case _types.NanoContractActionType.WITHDRAWAL:
            {
              const outputWithdrawal = this.executeWithdrawal(action);
              if (outputWithdrawal) {
                outputs = (0, _lodash.concat)(outputs, outputWithdrawal);
              }
              break;
            }
          case _types.NanoContractActionType.GRANT_AUTHORITY:
            {
              const {
                inputs: grantInputs,
                outputs: grantOutputs
              } = await this.executeGrantAuthority(action);
              inputs = (0, _lodash.concat)(inputs, grantInputs);
              outputs = (0, _lodash.concat)(outputs, grantOutputs);
              break;
            }
          case _types.NanoContractActionType.ACQUIRE_AUTHORITY:
            {
              const outputAcquire = this.executeAcquireAuthority(action);
              if (outputAcquire) {
                outputs = (0, _lodash.concat)(outputs, outputAcquire);
              }
              break;
            }
          default:
            throw new Error('Invalid type for nano contract action.');
        }
      }
    }
    return {
      inputs,
      outputs,
      tokens
    };
  }

  /**
   * Build a transaction object from the built inputs/outputs/tokens
   *
   * It will create a Transaction or CreateTokenTransaction, depending on the vertex type
   *
   * @throws {NanoContractTransactionError} In case the create token options is null
   *
   * @memberof NanoContractTransactionBuilder
   * @inner
   */
  async buildTransaction(inputs, outputs, tokens) {
    if (this.vertexType === _types.NanoContractVertexType.TRANSACTION) {
      return _transaction.default.createTransactionFromData({
        version: _constants.DEFAULT_TX_VERSION,
        inputs,
        outputs,
        tokens
      }, this.wallet.getNetworkObject());
    }
    if (this.vertexType === _types.NanoContractVertexType.CREATE_TOKEN_TRANSACTION) {
      if (this.createTokenOptions === null) {
        throw new _errors.NanoContractTransactionError('Create token options cannot be null when creating a create token transaction.');
      }

      // It's a token creation transaction
      // then we get the token creation data from the utils method
      // and concatenate the nano actions inputs/outputs/tokens
      const data = await _tokens.default.prepareCreateTokenData(this.createTokenOptions.mintAddress, this.createTokenOptions.name, this.createTokenOptions.symbol, this.createTokenOptions.amount, this.wallet.storage, {
        changeAddress: this.createTokenOptions.changeAddress,
        createMint: this.createTokenOptions.createMint,
        mintAuthorityAddress: this.createTokenOptions.mintAuthorityAddress,
        createMelt: this.createTokenOptions.createMelt,
        meltAuthorityAddress: this.createTokenOptions.meltAuthorityAddress,
        data: this.createTokenOptions.data,
        isCreateNFT: this.createTokenOptions.isCreateNFT,
        skipDepositFee: this.createTokenOptions.contractPaysTokenDeposit || this.tokenFeeAddedInDeposit
      });
      data.inputs = (0, _lodash.concat)(data.inputs, inputs);
      data.outputs = (0, _lodash.concat)(data.outputs, outputs);
      data.tokens = (0, _lodash.uniq)((0, _lodash.concat)(data.tokens, tokens));
      return _transaction.default.createTransactionFromData(data, this.wallet.getNetworkObject());
    }
    throw new _errors.NanoContractTransactionError('Invalid vertex type.');
  }

  /**
   * Build a full transaction with nano headers from nano contract data
   *
   * @throws {NanoContractTransactionError} In case the arguments to build the tx are invalid
   *
   * @memberof NanoContractTransactionBuilder
   * @inner
   */
  async build() {
    let inputs;
    let outputs;
    let tokens;
    try {
      await this.verify();

      // Transform actions into inputs and outputs
      ({
        inputs,
        outputs,
        tokens
      } = await this.buildInputsOutputs());

      // Serialize the method arguments
      await this.serializeArgs();
      const ncId = this.method === _constants.NANO_CONTRACTS_INITIALIZE_METHOD ? this.blueprintId : this.ncId;
      if (ncId == null) {
        // This was validated in the beginning of the method but the linter was complaining about it
        throw new Error('This should never happen.');
      }
      const tx = await this.buildTransaction(inputs, outputs, tokens);
      const seqnum = await this.wallet.getNanoHeaderSeqnum(this.caller);
      let nanoHeaderActions = [];
      if (this.actions) {
        nanoHeaderActions = this.actions.map(action => {
          return (0, _utils.mapActionToActionHeader)(action, tokens);
        });
      }
      const nanoHeader = new _header.default(ncId, this.method, this.serializedArgs, nanoHeaderActions, seqnum, this.caller, null);
      tx.headers.push(nanoHeader);
      return tx;
    } catch (e) {
      if (!inputs) {
        throw e;
      }
      for (const input of inputs) {
        await this.wallet.markUtxoSelected(input.txId, input.index, false);
      }
      throw e;
    }
  }
}
var _default = exports.default = NanoContractTransactionBuilder;