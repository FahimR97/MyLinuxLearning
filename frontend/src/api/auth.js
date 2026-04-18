import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';

const POOL_ID = import.meta.env.VITE_COGNITO_POOL_ID || '';
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || '';

let userPool = null;
try {
  if (POOL_ID && CLIENT_ID) {
    userPool = new CognitoUserPool({ UserPoolId: POOL_ID, ClientId: CLIENT_ID });
  }
} catch (e) {
  console.error('Cognito UserPool init failed:', e.message);
}

export function signIn(username, password) {
  if (!userPool) return Promise.reject(new Error('Cognito not configured'));

  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: username, Pool: userPool });
    const authDetails = new AuthenticationDetails({ Username: username, Password: password });

    user.authenticateUser(authDetails, {
      onSuccess: (session) => {
        localStorage.setItem('fll-session', session.getIdToken().getJwtToken());
        resolve(session);
      },
      onFailure: (err) => reject(err),
      newPasswordRequired: (userAttributes) => {
        // First login with temp password — set the real password
        delete userAttributes.email_verified;
        delete userAttributes.phone_number_verified;
        user.completeNewPasswordChallenge(password, userAttributes, {
          onSuccess: (session) => {
            localStorage.setItem('fll-session', session.getIdToken().getJwtToken());
            resolve(session);
          },
          onFailure: (err) => reject(err),
        });
      },
    });
  });
}

export function signOut() {
  const user = userPool?.getCurrentUser();
  if (user) user.signOut();
  localStorage.removeItem('fll-session');
}

export function isAuthenticated() {
  if (!userPool) return !!localStorage.getItem('fll-session');
  const user = userPool.getCurrentUser();
  if (!user) return false;
  return new Promise((resolve) => {
    user.getSession((err, session) => {
      resolve(!err && session?.isValid());
    });
  });
}
