import { SismoConnect as SismoConnectServer, AuthType as AuthTypeServer } from "@sismo-core/sismo-connect-server";

import { SismoConnect as SismoConnectClient, AuthType as AuthTypeClient } from "@sismo-core/sismo-connect-client";

import { ungzip } from 'pako'
import { toUint8Array } from 'js-base64'

const unCompressResponse = (data) => ungzip(toUint8Array(data), { to: 'string' });

const getSismoLink = (clientId, callbackPath) => {
    const sismoConnectConfig = {
        appId: clientId,
    };

    const sismoConnect = SismoConnectClient(sismoConnectConfig);

    const AUTH = { 
          authType: AuthTypeClient.VAULT,
    };

    return sismoConnect.getRequestLink({ auth: AuthTypeClient, callbackPath });
}

const getSismoAccountId = async (clientId, sismoConnectResponseCompressed) => {
    const uncompressedResponse = JSON.parse(unCompressResponse(sismoConnectResponseCompressed));

    const sismoConnect = SismoConnectServer({ appId: clientId });

    const AUTH = { authType: AuthTypeServer.VAULT };

    const verificationResult = await sismoConnect.verify(
      uncompressedResponse,
      {
        auths: [AUTH],
      }
    );

    return verificationResult.getUserId(AuthTypeServer.VAULT);
}

export {
    getSismoLink,
    getSismoAccountId
};