import { ApiPromise, Keyring } from '@polkadot/api';
import { KeyObject } from 'crypto';
import { HexString } from '@polkadot/util/types';
import WebSocketAsPromised = require('websocket-as-promised');
import { KeyringPair } from '@polkadot/keyring/types';
import { Web3Provider } from '@ethersproject/providers';
import { ethers, Wallet } from 'ethers';
export const teeTypes = {
    WorkerRpcReturnString: {
        vec: 'Bytes',
    },
    WorkerRpcReturnValue: {
        value: 'Bytes',
        do_watch: 'bool',
        status: 'DirectRequestStatus',
    },
    TrustedOperation: {
        _enum: {
            indirect_call: '(TrustedCallSigned)',
            direct_call: '(TrustedCallSigned)',
            get: '(Getter)',
        },
    },
    TrustedCallSigned: {
        call: 'TrustedCall',
        index: 'u32',
        signature: 'MultiSignature',
    },
    Getter: {
        _enum: {
            public: '(PublicGetter)',
            trusted: '(TrustedGetterSigned)',
        },
    },
    PublicGetter: {
        _enum: ['some_value'],
    },
    TrustedGetterSigned: {
        getter: 'TrustedGetter',
        signature: 'MultiSignature',
    },

    /// important
    TrustedGetter: {
        _enum: {
            free_balance: '(AccountId)',
        },
    },
    /// important
    TrustedCall: {
        _enum: {
            balance_set_balance: '(AccountId, AccountId, Balance, Balance)',
            balance_transfer: '(AccountId, AccountId, Balance)',
            balance_unshield: '(AccountId, AccountId, Balance, ShardIdentifier)',
        },
    },
    DirectRequestStatus: {
        _enum: [
            //TODO support TrustedOperationStatus(TrustedOperationStatus)
            'Ok',
            'TrustedOperationStatus',
            'Error',
        ],
    },

    /// identity
    LitentryIdentity: {
        web_type: 'IdentityWebType',
        handle: 'IdentityHandle',
    },
    IdentityWebType: {
        _enum: {
            Web2Identity: 'Web2Network',
            Web3Identity: 'Web3Network',
        },
    },
    Web2Network: {
        _enum: ['Twitter', 'Discord', 'Github'],
    },
    Web3Network: {
        _enum: {
            Substrate: 'SubstrateNetwork',
            Evm: 'EvmNetwork',
        },
    },
    SubstrateNetwork: {
        _enum: ['Polkadot', 'Kusama', 'Litentry', 'Litmus'],
    },
    EvmNetwork: {
        _enum: ['Ethereum', 'BSC'],
    },
    IdentityHandle: {
        _enum: {
            Address32: '[u8;32]',
            Address20: '[u8;20]',
            PlainString: 'Vec<u8>',
        },
    },

    /// Validation Data
    LitentryValidationData: {
        _enum: {
            Web2Validation: 'Web2ValidationData',
            Web3Validation: 'Web3ValidationData',
        },
    },
    Web2ValidationData: {
        _enum: {
            Twitter: 'TwitterValidationData',
            Discord: 'DiscordValidationData',
        },
    },
    TwitterValidationData: {
        tweet_id: 'Vec<u8>',
    },
    DiscordValidationData: {
        channel_id: 'Vec<u8>',
        message_id: 'Vec<u8>',
        guild_id: 'Vec<u8>',
    },
    Web3ValidationData: {
        _enum: {
            Substrate: 'Web3CommonValidationData',
            Evm: 'Web3CommonValidationData',
        },
    },
    Web3CommonValidationData: {
        message: 'Vec<u8>',
        signature: 'IdentityMultiSignature',
    },

    IdentityMultiSignature: {
        _enum: {
            Ed25519: 'ed25519::Signature',
            Sr25519: 'sr25519::Signature',
            Ecdsa: 'ecdsa::Signature',
            Ethereum: 'EthereumSignature',
        },
    },
    EthereumSignature: '([u8; 65])',

    IdentityGenericEvent: {
        who: 'AccountId',
        identity: 'LitentryIdentity',
        id_graph: 'Vec<(LitentryIdentity, IdentityContext)>',
    },
    IdentityContext: {
        metadata: 'Option<Vec<u8>>',
        linking_request_block: 'Option<BlockNumber>',
        verification_request_block: 'Option<BlockNumber>',
        is_verified: 'bool',
    },
};

export type WorkerRpcReturnValue = {
    value: HexString;
    do_watch: boolean;
    status: string;
};

export type WorkerRpcReturnString = {
    vec: string;
};

export type PubicKeyJson = {
    n: Uint8Array;
    e: Uint8Array;
};

export type IntegrationTestContext = {
    tee: WebSocketAsPromised;
    substrate: ApiPromise;
    teeShieldingKey: KeyObject;
    shard: HexString;
    defaultSigner: KeyringPair;
    ethersProvider: Web3Provider;
    //@todo add type
    ethersWallet: any;
};

export class AESOutput {
    ciphertext?: Uint8Array;
    aad?: Uint8Array;
    nonce?: Uint8Array;
}

export type LitentryIdentity = {
    web_type: IdentityWebType;
    handle: IdentityHandle;
};

export type IdentityWebType = {
    Web2Identity?: Web2Network;
    Web3Identity?: Web3Network;
};

export type IdentityHandle = {
    Address32?: HexString;
    Address20?: HexString;
    PlainString?: `0x${string}`;
};

export type LitentryValidationData = {
    Web2Validation?: Web2ValidationData;
    Web3Validation?: Web3ValidationData;
};

export type Web2ValidationData = {
    Twitter?: TwitterValidationData;
    Discord?: DiscordValidationData;
};

export type Web3ValidationData = {
    Substrate?: Web3CommonValidationData;
    Evm?: Web3CommonValidationData;
};

export type Web3CommonValidationData = {
    message: HexString;
    signature: IdentityMultiSignature;
};

export type IdentityMultiSignature = {
    Ethereum?: HexString;
    Ed25519: HexString;
    Sr25519: HexString;
};

export type Ed25519Signature = {
    Ed25519: HexString;
    Sr25519: HexString;
    Ecdsa: HexString;
    Ethereum: EthereumSignature;
};

export type EthereumSignature = HexString;

export type TwitterValidationData = {
    tweet_id: HexString;
};

export type DiscordValidationData = {
    channel_id: HexString;
    message_id: HexString;
    guild_id: HexString;
};

// export type DiscordValidationData = {}

export type Web3Network = {
    Substrate?: SubstrateNetwork;
    Evm?: EvmNetwork;
};

export type Web2Network = 'Twitter' | 'Discord' | 'Github';
export type SubstrateNetwork = 'Polkadot' | 'Kusama' | 'Litentry' | 'Litmus';
export type EvmNetwork = 'Ethereum' | 'BSC';

export type IdentityGenericEvent = {
    who: HexString;
    identity: LitentryIdentity;
    idGraph: [LitentryIdentity, IdentityContext][];
};

export type IdentityContext = {
    metadata?: HexString;
    linking_request_block?: number;
    verification_request_block?: number;
    is_verified: boolean;
};
