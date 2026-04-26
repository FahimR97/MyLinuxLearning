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

// Returns a valid ID token, auto-refreshing if expired
export function getToken() {
  if (!userPool) return Promise.resolve(localStorage.getItem('fll-session'));
  const user = userPool.getCurrentUser();
  if (!user) return Promise.resolve(null);
  return new Promise((resolve) => {
    user.getSession((err, session) => {
      if (err || !session?.isValid()) {
        resolve(null);
      } else {
        const token = session.getIdToken().getJwtToken();
        localStorage.setItem('fll-session', token);
        resolve(token);
      }
    });
  });
}

export function signOut() {
  const user = userPool?.getCurrentUser();
  if (user) user.signOut();
  localStorage.removeItem('fll-session');
  localStorage.removeItem('linux-learning-progress');
  localStorage.removeItem('fll-scenario-progress');
  localStorage.removeItem('fll-quiz-review-flags');
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
