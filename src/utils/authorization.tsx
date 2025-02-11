/* eslint-disable max-classes-per-file */
import React, { ReactNode } from 'react';
import Keycloak, { KeycloakInstance } from 'keycloak-js';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import { setReady, setAuthenticated } from '../features/auth/AuthSlice';
import { connect } from 'react-redux';
import constants from '../constants';


export interface AuthorizationProps {
  url: string,
  realm: string,
  clientId: string
}

class Authorization {

  private static pInstance = new Authorization();
  private keycloak?: KeycloakInstance;
  isReady = false;

  get accessToken(): string | undefined {
    return this.keycloak?.token;
  }

  static get instance() {
    return this.pInstance;
  }

  init = (authProps: AuthorizationProps) => {
    this.keycloak = Keycloak({
      url: authProps.url,
      realm: authProps.realm,
      clientId: authProps.clientId
    });
    this.keycloak.onTokenExpired = () => {
      this.keycloak?.updateToken(60);
    };
    return this.keycloak;
  };

  isAuthenticated = () => this.keycloak?.authenticated === true;

  login = () => {
    const url = new URL(window.location.href);
    const uri = `${url.protocol}//${url.hostname}` + (url.port ? `:${url.port}` : '') + constants.routes.home;
    return this.keycloak!.login({ redirectUri: uri });
  };

  logout = (redirectUri?: string) => {
    let uri = redirectUri;
    if (uri === undefined) {
      const url = new URL(window.location.href);
      uri = `${url.protocol}//${url.hostname}` + (url.port ? `:${url.port}` : '') + constants.routes.home;
    }
    this.keycloak?.logout({ redirectUri: uri });
  };

}

export type AuthorizationProviderProps = {
  children: ReactNode;
  authorizationProps: AuthorizationProps;
  setReady: typeof setReady;
  setAuthenticated: typeof setAuthenticated;
};

export const authorization = Authorization.instance;

const AuthProvider = (props: AuthorizationProviderProps) => {
  const { children, authorizationProps } = props;
  return (
    <ReactKeycloakProvider
      authClient={authorization.init(authorizationProps)}
      onEvent={async (event) => {
        if (event === 'onAuthSuccess') {
          props.setAuthenticated(true);
        }
        if (event === 'onAuthLogout') {
          props.setAuthenticated(false);
        }
        if (event === 'onReady') {
          props.setReady(true);
        }
      }}
    >
      {children}
    </ReactKeycloakProvider>
  );
};

export const AuthorizationProvider = connect(
  () => ({}),
  {
    setReady,
    setAuthenticated
  }
)(AuthProvider);