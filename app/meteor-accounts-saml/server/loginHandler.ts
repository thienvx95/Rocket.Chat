import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import { SAMLUtils } from './lib/Utils';
import { SAML } from './lib/SAML';

Accounts.registerLoginHandler('saml', function(loginRequest) {
	if (!loginRequest.saml || !loginRequest.credentialToken) {
		return undefined;
	}

	const loginResult = SAML.retrieveCredential(loginRequest.credentialToken);
	SAMLUtils.log(`RESULT :${ JSON.stringify(loginResult) }`);

	const makeError = (message: string): Record<string, any> => ({
		type: 'saml',
		// @ts-ignore - LoginCancelledError does in fact exist
		error: new Meteor.Error(Accounts.LoginCancelledError.numericError, message),
	});

	if (!loginResult) {
		return makeError('No matching login attempt found');
	}

	if (!loginResult.profile) {
		return makeError('No profile information found');
	}

	try {
		const userObject = SAML.mapProfileToUserObject(loginResult.profile);

		return SAML.insertOrUpdateSAMLUser(userObject);
	} catch (error) {
		console.error(error);
		return {
			type: 'saml',
			error,
		};
	}
});